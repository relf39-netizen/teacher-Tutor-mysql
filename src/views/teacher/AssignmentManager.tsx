
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Assignment, Question, SubjectConfig, Teacher, Student, ExamResult, AssignmentCategory } from '../../types';
import { 
  Calendar, ArrowRight, RefreshCw, BrainCircuit, Save, 
  Trash2, Loader2, CheckCircle, Clock, X, 
  List, PlusCircle, 
  Info, UploadCloud, Download, FileSpreadsheet,
  Search, CheckSquare, Square, Database, Dices, 
  ShieldCheck, ChevronLeft, Award, ChevronRight, Zap,
  CalendarRange, BellRing, FormInput, BookMarked, Layers, Landmark
} from 'lucide-react';
import { addAssignment, addQuestion, fetchAppData } from '../../services/api';

// ประกาศ XLSX สำหรับ TypeScript (ใช้ CDN จาก index.html)
declare const XLSX: any;

interface AssignmentManagerProps {
  assignments: Assignment[];
  subjects: SubjectConfig[];
  students: Student[];
  stats: ExamResult[];
  teacher: Teacher;
  canManageAll: boolean;
  myGrades: string[];
  onRefresh: () => void;
}

const AssignmentManager: React.FC<AssignmentManagerProps> = ({ teacher, subjects, onRefresh }) => {
  // --- Navigation View State ---
  const [view, setView] = useState<'MAIN' | 'BANK_BROWSER'>('MAIN');

  // --- Import Type Selection ---
  const [importTarget, setImportTarget] = useState<'ASSIGNMENT' | 'BANK_ONLY'>('ASSIGNMENT');

  // --- Assignment Setup State ---
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDeadline, setAssignDeadline] = useState('');
  
  // Scheduling States
  const [publishDate, setPublishDate] = useState(''); 
  const [expiryDate, setExpiryDate] = useState('');   

  const [taskQuestions, setTaskQuestions] = useState<any[]>([]); 
  
  // --- Bank Browser View State ---
  const [activePart, setActivePart] = useState<'PART_A' | 'PART_B'>('PART_A');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [loadingBank, setLoadingBank] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [selectedTempIds, setSelectedTempIds] = useState<string[]>([]); 
  const [randomCount, setRandomCount] = useState<number>(5);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showFormGuide, setShowFormGuide] = useState(false);
  
  // State สำหรับการเลือกวิชาก่อนนำเข้า Excel
  const [importSubjectId, setImportSubjectId] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadBank = React.useCallback(async () => {
      setLoadingBank(true);
      const data = await fetchAppData();
      setBankQuestions(data.questions.filter(q => q.school === teacher.school || !q.school));
      setLoadingBank(false);
  }, [teacher.school]);

  useEffect(() => {
      loadBank();
  }, [loadBank]);

  const subjectsInBank = useMemo(() => {
      const partA: { name: string, id?: string }[] = [];
      const partB: { name: string, id?: string }[] = [];
      
      bankQuestions.forEach(q => {
          const qGrade = q.grade?.toUpperCase();
          const qSub = q.subject || '';
          const qSubId = q.subjectId;
          
          const isPartB = (
              qSub.includes('กฎหมาย') || 
              qSub.includes('มาตรฐาน') || 
              qSub.includes('วิชาชีพ') || 
              q.category === 'PART_B' || 
              qGrade === 'PART_B_LAWS' || 
              qGrade === 'PART_B_PROFESSIONAL'
          );
          
          if (isPartB) {
              if (!partB.some(s => s.name === qSub)) partB.push({ name: qSub, id: qSubId });
          } else {
              if (!partA.some(s => s.name === qSub)) partA.push({ name: qSub, id: qSubId });
          }
      });
      
      return { PART_A: partA.sort((a,b) => a.name.localeCompare(b.name)), PART_B: partB.sort((a,b) => a.name.localeCompare(b.name)) };
  }, [bankQuestions]);

  const filteredBank = useMemo(() => {
      return bankQuestions.filter(q => {
          const matchSub = selectedSubject ? (q.subjectId === selectedSubject || q.subject === selectedSubject) : true;
          const matchSearch = q.text.toLowerCase().includes(bankSearch.toLowerCase());
          
          const qGrade = q.grade?.toUpperCase();
          const qSub = q.subject || '';
          
          const isPartB = (
              qSub.includes('กฎหมาย') || 
              qSub.includes('มาตรฐาน') || 
              qSub.includes('วิชาชีพ') || 
              q.category === 'PART_B' || 
              qGrade === 'PART_B_LAWS' || 
              qGrade === 'PART_B_PROFESSIONAL'
          );
          
          let isCorrectPart = false;
          if (activePart === 'PART_B') {
              isCorrectPart = isPartB;
          } else {
              isCorrectPart = !isPartB;
          }
          
          return matchSub && matchSearch && isCorrectPart;
      });
  }, [bankQuestions, selectedSubject, bankSearch, activePart]);

  const handleRandomSelect = () => {
      if (filteredBank.length === 0) return alert("ไม่มีข้อสอบให้สุ่มเลือก");
      const count = Math.min(randomCount, filteredBank.length);
      const shuffled = [...filteredBank].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, count).map(q => q.id);
      setSelectedTempIds(prev => Array.from(new Set([...prev, ...selected])));
  };

  const confirmSelection = () => {
      const selectedItems = bankQuestions.filter(q => selectedTempIds.includes(q.id));
      const formatted = selectedItems.map(q => ({
          text: q.text,
          c1: q.choices[0]?.text || '',
          c2: q.choices[1]?.text || '',
          c3: q.choices[2]?.text || '',
          c4: q.choices[3]?.text || '',
          correct: q.correctChoiceId,
          explanation: q.explanation,
          subject: q.subject,
          subjectId: q.subjectId,
          grade: q.grade || 'PROFESSIONAL'
      }));
      setTaskQuestions(prev => [...prev, ...formatted]);
      setSelectedTempIds([]);
      setView('MAIN');
  };

  const handleFinalizeAssignment = async () => {
      if (taskQuestions.length === 0) return alert("กรุณาเพิ่มข้อสอบอย่างน้อย 1 ข้อ");
      
      // ถ้าเป็นโหมด Assignment ต้องเช็ควันกำหนดส่ง
      if (importTarget === 'ASSIGNMENT' && !assignDeadline) {
          return alert("กรุณาระบุวันสิ้นสุดภารกิจ (Deadline)");
      }
      
      setIsProcessing(true);
      try {
          let targetAssignmentId: string | null = null;
          const firstQ = taskQuestions[0];
          
          // Step 1: สร้าง Assignment ถ้าเลือกโหมด ASSIGNMENT
          if (importTarget === 'ASSIGNMENT') {
              const title = assignTitle || `นำเข้าชุดข้อสอบ ${new Date().toLocaleDateString()}`;
              const qGrade = String(firstQ.grade || '').toUpperCase();
              const qSub = String(firstQ.subject || '').trim();
              
              const finalCategory: AssignmentCategory = (firstQ.grade === 'MAJOR' ? 'MAJOR' : 'PROFESSIONAL') as AssignmentCategory;

              const res = await addAssignment(
                  teacher.school, 
                  firstQ.subject || 'ติวเข้ม', 
                  firstQ.grade || 'PROFESSIONAL', 
                  taskQuestions.length, 
                  assignDeadline, 
                  teacher.name, 
                  title, 
                  undefined, 
                  undefined, 
                  finalCategory,
                  publishDate, 
                  expiryDate,
                  firstQ.subjectId
              );
              targetAssignmentId = res.id;
          }

          // Step 2: บันทึกข้อสอบลงฐานข้อมูล
          for (const q of taskQuestions) {
              await addQuestion({ 
                  subject: q.subject || 'ติวเข้ม', 
                  grade: q.grade || 'PROFESSIONAL', 
                  text: q.text,
                  c1: q.c1, c2: q.c2, c3: q.c3, c4: q.c4, 
                  correct: q.correct, 
                  explanation: q.explanation, 
                  school: teacher.school, 
                  teacherId: String(teacher.id), 
                  assignmentId: targetAssignmentId, // จะเป็น null ถ้าโหมดคือ BANK_ONLY
                  subjectId: q.subjectId
              });
          }

          alert(importTarget === 'ASSIGNMENT' ? '✅ สร้างภารกิจและนำเข้าข้อสอบเรียบร้อยแล้ว' : '✅ นำเข้าข้อสอบเข้าคลังเรียบร้อยแล้ว');
          
          // ล้างค่าและรีเฟรชหน้าจอ
          setTaskQuestions([]); 
          setAssignTitle(''); 
          setAssignDeadline(''); 
          setPublishDate(''); 
          setExpiryDate('');
          onRefresh(); 
      } catch (err: any) {
          console.error(err);
          alert('❌ เกิดข้อผิดพลาดในการบันทึก: ' + err.message);
      } finally {
          setIsProcessing(false);
      }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      ["โจทย์", "ตัวเลือก 1", "ตัวเลือก 2", "ตัวเลือก 3", "ตัวเลือก 4", "ข้อที่ถูก (1-4)", "คำอธิบาย"],
      ["ผู้ใดเป็นผู้รับผิดชอบการจัดการศึกษาขั้นพื้นฐาน?", "กระทรวงศึกษาธิการ", "สถานศึกษา", "เขตพื้นที่การศึกษา", "ถูกทุกข้อ", "4", "ตาม พรบ. การศึกษา..."]
    ];
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "KuruMaster_Template.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const targetSub = subjects.find(s => s.id === importSubjectId);
    if (!targetSub) {
        alert("กรุณาเลือกรายวิชาในช่อง 'เลือกวิชาที่จะนำเข้า' ก่อนครับ");
        e.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            
            // นำเข้าข้อมูลและแมปเข้ากับวิชาที่เลือก
            const imported = data.slice(1).filter((r: any) => r[0] && r[1]).map((r: any) => ({
                text: String(r[0]), 
                c1: String(r[1]), 
                c2: String(r[2]), 
                c3: String(r[3]), 
                c4: String(r[4]), 
                correct: String(r[5] || '1'), 
                explanation: String(r[6] || ''),
                subject: targetSub.name,
                subjectId: targetSub.id,
                grade: targetSub.grade || 'PROFESSIONAL'
            }));

            if (imported.length > 0) {
                setTaskQuestions(prev => [...prev, ...imported]);
                alert(`✅ นำเข้าวิชา ${targetSub.name} สำเร็จ ${imported.length} ข้อ`);
            } else {
                alert("ไม่พบข้อมูลในไฟล์ หรือรูปแบบไฟล์ไม่ถูกต้อง");
            }
        } catch { 
            alert("ไฟล์ไม่ถูกต้อง หรือเกิดข้อผิดพลาดในการอ่านไฟล์"); 
        }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // Reset input
  };

  if (view === 'MAIN') {
    return (
        <div className="animate-fade-in font-prompt">
            {/* Step 1: Import Target Selection */}
            <div className="bg-white p-5 rounded-[30px] shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600 shadow-inner"><Layers size={22}/></div>
                    <div>
                        <h5 className="font-black text-slate-800 text-sm">เลือกจุดหมายการนำเข้า</h5>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Import Target Destination</p>
                    </div>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-auto shadow-inner border border-slate-200">
                    <button 
                        onClick={() => setImportTarget('ASSIGNMENT')} 
                        className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${importTarget === 'ASSIGNMENT' ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'text-slate-400'}`}
                    >
                        <Calendar size={14}/> สร้างเป็นภารกิจใหม่
                    </button>
                    <button 
                        onClick={() => setImportTarget('BANK_ONLY')} 
                        className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${importTarget === 'BANK_ONLY' ? 'bg-white text-emerald-600 shadow-sm border border-emerald-100' : 'text-slate-400'}`}
                    >
                        <Database size={14}/> เก็บเข้าคลังอย่างเดียว
                    </button>
                </div>
            </div>

            {/* Step 2: Assignment Config (Only if Assignment Target is selected) */}
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200 mb-8 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${importTarget === 'ASSIGNMENT' ? 'from-indigo-500 to-purple-600' : 'from-emerald-500 to-teal-600'}`}></div>
                <h4 className="font-black text-2xl text-slate-800 mb-8 flex items-center gap-3">
                    {importTarget === 'ASSIGNMENT' ? <FileSpreadsheet className="text-indigo-600" size={28}/> : <Database className="text-emerald-600" size={28}/>}
                    {importTarget === 'ASSIGNMENT' ? 'ตั้งค่านำเข้าเป็นภารกิจ' : 'ตั้งค่านำเข้าเข้าคลังข้อสอบ'}
                </h4>
                
                <div className="grid md:grid-cols-12 gap-8">
                    <div className={importTarget === 'ASSIGNMENT' ? "md:col-span-7 space-y-6" : "md:col-span-12 space-y-6"}>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">หัวข้อการนำเข้า (Title)</label>
                            <input type="text" value={assignTitle} onChange={e => setAssignTitle(e.target.value)} placeholder={importTarget === 'ASSIGNMENT' ? "เช่น ติวเข้มโค้งสุดท้าย ชุดที่ 1..." : "ระบุชื่อชุดข้อมูลนี้เพื่อใช้อ้างอิง..."} className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-400 outline-none transition-all font-bold text-slate-700 shadow-inner bg-slate-50/50"/>
                        </div>
                        
                        {importTarget === 'ASSIGNMENT' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">วันกำหนดส่ง (Deadline)</label>
                                    <input type="date" value={assignDeadline} onChange={e => setAssignDeadline(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-400 bg-white outline-none transition-all font-bold text-slate-700 shadow-sm"/>
                                </div>
                                <div className="flex flex-col justify-end">
                                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center gap-3">
                                        <Award className="text-amber-500 shrink-0" size={20}/>
                                        <span className="text-[10px] text-amber-800 font-bold leading-tight">โหมดสอบจริง<br/>ไม่มีเฉลยระหว่างทำ</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {importTarget === 'ASSIGNMENT' && (
                        <div className="md:col-span-5 bg-slate-50 p-6 rounded-[35px] border-2 border-indigo-50 space-y-4">
                            <h5 className="font-black text-indigo-900 text-sm flex items-center gap-2 mb-2"><CalendarRange size={18}/> กำหนดการแสดงผล</h5>
                            
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">วันที่เริ่มแสดง (Publish)</label>
                                <div className="relative">
                                    <input type="datetime-local" value={publishDate} onChange={e => setPublishDate(e.target.value)} className="w-full p-3.5 rounded-xl border-2 border-white focus:border-indigo-400 outline-none transition-all font-bold text-slate-600 text-sm shadow-sm"/>
                                    <BellRing className="absolute right-3 top-3 text-indigo-300" size={16}/>
                                </div>
                            </div>

                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">วันที่สิ้นสุด (Expiry)</label>
                                <div className="relative">
                                    <input type="datetime-local" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="w-full p-3.5 rounded-xl border-2 border-white focus:border-rose-400 outline-none transition-all font-bold text-slate-600 text-sm shadow-sm"/>
                                    <Clock className="absolute right-3 top-3 text-rose-300" size={16}/>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Step 3: Content Adding */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <button onClick={() => setView('BANK_BROWSER')} className="bg-slate-900 text-white p-8 rounded-[40px] shadow-xl hover:bg-slate-800 transition-all flex items-center justify-between group active:scale-95">
                    <div className="flex items-center gap-5">
                        <div className="bg-indigo-600 p-4 rounded-2xl group-hover:rotate-6 transition-transform shadow-lg"><Database size={32}/></div>
                        <div className="text-left">
                            <div className="font-black text-xl">ดึงจากคลังข้อสอบ</div>
                            <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest mt-1">Select from Question Bank</p>
                        </div>
                    </div>
                    <ArrowRight size={32} className="text-indigo-400"/>
                </button>

                <div className="bg-white border-2 border-slate-100 p-8 rounded-[40px] shadow-sm hover:shadow-xl transition-all flex flex-col justify-center gap-6 relative group">
                    <div className="flex items-center gap-5">
                        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl group-hover:rotate-6 transition-transform shadow-sm"><FileSpreadsheet size={32}/></div>
                        <div className="text-left">
                            <div className="font-black text-xl text-slate-800">นำเข้าจาก Excel</div>
                            <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest mt-1">Excel Import System</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">1. เลือกวิชาที่จะนำเข้า</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <select 
                                    value={importSubjectId} 
                                    onChange={(e) => setImportSubjectId(e.target.value)}
                                    className="w-full p-3 pl-10 border-2 border-slate-50 rounded-2xl bg-slate-50 font-bold text-slate-700 focus:bg-white focus:border-emerald-400 transition-all outline-none appearance-none shadow-inner text-sm"
                                >
                                    <option value="">-- เลือกกฎหมายหรือวิชาเอก --</option>
                                    {subjects.sort((a,b) => a.grade.localeCompare(b.grade)).map(sub => (
                                        <option key={sub.id} value={sub.id}>[{sub.grade === 'MAJOR' ? 'วิชาเอก' : 'กฎหมาย/วิชาชีพ'}] {sub.name}</option>
                                    ))}
                                </select>
                                <BookMarked className="absolute left-3.5 top-3 text-slate-300" size={18}/>
                            </div>
                            <button 
                                onClick={() => fileInputRef.current?.click()} 
                                disabled={!importSubjectId}
                                className={`px-5 rounded-2xl font-black transition-all flex items-center gap-2 shadow-lg border-b-4 ${importSubjectId ? 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-800 active:scale-95' : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'}`}
                            >
                                <UploadCloud size={20}/> <span className="hidden sm:inline">2. อัปโหลด</span>
                            </button>
                        </div>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls" className="hidden" />
                </div>
            </div>

            {/* List of current mission questions */}
            {taskQuestions.length > 0 && (
                <div className="bg-white rounded-[45px] border-2 border-indigo-100 overflow-hidden shadow-2xl animate-slide-up mb-10">
                    <div className={`p-6 text-white flex justify-between items-center ${importTarget === 'ASSIGNMENT' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                        <div className="flex items-center gap-3">
                            <CheckCircle size={24}/>
                            <span className="font-black text-lg">รายการข้อสอบ ({taskQuestions.length} ข้อ)</span>
                        </div>
                        <button onClick={() => setTaskQuestions([])} className="text-[10px] font-black bg-white/20 px-4 py-2 rounded-xl hover:bg-white/30 uppercase tracking-widest">ล้างตะกร้า</button>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/50">
                        {taskQuestions.map((q, i) => (
                            <div key={i} className="p-6 bg-white rounded-[30px] border border-slate-200 relative group shadow-sm">
                                <button onClick={() => setTaskQuestions(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition p-2 hover:bg-rose-50 rounded-xl"><Trash2 size={20}/></button>
                                <div className="flex gap-3 mb-2">
                                    <span className="bg-indigo-50 text-indigo-600 text-[9px] font-black px-2 py-0.5 rounded-md border border-indigo-100 uppercase tracking-tighter">{q.subject}</span>
                                </div>
                                <div className="font-black text-slate-800 pr-10">{i+1}. {q.text}</div>
                            </div>
                        ))}
                    </div>
                    <div className="p-10 border-t bg-white flex flex-col items-center gap-4">
                        <button 
                            onClick={handleFinalizeAssignment}
                            disabled={isProcessing}
                            className={`w-full text-white py-6 rounded-[30px] font-black text-2xl shadow-2xl transition active:scale-95 flex items-center justify-center gap-4 border-b-8 ${importTarget === 'ASSIGNMENT' ? 'bg-indigo-600 hover:bg-indigo-700 border-indigo-900' : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-900'}`}
                        >
                            {isProcessing ? <Loader2 className="animate-spin" size={32}/> : <Save size={32}/>}
                            {importTarget === 'ASSIGNMENT' ? 'ยืนยันสร้างภารกิจสอบ' : 'ยืนยันบันทึกเข้าคลังข้อสอบ'}
                        </button>
                    </div>
                </div>
            )}

            {/* Template & Form Help */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                <div className="p-8 bg-slate-900 rounded-[45px] text-white flex flex-col justify-between gap-6 shadow-xl border-b-[12px] border-emerald-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><FileSpreadsheet size={100}/></div>
                    <div className="relative z-10">
                        <h5 className="text-xl font-black mb-2 flex items-center gap-3"><FileSpreadsheet className="text-emerald-400"/> โหลดไฟล์ Template</h5>
                        <p className="text-slate-400 text-xs font-bold leading-relaxed">
                            โหลดไฟล์ตัวอย่างเพื่อกรอกโจทย์คำถามด้วยตัวเอง สะดวกสำหรับการออกข้อสอบจำนวนมาก
                        </p>
                    </div>
                    <button onClick={handleDownloadTemplate} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black shadow-xl transition-all flex items-center justify-center gap-3 border-b-4 border-emerald-900 relative z-10">
                        <Download size={20}/> โหลด Template (.xlsx)
                    </button>
                </div>

                <div className="p-8 bg-indigo-600 rounded-[45px] text-white flex flex-col justify-between gap-6 shadow-xl border-b-[12px] border-indigo-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><FormInput size={100}/></div>
                    <div className="relative z-10">
                        <h5 className="text-xl font-black mb-2 flex items-center gap-3"><FormInput className="text-indigo-200"/> วิธีดึงจาก Google Form</h5>
                        <p className="text-indigo-200 text-xs font-bold leading-relaxed">
                            คุณครูสามารถดึงข้อมูลจาก Google Form Responses ที่เป็น Excel มาเข้าแอปได้ง่ายๆ ครับ
                        </p>
                    </div>
                    <button onClick={() => setShowFormGuide(true)} className="w-full bg-white text-indigo-600 py-4 rounded-2xl font-black shadow-xl transition-all flex items-center justify-center gap-3 border-b-4 border-indigo-100 relative z-10">
                        <Info size={20}/> ดูขั้นตอนการนำเข้า
                    </button>
                </div>
            </div>

            {/* MODAL: Google Form Guide */}
            {showFormGuide && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[45px] shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
                        <div className="p-6 bg-indigo-600 text-white flex justify-between items-center shrink-0">
                            <h3 className="font-black text-xl flex items-center gap-3"><FormInput/> วิธีนำเข้าจาก Google Forms</h3>
                            <button onClick={() => setShowFormGuide(false)} className="hover:bg-white/20 p-2 rounded-full transition"><X/></button>
                        </div>
                        <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                            <div className="flex gap-6 items-start">
                                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-black shrink-0">1</div>
                                <div>
                                    <h5 className="font-black text-slate-800 mb-1">เปิด Google Sheets จากฟอร์ม</h5>
                                    <p className="text-sm text-slate-500 leading-relaxed font-medium">เข้าหน้าแก้ไข Google Form &gt; เลือกแถบ "การตอบกลับ" (Responses) &gt; คลิกไอคอน "สเปรดชีต" สีเขียวเพื่อดูข้อมูลข้อสอบ</p>
                                </div>
                            </div>
                            <div className="flex gap-6 items-start">
                                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-black shrink-0">2</div>
                                <div>
                                    <h5 className="font-black text-slate-800 mb-1">จัดเรียงคอลัมน์ให้ตรงตาม Template</h5>
                                    <p className="text-sm text-slate-500 leading-relaxed font-medium">ย้ายคอลัมน์ใน Google Sheets ให้เรียงดังนี้: <br/><span className="text-indigo-600 font-bold">โจทย์ | ช้อยส์ 1 | ช้อยส์ 2 | ช้อยส์ 3 | ช้อยส์ 4 | เฉลย (1-4) | อธิบาย</span></p>
                                </div>
                            </div>
                            <div className="flex gap-6 items-start">
                                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-black shrink-0">3</div>
                                <div>
                                    <h5 className="font-black text-slate-800 mb-1">ดาวน์โหลดเป็นไฟล์ Excel</h5>
                                    <p className="text-sm text-slate-500 leading-relaxed font-medium">ไปที่เมนู <span className="bg-slate-100 px-1.5 rounded font-bold">ไฟล์ &gt; ดาวน์โหลด &gt; Microsoft Excel (.xlsx)</span> แล้วนำไฟล์นั้นมาอัปโหลดเข้าสู่ระบบ KuruMaster ได้ทันทีครับ</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-slate-50 border-t flex justify-center">
                            <button onClick={() => setShowFormGuide(false)} className="px-10 py-4 bg-slate-900 text-white rounded-3xl font-black shadow-xl hover:bg-slate-800 transition active:scale-95">เข้าใจแล้วครับ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
  }

  // --- RENDER BANK BROWSER VIEW (FULL PAGE) ---
  return (
    <div className="animate-slide-up font-prompt min-h-[800px] bg-slate-50 -m-6 md:-m-10 p-6 md:p-10 rounded-[40px]">
        {/* Browser Header */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-8">
            <div className="flex items-center gap-4 w-full lg:w-auto">
                <button onClick={() => setView('MAIN')} className="p-4 bg-white rounded-3xl text-slate-400 hover:text-indigo-600 shadow-sm border border-slate-200 transition-all"><ChevronLeft size={24}/></button>
                <div>
                    <h3 className="text-2xl font-black text-slate-800">คลังข้อสอบติวเข้มครูผู้ช่วย</h3>
                    <p className="text-indigo-600 text-xs font-black uppercase tracking-widest mt-1">Full-Scale Question Bank Browser</p>
                </div>
            </div>
            
            <div className="flex bg-slate-900 p-1.5 rounded-[25px] w-full lg:w-auto shadow-xl">
                <button 
                    onClick={() => { setActivePart('PART_A'); setSelectedSubject(null); }}
                    className={`flex-1 lg:flex-none px-8 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 ${activePart === 'PART_A' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-50'}`}
                >
                    <BrainCircuit size={16}/> ภาค ก
                </button>
                <button 
                    onClick={() => { setActivePart('PART_B'); setSelectedSubject(null); }}
                    className={`flex-1 lg:flex-none px-8 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 ${activePart === 'PART_B' ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-slate-50'}`}
                >
                    <ShieldCheck size={16}/> ภาค ข
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar: Subjects list */}
            <div className="lg:col-span-3 space-y-6">
                <div className="bg-white rounded-[35px] border border-slate-200 shadow-sm overflow-hidden sticky top-24">
                    <div className="p-6 border-b bg-slate-50 flex items-center gap-2">
                        <List size={18} className="text-indigo-600"/>
                        <span className="font-black text-sm text-slate-700 uppercase tracking-wider">เลือกรายวิชา</span>
                    </div>
                    <div className="p-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                        <button 
                            onClick={() => setSelectedSubject(null)}
                            className={`w-full text-left px-5 py-3.5 rounded-2xl text-sm font-bold mb-1 transition-all flex items-center justify-between ${selectedSubject === null ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            แสดงทุกวิชา <ChevronRight size={14}/>
                        </button>
                        {subjectsInBank[activePart].map(sub => (
                            <button 
                                key={sub.id || sub.name}
                                onClick={() => setSelectedSubject(selectedSubject === (sub.id || sub.name) ? null : (sub.id || sub.name))}
                                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${selectedSubject === (sub.id || sub.name) ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <span className="truncate pr-2">{sub.name}</span>
                                <ChevronRight size={12} className={selectedSubject === (sub.id || sub.name) ? 'text-white' : 'text-slate-300'}/>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Area: Question Pool */}
            <div className="lg:col-span-9 space-y-6">
                {/* Random Tool */}
                <div className="bg-white p-6 rounded-[35px] border-2 border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner"><Dices size={24}/></div>
                        <div>
                            <div className="font-black text-slate-800">ระบบสุ่มเลือกข้อสอบ</div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Randomized Selection Tool</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex-1 md:w-32 relative">
                            <input type="number" value={randomCount} onChange={e => setRandomCount(Number(e.target.value))} className="w-full p-3.5 rounded-2xl border-2 border-slate-50 bg-slate-50 text-center font-black text-indigo-600 outline-none focus:border-indigo-400 transition-all" />
                            <span className="absolute -top-2 -right-1 bg-indigo-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">Count</span>
                        </div>
                        <button onClick={handleRandomSelect} className="px-10 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-indigo-600 transition-all shadow-xl active:scale-95 border-b-4 border-slate-700">สุ่มเลือกทันที</button>
                    </div>
                </div>

                {/* Search & List */}
                <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                    <div className="p-6 bg-slate-50 border-b flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative flex-1 w-full">
                            <input 
                                type="text" 
                                value={bankSearch} 
                                onChange={e => setBankSearch(e.target.value)}
                                placeholder="พิมพ์ข้อความที่ต้องการค้นหาในโจทย์..." 
                                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-white focus:border-indigo-400 outline-none font-bold text-sm bg-white shadow-sm"
                            />
                            <Search className="absolute left-4 top-4 text-slate-300" size={20}/>
                        </div>
                        <div className="bg-indigo-600 text-white px-6 py-4 rounded-2xl flex items-center gap-3 shadow-lg shadow-indigo-100 animate-pulse">
                            <CheckSquare size={20}/>
                            <span className="font-black text-sm">เลือกแล้ว {selectedTempIds.length} ข้อ</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                        {loadingBank ? (
                            <div className="py-40 text-center text-indigo-500 font-black animate-pulse flex flex-col items-center">
                                <Loader2 size={50} className="animate-spin mb-4"/>
                                <p>กำลังเข้าถึงฐานข้อมูลคลังข้อสอบ...</p>
                            </div>
                        ) : filteredBank.length === 0 ? (
                            <div className="py-40 text-center text-slate-300 italic font-bold">
                                <Search size={64} className="mx-auto mb-4 opacity-10"/>
                                <p className="text-xl">ไม่พบข้อสอบในเงื่อนไขที่ระบุ</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {filteredBank.map((q) => (
                                    <div 
                                        key={q.id} 
                                        onClick={() => setSelectedTempIds(prev => prev.includes(q.id) ? prev.filter(id => id !== q.id) : [...prev, q.id])}
                                        className={`p-6 rounded-[35px] border-2 transition-all cursor-pointer flex gap-5 group ${selectedTempIds.includes(q.id) ? 'border-indigo-500 bg-indigo-50/50 shadow-xl scale-[1.01]' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                                    >
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-all ${selectedTempIds.includes(q.id) ? 'bg-indigo-600 text-white scale-110' : 'bg-slate-50 text-slate-300 group-hover:bg-slate-100'}`}>
                                            {selectedTempIds.includes(q.id) ? <CheckSquare size={32}/> : <Square size={32}/>}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[9px] font-black text-indigo-600 uppercase bg-white px-2 py-0.5 rounded border border-indigo-100 shadow-sm">{q.subject}</span>
                                            </div>
                                            <div className="font-black text-slate-800 text-lg leading-snug">{q.text}</div>
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-4 border-t pt-3 border-slate-50">
                                                {q.choices.map((c, ci) => (
                                                    <div key={ci} className={`text-[11px] font-bold ${String(ci+1) === q.correctChoiceId ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                        {String.fromCharCode(65+ci)}. {c.text}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Bottom Floating Basket Actions */}
                    <div className="p-8 bg-white border-t flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-50 p-3 rounded-2xl"><Zap size={24} className="text-indigo-600"/></div>
                            <div>
                                <div className="font-black text-slate-800">ยืนยันรายการที่เลือก</div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">คุณสามารถเพิ่มรายวิชาอื่นๆ ต่อได้</p>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            <button onClick={() => { setSelectedTempIds([]); setView('MAIN'); }} className="flex-1 md:flex-none px-10 py-5 rounded-2xl font-black text-slate-400 hover:bg-slate-100 hover:text-rose-500 transition-all uppercase text-xs tracking-widest">ยกเลิก</button>
                            <button onClick={confirmSelection} disabled={selectedTempIds.length === 0} className="flex-1 md:flex-none bg-indigo-600 text-white px-10 py-5 rounded-[25px] font-black text-xl shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-3 border-b-8 border-indigo-900">
                                <PlusCircle size={24}/> เพิ่มข้อสอบที่เลือก ({selectedTempIds.length} ข้อ)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default AssignmentManager;
