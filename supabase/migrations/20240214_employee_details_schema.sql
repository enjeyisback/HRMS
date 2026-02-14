-- Add new columns to employees table
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS employee_code TEXT UNIQUE, -- Custom ID like EMP001
ADD COLUMN IF NOT EXISTS gender TEXT, -- Already exists but ensuring
ADD COLUMN IF NOT EXISTS blood_group TEXT,
ADD COLUMN IF NOT EXISTS marital_status TEXT,

-- Emergency Contact
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,

-- Addresses (Using structred columns for now as requested)
ADD COLUMN IF NOT EXISTS current_address_street TEXT,
ADD COLUMN IF NOT EXISTS current_address_city TEXT,
ADD COLUMN IF NOT EXISTS current_address_state TEXT,
ADD COLUMN IF NOT EXISTS current_address_zip TEXT,

ADD COLUMN IF NOT EXISTS permanent_address_street TEXT,
ADD COLUMN IF NOT EXISTS permanent_address_city TEXT,
ADD COLUMN IF NOT EXISTS permanent_address_state TEXT,
ADD COLUMN IF NOT EXISTS permanent_address_zip TEXT,

-- Employment Details
ADD COLUMN IF NOT EXISTS work_location TEXT,
ADD COLUMN IF NOT EXISTS probation_period_months INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS confirmation_date DATE,
ADD COLUMN IF NOT EXISTS official_email TEXT, -- Can be same as email or different

-- Statutory & Salary (Simplified for this form view, though ideally normalized)
ADD COLUMN IF NOT EXISTS pf_number TEXT, -- Alias for uan_number if needed, or separate
ADD COLUMN IF NOT EXISTS esic_applicable BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pf_contribution_percent NUMERIC(5, 2),

-- Salary Structure Snapshot (For the form)
ADD COLUMN IF NOT EXISTS base_salary NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS hra NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS other_allowances NUMERIC(12, 2) DEFAULT 0,

-- Metadata
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Create Storage Bucket for Documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee_documents', 'employee_documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Allow authenticated users to upload
CREATE POLICY "Allow authenticated updates" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'employee_documents');

CREATE POLICY "Allow authenticated reads" ON storage.objects
FOR SELECT TO authenticated USING (bucket_id = 'employee_documents');
