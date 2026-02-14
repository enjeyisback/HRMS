"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ApplyLeaveForm } from "@/components/leave/apply-leave-form"
import { LeaveRequestList } from "@/components/leave/leave-request-list"

export default function LeaveDashboardPage() {
    const [open, setOpen] = useState(false)
    // Key to force refresh list after submission
    const [refreshKey, setRefreshKey] = useState(0)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">My Leaves</h2>
                    <p className="text-muted-foreground">Manage your leave applications and check balances.</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Apply for Leave
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Apply for Leave</DialogTitle>
                            <DialogDescription>
                                Submit a new leave request. Ensure you check your available balance.
                            </DialogDescription>
                        </DialogHeader>
                        <ApplyLeaveForm onSuccess={() => { setOpen(false); setRefreshKey(k => k + 1); }} />
                    </DialogContent>
                </Dialog>
            </div>

            {/* In a real app, we'd probably show Balance Cards here first */}

            <Card>
                <CardHeader>
                    <CardTitle>Leave History</CardTitle>
                </CardHeader>
                <CardContent>
                    <LeaveRequestList key={refreshKey} />
                </CardContent>
            </Card>
        </div>
    )
}
