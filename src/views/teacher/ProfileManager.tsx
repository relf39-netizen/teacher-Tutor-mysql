
import React, { useState, useEffect } from 'react';
import { Teacher } from '../../types';
// Added RefreshCw and Settings to imports
import { User, Lock, Save, CheckCircle, Eye, EyeOff, ClipboardPaste, ExternalLink, Sparkles, KeyRound, RefreshCw, Settings } from 'lucide-react';
import { manageTeacher } from '../../services/api';

declare const window: any;

interface ProfileManagerProps {
  teacher: Teacher;
  onUpdate: () => void;
}

const POSITIONS = [
    'ครูอัตราจ้าง', 'พนักงานราชการ', 'ครูผู้ช่วย', 'ตำแหน่งครู', 
    'ครูชำนามาการ', 'ครูชำนาญการพิเศษ', 'ครูเชี่ยวชาญ', 'ครูเชี่ยวชาญพิเศษ', 
    'รองผู้อำนวยการ', 'ผู้อำนวยการโรงเรียน'
];

const ProfileManager: React.FC<ProfileManagerProps> = ({ teacher, onUpdate }) => {
  const [name, setName] = useState(teacher.name);
  const [password, setPassword] = useState('');
  const [position, setPosition] = useState(teacher.position || 'ตำแหน่งครู');
  
  // API Key State
  const [hasSelectedKey, setHasSelectedKey] = useState(false);
  const [manualApiKey, setManualApiKey] = useState(localStorage.getItem('MST_CUSTOM_GEMINI_KEY') || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isKeySaved, setIsKeySaved] = useState(!!localStorage.getItem('MST_CUSTOM_GEMINI_KEY'));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
      checkKeyStatus();
  }, []);

  const checkKeyStatus = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
          const selected = await window.aistudio.hasSelectedApiKey();
          setHasSelectedKey(selected);
      }
  };

  const handleSelectKey = async () => {
      if (window.aistudio?.openSelectKey) {
          await window.aistudio.openSelectKey();
          setHasSelectedKey(true);
      }
  };

  const handleSaveManualKey = () => {
      if (manualApiKey.trim()) {
          localStorage.setItem('MST_CUSTOM_GEMINI_KEY', manualApiKey.trim());
          setIsKeySaved(true);
          alert("✅ บันทึก API Key ส่วนตัวเรียบร้อยแล้ว");
      } else {
          localStorage.removeItem('MST_CUSTOM_GEMINI_KEY');
          setIsKeySaved(false);
          alert("🗑️ ลบคีย์ส่วนตัวออกแล้ว");
      }
  };

  const handleSave = async () => {
      if (!name) return alert("กรุณาระบุชื่อ");
      setIsSaving(true);
      
      const payload: any = {
          id: teacher.id,
          name: name,
          position: position
      };
      
      if (password) payload.password = password;

      const result = await manageTeacher('edit', payload);
      setIsSaving(false);
      
      if (result.success) {
          alert("✅ บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว");
          setPassword('');
          onUpdate();
      } else {
          alert(`เกิดข้อผิดพลาด: ${result.message}`);
      }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in font-prompt px-2">
        <div className="mb-8">
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <User className="text-indigo-600" size={28}/> ข้อมูลของฉัน
            </h3>
            <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-wider">Profile & AI Configuration</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 👤 ส่วนที่ 1: ข้อมูลโปรไฟล์ */}
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl border border-indigo-100 shadow-inner">
                        🧑‍🏫
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-black text-slate-800 text-lg truncate">{teacher.name}</h4>
                        <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 uppercase">{teacher.school}</span>
                    </div>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">ชื่อ-นามสกุล</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-indigo-400 outline-none transition font-bold text-slate-700 bg-slate-50 shadow-inner" />
                    </div>
                    <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">ตำแหน่งปฏิบัติงาน</label>
                        <select value={position} onChange={e => setPosition(e.target.value)} className="w-full p-4 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-indigo-400 outline-none font-bold text-slate-700 bg-slate-50 shadow-inner">
                            {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">เปลี่ยนรหัสผ่าน (ว่างไว้ถ้าไม่เปลี่ยน)</label>
                        <div className="relative">
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 pl-12 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-indigo-400 outline-none transition font-mono text-slate-700 bg-slate-50 shadow-inner" placeholder="••••••••" />
                            <Lock className="absolute left-4 top-4 text-slate-300" size={20}/>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving} 
                        className="w-full mt-4 bg-slate-900 text-white py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-3 border-b-4 border-indigo-700 active:scale-95"
                    >
                        {/* Fix: Added RefreshCw component which was previously missing its import */}
                        {isSaving ? <RefreshCw className="animate-spin" size={20}/> : <Save size={20}/>}
                        บันทึกข้อมูลส่วนตัว
                    </button>
                </div>
            </div>

            {/* 🤖 ส่วนที่ 2: AI Key Configuration */}
            <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden border-b-[12px] border-indigo-600">
                <div className="absolute top-0 right-0 p-8 opacity-5"><Sparkles size={150}/></div>
                
                <div className="relative z-10">
                    <h5 className="font-black text-xl mb-6 flex items-center gap-3">
                        <Sparkles size={24} className="text-amber-400"/> Gemini AI Key
                    </h5>
                    
                    <div className="bg-white/5 p-5 rounded-3xl border border-white/10 mb-8">
                        <p className="text-xs text-indigo-200 mb-4 leading-relaxed font-bold">
                            จำเป็นต้องใช้ API Key เพื่อให้ระบบ AI ช่วยวิเคราะห์ข้อสอบเก่าและออกโจทย์ใหม่ให้โดยอัตโนมัติ
                        </p>
                        <a 
                            href="https://aistudio.google.com/app/apikey" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-black text-xs underline transition-all"
                        >
                            <ExternalLink size={14}/> คลิกคัดลอก Key จาก Google AI Studio
                        </a>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-indigo-400 uppercase mb-2 tracking-widest">Personal API Key</label>
                            <div className="relative">
                                <input 
                                    type={showApiKey ? "text" : "password"}
                                    value={manualApiKey}
                                    onChange={e => setManualApiKey(e.target.value)}
                                    className="w-full p-4 pr-12 rounded-2xl bg-white/5 border border-white/10 focus:border-amber-400 outline-none transition font-mono text-sm shadow-inner"
                                    placeholder="Paste your key here..."
                                />
                                <button 
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="absolute right-4 top-4 text-slate-500 hover:text-white transition"
                                >
                                    {showApiKey ? <EyeOff size={20}/> : <Eye size={20}/>}
                                </button>
                            </div>
                        </div>
                        
                        <button 
                            onClick={handleSaveManualKey}
                            className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl ${isKeySaved ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-slate-900'}`}
                        >
                            {isKeySaved ? <><CheckCircle size={24}/> บันทึกคีย์แล้ว</> : <><ClipboardPaste size={24}/> บันทึกและเปิดใช้งาน AI</>}
                        </button>

                        <div className="h-px bg-white/10 my-4"></div>

                        <button 
                            onClick={handleSelectKey}
                            className="w-full py-3 rounded-2xl border border-white/10 text-xs font-black text-slate-400 hover:bg-white/5 transition flex items-center justify-center gap-2"
                        >
                            <KeyRound size={16}/> หรือใช้คีย์ระบบอัตโนมัติ
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="mt-12 p-8 bg-white rounded-[40px] border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                {/* Fix: Added Settings component which was previously missing its import */}
                <Settings size={28}/>
            </div>
            <div>
                <h5 className="font-black text-slate-800">คำแนะนำการใช้งาน</h5>
                <p className="text-sm text-slate-400 font-bold mt-0.5 leading-relaxed">
                    คุณสามารถแก้ไขชื่อและตำแหน่งเพื่อใช้ในการออกเกียรติบัตรหรือรายงานผลการเรียนของนักเรียนในภายหลังได้ครับ
                </p>
            </div>
        </div>
    </div>
  );
};

export default ProfileManager;
