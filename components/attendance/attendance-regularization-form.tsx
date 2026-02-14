"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Loader2, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export function AttendanceRegularizationForm() {
    const { user } = useAuth()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [date, setDate] = useState<Date>()
    const [checkIn, setCheckIn] = useState("")
    const [checkOut, setCheckOut] = useState("")
    const [reason, setReason] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !date || !reason) return
        setLoading(true)
        const supabase = createClient()

        try {
            const { data: emp } = await supabase.from('employees').select('id').eq('user_id', user.id).single()
            if (!emp) throw new Error("Employee record not found")

            // Format times (combine with date)
            const dateStr = format(date, 'yyyy-MM-dd')
            const checkInTime = checkIn ? `${dateStr}T${checkIn}:00Z` : null
            const checkOutTime = checkOut ? `${dateStr}T${checkOut}:00Z` : null

            const { error } = await supabase.from('attendance_regularization').insert({
                employee_id: emp.id,
                requested_date: dateStr,
                check_in_time: checkInTime,
                check_out_time: checkOutTime,
                reason,
                status: 'Pending'
            })

            if (error) throw error
            alert("Regularization request submitted successfully")
            setOpen(false)
            // Reset form
            setDate(undefined)
            setCheckIn("")
            setCheckOut("")
            setReason("")
        } catch (err: any) {
            console.error("Error submitting regularization:", err)
            alert("Failed to submit: " + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">Request Regularization</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Attendance Regularization</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Missed Date</Label>
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
                                    onSelect={setDate}
                                    disabled={(d) => d > new Date()}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Correct Check-In</Label>
                            <Input
                                type="time"
                                value={checkIn}
                                onChange={(e) => setCheckIn(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Correct Check-Out</Label>
                            <Input
                                type="time"
                                value={checkOut}
                                onChange={(e) => setCheckOut(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Reason</Label>
                        <Textarea
                            placeholder="Why did you miss marking attendance?"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading || !date || !reason}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Submit Request
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
