import React from 'react';
import { Teacher } from '../../types';
import { Database, Copy, AlertTriangle, Terminal, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface SystemManagerProps {
  teacher: Teacher;
}

const MYSQL_SCHEMA_SCRIPT = `-- [ KURUMASTER MYSQL DATABASE SCHEMA - COMPATIBLE WITH PHPMYADMIN & WINDOWS SERVER ]
-- ใช้สำหรับนำเข้าใน phpMyAdmin หรือ MySQL Workbench

CREATE DATABASE IF NOT EXISTS \`kuru_master_db\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`kuru_master_db\`;

-- 1. Schools
CREATE TABLE IF NOT EXISTS \`schools\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`school_code\` VARCHAR(64) UNIQUE,
  \`status\` VARCHAR(32) DEFAULT 'active',
  \`allow_all_manage_students\` TINYINT(1) DEFAULT 0,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Teachers
CREATE TABLE IF NOT EXISTS \`teachers\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`username\` VARCHAR(128) NOT NULL UNIQUE,
  \`password\` VARCHAR(255) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`school\` VARCHAR(255) NOT NULL,
  \`role\` VARCHAR(64) DEFAULT 'TEACHER',
  \`status\` VARCHAR(32) DEFAULT 'active',
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Students
CREATE TABLE IF NOT EXISTS \`students\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`school\` VARCHAR(255),
  \`major\` VARCHAR(255),
  \`exam_type\` VARCHAR(64) DEFAULT 'TEACHER',
  \`stars\` INT DEFAULT 0,
  \`status\` VARCHAR(32) DEFAULT 'active',
  \`password\` VARCHAR(255) NOT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default Admin
INSERT INTO \`teachers\` (\`id\`, \`username\`, \`password\`, \`name\`, \`school\`, \`role\`)
VALUES ('teacher-super-01', 'admin', 'admin123', 'ผู้ดูแลระบบคุรุมาสเตอร์', 'ศูนย์ติวคุรุมาสเตอร์', 'SUPER_ADMIN')
ON DUPLICATE KEY UPDATE \`username\`=\`username\`;
`;

const SystemManager: React.FC<SystemManagerProps> = ({ teacher }) => {
    const handleCopy = () => {
        navigator.clipboard.writeText(MYSQL_SCHEMA_SCRIPT);
        alert("คัดลอกสคริปต์ MySQL เรียบร้อย! นำไปรันใน phpMyAdmin หรือ MySQL Workbench ได้เลยครับ");
    };

    return (
        <div className="font-prompt animate-fade-in space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <Database className="text-emerald-600" size={32}/> ระบบซ่อมบำรุงและจัดการ MySQL Database
                    </h3>
                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">MySQL / phpMyAdmin Administration & Setup</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-emerald-50 border-2 border-emerald-200 p-6 rounded-[35px] flex items-center gap-5 shadow-sm">
                    <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg"><CheckCircle2 size={32}/></div>
                    <div>
                        <h4 className="font-black text-emerald-900 text-lg">ฐานข้อมูลถูกเปลี่ยนเป็น MySQL เรียบร้อยแล้ว</h4>
                        <p className="text-emerald-700 text-sm font-bold">รองรับการใช้งานร่วมกับ phpMyAdmin, Windows Server Peak control, XAMPP และ Node.js Backend API</p>
                    </div>
                </div>

                <div className="bg-slate-900 p-10 rounded-[50px] shadow-2xl border-t-8 border-emerald-500 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><Terminal size={150}/></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 text-emerald-400 mb-8">
                            <ShieldCheck size={48}/>
                            <div>
                                <h3 className="text-2xl font-black text-white">MySQL Schema Setup (phpMyAdmin)</h3>
                                <p className="text-slate-400 text-sm">Full SQL Structure & Initial Seed Data</p>
                            </div>
                        </div>
                        <pre className="text-emerald-400 font-mono text-[11px] overflow-x-auto p-8 bg-black/40 rounded-3xl max-h-[400px] border border-slate-800 leading-relaxed custom-scrollbar mb-8">
                            {MYSQL_SCHEMA_SCRIPT}
                        </pre>
                        <button onClick={handleCopy} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-[25px] font-black transition-all flex items-center justify-center gap-4 shadow-xl border-b-8 border-emerald-800 active:scale-95">
                            <Copy size={24}/> <span className="text-xl">คัดลอกสคริปต์ MySQL Structure</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemManager;
