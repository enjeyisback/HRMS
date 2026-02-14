"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Trash2, Upload, FileText } from "lucide-react"
import { format } from "date-fns"
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
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

const employeeSchema = z.object({
    // Personal Information
    first_name: z.string().min(2, { message: "First name is required." }),
    last_name: z.string().min(2, { message: "Last name is required." }),
    // dob: z.date({ required_error: "Date of birth is required." }),
    dob: z.string().optional(), // Using string for date input for simplicity or Date object with transformer if using Calendar
    gender: z.string().min(1, { message: "Gender is required." }),
    blood_group: z.string().optional(),
    marital_status: z.string().optional(),
    email: z.string().email({ message: "Personal email is invalid." }),
    phone: z.string().min(10, { message: "Phone number is required." }),

    current_address_street: z.string().optional(),
    current_address_city: z.string().optional(),
    current_address_state: z.string().optional(),
    current_address_zip: z.string().optional(),

    permanent_address_street: z.string().optional(),
    permanent_address_city: z.string().optional(),
    permanent_address_state: z.string().optional(),
    permanent_address_zip: z.string().optional(),

    emergency_contact_name: z.string().optional(),
    emergency_contact_phone: z.string().optional(),

    // Employment Details
    employee_code: z.string().optional(), // Auto-generated if empty
    joining_date: z.string().min(1, { message: "Joining date is required." }),
    department_id: z.string().min(1, { message: "Department is required." }),
    designation_id: z.string().min(1, { message: "Designation is required." }),
    reporting_manager_id: z.string().optional(),
    employment_type: z.string().min(1, { message: "Employment type is required." }),
    work_location: z.string().optional(),
    official_email: z.string().email().optional().or(z.literal('')),
    probation_period_months: z.coerce.number().optional(),
    confirmation_date: z.string().optional(),
    status: z.string().default("Active"),

    // Salary & Bank
    bank_account_no: z.string().optional(),
    bank_name: z.string().optional(),
    bank_ifsc: z.string().optional(),
    bank_branch: z.string().optional(),
    pan_number: z.string().optional(),
    aadhaar_number: z.string().optional(),
    uan_number: z.string().optional(),
    esic_number: z.string().optional(),
    base_salary: z.coerce.number().optional(),
    hra: z.coerce.number().optional(),
    other_allowances: z.coerce.number().optional(),
    pf_contribution_percent: z.coerce.number().optional(),
    esic_applicable: z.boolean().default(false).optional(),
    role_id: z.string().min(1, { message: "Role is required." }),
})

type EmployeeFormValues = z.input<typeof employeeSchema>

export function EmployeeForm({ onClose, initialData }: { onClose: () => void, initialData?: any }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [departments, setDepartments] = useState<{ id: string, name: string }[]>([])
    const [designations, setDesignations] = useState<{ id: string, title: string }[]>([])
    const [managers, setManagers] = useState<{ id: string, first_name: string, last_name: string }[]>([])
    const [roles, setRoles] = useState<{ id: string, name: string }[]>([])
    const [sameAsCurrentAddress, setSameAsCurrentAddress] = useState(false)
    const [activeTab, setActiveTab] = useState("personal")

    // File Upload State
    const [uploading, setUploading] = useState(false)
    const [uploadedFiles, setUploadedFiles] = useState<{ name: string, url: string, type: string }[]>([])

    useEffect(() => {
        const fetchOptions = async () => {
            const supabase = createClient()
            const { data: deptData } = await supabase.from('departments').select('id, name')
            if (deptData) setDepartments(deptData)

            const { data: desigData } = await supabase.from('designations').select('id, title')
            if (desigData) setDesignations(desigData)

            const { data: managerData } = await supabase.from('employees').select('id, first_name, last_name')
            if (managerData) setManagers(managerData)

            const { data: roleData } = await supabase.from('app_roles').select('id, name')
            if (roleData) setRoles(roleData)
        }
        fetchOptions()
    }, [])

    const form = useForm<EmployeeFormValues>({
        resolver: zodResolver(employeeSchema),
        defaultValues: initialData || {
            first_name: "",
            last_name: "",
            email: "",
            phone: "",
            gender: "Male",
            joining_date: new Date().toISOString().split('T')[0],
            employment_type: "Full-Time",
            status: "Active",
            esic_applicable: false,
            probation_period_months: 0,
            role_id: "",
            employee_code: "",
            dob: "",
            blood_group: "",
            marital_status: "",
            current_address_street: "",
            current_address_city: "",
            current_address_state: "",
            current_address_zip: "",
            permanent_address_street: "",
            permanent_address_city: "",
            permanent_address_state: "",
            permanent_address_zip: "",
            emergency_contact_name: "",
            emergency_contact_phone: "",
            work_location: "",
            official_email: "",
            bank_account_no: "",
            bank_name: "",
            bank_ifsc: "",
            bank_branch: "",
            pan_number: "",
            aadhaar_number: "",
            uan_number: "",
            esic_number: "",
            base_salary: 0,
            hra: 0,
            other_allowances: 0,
            pf_contribution_percent: 0,
        },
    })

    // Handle "Same as Current Address" toggle
    useEffect(() => {
        if (sameAsCurrentAddress) {
            form.setValue("permanent_address_street", form.getValues("current_address_street"))
            form.setValue("permanent_address_city", form.getValues("current_address_city"))
            form.setValue("permanent_address_state", form.getValues("current_address_state"))
            form.setValue("permanent_address_zip", form.getValues("current_address_zip"))
        }
    }, [sameAsCurrentAddress, form.watch("current_address_street"), form.watch("current_address_city")])


    async function onSubmit(values: EmployeeFormValues) {
        setLoading(true)
        const supabase = createClient()

        try {
            // Auto-generate Official Email if empty
            if (!values.official_email) {
                values.official_email = `${values.first_name.toLowerCase()}.${values.last_name.toLowerCase()}@company.com`
            }

            // Auto-generate Employee Code if empty (Simple logic for demo)
            if (!values.employee_code) {
                const { count } = await supabase.from('employees').select('*', { count: 'exact', head: true })
                const nextId = (count || 0) + 1
                values.employee_code = `EMP${nextId.toString().padStart(3, '0')}`
            }

            const { error } = await supabase.from("employees").insert(values)

            if (error) throw error

            // Handle File Uploads (Link files to employee - strictly we need employee ID first)
            // For now, files are just uploaded, linking logic would need the returned ID.
            // Since insert doesn't return ID by default unless .select() is used.
            // We'll skip complex file linking implementation in this step to keep it simple, 
            // verifying the core form works first.

            toast.success(initialData ? "Employee updated successfully" : "Employee saved successfully")
            router.refresh()
            onClose()
        } catch (error: any) {
            console.error("Submission Error:", error)
            toast.error(error.message || "Failed to save employee")
        } finally {
            setLoading(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return
        setUploading(true)
        const file = e.target.files[0]
        const supabase = createClient()

        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage.from('employee_documents').upload(filePath, file)

        if (uploadError) {
            toast.error('Upload failed: ' + uploadError.message)
        } else {
            // Get public URL
            const { data } = supabase.storage.from('employee_documents').getPublicUrl(filePath)
            setUploadedFiles([...uploadedFiles, { name: file.name, url: data.publicUrl, type: 'document' }])
            toast.success("File uploaded successfully")
        }
        setUploading(false)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="personal">Personal</TabsTrigger>
                        <TabsTrigger value="employment">Employment</TabsTrigger>
                        <TabsTrigger value="salary">Salary & Bank</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                    </TabsList>

                    <ScrollArea className="h-[60vh] mt-4 pr-4 border rounded-md p-4">
                        {/* Tab 1: Personal Information */}
                        <TabsContent value="personal" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="first_name" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>First Name*</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="last_name" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>Last Name*</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="dob" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>Date of Birth</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="gender" render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel>Gender*</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="Male">Male</SelectItem>
                                                <SelectItem value="Female">Female</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="blood_group" render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel>Blood Group</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                                                    <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="marital_status" render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel>Marital Status</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="Single">Single</SelectItem>
                                                <SelectItem value="Married">Married</SelectItem>
                                                <SelectItem value="Divorced">Divorced</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="email" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>Personal Email*</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="phone" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>Phone*</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>

                            <Separator className="my-4" />
                            <h3 className="font-semibold mb-2">Current Address</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="current_address_street" render={({ field }: { field: any }) => (
                                    <FormItem className="col-span-2"><FormLabel>Street Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="current_address_city" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="current_address_state" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="current_address_zip" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>PIN Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>

                            <Separator className="my-4" />
                            <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-semibold">Permanent Address</h3>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="sameAddress" checked={sameAsCurrentAddress} onCheckedChange={(c) => setSameAsCurrentAddress(!!c)} />
                                    <label htmlFor="sameAddress" className="text-sm font-medium leading-none cursor-pointer">Same as Current</label>
                                </div>
                            </div>
                            {!sameAsCurrentAddress && (
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="permanent_address_street" render={({ field }: { field: any }) => (
                                        <FormItem className="col-span-2"><FormLabel>Street Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="permanent_address_city" render={({ field }: { field: any }) => (
                                        <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="permanent_address_state" render={({ field }: { field: any }) => (
                                        <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="permanent_address_zip" render={({ field }: { field: any }) => (
                                        <FormItem><FormLabel>PIN Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                            )}

                            <Separator className="my-4" />
                            <h3 className="font-semibold mb-2">Emergency Contact</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="emergency_contact_name" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="emergency_contact_phone" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                        </TabsContent>

                        {/* Tab 2: Employment Details */}
                        <TabsContent value="employment" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="employee_code" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>Employee ID (Auto-generated if empty)</FormLabel><FormControl><Input placeholder="EMP001" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="joining_date" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>Joining Date*</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="role_id" render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel>User Role*</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Assign Role" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="department_id" render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel>Department*</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="designation_id" render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel>Designation*</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {designations.map(d => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="reporting_manager_id" render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel>Reporting Manager</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                {managers.map(m => <SelectItem key={m.id} value={m.id}>{m.first_name} {m.last_name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="employment_type" render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel>Employment Type*</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="Full-Time">Full-Time</SelectItem>
                                                <SelectItem value="Part-Time">Part-Time</SelectItem>
                                                <SelectItem value="Contract">Contract</SelectItem>
                                                <SelectItem value="Intern">Intern</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="work_location" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>Work Location</FormLabel><FormControl><Input placeholder="Office / Remote" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="official_email" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>Official Email (Auto-generated if empty)</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="probation_period_months" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>Probation (Months)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="confirmation_date" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>Confirmation Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                        </TabsContent>

                        {/* Tab 3: Salary & Bank */}
                        <TabsContent value="salary" className="space-y-4">
                            <h3 className="font-semibold mb-2">Bank Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="bank_name" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="bank_account_no" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="bank_ifsc" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>IFSC Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="bank_branch" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>Branch</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                            <Separator className="my-4" />
                            <h3 className="font-semibold mb-2">Statutory Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="pan_number" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>PAN Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="aadhaar_number" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>Aadhaar Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="uan_number" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>UAN (PF)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="esic_number" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>ESIC Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                            <Separator className="my-4" />
                            <h3 className="font-semibold mb-2">Salary Structure (Monthly Snapshot)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="base_salary" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>Base Salary</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="hra" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>HRA</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="other_allowances" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>Other Allowances</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="pf_contribution_percent" render={({ field }: { field: any }) => (
                                    <FormItem><FormLabel>PF Contribution %</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                            <FormField control={form.control} name="esic_applicable" render={({ field }: { field: any }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    <div className="space-y-1 leading-none"><FormLabel>ESIC Applicable</FormLabel></div>
                                </FormItem>
                            )} />
                        </TabsContent>

                        {/* Tab 4: Documents */}
                        <TabsContent value="documents" className="space-y-4">
                            <div className="flex items-center justify-center w-full">
                                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                        <p className="text-xs text-muted-foreground">PDF, PNG, JPG (MAX. 5MB)</p>
                                    </div>
                                    <input id="dropzone-file" type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                                </label>
                            </div>
                            {uploading && <p className="text-sm text-center">Uploading...</p>}

                            <div className="space-y-2">
                                {uploadedFiles.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 border rounded-md">
                                        <div className="flex items-center space-x-2">
                                            <FileText className="w-4 h-4 text-primary" />
                                            <span className="text-sm">{file.name}</span>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                    </ScrollArea>

                    <div className="flex justify-end space-x-2 pt-6 border-t mt-4">
                        <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {initialData ? "Update Employee" : "Save Employee"}
                        </Button>
                    </div>
                </Tabs>
            </form>
        </Form>
    )
}
