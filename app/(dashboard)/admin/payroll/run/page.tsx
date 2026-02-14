import { Separator } from "@/components/ui/separator"
import { RunPayrollDashboard } from "@/components/payroll/run-payroll-dashboard"

export default function RunPayrollPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Run Payroll</h2>
            </div>
            <Separator />
            <RunPayrollDashboard />
        </div>
    )
}
