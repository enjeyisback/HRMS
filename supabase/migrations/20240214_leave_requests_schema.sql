-- Add Role Column to Employees if not exists
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'employee'; -- admin, manager, employee

-- Create Leave Balances Table
CREATE TABLE IF NOT EXISTS leave_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID REFERENCES leave_types(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    allocated_days NUMERIC(5, 2) DEFAULT 0,
    used_days NUMERIC(5, 2) DEFAULT 0,
    pending_days NUMERIC(5, 2) DEFAULT 0, -- Days currently requested but not approved
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, leave_type_id, year)
);

-- Create Leave Requests Table
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
    approved_by UUID REFERENCES employees(id), -- Manager who approved
    document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Storage Bucket for Leave Documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('leave_documents', 'leave_documents', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for Storage
CREATE POLICY "Allow authenticated uploads to leave docs" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'leave_documents');

CREATE POLICY "Allow authenticated reads from leave docs" ON storage.objects
FOR SELECT TO authenticated USING (bucket_id = 'leave_documents');

-- RLS for Leave Balances
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own balance" ON leave_balances
    FOR SELECT
    USING (auth.uid() IN (SELECT user_id FROM employees WHERE id = employee_id));

CREATE POLICY "Admins/Managers can see all balances" ON leave_balances
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM employees WHERE role IN ('admin', 'manager')
        )
    );

-- RLS for Leave Requests
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own requests" ON leave_requests
    FOR SELECT
    USING (auth.uid() IN (SELECT user_id FROM employees WHERE id = employee_id));

CREATE POLICY "Users can insert own requests" ON leave_requests
    FOR INSERT
    WITH CHECK (auth.uid() IN (SELECT user_id FROM employees WHERE id = employee_id));

CREATE POLICY "Admins/Managers can see/update all requests" ON leave_requests
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM employees WHERE role IN ('admin', 'manager')
        )
    );
