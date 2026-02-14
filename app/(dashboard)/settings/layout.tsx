"use client"

import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePathname, useRouter } from "next/navigation"

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()

    // Map path to tab value
    const getTabValue = () => {
        if (pathname.includes("/profile")) return "profile"
        if (pathname.includes("/email")) return "email"
        if (pathname.includes("/logs")) return "logs"
        if (pathname.includes("/export")) return "export"
        return "company"
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                    <p className="text-muted-foreground">Manage your organization, system preferences, and personal profile.</p>
                </div>
            </div>
            <Separator />
            <Tabs value={getTabValue()} onValueChange={(val) => {
                const path = val === "company" ? "" : `/${val}`
                router.push(`/settings${path}`)
            }} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="company">Company Profile</TabsTrigger>
                    <TabsTrigger value="profile">My Profile</TabsTrigger>
                    <TabsTrigger value="email">Email & Notification</TabsTrigger>
                    <TabsTrigger value="logs">Audit Logs</TabsTrigger>
                    <TabsTrigger value="export">Backup & Export</TabsTrigger>
                </TabsList>
                <div className="mt-4">
                    {children}
                </div>
            </Tabs>
        </div>
    )
}
