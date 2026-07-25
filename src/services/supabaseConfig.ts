
import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// 🟢 การตั้งค่า Database (Supabase)
// ---------------------------------------------------------------------------

// 1. ลองดึงจาก LocalStorage (สำหรับการตั้งค่าผ่านหน้าเว็บ)
const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('MST_SUPABASE_URL') : null;
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('MST_SUPABASE_KEY') : null;

// 2. ลองดึงจาก Environment Variables (สำหรับการ Deploy จริง)
const ENV_URL = (import.meta as any).env.VITE_SUPABASE_URL;
const ENV_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

// ค่า Default
const DEFAULT_URL = "https://uwjqopqktrxpytgpgjsj.supabase.co";
const DEFAULT_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3anFvcHFrdHJ4cHl0Z3BnanNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2OTE3MzUsImV4cCI6MjA4MTI2NzczNX0.b2h6rhjHW5M6sRBMB1H578ocaWsikrH9_QDgmlqiXWg";

// เลือกใช้ค่าที่มีอยู่จริง
const SUPABASE_URL = storedUrl || ENV_URL || DEFAULT_URL;
const SUPABASE_ANON_KEY = storedKey || ENV_KEY || DEFAULT_KEY;

// ตรวจสอบสถานะการตั้งค่าว่าพร้อมใช้งานหรือไม่
export const isConfigured = 
    SUPABASE_URL && 
    SUPABASE_URL !== "https://placeholder.supabase.co" && 
    !SUPABASE_URL.includes("YOUR_SUPABASE_URL") &&
    SUPABASE_ANON_KEY && 
    SUPABASE_ANON_KEY !== "placeholder" &&
    !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_KEY");

let client;

try {
    if (isConfigured) {
        client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.warn("⚠️ ยังไม่ได้ตั้งค่า Supabase - ระบบจะทำงานในโหมด Offline/Demo บางส่วน");
        client = createClient(DEFAULT_URL, DEFAULT_KEY);
    }
} catch (e) {
    console.error("Supabase Init Error:", e);
    client = createClient(DEFAULT_URL, DEFAULT_KEY);
}

export const supabase = client;
export const db = supabase;

// ฟังก์ชันสำหรับบันทึกค่า Config ใหม่
export const saveConfig = (url: string, key: string) => {
    localStorage.setItem('MST_SUPABASE_URL', url);
    localStorage.setItem('MST_SUPABASE_KEY', key);
    window.location.reload(); // รีโหลดเพื่อให้ Config ใหม่ทำงาน
};

// ฟังก์ชันล้างค่า Config
export const clearConfig = () => {
    localStorage.removeItem('MST_SUPABASE_URL');
    localStorage.removeItem('MST_SUPABASE_KEY');
    window.location.reload();
};
