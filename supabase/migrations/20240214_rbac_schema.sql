-- Role-Based Access Control (RBAC) Schema

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS app_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL, -- 'Super Admin', 'HR Admin', 'Manager', 'Employee'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Permissions Table
CREATE TABLE IF NOT EXISTS app_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL, -- e.g., 'employees.view', 'payroll.process'
    module TEXT NOT NULL,      -- e.g., 'employees', 'payroll'
    action TEXT NOT NULL,      -- e.g., 'view', 'process'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Role-Permissions Mapping
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID REFERENCES app_roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES app_permissions(id) ON DELETE CASCADE,
    UNIQUE(role_id, permission_id)
);

-- 4. Add role reference to employees
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='role_id') THEN
        ALTER TABLE employees ADD COLUMN role_id UUID REFERENCES app_roles(id);
    END IF;
END $$;

-- 5. Helper function for RLS to check permissions
-- This function checks if a user's role has a specific permission
CREATE OR REPLACE FUNCTION public.has_permission(permission_code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM employees e
        JOIN role_permissions rp ON e.role_id = rp.role_id
        JOIN app_permissions p ON rp.permission_id = p.id
        WHERE e.user_id = auth.uid()
        AND p.code = permission_code
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Initial Seed Data
INSERT INTO app_roles (name, description) VALUES
('Super Admin', 'Full system access'),
('HR Admin', 'Manage HR, Payroll, and Attendance'),
('Manager', 'Team management and approvals'),
('Employee', 'Self-service access')
ON CONFLICT (name) DO NOTHING;

INSERT INTO app_permissions (code, module, action, description) VALUES
-- Employee module
('employees.view', 'employees', 'view', 'View employee list'),
('employees.manage', 'employees', 'manage', 'Create/Edit/Delete employees'),
-- Leave module
('leave.apply', 'leave', 'apply', 'Apply for leave'),
('leave.view_own', 'leave', 'view_own', 'View own leave history'),
('leave.view_all', 'leave', 'view_all', 'View all leave requests'),
('leave.approve', 'leave', 'approve', 'Approve/Reject leaves'),
('leave.manage_types', 'leave', 'manage', 'Manage leave types and allocations'),
-- Attendance module
('attendance.mark', 'attendance', 'mark', 'Mark daily attendance'),
('attendance.view_own', 'attendance', 'view_own', 'View own attendance'),
('attendance.view_all', 'attendance', 'view_all', 'View all attendance logs'),
('attendance.manage', 'attendance', 'manage', 'Bulk mark or regularize attendance'),
-- Payroll module
('payroll.view_own', 'payroll', 'view_own', 'View own payslips'),
('payroll.view_all', 'payroll', 'view_all', 'View all payroll runs'),
('payroll.process', 'payroll', 'process', 'Run and process payroll'),
('payroll.manage', 'payroll', 'manage', 'Manage salary components and templates'),
-- Reports
('reports.view', 'reports', 'view', 'Access analytics and reports'),
-- RBAC
('rbac.manage', 'rbac', 'manage', 'Manage roles and permissions')
ON CONFLICT (code) DO NOTHING;

-- Assign permissions to roles (Examples)
-- Note: In a real scenario, Super Admin would get all.
DO $$
DECLARE
    super_admin_id UUID := (SELECT id FROM app_roles WHERE name = 'Super Admin');
    hr_admin_id UUID := (SELECT id FROM app_roles WHERE name = 'HR Admin');
    manager_id UUID := (SELECT id FROM app_roles WHERE name = 'Manager');
    employee_id UUID := (SELECT id FROM app_roles WHERE name = 'Employee');
BEGIN
    -- Super Admin gets everything
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT super_admin_id, id FROM app_permissions
    ON CONFLICT DO NOTHING;

    -- HR Admin gets most
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT hr_admin_id, id FROM app_permissions 
    WHERE code NOT IN ('rbac.manage')
    ON CONFLICT DO NOTHING;

    -- Manager
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT manager_id, id FROM app_permissions 
    WHERE code IN ('employees.view', 'leave.apply', 'leave.view_own', 'leave.view_all', 'leave.approve', 'attendance.mark', 'attendance.view_own', 'attendance.view_all', 'payroll.view_own', 'reports.view')
    ON CONFLICT DO NOTHING;

    -- Employee
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT employee_id, id FROM app_permissions 
    WHERE code IN ('leave.apply', 'leave.view_own', 'attendance.mark', 'attendance.view_own', 'payroll.view_own')
    ON CONFLICT DO NOTHING;
END $$;

-- 7. Update existing RLS policies (Example for employees table)
-- We need to replace hardcoded role checks with permission checks
-- ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Admins can manage all employees" ON employees;
-- CREATE POLICY "Permissions-based employee management" ON employees
--     FOR ALL USING (public.has_permission('employees.manage'));

-- RLS for new RBAC tables
ALTER TABLE app_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for roles/perms" ON app_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow public read for perms" ON app_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow public read for role_perms" ON role_permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only Super Admin can manage RBAC" ON app_roles FOR ALL USING (public.has_permission('rbac.manage'));
CREATE POLICY "Only Super Admin can manage Permissions" ON app_permissions FOR ALL USING (public.has_permission('rbac.manage'));
CREATE POLICY "Only Super Admin can manage Role-Perms" ON role_permissions FOR ALL USING (public.has_permission('rbac.manage'));
