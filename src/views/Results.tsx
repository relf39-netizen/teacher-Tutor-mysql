
import React, { useEffect, useState } from 'react';
import { Star, RefreshCw, Home, CheckCircle, ShieldAlert, Award } from 'lucide-react';
import { speak } from '../utils/soundUtils';

interface ResultsProps {
  score: number;
  total: number;
  earnedStars: number; 
  isHomework?: boolean;
  isGame?: boolean; 
  earnedEffortToken?: boolean;
  earnedPerfectToken?: boolean;
  unlockedReward?: string | null;
  leveledUp?: boolean;
  onRetry: () => void;
  onHome: () => void;
}

const Results: React.FC<ResultsProps> = ({ score, total, earnedStars, isGame = false, unlockedReward, onRetry, onHome }) => {
  const percentage = total > 0 ? (score / total) * 100 : 0;
  const isPass = percentage >= 60;

  useEffect(() => {
    let speechText = "";
    if (isPass) {
        speechText = `เก่งมากครับ! คุณผ่านเกณฑ์การทดสอบ 60 เปอร์เซ็นต์แล้ว ทำได้ ${score} คะแนน`;
    } else {
        speechText = `พยายามอีกนิดนะครับ คะแนนยังไม่ถึงเกณฑ์ 60 เปอร์เซ็นต์ ทำได้ ${score} คะแนน สู้ๆ ครับ`;
    }
    speak(speechText);
    
    if (unlockedReward) {
        // Handle reward logic if needed
    }
  }, [score, total, percentage, isPass, unlockedReward]);

  return (
    <div className="flex flex-col items-center text-center py-10 min-h-[70vh] justify-center relative font-prompt">
      
      {/* Pass/Fail Status Header */}
      <div className={`mb-8 animate-bounce`}>
          <span className={`px-10 py-4 rounded-[40px] font-black text-2xl border-b-8 shadow-2xl flex items-center gap-3 ${isPass ? 'bg-emerald-500 text-white border-emerald-700' : 'bg-rose-500 text-white border-rose-700'}`}>
              {isPass ? <><CheckCircle size={32} /> สอบผ่านเกณฑ์!</> : <><ShieldAlert size={32} /> ยังไม่ผ่านเกณฑ์</>}
          </span>
      </div>

      {/* Score Visualization */}
      <div className="relative mb-10">
         <div className={`absolute inset-0 rounded-full blur-2xl opacity-30 animate-pulse ${isPass ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
         <div className={`bg-white rounded-full p-12 shadow-2xl relative z-10 border-8 ${isPass ? 'border-emerald-50' : 'border-rose-50'}`}>
            <div className="flex flex-col items-center">
                <div className="text-7xl font-black text-slate-800 leading-none">
                    {score}<span className="text-2xl text-slate-300 font-bold ml-1">/{total}</span>
                </div>
                <div className="mt-4 px-4 py-1.5 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                    Score Achieved
                </div>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-[50px] p-8 shadow-xl border-b-[16px] border-slate-100 w-full max-w-md mb-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-slate-100"></div>
        <div className="w-full bg-slate-100 rounded-full h-6 mb-4 p-1 shadow-inner">
          <div 
            className={`h-full rounded-full transition-all duration-1000 shadow-md ${percentage >= 80 ? 'bg-emerald-500' : percentage >= 60 ? 'bg-blue-500' : 'bg-rose-500'}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between items-center px-2">
            <p className="text-sm font-black text-slate-400 uppercase italic">Accuracy: {Math.round(percentage)}%</p>
            <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                <Star size={14} className="text-amber-500 fill-amber-500"/>
                <span className="text-xs font-black text-amber-600">ได้รับ {earnedStars} ดาว</span>
            </div>
        </div>
        
        {isPass ? (
            <div className="mt-6 p-4 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center gap-4 text-left">
                <div className="bg-white p-3 rounded-2xl text-emerald-500 shadow-sm"><Award size={24}/></div>
                <div>
                    <h5 className="font-black text-emerald-800 text-sm">ยินดีด้วยครับ!</h5>
                    <p className="text-[10px] text-emerald-600 font-bold">คุณมีความพร้อมในหัวข้อนี้อยู่ในระดับดีเยี่ยม</p>
                </div>
            </div>
        ) : (
            <div className="mt-6 p-4 bg-rose-50 rounded-3xl border border-rose-100 flex items-center gap-4 text-left">
                <div className="bg-white p-3 rounded-2xl text-rose-500 shadow-sm"><RefreshCw size={24}/></div>
                <div>
                    <h5 className="font-black text-rose-800 text-sm">พยายามอีกนิด</h5>
                    <p className="text-[10px] text-rose-600 font-bold">แนะนำให้ทบทวนบทเรียนและทำแบบฝึกหัดซ้ำอีกครั้ง</p>
                </div>
            </div>
        )}
      </div>

      <div className="flex flex-col gap-4 w-full max-w-md">
          <button 
              onClick={onHome}
              className="w-full flex items-center justify-center gap-3 py-5 rounded-[30px] font-black text-xl text-white bg-slate-900 hover:bg-slate-800 shadow-2xl transition-all transform active:scale-95"
          >
              <Home size={24} /> กลับหน้าหลัก
          </button>
          {!isGame && (
              <button 
                  onClick={onRetry}
                  className="w-full flex items-center justify-center gap-3 py-5 rounded-[30px] font-black text-xl text-slate-600 bg-white border-2 border-slate-100 hover:bg-slate-50 transition-all shadow-lg active:scale-95"
              >
                  <RefreshCw size={24} /> ลองทำอีกครั้ง
              </button>
          )}
      </div>
    </div>
  );
};

export default Results;
