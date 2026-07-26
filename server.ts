import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { createServer as createViteServer } from "vite";
import react from "@vitejs/plugin-react";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  } catch (err) {
    console.warn("⚠️ Gemini API initialization warning:", err);
  }
}

// MySQL Connection Pool Setup
const mysqlConfig = {
  host: process.env.MYSQL_HOST || "localhost",
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "kuru_master_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let dbPool: mysql.Pool | null = null;
let isMySqlConnected = false;

// Seed Data for Fallback Engine
const fallbackData = {
  schools: [
    {
      id: "00000000-0000-0000-0000-000000000000",
      name: "ศูนย์ติวคุรุมาสเตอร์",
      school_code: "PUBLIC",
      status: "active",
      allow_all_manage_students: 1,
    },
  ],
  classrooms: [
    {
      id: "room-01",
      school: "ศูนย์ติวคุรุมาสเตอร์",
      grade_level: "ALL",
      room_number: "1",
      name: "ห้องติวสอบเข้ม 1",
    },
  ],
  teachers: [
    {
      id: "teacher-super-01",
      username: "admin",
      password: "admin123",
      name: "ผู้ดูแลระบบคุรุมาสเตอร์",
      school: "ศูนย์ติวคุรุมาสเตอร์",
      role: "SUPER_ADMIN",
      status: "active",
      position: "ผู้อำนวยการระบบ",
    },
    {
      id: "teacher-demo-01",
      username: "teacher",
      password: "123456",
      name: "อ.สมชาย ใจดี",
      school: "ศูนย์ติวคุรุมาสเตอร์",
      role: "TEACHER",
      status: "active",
      position: "อาจารย์ผู้สอนวิชาชีพครู",
    },
  ],
  students: [
    {
      id: "1234567890123",
      name: "สมหญิง รักเรียน",
      school: "ศูนย์ติวคุรุมาสเตอร์",
      major: "ภาษาไทย",
      exam_type: "TEACHER",
      avatar: "👧",
      grade: "ALL",
      classroom: "1",
      stars: 15,
      status: "active",
      password: "123456",
      inventory: "[]",
    },
  ],
  registration_requests: [] as any[],
  subjects: [
    {
      id: "sub-01",
      name: "รอบรู้วิชาชีพครู",
      fullName: "ความรู้ความเข้าใจเกี่ยวกับวิชาชีพครูและกฎหมายการศึกษา",
      school: "ศูนย์ติวคุรุมาสเตอร์",
      teacher_id: "teacher-demo-01",
      grade: "ALL",
      icon: "BookOpen",
      color: "amber",
    },
    {
      id: "sub-02",
      name: "ความสามารถทั่วไป",
      fullName: "ความสามารถด้านการคิดวิเคราะห์ ความเข้าใจภาษา และคณิตศาสตร์",
      school: "ศูนย์ติวคุรุมาสเตอร์",
      teacher_id: "teacher-demo-01",
      grade: "ALL",
      icon: "Brain",
      color: "indigo",
    },
    {
      id: "sub-03",
      name: "เอกภาษาไทย",
      fullName: "วิชาเอกภาษาไทย สำหรับสอบบรรจุครูผู้ช่วย",
      school: "ศูนย์ติวคุรุมาสเตอร์",
      teacher_id: "teacher-demo-01",
      grade: "MAJOR",
      icon: "Languages",
      color: "emerald",
    },
  ],
  assignments: [] as any[],
  questions: [
    {
      id: "q-01",
      subject: "รอบรู้วิชาชีพครู",
      grade: "ALL",
      text: "พระราชบัญญัติการศึกษาแห่งชาติ พ.ศ. 2542 กำหนดให้การจัดการศึกษาต้องยึดหลักตามข้อใดต่อไปนี้?",
      choices: JSON.stringify([
        { id: "1", text: "เป็นการศึกษาตลอดชีวิตสำหรับประชาชน" },
        { id: "2", text: "ให้สังคมมีส่วนร่วมในการจัดการศึกษา" },
        { id: "3", text: "การพัฒนาสาระและกระบวนการเรียนรู้ให้เป็นไปอย่างต่อเนื่อง" },
        { id: "4", text: "ถูกทุกข้อที่กล่าวมา" },
      ]),
      correct_choice_id: "4",
      explanation:
        "พ.ร.บ.การศึกษาแห่งชาติ พ.ศ. 2542 มาตรา 8 กำหนดหลักการจัดการศึกษาไว้ 3 ประการคือ 1) เป็นการศึกษาตลอดชีวิตสำหรับประชาชน 2) ให้สังคมมีส่วนร่วม 3) การพัฒนาสาระและกระบวนการเรียนรู้ให้เป็นไปอย่างต่อเนื่อง",
      school: "ศูนย์ติวคุรุมาสเตอร์",
    },
    {
      id: "q-02",
      subject: "รอบรู้วิชาชีพครู",
      grade: "ALL",
      text: "ข้อใดคือจรรยาบรรณต่อวิชาชีพ ตามข้อบังคับคุรุสภาว่าด้วยมาตรฐานวิชาชีพ?",
      choices: JSON.stringify([
        { id: "1", text: "ผู้ประกอบวิชาชีพทางการศึกษา ต้องรัก ศรัทธา ซื่อสัตย์สุจริต รับผิดชอบต่อวิชาชีพ" },
        { id: "2", text: "ผู้ประกอบวิชาชีพทางการศึกษา ต้องมีวินัยในตนเอง" },
        { id: "3", text: "ผู้ประกอบวิชาชีพทางการศึกษา ต้องประเวณีดีงาม" },
        { id: "4", text: "ผู้ประกอบวิชาชีพทางการศึกษา ต้องเป็นผู้นำในการอนุรักษ์สิ่งแวดล้อม" },
      ]),
      correct_choice_id: "1",
      explanation:
        "จรรยาบรรณต่อวิชาชีพ หมายถึง ผู้ประกอบวิชาชีพทางการศึกษาต้องรัก ศรัทธา ซื่อสัตย์สุจริต และรับผิดชอบต่อวิชาชีพ เป็นสมาชิกที่ดีขององค์กรวิชาชีพ",
      school: "ศูนย์ติวคุรุมาสเตอร์",
    },
    {
      id: "q-03",
      subject: "ความสามารถทั่วไป",
      grade: "ALL",
      text: "ถ้า A = 15% ของ 200 และ B = 20% ของ 150 ข้อใดต่อไปนี้ถูกต้อง?",
      choices: JSON.stringify([
        { id: "1", text: "A มากกว่า B" },
        { id: "2", text: "A น้อยกว่า B" },
        { id: "3", text: "A เท่ากับ B" },
        { id: "4", text: "สรุปแน่นอนไม่ได้" },
      ]),
      correct_choice_id: "3",
      explanation: "A = 0.15 x 200 = 30 และ B = 0.20 x 150 = 30 ดังนั้น A เท่ากับ B",
      school: "ศูนย์ติวคุรุมาสเตอร์",
    },
  ],
  exam_results: [] as any[],
};

// Automatic MySQL Database Schema Auto-Migration
const autoMigrateDatabase = async (pool: mysql.Pool) => {
  const safeQuery = async (sql: string, params: any[] = []) => {
    try {
      await pool.query(sql, params);
    } catch (err: any) {
      if (
        err.code === "ER_DUP_KEYNAME" ||
        err.code === "ER_DUP_FIELDNAME" ||
        err.code === "ER_CANT_DROP_FIELD_OR_KEY" ||
        err.code === "ER_TABLE_EXISTS_ERROR" ||
        err.errno === 1061 ||
        err.errno === 1060
      ) {
        console.log(`[Migration] Index/Column/Key already exists (${err.code || err.errno})`);
      } else {
        console.warn(`[Migration] Notice (${err.code || "WARN"}):`, err.message);
      }
    }
  };

  try {
    console.log("🔄 Running Automatic Database Migration...");
    
    // 1. Schools
    await safeQuery(`
      CREATE TABLE IF NOT EXISTS \`schools\` (
        \`id\` VARCHAR(64) NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`school_code\` VARCHAR(64) UNIQUE,
        \`status\` VARCHAR(32) DEFAULT 'active',
        \`allow_all_manage_students\` TINYINT(1) DEFAULT 0,
        \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Classrooms
    await safeQuery(`
      CREATE TABLE IF NOT EXISTS \`classrooms\` (
        \`id\` VARCHAR(64) NOT NULL,
        \`school\` VARCHAR(255) NOT NULL,
        \`grade_level\` VARCHAR(64),
        \`room_number\` VARCHAR(64),
        \`name\` VARCHAR(255),
        \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Teachers
    await safeQuery(`
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
    `);

    // 4. Students
    await safeQuery(`
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
    `);

    // 5. Registration Requests
    await safeQuery(`
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
    `);

    // 6. Subjects
    await safeQuery(`
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
    `);

    // 7. Assignments
    await safeQuery(`
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
    `);

    // 8. Questions
    await safeQuery(`
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
    `);

    // 9. Exam Results
    await safeQuery(`
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
    `);

    // Seed default admin if not exists
    await safeQuery(`
      INSERT INTO \`teachers\` (\`id\`, \`username\`, \`password\`, \`name\`, \`school\`, \`role\`, \`status\`, \`position\`)
      VALUES ('teacher-super-01', 'admin', 'admin123', 'ผู้ดูแลระบบคุรุมาสเตอร์', 'ศูนย์ติวคุรุมาสเตอร์', 'SUPER_ADMIN', 'active', 'ผู้อำนวยการระบบ')
      ON DUPLICATE KEY UPDATE \`username\`=\`username\`;
    `);

    console.log("✅ Automatic Database Migration & Auto-Sync Complete!");
  } catch (err: any) {
    console.error("⚠️ Auto migration notice:", err.message);
  }
};

// Attempt MySQL connection gracefully and auto-create database & tables
const initMySQL = async () => {
  try {
    // Step 1: Connect without database name to ensure database existence
    try {
      const rootConnection = await mysql.createConnection({
        host: mysqlConfig.host,
        port: mysqlConfig.port,
        user: mysqlConfig.user,
        password: mysqlConfig.password,
      });
      await rootConnection.query(
        `CREATE DATABASE IF NOT EXISTS \`${mysqlConfig.database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
      );
      await rootConnection.end();
      console.log(`✅ Database \`${mysqlConfig.database}\` checked/created successfully.`);
    } catch (dbCreateErr: any) {
      console.warn("Notice: Database auto-creation step (root permission check):", dbCreateErr.message);
    }

    // Step 2: Create database pool targeting mysqlConfig.database
    const pool = mysql.createPool(mysqlConfig);
    const conn = await pool.getConnection();
    console.log("✅ MySQL Database Connected Successfully to", mysqlConfig.host);
    conn.release();
    dbPool = pool;
    isMySqlConnected = true;

    // Step 3: Run Auto Migration to create all 9 tables & seed defaults
    await autoMigrateDatabase(pool);
  } catch (err: any) {
    console.warn("⚠️ MySQL Server not reachable on host (" + mysqlConfig.host + "). Operating in High-Speed Fallback Engine mode:", err.message);
    isMySqlConnected = false;
  }
};

initMySQL();

// Generic helper function to upsert rows into MySQL
async function upsertRows(pool: mysql.Pool, tableName: string, rows: any[]) {
  if (!Array.isArray(rows) || rows.length === 0) return 0;
  let count = 0;
  for (const item of rows) {
    if (!item || typeof item !== "object") continue;
    const keys = Object.keys(item).filter((k) => item[k] !== undefined);
    if (keys.length === 0) continue;

    const escapedKeys = keys.map((k) => `\`${k}\``).join(", ");
    const placeholders = keys.map(() => "?").join(", ");
    const values = keys.map((k) => {
      const val = item[k];
      if (typeof val === "object" && val !== null) return JSON.stringify(val);
      return val;
    });

    const updateClause = keys
      .filter((k) => k !== "id" && k !== "citizen_id")
      .map((k) => `\`${k}\`=VALUES(\`${k}\`)`)
      .join(", ");

    let sql = `INSERT INTO \`${tableName}\` (${escapedKeys}) VALUES (${placeholders})`;
    if (updateClause.length > 0) {
      sql += ` ON DUPLICATE KEY UPDATE ${updateClause}`;
    } else {
      sql += ` ON DUPLICATE KEY UPDATE \`${keys[0]}\`=\`${keys[0]}\``;
    }

    await pool.query(sql, values);
    count++;
  }
  return count;
}

// ==========================================
// API ROUTES
// ==========================================

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: isMySqlConnected ? "MySQL" : "Internal MySQL Engine",
    host: mysqlConfig.host,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/db-status", (req, res) => {
  res.json({
    connected: isMySqlConnected,
    type: "MySQL / phpMyAdmin",
    databaseName: mysqlConfig.database,
    host: mysqlConfig.host,
  });
});

// Admin Route: Auto-initialize Database & Tables
app.post("/api/admin/init-db", async (req, res) => {
  try {
    await initMySQL();
    if (isMySqlConnected && dbPool) {
      return res.json({
        success: true,
        message: `สร้างและปรับปรุงโครงสร้างฐานข้อมูล MySQL (${mysqlConfig.database}) เรียบร้อยแล้ว!`,
        connected: true,
      });
    } else {
      return res.json({
        success: false,
        message: `ไม่สามารถเชื่อมต่อ MySQL บน ${mysqlConfig.host}:${mysqlConfig.port} ได้ กรุณาตรวจสอบการตั้งค่า MySQL หรือ XAMPP`,
        connected: false,
      });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการสร้างฐานข้อมูล: " + err.message });
  }
});

// Admin Route: Import Supabase / External JSON Data into MySQL
app.post("/api/admin/import-data", async (req, res) => {
  const { tableName, data } = req.body;

  if (!data) {
    return res.status(400).json({ success: false, message: "ไม่พบคอมพอนนต์ข้อมูลสำหรับนำเข้า" });
  }

  const resultsSummary: Record<string, number> = {};

  try {
    // 1. If MySQL is connected
    if (isMySqlConnected && dbPool) {
      if (tableName === "auto" || (typeof data === "object" && !Array.isArray(data))) {
        // Multi-table import object e.g. { students: [...], questions: [...] }
        const tables = ["schools", "classrooms", "teachers", "students", "registration_requests", "subjects", "assignments", "questions", "exam_results"];
        for (const tbl of tables) {
          if (Array.isArray(data[tbl]) && data[tbl].length > 0) {
            const importedCount = await upsertRows(dbPool, tbl, data[tbl]);
            resultsSummary[tbl] = importedCount;
          }
        }
      } else if (typeof tableName === "string" && Array.isArray(data)) {
        // Single table import
        const importedCount = await upsertRows(dbPool, tableName, data);
        resultsSummary[tableName] = importedCount;
      }
    }

    // 2. Also update in-memory fallbackData so app retains imported data immediately
    if (tableName === "auto" || (typeof data === "object" && !Array.isArray(data))) {
      for (const [key, rows] of Object.entries(data)) {
        if (Array.isArray(rows) && (fallbackData as any)[key]) {
          (fallbackData as any)[key] = rows;
          resultsSummary[key] = (resultsSummary[key] || 0) + rows.length;
        }
      }
    } else if (typeof tableName === "string" && Array.isArray(data) && (fallbackData as any)[tableName]) {
      (fallbackData as any)[tableName] = data;
      resultsSummary[tableName] = (resultsSummary[tableName] || 0) + data.length;
    }

    const totalRows = Object.values(resultsSummary).reduce((a, b) => a + b, 0);

    return res.json({
      success: true,
      message: `นำเข้าข้อมูลเรียบร้อยแล้ว รวมทั้งสิ้น ${totalRows} รายการ`,
      summary: resultsSummary,
    });
  } catch (err: any) {
    console.error("Import data error:", err);
    return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการนำเข้าข้อมูล: " + err.message });
  }
});

// Fetch All App Data
app.get("/api/app-data", async (req, res) => {
  if (isMySqlConnected && dbPool) {
    try {
      const [st] = await dbPool.query("SELECT * FROM students WHERE status IN ('active', 'suspended')");
      const [q] = await dbPool.query("SELECT * FROM questions");
      const [r] = await dbPool.query("SELECT * FROM exam_results ORDER BY timestamp DESC");
      const [a] = await dbPool.query("SELECT * FROM assignments");
      const [sub] = await dbPool.query("SELECT * FROM subjects");

      return res.json({
        students: st,
        questions: q,
        results: r,
        assignments: a,
        subjects: sub,
      });
    } catch (err: any) {
      console.error("MySQL query error, using fallback data:", err.message);
    }
  }

  res.json({
    students: fallbackData.students,
    questions: fallbackData.questions,
    results: fallbackData.exam_results,
    assignments: fallbackData.assignments,
    subjects: fallbackData.subjects,
  });
});

// Student Login Verification
app.post("/api/students/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username) return res.status(400).json({ error: "กรุณาระบุ Username" });

  if (isMySqlConnected && dbPool) {
    try {
      const [rows]: any = await dbPool.query("SELECT * FROM students WHERE id = ?", [username]);
      const student = rows[0];
      if (!student) return res.status(404).json({ error: `ไม่พบข้อมูลผู้ใช้งาน ${username}` });
      if (student.status === "pending") return res.status(403).json({ error: "บัญชีของคุณกำลังรอการอนุมัติจากเจ้าหน้าที่" });
      if (student.status === "suspended") return res.status(403).json({ error: "บัญชีของคุณถูกระงับการใช้งานชั่วคราว" });
      if (student.password !== password) return res.status(401).json({ error: "รหัสผ่านไม่ถูกต้อง" });

      await dbPool.query("UPDATE students SET login_count = login_count + 1, last_login = ? WHERE id = ?", [Date.now(), username]);
      return res.json({ student });
    } catch (e: any) {
      console.error("MySQL Login Error:", e.message);
    }
  }

  // Fallback
  const student = fallbackData.students.find((s) => s.id === username);
  if (!student) return res.status(404).json({ error: `ไม่พบข้อมูลผู้ใช้งาน ${username}` });
  if (student.status === "pending") return res.status(403).json({ error: "บัญชีของคุณกำลังรอการอนุมัติจากเจ้าหน้าที่" });
  if (student.status === "suspended") return res.status(403).json({ error: "บัญชีของคุณถูกระงับการใช้งานชั่วคราว" });
  if (student.password !== password) return res.status(401).json({ error: "รหัสผ่านไม่ถูกต้อง" });

  student.login_count = (student.login_count || 0) + 1;
  student.last_login = Date.now();
  res.json({ student });
});

// Teacher Login Verification
app.post("/api/teachers/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" });

  if (isMySqlConnected && dbPool) {
    try {
      const [rows]: any = await dbPool.query("SELECT * FROM teachers WHERE username = ? AND password = ?", [username, password]);
      const teacher = rows[0];
      if (!teacher) return res.status(401).json({ success: false, message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });

      await dbPool.query("UPDATE teachers SET login_count = login_count + 1, last_login = ? WHERE id = ?", [Date.now(), teacher.id]);
      return res.json({ success: true, teacher });
    } catch (e: any) {
      console.error("MySQL Teacher Login Error:", e.message);
    }
  }

  // Fallback
  const teacher = fallbackData.teachers.find((t) => t.username === username && t.password === password);
  if (!teacher) return res.status(401).json({ success: false, message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
  res.json({ success: true, teacher });
});

// Request Registration
app.post("/api/students/register", async (req, res) => {
  const { citizenId, name, surname, major, examType } = req.body;
  if (!citizenId || !name || !surname) return res.status(400).json({ success: false, message: "กรุณากรอกข้อมูลให้ครบถ้วน" });

  const reqId = "req-" + Date.now();
  const timestamp = Date.now();

  if (isMySqlConnected && dbPool) {
    try {
      await dbPool.query(
        "INSERT INTO registration_requests (id, citizen_id, name, surname, major, exam_type, school_id, timestamp, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')",
        [reqId, citizenId, name, surname, major || "", examType || "TEACHER", "00000000-0000-0000-0000-000000000000", timestamp]
      );
      return res.json({ success: true, message: "ส่งคำขอลงทะเบียนสำเร็จ" });
    } catch (e: any) {
      console.error("MySQL Register Error:", e.message);
    }
  }

  fallbackData.registration_requests.push({
    id: reqId,
    citizen_id: citizenId,
    name,
    surname,
    major,
    exam_type: examType || "TEACHER",
    school_id: "00000000-0000-0000-0000-000000000000",
    timestamp,
    status: "pending",
  });

  res.json({ success: true, message: "ส่งคำขอลงทะเบียนสำเร็จ" });
});

// Save Exam Score
app.post("/api/scores/save", async (req, res) => {
  const { studentId, studentName, school, score, total, subject, assignmentId, category, earnedStars } = req.body;
  const resId = "res-" + Date.now();
  const timestamp = Date.now();

  if (isMySqlConnected && dbPool) {
    try {
      await dbPool.query(
        "INSERT INTO exam_results (id, student_id, student_name, school, score, total_questions, subject, assignment_id, category, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [resId, studentId, studentName || "", school || "", score || 0, total || 0, subject || "ทั่วไป", assignmentId || null, category || "GENERAL", timestamp]
      );

      if (earnedStars > 0 && category !== "EXAM") {
        await dbPool.query("UPDATE students SET stars = stars + ? WHERE id = ?", [earnedStars, studentId]);
      }
      return res.json({ success: true });
    } catch (e: any) {
      console.error("MySQL Save Score Error:", e.message);
    }
  }

  // Fallback
  fallbackData.exam_results.unshift({
    id: resId,
    student_id: studentId,
    student_name: studentName,
    school,
    score,
    total_questions: total,
    subject: subject || "ทั่วไป",
    assignment_id: assignmentId || null,
    category: category || "GENERAL",
    timestamp,
  });

  if (earnedStars > 0 && category !== "EXAM") {
    const st = fallbackData.students.find((s) => s.id === studentId);
    if (st) st.stars = (st.stars || 0) + earnedStars;
  }

  res.json({ success: true });
});

// AI Question Generator Endpoint (Gemini API Server-Side)
app.post("/api/gemini/generate-questions", async (req, res) => {
  const { subject, topic, count = 5, examType = "TEACHER" } = req.body;

  if (!process.env.GEMINI_API_KEY || !ai) {
    return res.status(500).json({ error: "ยังไม่ได้ตั้งค่า GEMINI_API_KEY บน Server" });
  }

  try {
    const prompt = `คุณคือผู้เชี่ยวชาญด้านการออกข้อสอบบรรจุข้าราชการครู (ภาค ก และ ภาค ข) กรุณาสร้างข้อสอบปรนัยจำนวน ${count} ข้อ สำหรับวิชา: "${subject}" ในหัวข้อ: "${topic || 'ภาพรวมเนื้อหาที่ออกสอบบ่อย'}"
    โครงสร้างคำตอบต้องเป็น JSON Array ที่ถูกต้องตามรูปแบบนี้เท่านั้น:
    [
      {
        "text": "โจทย์ข้อสอบภาษาไทยอย่างเป็นทางการ",
        "choices": [
          {"id": "1", "text": "ตัวเลือกที่ 1"},
          {"id": "2", "text": "ตัวเลือกที่ 2"},
          {"id": "3", "text": "ตัวเลือกที่ 3"},
          {"id": "4", "text": "ตัวเลือกที่ 4"}
        ],
        "correct_choice_id": "1",
        "explanation": "เฉลยละเอียดพร้อมอ้างอิงมาตรากฎหมายหรือหลักการศึกษา"
      }
    ]
    ตอบเฉพาะ JSON array เท่านั้น ห้ามใส่คำเกริ่นนำหรือ Markdown codeblock`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text || "";
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const questions = JSON.parse(cleanJson);

    res.json({ success: true, questions });
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการสร้างข้อสอบด้วย AI: " + err.message });
  }
});

// Start Express Server
async function startServer() {
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    const vite = await createViteServer({
      configFile: false,
      root: process.cwd(),
      plugins: [react()],
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const listenPort = process.env.PORT || 3000;
  if (typeof listenPort === "string" && listenPort.startsWith("\\\\")) {
    app.listen(listenPort, () => {
      console.log(`🚀 Teacher Tutor Server listening on IIS named pipe: ${listenPort}`);
    });
  } else {
    app.listen(Number(listenPort) || 3000, "0.0.0.0", () => {
      console.log(`🚀 Teacher Tutor Server listening on port ${listenPort}`);
    });
  }
}

startServer();
