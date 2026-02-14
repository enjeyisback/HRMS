export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            employees: {
                Row: {
                    id: string
                    user_id: string | null
                    department_id: string | null
                    designation_id: string | null
                    manager_id: string | null
                    first_name: string
                    last_name: string
                    email: string
                    phone: string | null
                    dob: string | null
                    gender: string | null
                    address: string | null
                    joining_date: string
                    employment_type: string
                    status: string
                    pan_number: string | null
                    aadhaar_number: string | null
                    uan_number: string | null
                    esic_number: string | null
                    bank_account_no: string | null
                    bank_ifsc: string | null
                    bank_name: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: Partial<Database['public']['Tables']['employees']['Row']>
                Update: Partial<Database['public']['Tables']['employees']['Row']>
            }
            departments: {
                Row: {
                    id: string
                    name: string
                    code: string
                    created_at: string
                    updated_at: string
                }
                Insert: Partial<Database['public']['Tables']['departments']['Row']>
                Update: Partial<Database['public']['Tables']['departments']['Row']>
            }
            attendance_logs: {
                Row: {
                    id: string
                    employee_id: string | null
                    date: string
                    check_in: string | null
                    check_out: string | null
                    status: string | null
                    total_hours: number | null
                    created_at: string
                }
                Insert: Partial<Database['public']['Tables']['attendance_logs']['Row']>
                Update: Partial<Database['public']['Tables']['attendance_logs']['Row']>
            }
            leave_requests: {
                Row: {
                    id: string
                    employee_id: string | null
                    leave_type_id: string | null
                    start_date: string
                    end_date: string
                    reason: string | null
                    status: 'Pending' | 'Approved' | 'Rejected'
                    approved_by: string | null
                    created_at: string
                }
                Insert: Partial<Database['public']['Tables']['leave_requests']['Row']>
                Update: Partial<Database['public']['Tables']['leave_requests']['Row']>
            }
            payslips: {
                Row: {
                    id: string
                    payroll_run_id: string | null
                    employee_id: string | null
                    total_earnings: number
                    total_deductions: number
                    net_pay: number
                    generated_at: string
                }
                Insert: Partial<Database['public']['Tables']['payslips']['Row']>
                Update: Partial<Database['public']['Tables']['payslips']['Row']>
            }
        }
    }
}
