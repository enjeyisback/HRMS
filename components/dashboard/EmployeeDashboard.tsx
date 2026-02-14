"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, FileText, Clock, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/providers/auth-provider"
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isToday,
    addMonths,
    subMonths,
    getDay,
    isWeekend
} from "date-fns"
import { cn } from "@/lib/utils"

const statusColors: Record<string, { cell: string; dot: string }> = {
    'Present': {
        cell: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-500'
    },
    'Absent': {
        cell: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
        dot: 'bg-red-500'
    },
    'Half-day': {
        cell: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500'
    },
    'Leave': {
        cell: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
        dot: 'bg-blue-500'
    },
    'Holiday': {
        cell: 'bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400'
    },
}

interface AttendanceRecord {
    date: string
    status: string
}

interface LeaveRecord {
    start_date: string
    end_date: string
}

export function EmployeeDashboard() {
    const { user } = useAuth()
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [loading, setLoading] = useState(true)
    const [records, setRecords] = useState<AttendanceRecord[]>([])
    const [leaves, setLeaves] = useState<LeaveRecord[]>([])
    const [stats, setStats] = useState({
        leaveBalance: 0,
        attendancePercent: 0,
    })

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return
            setLoading(true)
            const supabase = createClient()

            const { data: emp } = await supabase
                .from('employees')
                .select('id')
                .eq('user_id', user.id)
                .single()

            if (!emp) {
                setLoading(false)
                return
            }

            const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
            const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')

            const [attendanceRes, leavesRes] = await Promise.all([
                supabase
                    .from('attendance_logs')
                    .select('date, status')
                    .eq('employee_id', emp.id)
                    .gte('date', start)
                    .lte('date', end),
                supabase
                    .from('leave_requests')
                    .select('start_date, end_date')
                    .eq('employee_id', emp.id)
                    .eq('status', 'Approved')
                    .or(`start_date.lte.${end},end_date.gte.${start}`)
            ])

            setRecords(attendanceRes.data || [])
            setLeaves(leavesRes.data || [])

            // Get leave balance
            const currentYear = new Date().getFullYear()
            const { data: balances } = await supabase
                .from('leave_balances')
                .select('total_allocated, used')
                .eq('employee_id', emp.id)
                .eq('year', currentYear)

            const totalRemaining = (balances || []).reduce(
                (sum, b) => sum + (Number(b.total_allocated) - Number(b.used)), 0
            )

            const presentCount = (attendanceRes.data || []).filter(
                (r: AttendanceRecord) => r.status === 'Present'
            ).length
            const totalWorkDays = eachDayOfInterval({
                start: startOfMonth(currentMonth),
                end: new Date() < endOfMonth(currentMonth) ? new Date() : endOfMonth(currentMonth)
            }).filter(d => !isWeekend(d)).length

            setStats({
                leaveBalance: totalRemaining,
                attendancePercent: totalWorkDays > 0
                    ? Math.round((presentCount / totalWorkDays) * 100)
                    : 0,
            })

            setLoading(false)
        }

        fetchData()
    }, [user, currentMonth])

    const days = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth)
    })

    const startDay = getDay(startOfMonth(currentMonth))
    const blanks = Array(startDay).fill(null)

    const getDayStatus = (date: Date): string | null => {
        const dateStr = format(date, 'yyyy-MM-dd')
        const record = records.find(r => r.date === dateStr)
        if (record) return record.status

        const onLeave = leaves.some(l => {
            const lStart = new Date(l.start_date)
            const lEnd = new Date(l.end_date)
            return date >= lStart && date <= lEnd
        })
        if (onLeave) return 'Leave'
        if (isWeekend(date)) return 'Holiday'
        if (date < new Date() && !isToday(date)) return 'Absent'
        return null
    }

    const summary = {
        present: records.filter(r => r.status === 'Present').length,
        absent: days.filter(d => d < new Date() && !isToday(d) && !isWeekend(d) && getDayStatus(d) === 'Absent').length,
        leave: days.filter(d => getDayStatus(d) === 'Leave').length,
        halfDay: records.filter(r => r.status === 'Half-day').length,
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Welcome back!</h2>
                <div className="flex items-center gap-2">
                    <Button><Clock className="mr-2 h-4 w-4" /> Clock In</Button>
                    <Button variant="outline">Apply Leave</Button>
                </div>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-24">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground font-medium">Loading your dashboard...</p>
                </div>
            ) : (
                <>
                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-l-4 border-l-emerald-500">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Present</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-emerald-600">{summary.present}</div>
                                <p className="text-xs text-muted-foreground">Days this month</p>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-red-500">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Absent</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">{summary.absent}</div>
                                <p className="text-xs text-muted-foreground">Days this month</p>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-blue-500">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Leave Balance</CardTitle>
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">{stats.leaveBalance} Days</div>
                                <p className="text-xs text-muted-foreground">Remaining this year</p>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-amber-500">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Attendance</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-600">{stats.attendancePercent}%</div>
                                <p className="text-xs text-muted-foreground">This month</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Calendar + Payslips Grid */}
                    <div className="grid gap-6 md:grid-cols-5">
                        {/* Attendance Calendar — takes 3 cols */}
                        <Card className="md:col-span-3">
                            <CardHeader className="flex flex-row items-center justify-between pb-4">
                                <CardTitle className="flex items-center gap-2">
                                    <CalendarIcon className="h-5 w-5" />
                                    Attendance Calendar
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-muted-foreground">
                                        {format(currentMonth, 'MMMM yyyy')}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {/* Day headers */}
                                    <div className="grid grid-cols-7 gap-1.5">
                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                            <div
                                                key={day}
                                                className="text-center text-xs font-semibold text-muted-foreground py-2 uppercase tracking-wider"
                                            >
                                                {day}
                                            </div>
                                        ))}

                                        {/* Blank leading cells */}
                                        {blanks.map((_, i) => (
                                            <div key={`blank-${i}`} className="aspect-square" />
                                        ))}

                                        {/* Day cells */}
                                        {days.map(day => {
                                            const status = getDayStatus(day)
                                            const colors = status ? statusColors[status] : null
                                            return (
                                                <div
                                                    key={day.toISOString()}
                                                    className={cn(
                                                        "aspect-square flex flex-col items-center justify-center rounded-lg border text-sm font-medium transition-all duration-150 cursor-default",
                                                        isToday(day) && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                                                        colors ? colors.cell : "border-transparent text-muted-foreground hover:bg-muted/50"
                                                    )}
                                                >
                                                    <span>{format(day, 'd')}</span>
                                                    {status && (
                                                        <span className={cn(
                                                            "w-1.5 h-1.5 rounded-full mt-0.5",
                                                            colors?.dot
                                                        )} />
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* Legend */}
                                    <div className="flex flex-wrap gap-4 pt-2 border-t">
                                        {Object.entries(statusColors).map(([label, colors]) => (
                                            <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <span className={cn("w-2.5 h-2.5 rounded-full", colors.dot)} />
                                                {label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payslips — takes 2 cols */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Recent Payslips
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {[
                                        { month: 'January 2026', paid: 'Feb 1', amount: '—' },
                                        { month: 'December 2025', paid: 'Jan 1', amount: '—' },
                                        { month: 'November 2025', paid: 'Dec 1', amount: '—' },
                                    ].map((slip) => (
                                        <div
                                            key={slip.month}
                                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-full text-emerald-600 dark:text-emerald-400">
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{slip.month}</p>
                                                    <p className="text-xs text-muted-foreground">Paid on {slip.paid}</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm">View</Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    )
}
