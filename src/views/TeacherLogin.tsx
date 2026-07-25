
import React, { useState, useEffect } from 'react';
import { Teacher, School } from '../types';
import { ArrowLeft, Lock, UserPlus, X, CreditCard, User, AlertCircle, Building2, Search, GraduationCap, Info, Settings, Database, Save, LogOut } from 'lucide-react';
import { teacherLogin, requestRegistration, findSchoolByCode } from '../services/api';
import { isConfigured, saveMySQLConfig, clearMySQLConfig } from '../services/mysqlConfig';

interface TeacherLoginProps {
  onLoginSuccess: (teacher: Teacher) => void;
  onBack: () => void;
}

const TeacherLogin: React.FC<TeacherLoginProps> = ({ onLoginSuccess, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Registration Modal State
  const [showRegister, setShowRegister] = useState(false);
  const [regStep, setRegStep] = useState<1 | 2>(1);
  const [schoolCode, setSchoolCode] = useState('');
  const [foundSchool, setFoundSchool] = useState<School | null>(null);
  const [regCitizenId, setRegCitizenId] = useState('');
  const [regName, setRegName] = useState('');
  const [regSurname, setRegSurname] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Config Modal State
  const [showConfig, setShowConfig] = useState(false);
  const [configUrl, setConfigUrl] = useState(localStorage.getItem('MST_MYSQL_API_URL') || '/api');
  const [configHost, setConfigHost] = useState(localStorage.getItem('MST_MYSQL_HOST') || 'localhost');
  const [configDb, setConfigDb] = useState(localStorage.getItem('MST_MYSQL_DATABASE') || 'kuru_master_db');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await teacherLogin(username, password);
      if (result.success && result.teacher) {
        onLoginSuccess(result.teacher);
      } else {
        setError(result.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        setPassword('');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSchool = async () => {
      if (schoolCode.length !== 8) return alert("รหัสโรงเรียนต้องมี 8 หลัก");
      setRegLoading(true);
      const school = await findSchoolByCode(schoolCode);
      setRegLoading(false);
      if (school) {
          setFoundSchool(school);
          setRegStep(2);
      } else {
          alert("ไม่พบโรงเรียนที่มีรหัสนี้");
      }
  };

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!regCitizenId || !regName || !regSurname) return alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      if (regCitizenId.length !== 13) return alert('เลขบัตรประชาชนต้องมี 13 หลัก');
      if (!foundSchool) return;

      setRegLoading(true);
      const res = await requestRegistration(regCitizenId, regName, regSurname, foundSchool.id);
      setRegLoading(false);

      if (res.success) {
          alert(res.message);
          setShowRegister(false);
          setRegStep(1); setSchoolCode(''); setFoundSchool(null); setRegCitizenId(''); setRegName(''); setRegSurname('');
      } else {
          alert(res.message);
      }
  };

  const handleSaveConfig = () => {
      if (!configUrl) return alert("กรุณาระบุ API URL");
      saveMySQLConfig(configUrl, configHost, configDb);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 relative p-4 font-prompt">
      
      {/* CONFIG MODAL */}
      {showConfig && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
                  <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
                      <h3 className="font-bold flex items-center gap-2"><Database size={20} className="text-emerald-400"/> ตั้งค่าการเชื่อมต่อ MySQL Database</h3>
                      <button onClick={() => setShowConfig(false)}><X size={20}/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-sm text-emerald-900">
                          <p className="font-bold mb-1">คำแนะนำการเชื่อมต่อ MySQL / phpMyAdmin / Windows Peak Control:</p>
                          1. นำไฟล์ <b>mysql_schema.sql</b> ไป Import ใน <b>phpMyAdmin</b><br/>
                          2. หากโฮสต์ผ่าน PHP ให้ใส่ Endpoint <b>/api.php</b><br/>
                          3. หากรันผ่าน Node.js Backend ให้ระบุ <b>/api</b>
                      </div>
                      
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">API Endpoint URL</label>
                          <input 
                            type="text" 
                            value={configUrl} 
                            onChange={e => setConfigUrl(e.target.value)} 
                            className="w-full p-3 border rounded-lg bg-slate-50 font-mono text-sm" 
                            placeholder="/api หรือ https://your-server.com/api.php"
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">MySQL Host</label>
                              <input 
                                type="text" 
                                value={configHost} 
                                onChange={e => setConfigHost(e.target.value)} 
                                className="w-full p-3 border rounded-lg bg-slate-50 font-mono text-sm" 
                                placeholder="localhost"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">Database Name</label>
                              <input 
                                type="text" 
                                value={configDb} 
                                onChange={e => setConfigDb(e.target.value)} 
                                className="w-full p-3 border rounded-lg bg-slate-50 font-mono text-sm" 
                                placeholder="kuru_master_db"
                              />
                          </div>
                      </div>

                      <div className="pt-2 flex gap-2">
                          <button onClick={clearMySQLConfig} className="px-4 py-2 border border-red-200 text-red-600 rounded-lg font-bold hover:bg-red-50 flex items-center gap-2">
                              <LogOut size={16}/> ล้างค่า
                          </button>
                          <button onClick={handleSaveConfig} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-bold hover:bg-emerald-700 flex items-center justify-center gap-2 shadow-lg">
                              <Save size={18}/> บันทึกและเชื่อมต่อ
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* REGISTER MODAL */}
      {showRegister && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                  <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                      <h3 className="font-bold text-lg flex items-center gap-2"><UserPlus size={20} className="text-indigo-400"/> สมัครสมาชิกใหม่</h3>
                      <button onClick={() => setShowRegister(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition"><X size={18}/></button>
                  </div>
                  
                  <div className="p-6">
                      {regStep === 1 ? (
                          <div className="space-y-6">
                              <div className="text-center">
                                  <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-600">
                                      <Building2 size={32}/>
                                  </div>
                                  <h4 className="font-bold text-slate-800 text-lg">ระบุรหัสโรงเรียน</h4>
                                  <p className="text-slate-500 text-sm">กรอกรหัส 8 หลักที่ได้รับจากผู้ดูแลระบบ</p>
                              </div>
                              <div className="relative">
                                  <input 
                                    type="text" 
                                    maxLength={8} 
                                    value={schoolCode} 
                                    onChange={e => setSchoolCode(e.target.value.replace(/[^0-9]/g, ''))} 
                                    className="w-full p-4 border-2 border-slate-200 rounded-xl text-center text-3xl font-mono font-bold tracking-[0.5em] focus:border-indigo-500 focus:ring-0 outline-none text-slate-800 placeholder-slate-200" 
                                    placeholder="00000000"
                                  />
                              </div>
                              <button onClick={handleSearchSchool} disabled={regLoading || schoolCode.length !== 8} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-transform active:scale-95">
                                  {regLoading ? 'กำลังค้นหา...' : <><Search size={20}/> ตรวจสอบรหัส</>}
                              </button>
                          </div>
                      ) : (
                          <form onSubmit={handleRegister} className="space-y-4">
                              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-center gap-3 mb-4">
                                  <div className="bg-white p-2 rounded-lg shadow-sm border border-indigo-50"><Building2 className="text-indigo-600"/></div>
                                  <div>
                                      <div className="text-[10px] text-indigo-500 font-black uppercase tracking-wider">SCHOOL</div>
                                      <div className="font-bold text-slate-800">{foundSchool?.name}</div>
                                  </div>
                              </div>

                              <div>
                                  <label className="block text-xs font-bold text-slate-600 mb-1 ml-1">เลขประจำตัวประชาชน (Username)</label>
                                  <div className="relative">
                                      <input type="text" maxLength={13} value={regCitizenId} onChange={e => setRegCitizenId(e.target.value.replace(/[^0-9]/g, ''))} className="w-full p-3 pl-10 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white outline-none transition font-medium" placeholder="เลข 13 หลัก" />
                                      <CreditCard className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                  </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-xs font-bold text-slate-600 mb-1 ml-1">ชื่อ</label>
                                      <input type="text" value={regName} onChange={e => setRegName(e.target.value)} className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition font-medium" placeholder="สมชาย" />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-600 mb-1 ml-1">นามสกุล</label>
                                      <input type="text" value={regSurname} onChange={e => setRegSurname(e.target.value)} className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition font-medium" placeholder="ใจดี" />
                                  </div>
                              </div>
                              
                              <div className="flex gap-2 mt-6">
                                  <button type="button" onClick={() => setRegStep(1)} className="px-6 py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition">กลับ</button>
                                  <button disabled={regLoading} type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-green-200 transition disabled:opacity-50">
                                      {regLoading ? 'กำลังส่งข้อมูล...' : 'ยืนยันการสมัคร'}
                                  </button>
                              </div>
                          </form>
                      )}
                  </div>
              </div>
          </div>
      )}

      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-200 relative overflow-hidden">
        {/* Header Color Bar */}
        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
        
        <div className="flex justify-between items-center mb-6">
            <button onClick={onBack} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-bold transition-colors">
            <ArrowLeft size={18} /> กลับหน้าหลัก
            </button>
            <button onClick={() => setShowConfig(true)} className="text-slate-400 hover:text-indigo-600 p-2 rounded-full hover:bg-indigo-50 transition" title="ตั้งค่า Database">
                <Settings size={20} />
            </button>
        </div>

        <div className="text-center mb-8">
          <div className="bg-indigo-50 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-4 text-indigo-600 shadow-inner rotate-3">
            <GraduationCap size={48} />
          </div>
          <h2 className="text-3xl font-black text-slate-800">เข้าสู่ระบบคุณครู</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">จัดการการเรียนการสอนและนักเรียน</p>
        </div>

        {/* Status Indicator */}
        <div className={`mb-6 p-3 rounded-xl flex items-start gap-3 border ${isConfigured ? 'bg-green-50 border-green-200 text-green-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
            {isConfigured ? <Database size={18} className="mt-0.5 text-green-600"/> : <Info size={18} className="mt-0.5 text-slate-400"/>}
            <div className="text-xs">
                {isConfigured ? (
                    <span><b>ระบบพร้อมใช้งาน</b> เชื่อมต่อฐานข้อมูลเรียบร้อยแล้ว</span>
                ) : (
                    <span>
                        <b>ยังไม่เชื่อมต่อ Database:</b><br/>
                        กรุณากดปุ่ม <Settings size={10} className="inline"/> ด้านบนเพื่อตั้งค่าการเชื่อมต่อ
                    </span>
                )}
            </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 ml-1 uppercase tracking-wider">Username</label>
            <div className="relative">
                <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-4 pl-12 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 bg-slate-50 focus:bg-white outline-none transition font-bold text-slate-700"
                placeholder="ชื่อผู้ใช้ / รหัสประชาชน"
                required
                />
                <User className="absolute left-4 top-4.5 text-slate-400" size={20} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 ml-1 uppercase tracking-wider">Password</label>
            <div className="relative">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 pl-12 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 bg-slate-50 focus:bg-white outline-none transition font-bold text-slate-700"
                placeholder="รหัสผ่าน"
                required
              />
              <Lock className="absolute left-4 top-4.5 text-slate-400" size={20} />
            </div>
          </div>

          {error && (
             <div className="flex flex-col items-start text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-100 animate-fade-in">
                <div className="flex items-center gap-2 mb-1 font-bold">
                    <AlertCircle size={18} /> เข้าสู่ระบบไม่ได้
                </div>
                <span>{error}</span>
             </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-bold text-lg text-white shadow-lg transition-all transform active:scale-95 
              ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-indigo-200'}
            `}
          >
            {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
           <button onClick={() => setShowRegister(true)} className="text-indigo-600 font-bold text-sm hover:underline hover:text-indigo-800 transition flex items-center justify-center gap-2 mx-auto">
               <UserPlus size={16}/> สมัครสมาชิกใหม่ (สำหรับครู)
           </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherLogin;
