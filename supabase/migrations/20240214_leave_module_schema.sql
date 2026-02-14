-- Leave Types: Add configuration columns
ALTER TABLE leave_types
ADD COLUMN IF NOT EXISTS days_per_year INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS carry_forward_allowed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS max_carry_forward_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS encashment_allowed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS applicable_to TEXT DEFAULT 'All', -- All, Male, Female
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS gender_applicability TEXT DEFAULT 'All'; -- Alias/Clarification

-- Create Leave Policies Table
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

-- RLS Policies
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_policies ENABLE ROW LEVEL SECURITY;

-- Leave Types: Admin can do all, Others read-only
CREATE POLICY "Admin full access leave_types" ON leave_types
    FOR ALL
    USING (auth.uid() IN (SELECT user_id FROM employees WHERE department_id IN (SELECT id FROM departments WHERE name = 'Human Resources'))); -- Simplified Admin check for now, or use role in metadata

CREATE POLICY "Everyone read leave_types" ON leave_types
    FOR SELECT
    USING (true);

-- Leave Policies: Admin full access, Others read-only
CREATE POLICY "Admin full access leave_policies" ON leave_policies
    FOR ALL
    USING (true); -- TODO: Restrict to Admin

CREATE POLICY "Everyone read leave_policies" ON leave_policies
    FOR SELECT
    USING (true);
