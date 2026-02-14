import { AttendanceActions } from "@/components/attendance/attendance-actions"
import { AttendanceCalendar } from "@/components/attendance/attendance-calendar"
import { AttendanceRegularizationForm } from "@/components/attendance/attendance-regularization-form"
import { AttendanceRegularizationList } from "@/components/attendance/attendance-regularization-list"
import { Separator } from "@/components/ui/separator"

export default function AttendancePage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Attendance</h2>
                <div className="flex items-center gap-2">
                    <AttendanceRegularizationForm />
                </div>
            </div>
            <Separator />

            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                <div className="md:col-span-1 lg:col-span-1 space-y-4">
                    <AttendanceActions />
                    <AttendanceRegularizationList />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                    <AttendanceCalendar />
                </div>
            </div>
        </div>
    )
}
