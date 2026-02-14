import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function Loading() {
    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-6">
                <Skeleton className="h-10 w-[200px]" />
                <Skeleton className="h-10 w-[150px]" />
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead><Skeleton className="h-4 w-[100px]" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-[150px]" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-[200px]" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-[100px]" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-[80px]" /></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
