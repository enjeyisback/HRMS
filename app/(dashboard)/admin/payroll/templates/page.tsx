"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { SalaryTemplate, Employee } from "@/types"
import { SalaryTemplateForm } from "@/components/payroll/salary-template-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Loader2, Layers, Trash2, Users } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function SalaryTemplatesPage() {
    const [loading, setLoading] = useState(true)
    const [templates, setTemplates] = useState<SalaryTemplate[]>([])
    const [employees, setEmployees] = useState<Employee[]>([])
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
    const [assigningTemplate, setAssigningTemplate] = useState<SalaryTemplate | null>(null)
    const [bulkLoading, setBulkLoading] = useState(false)

    const fetchTemplates = async () => {
        setLoading(true)
        const supabase = createClient()
        const { data } = await supabase
            .from('salary_templates')
            .select(`
                *,
                components:salary_template_components(*)
            `)
        setTemplates(data || [])
        setLoading(false)
    }

    const fetchEmployees = async () => {
        const supabase = createClient()
        const { data } = await supabase.from('employees').select('id, first_name, last_name, employee_code, department_id, departments(name)')
        setEmployees((data as any) || [])
    }

    useEffect(() => {
        fetchTemplates()
        fetchEmployees()
    }, [])

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this template?")) return
        const supabase = createClient()
        await supabase.from('salary_templates').delete().eq('id', id)
        fetchTemplates()
    }

    const handleBulkAssign = async () => {
        if (!assigningTemplate || selectedEmployees.length === 0) return

        setBulkLoading(true)
        const supabase = createClient()

        try {
            // This is a simplified bulk assign: it takes template component values and applies to employees
            // In a real app, calculation logic (PF/ESIC) would be triggered here too.
            // For now, let's just insert the assignment records.

            for (const empId of selectedEmployees) {
                // 1. Calculate totals from template
                let gross = 0
                let deductions = 0

                // Note: Standard logic would require knowing 'Basic' to calculate percentage components.
                // For bulk assign via template, we'll assume the template has fixed amounts or standard percentages.
                // This is a complex area - for this MVP, we will only assign the components.

                const { data: assignment, error: assignError } = await supabase
                    .from('salary_assignments')
                    .upsert({
                        employee_id: empId,
                        effective_from: new Date().toISOString().split('T')[0],
                        gross_salary: 0, // Should be calculated
                        total_deductions: 0,
                        net_salary: 0,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'employee_id' })
                    .select().single()

                if (assignError) throw assignError

                await supabase.from('salary_assignment_components').delete().eq('assignment_id', assignment.id)

                if (assigningTemplate.components) {
                    const inserts = assigningTemplate.components.map(tc => ({
                        assignment_id: assignment.id,
                        component_id: tc.component_id,
                        amount: tc.default_amount // Simple copy
                    }))
                    await supabase.from('salary_assignment_components').insert(inserts)
                }
            }

            alert(`Assigned template to ${selectedEmployees.length} employees. Please review individual assignments to finalize calculations.`);
            setAssigningTemplate(null);
            setSelectedEmployees([]);
        } catch (error: any) {
            alert("Error: " + error.message)
        } finally {
            setBulkLoading(false)
        }
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight">Salary Templates</h2>
                    <p className="text-muted-foreground">Standard structures for different roles.</p>
                </div>
                <SalaryTemplateForm onSuccess={fetchTemplates} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : templates.map(template => (
                    <Card key={template.id}>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center justify-between">
                                {template.name}
                                <div className="flex gap-2">
                                    <SalaryTemplateForm template={template} onSuccess={fetchTemplates} />
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)} className="text-red-500 h-8 w-8">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardTitle>
                            <CardDescription>{template.description || "No description"}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm space-y-2 mb-4">
                                <p className="text-muted-foreground italic">{template.components?.length || 0} Components defined</p>
                            </div>

                            <Dialog onOpenChange={(open) => !open && setAssigningTemplate(null)}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="w-full" onClick={() => setAssigningTemplate(template)}>
                                        <Users className="h-4 w-4 mr-2" />
                                        Batch Assign
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px]">
                                    <DialogHeader>
                                        <DialogTitle>Assign Template: {template.name}</DialogTitle>
                                        <CardDescription>Select employees to apply this template to.</CardDescription>
                                    </DialogHeader>

                                    <div className="space-y-4 py-4">
                                        <div className="border rounded-md max-h-[300px] overflow-y-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-[50px]">
                                                            <Checkbox
                                                                checked={selectedEmployees.length === employees.length}
                                                                onCheckedChange={(checked) => setSelectedEmployees(checked ? employees.map(e => e.id) : [])}
                                                            />
                                                        </TableHead>
                                                        <TableHead>Employee</TableHead>
                                                        <TableHead>Department</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {employees.map(emp => (
                                                        <TableRow key={emp.id}>
                                                            <TableCell>
                                                                <Checkbox
                                                                    checked={selectedEmployees.includes(emp.id)}
                                                                    onCheckedChange={(checked) => {
                                                                        setSelectedEmployees(prev => checked ? [...prev, emp.id] : prev.filter(id => id !== emp.id))
                                                                    }}
                                                                />
                                                            </TableCell>
                                                            <TableCell className="font-medium">
                                                                {emp.first_name} {emp.last_name}
                                                                <p className="text-[10px] text-muted-foreground">{emp.employee_code}</p>
                                                            </TableCell>
                                                            <TableCell className="text-xs">{(emp as any).departments?.name}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        <Button className="w-full" disabled={bulkLoading || selectedEmployees.length === 0} onClick={handleBulkAssign}>
                                            {bulkLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Assign to {selectedEmployees.length} Employees
                                        </Button>
                                        <p className="text-[10px] text-center text-muted-foreground">
                                            Warning: This will overwrite existing component values for these employees.
                                        </p>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {templates.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-muted/10 text-center">
                    <Layers className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold">No Templates Yet</h3>
                    <p className="text-muted-foreground max-w-sm mb-6">Create salary templates to quickly assign standard earning and deduction structures to groups of employees.</p>
                    <SalaryTemplateForm onSuccess={fetchTemplates} />
                </div>
            )}
        </div>
    )
}
