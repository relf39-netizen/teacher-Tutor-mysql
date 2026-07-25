
import React, { useState, useEffect } from 'react';
import { SubjectConfig, Teacher } from '../../types';
import { 
    List, PlusCircle, Book, RefreshCw, Edit, Save, X, Gavel, 
    Zap, Loader2, ShieldCheck, Lightbulb, 
    BookMarked, BrainCircuit, Landmark, Scale, ScrollText,
    Settings, Trash2, ArrowRight
} from 'lucide-react';
import { addSubject, deleteSubject, updateSubject } from '../../services/api';

interface SubjectManagerProps {
  subjects: SubjectConfig[];
  teacher: Teacher;
  canManageAll: boolean;
  myGrades: string[];
  onRefresh: () => void;
}

const CAT_LABELS: Record<string, { label: string, sub: string, color: string, icon: any }> = { 
    'PART_A': { label: 'ภาค ก', sub: 'ทั่วไป', color: 'emerald', icon: BrainCircuit },
    'PART_B_PROFESSIONAL': { label: 'ภาค ข', sub: 'วิชาชีพ', color: 'indigo', icon: ShieldCheck },
    'PART_B_LAWS': { label: 'ภาค ข', sub: 'กฎหมาย', color: 'rose', icon: Gavel },
    'MAJOR': { label: 'วิชาเอก', sub: 'Major', color: 'amber', icon: BookMarked },
    'GENERAL_LAW': { label: 'กฎหมาย', sub: 'ขรก. ทั่วไป', color: 'orange', icon: Landmark },
    'GENERAL_REGULATION': { label: 'ระเบียบ', sub: 'ขรก. ทั่วไป', color: 'blue', icon: ScrollText }
};

const SubjectManager: React.FC<SubjectManagerProps> = ({ subjects, teacher, onRefresh }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [shortName, setShortName] = useState('');
  const [fullName, setFullName] = useState('');
  const [category, setCategory] = useState('PART_A');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleEdit = (sub: SubjectConfig) => {
      setEditingId(sub.id);
      setShortName(sub.name);
      setFullName(sub.fullName || sub.name);
      setCategory(sub.grade);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
      if (!shortName || !fullName) return alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      setIsProcessing(true);
      
      const subData: any = { 
          name: shortName, 
          fullName: fullName,
          school: teacher.school, 
          teacherId: String(teacher.id), 
          grade: category, 
          icon: (category === 'PART_B_LAWS' || category === 'GENERAL_LAW') ? 'Gavel' : 
                category === 'PART_B_PROFESSIONAL' ? 'ShieldCheck' : 
                category === 'GENERAL_REGULATION' ? 'ScrollText' : 'Book',
          color: CAT_LABELS[category].color
      };
      
      let success = false;
      if (editingId) {
          subData.id = editingId;
          const res = await updateSubject(subData);
          success = res.success;
      } else {
          const res = await addSubject(teacher.school, subData);
          success = res.success;
      }
      
      setIsProcessing(false);
      if (success) {
          alert('✅ บันทึกสำเร็จ');
          setEditingId(null); setShortName(''); setFullName('');
          onRefresh();
      }
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in font-prompt">
        <div className="mb-8">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-md"><Settings size={24}/></div>
                ตั้งค่ารายวิชาสอบ
            </h3>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* 📝 Mini Form Section */}
            <div className="xl:col-span-4">
                <div className={`bg-white p-6 rounded-3xl border shadow-sm sticky top-5 ${editingId ? 'border-amber-400' : 'border-slate-200'}`}>
                    <h4 className="font-black text-base text-slate-800 mb-6 flex items-center gap-2">
                        {editingId ? <Edit size={18} className="text-amber-500" /> : <PlusCircle size={18} className="text-indigo-600" />}
                        {editingId ? 'แก้ไขข้อมูลวิชา' : 'เพิ่มวิชาใหม่'}
                    </h4>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">ประเภทส่วนงาน</label>
                            <div className="grid grid-cols-2 gap-1.5">
                                {Object.entries(CAT_LABELS).map(([key, info]) => (
                                    <button key={key} onClick={() => setCategory(key)} className={`p-2.5 rounded-xl text-left border transition-all flex items-center gap-2 ${category === key ? `bg-${info.color}-600 text-white border-transparent shadow-sm` : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}>
                                        <div>
                                            <div className="text-[10px] font-black leading-none">{info.label}</div>
                                            <div className={`text-[8px] font-bold ${category === key ? 'text-white/70' : 'text-slate-400'}`}>{info.sub}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 tracking-widest ml-1">ชื่อเต็ม (สำหรับ AI ค้นหา)</label>
                            <textarea value={fullName} onChange={e => setFullName(e.target.value)} rows={2} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-400 outline-none transition font-bold text-xs shadow-inner" placeholder="ระบุชื่อเต็มของระเบียบ/กฎหมาย..."/>
                        </div>

                        <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 tracking-widest ml-1">ชื่อย่อ (แสดงบนแอป)</label>
                            <input type="text" value={shortName} onChange={e => setShortName(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-400 outline-none transition font-bold text-xs shadow-inner" placeholder="เช่น พ.ร.บ. การศึกษาฯ" />
                        </div>

                        <div className="pt-2 flex gap-2">
                            {editingId && <button onClick={() => {setEditingId(null); setShortName(''); setFullName('');}} className="flex-1 py-2.5 bg-slate-100 text-slate-500 rounded-xl font-black text-xs">ยกเลิก</button>}
                            <button onClick={handleSave} disabled={isProcessing} className="flex-[2] py-2.5 bg-slate-900 text-amber-400 rounded-xl font-black text-xs shadow hover:bg-slate-800 transition active:scale-95 flex items-center justify-center gap-2">
                                {isProcessing ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                {editingId ? 'บันทึกแก้ไข' : 'สร้างรายวิชา'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 📇 Compact Cards Section */}
            <div className="xl:col-span-8">
                <div className="space-y-8">
                    {Object.entries(CAT_LABELS).map(([catKey, catInfo]) => {
                        const filtered = subjects.filter(s => s.grade === catKey);
                        if (filtered.length === 0) return null;
                        const CategoryIcon = catInfo.icon;
                        return (
                            <div key={catKey} className="animate-slide-up">
                                <div className="flex items-center gap-3 mb-4 px-2">
                                    <div className={`p-2 rounded-lg bg-${catInfo.color}-50 text-${catInfo.color}-600 shadow-inner`}><CategoryIcon size={18}/></div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-800">{catInfo.label}: {catInfo.sub}</h4>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{filtered.length} Subjects</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {filtered.map(sub => (
                                        <div key={sub.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-start justify-between group hover:shadow-md transition-all border-b-4">
                                            <div className="flex gap-4 min-w-0">
                                                <div className={`w-10 h-10 rounded-xl bg-${catInfo.color}-50 text-${catInfo.color}-600 flex items-center justify-center shadow-inner group-hover:bg-${catInfo.color}-600 group-hover:text-white transition-all`}>
                                                    <BookMarked size={18}/>
                                                </div>
                                                <div className="min-w-0">
                                                    <h5 className="font-black text-slate-800 text-sm leading-tight truncate">{sub.name}</h5>
                                                    <p className="text-[9px] text-slate-400 font-bold mt-0.5 line-clamp-1">{sub.fullName}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all ml-2">
                                                <button onClick={() => handleEdit(sub)} className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-500 hover:text-white transition border border-amber-100"><Edit size={14}/></button>
                                                <button onClick={async () => {if(confirm('ลบวิชานี้?')) {await deleteSubject(teacher.school, sub.id); onRefresh();}}} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white transition border border-rose-100"><Trash2 size={14}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                    {subjects.length === 0 && <div className="py-20 text-center text-slate-300 font-bold italic">ยังไม่มีวิชาในฐานข้อมูล</div>}
                </div>
            </div>
        </div>
    </div>
  );
};

export default SubjectManager;
