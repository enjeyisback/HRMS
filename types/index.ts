export interface UserProfile {
    id: string
    email: string
    full_name?: string
    avatar_url?: string
    role?: 'admin' | 'manager' | 'employee'
}

export interface NavItem {
    title: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    color?: string
}

export interface Employee {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string
    gender?: string
    dob?: string
    blood_group?: string
    marital_status?: string
    profile_photo_url?: string

    // Employment
    employee_code?: string
    department_id: string
    designation_id: string
    reporting_manager_id?: string
    joining_date: string
    employment_type: string
    status: string
    work_location?: string
    probation_period_months?: number
    confirmation_date?: string
    official_email?: string

    // Addresses
    current_address_street?: string
    current_address_city?: string
    current_address_state?: string
    current_address_zip?: string
    permanent_address_street?: string
    permanent_address_city?: string
    permanent_address_state?: string
    permanent_address_zip?: string

    // Emergency
    emergency_contact_name?: string
    emergency_contact_phone?: string

    // Statutory
    pan_number?: string
    aadhaar_number?: string
    uan_number?: string
    esic_number?: string
    pf_contribution_percent?: number
    esic_applicable?: boolean

    // Salary Snapshot
    base_salary?: number
    hra?: number
    other_allowances?: number

    // Bank
    bank_account_no?: string
    bank_ifsc?: string
    bank_name?: string
    bank_branch?: string

    created_at?: string
    updated_at?: string

    // Relations (joined)
    departments?: { name: string }
    designations?: { title: string }
}

export interface LeaveType {
    id: string
    name: string
    code?: string
    description?: string
    days_per_year: number
    carry_forward_allowed: boolean
    max_carry_forward_days: number
    encashment_allowed: boolean
    requires_approval: boolean
    applicable_to: 'All' | 'Male' | 'Female'

    // Policy (Optional relation or flat if fetched together)
    leave_policies?: LeavePolicy[]
}

export interface LeavePolicy {
    id: string
    leave_type_id: string
    accrual_method: 'Monthly' | 'Yearly' | 'On-Join'
    min_advance_days_notice: number
    max_consecutive_days: number
    sandwich_rule_enabled: boolean
    allow_negative_balance: boolean
}

export interface LeaveBalance {
    id: string
    employee_id: string
    leave_type_id: string
    year: number
    allocated_days: number
    used_days: number
    pending_days: number

    // Relation
    leave_types?: LeaveType
}

export interface LeaveRequest {
    id: string
    employee_id: string
    leave_type_id: string
    start_date: string
    end_date: string
    total_days: number
    reason: string
    status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'
    rejection_reason?: string
    approved_by?: string
    document_url?: string
    created_at: string

    // Relations
    leave_types?: LeaveType
    employees?: Employee // The requester
    approver?: Employee // The approver
}

export interface Attendance {
    id: string
    employee_id: string
    date: string
    check_in_time: string | null
    check_out_time: string | null
    status: 'Present' | 'Absent' | 'Half-day' | 'Leave' | 'Holiday'
    location?: {
        lat: number
        lng: number
        address?: string
    }
    late_coming: boolean
    total_hours: number | null
    created_at: string
}

export interface AttendanceRegularization {
    id: string
    employee_id: string
    attendance_id?: string
    requested_date: string
    check_in_time?: string
    check_out_time?: string
    reason: string
    status: 'Pending' | 'Approved' | 'Rejected'
    approved_by?: string
    rejection_reason?: string
    created_at: string
}

export interface SalaryComponent {
    id: string
    name: string
    type: 'Earning' | 'Deduction'
    calculation_method: 'Fixed' | '% of Basic' | '% of Gross'
    value_percentage?: number
    is_taxable: boolean
    is_statutory: boolean
    statutory_type?: 'PF' | 'ESIC' | 'PT' | 'TDS'
    is_active: boolean
    created_at: string
}

export interface SalaryAssignment {
    id: string
    employee_id: string
    effective_from: string
    gross_salary: number
    total_deductions: number
    net_salary: number
    created_at: string
    updated_at: string

    // Relations
    employees?: Employee
    components?: SalaryAssignmentComponent[]
}

export interface SalaryAssignmentComponent {
    id: string
    assignment_id: string
    component_id: string
    amount: number

    // Relation
    salary_components?: SalaryComponent
}

export interface SalaryTemplate {
    id: string
    name: string
    description?: string
    created_at: string
    components?: SalaryTemplateComponent[]
}

export interface SalaryTemplateComponent {
    id: string
    template_id: string
    component_id: string
    default_amount: number
    default_percentage: number
}
