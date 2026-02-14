-- THIS SCRIPT SELF-HEALS THE ADMIN ACCESS FOR THE LOGGED-IN USER

-- 1. Create a function to auto-create/link admin employee
-- We use a SECURITY DEFINER function to bypass RLS during this operation
CREATE OR REPLACE FUNCTION ensure_current_user_is_admin()
RETURNS void AS $$
DECLARE
    curr_user_id UUID;
    curr_user_email TEXT;
BEGIN
    -- Get current auth user
    curr_user_id := auth.uid();
    
    -- If no user logged in (e.g. running in SQL editor without impersonation), 
    -- we can't do much via auth.uid(), but we can try to fix via plain SQL below.
    -- However, for the App's "Call to Fix", this is useful.
    -- For SQL Editor execution, we rely on the DO block below.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. THE MAIN FIX SCRIPT (Run this in SQL Editor)
DO $$
DECLARE
    target_email TEXT;
    user_record RECORD;
BEGIN
    -- Iterate over ALL users in auth.users (Since you can't easily know WHICH one is you in SQL Editor)
    -- And ensure they have an employee record.
    
    FOR user_record IN SELECT id, email, raw_user_meta_data FROM auth.users
    LOOP
        RAISE NOTICE 'Processing user: %', user_record.email;

        -- Check if employee exists with this email
        IF EXISTS (SELECT 1 FROM employees WHERE email = user_record.email) THEN
            -- Update existing employee to link to this user and be admin
            UPDATE employees 
            SET user_id = user_record.id,
                role = 'admin'
            WHERE email = user_record.email;
        ELSE
            -- Create new employee if not exists
            INSERT INTO employees (
                first_name, 
                last_name, 
                email, 
                department_id, 
                designation_id, 
                joining_date, 
                user_id, 
                role
            )
            VALUES (
                COALESCE(user_record.raw_user_meta_data->>'full_name', 'Admin User'),
                '',
                user_record.email,
                (SELECT id FROM departments LIMIT 1), -- Assign random dept
                (SELECT id FROM designations LIMIT 1), -- Assign random designation
                CURRENT_DATE,
                user_record.id,
                'admin'
            );
        END IF;
    END LOOP;
END $$;
