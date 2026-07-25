import React, { useState, useEffect } from 'react';
import { Question, Teacher, SubjectConfig } from '../types';
import { ArrowLeft, Play, Shuffle, RefreshCw, Wand2, Sparkles, Database, CheckCircle, Trash2, KeyRound, BookOpen, GraduationCap, Clock, Layers, List } from 'lucide-react';
import { supabase } from '../services/supabaseConfig';
import { fetchAppData, getSubjects } from '../services/api';
import { generateQuestionWithAI } from '../services/aiService';

declare const window: any;

interface GameSetupProps {
  onBack: () => void;
  onGameCreated: (roomCode: string) => void;
  teacher?: Teacher;
}

const GRADE_LABELS: Record<string, string> = { 
    'M1': 'ม.1', 'M2': 'ม.2', 'M3': 'ม.3', 'M4': 'ม.4', 'M5': 'ม.5', 'M6': 'ม.6', 'ALL': 'ทุกชั้น' 
};

const GameSetup: React.FC<GameSetupProps> = ({ onBack, onGameCreated, teacher }) => {
  const [mode, setMode] = useState<'BANK' | 'AI'>('BANK');
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [mySubjects, setMySubjects] = useState<SubjectConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [timePerQuestion, setTimePerQuestion] = useState<number>(20); 

  const [selectedSubject, setSelectedSubject] = useState<string>(''); 
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [aiTopic, setAiTopic] = useState<string>('');
  
  const [hasApiKey, setHasApiKey] = useState(false);
  const [aiPreviewQuestions, setAiPreviewQuestions] = useState<Question[]>([]);
  const [showAiPreview, setShowAiPreview] = useState(false);

  useEffect(() => {
    checkApiKeyStatus();
    loadData();
  }, [teacher]);

  const checkApiKeyStatus = async () => {
    if (window.aistudio?.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
    } else {
        setHasApiKey(!!localStorage.getItem('MST_CUSTOM_GEMINI_KEY'));
    }
  };

  const handleSelectApiKey = async () => {
    if (window.aistudio?.openSelectKey) {
        await window.aistudio.openSelectKey();
        setHasApiKey(true);
    } else {
        alert("กรุณาตั้งค่า API Key ที่หน้าโปรไฟล์ของคุณครูก่อนครับ");
    }
  };

  const loadData = async () => {
    try {
        const data = await fetchAppData();
        setAllQuestions(data.questions);
        if (teacher) {
            const allSubs = await getSubjects(teacher.school);
            setMySubjects(allSubs);
            if (allSubs.length > 0) {
                setSelectedSubject(allSubs[0].name);
                setSelectedGrade(allSubs[0].grade);
            }
        }
        setLoading(false);
    } catch (err) { setLoading(false); }
  };

  const generateGamePin = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleCreateFromBank = async () => {
      if (!selectedSubject || !selectedGrade) return alert("กรุณาเลือกวิชาและชั้นเรียน");
      setProcessing(true);
      
      const filtered = allQuestions.filter(q => 
          q.subject === selectedSubject && 
          q.grade === selectedGrade &&
          String(q.school).trim() === String(teacher?.school).trim()
      );

      if (filtered.length === 0) {
          alert(`ไม่พบข้อสอบวิชา ${selectedSubject} ชั้น ${GRADE_LABELS[selectedGrade]} ในคลังของคุณ`);
          setProcessing(false);
          return;
      }

      filtered.sort(() => 0.5 - Math.random());
      const finalQuestions = filtered.slice(0, questionCount);
      const ROOM_ID = generateGamePin();

      await supabase.from('games').insert({
          room_code: ROOM_ID, 
          status: 'LOBBY', 
          subject: selectedSubject, 
          time_per_question: timePerQuestion, 
          questions: finalQuestions
      });

      onGameCreated(ROOM_ID);
      setProcessing(false);
  };

  const handlePreviewAI = async () => {
      const actualHasKey = hasApiKey || !!localStorage.getItem('MST_CUSTOM_GEMINI_KEY');
      if (!actualHasKey) {
          await handleSelectApiKey();
          return;
      }
      if (!aiTopic || !selectedSubject) return alert("กรุณาระบุหัวข้อเรื่องและวิชา");
      setProcessing(true);
      try {
          // Fix: Argument of type '"normal"' is not assignable to parameter of type '"search_old" | "generate"'.
          const generated = await generateQuestionWithAI(selectedSubject, selectedGrade, aiTopic, questionCount, 'generate');
          if (generated) {
              setAiPreviewQuestions(generated.map((g, i) => ({
                  id: `ai_${Date.now()}_${i}`,
                  subject: selectedSubject,
                  text: g.text,
                  choices: [{ id: '1', text: g.c1 }, { id: '2', text: g.c2 }, { id: '3', text: g.c3 }, { id: '4', text: g.c4 }],
                  correctChoiceId: g.correct,
                  explanation: g.explanation,
                  grade: selectedGrade
              })));
              setShowAiPreview(true);
          }
      } catch (e: any) { alert(e.message); }
      setProcessing(false);
  };

  const handleConfirmAiGame = async () => {
      setProcessing(true);
      const ROOM_ID = generateGamePin();
      await supabase.from('games').insert({
          room_code: ROOM_ID, status: 'LOBBY', subject: selectedSubject, time_per_question: timePerQuestion, questions: aiPreviewQuestions
      });
      onGameCreated(ROOM_ID);
      setProcessing(false);
  };

  // Fix: Explicitly type the Set as string to ensure availableGrades is string[].
  const availableGrades: string[] = Array.from(new Set<string>(mySubjects.map(s => s.grade))).sort();

  return (
    <div className="max-w-3xl mx-auto min-h-[70vh] flex flex-col pb-10 font-prompt animate-fade-in px-4">
       <button onClick={onBack} className="text-slate-400 hover:text-indigo-600 flex items-center gap-2 mb-4 w-fit font-bold transition-all text-sm">
         <ArrowLeft size={16} /> กลับหน้าหลัก
       </button>

      <div className="bg-white rounded-3xl shadow-xl flex-1 overflow-hidden flex flex-col border border-slate-100 relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
        
        {!showAiPreview && (
        <div className="grid grid-cols-2 p-3 gap-3 bg-slate-50/50">
            <button 
                onClick={() => setMode('BANK')} 
                className={`py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${mode === 'BANK' ? 'bg-white text-indigo-600 shadow-md border border-indigo-100' : 'bg-transparent text-slate-400'}`}
            >
                <Database size={18}/>
                <span className="text-sm">คลังข้อสอบ</span>
            </button>
            <button 
                onClick={() => setMode('AI')} 
                className={`py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${mode === 'AI' ? 'bg-white text-pink-600 shadow-md border border-pink-100' : 'bg-transparent text-slate-400'}`}
            >
                <Wand2 size={18}/>
                <span className="text-sm">ใช้ AI ออกโจทย์</span>
            </button>
        </div>
        )}

        <div className="p-6 md:p-8 flex-1 flex flex-col">
            {showAiPreview ? (
                <div className="flex flex-col h-full animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><CheckCircle className="text-green-500" size={24}/> ตรวจสอบโจทย์</h3>
                        <button onClick={() => setShowAiPreview(false)} className="text-sm font-bold text-slate-400 hover:text-slate-600">ย้อนกลับ</button>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-6 custom-scrollbar">
                        {aiPreviewQuestions.map((q, i) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 mb-4 shadow-sm relative group hover:border-indigo-200">
                                <button onClick={() => setAiPreviewQuestions(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-3 right-3 p-1 text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                                <div className="font-bold text-slate-800 mb-2 text-sm pr-8 leading-relaxed">{i+1}. {q.text}</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-500 pl-3 border-l-2 border-indigo-100">
                                    {q.choices.map((c, idx) => <div key={idx} className={String(idx+1) === String(q.correctChoiceId) ? 'text-green-600 font-bold' : ''}>{idx+1}. {c.text}</div>)}
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={handleConfirmAiGame} disabled={processing} className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-green-700 transition active:scale-95 flex items-center justify-center gap-2 border-b-4 border-green-800">
                        {processing ? <RefreshCw className="animate-spin" size={20}/> : <Play fill="currentColor" size={20}/>} 
                        เปิดห้องแข่งขัน ({aiPreviewQuestions.length} ข้อ)
                    </button>
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">1. เลือกระดับชั้น</label>
                            <div className="flex flex-wrap gap-2">
                                {availableGrades.map((g: string) => (
                                    <button key={g} onClick={() => setSelectedGrade(g)} className={`px-4 py-2 rounded-xl font-bold text-sm border-2 transition-all ${selectedGrade === g ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-100'}`}>{GRADE_LABELS[g] || g}</button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">2. เลือกวิชา</label>
                            <div className="flex flex-wrap gap-2">
                                {mySubjects.filter(s => s.grade === selectedGrade).map(sub => (
                                    <button key={sub.id} onClick={() => setSelectedSubject(sub.name)} className={`px-4 py-2 rounded-xl font-bold text-sm border-2 transition-all ${selectedSubject === sub.name ? 'bg-pink-600 border-pink-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-pink-100'}`}>{sub.name}</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {mode === 'AI' && (
                        <div className="animate-slide-up">
                            <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">3. หัวข้อที่ต้องการ</label>
                            <input 
                                type="text" 
                                value={aiTopic} 
                                onChange={e => setAiTopic(e.target.value)} 
                                className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:border-pink-300 outline-none transition font-bold text-lg text-center shadow-inner" 
                                placeholder="เช่น ระบบนิเวศ, การคูณเลข..."
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">จำนวนข้อ</label>
                            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <input type="range" min="5" max="30" step="5" value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))} className="flex-1 accent-indigo-600 h-1.5" />
                                <span className="text-lg font-bold text-indigo-600 min-w-[30px] text-center">{questionCount}</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">เวลา (วินาที)</label>
                            <select value={timePerQuestion} onChange={e => setTimePerQuestion(Number(e.target.value))} className="w-full p-3 border border-slate-100 rounded-xl bg-slate-50 font-bold text-sm outline-none">
                                <option value="15">15 วิ</option>
                                <option value="20">20 วิ</option>
                                <option value="30">30 วิ</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button 
                            onClick={mode === 'BANK' ? handleCreateFromBank : handlePreviewAI} 
                            disabled={loading || processing || !selectedSubject} 
                            className={`w-full py-4 rounded-2xl font-bold text-lg text-white shadow-xl transition transform active:scale-95 flex items-center justify-center gap-2 border-b-4 ${mode === 'BANK' ? 'bg-indigo-600 hover:bg-indigo-700 border-indigo-800' : 'bg-pink-600 hover:bg-pink-700 border-pink-800'}`}
                        >
                            {processing ? <RefreshCw className="animate-spin" size={20}/> : (mode === 'AI' ? <><Sparkles size={20} /> ออกโจทย์ด้วย AI</> : <><Play fill="currentColor" size={20} /> เริ่มกิจกรรม</>)}
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default GameSetup;