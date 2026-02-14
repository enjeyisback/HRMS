"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, MapPin, Clock, LogIn, LogOut, AlertCircle } from "lucide-react"
import { format, isAfter, parse, differenceInHours, differenceInMinutes } from "date-fns"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Attendance } from "@/types"

export function AttendanceActions() {
    const { user } = useAuth()
    const [hasMounted, setHasMounted] = useState(false)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [attendance, setAttendance] = useState<Attendance | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)

    const fetchTodayAttendance = async () => {
        if (!user) return
        setLoading(true)
        const supabase = createClient()

        // Get Employee ID
        const { data: emp } = await supabase.from('employees').select('id').eq('user_id', user.id).single()
        if (!emp) {
            setLoading(false)
            return
        }

        const today = format(new Date(), 'yyyy-MM-dd')
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('employee_id', emp.id)
            .eq('date', today)
            .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 is "No object found"
            console.error("Error fetching attendance:", error)
        } else {
            setAttendance(data)
        }
        setLoading(false)
    }

    useEffect(() => {
        setHasMounted(true)
        fetchTodayAttendance()
    }, [user])

    const getGeoLocation = (): Promise<{ lat: number; lng: number }> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation is not supported by your browser"))
            } else {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        })
                    },
                    (error) => {
                        reject(new Error(error.message))
                    }
                )
            }
        })
    }

    const handleCheckIn = async () => {
        if (!user) return
        setActionLoading(true)
        setError(null)
        const supabase = createClient()

        try {
            const coords = await getGeoLocation().catch(() => null)
            const { data: emp } = await supabase.from('employees').select('id').eq('user_id', user.id).single()
            if (!emp) throw new Error("Employee record not found")

            const now = new Date()
            const checkInTime = now.toISOString()
            const today = format(now, 'yyyy-MM-dd')

            // Late coming check (after 10:00 AM)
            const tenAM = parse("10:00:00", "HH:mm:ss", now)
            const isLate = isAfter(now, tenAM)

            const { error: insError } = await supabase.from('attendance').insert({
                employee_id: emp.id,
                date: today,
                check_in_time: checkInTime,
                late_coming: isLate,
                location: coords ? { lat: coords.lat, lng: coords.lng } : null,
                status: 'Present'
            })

            if (insError) throw insError
            toast.success("Checked in successfully")
            await fetchTodayAttendance()
        } catch (err: any) {
            toast.error(err.message || "Failed to check in")
        } finally {
            setActionLoading(false)
        }
    }

    const handleCheckOut = async () => {
        if (!user || !attendance) return
        setActionLoading(true)
        setError(null)
        const supabase = createClient()

        try {
            const now = new Date()
            const checkOutTime = now.toISOString()

            // Calculate hours
            const checkIn = new Date(attendance.check_in_time!)
            const hours = differenceInMinutes(now, checkIn) / 60

            const { error: updError } = await supabase
                .from('attendance')
                .update({
                    check_out_time: checkOutTime,
                    total_hours: parseFloat(hours.toFixed(2))
                })
                .eq('id', attendance.id)

            if (updError) throw updError
            toast.success("Checked out successfully")
            await fetchTodayAttendance()
        } catch (err: any) {
            toast.error(err.message || "Failed to check out")
        } finally {
            setActionLoading(false)
        }
    }

    if (!hasMounted || loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Today's Attendance
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {!attendance ? (
                    <div className="space-y-4 text-center py-6">
                        <p className="text-muted-foreground">You haven't checked in yet today.</p>
                        <Button
                            size="lg"
                            className="w-full sm:w-auto"
                            onClick={handleCheckIn}
                            disabled={actionLoading}
                        >
                            {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                            Check In
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 border rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground uppercase font-bold">Check In</p>
                                <p className="text-xl font-semibold">
                                    {format(new Date(attendance.check_in_time!), "hh:mm a")}
                                </p>
                                {attendance.late_coming && (
                                    <span className="text-[10px] text-red-500 font-medium">Late Arrival</span>
                                )}
                            </div>
                            <div className="p-4 border rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground uppercase font-bold">Check Out</p>
                                <p className="text-xl font-semibold">
                                    {attendance.check_out_time
                                        ? format(new Date(attendance.check_out_time), "hh:mm a")
                                        : "--:--"
                                    }
                                </p>
                            </div>
                        </div>

                        {attendance.total_hours && (
                            <div className="text-center py-2">
                                <p className="text-sm text-muted-foreground">Total Work Hours</p>
                                <p className="text-2xl font-bold text-emerald-600">{attendance.total_hours} hrs</p>
                            </div>
                        )}

                        {!attendance.check_out_time && (
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full"
                                onClick={handleCheckOut}
                                disabled={actionLoading}
                            >
                                {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                                Check Out
                            </Button>
                        )}

                        {attendance.location && (
                            <div className="flex items-center gap-1 justify-center text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span>Checked in from: {attendance.location.lat.toFixed(4)}, {attendance.location.lng.toFixed(4)}</span>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
