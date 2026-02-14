"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Employee, SalaryComponent, SalaryAssignment } from "@/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Loader2, Save, Calculator, ReceiptText } from "lucide-react"
import { calculatePF, calculateESIC, calculatePT, formatCurrency } from "@/lib/payroll-utils"
import { Separator } from "@/components/ui/separator"

export function SalaryAssignmentForm() {
    const [loading, setLoading] = useState(false)
    const [employees, setEmployees] = useState<Employee[]>([])
    const [components, setComponents] = useState<SalaryComponent[]>([])

    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("")
    const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0])
    const [componentValues, setComponentValues] = useState<Record<string, number>>({})

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()
            const { data: emps } = await supabase.from('employees').select('id, first_name, last_name, employee_code')
            const { data: comps } = await supabase.from('salary_components').select('*').eq('is_active', true)

            setEmployees((emps as any) || [])
            setComponents(comps || [])
        }
        fetchData()
    }, [])

    const handleComponentChange = (id: string, value: string) => {
        setComponentValues(prev => ({
            ...prev,
            [id]: parseFloat(value) || 0
        }))
    }

    // Calculations
    const calculations = useMemo(() => {
        let basic = 0
        let earnings = 0
        let deductions = 0

        // Find Basic component id
        const basicComp = components.find(c => c.name.toLowerCase() === 'basic' || c.name.toLowerCase() === 'basic pay')
        basic = basicComp ? (componentValues[basicComp.id] || 0) : 0

        // 1st Pass: Fixed amount earnings to get partial Gross
        components.filter(c => c.type === 'Earning' && c.calculation_method === 'Fixed').forEach(c => {
            earnings += componentValues[c.id] || 0
        })

        // 2nd Pass: % of Basic earnings
        components.filter(c => c.type === 'Earning' && c.calculation_method === '% of Basic').forEach(c => {
            const val = (basic * (c.value_percentage || 0)) / 100
            earnings += val
        })

        const gross = earnings

        // Predictions for Statutory
        components.filter(c => c.is_statutory).forEach(c => {
            if (c.statutory_type === 'PF') {
                const pfVal = calculatePF(basic)
                deductions += pfVal
            } else if (c.statutory_type === 'ESIC') {
                const esicVal = calculateESIC(gross)
                deductions += esicVal
            } else if (c.statutory_type === 'PT') {
                const ptVal = calculatePT(gross)
                deductions += ptVal
            }
        })

        // Other deductions
        components.filter(c => c.type === 'Deduction' && !c.is_statutory).forEach(c => {
            deductions += componentValues[c.id] || 0
        })

        return {
            basic,
            gross,
            totalDeductions: deductions,
            netSalary: gross - deductions
        }
    }, [components, componentValues])

    const handleSave = async () => {
        if (!selectedEmployeeId) return alert("Select an employee")

        setLoading(true)
        const supabase = createClient()

        try {
            // 1. Create/Update Assignment
            const { data: assignment, error: assignError } = await supabase
                .from('salary_assignments')
                .upsert({
                    employee_id: selectedEmployeeId,
                    effective_from: effectiveFrom,
                    gross_salary: calculations.gross,
                    total_deductions: calculations.totalDeductions,
                    net_salary: calculations.netSalary,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'employee_id' })
                .select()
                .single()

            if (assignError) throw assignError

            // 2. Delete existing component mappings for this assignment
            await supabase.from('salary_assignment_components').delete().eq('assignment_id', assignment.id)

            // 3. Insert new component values
            const compInserts = Object.entries(componentValues).map(([compId, amount]) => ({
                assignment_id: assignment.id,
                component_id: compId,
                amount: amount
            }))

            if (compInserts.length > 0) {
                const { error: compError } = await supabase.from('salary_assignment_components').insert(compInserts)
                if (compError) throw compError
            }

            alert("Salary structure assigned successfully!")
        } catch (error: any) {
            console.error("Error saving assignment:", error)
            alert("Error: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Salary Assignment
                    </CardTitle>
                    <CardDescription>Define earnings and deductions for the employee.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Select Employee</Label>
                            <Select onValueChange={setSelectedEmployeeId} value={selectedEmployeeId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select employee" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map(emp => (
                                        <SelectItem key={emp.id} value={emp.id}>
                                            {emp.first_name} {emp.last_name} ({emp.employee_code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Effective From</Label>
                            <Input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <h3 className="font-semibold text-emerald-600">Earnings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {components.filter(c => c.type === 'Earning').map(comp => (
                                <div key={comp.id} className="space-y-1">
                                    <Label className="text-xs">{comp.name} {comp.calculation_method !== 'Fixed' ? `(${comp.value_percentage}%)` : ''}</Label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        disabled={comp.calculation_method !== 'Fixed'}
                                        value={comp.calculation_method === 'Fixed' ? (componentValues[comp.id] || "") : (comp.calculation_method === '% of Basic' ? (calculations.basic * (comp.value_percentage || 0)) / 100 : "")}
                                        onChange={(e) => handleComponentChange(comp.id, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-red-600">Deductions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {components.filter(c => c.type === 'Deduction').map(comp => (
                                <div key={comp.id} className="space-y-1">
                                    <Label className="text-xs">{comp.name}</Label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        disabled={comp.is_statutory}
                                        value={comp.is_statutory ? (comp.statutory_type === 'PF' ? calculatePF(calculations.basic) : (comp.statutory_type === 'ESIC' ? calculateESIC(calculations.gross) : calculatePT(calculations.gross))) : (componentValues[comp.id] || "")}
                                        onChange={(e) => handleComponentChange(comp.id, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button className="w-full" disabled={loading} onClick={handleSave}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Salary Structure
                    </Button>
                </CardContent>
            </Card>

            <Card className="bg-muted/30 border-dashed">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ReceiptText className="h-5 w-5" />
                        Salary Preview
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Monthly Gross Salary</span>
                            <span className="font-bold">{formatCurrency(calculations.gross)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Deductions</span>
                            <span className="font-bold text-red-600">-{formatCurrency(calculations.totalDeductions)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                            <span>Net Salary</span>
                            <span className="text-emerald-600">{formatCurrency(calculations.netSalary)}</span>
                        </div>
                    </div>

                    <div className="p-4 rounded-lg bg-background border space-y-2 text-xs">
                        <p className="font-bold uppercase tracking-wider text-muted-foreground">Breakdown</p>
                        <div className="flex justify-between">
                            <span>Basic Pay</span>
                            <span>{formatCurrency(calculations.basic)}</span>
                        </div>
                        {components.filter(c => c.is_statutory).map(c => (
                            <div key={c.id} className="flex justify-between text-red-500">
                                <span>{c.name}</span>
                                <span>-{formatCurrency(c.statutory_type === 'PF' ? calculatePF(calculations.basic) : (c.statutory_type === 'ESIC' ? calculateESIC(calculations.gross) : calculatePT(calculations.gross)))}</span>
                            </div>
                        ))}
                    </div>

                    <p className="text-[10px] text-muted-foreground italic">
                        * Statutory deductions are calculated based on Indian compliance rules (PF 12%, ESIC 0.75%, Slab-based PT).
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
