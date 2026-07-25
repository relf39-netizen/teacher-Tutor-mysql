import React, { useState, useEffect } from 'react';
import { Student, Teacher, RegistrationRequest } from '../../types';
import { 
    Users, RefreshCw, Trash2, Clock, Check, X, ShieldCheck, 
    Search, UserPlus, Info, GraduationCap, ShieldAlert,
    CheckCircle, BookMarked, Save, Loader2, ArrowRight, User, Stars, CreditCard, ChevronRight,
    Lock, Unlock, CalendarDays, AlertTriangle, Copy, ClipboardCheck, Eye, EyeOff, Key,
    UserCircle, Link as LinkIcon
} from 'lucide-react';
import { manageStudent, getTeacherDashboard, approveStudentRegistration, rejectRegistration, manageTeacher } from '../../services/api';

interface StudentManagerProps {
  students: Student[];
  teacher: Teacher;
  onRefresh: () => void;
}

const MAJORS = [
    'ภาษาไทย', 'คณิตศาสตร์', 'ภาษาอังกฤษ', 'วิทยาศาสตร์',
    'คอมพิวเตอร์ / เทคโนโลยี / วิทยาการคำนวณ', 'การศึกษาปฐมวัย (อนุบาล)',
    'สังคมศึกษาฯ', 'พลศึกษา / สุขศึกษา', 'การศึกษาพิเศษ', 'ดนตรี / นาฏศิลป์ / ศิลปะ'
];

const calculateMembershipDuration = (dateStr?: string) => {
    if (!dateStr) return "ไม่ระบุ";
    const start = new Date(dateStr);
    const now = new Date();
    
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    let days = now.getDate() - start.getDate();

    if (days < 0) {
        months--;
        const lastMonthOfPrev = new Date(now.getFullYear(), now.getMonth(), 0);
        days += lastMonthOfPrev.getDate();
    }
    if (months < 0) {
        years--;
        months += 12;
    }

    const parts = [];
    if (years > 0) parts.push(`${years} ปี`);
    if (months > 0) parts.push(`${months} เดือน`);
    if (days > 0) parts.push(`${days} วัน`);
    
    return parts.length > 0 ? parts.join(' ') : "เพิ่งสมัครวันนี้";
};

const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; 
    let password = "";
    for (let i = 0; i < 6; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

const StudentManager: React.FC<StudentManagerProps> = ({ students, teacher, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'PENDING'>('ACTIVE');
  const [pendingRequests, setPendingRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newMember, setNewMember] = useState({ 
      id: '', 
      name: '', 
      major: MAJORS[0], 
      avatar: '👦',
      type: 'STUDENT' as 'STUDENT' | 'TEACHER'
  });

  const [approvingReq, setApprovingReq] = useState<RegistrationRequest | null>(null);
  const [approvedCredentials, setApprovedCredentials] = useState<{name: string, username: string, password: string} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  useEffect(() => { loadPending(); }, [teacher.school]);

  const loadPending = async () => {
      setLoading(true);
      const data = await getTeacherDashboard(teacher.school);
      if (data.pendingStudents) setPendingRequests(data.pendingStudents);
      setLoading(false);
  };

  const handleCopyInviteLink = () => {
      const inviteLink = `${window.location.origin}${window.location.pathname}?mode=register`;
      navigator.clipboard.writeText(inviteLink);
      setIsLinkCopied(true);
      setTimeout(() => setIsLinkCopied(false), 2000);
  };

  const handleManualAdd = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMember.id || !newMember.name) return alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      
      setIsProcessing(true);
      const password = generateRandomPassword();
      
      let res;
      if (newMember.type === 'STUDENT') {
          res = await manageStudent({ 
              action: 'add', 
              id: newMember.id,
              name: newMember.name,
              major: newMember.major,
              avatar: newMember.avatar,
              password: password,
              school: teacher.school, 
              grade: 'ALL', 
              classroom: '1' 
          });
      } else {
          res = await manageTeacher('add', {
              name: newMember.name,
              username: newMember.id,
              password: password,
              school: teacher.school,
              role: 'SCHOOL_ADMIN'
          });
      }

      setIsProcessing(false);
      if (res.success) {
          setApprovedCredentials({
              name: newMember.name,
              username: newMember.id,
              password: password
          });
          setShowAddModal(false);
          setNewMember({ id: '', name: '', major: MAJORS[0], avatar: '👦', type: 'STUDENT' });
          onRefresh();
      } else {
          alert("เกิดข้อผิดพลาด: " + res.message);
      }
  };

  const handleApprove = async () => {
      if (!approvingReq) return;
      setIsProcessing(true);
      const password = generateRandomPassword();
      const res = await approveStudentRegistration(approvingReq, teacher.school, password);
      setIsProcessing(false);
      if (res.success) {
          setApprovedCredentials({
              name: `${approvingReq.name} ${approvingReq.surname}`,
              username: approvingReq.citizenId,
              password: password
          });
          setApprovingReq(null);
          loadPending();
          onRefresh();
      }
  };

  const handleCopyCredentials = (name: string, user: string, pass: string) => {
      const text = `🎉 บัญชีผู้ใช้งานระบบ KuruMaster\n------------------\nชื่อ: ${name}\nUsername: ${user}\nPassword: ${pass}\n------------------\nเข้าใช้งานได้ที่: ${window.location.origin}`;
      navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
  };

  const togglePasswordVisibility = (studentId: string) => {
      setVisiblePasswords(prev => ({
          ...prev,
          [studentId]: !prev[studentId]
      }));
  };

  const handleToggleSuspend = async (student: Student) => {
      const isSuspended = student.status === 'suspended';
      const newStatus = isSuspended ? 'active' : 'suspended';
      if (!confirm(`ต้องการ${isSuspended ? 'ยกเลิกการระงับ' : 'ระงับ'}การใช้งานของ ${student.name} ใช่หรือไม่?`)) return;
      setIsProcessing(true);
      const res = await manageStudent({ action: 'update_status', id: student.id, status: newStatus });
      setIsProcessing(false);
      if (res.success) onRefresh();
  };

  const filteredStudents = students.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.includes(searchTerm) || s.major?.includes(searchTerm)
  );

  return (
    <div className="animate-fade-in font-prompt">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div>
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md"><Users size={24}/></div>
                    จัดการสมาชิก
                </h3>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                {/* 🔗 New Direct Register Link Button */}
                <button 
                    onClick={handleCopyInviteLink} 
                    className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 border-2 ${isLinkCopied ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-indigo-600 border-indigo-100 hover:border-indigo-300'}`}
                >
                    {isLinkCopied ? <ClipboardCheck size={16}/> : <LinkIcon size={16}/>}
                    {isLinkCopied ? 'คัดลอกลิงก์แล้ว!' : 'คัดลอกลิงก์เชิญนักศึกษา'}
                </button>

                <button onClick={() => setShowAddModal(true)} className="bg-slate-900 text-amber-400 px-4 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition shadow-md active:scale-95">
                    <UserPlus size={16}/> เพิ่มสมาชิกใหม่
                </button>
                <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200">
                    <button onClick={() => setActiveTab('ACTIVE')} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${activeTab === 'ACTIVE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>ปัจจุบัน</button>
                    <button onClick={() => { setActiveTab('PENDING'); loadPending(); }} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all relative ${activeTab === 'PENDING' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}>
                        รออนุมัติ
                        {pendingRequests.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] flex items-center justify-center rounded-full font-black border border-white shadow-sm">{pendingRequests.length}</span>}
                    </button>
                </div>
            </div>
        </div>

        <div className="space-y-6">
            <div className="relative">
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="ค้นหารายชื่อ, ID หรือวิชาเอก..." className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white outline-none transition font-bold text-sm" />
                <Search className="absolute left-3.5 top-3 text-slate-300" size={18}/>
            </div>

            {activeTab === 'ACTIVE' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStudents.map(s => {
                        const isSuspended = s.status === 'suspended';
                        const showPass = visiblePasswords[s.id] || false;
                        const studentPassword = (s as any).password || '123456';
                        const duration = calculateMembershipDuration(s.created_at);

                        return (
                            <div key={s.id} className={`bg-white p-4 rounded-2xl border-2 transition-all group relative border-b-[6px] ${isSuspended ? 'opacity-75 bg-slate-50 border-slate-200' : 'border-slate-100 shadow-sm hover:shadow-md'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl border shadow-inner transition-transform group-hover:scale-105 ${isSuspended ? 'bg-slate-200 grayscale' : 'bg-slate-50 border-slate-100'}`}>{s.avatar}</div>
                                        <div className="min-w-0">
                                            <div className={`font-black text-sm truncate leading-tight flex items-center gap-2 ${isSuspended ? 'text-slate-400' : 'text-slate-800'}`}>{s.name}{isSuspended && <Lock size={12} className="text-rose-500"/>}</div>
                                            <div className={`text-[9px] font-black uppercase tracking-widest mt-1 text-indigo-400`}>ID: {s.id}</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${isSuspended ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{isSuspended ? 'Suspended' : 'Active'}</span>
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <div className="flex gap-2">
                                        <div className="flex-1 p-2 bg-indigo-50/50 rounded-xl border border-indigo-50">
                                            <div className="text-[8px] font-black text-indigo-300 uppercase tracking-widest mb-0.5">วิชาเอก</div>
                                            <div className="font-bold text-[10px] truncate text-indigo-700">{s.major || 'ทั่วไป'}</div>
                                        </div>
                                        <div className="flex-1 p-2 bg-emerald-50/50 rounded-xl border border-emerald-50">
                                            <div className="text-[8px] font-black text-emerald-300 uppercase tracking-widest mb-0.5">ระยะเวลาสมาชิก</div>
                                            <div className="font-bold text-[10px] truncate text-emerald-700">{duration}</div>
                                        </div>
                                    </div>

                                    <div className="p-2.5 rounded-xl border bg-slate-50 border-slate-100 flex items-center justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 flex items-center gap-1"><Key size={10}/> Security Info</div>
                                            <div className="font-mono text-[11px] font-black text-slate-700 tracking-wider">
                                                {showPass ? studentPassword : '••••••'}
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button 
                                                onClick={() => togglePasswordVisibility(s.id)}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 transition bg-white rounded-lg border border-slate-100 shadow-sm"
                                                title={showPass ? "ซ่อนรหัสผ่าน" : "ดูรหัสผ่าน"}
                                            >
                                                {showPass ? <EyeOff size={14}/> : <Eye size={14}/>}
                                            </button>
                                            <button 
                                                onClick={() => handleCopyCredentials(s.name, s.id, studentPassword)}
                                                className="p-1.5 text-slate-400 hover:text-emerald-600 transition bg-white rounded-lg border border-slate-100 shadow-sm"
                                                title="คัดลอกข้อมูลส่งให้"
                                            >
                                                <Copy size={14}/>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center px-1 pt-1 border-t border-slate-50">
                                        <div className="flex items-center gap-1.5"><Stars size={12} className="text-amber-500 fill-amber-500"/><span className={`font-black text-xs text-slate-600`}>{s.stars} <span className="text-[9px] text-slate-400 uppercase">Stars</span></span></div>
                                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={() => handleToggleSuspend(s)} className={`p-1.5 rounded-lg border transition-all ${isSuspended ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-500 border-rose-100 hover:bg-rose-500 hover:text-white'}`}>{isSuspended ? <Unlock size={14}/> : <ShieldAlert size={14}/>}</button>
                                            <button onClick={() => {if(confirm('ลบนักศึกษาท่านนี้?')) manageStudent({action:'delete', id: s.id}).then(onRefresh)}} className="p-1.5 text-slate-400 hover:text-rose-500 transition-all"><Trash2 size={14}/></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingRequests.map(req => (
                        <div key={req.id} className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm flex flex-col justify-between gap-4 border-b-4 border-orange-200">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center text-3xl border border-orange-100 shadow-inner">{req.avatar || '👦'}</div>
                                <div className="min-w-0">
                                    <h5 className="font-black text-slate-800 text-sm truncate">{req.name} {req.surname}</h5>
                                    <span className="text-[8px] font-black text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded uppercase mt-1 inline-block">Pending Approval</span>
                                </div>
                            </div>
                            <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                                 <div className="text-[8px] font-black text-amber-600 uppercase mb-0.5">วิชาเอกที่เลือก</div>
                                 <div className="font-black text-slate-700 text-[11px] truncate">{req.major}</div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setApprovingReq(req)} className="flex-1 bg-emerald-600 text-white py-2 rounded-xl font-black text-[10px] shadow hover:bg-emerald-700 transition flex items-center justify-center gap-1.5"><Check size={14}/> ตรวจสอบ</button>
                                <button onClick={async () => {if(confirm("ปฏิเสธคำขอนี้?")){ await rejectRegistration(req.id); loadPending(); }}} className="px-3 bg-rose-50 text-rose-500 py-2 rounded-xl font-black text-[10px] hover:bg-rose-500 hover:text-white transition border border-rose-100"><X size={14}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* ➕ Add Member Modal */}
        {showAddModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-[35px] shadow-2xl w-full max-w-md overflow-hidden animate-scale-in border-b-[12px] border-indigo-600">
                    <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                        <h3 className="font-black text-lg flex items-center gap-3">
                            <UserPlus size={20} className="text-indigo-400"/> เพิ่มสมาชิกรายใหม่
                        </h3>
                        <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-full transition"><X size={20}/></button>
                    </div>
                    <form onSubmit={handleManualAdd} className="p-8 space-y-5">
                        <div className="bg-slate-50 p-1.5 rounded-2xl flex border-2 border-slate-100 mb-2">
                            <button 
                                type="button" 
                                onClick={() => setNewMember({...newMember, type: 'STUDENT'})}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${newMember.type === 'STUDENT' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                            >
                                <GraduationCap className="inline-block mr-2" size={14}/> นักศึกษา
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setNewMember({...newMember, type: 'TEACHER'})}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${newMember.type === 'TEACHER' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}
                            >
                                <UserCircle className="inline-block mr-2" size={14}/> คุณครู (Admin)
                            </button>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Username (เลขบัตรประชาชน)</label>
                            <input type="text" maxLength={13} required value={newMember.id} onChange={e => setNewMember({...newMember, id: e.target.value.replace(/[^0-9]/g, '')})} className="w-full p-4 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 bg-slate-50 outline-none transition font-bold text-slate-700 shadow-inner" placeholder="ระบุเลข 13 หลัก" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">ชื่อ-นามสกุล</label>
                            <input type="text" required value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 bg-slate-50 outline-none transition font-bold text-slate-700 shadow-inner" placeholder="ระบุชื่อและนามสกุลจริง" />
                        </div>
                        
                        {newMember.type === 'STUDENT' ? (
                            <div className="bg-amber-50 p-4 rounded-2xl border-2 border-amber-200">
                                <label className="block text-[10px] font-black text-amber-600 uppercase mb-1.5 ml-1 tracking-widest">วิชาเอก (สำหรับนักศึกษา)</label>
                                <select value={newMember.major} onChange={e => setNewMember({...newMember, major: e.target.value})} className="w-full p-3 border-2 border-amber-100 rounded-xl font-black text-slate-700 outline-none bg-white/50">
                                    {MAJORS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        ) : (
                            <div className="bg-rose-50 p-4 rounded-2xl border-2 border-rose-200">
                                <div className="flex items-center gap-3">
                                    <ShieldAlert className="text-rose-500" size={24}/>
                                    <div>
                                        <div className="text-[10px] font-black text-rose-600 uppercase tracking-widest">สิทธิ์การใช้งาน: SCHOOL_ADMIN</div>
                                        <p className="text-[9px] font-bold text-rose-400 leading-tight">คุณครูที่เพิ่มใหม่จะสามารถจัดการข้อสอบ สมาชิก และดูสถิติของโรงเรียนนี้ได้ทั้งหมด</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button disabled={isProcessing} type="submit" className={`w-full text-white py-4 rounded-2xl font-black text-lg shadow-xl transition active:scale-95 border-b-4 ${newMember.type === 'STUDENT' ? 'bg-indigo-600 border-indigo-900 hover:bg-indigo-700' : 'bg-rose-600 border-rose-900 hover:bg-rose-700'}`}>
                            {isProcessing ? <Loader2 className="animate-spin mx-auto"/> : `ยืนยันเพิ่ม${newMember.type === 'STUDENT' ? 'นักศึกษา' : 'คุณครู'}`}
                        </button>
                    </form>
                </div>
            </div>
        )}

        {/* 🛡️ Approval Confirmation Modal */}
        {approvingReq && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in border-b-[12px] border-emerald-600">
                    <div className="p-6 text-center">
                        <div className="text-6xl mb-4 bg-slate-50 inline-block p-4 rounded-2xl border border-slate-100">{approvingReq.avatar || '👦'}</div>
                        <h4 className="font-black text-xl text-slate-800 mb-1">{approvingReq.name} {approvingReq.surname}</h4>
                        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 mb-8">
                             <div className="text-[8px] font-black text-indigo-400 uppercase mb-1 tracking-widest">วิชาเอกที่สมัคร</div>
                             <div className="font-black text-indigo-700 text-sm">{approvingReq.major}</div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button onClick={handleApprove} disabled={isProcessing} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black text-sm shadow hover:bg-emerald-700 transition flex items-center justify-center gap-2 border-b-4 border-emerald-800">
                                {isProcessing ? <Loader2 className="animate-spin" size={18}/> : <ShieldCheck size={18}/>}
                                ยืนยันอนุมัติสิทธิ์เข้าใช้งาน
                            </button>
                            <button onClick={() => setApprovingReq(null)} className="py-2 text-slate-400 font-black text-[10px] uppercase hover:text-rose-500 transition-colors">ยกเลิก</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* 📋 Success Modal with Copy Credentials */}
        {approvedCredentials && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
                <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in border-b-[12px] border-emerald-600">
                    <div className="bg-emerald-600 p-8 text-center text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><CheckCircle size={100}/></div>
                        <h3 className="text-2xl font-black">สำเร็จเรียบร้อย!</h3>
                        <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest mt-1">บัญชีถูกสร้างและพร้อมใช้งานแล้ว</p>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">ชื่อสมาชิก</label>
                                <div className="font-black text-slate-800">{approvedCredentials.name}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-indigo-50 p-4 rounded-2xl border-2 border-indigo-100 text-center">
                                    <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Username</label>
                                    <div className="font-black text-indigo-700 text-xs truncate">{approvedCredentials.username}</div>
                                </div>
                                <div className="bg-amber-50 p-4 rounded-2xl border-2 border-amber-100 text-center">
                                    <label className="text-[9px] font-black text-amber-400 uppercase tracking-widest block mb-1">Password</label>
                                    <div className="font-black text-amber-700 text-lg tracking-widest">{approvedCredentials.password}</div>
                                </div>
                            </div>
                        </div>
                        <div className="pt-2 flex flex-col gap-3">
                            <button 
                                onClick={() => handleCopyCredentials(approvedCredentials.name, approvedCredentials.username, approvedCredentials.password)} 
                                className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl ${isCopied ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'}`}
                            >
                                {isCopied ? <><ClipboardCheck size={20}/> คัดลอกสำเร็จ!</> : <><Copy size={20}/> คัดลอกข้อมูลส่งให้</>}
                            </button>
                            <button onClick={() => setApprovedCredentials(null)} className="w-full py-3 rounded-2xl font-black text-[10px] text-slate-400 uppercase tracking-widest hover:bg-slate-50">ปิดหน้าต่างสรุปผล</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default StudentManager;