"use client"

import { ManualAttendance } from "@/components/attendance/manual-attendance"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, FileText, CheckCircle2 } from "lucide-react"

export default function AdminAttendancePage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Attendance Management</h2>
            </div>
            <Separator />

            <Tabs defaultValue="manual" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="manual" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Manual Marking
                    </TabsTrigger>
                    <TabsTrigger value="approvals" className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Regularization Approvals
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Reports
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="space-y-4">
                    <ManualAttendance />
                </TabsContent>

                <TabsContent value="approvals" className="space-y-4">
                    <CardPlaceholder title="Regularization Requests" description="Manage and approve attendance correction requests from employees." />
                </TabsContent>

                <TabsContent value="reports" className="space-y-4">
                    <CardPlaceholder title="Attendance Reports" description="Generate and export detailed attendance reports." />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function CardPlaceholder({ title, description }: { title: string, description: string }) {
    return (
        <div className="flex items-center justify-center h-[400px] border-2 border-dashed rounded-lg bg-muted/10 p-12 text-center">
            <div className="space-y-2">
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="text-muted-foreground">{description}</p>
                <p className="text-xs text-muted-foreground/50 lowercase italic">Feature implementation in progress...</p>
            </div>
        </div>
    )
}
