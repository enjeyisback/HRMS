"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown, Eye, Pencil, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { CheckedState } from "@radix-ui/react-checkbox"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Employee = {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string | null
    department: {
        name: string
    } | null
    designation: {
        title: string
    } | null
    status: string
    joining_date: string
    avatar_url: string | null
}

export const columns: ColumnDef<Employee>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value: CheckedState) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value: CheckedState) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "avatar_url",
        header: "",
        cell: ({ row }) => {
            const first = row.original.first_name || ""
            const last = row.original.last_name || ""
            const avatar = row.getValue("avatar_url") as string
            return (
                <Avatar>
                    <AvatarImage src={avatar} alt={`${first} ${last}`} />
                    <AvatarFallback>{first.charAt(0)}{last.charAt(0)}</AvatarFallback>
                </Avatar>
            )
        },
    },
    {
        accessorKey: "first_name", // We'll combine first and last in cell, but sort by first name for now
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            return <div className="font-medium">{`${row.original.first_name} ${row.original.last_name}`}</div>
        }
    },
    {
        accessorKey: "email",
        header: "Email",
    },
    {
        accessorKey: "department.name",
        header: "Department",
        cell: ({ row }) => row.original.department?.name || "N/A"
    },
    {
        accessorKey: "designation.title", // Assuming the relation exists, but schema didn't explicitly have title in 'designation' object from join yet. We need to ensure query handles this.
        // Actually our schema had designation_id. We'll need to join designations table.
        // For now purely relying on what the query returns.
        header: "Designation",
        cell: ({ row }) => row.original.designation?.title || "N/A"
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <Badge variant={status === "Active" ? "default" : "secondary"}>
                    {status}
                </Badge>
            )
        }
    },
    {
        accessorKey: "joining_date",
        header: "Joined",
        cell: ({ row }) => {
            return new Date(row.getValue("joining_date")).toLocaleDateString()
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const employee = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(employee.email)}
                        >
                            Copy Email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Pencil className="mr-2 h-4 w-4" /> Edit Employee
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                            <Trash className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
