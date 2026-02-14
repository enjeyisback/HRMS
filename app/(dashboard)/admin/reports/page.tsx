"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { EmployeeReports } from "@/components/reports/employee-reports"
import { AttendanceReports } from "@/components/reports/attendance-reports"
import { LeaveReports } from "@/components/reports/leave-reports"
import { PayrollReports } from "@/components/reports/payroll-reports"
import { FileBarChart, Users, Calendar, Plane, CreditCard } from "lucide-react"

export default function ReportsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
                    <p className="text-muted-foreground">Comprehensive insights into HR, Attendance, Payroll, and more.</p>
                </div>
            </div>
            <Separator />

            <Tabs defaultValue="employee" className="space-y-4">
                <TabsList className="grid grid-cols-4 w-full lg:w-[600px]">
                    <TabsTrigger value="employee" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Employee
                    </TabsTrigger>
                    <TabsTrigger value="attendance" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Attendance
                    </TabsTrigger>
                    <TabsTrigger value="leave" className="flex items-center gap-2">
                        <Plane className="h-4 w-4" />
                        Leave
                    </TabsTrigger>
                    <TabsTrigger value="payroll" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Payroll
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="employee" className="space-y-4">
                    <EmployeeReports />
                </TabsContent>
                <TabsContent value="attendance" className="space-y-4">
                    <AttendanceReports />
                </TabsContent>
                <TabsContent value="leave" className="space-y-4">
                    <LeaveReports />
                </TabsContent>
                <TabsContent value="payroll" className="space-y-4">
                    <PayrollReports />
                </TabsContent>
            </Tabs>
        </div>
    )
}
