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
import { Loader2, History, ClipboardList } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import { format } from "date-fns"
import { AttendanceRegularization } from "@/types"

export function AttendanceRegularizationList() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [requests, setRequests] = useState<AttendanceRegularization[]>([])

    useEffect(() => {
        const fetchRequests = async () => {
            if (!user) return
            const supabase = createClient()

            const { data: emp } = await supabase.from('employees').select('id').eq('user_id', user.id).single()
            if (!emp) return

            const { data } = await supabase
                .from('attendance_regularization')
                .select('*')
                .eq('employee_id', emp.id)
                .order('created_at', { ascending: false })

            setRequests(data || [])
            setLoading(false)
        }
        fetchRequests()
    }, [user])

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Approved': return 'bg-emerald-500'
            case 'Rejected': return 'bg-red-500'
            default: return 'bg-yellow-500'
        }
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <History className="h-5 w-5" />
                    Regularization History
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Requested Date</TableHead>
                            <TableHead>Proposed Time</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-[300px] text-center">
                                    <EmptyState
                                        title="No requests"
                                        description="You haven't submitted any regularization requests yet."
                                        icon={ClipboardList}
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            requests.map((reg) => (
                                <TableRow key={reg.id}>
                                    <TableCell className="font-medium">
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
                                    <TableCell>
                                        <Badge className={getStatusColor(reg.status)}>
                                            {reg.status}
                                        </Badge>
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
