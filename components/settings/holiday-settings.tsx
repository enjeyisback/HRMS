"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, CalendarPlus, Trash2, PartyPopper } from "lucide-react"

export function HolidaySettings() {
    const [holidays, setHolidays] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const [newName, setNewName] = useState("")
    const [newDate, setNewDate] = useState("")

    const fetchHolidays = async () => {
        const supabase = createClient()
        const { data } = await supabase.from('holidays').select('*').order('date', { ascending: true })
        setHolidays(data || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchHolidays()
    }, [])

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        setAdding(true)
        const supabase = createClient()

        const { error } = await supabase.from('holidays').insert({
            name: newName,
            date: newDate
        })

        if (error) {
            alert("Error: " + error.message)
        } else {
            setNewName("")
            setNewDate("")
            fetchHolidays()
        }
        setAdding(false)
    }

    const handleDelete = async (id: string) => {
        const supabase = createClient()
        await supabase.from('holidays').delete().eq('id', id)
        fetchHolidays()
    }

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PartyPopper className="h-5 w-5 text-orange-500" />
                    Holiday Calendar
                </CardTitle>
                <CardDescription>Configure public holidays and festival leaves.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <form onSubmit={handleAdd} className="flex items-end gap-4 bg-muted/30 p-4 rounded-lg">
                    <div className="grid gap-2 flex-1">
                        <Label>Holiday Name</Label>
                        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Diwali" required />
                    </div>
                    <div className="grid gap-2">
                        <Label>Date</Label>
                        <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required />
                    </div>
                    <Button type="submit" disabled={adding}>
                        {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4 mr-2" />}
                        Add
                    </Button>
                </form>

                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Holiday</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="w-[100px]">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {holidays.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No holidays configured.</TableCell>
                                </TableRow>
                            ) : (
                                holidays.map((h) => (
                                    <TableRow key={h.id}>
                                        <TableCell className="font-medium">{h.name}</TableCell>
                                        <TableCell>{new Date(h.date).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(h.id)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
