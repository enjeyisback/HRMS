"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Loader2, Download, Search, FileSpreadsheet } from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"

export function AttendanceReport() {
    const [loading, setLoading] = useState(false)
    const [reportData, setReportData] = useState<any[]>([])
    const [departments, setDepartments] = useState<any[]>([])

    const [filters, setFilters] = useState({
        startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
        departmentId: 'all'
    })

    useEffect(() => {
        const fetchDepts = async () => {
            const supabase = createClient()
            const { data } = await supabase.from('departments').select('*')
            setDepartments(data || [])
        }
        fetchDepts()
    }, [])

    const generateReport = async () => {
        setLoading(true)
        const supabase = createClient()

        try {
            // Fetch employees with attendance in range
            let query = supabase
                .from('employees')
                .select(`
                    id,
                    first_name,
                    last_name,
                    employee_code,
                    department_id,
                    departments(name),
                    attendance(*)
                `)

            if (filters.departmentId !== 'all') {
                query = query.eq('department_id', filters.departmentId)
            }

            const { data: employees, error } = await query

            if (error) throw error

            // Process data
            const processed = employees.map(emp => {
                const rangeAttendance = (emp.attendance as any[]).filter(a =>
                    a.date >= filters.startDate && a.date <= filters.endDate
                )

                // Safe access to departments (Supabase might return an object or array depending on query structure)
                const dept = Array.isArray(emp.departments) ? emp.departments[0] : emp.departments

                return {
                    name: `${emp.first_name} ${emp.last_name}`,
                    code: emp.employee_code,
                    department: dept?.name,
                    present: rangeAttendance.filter(a => a.status === 'Present').length,
                    halfDay: rangeAttendance.filter(a => a.status === 'Half-day').length,
                    absent: rangeAttendance.filter(a => a.status === 'Absent').length,
                    late: rangeAttendance.filter(a => a.late_coming).length,
                    totalDays: rangeAttendance.length
                }
            })

            setReportData(processed)
        } catch (err: any) {
            console.error("Error generating report:", err)
            alert("Failed to generate report: " + err.message)
        } finally {
            setLoading(false)
        }
    }

    const exportToCSV = () => {
        if (reportData.length === 0) return

        const headers = ["Employee Code", "Name", "Department", "Present", "Half-Day", "Absent", "Late Comings", "Total Days"]
        const csvContent = [
            headers.join(","),
            ...reportData.map(row => [
                row.code,
                row.name,
                row.department,
                row.present,
                row.halfDay,
                row.absent,
                row.late,
                row.totalDays
            ].join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `attendance_report_${filters.startDate}_to_${filters.endDate}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    Attendance Reports
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-muted/20 p-4 rounded-lg">
                    <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Department</Label>
                        <Select
                            value={filters.departmentId}
                            onValueChange={(val) => setFilters(prev => ({ ...prev, departmentId: val }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Departments" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {departments.map(d => (
                                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={generateReport} disabled={loading} className="w-full">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                        Generate
                    </Button>
                </div>

                {reportData.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <Button variant="outline" onClick={exportToCSV}>
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </Button>
                        </div>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Dept</TableHead>
                                        <TableHead className="text-center">Present</TableHead>
                                        <TableHead className="text-center">Absent</TableHead>
                                        <TableHead className="text-center">Half-Day</TableHead>
                                        <TableHead className="text-center">Late</TableHead>
                                        <TableHead className="text-center">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reportData.map((row, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium">
                                                {row.name}
                                                <p className="text-[10px] text-muted-foreground">{row.code}</p>
                                            </TableCell>
                                            <TableCell>{row.department}</TableCell>
                                            <TableCell className="text-center font-bold text-emerald-600">{row.present}</TableCell>
                                            <TableCell className="text-center font-bold text-red-600">{row.absent}</TableCell>
                                            <TableCell className="text-center font-bold text-yellow-600">{row.halfDay}</TableCell>
                                            <TableCell className="text-center font-bold text-orange-600">{row.late}</TableCell>
                                            <TableCell className="text-center font-semibold">{row.totalDays}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
