"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Calendar, Settings, LogOut, FileText, UserCheck, Plane, Layers, Play, History, BarChart4, ShieldAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProtectedContent } from "@/components/rbac/protected-content"

const textClass = "font-medium"

const routes = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
        color: "text-sky-500",
    },
    {
        label: "Employees",
        icon: Users,
        href: "/employees",
        color: "text-violet-500",
        permission: "employees.view"
    },
    {
        label: "Attendance",
        icon: UserCheck,
        href: "/attendance",
        color: "text-violet-500",
        permission: "attendance.view_own"
    },
    {
        label: "Leaves",
        icon: Plane,
        href: "/leaves",
        color: "text-orange-500",
        permission: "leave.view_own"
    },
    {
        label: "Payroll",
        icon: FileText,
        href: "/payroll",
        color: "text-orange-700",
        permission: "payroll.view_own"
    },
    {
        label: "Attendance Admin",
        icon: UserCheck,
        href: "/admin/attendance",
        color: "text-blue-500",
        permission: "attendance.view_all"
    },
    {
        label: "Salary Admin",
        icon: Settings,
        href: "/admin/payroll/components",
        color: "text-emerald-500",
        permission: "payroll.manage"
    },
    {
        label: "Salary Assign",
        icon: Users,
        href: "/admin/payroll/assign",
        color: "text-pink-500",
        permission: "payroll.manage"
    },
    {
        label: "Salary Templates",
        icon: Layers,
        href: "/admin/payroll/templates",
        color: "text-amber-500",
        permission: "payroll.manage"
    },
    {
        label: "Run Payroll",
        icon: Play,
        href: "/admin/payroll/run",
        color: "text-emerald-600",
        permission: "payroll.process"
    },
    {
        label: "Payroll History",
        icon: History,
        href: "/admin/payroll/history",
        color: "text-blue-600",
        permission: "payroll.view_all"
    },
    {
        label: "All Reports",
        icon: BarChart4,
        href: "/admin/reports",
        color: "text-purple-600",
        permission: "reports.view"
    },
    {
        label: "Leave Config",
        icon: Settings,
        href: "/admin/leaves/types",
        color: "text-emerald-500",
        permission: "leave.manage_types"
    },
    {
        label: "Access Control",
        icon: ShieldAlert,
        href: "/admin/rbac",
        color: "text-red-600",
        permission: "rbac.manage"
    },
    {
        label: "Settings",
        icon: Settings,
        href: "/settings",
        color: "text-slate-400",
    },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="space-y-4 py-4 flex flex-col h-full bg-slate-900 text-white">
            <div className="px-3 py-2 flex-1">
                <Link href="/dashboard" className="flex items-center pl-3 mb-14">
                    <div className="relative w-8 h-8 mr-4">
                        {/* Logo placeholder */}
                        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold">HR</div>
                    </div>
                    <h1 className="text-2xl font-bold">HRMS</h1>
                </Link>
                <div className="space-y-1">
                    {routes.map((route) => {
                        const content = (
                            <Link
                                key={route.href}
                                href={route.href}
                                className={cn(
                                    "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                                    pathname === route.href ? "text-white bg-white/10" : "text-zinc-400"
                                )}
                            >
                                <div className="flex items-center flex-1">
                                    <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                                    {route.label}
                                </div>
                            </Link>
                        )

                        if (route.permission) {
                            return (
                                <ProtectedContent key={route.href} permission={route.permission as any}>
                                    {content}
                                </ProtectedContent>
                            )
                        }

                        return content
                    })}
                </div>
            </div>
            <div className="px-3 py-2">
                {/* Logout or User Profile could go here */}
            </div>
        </div>
    )
}
