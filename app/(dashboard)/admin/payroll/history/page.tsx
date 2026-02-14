"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, History, Loader2, Search, ArrowLeft } from "lucide-react"
import { formatCurrency } from "@/lib/payroll-utils"
import { generatePayslipPDF } from "@/lib/payslip-pdf"
import { Separator } from "@/components/ui/separator"

export default function PayrollHistoryPage() {
    const [loading, setLoading] = useState(true)
    const [runs, setRuns] = useState<any[]>([])
    const [selectedRun, setSelectedRun] = useState<any | null>(null)
    const [runDetails, setRunDetails] = useState<any[]>([])
    const [detailsLoading, setDetailsLoading] = useState(false)

    const fetchHistory = async () => {
        setLoading(true)
        const supabase = createClient()
        const { data, error } = await supabase
            .from('payroll_runs')
            .select(`
                *,
                departments(name),
                details:payroll_run_details(count)
            `)
            .order('year', { ascending: false })
            .order('month', { ascending: false })

        if (error) console.error("Error fetching history:", error)
        else setRuns(data || [])
        setLoading(false)
    }

    const fetchRunDetails = async (run: any) => {
        setSelectedRun(run)
        setDetailsLoading(true)
        const supabase = createClient()
        const { data, error } = await supabase
            .from('payroll_run_details')
            .select('*')
            .eq('run_id', run.id)

        if (error) console.error("Error fetching run details:", error)
        else setRunDetails(data || [])
        setDetailsLoading(false)
    }

    useEffect(() => {
        fetchHistory()
    }, [])

    const downloadPayslip = (detail: any) => {
        const res = detail.calculation_details
        const doc = generatePayslipPDF(res, selectedRun.month, selectedRun.year)
        doc.save(`Payslip_${res.employeeCode}_${selectedRun.month}_${selectedRun.year}.pdf`)
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight">Payroll History</h2>
                    <p className="text-muted-foreground">View and manage past payroll executions.</p>
                </div>
            </div>

            {selectedRun ? (
                <div className="space-y-6">
                    <Button variant="ghost" onClick={() => setSelectedRun(null)} className="mb-2">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to History
                    </Button>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>
                                    {new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(2000, selectedRun.month - 1))} {selectedRun.year}
                                </CardTitle>
                                <CardDescription>{selectedRun.departments?.name || "All Departments"} Payroll Run</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Badge variant={selectedRun.status === 'Paid' ? 'default' : 'secondary'}>{selectedRun.status}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {detailsLoading ? (
                                <div className="flex justify-center p-8">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            ) : (
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Employee</TableHead>
                                                <TableHead>Present/LOP</TableHead>
                                                <TableHead>Gross</TableHead>
                                                <TableHead>Deductions</TableHead>
                                                <TableHead className="text-right">Net Payable</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {runDetails.map((detail) => (
                                                <TableRow key={detail.id}>
                                                    <TableCell>
                                                        <div className="font-medium">{detail.calculation_details.employeeName}</div>
                                                        <div className="text-xs text-muted-foreground">{detail.calculation_details.employeeCode}</div>
                                                    </TableCell>
                                                    <TableCell>{detail.present_days} / {detail.working_days} <span className="text-red-500 text-xs">(LOP: {detail.lop_days})</span></TableCell>
                                                    <TableCell>{formatCurrency(detail.gross_salary)}</TableCell>
                                                    <TableCell className="text-red-500">{formatCurrency(detail.total_deductions)}</TableCell>
                                                    <TableCell className="text-right font-bold">{formatCurrency(detail.net_payable)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" onClick={() => downloadPayslip(detail)}>
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5" />
                            Past Runs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Period</TableHead>
                                            <TableHead>Department</TableHead>
                                            <TableHead>Employees</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {runs.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    No payroll history found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            runs.map((run) => (
                                                <TableRow key={run.id}>
                                                    <TableCell className="font-medium">
                                                        {new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(2000, run.month - 1))} {run.year}
                                                    </TableCell>
                                                    <TableCell>{run.departments?.name || "All Departments"}</TableCell>
                                                    <TableCell>{run.details?.[0]?.count || 0}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={run.status === 'Paid' ? 'default' : 'secondary'}>
                                                            {run.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="outline" size="sm" onClick={() => fetchRunDetails(run)}>
                                                                <Search className="h-4 w-4 mr-2" />
                                                                View Details
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
