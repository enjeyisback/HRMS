"use client"

import { ReactNode, useEffect, useState } from "react"
import { PermissionCode, UserPermissions, getUserPermissions, hasPermission } from "@/lib/rbac"

interface ProtectedContentProps {
    permission: PermissionCode
    children: ReactNode
    fallback?: ReactNode
}

export function ProtectedContent({ permission, children, fallback = null }: ProtectedContentProps) {
    const [userPerms, setUserPerms] = useState<UserPermissions | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchPerms() {
            const perms = await getUserPermissions()
            setUserPerms(perms)
            setLoading(false)
        }
        fetchPerms()
    }, [])

    if (loading) return null // Or a small skeleton

    if (hasPermission(userPerms, permission)) {
        return <>{children}</>
    }

    return <>{fallback}</>
}
