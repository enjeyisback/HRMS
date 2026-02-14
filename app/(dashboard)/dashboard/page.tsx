"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { AdminDashboard } from "@/components/dashboard/AdminDashboard"
import { EmployeeDashboard } from "@/components/dashboard/EmployeeDashboard"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function DashboardPage() {
    const { user, loading } = useAuth()
    const [role, setRole] = useState<string | null>(null) // 'admin' or 'employee'
    // To properly fetch role, we'd need to query the employees table.
    // For this demo, we'll default to admin if no specific logic exists, or check metadata.

    useEffect(() => {
        const fetchRole = async () => {
            if (!user) return
            const supabase = createClient()
            const { data, error } = await supabase
                .from('employees')
                .select('designation_id') // We might infer role from designation or a specific role column if we added one (we didn't explicitly add 'role' to employees table in schema, but we can assume logic or add it)
                .eq('user_id', user.id)
                .single()

            // Mocking role for now since we don't have data
            // If email contains 'admin', treat as admin
            if (user.email?.includes('admin')) {
                setRole('admin')
            } else {
                setRole('employee') // Default to employee view
            }
        }
        fetchRole()
    }, [user])

    if (loading) return <div>Loading...</div>

    return (
        <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            </div>

            {/* Role-based rendering */}
            {role === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />}

        </div>
    )
}
