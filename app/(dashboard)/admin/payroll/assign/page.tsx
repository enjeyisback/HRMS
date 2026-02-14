"use client"

import { Separator } from "@/components/ui/separator"
import { SalaryAssignmentForm } from "@/components/payroll/salary-assignment-form"

export default function SalaryAssignmentPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Salary Assignment</h2>
            </div>
            <Separator />
            <SalaryAssignmentForm />
        </div>
    )
}
