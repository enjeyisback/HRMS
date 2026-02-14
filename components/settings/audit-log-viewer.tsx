"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Loader2, History, Search, User } from "lucide-react"
import { format } from "date-fns"

export function AuditLogViewer() {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        const fetchLogs = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('audit_logs')
                .select(`
                    *,
                    employees!audit_logs_user_id_fkey (
                        first_name,
                        last_name
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(100)

            setLogs(data || [])
            setLoading(false)
        }
        fetchLogs()
    }, [])

    const filteredLogs = logs.filter(log =>
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action_type.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getActionColor = (type: string) => {
        switch (type) {
            case 'CREATE': return 'bg-green-100 text-green-700'
            case 'UPDATE': return 'bg-blue-100 text-blue-700'
            case 'DELETE': return 'bg-red-100 text-red-700'
            case 'AUTH': return 'bg-purple-100 text-purple-700'
            case 'ACCESS_DENIED': return 'bg-orange-100 text-orange-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5 text-gray-600" />
                        Audit Trail
                    </CardTitle>
                    <CardDescription>Track all administrative actions and system events.</CardDescription>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search logs..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[180px]">Timestamp</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Module</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead className="max-w-[300px]">Description</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLogs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {format(new Date(log.created_at), 'PPp')}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`font-normal ${getActionColor(log.action_type)}`} variant="outline">
                                            {log.action_type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="capitalize text-sm">{log.module}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm">
                                            <User className="h-3 w-3" />
                                            {log.employees ? `${log.employees.first_name} ${log.employees.last_name}` : 'System'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm truncate max-w-[400px]" title={log.description}>
                                        {log.description}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
