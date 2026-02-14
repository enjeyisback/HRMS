import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
    // Use Service Role to bypass RLS during setup
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log("Setup Debug - URL:", supabaseUrl)
    console.log("Setup Debug - Service Key Length:", serviceKey?.length)
    console.log("Setup Debug - Service Key Prefix:", serviceKey?.substring(0, 10))

    if (!supabaseUrl || !serviceKey) {
        return NextResponse.json({ error: "Supabase environment variables missing on server" }, { status: 500 })
    }

    const supabaseAdmin = createSupabaseClient(
        supabaseUrl,
        serviceKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )

    try {
        const { email, password, full_name } = await request.json()

        if (!email || !password || !full_name) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // 1. Verify system is indeed empty (no employees)
        const { count: empCount } = await supabaseAdmin
            .from('employees')
            .select('*', { count: 'exact', head: true })

        if (empCount && empCount > 0) {
            return NextResponse.json({ error: "System already setup" }, { status: 400 })
        }

        // 2. Self-heal: Ensure basic roles exist
        const roles = [
            { name: 'Super Admin', description: 'Full system access' },
            { name: 'HR Admin', description: 'Manage HR, Payroll, and Attendance' },
            { name: 'Manager', description: 'Team management and approvals' },
            { name: 'Employee', description: 'Self-service access' }
        ]

        for (const role of roles) {
            await supabaseAdmin.from('app_roles').upsert(role, { onConflict: 'name' })
        }

        // 3. Self-heal: Ensure basic permissions exist
        const permissions = [
            { code: 'employees.view', module: 'employees', action: 'view', description: 'View employee list' },
            { code: 'employees.manage', module: 'employees', action: 'manage', description: 'Create/Edit/Delete employees' },
            { code: 'leave.apply', module: 'leave', action: 'apply', description: 'Apply for leave' },
            { code: 'leave.view_own', module: 'leave', action: 'view_own', description: 'View own leave history' },
            { code: 'leave.view_all', module: 'leave', action: 'view_all', description: 'View all leave requests' },
            { code: 'leave.approve', module: 'leave', action: 'approve', description: 'Approve/Reject leaves' },
            { code: 'leave.manage_types', module: 'leave', action: 'manage', description: 'Manage leave types and allocations' },
            { code: 'attendance.mark', module: 'attendance', action: 'mark', description: 'Mark daily attendance' },
            { code: 'attendance.view_own', module: 'attendance', action: 'view_own', description: 'View own attendance' },
            { code: 'attendance.view_all', module: 'attendance', action: 'view_all', description: 'View all attendance logs' },
            { code: 'attendance.manage', module: 'attendance', action: 'manage', description: 'Bulk mark or regularize attendance' },
            { code: 'payroll.view_own', module: 'payroll', action: 'view_own', description: 'View own payslips' },
            { code: 'payroll.view_all', module: 'payroll', action: 'view_all', description: 'View all payroll runs' },
            { code: 'payroll.process', module: 'payroll', action: 'process', description: 'Run and process payroll' },
            { code: 'payroll.manage', module: 'payroll', action: 'manage', description: 'Manage salary components and templates' },
            { code: 'reports.view', module: 'reports', action: 'view', description: 'Access analytics and reports' },
            { code: 'rbac.manage', module: 'rbac', action: 'manage', description: 'Manage roles and permissions' }
        ]

        for (const perm of permissions) {
            await supabaseAdmin.from('app_permissions').upsert(perm, { onConflict: 'code' })
        }

        // 4. Map Super Admin permissions
        const { data: superAdminRole } = await supabaseAdmin.from('app_roles').select('id').eq('name', 'Super Admin').single()
        const { data: allPerms } = await supabaseAdmin.from('app_permissions').select('id')

        if (superAdminRole && allPerms) {
            const rolePerms = allPerms.map(p => ({ role_id: superAdminRole.id, permission_id: p.id }))
            await supabaseAdmin.from('role_permissions').upsert(rolePerms, { onConflict: 'role_id,permission_id' })
        }

        // 5. Ensure default Department and Designation exist
        const { data: dept } = await supabaseAdmin.from('departments').select('id').limit(1).single()
        let deptId = dept?.id
        if (!deptId) {
            const { data: newDept } = await supabaseAdmin.from('departments').insert({ name: 'Administration', code: 'ADMIN' }).select().single()
            deptId = newDept?.id
        }

        const { data: desig } = await supabaseAdmin.from('designations').select('id').limit(1).single()
        let desigId = desig?.id
        if (!desigId) {
            const { data: newDesig } = await supabaseAdmin.from('designations').insert({ title: 'Super Administrator', level: 10 }).select().single()
            desigId = newDesig?.id
        }

        // 6. Find or Create the Admin User
        let userId: string | undefined

        // Check if user already exists in Auth
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = usersData?.users?.find(u => u.email === email)

        if (existingUser) {
            userId = existingUser.id
            // Update password to what user provided (in case they forgot the old one)
            await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
                password,
                email_confirm: true,
                user_metadata: { full_name }
            })
        } else {
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name }
            })
            if (authError) throw authError
            userId = authData.user?.id
        }

        if (!userId) throw new Error("Could not identify user ID")

        // 7. Create Employee record as Super Admin
        const { error: empError } = await supabaseAdmin
            .from('employees')
            .insert({
                user_id: userId,
                first_name: full_name.split(' ')[0] || 'Admin',
                last_name: full_name.split(' ').slice(1).join(' ') || 'User',
                email: email,
                role_id: superAdminRole?.id,
                department_id: deptId,
                designation_id: desigId,
                status: 'Active',
                joining_date: new Date().toISOString().split('T')[0],
                employment_type: 'Full-Time'
            })

        if (empError) {
            // If employee already exists for this email, just update it to be Super Admin
            if (empError.message.includes("unique") || empError.code === '23505') {
                await supabaseAdmin.from('employees').update({
                    role_id: superAdminRole?.id,
                    user_id: userId
                }).eq('email', email)
            } else {
                throw empError
            }
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Setup Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
