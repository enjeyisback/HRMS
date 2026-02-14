"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download, Filter } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export function ReportFilters({
    onFilterChange,
    showDateRange = true,
    showDepartment = true,
    showEmployee = false
}: {
    onFilterChange: (filters: any) => void,
    showDateRange?: boolean,
    showDepartment?: boolean,
    showEmployee?: boolean
}) {
    const [departments, setDepartments] = useState<any[]>([])
    const [employees, setEmployees] = useState<any[]>([])
    const [date, setDate] = useState<{ from: Date; to: Date } | undefined>()
    const [deptId, setDeptId] = useState<string>("all")
    const [empId, setEmpId] = useState<string>("all")

    useEffect(() => {
        const fetchMetadata = async () => {
            const supabase = createClient()
            const { data: depts } = await supabase.from('departments').select('id, name')
            setDepartments(depts || [])

            if (showEmployee) {
                const { data: emps } = await supabase.from('employees').select('id, first_name, last_name').eq('is_active', true)
                setEmployees(emps || [])
            }
        }
        fetchMetadata()
    }, [showEmployee])

    const applyFilters = () => {
        onFilterChange({
            startDate: date?.from,
            endDate: date?.to,
            departmentId: deptId,
            employeeId: empId
        })
    }

    return (
        <div className="flex flex-wrap gap-4 items-end bg-muted/30 p-4 rounded-lg border">
            {showDateRange && (
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Date Range</label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-[260px] justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                    date.to ? (
                                        <>
                                            {format(date.from, "LLL dd, y")} -{" "}
                                            {format(date.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(date.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Pick a date range</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date as any}
                                onSelect={setDate as any}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            )}

            {showDepartment && (
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Department</label>
                    <Select value={deptId} onValueChange={setDeptId}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Departments" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            {departments.map((d) => (
                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {showEmployee && (
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Employee</label>
                    <Select value={empId} onValueChange={setEmpId}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select Employee" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Employees</SelectItem>
                            {employees.map((e) => (
                                <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <Button onClick={applyFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
            </Button>
        </div>
    )
}
