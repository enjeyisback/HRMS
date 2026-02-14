import { Separator } from "@/components/ui/separator"
import { PermissionMatrix } from "@/components/rbac/permission-matrix"

export default function RBACPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Access Control</h2>
                    <p className="text-muted-foreground">Define and manage roles and their associated permissions.</p>
                </div>
            </div>
            <Separator />
            <PermissionMatrix />
        </div>
    )
}
