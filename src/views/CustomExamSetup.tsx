
import React, { useState } from 'react';
import { 
    ArrowLeft, Settings, Award, ShieldCheck, 
    BrainCircuit, MousePointer2, List, Send,
    ChevronRight
} from 'lucide-react';
import { SubjectConfig } from '../types';

interface CustomExamSetupProps {
  studentMajor?: string;
  subjects: SubjectConfig[];
  onBack: () => void;
  onStart: (config: { type: 'MAJOR' | 'PARTS', count: number }) => void;
}

const CustomExamSetup: React.FC<CustomExamSetupProps> = ({ studentMajor, onBack, onStart }) => {
  const [selectedType, setSelectedType] = useState<'MAJOR' | 'PARTS'>('MAJOR');
  const [questionCount, setQuestionCount] = useState(25);

  return (
    <div className="max-w-4xl mx-auto font-prompt animate-fade-in pb-20 px-2">
        <button onClick={onBack} className="text-slate-400 hover:text-indigo-600 flex items-center gap-2 font-black text-xs uppercase tracking-widest mb-8 transition-all">
            <ArrowLeft size={16} /> กลับหน้าหลัก
        </button>

        <div className="bg-slate-900 p-10 rounded-[50px] shadow-2xl text-white relative overflow-hidden mb-10 border-b-[12px] border-emerald-500">
            <div className="absolute top-0 right-0 p-8 opacity-5"><Settings size={180}/></div>
            <div className="relative z-10">
                <h2 className="text-4xl font-black tracking-tight mb-2 flex items-center gap-4">
                    <div className="bg-emerald-500 p-2 rounded-2xl text-slate-900 shadow-lg"><Settings size={32}/></div>
                    กำหนดแบบทดสอบเอง
                </h2>
                <p className="text-emerald-400 font-bold text-sm uppercase tracking-widest ml-1">Custom Exam Simulation Center</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* 🎯 Section 1: Choose Exam Mode */}
            <div className="lg:col-span-7 space-y-6">
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 h-full">
                    <h3 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-3">
                        <MousePointer2 className="text-indigo-600" size={20}/> 1. เลือกเนื้อหาที่จะสอบ
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                        <button 
                            onClick={() => setSelectedType('MAJOR')}
                            className={`p-6 rounded-[30px] border-2 text-left transition-all flex items-center gap-5 group ${selectedType === 'MAJOR' ? 'bg-indigo-600 border-indigo-700 text-white shadow-xl shadow-indigo-100' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-300'}`}
                        >
                            <div className={`p-4 rounded-2xl shadow-inner transition-all ${selectedType === 'MAJOR' ? 'bg-white/20 text-white' : 'bg-white text-slate-300'}`}>
                                <Award size={32}/>
                            </div>
                            <div className="flex-1">
                                <div className="font-black text-lg leading-tight">วิชาเอกของคุณ</div>
                                <div className={`text-[10px] font-bold uppercase mt-1 ${selectedType === 'MAJOR' ? 'text-indigo-200' : 'text-slate-400'}`}>
                                    {studentMajor ? `เอก: ${studentMajor}` : 'โปรดระบุวิชาเอกในโปรไฟล์'}
                                </div>
                            </div>
                            {selectedType === 'MAJOR' && <ChevronRight size={24}/>}
                        </button>

                        <button 
                            onClick={() => setSelectedType('PARTS')}
                            className={`p-6 rounded-[30px] border-2 text-left transition-all flex items-center gap-5 group ${selectedType === 'PARTS' ? 'bg-indigo-600 border-indigo-700 text-white shadow-xl shadow-indigo-100' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-300'}`}
                        >
                            <div className={`p-4 rounded-2xl shadow-inner transition-all ${selectedType === 'PARTS' ? 'bg-white/20 text-white' : 'bg-white text-slate-300'}`}>
                                <ShieldCheck size={32}/>
                            </div>
                            <div className="flex-1">
                                <div className="font-black text-lg leading-tight">รวมภาค ก และ ภาค ข</div>
                                <div className={`text-[10px] font-bold uppercase mt-1 ${selectedType === 'PARTS' ? 'text-indigo-200' : 'text-slate-400'}`}>
                                    สุ่มเฉลี่ยจากกฎหมายและวิชาชีพทุกฉบับ
                                </div>
                            </div>
                            {selectedType === 'PARTS' && <ChevronRight size={24}/>}
                        </button>
                    </div>
                </div>
            </div>

            {/* 📏 Section 2: Choose Count */}
            <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 h-full flex flex-col">
                    <h3 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-3">
                        <List className="text-emerald-600" size={20}/> 2. จำนวนข้อสอบ
                    </h3>
                    
                    <div className="flex-1 flex flex-col justify-center text-center py-6">
                        <div className="text-6xl font-black text-slate-800 tracking-tighter mb-4">{questionCount}</div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">ข้อสอบ (Questions)</p>
                        
                        <div className="px-4">
                            <input 
                                type="range" 
                                min="10" 
                                max="100" 
                                step="5" 
                                value={questionCount} 
                                onChange={(e) => setQuestionCount(Number(e.target.value))}
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500 mb-8"
                            />
                        </div>
                        
                        <div className="flex justify-between text-[10px] font-black text-slate-300 px-4">
                            <span>10 ข้อ</span>
                            <span>50 ข้อ</span>
                            <span>100 ข้อ</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="mt-12 bg-white p-10 rounded-[50px] shadow-2xl border-2 border-emerald-50 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[22px] flex items-center justify-center shadow-inner shrink-0">
                    <BrainCircuit size={32}/>
                </div>
                <div>
                    <h4 className="text-xl font-black text-slate-800">ระบบจำลองสอบ (Exam Mode)</h4>
                    <p className="text-sm text-slate-400 font-bold mt-1">จะไม่มีเฉลยแสดงระหว่างทำ เพื่อวัดผลความรู้จริงเมื่อจบการทดสอบ</p>
                </div>
            </div>
            
            <button 
                onClick={() => onStart({ type: selectedType, count: questionCount })}
                className="w-full lg:w-auto px-12 py-5 bg-slate-900 text-emerald-400 rounded-[30px] font-black text-2xl shadow-2xl hover:bg-slate-800 transition-all transform active:scale-95 border-b-8 border-slate-700 flex items-center justify-center gap-4 group"
            >
                เริ่มทำการทดสอบ <Send size={28} className="group-hover:translate-x-2 transition-transform"/>
            </button>
        </div>
    </div>
  );
};

export default CustomExamSetup;
