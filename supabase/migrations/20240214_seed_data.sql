-- Add 'code' column to designations if missing
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'designations' AND column_name = 'code') THEN 
        ALTER TABLE designations ADD COLUMN code TEXT; 
    END IF; 
END $$;

-- Insert Departments
INSERT INTO departments (name, code)
SELECT 'Engineering', 'ENG'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE code = 'ENG');

INSERT INTO departments (name, code)
SELECT 'Human Resources', 'HR'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE code = 'HR');

INSERT INTO departments (name, code)
SELECT 'Sales', 'SAL'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE code = 'SAL');

INSERT INTO departments (name, code)
SELECT 'Marketing', 'MKT'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE code = 'MKT');


-- Insert Designations
INSERT INTO designations (title, code)
SELECT 'Software Engineer', 'SE'
WHERE NOT EXISTS (SELECT 1 FROM designations WHERE title = 'Software Engineer');

INSERT INTO designations (title, code)
SELECT 'Senior Software Engineer', 'SSE'
WHERE NOT EXISTS (SELECT 1 FROM designations WHERE title = 'Senior Software Engineer');

INSERT INTO designations (title, code)
SELECT 'HR Manager', 'HRM'
WHERE NOT EXISTS (SELECT 1 FROM designations WHERE title = 'HR Manager');

INSERT INTO designations (title, code)
SELECT 'Sales Executive', 'SE_SALES'
WHERE NOT EXISTS (SELECT 1 FROM designations WHERE title = 'Sales Executive');
