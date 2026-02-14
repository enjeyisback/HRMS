import { createClient } from "@/lib/supabase/client"
import { startOfMonth, endOfMonth, differenceInDays, eachDayOfInterval, isWeekend, isSameDay } from "date-fns"
import { calculatePF, calculateESIC, calculatePT } from "./payroll-utils"

export interface PayrollCalculationResult {
    employeeId: string
    employeeName: string
    employeeCode: string
    departmentName: string
    monthlyGross: number
    workingDays: number
    presentDays: number
    paidLeaveDays: number
    unpaidLeaveDays: number
    lopDays: number
    perDaySalary: number
    actualGross: number
    earnings: { name: string, amount: number }[]
    deductions: { name: string, amount: number }[]
    totalEarnings: number
    totalDeductions: number
    netPayable: number
    statutoryBreakdown: {
        pf: number
        esic: number
        pt: number
    }
}

export async function calculateMonthlyPayroll(
    month: number,
    year: number,
    departmentId?: string
): Promise<PayrollCalculationResult[]> {
    const supabase = createClient()
    const startDate = startOfMonth(new Date(year, month - 1))
    const endDate = endOfMonth(new Date(year, month - 1))

    // 1. Get working days (excluding weekends for this example, or fetch from a holiday/calendar table if it existed)
    const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate })
    const workingDaysCount = daysInMonth.filter(day => !isWeekend(day)).length

    // 2. Fetch Employees and their Salary Assignments
    let query = supabase
        .from('employees')
        .select(`
            id,
            first_name,
            last_name,
            employee_code,
            departments(name),
            salary_assignments(
                id,
                gross_salary,
                salary_assignment_components(
                    amount,
                    salary_components(*)
                )
            )
        `)
        .eq('is_active', true)

    if (departmentId && departmentId !== 'all') {
        query = query.eq('department_id', departmentId)
    }

    const { data: employees, error: empError } = await query
    if (empError) throw empError

    // 3. Fetch Attendance and Leaves for the month
    const { data: attendanceData } = await supabase
        .from('attendance')
        .select('employee_id, date, status')
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString())

    const { data: leaveData } = await supabase
        .from('leave_requests')
        .select('employee_id, start_date, end_date, leave_types(is_paid)')
        .eq('status', 'Approved')
        .or(`start_date.lte.${endDate.toISOString()},end_date.gte.${startDate.toISOString()}`)

    const results: PayrollCalculationResult[] = []

    for (const emp of employees) {
        const assignment = emp.salary_assignments?.[0]
        if (!assignment) continue

        const empAttendance = attendanceData?.filter(a => a.employee_id === emp.id) || []
        const empLeaves = leaveData?.filter(l => l.employee_id === emp.id) || []

        // Calculate days
        const presentDays = empAttendance.filter(a => a.status === 'Present').length

        let paidLeaveDays = 0
        let unpaidLeaveDays = 0

        empLeaves.forEach(leave => {
            const lStart = new Date(leave.start_date)
            const lEnd = new Date(leave.end_date)
            const overlapDays = daysInMonth.filter(day =>
                day >= lStart && day <= lEnd && !isWeekend(day)
            ).length

            if ((leave as any).leave_types?.is_paid) {
                paidLeaveDays += overlapDays
            } else {
                unpaidLeaveDays += overlapDays
            }
        })

        const totalPayableDays = presentDays + paidLeaveDays
        const lopDays = Math.max(0, workingDaysCount - totalPayableDays)

        const monthlyGross = assignment.gross_salary
        const perDaySalary = monthlyGross / workingDaysCount
        const actualGross = perDaySalary * totalPayableDays

        // Component breakdown
        const earnings: { name: string, amount: number }[] = []
        const deductions: { name: string, amount: number }[] = []

        // Find Basic for statutory calculations
        const basicComponent = (assignment as any).salary_assignment_components.find(
            (c: any) => c.salary_components.name.toLowerCase() === 'basic'
        )
        const basicAmount = basicComponent ? (basicComponent.amount * (totalPayableDays / workingDaysCount)) : 0

        let totalEarnings = 0
        let totalDeductions = 0

            // Map components scaled to present days
            (assignment as any).salary_assignment_components.forEach((ac: any) => {
                const comp = ac.salary_components
                const scaledAmount = ac.amount * (totalPayableDays / workingDaysCount)

                if (comp.type === 'Earning') {
                    earnings.push({ name: comp.name, amount: scaledAmount })
                    totalEarnings += scaledAmount
                } else if (comp.type === 'Deduction' && !comp.is_statutory) {
                    deductions.push({ name: comp.name, amount: ac.amount }) // Most non-statutory deductions like Professional Tax or specific recovery are fixed
                    totalDeductions += ac.amount
                }
            })

        // Statutory
        const pf = calculatePF(basicAmount)
        const esic = calculateESIC(totalEarnings)
        const pt = calculatePT(totalEarnings)

        deductions.push({ name: 'Provident Fund (PF)', amount: pf })
        deductions.push({ name: 'ESIC', amount: esic })
        deductions.push({ name: 'Professional Tax (PT)', amount: pt })

        totalDeductions += (pf + esic + pt)

        results.push({
            employeeId: emp.id,
            employeeName: `${emp.first_name} ${emp.last_name}`,
            employeeCode: emp.employee_code,
            departmentName: (emp as any).departments?.name || "N/A",
            monthlyGross,
            workingDays: workingDaysCount,
            presentDays,
            paidLeaveDays,
            unpaidLeaveDays,
            lopDays,
            perDaySalary,
            actualGross: totalEarnings,
            earnings,
            deductions,
            totalEarnings,
            totalDeductions,
            netPayable: totalEarnings - totalDeductions,
            statutoryBreakdown: { pf, esic, pt }
        })
    }

    return results
}
