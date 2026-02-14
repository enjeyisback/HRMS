"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Plus, Save } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { SalaryComponent } from "@/types"

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    type: z.enum(["Earning", "Deduction"]),
    calculation_method: z.enum(["Fixed", "% of Basic", "% of Gross"]),
    value_percentage: z.any().optional().transform(v => v ? parseFloat(v) : 0),
    is_taxable: z.boolean().default(true),
    is_statutory: z.boolean().default(false),
    statutory_type: z.enum(["PF", "ESIC", "PT", "TDS"]).optional().nullable(),
})

type FormData = z.input<typeof formSchema>

interface SalaryComponentFormProps {
    component?: SalaryComponent
    onSuccess?: () => void
}

export function SalaryComponentForm({ component, onSuccess }: SalaryComponentFormProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: component ? {
            name: component.name,
            type: component.type as any,
            calculation_method: component.calculation_method as any,
            value_percentage: component.value_percentage as any,
            is_taxable: component.is_taxable,
            is_statutory: component.is_statutory,
            statutory_type: component.statutory_type as any,
        } : {
            name: "",
            type: "Earning",
            calculation_method: "Fixed",
            value_percentage: 0 as any,
            is_taxable: true,
            is_statutory: false,
            statutory_type: null,
        }
    })

    const isStatutory = form.watch("is_statutory")

    async function onSubmit(values: FormData) {
        setLoading(true)
        const supabase = createClient()

        try {
            if (component) {
                const { error } = await supabase
                    .from('salary_components')
                    .update(values)
                    .eq('id', component.id)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('salary_components')
                    .insert(values)
                if (error) throw error
            }

            setOpen(false)
            form.reset()
            onSuccess?.()
        } catch (error: any) {
            console.error("Error saving component:", error)
            alert("Error: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant={component ? "outline" : "default"} size={component ? "sm" : "default"}>
                    {component ? "Edit" : (
                        <><Plus className="mr-2 h-4 w-4" /> Add Component</>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{component ? "Edit Component" : "Add Salary Component"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Basic Pay, HRA" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel>Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Earning">Earning</SelectItem>
                                                <SelectItem value="Deduction">Deduction</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="calculation_method"
                                render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel>Method</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select method" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Fixed">Fixed Amount</SelectItem>
                                                <SelectItem value="% of Basic">% of Basic</SelectItem>
                                                <SelectItem value="% of Gross">% of Gross</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {form.watch("calculation_method") !== "Fixed" && (
                            <FormField
                                control={form.control}
                                name="value_percentage"
                                render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel>Percentage (%)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <div className="flex flex-col gap-3 p-4 border rounded-lg bg-muted/30">
                            <FormField
                                control={form.control}
                                name="is_taxable"
                                render={({ field }: { field: any }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Taxable</FormLabel>
                                            <FormDescription>Includes this in income tax calculations.</FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="is_statutory"
                                render={({ field }: { field: any }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Statutory Component</FormLabel>
                                            <FormDescription>PF, ESIC, PT, etc.</FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            {isStatutory && (
                                <FormField
                                    control={form.control}
                                    name="statutory_type"
                                    render={({ field }: { field: any }) => (
                                        <FormItem className="mt-2">
                                            <FormLabel>Statutory Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="PF">Provident Fund (PF)</SelectItem>
                                                    <SelectItem value="ESIC">ESIC</SelectItem>
                                                    <SelectItem value="PT">Professional Tax (PT)</SelectItem>
                                                    <SelectItem value="TDS">TDS</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {component ? "Update Component" : "Create Component"}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
