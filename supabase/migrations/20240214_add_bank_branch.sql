-- Add bank_branch column to employees table
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS bank_branch TEXT;
