import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Teacher, Assignment, ExamResult, Student, Classroom, Question, AssignmentCategory } from '../../types';
import { 
  BookOpen, Sparkles, BrainCircuit, RefreshCw, BarChart2, CheckCircle, 
  Save, Award, History, Key, Plus, TrendingUp, X, ArrowRight, List, 
  PlusCircle, Calendar, Trash2, Target, Eye, Users, FileText, 
  HelpCircle, Loader2, Copy, Info, ExternalLink, KeyRound, Settings, Clock,
  ChevronRight, Database, Send, Search, CheckSquare, Square, Gavel
} from 'lucide-react';
import { generateQuestionWithAI, GeneratedQuestion } from '../../services/aiService';
import { addAssignment, addQuestion, getClassrooms, deleteAssignment, deleteQuestion } from '../../services/api';
import { supabase } from '../../services/supabaseConfig';

interface TpatTgatManagerProps {
  teacher: Teacher;
  assignments: Assignment[];
  stats: ExamResult[];
  students: Student[];
  onRefresh: () => void;
  hasApiKey: boolean;
  onSelectApiKey: () => Promise<void>;
}

const CATEGORIES = [
    { id: 'PART_A', label: 'ภาค ก (ความรู้ทั่วไป)', color: 'indigo', items: [
        { id: 'PA_ANALYSIS', name: 'การคิดวิเคราะห์' },
        { id: 'PA_ENGLISH', name: 'ภาษาอังกฤษ' },
        { id: 'PA_GOV', name: 'ข้าราชการที่ดี' }
    ]},
    { id: 'PART_B', label: 'ภาค ข (มาตรฐานวิชาชีพ)', color: 'slate', items: [
        { id: 'PB_LAW', name: 'กฎหมายการศึกษา' },
        { id: 'PB_PEDAGOGY', name: 'จิตวิทยาและการสอน' },
        { id: 'PB_MEASURE', name: 'การวัดประเมินผล' }
    ]},
    { id: 'MAJOR', label: 'วิชาเอก (Major)', color: 'amber', items: [
        { id: 'MAJOR_THAI', name: 'วิชาเอกภาษาไทย' },
        { id: 'MAJOR_MATH', name: 'วิชาเอกคณิตศาสตร์' },
        { id: 'MAJOR_EDU', name: 'วิชาเอกปฐมวัย' }
    ]}
];

const TpatTgatManager: React.FC<TpatTgatManagerProps> = ({ 
    teacher, assignments: initialAssignments, stats: initialStats, students, onRefresh, hasApiKey, onSelectApiKey
}) => {
  const [activeTab, setActiveTab] = useState<'BANK' | 'MISSIONS'>('BANK');
  const [selectedSubId, setSelectedSubId] = useState<string>('PA_ANALYSIS');
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [loadingBank, setLoadingBank] = useState(false);
  const [selectedForMission, setSelectedForMission] = useState<string[]>([]);
  const [isCreatingMission, setIsCreatingMission] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [tempGenerated, setTempGenerated] = useState<GeneratedQuestion[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [missionTitle, setMissionTitle] = useState('');
  const [missionDeadline, setMissionDeadline] = useState('');
  const [selectedMissionForModal, setSelectedMissionForModal] = useState<Assignment | null>(null);

  useEffect(() => { loadBank(); }, [selectedSubId]);

  const loadBank = async () => {
    setLoadingBank(true);
    try {
        const { data } = await supabase.from('questions').select('*').eq('school', teacher.school).eq('subject', selectedSubId);
        const mapped = (data || []).map((q: any) => ({
            ...q,
            choices: typeof q.choices === 'string' ? JSON.parse(q.choices) : q.choices,
            correctChoiceId: String(q.correct_choice_id)
        }));
        setBankQuestions(mapped);
    } catch (e) { console.error(e); }
    setLoadingBank(false);
  };

  const handleAiGenToBank = async () => {
      if (!aiTopic) return alert("กรุณาระบุหัวข้อเรื่อง");
      setIsGenerating(true);
      try {
          // Fix: Argument of type '"normal"' is not assignable to parameter of type '"search_old" | "generate"'.
          const generated = await generateQuestionWithAI(selectedSubId, 'PROFESSIONAL', aiTopic, 5, 'generate');
          if (generated) setTempGenerated(prev => [...prev, ...generated]);
      } catch (e: any) { alert(e.message); }
      setIsGenerating(false);
  };

  const saveTempToBank = async () => {
      setIsSaving(true);
      try {
          for (const q of tempGenerated) {
              await addQuestion({
                  subject: selectedSubId, grade: 'PROFESSIONAL', text: q.text,
                  c1: q.c1, c2: q.c2, c3: q.c3, c4: q.c4,
                  correct: q.correct, explanation: q.explanation,
                  school: teacher.school, teacherId: String(teacher.id)
              });
          }
          setTempGenerated([]); setShowAddModal(false); loadBank();
      } catch (e) { alert("เกิดข้อผิดพลาด"); }
      setIsSaving(false);
  };

  const handleCreateMissionFromBank = async () => {
      if (selectedForMission.length === 0) return alert("เลือกโจทย์ก่อนครับ");
      if (!missionTitle || !missionDeadline) return alert("ข้อมูลไม่ครบ");
      setIsSaving(true);
      const cat = selectedSubId.startsWith('PA') ? 'PART_A' : selectedSubId.startsWith('PB') ? 'PART_B' : 'MAJOR';
      const res = await addAssignment(teacher.school, selectedSubId, 'PROFESSIONAL', selectedForMission.length, missionDeadline, teacher.name, `[${selectedSubId}] ${missionTitle}`, undefined, undefined, cat as AssignmentCategory);
      if (res.id) {
          const selectedQuestions = bankQuestions.filter(q => selectedForMission.includes(q.id));
          for (const q of selectedQuestions) {
              await addQuestion({
                  subject: q.subject, grade: 'PROFESSIONAL', text: q.text, image: q.image || '',
                  c1: q.choices[0]?.text || '', c2: q.choices[1]?.text || '', 
                  c3: q.choices[2]?.text || '', c4: q.choices[3]?.text || '', 
                  correct: q.correctChoiceId, explanation: q.explanation,
                  school: teacher.school, teacherId: String(teacher.id), assignmentId: res.id
              });
          }
          setIsCreatingMission(false); setSelectedForMission([]); onRefresh();
      }
      setIsSaving(false);
  };

  return (
    <div className="font-prompt animate-fade-in pb-10">
        <div className="flex bg-slate-900 p-1.5 rounded-[22px] mb-8 w-fit shadow-xl border border-slate-800">
            <button onClick={() => setActiveTab('BANK')} className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 ${activeTab === 'BANK' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}><Database size={16}/> คลังข้อสอบวิชาชีพ</button>
            <button onClick={() => setActiveTab('MISSIONS')} className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 ${activeTab === 'MISSIONS' ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-slate-500'}`}><Send size={16}/> ภารกิจจำลองสอบ</button>
        </div>

        {activeTab === 'BANK' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-3 space-y-6">
                    {CATEGORIES.map(cat => (
                        <div key={cat.id} className="bg-white rounded-[30px] border border-slate-100 shadow-sm overflow-hidden">
                            <div className={`px-5 py-3 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest`}>{cat.label}</div>
                            <div className="p-2 space-y-1">
                                {cat.items.map(sub => (
                                    <button 
                                        key={sub.id} 
                                        onClick={() => { setSelectedSubId(sub.id); setIsCreatingMission(false); }}
                                        className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${selectedSubId === sub.id ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        <span className="truncate pr-2">{sub.name}</span>
                                        <ChevronRight size={12} className={selectedSubId === sub.id ? 'text-white' : 'text-slate-300'}/>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="lg:col-span-9 space-y-6">
                    <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 border-b-8 border-indigo-500">
                        <div className="flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20"><Gavel size={32} className="text-amber-400"/></div>
                            <div>
                                <h4 className="text-2xl font-black">{selectedSubId} Bank</h4>
                                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Professional Certification Question Bank</p>
                            </div>
                        </div>
                        <button onClick={() => setShowAddModal(true)} className="w-full md:w-auto bg-white text-slate-900 px-8 py-3 rounded-2xl font-black text-sm hover:bg-amber-400 transition shadow-lg">เพิ่มโจทย์เข้าคลัง</button>
                    </div>

                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
                        <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
                            <span className="font-black text-slate-700">รายการโจทย์ ({bankQuestions.length})</span>
                            <div className="flex gap-2">
                                {isCreatingMission ? (
                                    <button onClick={handleCreateMissionFromBank} disabled={isSaving} className="bg-amber-500 text-slate-900 px-6 py-2 rounded-xl font-black text-xs shadow-md">บันทึกภารกิจ</button>
                                ) : (
                                    bankQuestions.length > 0 && <button onClick={() => setIsCreatingMission(true)} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-xs">สร้างภารกิจสอบ</button>
                                )}
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            {loadingBank ? <div className="py-20 text-center text-indigo-500 font-black animate-pulse">กำลังโหลด...</div> : 
                             bankQuestions.length === 0 ? <div className="py-20 text-center text-slate-300 italic font-bold">ยังไม่มีโจทย์ในหมวดนี้</div> :
                             bankQuestions.map((q, i) => (
                                <div key={q.id} className={`p-6 rounded-[35px] border-2 transition-all ${selectedForMission.includes(q.id) ? 'border-amber-400 bg-amber-50/50' : 'border-slate-50 bg-slate-50/30'}`}>
                                    <div className="flex gap-4">
                                        {isCreatingMission && <button onClick={() => setSelectedForMission(prev => prev.includes(q.id) ? prev.filter(x=>x!==q.id) : [...prev, q.id])} className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedForMission.includes(q.id) ? 'bg-amber-500 text-white' : 'bg-white border-2 border-slate-200'}`}>{selectedForMission.includes(q.id) ? <CheckSquare size={18}/> : <Square size={18}/>}</button>}
                                        <div className="flex-1">
                                            <div className="font-black text-slate-800 text-lg mb-2">{i+1}. {q.text}</div>
                                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 font-bold uppercase">
                                                {q.choices.map((c, ci) => <div key={ci} className={String(ci+1)===q.correctChoiceId ? 'text-emerald-600 font-black' : ''}>{ci+1}. {c.text}</div>)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                             ))
                            }
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'MISSIONS' && (
            <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm animate-fade-in">
                <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                    <h4 className="font-black text-xl flex items-center gap-3"><History size={26} className="text-amber-400"/> ประวัติภารกิจสอบ</h4>
                    <button onClick={onRefresh} className="p-3 bg-white/10 rounded-2xl text-white"><RefreshCw size={20}/></button>
                </div>
                <div className="p-0">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest border-b">
                            <tr><th className="p-8">หัวข้อภารกิจ</th><th className="p-8 text-center">ภาค</th><th className="p-8 text-right">จัดการ</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {initialAssignments.filter(a => a.category?.startsWith('PART')).reverse().map(a => (
                                <tr key={a.id} className="hover:bg-slate-50">
                                    <td className="p-8"><div className="font-black text-slate-800 text-lg">{a.title}</div><div className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{a.subject} • {a.questionCount} ข้อ</div></td>
                                    <td className="p-8 text-center"><span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-black text-[10px]">{a.category}</span></td>
                                    <td className="p-8 text-right">
                                        <button onClick={() => setSelectedMissionForModal(a)} className="bg-slate-100 text-slate-600 p-3 rounded-2xl hover:bg-slate-900 hover:text-white transition"><Eye size={20}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* Modal: Add to Bank */}
        {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
                <div className="bg-white rounded-[45px] shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
                    <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                        <h3 className="font-black text-xl flex items-center gap-3"><Sparkles size={24} className="text-amber-400"/> AI ช่วยเพิ่มโจทย์เข้าคลัง</h3>
                        <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-full transition"><X/></button>
                    </div>
                    <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                        <div className="bg-indigo-50 p-6 rounded-[35px] border-4 border-dashed border-indigo-200">
                            <label className="block text-xs font-black text-indigo-400 uppercase tracking-widest text-center mb-4">ระบุเนื้อหาที่ต้องการให้ออกข้อสอบ</label>
                            <div className="flex flex-col gap-4">
                                <input type="text" value={aiTopic} onChange={e=>setAiTopic(e.target.value)} className="w-full p-5 rounded-3xl border-2 border-slate-100 font-black text-lg text-center outline-none focus:border-indigo-500 transition" placeholder="เช่น มาตรฐานวิชาชีพครู, จรรยาบรรณ..." />
                                <button onClick={handleAiGenToBank} disabled={isGenerating || !aiTopic} className="w-full bg-indigo-600 text-white py-4 rounded-3xl font-black shadow-lg hover:bg-indigo-700 transition flex items-center justify-center gap-3">
                                    {isGenerating ? <Loader2 className="animate-spin" size={24}/> : <Sparkles size={24}/>} {tempGenerated.length > 0 ? 'สร้างเพิ่มอีก 5 ข้อ' : 'เริ่มสร้างข้อสอบ'}
                                </button>
                            </div>
                        </div>
                        {tempGenerated.length > 0 && (
                            <div className="space-y-4 animate-slide-up">
                                {tempGenerated.map((q, i) => (
                                    <div key={i} className="p-5 bg-white border-2 border-slate-100 rounded-3xl relative group">
                                        <button onClick={()=>setTempGenerated(prev=>prev.filter((_,x)=>x!==i))} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition"><Trash2 size={18}/></button>
                                        <div className="font-black text-slate-800 mb-2">{i+1}. {q.text}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase grid grid-cols-2 gap-2">
                                            <span className={q.correct==='1'?'text-emerald-600':''}>1. {q.c1}</span><span className={q.correct==='2'?'text-emerald-600':''}>2. {q.c2}</span>
                                            <span className={q.correct==='3'?'text-emerald-600':''}>3. {q.c3}</span><span className={q.correct==='4'?'text-emerald-600':''}>4. {q.c4}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {tempGenerated.length > 0 && (
                        <div className="p-8 border-t bg-white">
                            <button onClick={saveTempToBank} disabled={isSaving} className="w-full bg-emerald-600 text-white py-5 rounded-[30px] font-black text-xl shadow-xl hover:bg-emerald-700 transition active:scale-95 border-b-8 border-emerald-800">ยืนยันบันทึกทั้ง {tempGenerated.length} ข้อ</button>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default TpatTgatManager;