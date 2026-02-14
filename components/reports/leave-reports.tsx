"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { ReportFilters } from "./report-filters"
import { ReportChart } from "./report-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plane, BarChart3, Clock3 } from "lucide-react"

export function LeaveReports() {
    const [loading, setLoading] = useState(true)
    const [leaveUsage, setLeaveUsage] = useState<any[]>([])
    const [pendingRequests, setPendingRequests] = useState<any[]>([])
    const [balances, setBalances] = useState<any[]>([])

    const fetchReports = async (filters?: any) => {
        setLoading(true)
        const supabase = createClient()

        // 1. Leave Usage by Type
        const { data: usageData } = await supabase
            .from('leave_requests')
            .select('leave_types(name)')
            .eq('status', 'Approved')

        const usage: Record<string, number> = {}
        usageData?.forEach((l: any) => {
            const name = l.leave_types?.name || 'Unknown'
            usage[name] = (usage[name] || 0) + 1
        })
        setLeaveUsage(Object.entries(usage).map(([name, count]) => ({ name, count })))

        // 2. Pending Approvals
        const { data: pending } = await supabase
            .from('leave_requests')
            .select('*, employees(first_name, last_name, employee_code), leave_types(name)')
            .eq('status', 'Pending')
            .limit(10)
        setPendingRequests(pending || [])

        // 3. Leave Balances Summary
        const { data: balData } = await supabase
            .from('leave_balances')
            .select('*, employees(first_name, last_name), leave_types(name)')
            .limit(20)
        setBalances(balData || [])

        setLoading(false)
    }

    useEffect(() => {
        fetchReports()
    }, [])

    return (
        <div className="space-y-6">
            <ReportFilters onFilterChange={fetchReports} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-purple-500" />
                            Leave Distribution by Type
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ReportChart data={leaveUsage} type="pie" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Clock3 className="h-4 w-4 text-amber-500" />
                            Pending Leave Requests
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {pendingRequests.map((r, i) => (
                                <div key={i} className="flex items-center justify-between border-b pb-2">
                                    <div className="text-sm">
                                        <p className="font-medium">{(r as any).employees?.first_name} {(r as any).employees?.last_name}</p>
                                        <p className="text-xs text-muted-foreground">{(r as any).leave_types?.name} • {new Date(r.start_date).toLocaleDateString()}</p>
                                    </div>
                                    <Badge variant="secondary">Pending</Badge>
                                </div>
                            ))}
                            {pendingRequests.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">No pending requests.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Leave Balances (All Employees)</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Leave Type</TableHead>
                                <TableHead>Allocated</TableHead>
                                <TableHead>Used</TableHead>
                                <TableHead className="text-right">Remaining</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {balances.map((b, i) => (
                                <TableRow key={i}>
                                    <TableCell className="text-sm font-medium">{(b as any).employees?.first_name} {(b as any).employees?.last_name}</TableCell>
                                    <TableCell className="text-sm">{(b as any).leave_types?.name}</TableCell>
                                    <TableCell className="text-sm">{b.allocated}</TableCell>
                                    <TableCell className="text-sm">{b.used}</TableCell>
                                    <TableCell className="text-sm text-right font-bold text-emerald-600">
                                        {b.allocated - b.used}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {balances.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground">No balance records found.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
