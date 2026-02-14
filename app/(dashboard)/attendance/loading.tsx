import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function Loading() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <Skeleton className="h-10 w-[200px]" />
                <Skeleton className="h-10 w-[150px]" />
            </div>
            <Separator />

            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                <div className="md:col-span-1 lg:col-span-1 space-y-4">
                    <Card>
                        <CardHeader><Skeleton className="h-5 w-[150px]" /></CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><Skeleton className="h-5 w-[150px]" /></CardHeader>
                        <CardContent><Skeleton className="h-32 w-full" /></CardContent>
                    </Card>
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                    <Card className="h-[600px]">
                        <CardHeader><Skeleton className="h-5 w-[200px]" /></CardHeader>
                        <CardContent><Skeleton className="h-full w-full" /></CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
