import React, { useEffect, useState, useMemo } from 'react';
import { Subject, SubjectConfig } from '../types';
import { 
  ArrowLeft, Gavel, BrainCircuit, ShieldCheck, Search, BookOpen,
  BookMarked, ArrowRight, RefreshCw
} from 'lucide-react';
// Import getSubjects from api service
import { getSubjects } from '../services/api';

interface SubjectSelectionProps {
  onSelectSubject: (subject: SubjectConfig) => void;
  onBack: () => void;
}

const SubjectSelection: React.FC<SubjectSelectionProps> = ({ onSelectSubject, onBack }) => {
  const [subjects, setSubjects] = useState<SubjectConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PART_A' | 'PART_B_PROFESSIONAL' | 'PART_B_LAWS' | 'MAJOR'>('PART_A');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
      const loadSubjects = async () => {
          // getSubjects is now correctly imported from ../services/api
          const data = await getSubjects(''); 
          setSubjects(data);
          setLoading(false);
      };
      loadSubjects();
  }, []);

  const displayed = useMemo(() => {
    const list = subjects.filter(s => s.grade === activeTab);
    if (!searchTerm) return list;
    return list.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || (s.fullName && s.fullName.toLowerCase().includes(searchTerm.toLowerCase())));
  }, [subjects, activeTab, searchTerm]);

  const getIcon = (grade: string) => {
    if (grade === 'PART_B_LAWS') return <Gavel size={28}/>;
    if (grade === 'PART_B_PROFESSIONAL') return <ShieldCheck size={28}/>;
    if (grade === 'PART_A') return <BrainCircuit size={28}/>;
    return <BookMarked size={28}/>;
  };

  return (
    <div className="max-w-6xl mx-auto min-h-[80vh] flex flex-col font-prompt animate-fade-in px-4 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <button onClick={onBack} className="text-slate-400 hover:text-indigo-600 flex items-center gap-2 font-black text-xs uppercase tracking-widest transition-all"><ArrowLeft size={18} /> Back</button>

        <div className="flex flex-wrap bg-slate-900 p-2 rounded-[25px] shadow-2xl w-full md:w-auto gap-1">
            <button onClick={() => setActiveTab('PART_A')} className={`flex-1 md:flex-none px-6 py-3 rounded-2xl text-[10px] font-black transition-all ${activeTab === 'PART_A' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>ภาค ก</button>
            <button onClick={() => setActiveTab('PART_B_PROFESSIONAL')} className={`flex-1 md:flex-none px-6 py-3 rounded-2xl text-[10px] font-black transition-all ${activeTab === 'PART_B_PROFESSIONAL' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>ภาค ข: มาตรฐานวิชาชีพ</button>
            <button onClick={() => setActiveTab('PART_B_LAWS')} className={`flex-1 md:flex-none px-6 py-3 rounded-2xl text-[10px] font-black transition-all ${activeTab === 'PART_B_LAWS' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>ภาค ข: กฎหมาย/นโยบาย</button>
            <button onClick={() => setActiveTab('MAJOR')} className={`flex-1 md:flex-none px-6 py-3 rounded-2xl text-[10px] font-black transition-all ${activeTab === 'MAJOR' ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>วิชาเอก</button>
        </div>
      </div>

      <div className="mb-10 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-4">
             <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-inner">{getIcon(activeTab)}</div>
             {activeTab === 'PART_A' && 'ภาค ก: ความรู้ความสามารถทั่วไป'}
             {activeTab === 'PART_B_PROFESSIONAL' && 'ภาค ข: มาตรฐานความรู้และวิชาชีพ'}
             {activeTab === 'PART_B_LAWS' && 'ภาค ข: กฎหมายและนโยบายการศึกษา'}
             {activeTab === 'MAJOR' && 'คลังข้อสอบวิชาเอก'}
          </h2>
          <p className="text-slate-400 text-sm font-bold mt-2 ml-1">เจาะลึกเนื้อหาและวิเคราะห์ข้อสอบเก่าเพื่อความพร้อมสูงสุด</p>
        </div>
        <div className="relative w-full md:w-80">
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="ค้นหาวิชาหรือชื่อเต็ม..." className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border-2 border-slate-100 focus:border-indigo-400 outline-none transition font-bold text-sm shadow-sm" />
          <Search className="absolute left-4 top-4.5 text-slate-300" size={20}/>
        </div>
      </div>

      {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-indigo-500">
              <RefreshCw className="animate-spin mb-4" size={48}/><p className="font-black text-lg animate-pulse uppercase tracking-widest">Loading Repository...</p>
          </div>
      ) : displayed.length === 0 ? (
          <div className="text-center py-32 border-4 border-dashed border-slate-100 rounded-[60px] bg-white shadow-inner">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200"><BookOpen size={48}/></div>
              <p className="text-2xl font-black text-slate-300 italic">ไม่พบรายวิชาในหมวดนี้</p>
              <p className="text-sm text-slate-400 font-bold mt-2">กรุณาเลือกหมวดหมู่อื่น หรือค้นหาด้วยคำอื่นครับ</p>
          </div>
      ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 animate-slide-up">
            {displayed.map((sub) => (
                <button key={sub.id} onClick={() => onSelectSubject(sub)} className="group relative p-8 rounded-[45px] border-b-[12px] border-black/5 transition-all duration-500 transform hover:-translate-y-3 hover:shadow-2xl flex flex-col items-center justify-between text-center bg-white border-2 border-slate-50 overflow-hidden aspect-square">
                  <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full transition-all duration-700 opacity-5 group-hover:opacity-10 group-hover:scale-150 ${activeTab === 'PART_A' ? 'bg-emerald-500' : activeTab === 'PART_B_LAWS' ? 'bg-rose-500' : 'bg-indigo-500'}`}></div>
                  
                  <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center shadow-xl transition-all duration-500 mb-4 ${activeTab === 'PART_A' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600' : activeTab === 'PART_B_LAWS' ? 'bg-rose-50 text-rose-600 group-hover:bg-rose-600' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600'} group-hover:text-white`}>
                    {getIcon(activeTab)}
                  </div>
                  
                  <div className="relative z-10 w-full mb-2">
                    <h3 className="text-base font-black leading-tight tracking-tighter text-slate-800 group-hover:text-indigo-700 transition-colors line-clamp-2 min-h-[2.5rem]">{sub.name}</h3>
                    <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Analyze & Prep</p>
                  </div>

                  <div className="absolute bottom-6 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                      <div className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">Start Training <ArrowRight size={10}/></div>
                  </div>
                </button>
            ))}
          </div>
      )}
    </div>
  );
};

export default SubjectSelection;