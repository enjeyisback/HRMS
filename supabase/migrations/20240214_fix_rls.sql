-- Enable RLS on Departments and Designations (if not already enabled)
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE designations ENABLE ROW LEVEL SECURITY;

-- Policy: Allow everyone (Authenticated and Anon) to read Departments
-- We use 'true' to allow access to all rows.
DROP POLICY IF EXISTS "Enable read access for all users" ON departments;
CREATE POLICY "Enable read access for all users" ON departments
    FOR SELECT
    USING (true);

-- Policy: Allow everyone (Authenticated and Anon) to read Designations
DROP POLICY IF EXISTS "Enable read access for all users" ON designations;
CREATE POLICY "Enable read access for all users" ON designations
    FOR SELECT
    USING (true);
