"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Loader2, Users, CheckSquare, Square } from "lucide-react"
import { cn } from "@/lib/utils"
import { Employee } from "@/types"
import { ScrollArea } from "@/components/ui/scroll-area"

export function ManualAttendance() {
    const [date, setDate] = useState<Date>(new Date())
    const [employees, setEmployees] = useState<Employee[]>([])
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [status, setStatus] = useState<string>("Present")
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const fetchEmployees = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('employees')
                .select('*')
                .order('first_name', { ascending: true })
            setEmployees(data || [])
            setLoading(false)
        }
        fetchEmployees()
    }, [])

    const toggleSelectAll = () => {
        if (selectedIds.length === employees.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(employees.map(e => e.id))
        }
    }

    const toggleEmployee = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const handleSave = async () => {
        if (selectedIds.length === 0) return
        setSaving(true)
        const supabase = createClient()
        const dateStr = format(date, 'yyyy-MM-dd')

        try {
            const updates = selectedIds.map(id => ({
                employee_id: id,
                date: dateStr,
                status: status,
                updated_at: new Date().toISOString()
            }))

            // Bulk Upsert (requires UNIQUE constraint on [employee_id, date])
            const { error } = await supabase
                .from('attendance')
                .upsert(updates, { onConflict: 'employee_id, date' })

            if (error) throw error
            alert(`Successfully marked ${selectedIds.length} employees as ${status}`)
            setSelectedIds([])
        } catch (err: any) {
            console.error("Error saving manual attendance:", err)
            alert("Failed to save: " + err.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Manual Attendance Marking
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="space-y-2 flex-1">
                        <Label>Select Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={(d) => d && setDate(d)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2 w-full sm:w-[200px]">
                        <Label>Mark As</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Present">Present</SelectItem>
                                <SelectItem value="Absent">Absent</SelectItem>
                                <SelectItem value="Half-day">Half-day</SelectItem>
                                <SelectItem value="Holiday">Holiday</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b">
                        <Label className="text-base">Select Employees ({selectedIds.length})</Label>
                        <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
                            {selectedIds.length === employees.length ? (
                                <><Square className="h-4 w-4 mr-2" /> Deselect All</>
                            ) : (
                                <><CheckSquare className="h-4 w-4 mr-2" /> Select All</>
                            )}
                        </Button>
                    </div>

                    <ScrollArea className="h-[300px] border rounded-md p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {employees.map((emp) => (
                                <div
                                    key={emp.id}
                                    className={cn(
                                        "flex items-center space-x-2 p-2 rounded-lg transition-colors border",
                                        selectedIds.includes(emp.id) ? "bg-primary/5 border-primary/20" : "bg-card border-transparent"
                                    )}
                                >
                                    <Checkbox
                                        id={emp.id}
                                        checked={selectedIds.includes(emp.id)}
                                        onCheckedChange={() => toggleEmployee(emp.id)}
                                    />
                                    <Label
                                        htmlFor={emp.id}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 py-1"
                                    >
                                        {emp.first_name} {emp.last_name}
                                        <p className="text-[10px] text-muted-foreground mt-0.5">{emp.employee_code || "No Code"}</p>
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                <div className="flex justify-end pt-4">
                    <Button
                        size="lg"
                        onClick={handleSave}
                        disabled={saving || selectedIds.length === 0}
                        className="w-full sm:w-auto px-12"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            `Mark as ${status}`
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
