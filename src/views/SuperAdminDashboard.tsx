
import React, { useState, useEffect, useMemo } from 'react';
import { Teacher, School, RegistrationRequest, ExamResult, Student } from '../types'; 
import { 
  Building2, LogOut, PlusCircle, User, CheckCircle, Shield, XCircle, 
  AlertCircle, ChevronDown, UserCog, ShieldCheck, BarChart3, Activity, 
  Clock, LogIn, Award, Edit, Save, Lock, MonitorSmartphone, KeyRound,
  RefreshCw, Terminal, Database, Copy, Wrench, AlertTriangle, UserPlus, Check, X,
  ChevronUp, Mail, ToggleLeft, ToggleRight, Trash2, Users, ShieldAlert,
  GraduationCap, Bell, CreditCard, Search, Star, Key,
  // Add Loader2 to the lucide-react imports
  Loader2
} from 'lucide-react';
import { 
  getSchools, manageSchool, getAllTeachers, getAllPendingRegistrations, 
  approveRegistration, rejectRegistration, getSuperAdminStats, manageTeacher
} from '../services/api';
// Fix: supabase should be imported from supabaseConfig, not api
import { supabase } from '../services/supabaseConfig';

const SQL_UPGRADE_SCRIPT = `-- [ KURUMASTER MASTER DATABASE SETUP - VERSION 2025.7 ]
-- สคริปต์นี้จะสร้างและตั้งค่าตารางทั้งหมดให้รองรับระบบสมาชิกสมบูรณ์แบบ

-- 1. ลำดับเลขรหัสนักเรียน (เริ่มต้นที่ 10001)
CREATE SEQUENCE IF NOT EXISTS student_id_seq START 10001;

-- 2. ตารางโรงเรียน (Schools)
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    school_code TEXT UNIQUE NOT NULL,
    allow_all_manage_students BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. ตารางนักเรียน (Students)
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY DEFAULT nextval('student_id_seq')::text,
    name TEXT NOT NULL,
    school TEXT,
    avatar TEXT DEFAULT '👦',
    stars INTEGER DEFAULT 0,
    grade TEXT DEFAULT 'ALL',
    classroom TEXT DEFAULT '1',
    password TEXT DEFAULT '123456',
    status TEXT DEFAULT 'active',
    inventory TEXT DEFAULT '[]',
    login_count INTEGER DEFAULT 0,
    last_login BIGINT,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. ตารางคุณครู (Teachers)
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    school TEXT NOT NULL,
    citizen_id TEXT UNIQUE,
    role TEXT DEFAULT 'TEACHER',
    position TEXT,
    advisor_class TEXT,
    teaching_classes TEXT DEFAULT '[]',
    teaching_classroom_ids TEXT DEFAULT '[]',
    status TEXT DEFAULT 'active',
    login_count INTEGER DEFAULT 0,
    last_login BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. ตารางคำขอสมัครสมาชิก (Registration Requests)
CREATE TABLE IF NOT EXISTS public.registration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citizen_id TEXT NOT NULL,
    name TEXT NOT NULL,
    surname TEXT NOT NULL,
    school_id TEXT,
    status TEXT DEFAULT 'pending',
    timestamp BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. ตารางบัญชีการเงิน (Finance Accounts)
CREATE TABLE IF NOT EXISTS public.finance_accounts (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('Budget', 'NonBudget')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. ตารางรายการธุรกรรม (Finance Transactions)
CREATE TABLE IF NOT EXISTS public.finance_transactions (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    account_id TEXT NOT NULL REFERENCES public.finance_accounts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    type TEXT CHECK (type IN ('Income', 'Expense')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- [ SECURITY SETUP ]
ALTER TABLE IF EXISTS public.schools DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.finance_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.finance_transactions DISABLE ROW LEVEL SECURITY;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
`;

interface SuperAdminDashboardProps {
  admin: Teacher;
  onLogout: () => void;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ admin, onLogout }) => {
  const [activeView, setActiveView] = useState<'SCHOOLS' | 'ADMINS' | 'MAINTENANCE'>('SCHOOLS');
  const [schools, setSchools] = useState<School[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [pendingRequests, setPendingRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolCode, setNewSchoolCode] = useState('');
  const [expandedSchoolId, setExpandedSchoolId] = useState<string | null>(null);
  const [schoolTab, setSchoolTab] = useState<'STAFF' | 'REQUESTS'>('STAFF');

  // Add Admin State
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', username: '', password: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
        const [s, t, r, allData] = await Promise.all([
            getSchools(),
            getAllTeachers(),
            getAllPendingRegistrations(),
            getSuperAdminStats()
        ]);
        
        if (allData) {
            setStudents(allData.students);
            setResults(allData.results);
            setTeachers(allData.teachers || t);
        }

        setSchools(s);
        setPendingRequests(r);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newAdmin.name || !newAdmin.username || !newAdmin.password) return alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      
      setLoading(true);
      const { error } = await supabase.from('teachers').insert({
          name: newAdmin.name,
          username: newAdmin.username,
          password: newAdmin.password,
          school: 'System Central',
          role: 'SUPER_ADMIN',
          status: 'active'
      });
      
      if (!error) {
          alert("เพิ่มผู้ดูแลระบบเรียบร้อย");
          setShowAddAdminModal(false);
          setNewAdmin({ name: '', username: '', password: '' });
          loadData();
      } else {
          alert("เกิดข้อผิดพลาด: " + error.message);
      }
      setLoading(false);
  };

  const handleApprove = async (req: RegistrationRequest, schoolName: string) => {
      setProcessingId(req.id);
      const success = await approveRegistration(req, 'TEACHER', 'ALL', schoolName);
      if (success) {
          await loadData();
          alert("อนุมัติคุณครูเรียบร้อยแล้ว");
      } else {
          alert("เกิดข้อผิดพลาดในการอนุมัติ");
      }
      setProcessingId(null);
  };

  const handleReject = async (reqId: string) => {
      if (!confirm("ต้องการปฏิเสธคำขอนี้ใช่หรือไม่?")) return;
      setProcessingId(reqId);
      const success = await rejectRegistration(reqId);
      if (success) await loadData();
      setProcessingId(null);
  };

  const handleRoleToggle = async (t: Teacher) => {
      let nextRole: 'TEACHER' | 'SCHOOL_ADMIN' | 'SUPER_ADMIN' = 'TEACHER';
      if (t.role === 'TEACHER') nextRole = 'SCHOOL_ADMIN';
      else if (t.role === 'SCHOOL_ADMIN') nextRole = 'SUPER_ADMIN';
      else if (t.role === 'SUPER_ADMIN') nextRole = 'TEACHER';

      if (!confirm(`ยืนยันการเปลี่ยนสิทธิ์ของคุณ ${t.name} เป็น ${nextRole}?`)) return;

      setProcessingId(String(t.id));
      await manageTeacher('update_role', { id: t.id, role: nextRole });
      setProcessingId(null);
      loadData();
  };

  // Add missing handleToggleStatus function
  const handleToggleStatus = async (t: Teacher) => {
      const isSuspended = t.status === 'suspended';
      const newStatus = isSuspended ? 'active' : 'suspended';
      if (!confirm(`ต้องการ${isSuspended ? 'ยกเลิกการระงับ' : 'ระงับ'}การใช้งานของคุณครู ${t.name} ใช่หรือไม่?`)) return;

      setProcessingId(String(t.id));
      await manageTeacher('update_status', { id: t.id, status: newStatus });
      setProcessingId(null);
      loadData();
  };

  const getSchoolStats = (school: School) => {
      const schoolTeachers = teachers.filter(t => t.school === school.name);
      const schoolStudents = students.filter(s => s.school === school.name);
      const schoolExams = results.filter(r => r.school === school.name).length;
      const schoolPending = pendingRequests.filter(r => r.schoolId === school.id).length;

      const teacherLogins = schoolTeachers.reduce((s, x) => s + (Number(x.login_count) || 0), 0);
      const studentLogins = schoolStudents.reduce((s, x) => s + (Number(x.login_count) || 0), 0);

      return {
          teacherCount: schoolTeachers.length,
          studentCount: schoolStudents.length,
          examCount: schoolExams,
          pendingCount: schoolPending,
          teacherLogins,
          studentLogins,
          totalLogins: teacherLogins + studentLogins
      };
  };

  const globalAdmins = useMemo(() => teachers.filter(t => t.role === 'SUPER_ADMIN'), [teachers]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 pb-20 font-prompt">
        {/* MODAL: ADD ADMIN */}
        {showAddAdminModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 animate-fade-in">
                <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
                    <div className="bg-slate-900 p-6 flex justify-between items-center text-white border-b-4 border-amber-500">
                        <h3 className="font-black text-xl flex items-center gap-3"><Shield size={24} className="text-amber-500"/> เพิ่ม Super Admin ใหม่</h3>
                        <button onClick={() => setShowAddAdminModal(false)} className="hover:bg-white/10 p-2 rounded-full transition"><X/></button>
                    </div>
                    <form onSubmit={handleCreateAdmin} className="p-8 space-y-5">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">ชื่อ-นามสกุล</label>
                                <input required type="text" value={newAdmin.name} onChange={e => setNewAdmin({...newAdmin, name: e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl focus:border-amber-500 outline-none transition font-bold" placeholder="ชื่อแอดมิน" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Username (ID)</label>
                                <input required type="text" value={newAdmin.username} onChange={e => setNewAdmin({...newAdmin, username: e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl focus:border-amber-500 outline-none transition font-bold" placeholder="id_admin" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Password</label>
                                <input required type="password" value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl focus:border-amber-500 outline-none transition font-bold" placeholder="••••••••" />
                            </div>
                        </div>
                        <button disabled={loading} type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-slate-200 transition-all transform active:scale-95 border-b-4 border-amber-500">
                            {loading ? <Loader2 className="animate-spin mx-auto" size={24}/> : 'ยืนยันเพิ่มแอดมิน'}
                        </button>
                    </form>
                </div>
            </div>
        )}

        <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 border-b-8 border-amber-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldCheck size={120}/></div>
            <div className="relative z-10 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    <div className="bg-amber-500 p-2 rounded-xl text-slate-900 shadow-lg"><ShieldCheck size={28}/></div>
                    <h1 className="text-3xl font-black tracking-tight">Super Admin Portal</h1>
                </div>
                <p className="text-slate-400 font-medium">ระบบควบคุมสิทธิ์และฐานข้อมูลส่วนกลาง</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 relative z-10">
                <NavBtn active={activeView === 'SCHOOLS'} onClick={() => setActiveView('SCHOOLS')} icon={<Building2 size={18}/>} label="โรงเรียน"/>
                <NavBtn active={activeView === 'ADMINS'} onClick={() => setActiveView('ADMINS')} icon={<Shield size={18}/>} label="ผู้ดูแลระบบ"/>
                <NavBtn active={activeView === 'MAINTENANCE'} onClick={() => setActiveView('MAINTENANCE')} icon={<Terminal size={18}/>} label="SQL Engine"/>
                <button onClick={onLogout} className="p-3 bg-red-500/20 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition shadow-sm"><LogOut size={24}/></button>
            </div>
        </div>

        {activeView === 'SCHOOLS' && (
            <div className="animate-fade-in space-y-6">
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200">
                    <h3 className="font-black text-xl mb-6 flex items-center gap-3 text-slate-800"><PlusCircle className="text-green-600" size={28}/> เพิ่มโรงเรียน</h3>
                    <div className="flex flex-col md:flex-row gap-4 items-end bg-slate-50 p-6 rounded-2xl">
                        <div className="flex-1 w-full">
                            <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase">ชื่อโรงเรียน</label>
                            <input type="text" value={newSchoolName} onChange={e => setNewSchoolName(e.target.value)} className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 outline-none transition font-bold" />
                        </div>
                        <div className="w-full md:w-56">
                            <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase">PIN 8 หลัก</label>
                            <input type="text" maxLength={8} value={newSchoolCode} onChange={e => setNewSchoolCode(e.target.value.replace(/[^0-9]/g,''))} className="w-full p-4 rounded-xl border-2 border-slate-200 font-mono text-center text-xl font-black text-indigo-600" />
                        </div>
                        <button onClick={async () => {
                            if(!newSchoolName || newSchoolCode.length !== 8) return alert("ข้อมูลไม่ครบ");
                            if(await manageSchool('add', {name: newSchoolName, schoolCode: newSchoolCode})) { alert("สร้างสำเร็จ"); setNewSchoolName(''); setNewSchoolCode(''); loadData(); }
                        }} className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-black hover:bg-indigo-700 shadow-xl transition active:scale-95">สร้าง</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {schools.map(school => {
                        const statsObj = getSchoolStats(school);
                        const schoolTeachers = teachers.filter(t => t.school === school.name);
                        const isExpanded = expandedSchoolId === school.id;
                        
                        return (
                            <div key={school.id} className={`bg-white rounded-[40px] border-2 transition-all duration-300 relative overflow-hidden ${isExpanded ? 'border-indigo-500 shadow-2xl' : 'border-slate-100 shadow-sm hover:border-slate-200'}`}>
                                <div className="p-8 flex flex-col lg:flex-row justify-between items-center cursor-pointer gap-6" onClick={() => { setExpandedSchoolId(isExpanded ? null : school.id); setSchoolTab('STAFF'); }}>
                                    <div className="flex items-center gap-5">
                                        <div className="p-5 rounded-2xl bg-indigo-50 text-indigo-600 shadow-inner relative">
                                            <Building2 size={36}/>
                                            {statsObj.pendingCount > 0 && (
                                                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full animate-bounce shadow-lg border-2 border-white">
                                                    {statsObj.pendingCount}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-2xl text-slate-800">{school.name}</h4>
                                            <div className="flex gap-2 mt-1">
                                                <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-indigo-500 font-black">PIN: {school.schoolCode}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 md:gap-8 bg-slate-50 px-8 py-5 rounded-3xl border border-slate-100 shadow-inner">
                                        <MiniStat label="ครู/นักเรียน" val={`${statsObj.teacherCount}/${statsObj.studentCount}`} icon={<Users size={12}/>} color="text-slate-600"/>
                                        <div className="w-px h-8 bg-slate-200 hidden md:block"></div>
                                        <MiniStat label="ล็อกอินรวม" val={statsObj.totalLogins} icon={<LogIn size={12}/>} color="text-indigo-600"/>
                                        <div className="text-slate-300 transition-transform ml-2">{isExpanded ? <ChevronUp size={24}/> : <ChevronDown size={24}/>}</div>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="animate-slide-up border-t border-slate-50 p-8 pt-4">
                                        <div className="flex gap-2 mb-6 bg-slate-100 p-1.5 rounded-2xl w-fit">
                                            <button onClick={() => setSchoolTab('STAFF')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${schoolTab === 'STAFF' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-50'}`}><Users size={16}/> บุคลากร</button>
                                            <button onClick={() => setSchoolTab('REQUESTS')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 relative ${schoolTab === 'REQUESTS' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-50'}`}>
                                                <UserPlus size={16}/> คำขอสมัครใหม่
                                                {statsObj.pendingCount > 0 && <span className="w-2 h-2 bg-red-500 rounded-full animate-ping absolute top-2 right-4"></span>}
                                            </button>
                                        </div>

                                        {schoolTab === 'STAFF' ? (
                                            <div className="bg-slate-50 rounded-3xl border-2 border-slate-100 overflow-hidden">
                                                <table className="w-full text-left">
                                                    <thead className="text-[10px] font-black uppercase text-slate-400"><tr><th className="px-6 py-4">ครู</th><th className="px-6 py-4 text-center">สิทธิ์</th><th className="px-6 py-4 text-center">สถานะ</th><th className="px-6 py-4 text-right">จัดการ</th></tr></thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {schoolTeachers.map(t => (
                                                            <tr key={t.id} className="hover:bg-white transition">
                                                                <td className="px-6 py-4"><div className="font-black text-slate-800">{t.name}</div><div className="text-[10px] text-slate-400">@{t.username}</div></td>
                                                                <td className="px-6 py-4 text-center">
                                                                    <button onClick={() => handleRoleToggle(t)} className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all border-b-2 ${t.role === 'SUPER_ADMIN' ? 'bg-amber-500 text-slate-900 border-amber-700' : t.role === 'SCHOOL_ADMIN' ? 'bg-indigo-600 text-white border-indigo-800' : 'bg-slate-200 text-slate-500 border-slate-300'}`}>
                                                                        {t.role}
                                                                    </button>
                                                                </td>
                                                                <td className="px-6 py-4 text-center text-[10px] font-black">{t.status === 'suspended' ? <span className="text-red-500">🔒 ระงับ</span> : <span className="text-green-600">✅ ปกติ</span>}</td>
                                                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                                    {/* Fix: use handleToggleStatus which is now defined */}
                                                                    <button onClick={() => handleToggleStatus(t)} className="p-2 bg-slate-100 rounded-lg">{t.status === 'suspended' ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>}</button>
                                                                    <button onClick={() => manageTeacher('delete', {id: t.id}).then(loadData)} className="p-2 bg-red-50 text-red-400 rounded-lg"><Trash2 size={18}/></button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {pendingRequests.filter(r => r.schoolId === school.id).length === 0 ? (
                                                    <div className="py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 font-bold italic">ไม่มีคำขอสมัครใหม่</div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {pendingRequests.filter(r => r.schoolId === school.id).map(req => (
                                                            <div key={req.id} className="bg-white p-6 rounded-3xl border-2 border-red-100 shadow-sm flex flex-col justify-between gap-4 group">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500"><UserPlus size={24}/></div>
                                                                    <div><div className="font-black text-slate-800 text-lg">{req.name} {req.surname}</div><div className="text-xs text-slate-400 font-bold uppercase tracking-tighter">ID: {req.citizenId}</div></div>
                                                                </div>
                                                                <div className="flex gap-2 border-t pt-4 border-slate-50">
                                                                    <button onClick={() => handleApprove(req, school.name)} className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-black text-sm">อนุมัติครู</button>
                                                                    <button onClick={() => handleReject(req.id)} className="px-4 bg-red-50 text-red-500 py-2.5 rounded-xl font-black text-sm"><X size={18}/></button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {activeView === 'ADMINS' && (
            <div className="animate-fade-in space-y-6">
                <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div>
                        <h3 className="text-xl font-black text-slate-800">ผู้ดูแลระบบส่วนกลาง</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Global System Administrators</p>
                    </div>
                    <button onClick={() => setShowAddAdminModal(true)} className="bg-amber-500 text-slate-900 px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-amber-100 transition hover:scale-105 active:scale-95 flex items-center gap-2 border-b-4 border-amber-700">
                        <UserPlus size={20}/> เพิ่ม Super Admin
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {globalAdmins.map(adm => (
                        <div key={adm.id} className="bg-slate-900 text-white p-6 rounded-[35px] shadow-xl border border-slate-800 relative group overflow-hidden border-b-8 border-amber-500">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><Shield size={80}/></div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-900 shadow-lg text-2xl">
                                    <ShieldCheck size={32}/>
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-black text-lg truncate">{adm.name}</h4>
                                    <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded uppercase border border-amber-500/20">@{adm.username}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Login History</span>
                                    <span className="text-xs font-bold">{adm.login_count || 0} times</span>
                                </div>
                                {String(adm.id) !== String(admin.id) && (
                                    <button onClick={() => manageTeacher('delete', {id: adm.id}).then(loadData)} className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition">
                                        <Trash2 size={18}/>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeView === 'MAINTENANCE' && (
            <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
                <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl border-t-8 border-orange-500">
                    <div className="flex items-center gap-4 text-orange-400 mb-6"><Database size={40}/><div><h3 className="text-2xl font-black">Full Database Setup Engine</h3><p className="text-slate-400 text-sm">ติดตั้งตารางและสิทธิ์เริ่มต้น</p></div></div>
                    <pre className="text-green-400 font-mono text-[11px] overflow-x-auto p-4 bg-black/40 rounded-xl max-h-[450px] border border-slate-800 custom-scrollbar mb-6">{SQL_UPGRADE_SCRIPT}</pre>
                    <button onClick={() => { navigator.clipboard.writeText(SQL_UPGRADE_SCRIPT); alert("คัดลอกสำเร็จ!"); }} className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black transition shadow-xl active:scale-95">คัดลอกสคริปต์ฐานข้อมูล</button>
                </div>
            </div>
        )}

        {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-indigo-600 animate-pulse"><RefreshCw className="animate-spin mb-4" size={48}/><p className="font-bold">กำลังประมวลผลข้อมูลกลาง...</p></div>
        )}
    </div>
  );
};

const NavBtn: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
    <button onClick={onClick} className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${active ? 'bg-white text-slate-900 shadow-xl scale-105' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{icon} {label}</button>
);

const MiniStat: React.FC<{ label: string, val: string | number, icon: React.ReactNode, color: string }> = ({ label, val, icon, color }) => (
    <div className="text-center min-w-[70px]">
        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
            {icon} {label}
        </div>
        <div className={`text-xl font-black ${color}`}>{val.toLocaleString()}</div>
    </div>
);

export default SuperAdminDashboard;
