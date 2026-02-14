"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { SalaryComponent, SalaryTemplate } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Plus, Save, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface SalaryTemplateFormProps {
    template?: SalaryTemplate
    onSuccess?: () => void
}

export function SalaryTemplateForm({ template, onSuccess }: SalaryTemplateFormProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState(template?.name || "")
    const [description, setDescription] = useState(template?.description || "")
    const [components, setComponents] = useState<SalaryComponent[]>([])
    const [selectedComponents, setSelectedComponents] = useState<{ component_id: string, default_amount: number, default_percentage: number }[]>(
        template?.components?.map(c => ({ component_id: c.component_id, default_amount: c.default_amount, default_percentage: c.default_percentage })) || []
    )

    useEffect(() => {
        const fetchComps = async () => {
            const supabase = createClient()
            const { data } = await supabase.from('salary_components').select('*').eq('is_active', true)
            setComponents(data || [])
        }
        fetchComps()
    }, [])

    const addComponent = () => {
        setSelectedComponents([...selectedComponents, { component_id: "", default_amount: 0, default_percentage: 0 }])
    }

    const removeComponent = (index: number) => {
        setSelectedComponents(selectedComponents.filter((_, i) => i !== index))
    }

    const updateComponent = (index: number, field: string, value: any) => {
        const updated = [...selectedComponents]
        updated[index] = { ...updated[index], [field]: value }
        setSelectedComponents(updated)
    }

    const handleSave = async () => {
        if (!name) return alert("Template name is required")

        setLoading(true)
        const supabase = createClient()

        try {
            let templateId = template?.id

            if (templateId) {
                const { error } = await supabase
                    .from('salary_templates')
                    .update({ name, description })
                    .eq('id', templateId)
                if (error) throw error
            } else {
                const { data, error } = await supabase
                    .from('salary_templates')
                    .insert({ name, description })
                    .select()
                    .single()
                if (error) throw error
                templateId = data.id
            }

            // Update components
            await supabase.from('salary_template_components').delete().eq('template_id', templateId)

            const validComponents = selectedComponents.filter(c => c.component_id)
            if (validComponents.length > 0) {
                const { error } = await supabase.from('salary_template_components').insert(
                    validComponents.map(c => ({ ...c, template_id: templateId }))
                )
                if (error) throw error
            }

            setOpen(false)
            onSuccess?.()
        } catch (error: any) {
            console.error("Error saving template:", error)
            alert("Error: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant={template ? "outline" : "default"} size={template ? "sm" : "default"}>
                    {template ? "Edit" : <><Plus className="mr-2 h-4 w-4" /> Create Template</>}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{template ? "Edit Template" : "New Salary Template"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Template Name</Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Senior Developer, Management" />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-base">Components</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addComponent}>
                                <Plus className="h-4 w-4 mr-2" /> Add
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {selectedComponents.map((sc, index) => {
                                const componentInfo = components.find(c => c.id === sc.component_id)
                                return (
                                    <div key={index} className="flex gap-3 items-end p-3 border rounded-lg bg-muted/20">
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-[10px] uppercase">Component</Label>
                                            <Select
                                                value={sc.component_id}
                                                onValueChange={(val) => updateComponent(index, 'component_id', val)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {components.map(c => (
                                                        <SelectItem key={c.id} value={c.id}>{c.name} ({c.type})</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {componentInfo?.calculation_method === 'Fixed' ? (
                                            <div className="w-24 space-y-1">
                                                <Label className="text-[10px] uppercase">Amount</Label>
                                                <Input
                                                    type="number"
                                                    value={sc.default_amount}
                                                    onChange={(e) => updateComponent(index, 'default_amount', parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-24 space-y-1">
                                                <Label className="text-[10px] uppercase">Percent (%)</Label>
                                                <Input
                                                    type="number"
                                                    value={sc.default_percentage}
                                                    onChange={(e) => updateComponent(index, 'default_percentage', parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                        )}

                                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removeComponent(index)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <Button className="w-full" disabled={loading} onClick={handleSave}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {template ? "Update Template" : "Save Template"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
