"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    isToday,
    addMonths,
    subMonths,
    getDay,
    isWeekend
} from "date-fns"
import { cn } from "@/lib/utils"
import { Attendance, LeaveRequest } from "@/types"
import { Button } from "@/components/ui/button"

const statusColors: Record<string, string> = {
    'Present': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Absent': 'bg-red-100 text-red-700 border-red-200',
    'Half-day': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Leave': 'bg-blue-100 text-blue-700 border-blue-200',
    'Holiday': 'bg-slate-100 text-slate-700 border-slate-200',
}

export function AttendanceCalendar() {
    const { user } = useAuth()
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [loading, setLoading] = useState(true)
    const [records, setRecords] = useState<Attendance[]>([])
    const [leaves, setLeaves] = useState<LeaveRequest[]>([])

    const fetchMonthData = async () => {
        if (!user) return
        setLoading(true)
        const supabase = createClient()

        // Get Employee ID
        const { data: emp } = await supabase.from('employees').select('id').eq('user_id', user.id).single()
        if (!emp) {
            setLoading(false)
            return
        }

        const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
        const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')

        // Fetch Attendance
        const { data: attendanceData } = await supabase
            .from('attendance')
            .select('*')
            .eq('employee_id', emp.id)
            .gte('date', start)
            .lte('date', end)

        // Fetch Approved Leaves
        const { data: leaveData } = await supabase
            .from('leave_requests')
            .select('*')
            .eq('employee_id', emp.id)
            .eq('status', 'Approved')
            .or(`start_date.lte.${end},end_date.gte.${start}`)

        setRecords(attendanceData || [])
        setLeaves(leaveData || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchMonthData()
    }, [user, currentMonth])

    const days = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth)
    })

    const startDay = getDay(startOfMonth(currentMonth))
    const blanks = Array(startDay).fill(null)

    const getDayStatus = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd')

        // Check Attendance record first
        const record = records.find(r => r.date === dateStr)
        if (record) return record.status

        // Check if on Leave
        const onLeave = leaves.some(l => {
            const lStart = new Date(l.start_date)
            const lEnd = new Date(l.end_date)
            return date >= lStart && date <= lEnd
        })
        if (onLeave) return 'Leave'

        // Check if Weekend (Future: fetch real holidays)
        if (isWeekend(date)) return 'Holiday'

        // If in the past and no record/leave, Mark as Absent
        if (date < new Date() && !isToday(date)) return 'Absent'

        return null
    }

    const summary = {
        present: records.filter(r => r.status === 'Present').length,
        absent: days.filter(d => d < new Date() && !isToday(d) && getDayStatus(d) === 'Absent').length,
        leave: days.filter(d => getDayStatus(d) === 'Leave').length,
        halfDay: records.filter(r => r.status === 'Half-day').length,
    }

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Attendance History
                </CardTitle>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium mr-2">
                        {format(currentMonth, 'MMMM yyyy')}
                    </span>
                    <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-7 gap-1 sm:gap-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="text-center text-[10px] sm:text-xs font-bold text-muted-foreground py-2 uppercase">
                                    {day}
                                </div>
                            ))}

                            {blanks.map((_, i) => <div key={`blank-${i}`} />)}

                            {days.map(day => {
                                const status = getDayStatus(day)
                                return (
                                    <div
                                        key={day.toISOString()}
                                        className={cn(
                                            "aspect-square flex flex-col items-center justify-center border rounded-md text-[10px] sm:text-sm relative transition-colors",
                                            isToday(day) && "ring-2 ring-primary ring-offset-2",
                                            status && statusColors[status]
                                        )}
                                    >
                                        <span className={cn(
                                            "font-medium",
                                            status ? "" : "text-muted-foreground"
                                        )}>
                                            {format(day, 'd')}
                                        </span>
                                        {status && (
                                            <span className="hidden sm:block text-[8px] mt-0.5 opacity-80 uppercase font-bold">
                                                {status}
                                            </span>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground uppercase font-bold">Present</p>
                                <p className="text-xl font-bold text-emerald-600">{summary.present}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground uppercase font-bold">Absent</p>
                                <p className="text-xl font-bold text-red-600">{summary.absent}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground uppercase font-bold">Leave</p>
                                <p className="text-xl font-bold text-blue-600">{summary.leave}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground uppercase font-bold">Half-Day</p>
                                <p className="text-xl font-bold text-yellow-600">{summary.halfDay}</p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
