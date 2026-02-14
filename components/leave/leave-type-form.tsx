"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { LeaveType, LeavePolicy } from "@/types"

const leaveTypeSchema = z.object({
    // Basic Info
    name: z.string().min(2, "Name is required"),
    code: z.string().optional(),
    description: z.string().optional(),
    days_per_year: z.coerce.number().min(0),
    carry_forward_allowed: z.boolean().default(false),
    max_carry_forward_days: z.coerce.number().min(0).default(0),
    encashment_allowed: z.boolean().default(false),
    requires_approval: z.boolean().default(true),
    applicable_to: z.enum(['All', 'Male', 'Female']),

    // Policy Info
    accrual_method: z.enum(['Monthly', 'Yearly', 'On-Join']),
    min_advance_days_notice: z.coerce.number().min(0).default(0),
    max_consecutive_days: z.coerce.number().min(1).default(365),
    sandwich_rule_enabled: z.boolean().default(false),
    allow_negative_balance: z.boolean().default(false),
})

type LeaveFormValues = z.input<typeof leaveTypeSchema>

interface LeaveTypeFormProps {
    initialData?: LeaveType & { leave_policies?: LeavePolicy[] }
    onSuccess?: () => void
    onCancel?: () => void
}

export function LeaveTypeForm({ initialData, onSuccess, onCancel }: LeaveTypeFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    // Flatten initial data if policy exists
    const defaultPolicy = initialData?.leave_policies?.[0]
    const defaultValues: LeaveFormValues = {
        name: initialData?.name || "",
        code: initialData?.code || "",
        description: initialData?.description || "",
        days_per_year: initialData?.days_per_year || 0,
        carry_forward_allowed: initialData?.carry_forward_allowed || false,
        max_carry_forward_days: initialData?.max_carry_forward_days || 0,
        encashment_allowed: initialData?.encashment_allowed || false,
        requires_approval: initialData?.requires_approval ?? true,
        applicable_to: (initialData?.applicable_to as any) || 'All',

        accrual_method: (defaultPolicy?.accrual_method as any) || 'Yearly',
        min_advance_days_notice: defaultPolicy?.min_advance_days_notice || 0,
        max_consecutive_days: defaultPolicy?.max_consecutive_days || 15,
        sandwich_rule_enabled: defaultPolicy?.sandwich_rule_enabled || false,
        allow_negative_balance: defaultPolicy?.allow_negative_balance || false,
    }

    const form = useForm<LeaveFormValues>({
        resolver: zodResolver(leaveTypeSchema),
        defaultValues,
    })

    async function onSubmit(values: LeaveFormValues) {
        setLoading(true)
        const supabase = createClient()

        try {
            // 1. Upsert Leave Type
            const typeData = {
                name: values.name,
                code: values.code,
                description: values.description,
                days_per_year: values.days_per_year,
                carry_forward_allowed: values.carry_forward_allowed,
                max_carry_forward_days: values.max_carry_forward_days,
                encashment_allowed: values.encashment_allowed,
                requires_approval: values.requires_approval,
                applicable_to: values.applicable_to,
            }

            let typeId = initialData?.id

            if (typeId) {
                const { error } = await supabase.from('leave_types').update(typeData).eq('id', typeId)
                if (error) throw error
            } else {
                const { data, error } = await supabase.from('leave_types').insert(typeData).select('id').single()
                if (error) throw error
                typeId = data.id
            }

            // 2. Upsert Policy
            const policyData = {
                leave_type_id: typeId,
                accrual_method: values.accrual_method,
                min_advance_days_notice: values.min_advance_days_notice,
                max_consecutive_days: values.max_consecutive_days,
                sandwich_rule_enabled: values.sandwich_rule_enabled,
                allow_negative_balance: values.allow_negative_balance,
            }

            // check if policy exists
            const { data: existingPolicy } = await supabase.from('leave_policies').select('id').eq('leave_type_id', typeId).maybeSingle()

            if (existingPolicy) {
                const { error } = await supabase.from('leave_policies').update(policyData).eq('id', existingPolicy.id)
                if (error) throw error
            } else {
                const { error } = await supabase.from('leave_policies').insert(policyData)
                if (error) throw error
            }

            router.refresh()
            if (onSuccess) onSuccess()
        } catch (error: any) {
            console.error("Error saving leave type:", error.message, error.details)
            alert("Failed to save: " + (error.message || "Unknown error"))
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    {/* Column 1: Basic Info */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-foreground">Basic Information</h3>
                        <Separator />

                        <FormField control={form.control} name="name" render={({ field }: { field: any }) => (
                            <FormItem><FormLabel>Leave Name*</FormLabel><FormControl><Input placeholder="e.g. Casual Leave" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="code" render={({ field }: { field: any }) => (
                                <FormItem><FormLabel>Short Code</FormLabel><FormControl><Input placeholder="CL" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="applicable_to" render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>Applicable To</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="All" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="All">All Employees</SelectItem>
                                            <SelectItem value="Male">Male Only</SelectItem>
                                            <SelectItem value="Female">Female Only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="description" render={({ field }: { field: any }) => (
                            <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Purpose of this leave..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-4 p-4 border rounded-md">
                            <FormField control={form.control} name="days_per_year" render={({ field }: { field: any }) => (
                                <FormItem><FormLabel>Total Days / Year</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />

                            <FormField control={form.control} name="carry_forward_allowed" render={({ field }: { field: any }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 mt-8">
                                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    <div className="leading-none">
                                        <FormLabel>Can Carry Fwd?</FormLabel>
                                    </div>
                                </FormItem>
                            )} />
                        </div>

                        {form.watch("carry_forward_allowed") && (
                            <FormField control={form.control} name="max_carry_forward_days" render={({ field }: { field: any }) => (
                                <FormItem><FormLabel>Max Carry Forward Days</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        )}

                        <div className="flex space-x-6">
                            <FormField control={form.control} name="encashment_allowed" render={({ field }: { field: any }) => (
                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    <FormLabel className="font-normal">Encashment Allowed</FormLabel>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="requires_approval" render={({ field }: { field: any }) => (
                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    <FormLabel className="font-normal">Requires Approval</FormLabel>
                                </FormItem>
                            )} />
                        </div>
                    </div>

                    {/* Column 2: Policy Rules */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-foreground">Usage Policies</h3>
                        <Separator />

                        <FormField control={form.control} name="accrual_method" render={({ field }: { field: any }) => (
                            <FormItem>
                                <FormLabel>Accrual Method</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Yearly">Yearly (All at once)</SelectItem>
                                        <SelectItem value="Monthly">Monthly (Pro-rata)</SelectItem>
                                        <SelectItem value="On-Join">On Joining Date</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormDescription>When is the leave credited?</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="min_advance_days_notice" render={({ field }: { field: any }) => (
                                <FormItem><FormLabel>Min Advance Notice (Days)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="max_consecutive_days" render={({ field }: { field: any }) => (
                                <FormItem><FormLabel>Max Consecutive Days</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>

                        <div className="space-y-4 border p-4 rounded-md bg-muted/20">
                            <FormField control={form.control} name="sandwich_rule_enabled" render={({ field }: { field: any }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Sandwich Rule</FormLabel>
                                        <FormDescription>If enabled, weekends between leave dates count as leave.</FormDescription>
                                    </div>
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="allow_negative_balance" render={({ field }: { field: any }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Allow Negative Balance</FormLabel>
                                        <FormDescription>Can apply even if balance is 0.</FormDescription>
                                    </div>
                                </FormItem>
                            )} />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t">
                    {onCancel && <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>}
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Configuration
                    </Button>
                </div>
            </form>
        </Form>
    )
}
