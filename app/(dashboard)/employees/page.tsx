import { createClient } from "@/lib/supabase/server"
import { columns, Employee } from "@/components/employees/columns"
import { DataTable } from "@/components/employees/data-table"
import { AddEmployeeDialog } from "@/components/employees/add-employee-dialog"

async function getData(): Promise<Employee[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('employees')
        .select(`
      id,
      first_name,
      last_name,
      email,
      phone,
      status,
      joining_date,
      department:departments(name),
      designation:designations(title)
    `)

    if (error) {
        console.error("Error fetching employees:", error)
        return []
    }

    // Transform data to match Employee type
    // Supabase returns joins as objects (or arrays if one-to-many, but here it's foreign key so object or null)
    // We need to cast it properly or let TS infer if we generated types.
    // Since we are determining types manually for now in columns:

    return (data as any[]).map(emp => ({
        id: emp.id,
        first_name: emp.first_name,
        last_name: emp.last_name,
        email: emp.email,
        phone: emp.phone,
        status: emp.status,
        joining_date: emp.joining_date,
        department: emp.department, // Aliased in query
        designation: emp.designation, // Aliased in query
        avatar_url: null
    }))
}

export default async function EmployeesPage() {
    const data = await getData()

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Employees</h1>
                <AddEmployeeDialog />
            </div>
            <DataTable columns={columns} data={data} />
        </div>
    )
}
