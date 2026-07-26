import React, { useState, useEffect } from 'react';
import { Teacher } from '../../types';
import { Database, Copy, Terminal, ShieldCheck, CheckCircle2, RefreshCw, Upload, FileText, Check, AlertCircle, Layers } from 'lucide-react';

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

-- 2. Classrooms
CREATE TABLE IF NOT EXISTS \`classrooms\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`school\` VARCHAR(255) NOT NULL,
  \`grade_level\` VARCHAR(64),
  \`room_number\` VARCHAR(64),
  \`name\` VARCHAR(255),
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Teachers
CREATE TABLE IF NOT EXISTS \`teachers\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`username\` VARCHAR(128) NOT NULL UNIQUE,
  \`password\` VARCHAR(255) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`school\` VARCHAR(255) NOT NULL,
  \`role\` VARCHAR(64) DEFAULT 'TEACHER',
  \`status\` VARCHAR(32) DEFAULT 'active',
  \`position\` VARCHAR(128),
  \`login_count\` INT DEFAULT 0,
  \`last_login\` BIGINT,
  \`teaching_classes\` TEXT,
  \`teaching_classroom_ids\` TEXT,
  \`advisor_class\` VARCHAR(128),
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Students
CREATE TABLE IF NOT EXISTS \`students\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`school\` VARCHAR(255),
  \`major\` VARCHAR(255),
  \`exam_type\` VARCHAR(64) DEFAULT 'TEACHER',
  \`avatar\` VARCHAR(64) DEFAULT '👦',
  \`grade\` VARCHAR(64) DEFAULT 'ALL',
  \`classroom\` VARCHAR(64) DEFAULT '1',
  \`stars\` INT DEFAULT 0,
  \`status\` VARCHAR(32) DEFAULT 'active',
  \`password\` VARCHAR(255) NOT NULL,
  \`login_count\` INT DEFAULT 0,
  \`last_login\` BIGINT,
  \`inventory\` TEXT,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Registration Requests
CREATE TABLE IF NOT EXISTS \`registration_requests\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`citizen_id\` VARCHAR(32) NOT NULL,
  \`name\` VARCHAR(128) NOT NULL,
  \`surname\` VARCHAR(128) NOT NULL,
  \`major\` VARCHAR(255),
  \`exam_type\` VARCHAR(64) DEFAULT 'TEACHER',
  \`school_id\` VARCHAR(64),
  \`timestamp\` BIGINT,
  \`status\` VARCHAR(32) DEFAULT 'pending',
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Subjects
CREATE TABLE IF NOT EXISTS \`subjects\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`fullName\` VARCHAR(255),
  \`school\` VARCHAR(255) NOT NULL,
  \`teacher_id\` VARCHAR(64),
  \`grade\` VARCHAR(64),
  \`target_classrooms\` TEXT,
  \`target_classroom_ids\` TEXT,
  \`icon\` VARCHAR(64),
  \`color\` VARCHAR(64),
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Assignments
CREATE TABLE IF NOT EXISTS \`assignments\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`school\` VARCHAR(255) NOT NULL,
  \`subject\` VARCHAR(255) NOT NULL,
  \`grade\` VARCHAR(64),
  \`question_count\` INT DEFAULT 0,
  \`deadline\` VARCHAR(64),
  \`created_by\` VARCHAR(255),
  \`title\` VARCHAR(255),
  \`target_classrooms\` TEXT,
  \`target_classroom_ids\` TEXT,
  \`category\` VARCHAR(64) DEFAULT 'GENERAL',
  \`publish_date\` VARCHAR(64),
  \`expiry_date\` VARCHAR(64),
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Questions
CREATE TABLE IF NOT EXISTS \`questions\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`subject\` VARCHAR(255) NOT NULL,
  \`grade\` VARCHAR(64),
  \`text\` TEXT NOT NULL,
  \`image\` LONGTEXT,
  \`choices\` TEXT,
  \`correct_choice_id\` VARCHAR(32),
  \`explanation\` TEXT,
  \`school\` VARCHAR(255),
  \`teacher_id\` VARCHAR(64),
  \`assignment_id\` VARCHAR(64),
  \`target_classrooms\` TEXT,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Exam Results
CREATE TABLE IF NOT EXISTS \`exam_results\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`student_id\` VARCHAR(64) NOT NULL,
  \`student_name\` VARCHAR(255),
  \`school\` VARCHAR(255),
  \`score\` INT DEFAULT 0,
  \`total_questions\` INT DEFAULT 0,
  \`subject\` VARCHAR(255),
  \`assignment_id\` VARCHAR(64),
  \`category\` VARCHAR(64) DEFAULT 'GENERAL',
  \`timestamp\` BIGINT,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default Admin Account
INSERT INTO \`teachers\` (\`id\`, \`username\`, \`password\`, \`name\`, \`school\`, \`role\`, \`status\`, \`position\`)
VALUES ('teacher-super-01', 'admin', 'admin123', 'ผู้ดูแลระบบคุรุมาสเตอร์', 'ศูนย์ติวคุรุมาสเตอร์', 'SUPER_ADMIN', 'active', 'ผู้อำนวยการระบบ')
ON DUPLICATE KEY UPDATE \`username\`=\`username\`;
`;

const SystemManager: React.FC<SystemManagerProps> = ({ teacher }) => {
  const [dbStatus, setDbStatus] = useState<{ connected?: boolean; databaseName?: string; host?: string; loading?: boolean }>({ loading: true });
  const [initMsg, setInitMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  // Supabase Import State
  const [targetTable, setTargetTable] = useState('auto');
  const [importJsonText, setImportJsonText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; summary?: Record<string, number> } | null>(null);

  const checkDbStatus = async () => {
    setDbStatus((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch('/api/db-status');
      const data = await res.json();
      setDbStatus({ connected: data.connected, databaseName: data.databaseName, host: data.host, loading: false });
    } catch {
      setDbStatus({ connected: false, loading: false });
    }
  };

  useEffect(() => {
    checkDbStatus();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(MYSQL_SCHEMA_SCRIPT);
    alert('คัดลอกสคริปต์ MySQL เรียบร้อย! นำไปรันใน phpMyAdmin หรือ MySQL Workbench ได้เลยครับ');
  };

  const handleAutoInitDb = async () => {
    setIsMigrating(true);
    setInitMsg(null);
    try {
      const res = await fetch('/api/admin/init-db', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setInitMsg({ type: 'success', text: data.message });
      } else {
        setInitMsg({ type: 'error', text: data.message });
      }
      checkDbStatus();
    } catch (err: any) {
      setInitMsg({ type: 'error', text: 'เกิดข้อผิดพลาดในการติดตั้งฐานข้อมูล: ' + err.message });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImportJsonText(event.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  const handleImportData = async () => {
    if (!importJsonText.trim()) {
      alert('กรุณาวางข้อความ JSON หรืออัปโหลดไฟล์ JSON ก่อนกดนำเข้าข้อมูล');
      return;
    }

    let parsedData: any = null;
    try {
      parsedData = JSON.parse(importJsonText);
    } catch {
      alert('รูปแบบ JSON ไม่ถูกต้อง กรุณาตรวจสอบวงเล็บและเครื่องหมายคำพูดในไฟล์ JSON');
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const res = await fetch('/api/admin/import-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName: targetTable,
          data: parsedData,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setImportResult({ success: true, message: data.message, summary: data.summary });
      } else {
        setImportResult({ success: false, message: data.message });
      }
    } catch (err: any) {
      setImportResult({ success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์: ' + err.message });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="font-prompt animate-fade-in space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <Database className="text-emerald-600" size={32} /> ระบบซ่อมบำรุงและจัดการ MySQL Database
          </h3>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">
            MySQL Auto Migration & Supabase Data Importer
          </p>
        </div>
        <button
          onClick={checkDbStatus}
          disabled={dbStatus.loading}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-sm"
        >
          <RefreshCw size={18} className={dbStatus.loading ? 'animate-spin text-emerald-600' : ''} />
          <span>ตรวจสอบการเชื่อมต่อ MySQL</span>
        </button>
      </div>

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Connection Status Card & Auto Setup */}
        <div className="bg-white border-2 border-slate-100 p-8 rounded-[40px] shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-5">
              <div className={`p-4 rounded-3xl ${dbStatus.connected ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-amber-500 text-white shadow-lg shadow-amber-200'}`}>
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h4 className="font-black text-slate-800 text-xl flex items-center gap-3">
                  สถานะการเชื่อมต่อ MySQL:
                  <span className={`px-4 py-1 rounded-full text-xs font-bold ${dbStatus.connected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {dbStatus.connected ? 'เชื่อมต่อแล้ว (Connected)' : 'โหมดสำรอง (Fallback Engine Active)'}
                  </span>
                </h4>
                <p className="text-slate-500 text-sm font-medium mt-1">
                  Database Name: <span className="font-mono font-bold text-slate-700">{dbStatus.databaseName || 'kuru_master_db'}</span> | Host: <span className="font-mono font-bold text-slate-700">{dbStatus.host || 'localhost'}</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleAutoInitDb}
              disabled={isMigrating}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-5 rounded-2xl font-black transition-all flex items-center gap-3 shadow-lg hover:shadow-emerald-200 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={22} className={isMigrating ? 'animate-spin' : ''} />
              <span>{isMigrating ? 'กำลังสร้างฐานข้อมูล...' : '⚡ สร้างโครงสร้างตาราง MySQL อัตโนมัติ'}</span>
            </button>
          </div>

          {initMsg && (
            <div className={`p-5 rounded-2xl border flex items-center gap-4 ${initMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
              {initMsg.type === 'success' ? <CheckCircle2 className="text-emerald-600" size={24} /> : <AlertCircle className="text-amber-600" size={24} />}
              <span className="font-bold text-sm">{initMsg.text}</span>
            </div>
          )}

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-xs text-slate-600 font-medium leading-relaxed">
            💡 <span className="font-bold text-slate-800">ระบบสร้างตารางอัตโนมัติ (Auto Schema Migration):</span> เมื่อกดปุ่ม ระบบจะสร้างตารางทั้ง 9 ตาราง ได้แก่ <span className="font-mono">schools, classrooms, teachers, students, registration_requests, subjects, assignments, questions, exam_results</span> พร้อมใส่บัญชีผู้ดูแลระบบตั้งต้น (<span className="font-mono">User: admin / Pass: admin123</span>) ให้โดยอัตโนมัติ
          </div>
        </div>

        {/* Supabase & External JSON Data Importer */}
        <div className="bg-white border-2 border-slate-100 p-8 rounded-[40px] shadow-xl space-y-6">
          <div className="flex items-center gap-4 text-slate-800">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
              <Upload size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800">นำเข้าข้อมูลเดิมจาก Supabase / JSON Export</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Supabase Data Migration Tool</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">เลือกตารางปลายทาง (Target Table):</label>
              <select
                value={targetTable}
                onChange={(e) => setTargetTable(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="auto">✨ ตรวจหาอัตโนมัติ (Auto-Detect All Tables)</option>
                <option value="questions">📚 คลังข้อสอบ (questions)</option>
                <option value="students">👦 นักเรียน / ผู้เข้าสอบ (students)</option>
                <option value="teachers">👨‍🏫 ครู / ผู้สอน (teachers)</option>
                <option value="subjects">📖 หมวดหมู่วิชา (subjects)</option>
                <option value="assignments">📝 ชุดข้อสอบ / มอบหมายงาน (assignments)</option>
                <option value="exam_results">📊 ผลการสอบ (exam_results)</option>
                <option value="classrooms">🏫 ห้องเรียน (classrooms)</option>
                <option value="schools">🏢 สถานศึกษา (schools)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">อัปโหลดไฟล์ JSON จาก Supabase:</label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-3.5 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-black file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer border border-slate-200 rounded-2xl bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">หรือวางข้อความ JSON Array ที่ส่งออกจาก Supabase:</label>
            <textarea
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder={`ตัวอย่างสำหรับคลังข้อสอบ (questions):\n[\n  {\n    "id": "q-101",\n    "subject": "รอบรู้วิชาชีพครู",\n    "text": "โจทย์คำถาม...",\n    "choices": "[{\\"id\\":\\"1\\",\\"text\\":\\"ตัวเลือก 1\\"}]",\n    "correct_choice_id": "1"\n  }\n]`}
              rows={8}
              className="w-full bg-slate-900 text-emerald-400 font-mono text-xs p-5 rounded-2xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 custom-scrollbar leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => {
                setImportJsonText(JSON.stringify([
                  {
                    id: "q-supabase-demo-1",
                    subject: "รอบรู้วิชาชีพครู",
                    grade: "ALL",
                    text: "ข้อใดเป็นสิทธิขั้นพื้นฐานตามรัฐธรรมนูญด้านการศึกษา?",
                    choices: JSON.stringify([
                      { id: "1", text: "ได้รับการศึกษาขั้นพื้นฐานไม่น้อยกว่า 12 ปี โดยไม่เก็บค่าใช้จ่าย" },
                      { id: "2", text: "ได้รับการศึกษาฟรีตลอดชีวิต" },
                      { id: "3", text: "เลือกเรียนตามใจชอบได้ทุกระดับ" },
                      { id: "4", text: "ไม่มีข้อใดถูก" }
                    ]),
                    correct_choice_id: "1",
                    explanation: "รัฐธรรมนูญกำหนดให้บุคคลมีสิทธิได้รับการศึกษาขั้นพื้นฐานไม่น้อยกว่า 12 ปีที่รัฐจัดให้อย่างทั่วถึงและมีคุณภาพโดยไม่เก็บค่าใช้จ่าย",
                    school: "ศูนย์ติวคุรุมาสเตอร์"
                  }
                ], null, 2));
                setTargetTable("questions");
              }}
              className="text-emerald-600 hover:text-emerald-700 font-bold text-sm flex items-center gap-2"
            >
              <FileText size={18} /> ใส่ตัวอย่างข้อมูลทดสอบ (Demo Supabase Data)
            </button>

            <button
              onClick={handleImportData}
              disabled={isImporting || !importJsonText.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black transition-all flex items-center gap-3 shadow-lg active:scale-95 disabled:opacity-50"
            >
              {isImporting ? <RefreshCw size={20} className="animate-spin" /> : <Upload size={20} />}
              <span>{isImporting ? 'กำลังนำเข้าข้อมูล...' : 'เริ่มนำเข้าข้อมูลสู่ MySQL'}</span>
            </button>
          </div>

          {importResult && (
            <div className={`p-6 rounded-3xl border space-y-3 ${importResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-red-50 border-red-200 text-red-950'}`}>
              <div className="flex items-center gap-3 font-black text-lg">
                {importResult.success ? <Check className="text-emerald-600" size={26} /> : <AlertCircle className="text-red-600" size={26} />}
                <span>{importResult.message}</span>
              </div>
              {importResult.summary && Object.keys(importResult.summary).length > 0 && (
                <div className="bg-white/80 p-4 rounded-2xl border border-emerald-200/50 space-y-1 font-mono text-xs text-slate-700">
                  <p className="font-bold text-slate-900 border-b pb-1 mb-2">รายละเอียดการนำเข้าแต่ละตาราง:</p>
                  {Object.entries(importResult.summary).map(([tbl, count]) => (
                    <div key={tbl} className="flex justify-between items-center py-1">
                      <span>• ตาราง <strong className="text-emerald-700">{tbl}</strong></span>
                      <span className="font-bold bg-emerald-100 text-emerald-800 px-3 py-0.5 rounded-full">{count} รายการ</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Copy SQL Script Section */}
        <div className="bg-slate-900 p-10 rounded-[50px] shadow-2xl border-t-8 border-emerald-500 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Terminal size={150} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 text-emerald-400 mb-8">
              <ShieldCheck size={48} />
              <div>
                <h3 className="text-2xl font-black text-white">MySQL Schema Script (phpMyAdmin / XAMPP)</h3>
                <p className="text-slate-400 text-sm">สคริปต์ SQL แบบเต็มสำหรับกรณีต้องการรันผ่าน phpMyAdmin ด้วยตนเอง</p>
              </div>
            </div>
            <pre className="text-emerald-400 font-mono text-[11px] overflow-x-auto p-8 bg-black/40 rounded-3xl max-h-[350px] border border-slate-800 leading-relaxed custom-scrollbar mb-8">
              {MYSQL_SCHEMA_SCRIPT}
            </pre>
            <button
              onClick={handleCopy}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-[25px] font-black transition-all flex items-center justify-center gap-4 shadow-xl border-b-8 border-emerald-800 active:scale-95"
            >
              <Copy size={24} /> <span className="text-xl">คัดลอกสคริปต์ SQL สำหรับ phpMyAdmin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemManager;
