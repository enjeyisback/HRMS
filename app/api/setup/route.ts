import { createClient } from "@/lib/supabase/client"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
    const supabase = createClient()

    try {
        const { email, password, full_name } = await request.json()

        // 1. Verify system is indeed empty
        const { count } = await supabase
            .from('employees')
            .select('*', { count: 'exact', head: true })

        if (count && count > 0) {
            return NextResponse.json({ error: "System already setup" }, { status: 400 })
        }

        // 2. Sign up the user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        })

        if (authError) throw authError
        if (!authData.user) throw new Error("User creation failed")

        // 3. Get Super Admin role ID
        const { data: roleData, error: roleError } = await supabase
            .from('app_roles')
            .select('id')
            .eq('name', 'Super Admin')
            .single()

        if (roleError) throw new Error("Super Admin role not found. Please ensure migrations are run.")

        // 4. Create Employee record as Super Admin
        const { error: empError } = await supabase
            .from('employees')
            .insert({
                user_id: authData.user.id,
                first_name: full_name.split(' ')[0] || 'Admin',
                last_name: full_name.split(' ').slice(1).join(' ') || 'User',
                email: email,
                role_id: roleData.id,
                status: 'Active',
                joining_date: new Date().toISOString().split('T')[0],
            })

        if (empError) throw empError

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Setup Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
