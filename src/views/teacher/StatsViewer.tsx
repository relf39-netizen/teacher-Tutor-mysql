
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Student, ExamResult, SubjectConfig, Teacher, AssignmentCategory } from '../../types';
import { 
  RefreshCw, X, Users, ChevronRight, Trophy, Target, 
  TrendingUp, Activity, Clock,
  CheckCircle, List, Monitor, Sparkles, Heart, Music, Lightbulb, Landmark, Book, FileText, Microscope,
  Calculator, Languages, Globe, Zap, Search, ArrowRight, LineChart, BookOpen, ShieldCheck, Gavel,
  // Added missing BrainCircuit import
  BrainCircuit
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer
} from 'recharts';

interface StatsViewerProps {
  students: Student[];
  stats: ExamResult[];
  availableSubjects: SubjectConfig[];
  canManageAll: boolean;
  myGrades: string[];
  teacher: Teacher; 
  onRefresh: () => void;
}

const CATEGORY_MAP: Record<string, { label: string, icon: any, color: string }> = {
    'MAJOR': { label: 'วิชาเอก', icon: Trophy, color: 'indigo' },
    'PART_A': { label: 'ภาค ก', icon: BrainCircuit, color: 'emerald' },
    'PART_B': { label: 'ภาค ข', icon: ShieldCheck, color: 'rose' }
};

const SUBJECT_THEMES: Record<string, { icon: any, color: string, bg: string }> = {
    'วิชาเอกภาษาไทย': { icon: Book, color: 'text-orange-600', bg: 'bg-orange-50' },
    'วิชาเอกคณิตศาสตร์': { icon: Calculator, color: 'text-blue-600', bg: 'bg-blue-50' },
    'วิชาเอกภาษาอังกฤษ': { icon: Languages, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    'วิชาเอกวิทยาศาสตร์': { icon: Microscope, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    'ภาค ก': { icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    'ภาค ข': { icon: ShieldCheck, color: 'text-rose-600', bg: 'bg-rose-50' },
};

const getTheme = (name: string) => {
    const key = Object.keys(SUBJECT_THEMES).find(k => name.includes(k)) || '';
    return SUBJECT_THEMES[key] || { icon: FileText, color: 'text-slate-400', bg: 'bg-slate-50' };
};

const StatsViewer: React.FC<StatsViewerProps> = ({ students, stats, onRefresh }) => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMajor, setFilterMajor] = useState('ALL');
  const [activeChartCat, setActiveChartCat] = useState<string>('MAJOR');

  const getIndividualStats = (student: Student) => {
      const studentId = String(student.id).trim();
      const studentResults = stats
          .filter(r => String(r.studentId).trim() === studentId)
          .sort((a, b) => a.timestamp - b.timestamp);
      
      const categoryData: Record<string, { attempts: number, totalScore: number, trend: any[] }> = {
          'MAJOR': { attempts: 0, totalScore: 0, trend: [] },
          'PART_A': { attempts: 0, totalScore: 0, trend: [] },
          'PART_B': { attempts: 0, totalScore: 0, trend: [] }
      };

      studentResults.forEach(r => {
          let cat = 'MAJOR';
          if (r.category === 'PART_A') cat = 'PART_A';
          else if (r.category?.startsWith('PART_B')) cat = 'PART_B';
          
          categoryData[cat].attempts++;
          const percentage = Math.round((r.score / (r.totalQuestions || 1)) * 100);
          categoryData[cat].totalScore += percentage;
          categoryData[cat].trend.push({
              index: categoryData[cat].trend.length + 1,
              score: percentage,
              subject: r.subject,
              date: new Date(r.timestamp).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
          });
      });

      const overallAverage = studentResults.length > 0 
          ? Math.round(studentResults.reduce((s, x) => s + (x.score / x.totalQuestions), 0) / studentResults.length * 100)
          : 0;

      return { categoryData, overallAverage, totalAttempts: studentResults.length };
  };

  const filteredStudents = useMemo(() => {
      return students.filter(s => {
          const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.includes(searchTerm);
          const matchMajor = filterMajor === 'ALL' || s.major === filterMajor;
          return matchSearch && matchMajor;
      });
  }, [students, searchTerm, filterMajor]);

  const studentAnalysis = useMemo(() => {
      if (!selectedStudent) return null;
      return getIndividualStats(selectedStudent);
  }, [selectedStudent, stats]);

  return (
    <div className="font-prompt animate-fade-in space-y-5">
        {/* 🏆 Institute Overview Header (Smaller) */}
        <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl border-b-4 border-indigo-600">
            <div className="absolute top-0 right-0 p-4 opacity-5"><LineChart size={120}/></div>
            <div className="relative z-10">
                <h3 className="text-xl font-black mb-1 flex items-center gap-2">
                    <Activity className="text-rose-500 animate-pulse" size={24}/> ผลลัพธ์นักศึกษาทั้งหมด
                </h3>
                <p className="text-indigo-300 font-bold text-[10px] uppercase tracking-widest">Analytics Dashboard</p>
                
                <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                        <div className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">นักศึกษา</div>
                        <div className="text-xl font-black">{students.length}</div>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                        <div className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-0.5">เข้าสอบ</div>
                        <div className="text-xl font-black">{stats.length}</div>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                        <div className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">ความพร้อม</div>
                        <div className="text-xl font-black">
                            {stats.length > 0 
                                ? Math.round(stats.reduce((s, x) => s + (x.score / x.totalQuestions), 0) / stats.length * 100) 
                                : 0}%
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* 🔍 Control Bar (Smaller) */}
        <div className="flex flex-col md:flex-row gap-3 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
            <div className="relative flex-1">
                <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="ค้นหาชื่อ หรือ ID..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-400 outline-none transition font-bold text-xs"
                />
                <Search className="absolute left-3 top-3 text-slate-300" size={16}/>
            </div>
            <button onClick={onRefresh} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition shadow-sm active:scale-95">
                <RefreshCw size={18}/>
            </button>
        </div>

        {/* 📇 Student Cards Grid (Compact) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
            {filteredStudents.map((s) => {
                const pData = getIndividualStats(s);
                const masteryColor = pData.overallAverage >= 80 ? 'text-emerald-500' : pData.overallAverage >= 50 ? 'text-indigo-600' : 'text-rose-500';
                return (
                    <div 
                        key={s.id}
                        onClick={() => { setSelectedStudent(s); setActiveChartCat('MAJOR'); }}
                        className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group cursor-pointer relative overflow-hidden"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-xl border border-slate-100 shadow-inner group-hover:scale-105 transition-transform">
                                    {s.avatar}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-black text-slate-800 text-xs truncate leading-tight">{s.name}</h4>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">ID: {s.id}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-lg font-black leading-none ${masteryColor}`}>{pData.overallAverage}%</div>
                                <div className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Mastery</div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-between">
                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">วิชาเอก:</span>
                            <span className="text-[9px] font-black text-slate-600 truncate max-w-[120px]">{s.major || 'ไม่ระบุ'}</span>
                        </div>

                        <div className="mt-4 flex justify-end">
                             <div className="text-indigo-600 font-black text-[8px] uppercase flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                คลิกดูแนวโน้ม <ArrowRight size={10}/>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* 📊 Individual Analysis Modal (Redesigned & Categorized) */}
        {selectedStudent && studentAnalysis && createPortal(
            <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-[100] flex items-center justify-center p-3 animate-fade-in font-prompt">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative border-b-8 border-slate-100">
                    <div className="bg-slate-900 px-6 py-5 text-white flex flex-col sm:flex-row justify-between items-center gap-4 relative shrink-0">
                        <button onClick={() => setSelectedStudent(null)} className="absolute top-4 right-4 p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition"><X size={20}/></button>
                        
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="text-4xl bg-indigo-600 p-3 rounded-2xl shadow-xl border border-white/20">
                                {selectedStudent.avatar}
                            </div>
                            <div>
                                <h3 className="text-xl font-black leading-tight tracking-tight">{selectedStudent.name}</h3>
                                <div className="flex gap-2 mt-1">
                                    <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-[8px] font-black border border-amber-500/20 uppercase tracking-widest">เอก: {selectedStudent.major || 'ไม่ระบุ'}</span>
                                    <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded text-[8px] font-black border border-indigo-500/20 uppercase tracking-widest">Mastery: {studentAnalysis.overallAverage}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Category Selector Tabs */}
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                            {Object.entries(CATEGORY_MAP).map(([key, info]) => (
                                <button 
                                    key={key} 
                                    onClick={() => setActiveChartCat(key)}
                                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${activeChartCat === key ? `bg-white text-slate-900 shadow-md` : 'text-slate-400 hover:text-white'}`}
                                >
                                    <info.icon size={12}/> {info.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Trend Chart (Focus on Selected Category) */}
                            <div className="lg:col-span-12">
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                    <div className="flex justify-between items-center mb-6">
                                        <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
                                            <TrendingUp className={`text-${CATEGORY_MAP[activeChartCat].color}-600`}/> 
                                            กราฟแสดงแนวโน้มพัฒนาการ: {CATEGORY_MAP[activeChartCat].label}
                                        </h4>
                                        <div className="bg-slate-50 px-3 py-1 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
                                            Latest {studentAnalysis.categoryData[activeChartCat].trend.length} attempts
                                        </div>
                                    </div>
                                    
                                    <div className="h-[220px] w-full">
                                        {studentAnalysis.categoryData[activeChartCat].trend.length > 1 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={studentAnalysis.categoryData[activeChartCat].trend}>
                                                    <defs>
                                                        <linearGradient id="colorTrend" x1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis dataKey="index" tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} />
                                                    <YAxis domain={[0, 100]} tick={{fill: '#94a3b8', fontSize: 10}} axisLine={false} tickLine={false} />
                                                    <Tooltip 
                                                        contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }} 
                                                        formatter={(val) => [`${val}%`, 'คะแนนที่ได้']}
                                                        labelFormatter={(label, payload) => payload[0]?.payload?.subject || `Attempt ${label}`}
                                                    />
                                                    <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorTrend)" dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-300 italic">
                                                <Target size={40} className="mb-2 opacity-20"/>
                                                <p className="text-xs font-bold">ข้อมูลการสอบในหมวดหมู่นี้ยังมีไม่เพียงพอสำหรับการแสดงกราฟ</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Summary by Category (Smaller) */}
                            {/* Explicitly cast to [string, any] to avoid TS errors on attempts/totalScore properties */}
                            {Object.entries(studentAnalysis.categoryData).map(([key, data]: [string, any]) => (
                                <div key={key} className="lg:col-span-4">
                                    <div className={`p-4 rounded-3xl border-2 bg-white flex items-center justify-between transition-all ${activeChartCat === key ? 'border-indigo-500 shadow-lg' : 'border-slate-100 opacity-60'}`}>
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
                                            <div className="text-[7px] font-black text-slate-300 uppercase">Avg.</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-5 bg-white border-t border-slate-100 flex gap-4">
                         <button onClick={() => setSelectedStudent(null)} className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-slate-800 transition active:scale-95 border-b-4 border-slate-700">ปิดหน้าต่างวิเคราะห์</button>
                    </div>
                </div>
            </div>, document.body
        )}
    </div>
  );
};

export default StatsViewer;
