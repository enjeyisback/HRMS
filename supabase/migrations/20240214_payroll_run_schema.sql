-- Payroll Runs (Monthly Execution)
CREATE TABLE IF NOT EXISTS payroll_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Locked', 'Paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES employees(user_id)
);

-- Payroll Run Details (Per Employee)
CREATE TABLE IF NOT EXISTS payroll_run_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID REFERENCES payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    working_days INTEGER NOT NULL,
    present_days NUMERIC(4, 1) NOT NULL,
    leave_days NUMERIC(4, 1) NOT NULL,
    lop_days NUMERIC(4, 1) NOT NULL,
    gross_salary NUMERIC(12, 2) NOT NULL,
    total_earnings NUMERIC(12, 2) NOT NULL,
    total_deductions NUMERIC(12, 2) NOT NULL,
    net_payable NUMERIC(12, 2) NOT NULL,
    calculation_details JSONB NOT NULL, -- Detailed breakdown of components
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(run_id, employee_id)
);

-- Payslips
CREATE TABLE IF NOT EXISTS payslips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_detail_id UUID REFERENCES payroll_run_details(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    file_url TEXT,
    status TEXT NOT NULL DEFAULT 'Generated' CHECK (status IN ('Generated', 'Sent', 'Viewed')),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_run_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payroll runs" ON payroll_runs FOR ALL USING (auth.uid() IN (SELECT user_id FROM employees WHERE role = 'admin'));
CREATE POLICY "Admins can manage payroll run details" ON payroll_run_details FOR ALL USING (auth.uid() IN (SELECT user_id FROM employees WHERE role = 'admin'));
CREATE POLICY "Admins can manage payslips" ON payslips FOR ALL USING (auth.uid() IN (SELECT user_id FROM employees WHERE role = 'admin'));

-- Employees can see their own payslips
CREATE POLICY "Employees can view own payslips" ON payslips FOR SELECT USING (auth.uid() IN (SELECT user_id FROM employees WHERE id = employee_id));
CREATE POLICY "Employees can view own run details" ON payroll_run_details FOR SELECT USING (auth.uid() IN (SELECT user_id FROM employees WHERE id = employee_id));
