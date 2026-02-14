"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Building2, Calendar, MapPin, Globe } from "lucide-react"
import { logAction } from "@/lib/audit-logger"
import { toast } from "sonner"

import { HolidaySettings } from "./holiday-settings"

const companySchema = z.object({
    company_name: z.string().min(2, "Company name is required"),
    contact_email: z.string().email().optional(),
    contact_phone: z.string().optional(),
    address_street: z.string().optional(),
    address_city: z.string().optional(),
    address_state: z.string().optional(),
    address_zip: z.string().optional(),
    financial_year_start_month: z.coerce.number().min(1).max(12),
    working_days: z.array(z.number()),
})

export function CompanySettings() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settingsId, setSettingsId] = useState<string | null>(null)

    const form = useForm<z.infer<typeof companySchema>>({
        resolver: zodResolver(companySchema),
        defaultValues: {
            company_name: "",
            financial_year_start_month: 4,
        },
    })

    useEffect(() => {
        async function fetchSettings() {
            const supabase = createClient()
            const { data } = await supabase.from('company_settings').select('*').single()
            if (data) {
                setSettingsId(data.id)
                form.reset({
                    company_name: data.company_name,
                    contact_email: data.contact_email || "",
                    contact_phone: data.contact_phone || "",
                    address_street: data.address_street || "",
                    address_city: data.address_city || "",
                    address_state: data.address_state || "",
                    address_zip: data.address_zip || "",
                    financial_year_start_month: data.financial_year_start_month,
                    working_days: data.working_days || [1, 2, 3, 4, 5],
                })
            }
            setLoading(false)
        }
        fetchSettings()
    }, [form])

    async function onSubmit(values: z.infer<typeof companySchema>) {
        setSaving(true)
        const supabase = createClient()

        try {
            const { error } = await supabase
                .from('company_settings')
                .update(values)
                .eq('id', settingsId)

            if (error) throw error

            await logAction({
                action: 'UPDATE',
                module: 'settings',
                description: 'Updated company profile settings',
                newData: values
            })

            toast.success("Settings updated successfully")
        } catch (error: any) {
            toast.error(error.message || "Failed to update settings")
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>

    return (
        <div className="grid gap-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Building2 className="h-5 w-5 text-blue-600" />
                                Basic Information
                            </CardTitle>
                            <CardDescription>Primary identification details for your organization.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="company_name" render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel>Organization Name</FormLabel>
                                        <FormControl><Input placeholder="Acme Corp" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="contact_email" render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel>Primary Email</FormLabel>
                                        <FormControl><Input type="email" placeholder="hr@company.com" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="contact_phone" render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel>Contact Number</FormLabel>
                                        <FormControl><Input placeholder="+91 ..." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="financial_year_start_month" render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel>Financial Year Start Month</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="1" max="12" {...field} />
                                        </FormControl>
                                        <FormDescription>Month index (1-Jan, 4-Apr, etc.)</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <MapPin className="h-5 w-5 text-red-500" />
                                Registered Address
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField control={form.control} name="address_street" render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>Street Address</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <div className="grid grid-cols-3 gap-4">
                                <FormField control={form.control} name="address_city" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="address_state" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="address_zip" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>Zip Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Calendar className="h-5 w-5 text-emerald-500" />
                                Working Days
                            </CardTitle>
                            <CardDescription>Select the standard working days for your organization.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="working_days"
                                render={() => (
                                    <FormItem>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {[
                                                { label: "Sunday", value: 0 },
                                                { label: "Monday", value: 1 },
                                                { label: "Tuesday", value: 2 },
                                                { label: "Wednesday", value: 3 },
                                                { label: "Thursday", value: 4 },
                                                { label: "Friday", value: 5 },
                                                { label: "Saturday", value: 6 },
                                            ].map((day) => (
                                                <FormField
                                                    key={day.value}
                                                    control={form.control}
                                                    name="working_days"
                                                    render={({ field }: { field: any }) => {
                                                        return (
                                                            <FormItem
                                                                key={day.value}
                                                                className="flex flex-row items-start space-x-3 space-y-0"
                                                            >
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value?.includes(day.value)}
                                                                        onCheckedChange={(checked) => {
                                                                            return checked
                                                                                ? field.onChange([...field.value, day.value])
                                                                                : field.onChange(
                                                                                    field.value?.filter(
                                                                                        (value: number) => value !== day.value
                                                                                    )
                                                                                )
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <FormLabel className="font-normal">
                                                                    {day.label}
                                                                </FormLabel>
                                                            </FormItem>
                                                        )
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={saving} className="w-[150px]">
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Form>

            <HolidaySettings />
        </div>
    )
}
