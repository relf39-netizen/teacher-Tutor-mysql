
import React, { useState, useEffect } from 'react';
import { Teacher, Student, Assignment, ExamResult, SubjectConfig } from '../types';
import { 
  LogOut, GraduationCap, ArrowLeft, ArrowRight,
  Users, Stars, FileText, TrendingUp, Gamepad2, UserCircle, BookMarked, Database, FileSpreadsheet
} from 'lucide-react';
import { getTeacherDashboard } from '../services/api';
import StudentManager from './teacher/StudentManager';
import AssignmentManager from './teacher/AssignmentManager';
import StatsViewer from './teacher/StatsViewer';
import QuestionBank from './teacher/QuestionBank';
import MajorBank from './teacher/MajorBank';
import ProfileManager from './teacher/ProfileManager';
import SystemManager from './teacher/SystemManager';
import SubjectManager from './teacher/SubjectManager';

interface TeacherDashboardProps {
  teacher: Teacher;
  onLogout: () => void;
  onStartGame: () => void; 
  onAdminLoginAsStudent: (student: Student) => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ teacher, onLogout, onStartGame, onAdminLoginAsStudent }) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'members' | 'stats' | 'questions' | 'major-bank' | 'assignments' | 'profile' | 'system' | 'subjects'>('menu');
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState<ExamResult[]>([]);
  const [subjects, setSubjects] = useState<SubjectConfig[]>([]);

  const loadData = React.useCallback(async () => {
    const data = await getTeacherDashboard(teacher.school);
    setStudents(data.students || []);
    setStats(data.results || []);
    setAssignments(data.assignments || []);
    setSubjects(data.subjects || []);
  }, [teacher.school]);

  useEffect(() => { loadData(); }, [loadData]);

  const renderContent = () => {
      const canManageAll = teacher.role === 'SCHOOL_ADMIN' || teacher.role === 'SUPER_ADMIN';
      const myGrades = teacher.gradeLevel ? [teacher.gradeLevel] : ['ALL'];

      switch(activeTab) {
          case 'members': return <StudentManager students={students} teacher={teacher} onRefresh={loadData} />;
          case 'subjects': return <SubjectManager subjects={subjects} teacher={teacher} canManageAll={canManageAll} myGrades={myGrades} onRefresh={loadData} />;
          case 'assignments': return <AssignmentManager assignments={assignments} subjects={subjects} students={students} stats={stats} teacher={teacher} canManageAll={canManageAll} myGrades={myGrades} onRefresh={loadData} />;
          case 'stats': return <StatsViewer students={students} stats={stats} availableSubjects={subjects} canManageAll={canManageAll} myGrades={myGrades} teacher={teacher} onRefresh={loadData} />;
          case 'questions': return <QuestionBank teacher={teacher} />;
          case 'major-bank': return <MajorBank teacher={teacher} subjects={subjects} />;
          case 'profile': return <ProfileManager teacher={teacher} onUpdate={loadData} />;
          case 'system': return <SystemManager teacher={teacher} />;
          default: return null;
      }
  };

  return (
    <div className="max-w-6xl mx-auto pb-10 relative font-prompt px-4">
        {/* 🟢 Compact Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 py-2.5 px-4 mb-5 flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
                <div className="bg-slate-900 p-2 rounded-lg text-amber-400 shadow-sm">
                    <GraduationCap size={18}/>
                </div>
                <div>
                    <h2 className="text-base font-black text-slate-800 leading-tight">TEACHER CONSOLE</h2>
                    <p className="text-indigo-600 text-[9px] font-black uppercase tracking-widest">{teacher.school} • {teacher.name}</p>
                </div>
            </div>
            <div className="flex gap-1.5">
                <button onClick={() => setActiveTab('profile')} className={`p-2 rounded-lg transition-all border ${activeTab === 'profile' ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-50 text-slate-400 hover:bg-indigo-50 border-slate-100'}`} title="Profile Settings"><UserCircle size={18}/></button>
                <button onClick={onLogout} className="bg-rose-50 hover:bg-rose-600 text-rose-500 hover:text-white p-2 rounded-lg transition-all border border-rose-100"><LogOut size={18} /></button>
            </div>
        </div>

        {activeTab === 'menu' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                {/* 🌟 Row 1: Priority Cards (Major Bank & Stats) */}
                <MenuCard icon={<Stars size={24}/>} title="คลังวิชาเอก" desc="วิเคราะห์ข้อสอบเจาะลึก" color="amber" onClick={()=>setActiveTab('major-bank')}/>
                <MenuCard icon={<TrendingUp size={24}/>} title="สถิติ/พัฒนาการ" desc="ติดตามความพร้อมสอบ" color="rose" onClick={()=>setActiveTab('stats')}/>
                
                {/* Other Cards */}
                <MenuCard icon={<Users size={24}/>} title="จัดการสมาชิก" desc="ทะเบียนนักศึกษาใหม่" color="indigo" onClick={()=>setActiveTab('members')}/>
                <MenuCard icon={<FileText size={24}/>} title="คลังภาค ก/ข" desc="ชุดข้อสอบมาตรฐานวิชาชีพ" color="blue" onClick={()=>setActiveTab('questions')}/>
                <MenuCard icon={<FileSpreadsheet size={24}/>} title="นำเข้าข้อสอบจาก Excel" desc="สร้างชุดข้อสอบจากไฟล์" color="orange" onClick={()=>setActiveTab('assignments')}/>
                <MenuCard icon={<Gamepad2 size={24}/>} title="Game Room" desc="เปิดห้องแข่ง Live Mock" color="yellow" onClick={onStartGame}/>
                
                <div className="md:col-span-2 lg:col-span-2">
                    <button onClick={()=>setActiveTab('subjects')} className="w-full flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group overflow-hidden relative">
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all"><BookMarked size={20}/></div>
                            <div className="text-left">
                                <span className="block font-black text-slate-800 text-base tracking-tight">ตั้งค่ารายวิชาที่เปิดสอน</span>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Subject Configuration</p>
                            </div>
                        </div>
                        <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-all"><ArrowRight size={14}/></div>
                    </button>
                </div>

                {(teacher.role === 'SUPER_ADMIN' || teacher.role === 'SCHOOL_ADMIN') && (
                    <MenuCard icon={<Database size={24}/>} title="System Setup" desc="ดูแลฐานข้อมูลระบบ" color="slate" onClick={()=>setActiveTab('system')}/>
                )}
            </div>
        ) : (
            <div className="bg-white rounded-3xl p-5 md:p-8 shadow-xl border border-slate-100 min-h-[600px] animate-slide-up relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <button onClick={()=>setActiveTab('menu')} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-all font-black text-[10px] uppercase tracking-widest group">
                    <ArrowLeft size={14}/> Back to Dashboard
                </button>
                {renderContent()}
            </div>
        )}
    </div>
  );
};

const MenuCard: React.FC<{ icon: React.ReactNode; title: string; desc: string; color: string; onClick: () => void }> = ({ icon, title, desc, color, onClick }) => {
    const colorClasses: Record<string, string> = {
        indigo: 'bg-indigo-50/50 text-indigo-600 border-indigo-100 hover:border-indigo-300',
        amber: 'bg-amber-50/50 text-amber-600 border-amber-100 hover:border-amber-300',
        blue: 'bg-blue-50/50 text-blue-600 border-blue-100 hover:border-blue-300',
        orange: 'bg-orange-50/50 text-orange-600 border-orange-100 hover:border-orange-300',
        rose: 'bg-rose-50/50 text-rose-600 border-rose-100 hover:border-rose-300',
        yellow: 'bg-yellow-50/50 text-yellow-600 border-yellow-100 hover:border-yellow-300',
        slate: 'bg-slate-900 text-amber-400 border-slate-800 hover:border-indigo-500',
    };
    
    return (
        <button onClick={onClick} className={`p-4 rounded-2xl border text-left transition-all hover:-translate-y-1 shadow-sm hover:shadow-md flex items-center gap-4 bg-white group relative overflow-hidden ${colorClasses[color] || colorClasses.indigo}`}>
            <div className={`p-3 rounded-xl ${color === 'slate' ? 'bg-white/10 text-amber-400' : 'bg-white shadow-sm border border-slate-50'} group-hover:scale-105 transition-transform duration-300`}>{icon}</div>
            <div className="min-w-0">
                <h3 className={`text-base font-black tracking-tight ${color === 'slate' ? 'text-white' : 'text-slate-800'} group-hover:text-indigo-600 transition-colors truncate`}>{title}</h3>
                <p className={`text-[9px] font-bold uppercase tracking-tighter leading-snug text-slate-400 truncate`}>{desc}</p>
            </div>
        </button>
    );
};

export default TeacherDashboard;
