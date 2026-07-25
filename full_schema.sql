-- Full Schema for KuruMaster App
-- Run this in Supabase SQL Editor to rebuild your database

-- 1. Schools Table
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    school_code TEXT UNIQUE,
    status TEXT DEFAULT 'active',
    allow_all_manage_students BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Classrooms Table
CREATE TABLE IF NOT EXISTS classrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school TEXT NOT NULL,
    grade_level TEXT,
    room_number TEXT,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    school TEXT NOT NULL,
    citizen_id TEXT,
    role TEXT DEFAULT 'TEACHER',
    status TEXT DEFAULT 'active',
    grade_level TEXT,
    login_count INTEGER DEFAULT 0,
    last_login BIGINT,
    position TEXT,
    teaching_classes TEXT, -- JSON string
    teaching_classroom_ids TEXT, -- JSON string
    advisor_class TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Students Table
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY, -- Using citizen_id or custom ID
    name TEXT NOT NULL,
    school TEXT,
    major TEXT,
    exam_type TEXT DEFAULT 'TEACHER',
    avatar TEXT DEFAULT '👦',
    grade TEXT DEFAULT 'ALL',
    classroom TEXT DEFAULT '1',
    stars INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    password TEXT NOT NULL,
    login_count INTEGER DEFAULT 0,
    last_login BIGINT,
    inventory TEXT, -- JSON string
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Registration Requests Table
CREATE TABLE IF NOT EXISTS registration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citizen_id TEXT NOT NULL,
    name TEXT NOT NULL,
    surname TEXT NOT NULL,
    major TEXT,
    exam_type TEXT DEFAULT 'TEACHER',
    school_id TEXT,
    timestamp BIGINT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    fullName TEXT,
    school TEXT NOT NULL,
    teacher_id TEXT,
    grade TEXT,
    target_classrooms TEXT, -- JSON string
    target_classroom_ids TEXT, -- JSON string
    icon TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Assignments Table
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school TEXT NOT NULL,
    subject TEXT NOT NULL,
    grade TEXT,
    question_count INTEGER DEFAULT 0,
    deadline TEXT,
    created_by TEXT,
    title TEXT,
    target_classrooms TEXT, -- JSON string
    target_classroom_ids TEXT, -- JSON string
    category TEXT DEFAULT 'GENERAL',
    publish_date TEXT,
    expiry_date TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. Questions Table
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT NOT NULL,
    grade TEXT,
    text TEXT NOT NULL,
    image TEXT,
    choices TEXT, -- JSON string
    correct_choice_id TEXT,
    explanation TEXT,
    school TEXT,
    teacher_id TEXT,
    assignment_id UUID,
    target_classrooms TEXT, -- JSON string
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 9. Exam Results Table
CREATE TABLE IF NOT EXISTS exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL,
    student_name TEXT,
    school TEXT,
    score INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    subject TEXT,
    assignment_id UUID,
    category TEXT DEFAULT 'GENERAL',
    timestamp BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert Default School for Public Use
INSERT INTO schools (id, name, school_code, status)
VALUES ('00000000-0000-0000-0000-000000000000', 'ศูนย์ติวคุรุมาสเตอร์', 'PUBLIC', 'active')
ON CONFLICT (id) DO NOTHING;
