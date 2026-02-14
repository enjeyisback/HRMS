"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Loader2, Calendar as CalendarIcon, Upload, AlertCircle } from "lucide-react"
import { format, differenceInBusinessDays, differenceInDays, addDays, isWeekend } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { LeaveType, LeaveBalance } from "@/types"
import { useAuth } from "@/components/providers/auth-provider"

const leaveRequestSchema = z.object({
    leave_type_id: z.string().min(1, "Select a leave type"),
    date_range: z.object({
        from: z.date(),
        to: z.date(),
    }).refine(data => data.from <= data.to, { message: "End date cannot be before start date" }),
    reason: z.string().min(5, "Reason is required (min 5 chars)"),
    document: z.any().optional(), // File validation checks manually
})

type LeaveRequestFormValues = z.infer<typeof leaveRequestSchema>

export function ApplyLeaveForm({ onSuccess }: { onSuccess?: () => void }) {
    const router = useRouter()
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
    const [balances, setBalances] = useState<Record<string, LeaveBalance>>({})
    const [calculatedDays, setCalculatedDays] = useState(0)
    const [fileState, setFileState] = useState<File | null>(null)
    const [warning, setWarning] = useState<string | null>(null)

    // Fetch master data needed
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return
            const supabase = createClient()

            // 1. Fetch Leave Types
            const { data: types } = await supabase.from('leave_types').select(`*, leave_policies(*)`).eq('applicable_to', 'All') // Simplify gender check later

            // 2. Fetch Employee ID
            const { data: emp } = await supabase.from('employees').select('id, gender').eq('user_id', user.id).single()
            if (!emp) return

            // Filter types by gender if needed
            const validTypes = types?.filter(t => t.applicable_to === 'All' || t.applicable_to === emp.gender) || []
            setLeaveTypes(validTypes)

            // 3. Fetch Balances
            const currentYear = new Date().getFullYear()
            const { data: balData } = await supabase
                .from('leave_balances')
                .select('*')
                .eq('employee_id', emp.id)
                .eq('year', currentYear)

            const balMap: Record<string, LeaveBalance> = {}
            balData?.forEach((b: LeaveBalance) => {
                balMap[b.leave_type_id] = b
            })
            setBalances(balMap)
        }
        fetchData()
    }, [user])

    const form = useForm<LeaveRequestFormValues>({
        resolver: zodResolver(leaveRequestSchema),
    })

    // Calculate days when dates change
    const watchedDateRange = form.watch("date_range")
    const watchedType = form.watch("leave_type_id")

    useEffect(() => {
        if (watchedDateRange?.from && watchedDateRange?.to && watchedType) {
            const type = leaveTypes.find(t => t.id === watchedType)
            const policy = type?.leave_policies?.[0]

            const start = watchedDateRange.from
            const end = watchedDateRange.to

            let days = differenceInDays(end, start) + 1

            // Basic Sandwich Logic (Mock): 
            // If sandwich disabled, subtract weekends? 
            // Usually simpler: Total Days (including weekends) unless explicitly "Business Days only"
            // For now, simple diff.
            // Complex logic can go here. 

            setCalculatedDays(days)

            // Warnings
            if (policy?.sandwich_rule_enabled && (isWeekend(start) || isWeekend(end))) {
                setWarning("Sandwich rule applies: Weekends may be counted.")
            } else {
                setWarning(null)
            }
        }
    }, [watchedDateRange, watchedType, leaveTypes])

    async function onSubmit(values: LeaveRequestFormValues) {
        if (!user) return
        setLoading(true)
        const supabase = createClient()

        try {
            // Get Employee ID again
            const { data: emp, error: empError } = await supabase.from('employees').select('id').eq('user_id', user.id).single()

            if (empError) {
                console.error("Employee Profile Lookup Error:", empError)
                throw new Error(empError.message === "No object found" ? "Employee profile not found for this user." : empError.message)
            }
            if (!emp) throw new Error("Employee profile not found")

            // 1. Upload Document if present
            let documentUrl = null
            if (fileState) {
                const fileExt = fileState.name.split('.').pop()
                const fileName = `${emp.id}/${Date.now()}.${fileExt}`
                const { error: uploadError } = await supabase.storage
                    .from('leave_documents')
                    .upload(fileName, fileState)

                if (uploadError) throw uploadError

                // Get Public URL (if public) or signed path
                // Since we made bucket public:
                const { data: { publicUrl } } = supabase.storage.from('leave_documents').getPublicUrl(fileName)
                documentUrl = publicUrl
            }

            // 2. Create Request
            const { error: reqError } = await supabase.from('leave_requests').insert({
                employee_id: emp.id,
                leave_type_id: values.leave_type_id,
                start_date: values.date_range.from,
                end_date: values.date_range.to,
                total_days: calculatedDays,
                reason: values.reason,
                document_url: documentUrl,
                status: 'Pending'
            })

            if (reqError) throw reqError

            toast.success("Leave application submitted successfully!")
            form.reset()
            setFileState(null)
            if (onSuccess) onSuccess()
            router.refresh()

        } catch (error: any) {
            console.error("Leave Application Error:", error.message || error, error.details || "", error.hint || "")
            toast.error(error.message || "Failed to apply for leave")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="leave_type_id" render={({ field }: { field: any }) => (
                    <FormItem>
                        <FormLabel>Leave Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {leaveTypes.map(type => {
                                    const bal = balances[type.id]
                                    const available = bal ? (bal.allocated_days - bal.used_days) : 0
                                    return (
                                        <SelectItem key={type.id} value={type.id}>
                                            {type.name} (Bal: {available})
                                        </SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="date_range" render={({ field }: { field: any }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Duration</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value?.from ? (
                                        field.value.to ? (
                                            <>
                                                {format(field.value.from, "LLL dd, y")} -{" "}
                                                {format(field.value.to, "LLL dd, y")}
                                            </>
                                        ) : (
                                            format(field.value.from, "LLL dd, y")
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
                                    defaultMonth={field.value?.from}
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                        {calculatedDays > 0 && (
                            <FormDescription>
                                Total Days: {calculatedDays}
                            </FormDescription>
                        )}
                        <FormMessage />
                    </FormItem>
                )} />

                {warning && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Warning</AlertTitle>
                        <AlertDescription>{warning}</AlertDescription>
                    </Alert>
                )}

                <FormField control={form.control} name="reason" render={({ field }: { field: any }) => (
                    <FormItem>
                        <FormLabel>Reason</FormLabel>
                        <FormControl><Textarea placeholder="Why do you need leave?" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <div className="space-y-2">
                    <Label>Supporting Document (Optional)</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            type="file"
                            onChange={(e) => setFileState(e.target.files?.[0] || null)}
                            className="cursor-pointer"
                        />
                        <Upload className="h-4 w-4 text-muted-foreground" />
                    </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Application
                </Button>
            </form>
        </Form>
    )
}
