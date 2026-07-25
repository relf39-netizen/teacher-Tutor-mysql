import React, { useState, useEffect, useMemo } from 'react';
import { Question, Teacher, SubjectConfig } from '../../types';
import { 
  Trash2, Loader2, RefreshCw, Sparkles, Search, BookOpen, 
  FileSearch, Sparkle, ArrowLeft, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight,
  MousePointer2, ClipboardList, BookMarked, Zap, Database, Stars, Target, Info, Save, 
  GraduationCap, CheckCircle, Settings, ScanSearch, ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { addQuestion, deleteQuestion, getQuestionsBySubjectAndGrade } from '../../services/api';
import { generateQuestionWithAI, GeneratedQuestion } from '../../services/aiService';

interface MajorBankProps {
  teacher: Teacher;
  subjects: SubjectConfig[];
}

const MajorBank: React.FC<MajorBankProps> = ({ teacher, subjects }) => {
  const majorSubjects = useMemo(() => {
    return subjects.filter(s => s.grade === 'MAJOR' || s.grade === 'วิชาเอก');
  }, [subjects]);

  const [view, setView] = useState<'LIST' | 'CREATE_AI'>('LIST');
  const [selectedSubject, setSelectedSubject] = useState<SubjectConfig | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Duplication State
  const [duplicateIds, setDuplicateIds] = useState<Set<string>>(new Set());

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // ✅ อัปเดตเป็น 10 ข้อต่อหน้า

  // AI States
  const [aiMode, setAiMode] = useState<'search_old' | 'generate'>('search_old');
  const [aiResults, setAiResults] = useState<GeneratedQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (majorSubjects.length > 0 && !selectedSubject) {
        setSelectedSubject(majorSubjects[0]);
    }
  }, [majorSubjects]);

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
    try {
      const data = await getQuestionsBySubjectAndGrade(selectedSubject.name, 'MAJOR', teacher.school, selectedSubject.id);
      setQuestions(data || []);
    } catch (error) {
      console.error('Error loading questions:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อสอบ');
    } finally {
      setLoading(false);
    }
  };

  const normalizeText = (text: string) => {
      return text.replace(/[^\u0E00-\u0E7Fa-zA-Z0-9]/g, '').toLowerCase().trim();
  };

  const handleCheckDuplicates = () => {
      const seen = new Map<string, string>();
      const dups = new Set<string>();
      questions.forEach(q => {
          const norm = normalizeText(q.text);
          if (seen.has(norm)) dups.add(q.id);
          else seen.set(norm, q.id);
      });
      setDuplicateIds(dups);
      if (dups.size > 0) alert(`⚠️ พบโจทย์ที่น่าจะซ้ำกัน ${dups.size} ข้อ`);
      else alert("✅ ไม่พบโจทย์ซ้ำในวิชาเอกนี้");
  };

  const handleAiAction = async () => {
    if (!selectedSubject) return;
    setIsGenerating(true);
    try {
        const existingTexts = questions.map(q => q.text);
        const data = await generateQuestionWithAI(
          selectedSubject.fullName || selectedSubject.name, 
          'วิชาเอก', 
          `เจาะลึกข้อสอบจริงหัวข้อ: ${selectedSubject.fullName}`, 
          5, 
          aiMode,
          existingTexts // ส่งโจทย์เดิมป้องกัน AI ออกซ้ำ
        );
        if (data) setAiResults(prev => [...prev, ...data]);
    } catch (e: any) { alert(e.message); }
    setIsGenerating(false);
  };

  const saveAiToBank = async () => {
    if (!selectedSubject || aiResults.length === 0) return;
    setIsSaving(true);
    try {
        let successCount = 0;
        let failCount = 0;
        
        for (const q of aiResults) {
            const res = await addQuestion({
                subject: selectedSubject.name,
                grade: 'MAJOR', 
                text: q.text,
                c1: q.c1, c2: q.c2, c3: q.c3, c4: q.c4, 
                correct: q.correct, 
                explanation: q.explanation, 
                school: teacher.school, 
                teacherId: String(teacher.id),
                subjectId: selectedSubject.id
            });
            if (res.success) successCount++;
            else failCount++;
        }
        
        if (successCount > 0) {
            alert(`✅ บันทึกข้อสอบสำเร็จ ${successCount} ข้อ ${failCount > 0 ? `(ล้มเหลว ${failCount} ข้อ)` : ''}`);
            setAiResults([]); 
            setView('LIST'); 
            loadQuestions();
        } else {
            alert("❌ บันทึกข้อสอบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
        }
    } catch (err) {
        console.error('Save error:', err);
        alert("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
        setIsSaving(false);
    }
  };

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => q.text.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [questions, searchTerm]);

  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const pagedQuestions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredQuestions.slice(start, start + itemsPerPage);
  }, [filteredQuestions, currentPage]);

  if (majorSubjects.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center py-40 text-center animate-fade-in">
              <div className="bg-slate-100 p-8 rounded-[40px] mb-6">
                  <Settings size={60} className="text-slate-300 animate-spin-slow"/>
              </div>
              <h3 className="text-xl font-black text-slate-800">ไม่พบรายวิชาเอก</h3>
              <p className="text-slate-400 font-bold mt-2 text-sm max-w-md">กรุณาเพิ่มรายวิชาเอกในเมนู "ตั้งค่ารายวิชา" ก่อนครับ</p>
          </div>
      );
  }

  if (view === 'LIST') {
    return (
      <div className="animate-fade-in font-prompt">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 xl:col-span-3">
                <div className="bg-slate-900 rounded-[25px] border border-slate-800 shadow-xl overflow-hidden flex flex-col max-h-[700px]">
                    <div className="p-4 bg-slate-800/50 border-b border-slate-700 flex items-center gap-2">
                        <BookMarked size={16} className="text-amber-400"/>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">วิชาเอกที่คุณสร้าง</span>
                    </div>
                    <div className="overflow-y-auto custom-scrollbar p-2">
                        {majorSubjects.map(sub => (
                            <button 
                                key={sub.id} 
                                onClick={() => setSelectedSubject(sub)} 
                                className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black border-b border-slate-800/30 transition-all flex items-center justify-between group mb-1 ${selectedSubject?.id === sub.id ? 'bg-amber-500 text-slate-900 shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}
                            >
                                <span className="truncate pr-2">{sub.name}</span>
                                <ChevronRight size={12} className={selectedSubject?.id === sub.id ? 'text-slate-900' : 'text-slate-700'}/>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-8 xl:col-span-9 space-y-4">
                <div className="bg-white p-5 rounded-[30px] shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-slate-900 shadow-inner"><GraduationCap size={24}/></div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-black text-slate-800 leading-tight truncate">{selectedSubject?.name || 'เลือกวิชา'}</h3>
                                <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-black">รวม {questions.length} ข้อ</span>
                            </div>
                            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-0.5 truncate">{selectedSubject?.fullName}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleCheckDuplicates} disabled={loading || questions.length < 2} className="bg-amber-50 text-amber-600 px-4 py-3 rounded-xl font-black text-[11px] flex items-center justify-center gap-2 hover:bg-amber-100 transition active:scale-95 disabled:opacity-30">
                            <ScanSearch size={14}/> เช็คโจทย์ซ้ำ
                        </button>
                        <button onClick={() => setView('CREATE_AI')} className="bg-slate-900 text-amber-400 px-6 py-3 rounded-xl font-black text-[11px] flex items-center justify-center gap-2 hover:bg-slate-800 transition shadow-xl active:scale-95 shrink-0"><Sparkles size={14}/> AI เจาะลึกวิชาเอก</button>
                    </div>
                </div>

                <div className="relative">
                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="ค้นหาโจทย์..." className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-slate-100 focus:border-amber-400 outline-none transition font-bold text-xs bg-white shadow-sm" />
                    <Search className="absolute left-3.5 top-3 text-slate-300" size={16}/>
                </div>

                <div className="bg-white rounded-[35px] border border-slate-100 overflow-hidden shadow-sm min-h-[450px] flex flex-col">
                    <div className="flex-1 divide-y divide-slate-50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 text-amber-600 animate-pulse"><Loader2 className="animate-spin mb-4" size={40}/><p className="font-black text-sm italic">กำลังเข้าถึงฐานข้อมูล...</p></div>
                    ) : pagedQuestions.length === 0 ? (
                        <div className="py-32 text-center text-slate-300 italic font-bold flex flex-col items-center"><FileSearch size={60} className="mb-4 opacity-10"/><p className="text-lg font-black text-slate-400">ไม่พบข้อสอบ</p></div>
                    ) : (
                        pagedQuestions.map((q, idx) => (
                            <div key={q.id} className={`p-5 transition-colors group ${duplicateIds.has(q.id) ? 'bg-amber-50/50' : 'hover:bg-slate-50/20'}`}>
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="font-black text-slate-800 text-sm leading-snug mb-4 flex items-start gap-3">
                                            <div className="flex flex-col items-center gap-1 shrink-0">
                                                <span className="bg-amber-500 text-slate-900 w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shadow-md">{(currentPage-1)*itemsPerPage + idx + 1}</span>
                                                {duplicateIds.has(q.id) && <ShieldAlert size={14} className="text-amber-500"/>}
                                            </div>
                                            <span className={`pt-1 ${duplicateIds.has(q.id) ? 'text-amber-700' : ''}`}>
                                                {q.text}
                                                {duplicateIds.has(q.id) && <span className="ml-2 text-[8px] bg-amber-500 text-white px-1 py-0.5 rounded font-black uppercase">Duplicate Found</span>}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-10">
                                            {q.choices.map((c, ci) => (
                                                <div key={ci} className={`p-2.5 rounded-lg border-2 text-[11px] font-bold transition-all ${String(ci+1) === q.correctChoiceId ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-white border-slate-50 text-slate-400'}`}>
                                                    <span className="mr-2 opacity-30">{String.fromCharCode(65+ci)}.</span> {c.text}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <button onClick={() => {if(confirm('ลบข้อสอบวิชานี้?')) deleteQuestion(q.id).then(loadQuestions)}} className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))
                    )}
                    </div>

                    {/* Pagination Bar */}
                    {totalPages > 1 && (
                        <div className="p-4 bg-slate-50 border-t flex justify-center items-center gap-2">
                            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-amber-600 disabled:opacity-30 transition-all"><ChevronsLeft size={16}/></button>
                            <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-amber-600 disabled:opacity-30 transition-all"><ChevronLeft size={16}/></button>
                            
                            <div className="px-4 py-1.5 rounded-lg bg-white border border-slate-200 text-[11px] font-black text-slate-600">
                                หน้า {currentPage} / {totalPages}
                            </div>

                            <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-amber-600 disabled:opacity-30 transition-all"><ChevronRight size={16}/></button>
                            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-amber-600 disabled:opacity-30 transition-all"><ChevronsRight size={16}/></button>
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
                  <button onClick={() => { setView('LIST'); setAiResults([]); }} className="flex items-center gap-2 text-slate-400 hover:text-amber-600 font-black text-xs uppercase tracking-widest transition-all"><ArrowLeft size={16}/> กลับคลังวิชาเอก</button>
                  <div className="bg-amber-50 text-amber-600 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100 animate-pulse">AI Specialist Engine</div>
              </div>

              <div className="bg-white rounded-[35px] shadow-2xl overflow-hidden mb-8 border border-slate-100">
                  <div className="p-8 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-5"><Target size={120}/></div>
                      <div className="flex items-center gap-6 relative z-10">
                          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3"><Sparkles size={32} className="text-slate-900"/></div>
                          <div>
                              <h3 className="text-xl font-black tracking-tight">AI Specialist: {selectedSubject?.name}</h3>
                              <p className="text-amber-400 font-bold text-[10px] uppercase tracking-widest mt-0.5 italic">วิเคราะห์จากชื่อเต็ม: {selectedSubject?.fullName}</p>
                          </div>
                      </div>
                      
                      <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 relative z-10">
                          <button onClick={() => setAiMode('search_old')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${aiMode === 'search_old' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}>ข้อสอบเก่า</button>
                          <button onClick={() => setAiMode('generate')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${aiMode === 'generate' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>สร้างแนวใหม่</button>
                      </div>
                  </div>

                  <div className="p-8 space-y-8">
                      <div className="bg-amber-50/30 p-6 rounded-[30px] border-2 border-amber-100 flex items-center gap-4">
                          <div className="p-3 bg-white rounded-2xl text-amber-600 shadow-sm"><ShieldCheck size={24}/></div>
                          <div>
                              <h5 className="font-black text-amber-900 text-sm">อัจฉริยะป้องกันเนื้อหาซ้ำ</h5>
                              <p className="text-[10px] text-amber-500 font-bold leading-tight">ระบบจะอ่านโจทย์ทั้ง {questions.length} ข้อที่มีอยู่ เพื่อหาเนื้อหาใหม่ที่ยังไม่เคยออกสอบครับ</p>
                          </div>
                      </div>

                      <div className="bg-amber-50/30 p-8 rounded-[30px] border-2 border-dashed border-amber-200 text-center relative group">
                          <h4 className="text-lg font-black text-slate-800 mb-2">เริ่มวิเคราะห์วิชา {selectedSubject?.name}</h4>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-6">AI จะใช้ชื่อเต็มเพื่อความแม่นยำ 100%</p>

                          <button onClick={handleAiAction} disabled={isGenerating} className="w-full max-w-xs mx-auto bg-slate-900 text-amber-400 py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-slate-800 transition active:scale-95 border-b-4 border-indigo-700 flex items-center justify-center gap-3">
                              {isGenerating ? <Loader2 className="animate-spin" size={24}/> : <Sparkle size={24} fill="currentColor"/>}
                              {isGenerating ? 'กำลังวิเคราะห์...' : `ดึงข้อสอบใหม่ 5 ข้อ`}
                          </button>
                      </div>

                      {aiResults.length > 0 && (
                          <div className="space-y-6 animate-slide-up">
                              <h4 className="font-black text-slate-800 text-lg flex items-center gap-2 px-2"><ClipboardList className="text-indigo-600" size={24}/> ตรวจสอบข้อมูล</h4>
                              <div className="grid gap-4">
                                  {aiResults.map((q, i) => (
                                      <div key={i} className="p-6 bg-white border-2 border-slate-100 rounded-3xl relative group hover:border-amber-400 transition-all shadow-sm">
                                          <button onClick={() => setAiResults(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition"><Trash2 size={18}/></button>
                                          <div className="bg-slate-900 text-amber-400 w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs mb-4 shadow-md">{i+1}</div>
                                          <p className="font-black text-slate-800 text-base mb-6 leading-tight">{q.text}</p>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                                              {[q.c1, q.c2, q.c3, q.c4].map((choice, ci) => (
                                                  <div key={ci} className={`p-3 rounded-xl font-bold text-xs border-2 transition-all ${String(ci+1) === q.correct ? 'bg-indigo-600 border-indigo-700 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                                      <span className="mr-2 opacity-30">{ci+1}.</span> {choice}
                                                  </div>
                                              ))}
                                          </div>
                                          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-start gap-3">
                                              <Info size={18} className="shrink-0 text-emerald-500 mt-0.5"/>
                                              <div className="text-emerald-800 font-bold text-[11px] leading-relaxed italic">{q.explanation}</div>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                              <div className="pt-6">
                                  <button onClick={saveAiToBank} disabled={isSaving} className="w-full bg-emerald-600 text-white py-5 rounded-[25px] font-black text-xl shadow-xl hover:bg-emerald-700 transition active:scale-95 border-b-8 border-emerald-950 flex items-center justify-center gap-3">
                                      {isSaving ? <Loader2 className="animate-spin" size={24}/> : <Save size={24}/>}
                                      บันทึกเข้าคลังวิชาเอกทั้งหมด
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
  }

  return null;
};

export default MajorBank;