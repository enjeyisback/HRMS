import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { password, reporting_manager_id, ...employeeData } = body

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !serviceKey) {
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        })

        // 1. Create Auth User (or find existing)
        const email = employeeData.email
        const fullName = `${employeeData.first_name} ${employeeData.last_name}`

        let userId: string

        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = usersData?.users?.find(u => u.email === email)

        if (existingUser) {
            userId = existingUser.id
            // Update password and metadata
            await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
                password,
                email_confirm: true,
                user_metadata: { full_name: fullName }
            })
        } else {
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name: fullName }
            })
            if (authError) {
                return NextResponse.json({ error: `Auth error: ${authError.message}` }, { status: 400 })
            }
            userId = authData.user!.id
        }

        // 2. Auto-generate Employee Code if empty
        if (!employeeData.employee_code) {
            const { count } = await supabaseAdmin.from('employees').select('*', { count: 'exact', head: true })
            const nextId = (count || 0) + 1
            employeeData.employee_code = `EMP${nextId.toString().padStart(3, '0')}`
        }

        // 3. Auto-generate Official Email if empty
        if (!employeeData.official_email) {
            employeeData.official_email = `${employeeData.first_name.toLowerCase()}.${employeeData.last_name.toLowerCase()}@company.com`
        }

        // 4. Insert Employee record linked to Auth user
        const employeePayload = {
            ...employeeData,
            user_id: userId,
            manager_id: reporting_manager_id || null,
        }

        const { data: employee, error: empError } = await supabaseAdmin
            .from("employees")
            .insert(employeePayload)
            .select('id')
            .single()

        if (empError) {
            return NextResponse.json({ error: `Employee error: ${empError.message}` }, { status: 400 })
        }

        return NextResponse.json({
            success: true,
            employee_id: employee.id,
            user_id: userId,
            message: `Employee created. They can log in with: ${email}`
        })

    } catch (error: any) {
        console.error("Employee creation error:", error)
        return NextResponse.json({ error: error.message || "Failed to create employee" }, { status: 500 })
    }
}
