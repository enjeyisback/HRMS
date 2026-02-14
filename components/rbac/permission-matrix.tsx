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
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, ShieldCheck, Lock } from "lucide-react"

export function PermissionMatrix() {
    const [roles, setRoles] = useState<any[]>([])
    const [permissions, setPermissions] = useState<any[]>([])
    const [rolePermissions, setRolePermissions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState<string | null>(null)

    const fetchData = async () => {
        setLoading(true)
        const supabase = createClient()

        const [rRes, pRes, rpRes] = await Promise.all([
            supabase.from('app_roles').select('*').order('name'),
            supabase.from('app_permissions').select('*').order('module').order('code'),
            supabase.from('role_permissions').select('*')
        ])

        setRoles(rRes.data || [])
        setPermissions(pRes.data || [])
        setRolePermissions(rpRes.data || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    const isAssigned = (roleId: string, permissionId: string) => {
        return rolePermissions.some(rp => rp.role_id === roleId && rp.permission_id === permissionId)
    }

    const togglePermission = async (roleId: string, permissionId: string, current: boolean) => {
        setUpdating(`${roleId}-${permissionId}`)
        const supabase = createClient()

        if (current) {
            // Remove
            const { error } = await supabase
                .from('role_permissions')
                .delete()
                .match({ role_id: roleId, permission_id: permissionId })

            if (!error) {
                setRolePermissions(prev => prev.filter(rp => !(rp.role_id === roleId && rp.permission_id === permissionId)))
            }
        } else {
            // Add
            const { data, error } = await supabase
                .from('role_permissions')
                .insert({ role_id: roleId, permission_id: permissionId })
                .select()
                .single()

            if (!error && data) {
                setRolePermissions(prev => [...prev, data])
            }
        }
        setUpdating(null)
    }

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>

    // Group permissions by module for better UI
    const modules = Array.from(new Set(permissions.map(p => p.module)))

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    Role-Permission Matrix
                </CardTitle>
                <CardDescription>Manage granular access controls for each user role.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-[250px]">Module / Permission</TableHead>
                                {roles.map(role => (
                                    <TableHead key={role.id} className="text-center min-w-[120px]">
                                        <div className="flex flex-col items-center gap-1">
                                            <span>{role.name}</span>
                                            {role.name === 'Super Admin' && <Lock className="h-3 w-3 text-muted-foreground" />}
                                        </div>
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {modules.map(module => (
                                <>
                                    <TableRow key={module} className="bg-muted/20 font-bold">
                                        <TableCell colSpan={roles.length + 1} className="py-2 px-4 uppercase text-[10px] tracking-wider text-muted-foreground">
                                            {module}
                                        </TableCell>
                                    </TableRow>
                                    {permissions.filter(p => p.module === module).map(p => (
                                        <TableRow key={p.id} className="hover:bg-muted/5">
                                            <TableCell className="pl-6">
                                                <div>
                                                    <span className="font-medium text-sm">{p.action}</span>
                                                    <p className="text-[10px] text-muted-foreground">{p.description}</p>
                                                </div>
                                            </TableCell>
                                            {roles.map(role => {
                                                const checked = isAssigned(role.id, p.id)
                                                const isUpdating = updating === `${role.id}-${p.id}`
                                                const disabled = role.name === 'Super Admin' // Super Admin usually locked for safety

                                                return (
                                                    <TableCell key={role.id} className="text-center">
                                                        <div className="flex justify-center items-center">
                                                            {isUpdating ? (
                                                                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                                            ) : (
                                                                <Checkbox
                                                                    checked={checked}
                                                                    disabled={disabled}
                                                                    onCheckedChange={() => togglePermission(role.id, p.id, checked)}
                                                                />
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                )
                                            })}
                                        </TableRow>
                                    ))}
                                </>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
