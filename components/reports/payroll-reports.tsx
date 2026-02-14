"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { ReportFilters } from "./report-filters"
import { ReportChart } from "./report-chart"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/payroll-utils"
import { CreditCard, Landmark, PieChart as PieChartIcon, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Download, FileSpreadsheet } from "lucide-react"
import * as XLSX from 'xlsx'

export function PayrollReports() {
    const [loading, setLoading] = useState(true)
    const [salaryRegister, setSalaryRegister] = useState<any[]>([])
    const [deptWiseSalary, setDeptWiseSalary] = useState<any[]>([])
    const [deductions, setDeductions] = useState<any[]>([])

    const fetchReports = async (filters?: any) => {
        setLoading(true)
        const supabase = createClient()

        // 1. Fetch Processed Payroll Details
        let query = supabase
            .from('payroll_run_details')
            .select(`
                *,
                employees(first_name, last_name, employee_code, bank_name, bank_account_no, bank_ifsc),
                payroll_runs(month, year, departments(name))
            `)
            .order('created_at', { ascending: false })
            .limit(50)

        const { data: details } = await query
        setSalaryRegister(details || [])

        // 2. Dept-wise Salary Aggregation
        const deptTotals: Record<string, number> = {}
        details?.forEach((d: any) => {
            const name = d.payroll_runs?.departments?.name || 'All Departments'
            deptTotals[name] = (deptTotals[name] || 0) + Number(d.net_payable)
        })
        setDeptWiseSalary(Object.entries(deptTotals).map(([name, count]) => ({ name, count })))

        // 3. Deduction Breakdown (Last Run)
        if (details && details.length > 0) {
            const totalPF = details.reduce((acc, d) => acc + Number(d.calculation_details.statutoryBreakdown.pf), 0)
            const totalESIC = details.reduce((acc, d) => acc + Number(d.calculation_details.statutoryBreakdown.esic), 0)
            const totalPT = details.reduce((acc, d) => acc + Number(d.calculation_details.statutoryBreakdown.pt), 0)
            setDeductions([
                { name: 'PF', count: totalPF },
                { name: 'ESIC', count: totalESIC },
                { name: 'PT', count: totalPT }
            ])
        }

        setLoading(false)
    }

    useEffect(() => {
        fetchReports()
    }, [])

    const exportSalaryRegister = () => {
        const worksheet = XLSX.utils.json_to_sheet(salaryRegister.map(d => ({
            'Employee Code': d.employees.employee_code,
            'Name': `${d.employees.first_name} ${d.employees.last_name}`,
            'Period': `${d.payroll_runs.month}/${d.payroll_runs.year}`,
            'Gross': d.gross_salary,
            'Deductions': d.total_deductions,
            'Net Payable': d.net_payable,
            'Bank': d.employees.bank_name,
            'Account No': d.employees.bank_account_no,
            'IFSC': d.employees.bank_ifsc
        })))
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Salary Register")
        XLSX.writeFile(workbook, "Salary_Register.xlsx")
    }

    return (
        <div className="space-y-6">
            <ReportFilters onFilterChange={fetchReports} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <PieChartIcon className="h-4 w-4 text-indigo-500" />
                            Net Salary by Department
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ReportChart data={deptWiseSalary} type="bar" dataKey="count" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-red-500" />
                            Statutory Deductions (Current Run)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ReportChart data={deductions} type="pie" dataKey="count" />
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Landmark className="h-4 w-4 text-emerald-600" />
                            Salary Register & Disbursement
                        </CardTitle>
                        <CardDescription>Consolidated view for accounts team.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={exportSalaryRegister}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Export Register
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Period</TableHead>
                                <TableHead>Gross</TableHead>
                                <TableHead>Net Payable</TableHead>
                                <TableHead>Bank Info</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {salaryRegister.map((d, i) => (
                                <TableRow key={i}>
                                    <TableCell>
                                        <div className="font-medium">{d.employees.first_name} {d.employees.last_name}</div>
                                        <div className="text-xs text-muted-foreground">{d.employees.employee_code}</div>
                                    </TableCell>
                                    <TableCell className="text-sm">{d.payroll_runs.month}/{d.payroll_runs.year}</TableCell>
                                    <TableCell className="text-sm">{formatCurrency(d.gross_salary)}</TableCell>
                                    <TableCell className="text-sm font-bold text-blue-600">{formatCurrency(d.net_payable)}</TableCell>
                                    <TableCell className="text-xs">
                                        {d.employees.bank_name}<br />
                                        {d.employees.bank_account_no}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {salaryRegister.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No processed salary records found.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
