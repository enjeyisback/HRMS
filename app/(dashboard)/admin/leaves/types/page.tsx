"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Plus, Edit, Trash2, CalendarCheck, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { LeaveTypeForm } from "@/components/leave/leave-type-form"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LeaveType } from "@/types"

export default function LeaveTypesPage() {
    const [types, setTypes] = useState<LeaveType[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedType, setSelectedType] = useState<LeaveType | undefined>(undefined)

    const fetchTypes = async () => {
        setLoading(true)
        const supabase = createClient()
        const { data, error } = await supabase
            .from('leave_types')
            .select(`
                *,
                leave_policies (*)
            `)
            .order('created_at', { ascending: true })

        if (error) {
            console.error("Error fetching leave types:", error.message, error.details || '')
        } else {
            setTypes(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchTypes()
    }, [])

    const handleEdit = (type: LeaveType) => {
        setSelectedType(type)
        setIsDialogOpen(true)
    }

    const handleAdd = () => {
        setSelectedType(undefined)
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this leave type? This action cannot be undone.")) return

        const supabase = createClient()
        const { error } = await supabase.from('leave_types').delete().eq('id', id)

        if (error) {
            alert("Error deleting: " + error.message)
        } else {
            fetchTypes()
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Leave Configuration</h2>
                    <p className="text-muted-foreground">Manage leave types and their policies.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <Button onClick={handleAdd}>
                        <Plus className="mr-2 h-4 w-4" /> Add Leave Type
                    </Button>
                    <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{selectedType ? 'Edit Leave Type' : 'Create New Leave Type'}</DialogTitle>
                            <DialogDescription>
                                Configure the rules and limits for this leave category.
                            </DialogDescription>
                        </DialogHeader>
                        <LeaveTypeForm
                            initialData={selectedType}
                            onSuccess={() => { setIsDialogOpen(false); fetchTypes(); }}
                            onCancel={() => setIsDialogOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {types.map((type) => {
                    const policy = type.leave_policies?.[0]
                    return (
                        <Card key={type.id} className="relative overflow-hidden">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            {type.name}
                                            {type.code && <Badge variant="outline">{type.code}</Badge>}
                                        </CardTitle>
                                        <CardDescription>{type.description || "No description provided."}</CardDescription>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(type)}><Edit className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(type.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="text-sm space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <CalendarCheck className="h-4 w-4" />
                                        <span>{type.days_per_year} Days/Year</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Settings className="h-4 w-4" />
                                        <span>{policy?.accrual_method || 'Yearly'} Accrual</span>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-1">
                                    <p><span className="font-medium text-foreground">Carry Forward:</span> {type.carry_forward_allowed ? `Yes (Max ${type.max_carry_forward_days})` : "No"}</p>
                                    <p><span className="font-medium text-foreground">Sandwich Rule:</span> {policy?.sandwich_rule_enabled ? "Enabled" : "Disabled"}</p>
                                    <p><span className="font-medium text-foreground">Applicable To:</span> {type.applicable_to}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}

                {types.length === 0 && !loading && (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 bg-muted/20 border-2 border-dashed rounded-lg space-y-4">
                        <p className="text-muted-foreground text-lg">No leave types configured yet.</p>
                        <Button variant="outline" onClick={handleAdd}>Create First Leave Type</Button>
                    </div>
                )}
            </div>
        </div>
    )
}
