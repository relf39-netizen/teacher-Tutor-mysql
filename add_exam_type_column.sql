-- SQL to add exam_type column to registration_requests and students tables
ALTER TABLE registration_requests ADD COLUMN IF NOT EXISTS exam_type TEXT DEFAULT 'TEACHER';
ALTER TABLE students ADD COLUMN IF NOT EXISTS exam_type TEXT DEFAULT 'TEACHER';

-- Refresh the schema cache in Supabase after running this
