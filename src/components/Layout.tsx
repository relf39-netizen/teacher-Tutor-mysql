
import React from 'react';
import { BookOpen, Trophy, BarChart, LogOut, Volume2, VolumeX, GraduationCap } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  studentName?: string;
  onLogout: () => void;
  isMusicOn: boolean;
  toggleMusic: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  studentName, 
  onLogout, 
  isMusicOn, 
  toggleMusic,
  currentPage,
  onNavigate
}) => {
  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="bg-amber-500 p-2 rounded-lg text-slate-900 shadow-lg shadow-amber-200/20">
               <GraduationCap size={20} />
            </div>
            <div>
                <h1 className="text-sm font-black text-white leading-tight hidden md:block tracking-tight uppercase">Teacher Exam Prep System</h1>
                <h1 className="text-sm font-black text-white leading-tight md:hidden tracking-tight">เตรียมสอบครู</h1>
                <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">ระบบเตรียมตัวสอบบรรจุข้าราชการครู</p>
            </div>
          </div>

          {studentName && (
            <div className="flex items-center gap-3">
              <button 
                onClick={toggleMusic}
                className={`p-2 rounded-full transition-colors ${isMusicOn ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-800 text-slate-500'}`}
              >
                {isMusicOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                <span className="text-sm font-semibold text-slate-200 truncate max-w-[100px] md:max-w-none">
                  {studentName}
                </span>
              </div>
              
              <button onClick={onLogout} className="text-slate-500 hover:text-red-400 p-2 transition-colors">
                <LogOut size={20} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      {studentName && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 pb-safe shadow-2xl z-40">
          <div className="flex justify-around py-3">
            <NavItem 
              icon={<BookOpen size={22} />} 
              label="หน้าหลัก" 
              isActive={currentPage === 'practice' || currentPage === 'dashboard'} 
              onClick={() => onNavigate('dashboard')} 
            />
            <NavItem 
              icon={<Trophy size={22} />} 
              label="ประลอง" 
              isActive={currentPage === 'game'} 
              onClick={() => onNavigate('game')} 
            />
            <NavItem 
              icon={<BarChart size={22} />} 
              label="วิเคราะห์" 
              isActive={currentPage === 'stats'} 
              onClick={() => onNavigate('stats')} 
            />
          </div>
        </nav>
      )}
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void }> = ({ icon, label, isActive, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-amber-400 scale-105' : 'text-slate-500'}`}
  >
    {icon}
    <span className="text-[10px] font-bold uppercase">{label}</span>
  </button>
);

export default Layout;
