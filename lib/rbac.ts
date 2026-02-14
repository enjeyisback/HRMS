import { createClient } from "@/lib/supabase/client"

export type PermissionCode =
    | 'employees.view' | 'employees.manage'
    | 'leave.apply' | 'leave.view_own' | 'leave.view_all' | 'leave.approve' | 'leave.manage_types'
    | 'attendance.mark' | 'attendance.view_own' | 'attendance.view_all' | 'attendance.manage'
    | 'payroll.view_own' | 'payroll.view_all' | 'payroll.process' | 'payroll.manage'
    | 'reports.view'
    | 'rbac.manage';

export interface UserPermissions {
    role: string;
    permissions: PermissionCode[];
}

export async function getUserPermissions(): Promise<UserPermissions | null> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: employee, error } = await supabase
        .from('employees')
        .select(`
            id,
            app_roles (
                name,
                role_permissions (
                    app_permissions (
                        code
                    )
                )
            )
        `)
        .eq('user_id', user.id)
        .single()

    if (error || !employee || !employee.app_roles) return null

    const roleName = (employee.app_roles as any).name
    const permissions = (employee.app_roles as any).role_permissions.map(
        (rp: any) => rp.app_permissions.code as PermissionCode
    )

    return {
        role: roleName,
        permissions
    }
}

export function hasPermission(userPerms: UserPermissions | null, permission: PermissionCode): boolean {
    if (!userPerms) return false
    // Super Admin has all permissions
    if (userPerms.role === 'Super Admin') return true
    return userPerms.permissions.includes(permission)
}
