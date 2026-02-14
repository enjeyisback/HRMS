-- Salary Components Master
CREATE TABLE IF NOT EXISTS salary_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Earning', 'Deduction')),
    calculation_method TEXT NOT NULL DEFAULT 'Fixed' CHECK (calculation_method IN ('Fixed', '% of Basic', '% of Gross')),
    value_percentage NUMERIC(5, 2) DEFAULT 0,
    is_taxable BOOLEAN DEFAULT TRUE,
    is_statutory BOOLEAN DEFAULT FALSE,
    statutory_type TEXT CHECK (statutory_type IN ('PF', 'ESIC', 'PT', 'TDS')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Salary Templates
CREATE TABLE IF NOT EXISTS salary_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Template Components
CREATE TABLE IF NOT EXISTS salary_template_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES salary_templates(id) ON DELETE CASCADE,
    component_id UUID REFERENCES salary_components(id) ON DELETE CASCADE,
    default_amount NUMERIC(12, 2) DEFAULT 0,
    default_percentage NUMERIC(5, 2) DEFAULT 0,
    UNIQUE(template_id, component_id)
);

-- Employee Salary Assignments
CREATE TABLE IF NOT EXISTS salary_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    effective_from DATE NOT NULL,
    gross_salary NUMERIC(12, 2) NOT NULL,
    total_deductions NUMERIC(12, 2) NOT NULL,
    net_salary NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id) -- One active structure per employee
);

-- Employee Salary Components (Actual values for the assignment)
CREATE TABLE IF NOT EXISTS salary_assignment_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES salary_assignments(id) ON DELETE CASCADE,
    component_id UUID REFERENCES salary_components(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    UNIQUE(assignment_id, component_id)
);

-- RLS
ALTER TABLE salary_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_template_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_assignment_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage salary components" ON salary_components FOR ALL USING (auth.uid() IN (SELECT user_id FROM employees WHERE role = 'admin'));
CREATE POLICY "Admins can manage salary templates" ON salary_templates FOR ALL USING (auth.uid() IN (SELECT user_id FROM employees WHERE role = 'admin'));
CREATE POLICY "Admins can manage all salary assignments" ON salary_assignments FOR ALL USING (auth.uid() IN (SELECT user_id FROM employees WHERE role = 'admin'));
CREATE POLICY "Admins can manage all salary assignment components" ON salary_assignment_components FOR ALL USING (auth.uid() IN (SELECT user_id FROM employees WHERE role = 'admin'));

-- Employees can see their own assignment
CREATE POLICY "Employees can view own assignment" ON salary_assignments FOR SELECT USING (auth.uid() IN (SELECT user_id FROM employees WHERE id = employee_id));
CREATE POLICY "Employees can view own assignment components" ON salary_assignment_components FOR SELECT 
    USING (assignment_id IN (SELECT id FROM salary_assignments WHERE employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())));
