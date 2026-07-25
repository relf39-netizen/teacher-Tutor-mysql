import React, { useState, useEffect, useMemo } from 'react';
import { Question, Teacher, SubjectConfig } from '../../types';
// Fix: Import icons from lucide-react instead of services/api
import { 
  CheckCircle, Trash2, Loader2, Sparkles, Search, BookOpen, 
  Gavel, BrainCircuit, Lightbulb, FileSearch, Sparkle,
  ArrowLeft, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, 
  ClipboardList, Zap, Database, ShieldCheck, Save, List, Settings, BookMarked,
  AlertTriangle, Copy, ShieldAlert, ScanSearch
} from 'lucide-react';
// Fix: Kept only API functions here
import { deleteQuestion, getQuestionsBySubjectAndGrade, addQuestion, getSubjects } from '../../services/api';
import { generateQuestionWithAI, GeneratedQuestion } from '../../services/aiService';

interface QuestionBankProps {
  teacher: Teacher;
}

const CAT_LABELS: Record<string, { label: string, color: string, icon: any }> = { 
    'PART_A': { label: 'ภาค ก', color: 'emerald', icon: BrainCircuit },
    'PART_B_PROFESSIONAL': { label: 'ภาค ข (วิชาชีพ)', color: 'indigo', icon: ShieldCheck },
    'PART_B_LAWS': { label: 'ภาค ข (กฎหมาย)', color: 'rose', icon: Gavel },
    'MAJOR': { label: 'วิชาเอก', color: 'amber', icon: BookMarked }
};

const QuestionBank: React.FC<QuestionBankProps> = ({ teacher }) => {
  const [view, setView] = useState<'LIST' | 'CREATE_AI'>('LIST');
  const [subjects, setSubjects] = useState<SubjectConfig[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<SubjectConfig | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Duplication Check State
  const [duplicateIds, setDuplicateIds] = useState<Set<string>>(new Set());
  const [isCheckingDup, setIsCheckingDup] = useState(false);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // ✅ อัปเดตเป็น 10 ข้อต่อหน้า

  // AI Generation States
  const [aiMode, setAiMode] = useState<'search_old' | 'generate'>('search_old');
  const [aiResults, setAiResults] = useState<GeneratedQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    setLoading(true);
    const data = await getSubjects(teacher.school);
    setSubjects(data);
    if (data.length > 0) setSelectedSubject(data[0]);
    setLoading(false);
  };

  useEffect(() => {
    if (view === 'LIST' && selectedSubject) {
        loadQuestions();
        setCurrentPage(1);
        setDuplicateIds(new Set());
    }
  }, [selectedSubject, view]);

  const loadQuestions = async () => {
    if (!selectedSubject) return;
    setLoading(true);
    const data = await getQuestionsBySubjectAndGrade(selectedSubject.name, selectedSubject.grade, teacher.school, selectedSubject.id);
    setQuestions(data);
    setLoading(false);
  };

  // ฟังก์ชันล้างข้อความเพื่อเปรียบเทียบความซ้ำ
  const normalizeText = (text: string) => {
      return text.replace(/[^\u0E00-\u0E7Fa-zA-Z0-9]/g, '').toLowerCase().trim();
  };

  const handleCheckDuplicates = () => {
      setIsCheckingDup(true);
      const seen = new Map<string, string>();
      const dups = new Set<string>();

      questions.forEach(q => {
          const norm = normalizeText(q.text);
          if (seen.has(norm)) {
              dups.add(q.id);
              // เพิ่ม ID ของตัวที่ซ้ำกันตัวแรกด้วยถ้าต้องการโชว์คู่
          } else {
              seen.set(norm, q.id);
          }
      });

      setDuplicateIds(dups);
      setIsCheckingDup(false);
      if (dups.size > 0) {
          alert(`⚠️ ระบบตรวจพบโจทย์ที่น่าจะซ้ำกัน ${dups.size} ข้อ (ไฮไลท์สีส้ม)`);
      } else {
          alert("✅ ไม่พบโจทย์ที่ซ้ำกันในคลังวิชานี้");
      }
  };

  const handleAiAction = async () => {
    if (!selectedSubject) return;
    setIsGenerating(true);
    try {
        // ส่งรายชื่อโจทย์ปัจจุบันให้ AI ดูเพื่อป้องกันการออกซ้ำ
        const existingTexts = questions.map(q => q.text);
        
        const data = await generateQuestionWithAI(
          selectedSubject.fullName || selectedSubject.name, 
          CAT_LABELS[selectedSubject.grade]?.label || 'ทั่วไป', 
          `วิเคราะห์เจาะลึก: ${selectedSubject.fullName}`, 
          5, 
          aiMode,
          existingTexts // ส่งข้อมูลป้องกันซ้ำ
        );
        if (data) setAiResults(prev => [...prev, ...data]);
    } catch (e: any) { alert(e.message); }
    setIsGenerating(false);
  };

  const saveAiToBank = async () => {
    if (aiResults.length === 0 || !selectedSubject) return;
    setIsSaving(true);
    try {
        for (const q of aiResults) {
            await addQuestion({
                subject: selectedSubject.name, 
                grade: selectedSubject.grade, 
                text: q.text,
                c1: q.c1, c2: q.c2, c3: q.c3, c4: q.c4, 
                correct: q.correct, 
                explanation: q.explanation, 
                school: teacher.school, 
                teacherId: String(teacher.id),
                subjectId: selectedSubject.id
            });
        }
        setAiResults([]); setView('LIST'); 
        alert("✅ บันทึกข้อสอบเข้าคลังสำเร็จ");
        loadQuestions();
    } catch (err) {
        alert("เกิดข้อผิดพลาดในการบันทึก");
    } finally { setIsSaving(false); }
  };

  const filteredQuestions = useMemo(() => {
      return questions.filter(q => q.text.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [questions, searchTerm]);

  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const pagedQuestions = useMemo(() => {
      const start = (currentPage - 1) * itemsPerPage;
      return filteredQuestions.slice(start, start + itemsPerPage);
  }, [filteredQuestions, currentPage]);

  const categorizedSubjects = useMemo(() => {
      const groups: Record<string, SubjectConfig[]> = {
          'PART_A': [], 'PART_B_PROFESSIONAL': [], 'PART_B_LAWS': [], 'MAJOR': []
      };
      subjects.forEach(s => { 
          const grade = (s.grade === 'วิชาเอก') ? 'MAJOR' : s.grade;
          if (groups[grade]) groups[grade].push(s); 
      });
      return groups;
  }, [subjects]);

  if (view === 'LIST') {
    return (
      <div className="animate-fade-in font-prompt">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 xl:col-span-3 space-y-4">
                <div className="bg-white rounded-[25px] border border-slate-100 shadow-lg overflow-hidden flex flex-col max-h-[750px]">
                    <div className="p-4 bg-slate-900 text-white flex items-center gap-2">
                        <List size={18} className="text-amber-400"/>
                        <span className="text-[11px] font-black uppercase tracking-widest">เลือกวิชาเพื่อดูข้อมูล</span>
                    </div>
                    <div className="overflow-y-auto custom-scrollbar p-2 space-y-3">
                        {Object.entries(CAT_LABELS).map(([catKey, catInfo]) => {
                            const list = categorizedSubjects[catKey];
                            if (list.length === 0) return null;
                            const Icon = catInfo.icon;
                            return (
                                <div key={catKey} className="space-y-1">
                                    <div className="px-3 py-1 flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
                                        <Icon size={10} className={`text-${catInfo.color}-500`}/> {catInfo.label}
                                    </div>
                                    {list.map(sub => (
                                        <button key={sub.id} onClick={()=>setSelectedSubject(sub)} className={`w-full text-left px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-between group ${selectedSubject?.id === sub.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
                                            <span className="truncate pr-2">{sub.name}</span>
                                            <ChevronRight size={12} className={selectedSubject?.id === sub.id ? 'text-white' : 'text-slate-200'}/>
                                        </button>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-8 xl:col-span-9 space-y-4">
                <div className="bg-white p-5 rounded-[30px] shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-inner"><BookOpen size={24}/></div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-black text-slate-800 leading-tight truncate">{selectedSubject?.name || 'กรุณาเลือกวิชา'}</h3>
                                <span className="bg-indigo-100 text-indigo-600 text-[10px] px-2 py-0.5 rounded-full font-black">มีทั้งหมด {questions.length} ข้อ</span>
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">{selectedSubject?.fullName}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleCheckDuplicates} disabled={loading || questions.length < 2} className="bg-amber-100 text-amber-700 px-4 py-3 rounded-xl font-black text-[11px] flex items-center justify-center gap-2 hover:bg-amber-200 transition active:scale-95 disabled:opacity-30">
                            <ScanSearch size={14}/> ตรวจข้อซ้ำ
                        </button>
                        <button onClick={() => setView('CREATE_AI')} disabled={!selectedSubject} className="bg-slate-900 text-amber-400 px-6 py-3 rounded-xl font-black text-[11px] flex items-center justify-center gap-2 hover:bg-slate-800 transition shadow-lg active:scale-95 shrink-0 disabled:opacity-30">
                            <Sparkles size={14}/> AI เจาะจงโจทย์ใหม่
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="ค้นหาโจทย์..." className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-slate-100 focus:border-indigo-400 outline-none transition font-bold text-xs bg-white shadow-sm" />
                    <Search className="absolute left-3.5 top-3 text-slate-300" size={16}/>
                </div>

                <div className="bg-white rounded-[35px] border border-slate-100 overflow-hidden shadow-sm min-h-[450px] flex flex-col">
                    <div className="flex-1 divide-y divide-slate-50">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-32 text-indigo-500 animate-pulse"><Loader2 className="animate-spin mb-4" size={40}/><p className="font-black text-sm italic">กำลังโหลดคลังข้อสอบ...</p></div>
                        ) : pagedQuestions.length === 0 ? (
                            <div className="py-32 text-center text-slate-300 italic font-bold flex flex-col items-center">
                                <FileSearch size={60} className="mb-4 opacity-10"/>
                                <p className="text-lg font-black text-slate-400">ยังไม่มีข้อมูล</p>
                            </div>
                        ) : (
                            pagedQuestions.map((q, idx) => (
                                <div key={q.id} className={`p-5 transition-colors group ${duplicateIds.has(q.id) ? 'bg-amber-50/50' : 'hover:bg-slate-50/50'}`}>
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <div className="font-black text-slate-800 text-sm leading-snug mb-4 flex items-start gap-3">
                                                <div className="flex flex-col items-center gap-1 shrink-0">
                                                    <span className="bg-indigo-600 text-white w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shadow-md">{(currentPage-1)*itemsPerPage + idx + 1}</span>
                                                    {duplicateIds.has(q.id) && <div className="text-amber-500" title="ตรวจพบโจทย์ที่น่าจะซ้ำ"><ShieldAlert size={14}/></div>}
                                                </div>
                                                <span className={`pt-1 ${duplicateIds.has(q.id) ? 'text-amber-700' : ''}`}>
                                                    {q.text}
                                                    {duplicateIds.has(q.id) && <span className="ml-2 text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-black uppercase">Possible Duplicate</span>}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-10">
                                                {q.choices.map((c, ci) => (
                                                    <div key={ci} className={`p-2.5 rounded-lg border-2 text-[11px] font-bold transition-all ${String(ci+1) === q.correctChoiceId ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-50 text-slate-400'}`}>
                                                        <span className="mr-2 opacity-30">{String.fromCharCode(65+ci)}.</span> {c.text}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={() => {if(confirm('ลบข้อสอบข้อนี้?')) deleteQuestion(q.id).then(loadQuestions)}} className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div className="p-4 bg-slate-50 border-t flex justify-center items-center gap-2">
                            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all"><ChevronsLeft size={16}/></button>
                            <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all"><ChevronLeft size={16}/></button>
                            
                            <div className="px-4 py-1.5 rounded-lg bg-white border border-slate-200 text-[11px] font-black text-slate-600">
                                หน้า {currentPage} จาก {totalPages}
                            </div>

                            <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all"><ChevronRight size={16}/></button>
                            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all"><ChevronsRight size={16}/></button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    );
  }

  if (view === 'CREATE_AI') {
      return (
          <div className="animate-slide-up font-prompt max-w-4xl mx-auto pb-20">
              <div className="flex items-center justify-between mb-6">
                  <button onClick={() => { setView('LIST'); setAiResults([]); }} className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-black text-xs uppercase tracking-widest transition-all"><ArrowLeft size={16}/> กลับคลังข้อสอบ</button>
                  <div className="bg-indigo-50 text-indigo-600 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-100 animate-pulse">AI Non-Duplicate Engine</div>
              </div>

              <div className="bg-white rounded-[35px] shadow-2xl overflow-hidden mb-8 border border-slate-100">
                  <div className="p-8 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-5"><Zap size={120}/></div>
                      <div className="flex items-center gap-6 relative z-10">
                          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3"><Sparkles size={32} className="text-slate-900"/></div>
                          <div className="min-w-0">
                              <h3 className="text-xl font-black tracking-tight">AI Specialist Generator</h3>
                              <p className="text-amber-400 font-bold text-[10px] uppercase tracking-widest mt-0.5 italic">วิเคราะห์จากชื่อเต็ม: {selectedSubject?.fullName}</p>
                          </div>
                      </div>
                      
                      <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 relative z-10">
                          <button onClick={() => setAiMode('search_old')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${aiMode === 'search_old' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}>ข้อสอบเก่า</button>
                          <button onClick={() => setAiMode('generate')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${aiMode === 'generate' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>แนวใหม่</button>
                      </div>
                  </div>

                  <div className="p-8 space-y-8">
                      <div className="bg-slate-50 p-6 rounded-[30px] border-2 border-indigo-100 flex items-center gap-4 mb-4">
                          <div className="p-3 bg-white rounded-2xl text-indigo-600 shadow-sm"><ShieldCheck size={24}/></div>
                          <div>
                              <h5 className="font-black text-indigo-900 text-sm">ระบบตรวจสอบความซ้ำอัตโนมัติ</h5>
                              <p className="text-[10px] text-indigo-400 font-bold leading-tight">AI จะตรวจสอบโจทย์ทั้ง {questions.length} ข้อในวิชานี้ เพื่อไม่ให้สร้างซ้ำซ้อนกัน</p>
                          </div>
                      </div>

                      <div className="bg-slate-50 p-8 rounded-[30px] border-2 border-dashed border-slate-200 text-center relative group">
                          <h4 className="text-lg font-black text-slate-800 mb-2">{selectedSubject?.name}</h4>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-6 max-w-lg mx-auto">
                              สแกนเนื้อหาปัจจุบันและผลิตโจทย์ชุดใหม่ที่ไม่ซ้ำเดิม
                          </p>

                          <button onClick={handleAiAction} disabled={isGenerating} className="w-full max-w-xs mx-auto bg-slate-900 text-amber-400 py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-slate-800 transition active:scale-95 border-b-4 border-indigo-700 flex items-center justify-center gap-3">
                              {isGenerating ? <Loader2 className="animate-spin" size={24}/> : <Sparkle size={24} fill="currentColor"/>}
                              {isGenerating ? 'กำลังวิเคราะห์...' : `ผลิตโจทย์ใหม่ 5 ข้อ`}
                          </button>
                      </div>

                      {aiResults.length > 0 && (
                          <div className="space-y-6 animate-slide-up">
                              <h4 className="font-black text-slate-800 text-lg flex items-center gap-2 px-2"><ClipboardList className="text-indigo-600" size={24}/> ตรวจสอบความถูกต้อง</h4>
                              <div className="grid gap-4">
                                  {aiResults.map((q, i) => (
                                      <div key={i} className="p-6 bg-white border-2 border-slate-100 rounded-3xl relative group hover:border-indigo-400 transition-all shadow-sm">
                                          <button onClick={() => setAiResults(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition"><Trash2 size={18}/></button>
                                          <div className="bg-slate-900 text-amber-400 w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs mb-4 shadow-md">{i+1}</div>
                                          <p className="font-black text-slate-800 text-base mb-6 leading-tight">{q.text}</p>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                              {[q.c1, q.c2, q.c3, q.c4].map((choice, ci) => (
                                                  <div key={ci} className={`p-3 rounded-xl font-bold text-xs border-2 ${String(ci+1) === q.correct ? 'bg-indigo-600 border-indigo-700 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                                      <span className="mr-2 opacity-30">{ci+1}.</span> {choice}
                                                  </div>
                                              ))}
                                          </div>
                                          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-start gap-3">
                                              <span className="shrink-0 text-emerald-500 mt-0.5"><CheckCircle size={18}/></span>
                                              <div className="text-emerald-800 font-bold text-[11px] leading-relaxed italic">{q.explanation}</div>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                              <button onClick={saveAiToBank} disabled={isSaving} className="w-full bg-indigo-600 text-white py-5 rounded-[25px] font-black text-xl shadow-xl hover:bg-indigo-700 transition active:scale-95 border-b-8 border-indigo-950 flex items-center justify-center gap-3">
                                  {isSaving ? <Loader2 className="animate-spin" size={24}/> : <Save size={24}/>}
                                  บันทึกข้อสอบเข้าคลังทั้งหมด
                              </button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
  }
  return null;
};

export default QuestionBank;