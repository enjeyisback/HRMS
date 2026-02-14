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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Mail, ShieldCheck, Send } from "lucide-react"
import { logAction } from "@/lib/audit-logger"
import { toast } from "sonner"

const emailSchema = z.object({
    smtp_host: z.string().min(1, "Host is required"),
    smtp_port: z.coerce.number(),
    smtp_user: z.string().min(1, "Username is required"),
    smtp_pass: z.string().min(1, "Password is required"),
    encryption: z.string().default("TLS"),
    from_email: z.string().email("Valid email required"),
    from_name: z.string().min(1, "Sender name required"),
})

export function EmailSettings() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settingsId, setSettingsId] = useState<string | null>(null)

    const form = useForm<z.infer<typeof emailSchema>>({
        resolver: zodResolver(emailSchema),
        defaultValues: {
            smtp_host: "",
            smtp_port: 587,
            encryption: "TLS",
        },
    })

    useEffect(() => {
        async function fetchSettings() {
            const supabase = createClient()
            const { data } = await supabase.from('email_settings').select('*').single()
            if (data) {
                setSettingsId(data.id)
                form.reset(data)
            }
            setLoading(false)
        }
        fetchSettings()
    }, [form])

    async function onSubmit(values: z.infer<typeof emailSchema>) {
        setSaving(true)
        const supabase = createClient()

        try {
            if (settingsId) {
                await supabase.from('email_settings').update(values).eq('id', settingsId)
            } else {
                await supabase.from('email_settings').insert(values)
            }

            await logAction({
                action: 'UPDATE',
                module: 'settings',
                description: 'Updated SMTP email settings'
            })

            toast.success("Email settings updated successfully")
        } catch (error: any) {
            toast.error(error.message || "Failed to save email settings")
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
                                <Mail className="h-5 w-5 text-blue-600" />
                                SMTP Configuration
                            </CardTitle>
                            <CardDescription>Setup your outgoing email server for payslips and notifications.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="smtp_host" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>SMTP Host</FormLabel><FormControl><Input placeholder="smtp.gmail.com" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="smtp_port" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>SMTP Port</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="smtp_user" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>Username / Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="smtp_pass" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>Password / App Key</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="encryption" render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel>Encryption</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="TLS">TLS</SelectItem>
                                                <SelectItem value="SSL">SSL</SelectItem>
                                                <SelectItem value="None">None</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                Sender Identity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="from_name" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>Sender Name</FormLabel><FormControl><Input placeholder="HR Department" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="from_email" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>From Email</FormLabel><FormControl><Input type="email" placeholder="no-reply@company.com" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" className="w-[150px]">
                            <Send className="mr-2 h-4 w-4" />
                            Send Test
                        </Button>
                        <Button type="submit" disabled={saving} className="w-[150px]">
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Settings
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
