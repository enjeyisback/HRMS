-- Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'Present', -- Present, Absent, Half-day, Leave, Holiday
    location JSONB, -- { lat, lng, address }
    late_coming BOOLEAN DEFAULT FALSE,
    total_hours NUMERIC(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

-- Attendance Regularization
CREATE TABLE IF NOT EXISTS attendance_regularization (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    attendance_id UUID REFERENCES attendance(id) ON DELETE SET NULL,
    requested_date DATE NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'Pending', -- Pending, Approved, Rejected
    approved_by UUID REFERENCES employees(id),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_regularization ENABLE ROW LEVEL SECURITY;

-- Attendance Policies
CREATE POLICY "Users can see own attendance" ON attendance
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM employees WHERE id = employee_id));

CREATE POLICY "Users can insert own check-in" ON attendance
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM employees WHERE id = employee_id));

CREATE POLICY "Users can update own check-out" ON attendance
    FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM employees WHERE id = employee_id));

CREATE POLICY "Admins/Managers can see/update all attendance" ON attendance
    FOR ALL USING (auth.uid() IN (SELECT user_id FROM employees WHERE role IN ('admin', 'manager')));

-- Regularization Policies
CREATE POLICY "Users can see own regularization" ON attendance_regularization
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM employees WHERE id = employee_id));

CREATE POLICY "Users can insert own regularization" ON attendance_regularization
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM employees WHERE id = employee_id));

CREATE POLICY "Admins/Managers can see/update all regularization" ON attendance_regularization
    FOR ALL USING (auth.uid() IN (SELECT user_id FROM employees WHERE role IN ('admin', 'manager')));
