"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/providers/auth-provider"
import { LeaveRequest } from "@/types"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

export function LeaveRequestList() {
    const { user } = useAuth()
    const [requests, setRequests] = useState<LeaveRequest[]>([])
    const [loading, setLoading] = useState(true)

    const fetchRequests = async () => {
        if (!user) return
        setLoading(true)
        const supabase = createClient()

        // Get Employee ID
        const { data: emp } = await supabase.from('employees').select('id').eq('user_id', user.id).single()
        if (!emp) return

        const { data, error } = await supabase
            .from('leave_requests')
            .select(`*, leave_types(name, code)`)
            .eq('employee_id', emp.id)
            .order('created_at', { ascending: false })

        if (error) console.error(error)
        else setRequests(data || [])

        setLoading(false)
    }

    useEffect(() => {
        fetchRequests()
    }, [user])

    const handleCancel = async (id: string) => {
        if (!confirm("Are you sure you want to cancel this request?")) return
        const supabase = createClient()
        const { error } = await supabase.from('leave_requests').update({ status: 'Cancelled' }).eq('id', id)
        if (error) alert("Error cancelling: " + error.message)
        else fetchRequests()
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Approved': return <Badge className="bg-green-500">Approved</Badge>
            case 'Rejected': return <Badge variant="destructive">Rejected</Badge>
            case 'Cancelled': return <Badge variant="secondary">Cancelled</Badge>
            default: return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>
        }
    }

    if (loading) return <div>Loading records...</div>
    if (requests.length === 0) return <div className="text-muted-foreground text-sm">No leave records found.</div>

    return (
        <div className="border rounded-md overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Applied On</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests.map((req) => (
                        <TableRow key={req.id}>
                            <TableCell className="font-medium">
                                {req.leave_types?.name || "Unknown"}
                            </TableCell>
                            <TableCell>
                                {format(new Date(req.start_date), "MMM dd")} - {format(new Date(req.end_date), "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell>{req.total_days}</TableCell>
                            <TableCell>{getStatusBadge(req.status)}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                                {format(new Date(req.created_at), "MMM dd, hh:mm a")}
                            </TableCell>
                            <TableCell className="text-right">
                                {req.status === 'Pending' && (
                                    <Button variant="ghost" size="sm" onClick={() => handleCancel(req.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
