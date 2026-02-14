"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { SalaryComponent } from "@/types"
import { SalaryComponentForm } from "@/components/payroll/salary-component-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Settings2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SalaryComponentsPage() {
    const [loading, setLoading] = useState(true)
    const [components, setComponents] = useState<SalaryComponent[]>([])

    const fetchComponents = async () => {
        setLoading(true)
        const supabase = createClient()
        const { data, error } = await supabase
            .from('salary_components')
            .select('*')
            .order('type', { ascending: false })
            .order('name')

        if (error) console.error("Error fetching components:", error)
        else setComponents(data || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchComponents()
    }, [])

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this component? This may affect existing salary structures.")) return

        const supabase = createClient()
        const { error } = await supabase.from('salary_components').delete().eq('id', id)

        if (error) alert("Error deleting: " + error.message)
        else fetchComponents()
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight">Salary Components</h2>
                    <p className="text-muted-foreground">Manage Earnings, Deductions, and Statutory heads.</p>
                </div>
                <SalaryComponentForm onSuccess={fetchComponents} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings2 className="h-5 w-5" />
                        Component Master
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Component Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Calculation</TableHead>
                                        <TableHead>Taxable</TableHead>
                                        <TableHead>Statutory</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {components.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                No components found. Add your first earning or deduction.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        components.map((comp) => (
                                            <TableRow key={comp.id}>
                                                <TableCell className="font-medium text-blue-600">{comp.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant={comp.type === 'Earning' ? 'default' : 'destructive'}>
                                                        {comp.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {comp.calculation_method}
                                                        {comp.calculation_method !== 'Fixed' && (
                                                            <span className="ml-1 text-muted-foreground">
                                                                ({comp.value_percentage}%)
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {comp.is_taxable ? (
                                                        <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Yes</Badge>
                                                    ) : (
                                                        <Badge variant="outline">No</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {comp.is_statutory ? (
                                                        <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">
                                                            {comp.statutory_type}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <SalaryComponentForm component={comp} onSuccess={fetchComponents} />
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-600"
                                                            onClick={() => handleDelete(comp.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
