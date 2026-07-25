-- ============================================================================
-- MySQL Database Schema for KuruMaster (ระบบเตรียมสอบบรรจุข้าราชการครู)
-- Compatible with phpMyAdmin / MySQL 5.7+ / MySQL 8.0+ / Windows Server / XAMPP
-- Collation: utf8mb4_unicode_ci (รองรับภาษาไทย 100%)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `kuru_master_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `kuru_master_db`;

-- --------------------------------------------------------
-- 1. ตารางโรงเรียน / สถาบัน (schools)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `schools` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `school_code` VARCHAR(64) UNIQUE,
  `status` VARCHAR(32) DEFAULT 'active',
  `allow_all_manage_students` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. ตารางห้องเรียน / กลุ่มติว (classrooms)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `classrooms` (
  `id` VARCHAR(64) NOT NULL,
  `school` VARCHAR(255) NOT NULL,
  `grade_level` VARCHAR(64),
  `room_number` VARCHAR(64),
  `name` VARCHAR(255),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. ตารางครู / อาจารย์ / ผู้ดูแลระบบ (teachers)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `teachers` (
  `id` VARCHAR(64) NOT NULL,
  `username` VARCHAR(128) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `school` VARCHAR(255) NOT NULL,
  `citizen_id` VARCHAR(32),
  `role` VARCHAR(64) DEFAULT 'TEACHER', -- 'TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'
  `status` VARCHAR(32) DEFAULT 'active',
  `grade_level` VARCHAR(64),
  `login_count` INT DEFAULT 0,
  `last_login` BIGINT,
  `position` VARCHAR(128),
  `teaching_classes` TEXT, -- JSON string
  `teaching_classroom_ids` TEXT, -- JSON string
  `advisor_class` VARCHAR(128),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 4. ตารางนักเรียน / ผู้เข้าสอบ (students)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `students` (
  `id` VARCHAR(64) NOT NULL, -- Citizen ID or Username
  `name` VARCHAR(255) NOT NULL,
  `school` VARCHAR(255),
  `major` VARCHAR(255),
  `exam_type` VARCHAR(64) DEFAULT 'TEACHER', -- 'TEACHER', 'GENERAL_CIVIL_SERVANT'
  `avatar` VARCHAR(64) DEFAULT '👦',
  `grade` VARCHAR(64) DEFAULT 'ALL',
  `classroom` VARCHAR(64) DEFAULT '1',
  `stars` INT DEFAULT 0,
  `status` VARCHAR(32) DEFAULT 'active', -- 'active', 'pending', 'suspended'
  `password` VARCHAR(255) NOT NULL,
  `login_count` INT DEFAULT 0,
  `last_login` BIGINT,
  `inventory` TEXT, -- JSON string
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 5. ตารางคำขอลงทะเบียน (registration_requests)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `registration_requests` (
  `id` VARCHAR(64) NOT NULL,
  `citizen_id` VARCHAR(32) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `surname` VARCHAR(128) NOT NULL,
  `major` VARCHAR(255),
  `exam_type` VARCHAR(64) DEFAULT 'TEACHER',
  `school_id` VARCHAR(64),
  `timestamp` BIGINT,
  `status` VARCHAR(32) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 6. ตารางวิชา / หมวดหมู่ข้อสอบ (subjects)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `subjects` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `fullName` VARCHAR(255),
  `school` VARCHAR(255) NOT NULL,
  `teacher_id` VARCHAR(64),
  `grade` VARCHAR(64),
  `target_classrooms` TEXT, -- JSON string
  `target_classroom_ids` TEXT, -- JSON string
  `icon` VARCHAR(64),
  `color` VARCHAR(64),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 7. ตารางแบบชุดข้อสอบ / มอบหมายงาน (assignments)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `assignments` (
  `id` VARCHAR(64) NOT NULL,
  `school` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `grade` VARCHAR(64),
  `question_count` INT DEFAULT 0,
  `deadline` VARCHAR(64),
  `created_by` VARCHAR(255),
  `title` VARCHAR(255),
  `target_classrooms` TEXT, -- JSON string
  `target_classroom_ids` TEXT, -- JSON string
  `category` VARCHAR(64) DEFAULT 'GENERAL', -- 'GENERAL', 'EXAM', 'SIMULATION'
  `publish_date` VARCHAR(64),
  `expiry_date` VARCHAR(64),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 8. ตารางคลังข้อสอบ (questions)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `questions` (
  `id` VARCHAR(64) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `grade` VARCHAR(64),
  `text` TEXT NOT NULL,
  `image` LONGTEXT,
  `choices` TEXT, -- JSON string
  `correct_choice_id` VARCHAR(32),
  `explanation` TEXT,
  `school` VARCHAR(255),
  `teacher_id` VARCHAR(64),
  `assignment_id` VARCHAR(64),
  `target_classrooms` TEXT, -- JSON string
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 9. ตารางประวัติผลการสอบ (exam_results)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `exam_results` (
  `id` VARCHAR(64) NOT NULL,
  `student_id` VARCHAR(64) NOT NULL,
  `student_name` VARCHAR(255),
  `school` VARCHAR(255),
  `score` INT DEFAULT 0,
  `total_questions` INT DEFAULT 0,
  `subject` VARCHAR(255),
  `assignment_id` VARCHAR(64),
  `category` VARCHAR(64) DEFAULT 'GENERAL',
  `timestamp` BIGINT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Seed Initial Data (ข้อมูลเริ่มต้น)
-- --------------------------------------------------------

INSERT INTO `schools` (`id`, `name`, `school_code`, `status`, `allow_all_manage_students`)
VALUES ('00000000-0000-0000-0000-000000000000', 'ศูนย์ติวคุรุมาสเตอร์', 'PUBLIC', 'active', 1)
ON DUPLICATE KEY UPDATE `name`=`name`;

-- Super Admin Teacher Account (User: admin / Pass: admin123)
INSERT INTO `teachers` (`id`, `username`, `password`, `name`, `school`, `role`, `status`, `position`)
VALUES ('teacher-super-01', 'admin', 'admin123', 'ผู้ดูแลระบบคุรุมาสเตอร์', 'ศูนย์ติวคุรุมาสเตอร์', 'SUPER_ADMIN', 'active', 'ผู้อำนวยการระบบ')
ON DUPLICATE KEY UPDATE `username`=`username`;

-- Demo Teacher Account (User: teacher / Pass: 123456)
INSERT INTO `teachers` (`id`, `username`, `password`, `name`, `school`, `role`, `status`, `position`)
VALUES ('teacher-demo-01', 'teacher', '123456', 'อ.สมชาย ใจดี', 'ศูนย์ติวคุรุมาสเตอร์', 'TEACHER', 'active', 'อาจารย์ผู้สอนวิชาชีพครู')
ON DUPLICATE KEY UPDATE `username`=`username`;

-- Demo Student Account (Citizen ID / Username: 1234567890123 / Pass: 123456)
INSERT INTO `students` (`id`, `name`, `school`, `major`, `exam_type`, `avatar`, `grade`, `classroom`, `stars`, `status`, `password`)
VALUES ('1234567890123', 'สมหญิง รักเรียน', 'ศูนย์ติวคุรุมาสเตอร์', 'ภาษาไทย', 'TEACHER', '👧', 'ALL', '1', 15, 'active', '123456')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- Sample Subjects
INSERT INTO `subjects` (`id`, `name`, `fullName`, `school`, `teacher_id`, `grade`, `icon`, `color`)
VALUES 
('sub-01', 'รอบรู้วิชาชีพครู', 'ความรู้ความเข้าใจเกี่ยวกับวิชาชีพครูและกฎหมายการศึกษา', 'ศูนย์ติวคุรุมาสเตอร์', 'teacher-demo-01', 'ALL', 'BookOpen', 'amber'),
('sub-02', 'ความสามารถทั่วไป', 'ความสามารถด้านการคิดวิเคราะห์ ความเข้าใจภาษา และคณิตศาสตร์', 'ศูนย์ติวคุรุมาสเตอร์', 'teacher-demo-01', 'ALL', 'Brain', 'indigo'),
('sub-03', 'เอกภาษาไทย', 'วิชาเอกภาษาไทย สำหรับสอบบรรจุครูผู้ช่วย', 'ศูนย์ติวคุรุมาสเตอร์', 'teacher-demo-01', 'MAJOR', 'Languages', 'emerald')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- Sample Questions
INSERT INTO `questions` (`id`, `subject`, `grade`, `text`, `choices`, `correct_choice_id`, `explanation`, `school`)
VALUES
(
  'q-01', 
  'รอบรู้วิชาชีพครู', 
  'ALL', 
  'พระราชบัญญัติการศึกษาแห่งชาติ พ.ศ. 2542 กำหนดให้การจัดการศึกษาต้องยึดหลักตามข้อใดต่อไปนี้?', 
  '[{"id":"1","text":"เป็นการศึกษาตลอดชีวิตสำหรับประชาชน"},{"id":"2","text":"ให้สังคมมีส่วนร่วมในการจัดการศึกษา"},{"id":"3","text":"การพัฒนาสาระและกระบวนการเรียนรู้ให้เป็นไปอย่างต่อเนื่อง"},{"id":"4","text":"ถูกทุกข้อที่กล่าวมา"}]', 
  '4', 
  'พ.ร.บ.การศึกษาแห่งชาติ พ.ศ. 2542 มาตรา 8 กำหนดหลักการจัดการศึกษาไว้ 3 ประการคือ 1) เป็นการศึกษาตลอดชีวิตสำหรับประชาชน 2) ให้สังคมมีส่วนร่วม 3) การพัฒนาสาระและกระบวนการเรียนรู้ให้เป็นไปอย่างต่อเนื่อง', 
  'ศูนย์ติวคุรุมาสเตอร์'
),
(
  'q-02', 
  'รอบรู้วิชาชีพครู', 
  'ALL', 
  'ข้อใดคือจรรยาบรรณต่อวิชาชีพ ตามข้อบังคับคุรุสภาว่าด้วยมาตรฐานวิชาชีพ?', 
  '[{"id":"1","text":"ผู้ประกอบวิชาชีพทางการศึกษา ต้องรัก ศรัทธา ซื่อสัตย์สุจริต รับผิดชอบต่อวิชาชีพ"},{"id":"2","text":"ผู้ประกอบวิชาชีพทางการศึกษา ต้องมีวินัยในตนเอง"},{"id":"3","text":"ผู้ประกอบวิชาชีพทางการศึกษา ต้องประเวณีดีงาม"},{"id":"4","text":"ผู้ประกอบวิชาชีพทางการศึกษา ต้องเป็นผู้นำในการอนุรักษ์สิ่งแวดล้อม"}]', 
  '1', 
  'จรรยาบรรณต่อวิชาชีพ หมายถึง ผู้ประกอบวิชาชีพทางการศึกษาต้องรัก ศรัทธา ซื่อสัตย์สุจริต และรับผิดชอบต่อวิชาชีพ เป็นสมาชิกที่ดีขององค์กรวิชาชีพ', 
  'ศูนย์ติวคุรุมาสเตอร์'
),
(
  'q-03', 
  'ความสามารถทั่วไป', 
  'ALL', 
  'ถ้า A = 15% ของ 200 และ B = 20% ของ 150 ข้อใดต่อไปนี้ถูกต้อง?', 
  '[{"id":"1","text":"A มากกว่า B"},{"id":"2","text":"A น้อยกว่า B"},{"id":"3","text":"A เท่ากับ B"},{"id":"4","text":"สรุปแน่นอนไม่ได้"}]', 
  '3', 
  'A = 0.15 x 200 = 30 และ B = 0.20 x 150 = 30 ดังนั้น A เท่ากับ B', 
  'ศูนย์ติวคุรุมาสเตอร์'
);
