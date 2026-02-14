-- Enable RLS on Employees (should already be enabled, but ensuring)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to INSERT into employees
-- Note: In a real app, you might restrict this to 'admin' role or specific users.
-- For now, we allow any logged-in user to add employees.
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON employees;

CREATE POLICY "Enable insert for authenticated users" ON employees
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Also ensure we can SELECT the new employee to update the UI/cache
DROP POLICY IF EXISTS "Enable select for authenticated users" ON employees;
CREATE POLICY "Enable select for authenticated users" ON employees
    FOR SELECT
    TO authenticated
    USING (true);
