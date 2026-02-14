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
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, User, Key, Camera } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { logAction } from "@/lib/audit-logger"

const profileSchema = z.object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    phone: z.string().optional(),
})

const passwordSchema = z.object({
    new_password: z.string().min(6, "Password must be at least 6 characters"),
    confirm_password: z.string().min(6),
}).refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
})

export function ProfileSettings() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [employeeId, setEmployeeId] = useState<string | null>(null)

    const profileForm = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: { first_name: "", last_name: "" },
    })

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { new_password: "", confirm_password: "" },
    })

    useEffect(() => {
        async function fetchProfile() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUser(user)
                const { data: employee } = await supabase
                    .from('employees')
                    .select('*')
                    .eq('user_id', user.id)
                    .single()

                if (employee) {
                    setEmployeeId(employee.id)
                    profileForm.reset({
                        first_name: employee.first_name,
                        last_name: employee.last_name,
                        phone: employee.phone || "",
                    })
                }
            }
            setLoading(false)
        }
        fetchProfile()
    }, [profileForm])

    async function onProfileSubmit(values: z.infer<typeof profileSchema>) {
        setSaving(true)
        const supabase = createClient()
        try {
            const { error } = await supabase
                .from('employees')
                .update(values)
                .eq('id', employeeId)

            if (error) throw error

            await logAction({
                action: 'UPDATE',
                module: 'profile',
                description: 'Updated own profile information'
            })
            alert("Profile updated")
        } catch (error: any) {
            alert(error.message)
        } finally {
            setSaving(false)
        }
    }

    async function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
        setSaving(true)
        const supabase = createClient()
        try {
            const { error } = await supabase.auth.updateUser({
                password: values.new_password
            })
            if (error) throw error
            passwordForm.reset()
            alert("Password updated successfully")
        } catch (error: any) {
            alert(error.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>

    return (
        <div className="grid gap-6">
            <div className="flex items-center gap-6 p-4">
                <div className="relative">
                    <Avatar className="h-24 w-24 border">
                        <AvatarImage src="" />
                        <AvatarFallback className="text-2xl bg-indigo-100 text-indigo-700">
                            {user?.email?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <Button size="icon" variant="outline" className="absolute -bottom-2 -right-2 rounded-full h-8 w-8">
                        <Camera className="h-4 w-4" />
                    </Button>
                </div>
                <div>
                    <h3 className="text-xl font-bold">{profileForm.getValues("first_name")} {profileForm.getValues("last_name")}</h3>
                    <p className="text-muted-foreground">{user?.email}</p>
                    <Badge variant="secondary" className="mt-1">Active Account</Badge>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-blue-600" />
                            Personal Details
                        </CardTitle>
                        <CardDescription>Update your name and contact information.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                                <FormField control={profileForm.control} name="first_name" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={profileForm.control} name="last_name" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={profileForm.control} name="phone" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <Button type="submit" disabled={saving}>Save Profile</Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5 text-orange-500" />
                            Security
                        </CardTitle>
                        <CardDescription>Change your account password.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...passwordForm}>
                            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                                <FormField control={passwordForm.control} name="new_password" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>New Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={passwordForm.control} name="confirm_password" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>Confirm Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <Button type="submit" variant="destructive" disabled={saving}>Update Password</Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div >
    )
}
