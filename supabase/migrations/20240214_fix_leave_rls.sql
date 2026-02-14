-- Drop existing policies to avoid conflicts/confusion
DROP POLICY IF EXISTS "Admin full access leave_types" ON leave_types;
DROP POLICY IF EXISTS "Everyone read leave_types" ON leave_types;
DROP POLICY IF EXISTS "Admin full access leave_policies" ON leave_policies;
DROP POLICY IF EXISTS "Everyone read leave_policies" ON leave_policies;

-- Re-create Policies using 'role' column

-- 1. Leave Types
-- Read: Open to all authenticated users
CREATE POLICY "Enable read access for all users" ON leave_types
    FOR SELECT TO authenticated
    USING (true);

-- Write: Only Admins (and maybe Managers)
CREATE POLICY "Enable write access for admins" ON leave_types
    FOR ALL TO authenticated
    USING (
        auth.uid() IN (
            SELECT user_id FROM employees WHERE role = 'admin'
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM employees WHERE role = 'admin'
        )
    );

-- 2. Leave Policies
-- Read: Open to all
CREATE POLICY "Enable read access for all users" ON leave_policies
    FOR SELECT TO authenticated
    USING (true);

-- Write: Only Admins
CREATE POLICY "Enable write access for admins" ON leave_policies
    FOR ALL TO authenticated
    USING (
        auth.uid() IN (
            SELECT user_id FROM employees WHERE role = 'admin'
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM employees WHERE role = 'admin'
        )
    );

-- 3. Ensure current user is admin (Self-healing for dev)
-- Provide a script to set the current user as admin if needed.
-- We can't easily know the current auth.uid() here in a generic migration, 
-- but we can update the known 'admin' user if we seeded one, or relying on the user to manually update their role.

-- Make sure the role column exists (idempotent)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'role') THEN 
        ALTER TABLE employees ADD COLUMN role TEXT DEFAULT 'employee'; 
    END IF; 
END $$;
