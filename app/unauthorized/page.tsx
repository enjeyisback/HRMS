import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"

export default function UnauthorizedPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
            <h1 className="text-4xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-6 max-w-md">
                You do not have the necessary permissions to access this page.
                Please contact your administrator if you believe this is an error.
            </p>
            <div className="flex gap-4">
                <Button asChild variant="outline">
                    <Link href="/dashboard">Return to Dashboard</Link>
                </Button>
            </div>
        </div>
    )
}
