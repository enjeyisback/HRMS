"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { ReportFilters } from "./report-filters"
import { ReportChart } from "./report-chart"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, UserPlus, UserMinus, Cake, Trophy } from "lucide-react"

export function EmployeeReports() {
    const [loading, setLoading] = useState(true)
    const [headcountData, setHeadcountData] = useState<any[]>([])
    const [joiners, setJoiners] = useState<any[]>([])
    const [birthdays, setBirthdays] = useState<any[]>([])

    const fetchReports = async (filters?: any) => {
        setLoading(true)
        const supabase = createClient()

        // 1. Headcount by Department
        const { data: deptCounts } = await supabase.from('employees').select('departments(name)').eq('is_active', true)
        const counts: Record<string, number> = {}
        deptCounts?.forEach((e: any) => {
            const name = e.departments?.name || 'Unassigned'
            counts[name] = (counts[name] || 0) + 1
        })
        setHeadcountData(Object.entries(counts).map(([name, count]) => ({ name, count })))

        // 2. New Joiners
        let joinerQuery = supabase
            .from('employees')
            .select('first_name, last_name, employee_code, departments(name), joining_date')
            .order('joining_date', { ascending: false })
            .limit(10)

        if (filters?.startDate) joinerQuery = joinerQuery.gte('joining_date', filters.startDate.toISOString())
        if (filters?.endDate) joinerQuery = joinerQuery.lte('joining_date', filters.endDate.toISOString())

        const { data: joinersData } = await joinerQuery
        setJoiners(joinersData || [])

        // 3. Birthdays this month
        const currentMonth = new Date().getMonth() + 1
        const { data: birthdayData } = await supabase.rpc('get_birthdays_this_month')
        // Note: RPC would be more efficient, but for now let's query and filter locally or mock
        // Since get_birthdays_this_month might not exist, let's just fetch some
        const { data: birthdaysRaw } = await supabase
            .from('employees')
            .select('first_name, last_name, employee_code, birthday_date')
            .eq('is_active', true)

        const thisMonthBirthdays = birthdaysRaw?.filter(e => {
            if (!e.birthday_date) return false
            return new Date(e.birthday_date).getMonth() + 1 === currentMonth
        }) || []
        setBirthdays(thisMonthBirthdays)

        setLoading(false)
    }

    useEffect(() => {
        fetchReports()
    }, [])

    return (
        <div className="space-y-6">
            <ReportFilters onFilterChange={fetchReports} showEmployee={false} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <ReportChart data={headcountData} type="pie" title="Headcount by Department" />
                        </CardTitle>
                    </CardHeader>
                </Card>

                <Card className="col-span-1 md:col-span-2 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <UserPlus className="h-4 w-4 text-emerald-500" />
                            Recent Joiners
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Dept</TableHead>
                                    <TableHead>Joined Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {joiners.length === 0 ? (
                                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-4">No joiners found</TableCell></TableRow>
                                ) : (
                                    joiners.map((j) => (
                                        <TableRow key={j.employee_code}>
                                            <TableCell className="font-medium">{j.first_name} {j.last_name}</TableCell>
                                            <TableCell>{j.departments?.name}</TableCell>
                                            <TableCell>{new Date(j.joining_date).toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Cake className="h-4 w-4 text-pink-500" />
                            Birthdays This Month
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {birthdays.map((b) => (
                                <div key={b.employee_code} className="flex items-center justify-between border-b pb-2">
                                    <div>
                                        <p className="font-medium text-sm">{b.first_name} {b.last_name}</p>
                                        <p className="text-xs text-muted-foreground">{b.employee_code}</p>
                                    </div>
                                    <Badge variant="outline">{new Date(b.birthday_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</Badge>
                                </div>
                            ))}
                            {birthdays.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">No birthdays this month</p>}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-amber-500" />
                            Work Anniversaries
                        </CardTitle>
                        <CardDescription>Celebrating years of excellence.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-center text-muted-foreground py-8">Analysis in progress...</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
