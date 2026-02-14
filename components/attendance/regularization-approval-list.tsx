"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { format } from "date-fns"

export function RegularizationApprovalList() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [requests, setRequests] = useState<any[]>([])
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const fetchRequests = async () => {
        const supabase = createClient()
        const { data } = await supabase
            .from('attendance_regularization')
            .select(`
                *,
                employees (
                    first_name,
                    last_name,
                    employee_code
                )
            `)
            .eq('status', 'Pending')
            .order('created_at', { ascending: false })

        setRequests(data || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchRequests()
    }, [])

    const handleAction = async (id: string, status: 'Approved' | 'Rejected', employeeId: string, date: string, checkIn: string, checkOut: string) => {
        if (!user) return
        setActionLoading(id)
        const supabase = createClient()

        try {
            // 1. Update Regularization Status
            const { error: regError } = await supabase
                .from('attendance_regularization')
                .update({
                    status,
                    approved_by: (await supabase.from('employees').select('id').eq('user_id', user.id).single()).data?.id
                })
                .eq('id', id)

            if (regError) throw regError

            // 2. If Approved, Upsert the actual Attendance record
            if (status === 'Approved') {
                const { error: attError } = await supabase
                    .from('attendance')
                    .upsert({
                        employee_id: employeeId,
                        date: date,
                        check_in_time: checkIn,
                        check_out_time: checkOut,
                        status: 'Present'
                    }, { onConflict: 'employee_id, date' })

                if (attError) throw attError
            }

            alert(`Request ${status} successfully`)
            await fetchRequests()
        } catch (err: any) {
            console.error("Error processing regularization:", err)
            alert("Action failed: " + err.message)
        } finally {
            setActionLoading(null)
        }
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Pending Regularization Requests</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Proposed Time</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                    No pending regularization requests.
                                </TableCell>
                            </TableRow>
                        ) : (
                            requests.map((reg) => (
                                <TableRow key={reg.id}>
                                    <TableCell className="font-medium">
                                        {reg.employees.first_name} {reg.employees.last_name}
                                        <p className="text-[10px] text-muted-foreground">{reg.employees.employee_code}</p>
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(reg.requested_date), "MMM dd, yyyy")}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-xs">
                                            {reg.check_in_time ? format(new Date(reg.check_in_time), "hh:mm a") : "--"}
                                            {" - "}
                                            {reg.check_out_time ? format(new Date(reg.check_out_time), "hh:mm a") : "--"}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={reg.reason}>
                                        {reg.reason}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                onClick={() => handleAction(reg.id, 'Approved', reg.employee_id, reg.requested_date, reg.check_in_time, reg.check_out_time)}
                                                disabled={!!actionLoading}
                                            >
                                                {actionLoading === reg.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                                                Approve
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleAction(reg.id, 'Rejected', reg.employee_id, reg.requested_date, reg.check_in_time, reg.check_out_time)}
                                                disabled={!!actionLoading}
                                            >
                                                {actionLoading === reg.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
                                                Reject
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
