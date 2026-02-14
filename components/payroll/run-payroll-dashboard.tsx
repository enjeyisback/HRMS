"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Department } from "@/types"
import { calculateMonthlyPayroll, PayrollCalculationResult } from "@/lib/payroll-generator"
import { generatePayslipPDF } from "@/lib/payslip-pdf"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Loader2, Play, Download, CheckCircle2, FileSpreadsheet } from "lucide-react"
import { formatCurrency } from "@/lib/payroll-utils"
import * as XLSX from 'xlsx'

export function RunPayrollDashboard() {
    const [loading, setLoading] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [departments, setDepartments] = useState<Department[]>([])

    const [month, setMonth] = useState<string>(new Date().getMonth().toString()) // 0-indexed for simplicity here
    const [year, setYear] = useState<string>(new Date().getFullYear().toString())
    const [selectedDept, setSelectedDept] = useState<string>("all")

    const [results, setResults] = useState<PayrollCalculationResult[]>([])

    useEffect(() => {
        const fetchDepts = async () => {
            const supabase = createClient()
            const { data } = await supabase.from('departments').select('*')
            setDepartments(data || [])
        }
        fetchDepts()
    }, [])

    const handleCalculate = async () => {
        setLoading(true)
        try {
            const m = parseInt(month) + 1 // Convert to 1-12
            const y = parseInt(year)
            const data = await calculateMonthlyPayroll(m, y, selectedDept)
            setResults(data)
        } catch (error: any) {
            alert("Calculation failed: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleProcess = async () => {
        if (!confirm(`Are you sure you want to process payroll for ${results.length} employees? This will generate payslip records.`)) return

        setProcessing(true)
        const supabase = createClient()

        try {
            const m = parseInt(month) + 1
            const y = parseInt(year)

            // 1. Create a Payroll Run record
            const { data: run, error: runError } = await supabase
                .from('payroll_runs')
                .insert({
                    month: m,
                    year: y,
                    department_id: selectedDept === 'all' ? null : selectedDept,
                    status: 'Locked'
                })
                .select()
                .single()

            if (runError) throw runError

            // 2. Insert Run Details and Payslip placeholders
            for (const res of results) {
                const { data: detail, error: detailError } = await supabase
                    .from('payroll_run_details')
                    .insert({
                        run_id: run.id,
                        employee_id: res.employeeId,
                        working_days: res.workingDays,
                        present_days: res.presentDays,
                        leave_days: res.paidLeaveDays,
                        lop_days: res.lopDays,
                        gross_salary: res.monthlyGross,
                        total_earnings: res.totalEarnings,
                        total_deductions: res.totalDeductions,
                        net_payable: res.netPayable,
                        calculation_details: res
                    })
                    .select()
                    .single()

                if (detailError) throw detailError

                // In a real app, you'd upload the PDF to Supabase Storage here.
                // For this demo, we'll just record that the payslip is "Generated".
                await supabase.from('payslips').insert({
                    run_detail_id: detail.id,
                    employee_id: res.employeeId,
                    status: 'Generated'
                })
            }

            alert("Payroll processed successfully! Payslips are now available in history.")
            setResults([])
        } catch (error: any) {
            alert("Processing failed: " + error.message)
        } finally {
            setProcessing(false)
        }
    }

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(results.map(r => ({
            'Employee Code': r.employeeCode,
            'Name': r.employeeName,
            'Department': r.departmentName,
            'Working Days': r.workingDays,
            'Present': r.presentDays,
            'LOP': r.lopDays,
            'Gross': r.monthlyGross,
            'Actual Earnings': r.totalEarnings,
            'Deductions': r.totalDeductions,
            'Net Payable': r.netPayable
        })))
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll Summary")
        XLSX.writeFile(workbook, `Payroll_Summary_${month}_${year}.xlsx`)
    }

    const downloadPayslip = (res: PayrollCalculationResult) => {
        const doc = generatePayslipPDF(res, parseInt(month) + 1, parseInt(year))
        doc.save(`Payslip_${res.employeeCode}_${month}_${year}.pdf`)
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Payroll Configuration</CardTitle>
                    <CardDescription>Select period and department to initiate payroll generation.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4 items-end">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Month</label>
                        <Select value={month} onValueChange={setMonth}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select Month" />
                            </SelectTrigger>
                            <SelectContent>
                                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                                    <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Year</label>
                        <Select value={year} onValueChange={setYear}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                                {[2024, 2025, 2026].map(y => (
                                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Department</label>
                        <Select value={selectedDept} onValueChange={setSelectedDept}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="All Departments" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {departments.map(d => (
                                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button onClick={handleCalculate} disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                        Generate Preliminary List
                    </Button>

                    {results.length > 0 && (
                        <Button variant="outline" onClick={exportToExcel}>
                            <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
                            Export Excel
                        </Button>
                    )}
                </CardContent>
            </Card>

            {results.length > 0 && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Calculation Preview</CardTitle>
                            <CardDescription>Review the calculated amounts before double-locking the run.</CardDescription>
                        </div>
                        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleProcess} disabled={processing}>
                            {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                            Process & Lock Payroll
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Days (P/W)</TableHead>
                                        <TableHead>Gross</TableHead>
                                        <TableHead>Earnings</TableHead>
                                        <TableHead>Deductions</TableHead>
                                        <TableHead className="text-right">Net Payable</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {results.map((res) => (
                                        <TableRow key={res.employeeId}>
                                            <TableCell>
                                                <div className="font-medium">{res.employeeName}</div>
                                                <div className="text-xs text-muted-foreground">{res.employeeCode} • {res.departmentName}</div>
                                            </TableCell>
                                            <TableCell>
                                                {res.presentDays}/{res.workingDays}
                                                {res.lopDays > 0 && <span className="ml-1 text-red-500 text-[10px]">(LOP: {res.lopDays})</span>}
                                            </TableCell>
                                            <TableCell className="text-xs">{formatCurrency(res.monthlyGross)}</TableCell>
                                            <TableCell className="text-emerald-600 font-medium">{formatCurrency(res.totalEarnings)}</TableCell>
                                            <TableCell className="text-red-500">{formatCurrency(res.totalDeductions)}</TableCell>
                                            <TableCell className="text-right font-bold text-blue-600 italic">
                                                {formatCurrency(res.netPayable)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => downloadPayslip(res)}>
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
