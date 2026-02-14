"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { ReportFilters } from "./report-filters"
import { ReportChart } from "./report-chart"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, UserX, TrendingUp } from "lucide-react"

export function AttendanceReports() {
    const [loading, setLoading] = useState(true)
    const [attendanceTrends, setAttendanceTrends] = useState<any[]>([])
    const [lateComers, setLateComers] = useState<any[]>([])
    const [absentees, setAbsentees] = useState<any[]>([])

    const fetchReports = async (filters?: any) => {
        setLoading(true)
        const supabase = createClient()

        // 1. Attendance Trends (Last 7 days)
        const { data: trendData } = await supabase.from('attendance').select('date, status')
        const trends: Record<string, number> = {}
        trendData?.forEach(a => {
            if (a.status === 'Present') {
                trends[a.date] = (trends[a.date] || 0) + 1
            }
        })
        setAttendanceTrends(Object.entries(trends).map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name)).slice(-7))

        // 2. Late Comers
        const { data: lateData } = await supabase
            .from('attendance')
            .select('employee_id, date, check_in_time, employees(first_name, last_name, employee_code)')
            .eq('late_coming', true)
            .order('date', { ascending: false })
            .limit(10)
        setLateComers(lateData || [])

        // 3. Absentees Today
        const today = new Date().toISOString().split('T')[0]
        const { data: absentData } = await supabase
            .from('attendance')
            .select('employee_id, date, status, employees(first_name, last_name, employee_code)')
            .eq('date', today)
            .eq('status', 'Absent')
        setAbsentees(absentData || [])

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
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                            Attendance Trend (Present Count)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ReportChart data={attendanceTrends} type="bar" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-500" />
                            Late Coming Log (Recent)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>In-Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lateComers.map((l, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-medium">{(l as any).employees?.first_name} {(l as any).employees?.last_name}</TableCell>
                                        <TableCell>{l.date}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="text-amber-600">{l.check_in_time}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {lateComers.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No late comers recorded</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <UserX className="h-4 w-4 text-red-500" />
                        Today's Absentees
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {absentees.map((a, i) => (
                            <div key={i} className="flex flex-col p-3 border rounded-md bg-muted/20">
                                <span className="font-medium text-sm">{(a as any).employees?.first_name} {(a as any).employees?.last_name}</span>
                                <span className="text-xs text-muted-foreground">{(a as any).employees?.employee_code}</span>
                            </div>
                        ))}
                        {absentees.length === 0 && <p className="col-span-full text-center text-muted-foreground py-8">All employees present or on leave.</p>}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
