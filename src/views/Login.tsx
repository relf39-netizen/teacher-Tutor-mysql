import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { AlertCircle, Loader2, ChevronRight, User, KeyRound, UserPlus, Building2, X, CreditCard, LogIn, BookMarked, CheckCircle2 } from 'lucide-react';
import { verifyStudentLogin, requestStudentRegistration } from '../services/api'; 

interface LoginProps {
  onLogin: (student: Student) => void;
  onTeacherLoginClick: () => void;
}

const MAJORS = [
    'ภาษาไทย',
    'คณิตศาสตร์',
    'ภาษาอังกฤษ',
    'วิทยาศาสตร์',
    'คอมพิวเตอร์ / เทคโนโลยีสารสนเทศ / วิทยาการคำนวณ',
    'การศึกษาปฐมวัย (อนุบาล)',
    'สังคมศึกษา ศาสนา และวัฒนธรรม',
    'พลศึกษา / สุขศึกษา',
    'การศึกษาพิเศษ',
    'ดนตรี / นาฏศิลป์ / ศิลปศึกษา'
];

const Login: React.FC<LoginProps> = ({ onLogin, onTeacherLoginClick }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); 
  const [foundStudent, setFoundStudent] = useState<Student | null>(null);

  // Registration States
  const [showRegister, setShowRegister] = useState(false);
  const [regCitizenId, setRegCitizenId] = useState('');
  const [regName, setRegName] = useState('');
  const [regSurname, setRegSurname] = useState('');
  const [regMajor, setRegMajor] = useState('');
  const [regExamType, setRegExamType] = useState<'TEACHER' | 'GENERAL_CIVIL_SERVANT'>('TEACHER');
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  // 🔗 ตรวจสอบว่าเข้าผ่านลิงก์สมัครสมาชิกหรือไม่
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'register' || params.get('register') === 'true') {
      setShowRegister(true);
      // ลบ Parameter ออกจาก URL เพื่อความสวยงาม (ไม่บังคับ)
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return setError('กรุณากรอกข้อมูลให้ครบถ้วน');
    
    setLoading(true);
    setError('');
    
    const result = await verifyStudentLogin(username, password);
    setLoading(false);

    if (result.student) {
      setFoundStudent(result.student);
      setTimeout(() => {
        onLogin(result.student!);
      }, 1000);
    } else {
      setError(result.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      setPassword('');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!regCitizenId || !regName || !regSurname) return alert("กรุณากรอกข้อมูลชื่อ-นามสกุล และเลขบัตรประชาชน");
      if (!regMajor) return alert("สำคัญ: กรุณาเลือก 'วิชาเอกที่จะสอบบรรจุ' ก่อนส่งข้อมูล");
      if (regCitizenId.length !== 13) return alert("เลขบัตรประชาชนต้องมี 13 หลัก");
      
      setRegLoading(true);
      const res = await requestStudentRegistration(regCitizenId, regName, regSurname, regMajor, regExamType);
      setRegLoading(false);
      
      if (res.success) {
          setRegSuccess(true);
          setRegCitizenId(''); setRegName(''); setRegSurname('');
      } else {
          alert(res.message);
      }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden bg-slate-900 font-prompt">
      
      {/* REGISTRATION MODAL */}
      {showRegister && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden relative border border-white/20">
                  <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl"><UserPlus size={24}/></div>
                        <h3 className="font-black text-xl">สมัครสมาชิกใหม่</h3>
                      </div>
                      <button onClick={() => { setShowRegister(false); setRegSuccess(false); }} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition"><X/></button>
                  </div>
                  
                  {regSuccess ? (
                      <div className="p-10 text-center space-y-6 animate-scale-in">
                          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-50">
                              <CheckCircle2 size={56} />
                          </div>
                          <h3 className="text-3xl font-black text-slate-800">ส่งข้อมูลสำเร็จ!</h3>
                          <div className="bg-amber-50 p-8 rounded-[40px] border-4 border-amber-400 shadow-xl shadow-amber-100">
                              <p className="text-xl font-black text-amber-800 leading-relaxed uppercase tracking-tight">
                                  โปรดรอ Admin ตรวจสอบ<br/>
                                  <span className="text-3xl text-slate-900">และอนุมัติสิทธิ์</span><br/>
                                  <span className="text-xs font-bold text-amber-600">จึงจะสามารถเริ่มใช้งานระบบได้</span>
                              </p>
                          </div>
                          <button onClick={() => { setShowRegister(false); setRegSuccess(false); }} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xl shadow-xl transition active:scale-95">
                              รับทราบและปิดหน้าต่าง
                          </button>
                      </div>
                  ) : (
                      <form onSubmit={handleRegister} className="p-8 space-y-6">
                          <div className="grid grid-cols-1 gap-6">
                              <div>
                                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">เลขประจำตัวประชาชน (ใช้เป็น Username ในการเข้าสู่ระบบ)</label>
                                  <div className="relative">
                                      <input type="text" maxLength={13} value={regCitizenId} onChange={e => setRegCitizenId(e.target.value.replace(/[^0-9]/g, ''))} className="w-full p-4 pl-12 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 bg-slate-50 outline-none transition font-bold" placeholder="กรอกเลข 13 หลัก" />
                                      <CreditCard className="absolute left-4 top-4 text-slate-300" size={20} />
                                  </div>
                              </div>

                              <div className="bg-indigo-50 p-5 rounded-[32px] border-2 border-indigo-100">
                                  <label className="block text-xs font-black text-indigo-600 uppercase mb-3 ml-1 tracking-tight">
                                      เลือกประเภทการสอบที่ต้องการเตรียมตัว *
                                  </label>
                                  <div className="grid grid-cols-2 gap-3">
                                      <button 
                                          type="button"
                                          onClick={() => setRegExamType('TEACHER')}
                                          className={`p-4 rounded-2xl border-2 transition-all font-black text-sm ${regExamType === 'TEACHER' ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg' : 'border-slate-100 bg-white text-slate-400'}`}
                                      >
                                          สอบบรรจุครู
                                      </button>
                                      <button 
                                          type="button"
                                          onClick={() => setRegExamType('GENERAL_CIVIL_SERVANT')}
                                          className={`p-4 rounded-2xl border-2 transition-all font-black text-sm ${regExamType === 'GENERAL_CIVIL_SERVANT' ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg' : 'border-slate-100 bg-white text-slate-400'}`}
                                      >
                                          สอบข้าราชการทั่วไป
                                      </button>
                                  </div>
                              </div>

                              {/* ส่วนเลือกวิชาเอกที่ปรับปรุงให้เด่นชัดขึ้นมาก */}
                              {regExamType === 'TEACHER' && (
                                <div className="bg-gradient-to-br from-amber-400 to-amber-500 p-1 rounded-[35px] shadow-lg">
                                    <div className="bg-white p-5 rounded-[32px]">
                                        <label className="block text-xs font-black text-amber-600 uppercase mb-3 ml-1 tracking-tight flex items-center gap-2">
                                            <BookMarked size={20} className="animate-bounce"/> 1. ขั้นตอนสำคัญ: โปรดเลือกวิชาเอกที่จะสอบ *
                                        </label>
                                        <div className="relative">
                                            <select 
                                                required
                                                value={regMajor} 
                                                onChange={e => setRegMajor(e.target.value)} 
                                                className="w-full p-4 pl-5 border-4 border-amber-100 rounded-2xl focus:border-amber-400 bg-amber-50/20 outline-none transition font-black text-slate-800 appearance-none shadow-inner text-lg cursor-pointer"
                                            >
                                                <option value="" disabled>--- แตะที่นี่เพื่อเลือกวิชาเอก ---</option>
                                                {MAJORS.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                            <div className="absolute right-4 top-4.5 pointer-events-none text-amber-500"><ChevronRight className="rotate-90" size={28}/></div>
                                        </div>
                                    </div>
                                </div>
                              )}

                              {regExamType === 'GENERAL_CIVIL_SERVANT' && (
                                <div className="bg-gradient-to-br from-emerald-400 to-emerald-500 p-1 rounded-[35px] shadow-lg">
                                    <div className="bg-white p-5 rounded-[32px]">
                                        <label className="block text-xs font-black text-emerald-600 uppercase mb-3 ml-1 tracking-tight flex items-center gap-2">
                                            <BookMarked size={20} className="animate-bounce"/> 1. ขั้นตอนสำคัญ: สายงานข้าราชการทั่วไป *
                                        </label>
                                        <div className="relative">
                                            <select 
                                                required
                                                value={regMajor} 
                                                onChange={e => setRegMajor(e.target.value)} 
                                                className="w-full p-4 pl-5 border-4 border-emerald-100 rounded-2xl focus:border-emerald-400 bg-emerald-50/20 outline-none transition font-black text-slate-800 appearance-none shadow-inner text-lg cursor-pointer"
                                            >
                                                <option value="" disabled>--- เลือกสายงาน/ตำแหน่ง ---</option>
                                                <option value="ข้าราชการพลเรือนสามัญ">ข้าราชการพลเรือนสามัญ</option>
                                                <option value="พนักงานส่วนท้องถิ่น">พนักงานส่วนท้องถิ่น</option>
                                                <option value="ข้าราชการกรุงเทพมหานคร">ข้าราชการกรุงเทพมหานคร</option>
                                                <option value="อื่นๆ">อื่นๆ</option>
                                            </select>
                                            <div className="absolute right-4 top-4.5 pointer-events-none text-emerald-500"><ChevronRight className="rotate-90" size={28}/></div>
                                        </div>
                                    </div>
                                </div>
                              )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">ชื่อ (ภาษาไทย)</label>
                                  <input type="text" required value={regName} onChange={e => setRegName(e.target.value)} className="w-full p-4 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 bg-slate-50 outline-none transition font-bold" placeholder="ชื่อ" />
                              </div>
                              <div>
                                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">นามสกุล (ภาษาไทย)</label>
                                  <input type="text" required value={regSurname} onChange={e => setRegSurname(e.target.value)} className="w-full p-4 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 bg-slate-50 outline-none transition font-bold" placeholder="นามสกุล" />
                              </div>
                          </div>

                          <div className="pt-2">
                              <button disabled={regLoading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-[25px] font-black text-xl shadow-xl shadow-indigo-100 transition disabled:opacity-50 active:scale-95 border-b-8 border-indigo-900">
                                  {regLoading ? 'กำลังส่งข้อมูล...' : 'ส่งข้อมูลเพื่อขออนุมัติใช้งาน'}
                              </button>
                          </div>
                      </form>
                  )}
              </div>
          </div>
      )}

      {/* 🟢 Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 opacity-100 z-0"></div>
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-500 rounded-full mix-blend-screen filter blur-[100px] opacity-10 animate-blob"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-[100px] opacity-10 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-[420px] z-10 p-6">
        <div className="bg-white/95 backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] rounded-[50px] border border-white/20 p-10 relative overflow-hidden text-center">
            
            <div className="mb-10">
                <div className="w-24 h-24 bg-white rounded-[35px] flex items-center justify-center mx-auto mb-4 shadow-2xl border-4 border-slate-900 overflow-hidden transform rotate-3">
                    <img src="https://img2.pic.in.th/photo_2026-01-02_11-42-52.jpg" className="w-full h-full object-cover" alt="App Icon"/>
                </div>
                <h1 className="text-xl font-black text-slate-800 tracking-tight leading-tight">ระบบเตรียมตัวสอบบรรจุข้าราชการครู</h1>
                <p className="text-indigo-600 text-[9px] font-black uppercase tracking-[0.3em] mt-2 italic">Teacher Recruitment Prep Portal</p>
            </div>

            {foundStudent ? (
                <div className="flex flex-col items-center justify-center py-10 animate-scale-in">
                    <div className="text-7xl mb-4 bg-indigo-50 p-6 rounded-[40px] shadow-inner border border-indigo-100">{foundStudent.avatar}</div>
                    <h2 className="text-2xl font-black text-slate-800">ยินดีต้อนรับ</h2>
                    <p className="text-indigo-600 font-bold mt-1">ว่าที่ครู{foundStudent.name.split(' ')[0]}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase mt-2">เอก: {foundStudent.major}</p>
                    <div className="mt-8 flex items-center gap-2 text-emerald-500 font-black text-sm uppercase tracking-widest">
                        <Loader2 className="animate-spin" size={18}/> เข้าสู่ระบบแล้ว...
                    </div>
                </div>
            ) : (
                <form onSubmit={handleLogin} className="space-y-6 text-left">
                    {error && (
                        <div className="flex items-center gap-3 text-rose-600 text-xs font-black bg-rose-50 p-4 rounded-2xl border border-rose-100 animate-shake">
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Citizen ID (Username)</label>
                        <div className="relative">
                            <input type="text" value={username} onChange={e => setUsername(e.target.value.replace(/[^0-9]/g, ''))} maxLength={13} className="w-full p-4 pl-12 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 bg-slate-50 focus:bg-white outline-none transition font-bold text-slate-700" placeholder="เลข 13 หลัก" />
                            <User className="absolute left-4 top-4.5 text-slate-400" size={20} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Password</label>
                        <div className="relative">
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 pl-12 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 bg-slate-50 focus:bg-white outline-none transition font-bold text-slate-700" placeholder="รหัสผ่าน" />
                            <KeyRound className="absolute left-4 top-4.5 text-slate-400" size={20} />
                        </div>
                    </div>

                    <button disabled={loading} type="submit" className="w-full bg-slate-900 hover:bg-indigo-950 text-white py-5 rounded-3xl font-black text-lg shadow-xl shadow-slate-200 transition-all transform active:scale-95 flex items-center justify-center gap-3 border-b-8 border-indigo-700">
                        {loading ? <Loader2 className="animate-spin" size={24}/> : <><LogIn size={22}/> เข้าสู่ระบบติวเข้ม</>}
                    </button>

                    <div className="pt-4 space-y-4">
                        <button type="button" onClick={() => setShowRegister(true)} className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all text-xs font-black uppercase tracking-widest">
                            <UserPlus size={16} /> สมัครสมาชิกรายใหม่
                        </button>
                        <button type="button" onClick={onTeacherLoginClick} className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-600 transition-all text-[10px] font-black uppercase tracking-widest">
                            <Building2 size={14} /> สำหรับเจ้าหน้าที่/คุณครู <span className="text-indigo-600 underline ml-1">Login</span>
                        </button>
                    </div>
                </form>
            )}
        </div>
      </div>
    </div>
  );
};

export default Login;