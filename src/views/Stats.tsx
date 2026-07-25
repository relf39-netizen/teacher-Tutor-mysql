
import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  ArrowLeft, Activity, Target, 
  BookOpen, Zap, 
  ClipboardList, ClipboardCheck,
  Calculator, Microscope, Languages, FileText,
  Book, BrainCircuit, ShieldCheck, LineChart,
  TrendingUp,
  Award
} from 'lucide-react';
import { ExamResult, SubjectConfig, Assignment, AssignmentCategory } from '../types';

interface StatsProps {
  examResults: ExamResult[];
  assignments: Assignment[];
  studentId: string;
  subjects?: SubjectConfig[]; 
  onBack: () => void;
}

const CATEGORY_MAP: Record<string, { label: string, icon: any, color: string }> = {
    'MAJOR': { label: 'วิชาเอก', icon: Award, color: 'indigo' },
    'PART_A': { label: 'ภาค ก', icon: BrainCircuit, color: 'emerald' },
    'PART_B': { label: 'ภาค ข', icon: ShieldCheck, color: 'rose' }
};

const Stats: React.FC<StatsProps> = ({ examResults, assignments, studentId, onBack }) => {
  // สลับแท็บให้ 'practice' (ฝึกฝนทั่วไป) แสดงเป็นอันแรก
  const [activeTab, setActiveTab] = useState<'practice' | 'homework'>('practice');
  const [activeChartCat, setActiveChartCat] = useState<string>('MAJOR');

  const THEMES: Record<string, { main: string, gradient: string[], lightBg: string, icon: any, color: string }> = {
      'วิชาเอกภาษาไทย': { main: '#f59e0b', gradient: ['#fbbf24', '#f59e0b'], lightBg: 'bg-orange-50', icon: Book, color: '#ea580c' },
      'วิชาเอกคณิตศาสตร์': { main: '#3b82f6', gradient: ['#60a5fa', '#3b82f6'], lightBg: 'bg-blue-50', icon: Calculator, color: '#2563eb' },
      'วิชาเอกภาษาอังกฤษ': { main: '#10b981', gradient: ['#34d399', '#10b981'], lightBg: 'bg-emerald-50', icon: Languages, color: '#059669' },
      'วิชาเอกวิทยาศาสตร์': { main: '#6366f1', gradient: ['#818cf8', '#6366f1'], lightBg: 'bg-indigo-50', icon: Microscope, color: '#4f46e5' },
      'ภาค ก': { main: '#059669', gradient: ['#34d399', '#059669'], lightBg: 'bg-emerald-50', icon: BrainCircuit, color: '#047857' },
      'ภาค ข': { main: '#4f46e5', gradient: ['#818cf8', '#4f46e5'], lightBg: 'bg-indigo-50', icon: ShieldCheck, color: '#3730a3' },
  };

  const getSubjectTheme = (subjectName: string) => {
      const key = Object.keys(THEMES).find(k => subjectName.includes(k)) || subjectName;
      return THEMES[key] || { main: '#6366f1', gradient: ['#a5b4fc', '#6366f1'], lightBg: 'bg-indigo-50', icon: FileText, color: '#6366f1' };
  };

  const myAllResults = useMemo(() => 
    examResults
      .filter(r => String(r.studentId).trim() === String(studentId).trim())
      .sort((a, b) => a.timestamp - b.timestamp)
  , [examResults, studentId]);

  const homeworkResults = useMemo(() => myAllResults.filter(r => r.assignmentId && r.assignmentId !== '-' && r.assignmentId !== ''), [myAllResults]);
  const practiceResults = useMemo(() => myAllResults.filter(r => !r.assignmentId || r.assignmentId === '-' || r.assignmentId === ''), [myAllResults]);

  const homeworkList = useMemo(() => {
      return homeworkResults.map(res => {
          const assignment = assignments.find(a => String(a.id).trim() === String(res.assignmentId).trim());
          return { ...res, assignmentTitle: assignment?.title || assignment?.subject || res.subject || 'ภารกิจพิเศษ', percentage: Math.round((res.score / (res.totalQuestions || 1)) * 100) };
      }).reverse();
  }, [homeworkResults, assignments]);

  const categoryStats = useMemo(() => {
      const data = activeTab === 'homework' ? homeworkResults : practiceResults;
      const stats: Record<string, { attempts: number, totalScore: number, trend: any[] }> = {
          'MAJOR': { attempts: 0, totalScore: 0, trend: [] },
          'PART_A': { attempts: 0, totalScore: 0, trend: [] },
          'PART_B': { attempts: 0, totalScore: 0, trend: [] }
      };

      data.forEach(r => {
          let cat = 'MAJOR';
          if (r.category === 'PART_A') cat = 'PART_A';
          else if (r.category?.startsWith('PART_B')) cat = 'PART_B';
          
          stats[cat].attempts++;
          const percentage = Math.round((r.score / (r.totalQuestions || 1)) * 100);
          stats[cat].totalScore += percentage;
          stats[cat].trend.push({
              index: stats[cat].trend.length + 1,
              score: percentage,
              subject: r.subject,
              date: new Date(r.timestamp).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
          });
      });

      return stats;
  }, [homeworkResults, practiceResults, activeTab]);

  return (
    <div className="space-y-5 pb-20 font-prompt animate-fade-in max-w-5xl mx-auto px-2">
      {/* 🏆 Compact Mini Header */}
      <div className="bg-slate-900 p-6 rounded-[35px] text-white shadow-xl relative overflow-hidden border-b-8 border-indigo-600">
          <div className="absolute top-0 right-0 p-4 opacity-5"><LineChart size={120}/></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-center md:text-left">
                  <button onClick={onBack} className="mb-3 flex items-center gap-2 text-indigo-300 hover:text-white transition-all font-black text-[9px] uppercase tracking-widest group">
                      <ArrowLeft size={14}/> Back to Training
                  </button>
                  <h2 className="text-2xl font-black tracking-tight flex items-center justify-center md:justify-start gap-2">
                      <Activity size={24} className="text-rose-500 animate-pulse"/> My Learning Analytics
                  </h2>
              </div>
              <div className="flex gap-2">
                <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/5 text-center">
                    <div className="text-[7px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Activities</div>
                    <div className="text-sm font-black">{myAllResults.length}</div>
                </div>
                <div className="bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/10 text-center">
                    <div className="text-[7px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">Avg Mastery</div>
                    <div className="text-sm font-black text-emerald-400">
                        {myAllResults.length > 0 ? Math.round(myAllResults.reduce((a,b)=>a+(b.score/b.totalQuestions), 0)/myAllResults.length*100) : 0}%
                    </div>
                </div>
              </div>
          </div>
      </div>

      {/* 🎮 Tab Switcher & Category Filter */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex">
             <button onClick={() => setActiveTab('practice')} className={`flex-1 py-2.5 rounded-xl font-black text-[10px] transition-all flex items-center justify-center gap-1.5 ${activeTab === 'practice' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}><Zap size={14}/> ฝึกฝนทั่วไป</button>
             <button onClick={() => setActiveTab('homework')} className={`flex-1 py-2.5 rounded-xl font-black text-[10px] transition-all flex items-center justify-center gap-1.5 ${activeTab === 'homework' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}><ClipboardList size={14}/> ภารกิจสั่งงาน</button>
          </div>

          <div className="md:col-span-8 flex bg-slate-100 p-1 rounded-2xl shadow-inner overflow-x-auto">
              {Object.entries(CATEGORY_MAP).map(([key, info]) => (
                <button 
                    key={key} 
                    onClick={() => setActiveChartCat(key)}
                    className={`flex-1 min-w-[90px] py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${activeChartCat === key ? `bg-white text-indigo-600 shadow-sm` : 'text-slate-400'}`}
                >
                    <info.icon size={12}/> {info.label}
                </button>
              ))}
          </div>
      </div>

      {/* 📊 Trend Area Chart - Same as Teacher's view but personal */}
      <div className="bg-white p-6 rounded-[40px] shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6 px-2">
            <h3 className="font-black text-[10px] text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                <TrendingUp size={14} className={`text-${CATEGORY_MAP[activeChartCat].color}-500`} /> แนวโน้มพัฒนาการ: {CATEGORY_MAP[activeChartCat].label}
            </h3>
            <div className="bg-slate-50 text-slate-400 px-3 py-1 rounded-full text-[8px] font-black uppercase border border-slate-100">
                Latest records
            </div>
        </div>
        
        <div className="h-[220px] w-full">
            {categoryStats[activeChartCat].trend.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={categoryStats[activeChartCat].trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorScore" x1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                        <XAxis dataKey="index" tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} hide />
                        <Tooltip 
                            contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold', fontSize: '11px' }} 
                            formatter={(val) => [`${val}%`, 'Mastery']}
                            labelFormatter={(label, payload) => payload[0]?.payload?.subject || `Attempt ${label}`}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="score" 
                            stroke="#6366f1" 
                            strokeWidth={4} 
                            fillOpacity={1} 
                            fill="url(#colorScore)" 
                            dot={{ r: 5, fill: '#6366f1', strokeWidth: 3, stroke: '#fff' }}
                            activeDot={{ r: 7, strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 italic text-center">
                    <Target size={40} className="mb-3 opacity-20"/>
                    <p className="font-bold text-xs max-w-xs">ยังไม่มีข้อมูลในหมวด {CATEGORY_MAP[activeChartCat].label} เพียงพอสำหรับแสดงกราฟ</p>
                </div>
            )}
        </div>
      </div>

      {/* 🏁 Category Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Explicitly cast to [string, any] to avoid TS errors on attempts/totalScore properties */}
          {Object.entries(categoryStats).map(([key, data]: [string, any]) => (
            <div key={key} className={`p-4 rounded-3xl border-2 bg-white flex items-center justify-between transition-all ${activeChartCat === key ? 'border-indigo-500 shadow-md scale-[1.02]' : 'border-slate-100 opacity-60'}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-${CATEGORY_MAP[key].color}-600 shadow-inner`}>
                        {React.createElement(CATEGORY_MAP[key].icon, { size: 20 })}
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-slate-800">{CATEGORY_MAP[key].label}</div>
                        <div className="text-[8px] font-bold text-slate-400">{data.attempts} ครั้ง</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-lg font-black text-indigo-600">{data.attempts > 0 ? Math.round(data.totalScore / data.attempts) : 0}%</div>
                    <div className="text-[7px] font-black text-slate-300 uppercase tracking-tighter">Avg Mastery</div>
                </div>
            </div>
          ))}
      </div>

      {/* 📋 Record History List (More Compact) */}
      <div className="animate-slide-up space-y-4 pt-2">
          <div className="flex items-center justify-between px-3">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2"><ClipboardCheck size={20} className="text-indigo-600"/> ประวัติย้อนหลัง</h3>
              <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[9px] font-black border border-slate-200 uppercase tracking-widest">
                Records: {(activeTab === 'homework' ? homeworkList : practiceResults).length}
              </span>
          </div>
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
              {(activeTab === 'homework' ? homeworkList : practiceResults.slice().reverse().map(r => ({...r, assignmentTitle: 'ฝึกฝนคลังข้อสอบ', percentage: Math.round((r.score/(r.totalQuestions || 1))*100)}))).map((res, idx) => {
                  const theme = getSubjectTheme(res.subject);
                  const Icon = theme.icon;
                  const isPass = (res as any).percentage >= 60;
                  return (
                      <div key={idx} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                          <div className="flex items-center gap-4 min-w-0">
                              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${theme.lightBg} group-hover:scale-105 transition-transform`} style={{ color: theme.color }}>
                                <Icon size={22}/>
                              </div>
                              <div className="min-w-0">
                                  <h4 className="font-black text-slate-700 text-sm truncate leading-tight group-hover:text-indigo-600 transition-colors">{(res as any).assignmentTitle}</h4>
                                  <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{res.subject} • {new Date(res.timestamp).toLocaleDateString('th-TH')}</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-4 flex-shrink-0">
                              <div className={`text-xs font-black px-2 py-1 rounded-lg ${isPass ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {(res as any).percentage}%
                              </div>
                              <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 text-center min-w-[60px] shadow-inner">
                                  <div className="text-base font-black text-slate-800 leading-none">{res.score}<span className="text-[9px] text-slate-300 ml-0.5">/{(res as any).totalQuestions}</span></div>
                              </div>
                          </div>
                      </div>
                  );
              })}
              {(activeTab === 'homework' ? homeworkList : practiceResults).length === 0 && (
                  <div className="py-16 text-center text-slate-300 italic font-bold text-sm">ยังไม่พบประวัติกิจกรรมในหมวดนี้</div>
              )}
          </div>
      </div>
    </div>
  );
};

export default Stats;
