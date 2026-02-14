"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { EmployeeForm } from "./employee-form"
import { Plus } from "lucide-react"
import { useState } from "react"

export function AddEmployeeDialog() {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Employee
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Add New Employee</DialogTitle>
                    <DialogDescription>
                        Enter the employee's details across the sections below.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 p-6 pt-0 overflow-y-auto">
                    <EmployeeForm onClose={() => setOpen(false)} />
                </div>
            </DialogContent>
        </Dialog>
    )
}
