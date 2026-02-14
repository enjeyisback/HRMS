-- Consolidated Migration for Leave Module
-- Run this entire script to ensure all tables and policies exist.

-- 1. Ensure Role Column Exists on Employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'employee';

-- 2. Ensure Leave Types Table and Columns
CREATE TABLE IF NOT EXISTS leave_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add configuration columns if they were missing
ALTER TABLE leave_types
ADD COLUMN IF NOT EXISTS days_per_year INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS carry_forward_allowed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS max_carry_forward_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS encashment_allowed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS applicable_to TEXT DEFAULT 'All',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS gender_applicability TEXT DEFAULT 'All';

-- 3. Create Leave Policies Table
CREATE TABLE IF NOT EXISTS leave_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leave_type_id UUID REFERENCES leave_types(id) ON DELETE CASCADE,
    accrual_method TEXT DEFAULT 'Yearly', -- Monthly, Yearly, On-Join
    min_advance_days_notice INTEGER DEFAULT 0,
    max_consecutive_days INTEGER DEFAULT 365,
    sandwich_rule_enabled BOOLEAN DEFAULT FALSE,
    allow_negative_balance BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Leave Balances Table
CREATE TABLE IF NOT EXISTS leave_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID REFERENCES leave_types(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    allocated_days NUMERIC(5, 2) DEFAULT 0,
    used_days NUMERIC(5, 2) DEFAULT 0,
    pending_days NUMERIC(5, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, leave_type_id, year)
);

-- 5. Create Leave Requests Table
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID REFERENCES leave_types(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days NUMERIC(5, 2) DEFAULT 0,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'Pending', -- Pending, Approved, Rejected, Cancelled
    rejection_reason TEXT,
    approved_by UUID REFERENCES employees(id),
    document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Storage Bucket for Leave Documents
INSERT INTO storage.buckets (id, name, public) VALUES ('leave_documents', 'leave_documents', true) ON CONFLICT (id) DO NOTHING;

-- 7. RLS Policies (Drop old ones to be safe)
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Leave Types
DROP POLICY IF EXISTS "Admin full access leave_types" ON leave_types;
DROP POLICY IF EXISTS "Everyone read leave_types" ON leave_types;
DROP POLICY IF EXISTS "Enable read access for all users" ON leave_types;
DROP POLICY IF EXISTS "Enable write access for admins" ON leave_types;

CREATE POLICY "Enable read access for all users" ON leave_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable write access for admins" ON leave_types FOR ALL TO authenticated USING (auth.uid() IN (SELECT user_id FROM employees WHERE role = 'admin')) WITH CHECK (auth.uid() IN (SELECT user_id FROM employees WHERE role = 'admin'));

-- Leave Policies
DROP POLICY IF EXISTS "Admin full access leave_policies" ON leave_policies;
DROP POLICY IF EXISTS "Everyone read leave_policies" ON leave_policies;
DROP POLICY IF EXISTS "Enable read access for all users" ON leave_policies;
DROP POLICY IF EXISTS "Enable write access for admins" ON leave_policies;

CREATE POLICY "Enable read access for all users" ON leave_policies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable write access for admins" ON leave_policies FOR ALL TO authenticated USING (auth.uid() IN (SELECT user_id FROM employees WHERE role = 'admin')) WITH CHECK (auth.uid() IN (SELECT user_id FROM employees WHERE role = 'admin'));

-- Leave Balances
DROP POLICY IF EXISTS "Users can see own balance" ON leave_balances;
DROP POLICY IF EXISTS "Admins/Managers can see all balances" ON leave_balances;

CREATE POLICY "Users can see own balance" ON leave_balances FOR SELECT USING (auth.uid() IN (SELECT user_id FROM employees WHERE id = employee_id));
CREATE POLICY "Admins/Managers can see all balances" ON leave_balances FOR SELECT USING (auth.uid() IN (SELECT user_id FROM employees WHERE role IN ('admin', 'manager')));

-- Leave Requests
DROP POLICY IF EXISTS "Users can see own requests" ON leave_requests;
DROP POLICY IF EXISTS "Users can insert own requests" ON leave_requests;
DROP POLICY IF EXISTS "Admins/Managers can see/update all requests" ON leave_requests;

CREATE POLICY "Users can see own requests" ON leave_requests FOR SELECT USING (auth.uid() IN (SELECT user_id FROM employees WHERE id = employee_id));
CREATE POLICY "Users can insert own requests" ON leave_requests FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM employees WHERE id = employee_id));
CREATE POLICY "Admins/Managers can see/update all requests" ON leave_requests FOR ALL USING (auth.uid() IN (SELECT user_id FROM employees WHERE role IN ('admin', 'manager')));

-- Storage Policies
DROP POLICY IF EXISTS "Allow authenticated uploads to leave docs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads from leave docs" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload leave docs" ON storage.objects;
DROP POLICY IF EXISTS "Auth read leave docs" ON storage.objects;

CREATE POLICY "Auth upload leave docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'leave_documents');
CREATE POLICY "Auth read leave docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'leave_documents');

-- 8. Set Current User as Admin (Self-Healing)
UPDATE employees SET role = 'admin' WHERE id IN (SELECT id FROM employees LIMIT 1);
