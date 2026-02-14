-- Settings & Administrative Schema

-- 1. Company Settings
CREATE TABLE IF NOT EXISTS company_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL DEFAULT 'HRMS Solution',
    company_logo_url TEXT,
    address_street TEXT,
    address_city TEXT,
    address_state TEXT,
    address_zip TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    financial_year_start_month INTEGER DEFAULT 4, -- April
    week_start_day INTEGER DEFAULT 1, -- Monday (0=Sunday)
    working_days INTEGER[] DEFAULT '{1,2,3,4,5,6}', -- Mon-Sat
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO company_settings (id) VALUES (uuid_generate_v4()) ON CONFLICT DO NOTHING;

-- 2. Holiday Calendar
CREATE TABLE IF NOT EXISTS holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    date DATE NOT NULL UNIQUE,
    type TEXT DEFAULT 'Public', -- Public, Festival, Optional
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Email Settings (SMTP Bridge)
-- Note: In a real app, password should be encrypted/hidden
CREATE TABLE IF NOT EXISTS email_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    smtp_host TEXT,
    smtp_port INTEGER,
    smtp_user TEXT,
    smtp_pass TEXT,
    encryption TEXT DEFAULT 'TLS',
    from_email TEXT,
    from_name TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL, -- e.g., 'payslip_notification'
    subject TEXT NOT NULL,
    body TEXT NOT NULL, -- Markdown or HTML
    variables JSONB DEFAULT '[]', -- List of supported variables
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action_type TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'AUTH', 'SYSTEM'
    module TEXT NOT NULL,      -- 'employees', 'payroll', 'settings'
    description TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read for company info
DROP POLICY IF EXISTS "Public read company settings" ON company_settings;
CREATE POLICY "Public read company settings" ON company_settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read holidays" ON holidays;
CREATE POLICY "Public read holidays" ON holidays FOR SELECT TO authenticated USING (true);

-- Restrict sensitive data to Super/HR Admin
DROP POLICY IF EXISTS "Manage settings" ON company_settings;
CREATE POLICY "Manage settings" ON company_settings FOR ALL USING (public.has_permission('rbac.manage'));

DROP POLICY IF EXISTS "Manage holidays" ON holidays;
CREATE POLICY "Manage holidays" ON holidays FOR ALL USING (public.has_permission('rbac.manage'));

DROP POLICY IF EXISTS "Manage email" ON email_settings;
CREATE POLICY "Manage email" ON email_settings FOR ALL USING (public.has_permission('rbac.manage'));

DROP POLICY IF EXISTS "Manage templates" ON email_templates;
CREATE POLICY "Manage templates" ON email_templates FOR ALL USING (public.has_permission('rbac.manage'));

DROP POLICY IF EXISTS "View logs" ON audit_logs;
CREATE POLICY "View logs" ON audit_logs FOR SELECT USING (public.has_permission('rbac.manage'));

-- Specific insert for system logging (anyone can log, but usually triggered via lib)
DROP POLICY IF EXISTS "System can log" ON audit_logs;
CREATE POLICY "System can log" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Seed Default Templates
INSERT INTO email_templates (name, subject, body, variables) VALUES
('leave_approved', 'Your Leave Request for {{start_date}} is Approved', 'Hello {{name}}, your leave request has been approved.', '["name", "start_date"]'),
('leave_rejected', 'Update on your Leave Request: {{start_date}}', 'Hello {{name}}, unfortunately your leave request was rejected.', '["name", "start_date"]'),
('payslip_issued', 'Payslip Issued - {{month}} {{year}}', 'Hello {{name}}, your payslip for {{month}} {{year}} is now available.', '["name", "month", "year"]')
ON CONFLICT (name) DO NOTHING;
