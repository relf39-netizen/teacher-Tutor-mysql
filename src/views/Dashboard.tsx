import React, { useState, useMemo } from 'react';
import { 
  Star, ArrowLeft, GraduationCap, BrainCircuit, 
  Gavel, Award, Zap, ShieldCheck, 
  BookOpen, RefreshCw, ChevronRight,
  Medal, TrendingUp, BellRing, BarChart3, Activity, Settings,
  CalendarDays, AlertTriangle, Clock, PlayCircle, CheckCircle2
} from 'lucide-react';
import { Student, Assignment, ExamResult, SubjectConfig } from '../types';
import { CREATIVE_REWARDS } from '../constants';

interface DashboardProps {
  student: Student;
  assignments?: Assignment[]; 
  examResults?: ExamResult[]; 
  subjects?: SubjectConfig[];
  onNavigate: (page: string) => void;
  onStartAssignment?: (assignment: Assignment) => void;
  onSelectSubject?: (subConfig: SubjectConfig) => void;
  onRefreshSubjects?: () => void;
}

const calculateMembershipDuration = (dateStr?: string) => {
    if (!dateStr) return "ไม่ระบุ";
    const start = new Date(dateStr);
    const now = new Date();
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    let days = now.getDate() - start.getDate();
    if (days < 0) { months--; const lastMonthOfPrev = new Date(now.getFullYear(), now.getMonth(), 0); days += lastMonthOfPrev.getDate(); }
    if (months < 0) { years--; months += 12; }
    const parts = [];
    if (years > 0) parts.push(`${years} ปี`);
    if (months > 0) parts.push(`${months} เดือน`);
    if (days > 0) parts.push(`${days} วัน`);
    return parts.length > 0 ? parts.join(' ') : "เพิ่งสมัครวันนี้";
};

const checkNearAnniversary = (dateStr?: string) => {
    if (!dateStr) return false;
    const start = new Date(dateStr);
    const now = new Date();
    const anniversary = new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());
    const warningDate = new Date(anniversary.getTime());
    warningDate.setDate(warningDate.getDate() - 15);
    return now >= warningDate && now <= anniversary;
};

const Dashboard: React.FC<DashboardProps> = ({ 
  student, 
  assignments = [], 
  examResults = [], 
  subjects = [],
  onNavigate, 
  onStartAssignment,
  onSelectSubject,
  onRefreshSubjects
}) => {
  const [view, setView] = useState<'main' | 'rewards'>('main');

  // กรองเฉพาะภารกิจที่ยังไม่ได้ทำ (Pending)
  const pendingAssignments = useMemo(() => {
    return assignments.filter(a => {
        return !examResults.some(r => String(r.assignmentId) === String(a.id));
    });
  }, [assignments, examResults]);

  const calculateReadiness = (subjectName: string) => {
    const relevantResults = examResults.filter(r => r.subject === subjectName);
    if (relevantResults.length === 0) return 0;
    const latest3 = relevantResults.slice(0, 3);
    const sum = latest3.reduce((acc, curr) => acc + ((curr.score / (curr.totalQuestions || 1)) * 100), 0);
    return Math.round(sum / latest3.length);
  };

  const categorized = useMemo(() => {
    // 🎯 Smart Matching Logic สำหรับวิชาเอก
    const myMajorSubjects = subjects.filter(s => {
      if (s.grade !== 'MAJOR') return false;
      if (!student.major) return false;
      
      // 1. ทำความสะอาดข้อความ (ลบช่องว่าง, ตัวเล็กทั้งหมด, ลบคำนำหน้าที่อาจทำให้สับสน)
      const clean = (text: string) => text.toLowerCase().replace(/\s/g, '').replace(/วิชาเอก|เอก|กลุ่มวิชา/g, '');
      
      const stdMajorClean = clean(student.major);
      const subNameClean = clean(s.name);
      const subFullClean = clean(s.fullName || '');
      
      // 2. แยก Keyword กรณีนักเรียนมีเอกพ่วง เช่น "ภาษาอังกฤษ / ประถมศึกษา"
      const stdKeywords = student.major.toLowerCase()
        .replace(/วิชาเอก|เอก|กลุ่มวิชา/g, '')
        .split(/[/\s,-]+/)
        .filter(k => k.length > 1);

      // 3. ตรวจสอบการจับคู่แบบกว้าง (Broad Match)
      // - ชื่อวิชามีคำที่นักเรียนเลือกอยู่
      // - หรือ นักเรียนมีคำที่อยู่ในชื่อวิชา
      const isMatched = subNameClean.includes(stdMajorClean) || 
                       stdMajorClean.includes(subNameClean) || 
                       subFullClean.includes(stdMajorClean) ||
                       stdKeywords.some(key => subNameClean.includes(key) || subFullClean.includes(key));
      
      return isMatched;
    });

    return { 
      myMajor: myMajorSubjects,
      partA: subjects.filter(s => s.grade === 'PART_A'),
      partBStandards: subjects.filter(s => s.grade === 'PART_B_PROFESSIONAL' || s.grade === 'PART_B' || s.grade === 'PROFESSIONAL'),
      partBLaws: subjects.filter(s => s.grade === 'PART_B_LAWS'),
    };
  }, [subjects, student.major]);

  const isNearExpiry = checkNearAnniversary(student.created_at);

  if (view === 'rewards') {
    return (
      <div className="space-y-4 animate-fade-in font-prompt px-2 pb-20 max-w-5xl mx-auto">
        <button onClick={() => setView('main')} className="text-slate-400 hover:text-indigo-600 flex items-center gap-1 font-black uppercase text-[10px] tracking-widest transition-all">
          <ArrowLeft size={14} /> กลับหน้าหลัก
        </button>
        <div className="bg-slate-900 p-6 rounded-[30px] text-white shadow-xl text-center border-b-[8px] border-amber-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5"><Star size={80}/></div>
          <h2 className="text-xl font-black mb-1">ร้านค้าสวัสดิการว่าที่ครู</h2>
          <div className="flex items-center gap-2 bg-amber-400 text-slate-900 px-3 py-1.5 rounded-full font-black shadow-lg mt-3 w-fit mx-auto text-xs">
            <Star className="fill-slate-900" size={14}/><span className="">{student.stars} ดาวสะสม</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {CREATIVE_REWARDS.map(reward => (
            <div key={reward.id} className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all text-center flex flex-col justify-between group">
              <div>
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{reward.icon}</div>
                <h4 className="font-bold text-slate-800 text-xs mb-1 leading-tight">{reward.name}</h4>
                <p className="text-[9px] text-slate-400 mb-4 line-clamp-2">{reward.description}</p>
              </div>
              <button className={`w-full py-2 rounded-xl font-black text-[10px] transition-all ${student.stars >= reward.cost ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>{reward.cost} ดาว</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in font-prompt pb-24 max-w-6xl mx-auto px-2">
      {/* 🔝 User Profile Banner */}
      <div className={`rounded-[32px] p-6 md:p-8 text-white shadow-2xl relative overflow-hidden border-b-[10px] transition-all ${isNearExpiry ? 'bg-rose-900 border-rose-600' : 'bg-slate-900 border-indigo-600'}`}>
        <div className="absolute top-0 right-0 opacity-5 transform translate-x-5 -translate-y-5"><GraduationCap size={150} /></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
                <div className={`text-4xl p-4 rounded-[24px] border-2 shadow-2xl backdrop-blur-xl animate-float transition-all ${isNearExpiry ? 'bg-rose-500/20 border-rose-400/20' : 'bg-indigo-500/20 border-white/10'}`}>{student.avatar}</div>
                <div>
                  <h2 className="text-2xl font-black tracking-tighter leading-tight">สวัสดี, ว่าที่ครู{student.name.split(' ')[0]}</h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-amber-400 text-[9px] font-black uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">เอก: {student.major || 'ทั่วไป'}</span>
                      {pendingAssignments.length > 0 && (
                        <span className="text-rose-400 text-[9px] font-black uppercase tracking-widest bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 animate-pulse flex items-center gap-1"><BellRing size={10}/> {pendingAssignments.length} งานค้าง</span>
                      )}
                  </div>
                  
                  <div className="mt-3 flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${isNearExpiry ? 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse' : 'bg-white/10 text-indigo-200 border-white/10'}`}>
                        {isNearExpiry ? <AlertTriangle size={12}/> : <CalendarDays size={12}/>}
                        เป็นสมาชิกแล้ว: {calculateMembershipDuration(student.created_at)}
                    </div>
                  </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={onRefreshSubjects} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/10 text-slate-400 shadow-xl" title="Refresh"><RefreshCw size={20}/></button>
                <button onClick={() => setView('rewards')} className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-black py-3 px-6 rounded-[20px] shadow-2xl flex items-center gap-3 text-sm transition-all active:scale-95 border-b-4 border-amber-700">
                    <Star size={18} fill="currentColor"/> {student.stars} <span className="hidden sm:inline">แต้มสะสม</span>
                </button>
            </div>
        </div>
      </div>

      {/* 🎯 ภารกิจพิเศษที่ต้องทำ (Missions) */}
      {pendingAssignments.length > 0 && (
        <section className="animate-slide-up bg-rose-50/50 p-6 rounded-[40px] border-2 border-rose-100">
            <div className="flex items-center justify-between mb-5 px-2">
                <div className="flex items-center gap-3">
                    <div className="bg-rose-500 p-2.5 rounded-2xl text-white shadow-lg shadow-rose-200"><BellRing size={20}/></div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">ภารกิจพิเศษที่ต้องทำให้สำเร็จ</h3>
                        <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest">Pending Exam Missions</p>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingAssignments.map(a => (
                    <button 
                        key={a.id} 
                        onClick={() => onStartAssignment?.(a)}
                        className="group bg-white p-5 rounded-[30px] border-2 border-slate-100 shadow-md hover:shadow-xl hover:border-rose-400 hover:-translate-y-1 transition-all flex items-center justify-between overflow-hidden relative active:scale-95"
                    >
                        <div className="absolute top-0 left-0 w-2 h-full bg-rose-500"></div>
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-rose-50 rounded-[22px] flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all shadow-inner">
                                <PlayCircle size={32}/>
                            </div>
                            <div className="text-left">
                                <h4 className="font-black text-slate-800 text-base group-hover:text-rose-600 transition-colors leading-tight">{a.title || a.subject}</h4>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <span className="text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase"><Clock size={12}/> Deadline: {a.deadline}</span>
                                    <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100 uppercase tracking-tighter shadow-sm">{a.questionCount} ข้อ</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-full text-slate-300 group-hover:bg-rose-500 group-hover:text-white transition-all">
                            <ChevronRight size={20}/>
                        </div>
                    </button>
                ))}
            </div>
        </section>
      )}

      {/* 🚀 Quick Insights */}
      <section className="animate-slide-up">
        <div className="flex items-center gap-3 mb-6 px-3">
            <div className="bg-slate-800 p-2.5 rounded-xl text-amber-400 shadow-lg"><Activity size={22}/></div>
            <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">สรุปภาพรวมของคุณ</h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Performance & Custom Training</p>
            </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            <button onClick={() => onNavigate('stats')} className="group relative p-5 rounded-[28px] border-2 border-slate-100 bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-xl hover:-translate-y-1.5 transition-all duration-500 text-left flex flex-col justify-between min-h-[170px] border-b-[8px] border-b-indigo-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 bg-indigo-500/20 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div className="flex justify-between items-start relative z-10">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-indigo-300 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-sm">
                        <TrendingUp size={24}/>
                    </div>
                </div>
                <div className="mt-4 relative z-10">
                    <h4 className="font-black text-white text-sm leading-tight group-hover:text-indigo-200 transition-colors">วิเคราะห์สถิติ<br/>และพัฒนาการ</h4>
                    <div className="mt-3 flex items-center gap-1.5">
                        <div className="bg-indigo-500/30 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest">View Analytics</div>
                    </div>
                </div>
            </button>

            {/* 🎯 วิชาเอกหลักที่จับคู่แบบ Smart Match */}
            {categorized.myMajor.length > 0 && (
                <SubjectCard 
                    sub={categorized.myMajor[0]} 
                    readiness={calculateReadiness(categorized.myMajor[0].name)} 
                    onClick={() => onSelectSubject?.(categorized.myMajor[0])} 
                    color="amber" 
                />
            )}

            <button onClick={() => onNavigate('custom-exam-setup')} className="group relative p-5 rounded-[28px] border-2 border-slate-100 bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-xl hover:-translate-y-1.5 transition-all duration-500 text-left flex flex-col justify-between min-h-[170px] border-b-[8px] border-b-emerald-800 overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 bg-white/20 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div className="flex justify-between items-start relative z-10">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white shadow-sm">
                        <Settings size={24}/>
                    </div>
                </div>
                <div className="mt-4 relative z-10">
                    <h4 className="font-black text-white text-sm leading-tight">กำหนดแบบทดสอบ<br/>ด้วยตนเอง</h4>
                    <div className="mt-3 flex items-center gap-1.5">
                        <div className="bg-white/20 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest">Custom Simulation</div>
                    </div>
                </div>
            </button>

            <button onClick={() => onNavigate('game')} className="group relative p-5 rounded-[28px] border-2 border-slate-100 bg-gradient-to-br from-amber-400 to-orange-500 text-slate-900 shadow-xl hover:-translate-y-1.5 transition-all duration-500 text-left flex flex-col justify-between min-h-[170px] border-b-[8px] border-b-orange-600 overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 bg-white/20 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div className="flex justify-between items-start relative z-10">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-orange-600 group-hover:bg-slate-900 group-hover:text-amber-400 transition-all shadow-sm">
                        <Zap size={24} fill="currentColor"/>
                    </div>
                </div>
                <div className="mt-4 relative z-10">
                    <h4 className="font-black text-slate-900 text-sm leading-tight">สมรภูมิแข่งจริง<br/>Game Room</h4>
                    <div className="mt-3 flex items-center gap-1.5">
                        <div className="bg-white/40 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest text-slate-800">Play Now</div>
                    </div>
                </div>
            </button>
        </div>
      </section>

      {/* 🎯 Sections - All Categories */}
      <div className="space-y-14">
        {/* แสดงวิชาเอกทั้งหมดที่จับคู่ได้ */}
        <Section title={`คลังข้อสอบวิชาเอกของคุณ`} subtitle="Specialist Major Subject" icon={<Award size={22}/>} items={categorized.myMajor} readinessCalc={calculateReadiness} onSelect={onSelectSubject} color="amber" />
        
        {/* ภาค ก */}
        <Section title="ภาค ก: ความสามารถทั่วไป" subtitle="Foundation & Analysis" icon={<BrainCircuit size={22}/>} items={categorized.partA} readinessCalc={calculateReadiness} onSelect={onSelectSubject} color="emerald" />
        
        {/* ภาค ข - มาตรฐานวิชาชีพ (รวมทุกวิชาที่เกี่ยวข้อง) */}
        <Section title="ภาค ข: มาตรฐานความรู้และวิชาชีพ" subtitle="Professional Standards" icon={<ShieldCheck size={22}/>} items={categorized.partBStandards} readinessCalc={calculateReadiness} onSelect={onSelectSubject} color="indigo" />
        
        {/* ภาค ข - กฎหมาย */}
        <Section title="ภาค ข: กฎหมายและนโยบาย" subtitle="Education Laws & Policies" icon={<Gavel size={22}/>} items={categorized.partBLaws} readinessCalc={calculateReadiness} onSelect={onSelectSubject} color="rose" />
      </div>
    </div>
  );
};

const Section = ({ title, subtitle, icon, items, readinessCalc, onSelect, color }: any) => {
    if (!items || items.length === 0) return null;
    return (
        <section className="animate-slide-up">
            <div className="flex items-center gap-3 mb-6 px-3">
                <div className={`bg-${color}-600 p-2.5 rounded-xl text-white shadow-lg`}>{icon}</div>
                <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{subtitle}</p>
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {items.map((sub: SubjectConfig) => (
                    <SubjectCard 
                        key={sub.id} 
                        sub={sub} 
                        readiness={readinessCalc(sub.name)} 
                        onClick={() => onSelect?.(sub)} 
                        color={color} 
                    />
                ))}
            </div>
        </section>
    );
};

const SubjectCard = ({ sub, readiness, onClick, color }: any) => {
    const getIcon = () => {
        if (sub.grade === 'PART_B_LAWS') return <Gavel size={20}/>;
        if (sub.grade === 'PART_B_PROFESSIONAL' || sub.grade === 'PART_B' || sub.grade === 'PROFESSIONAL') return <ShieldCheck size={20}/>;
        if (sub.grade === 'MAJOR') return <Award size={20}/>;
        return <BookOpen size={20}/>;
    };

    const gradientMap: Record<string, string> = {
        emerald: 'from-emerald-50 to-emerald-100/50',
        indigo: 'from-indigo-50 to-indigo-100/50',
        rose: 'from-rose-50 to-rose-100/50',
        amber: 'from-amber-50 to-amber-100/50',
    };

    return (
        <button onClick={onClick} className={`group relative p-5 rounded-[28px] border-2 border-slate-50 bg-gradient-to-br ${gradientMap[color] || 'from-slate-50 to-white'} shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500 text-left flex flex-col justify-between min-h-[170px] border-b-[8px] border-b-${color}-500/30 overflow-hidden`}>
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 bg-${color}-500/10 rounded-full group-hover:scale-150 transition-transform duration-700`}></div>
            
            <div className="flex justify-between items-start relative z-10">
                <div className={`w-12 h-12 bg-white rounded-xl flex items-center justify-center text-${color}-600 group-hover:bg-${color}-600 group-hover:text-white transition-all duration-500 shadow-sm`}>
                    {getIcon()}
                </div>
                <div className="text-right">
                    <div className={`text-xl font-black text-${color}-600 leading-none`}>{readiness}%</div>
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Ready</div>
                </div>
            </div>

            <div className="mt-4 relative z-10">
                <h4 className="font-black text-slate-800 text-sm leading-tight group-hover:text-indigo-700 transition-colors line-clamp-2 min-h-[2.5rem]">{sub.name}</h4>
                <div className="w-full h-2 bg-white/60 rounded-full mt-4 overflow-hidden p-0.5 border border-slate-200/30 shadow-inner">
                    <div className={`h-full rounded-full transition-all duration-1000 bg-${color}-500 shadow-sm`} style={{ width: `${readiness}%` }}></div>
                </div>
            </div>
        </button>
    );
};

export default Dashboard;