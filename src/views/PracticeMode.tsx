
import React, { useState, useEffect, useRef } from 'react';
import { Question, AssignmentCategory } from '../types';
import { CheckCircle, XCircle, ArrowRight, ArrowLeft, HelpCircle, Send, Volume2, VolumeX, Award, Loader2 } from 'lucide-react';
import { speak, stopSpeak } from '../utils/soundUtils';

interface PracticeModeProps {
  onFinish: (score: number, total: number, assignmentId?: string, category?: AssignmentCategory) => void;
  onBack: () => void;
  questions: Question[];
  assignmentId?: string; 
  category?: AssignmentCategory;
}

const PracticeMode: React.FC<PracticeModeProps> = ({ onFinish, onBack, questions: allQuestions, assignmentId, category }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const assignmentIdRef = useRef(assignmentId);
  const [isTTSEnabled, setIsTTSEnabled] = useState(false);
  
  // 🛡️ การแยกโหมดที่ชัดเจน
  const isExam = category === 'EXAM';
  const isHomework = !!assignmentId && !isExam;
  const isPractice = !assignmentId && !isExam; 

  const isLastQuestion = currentIndex === questions.length - 1;
  const choiceLabels = ['A', 'B', 'C', 'D']; 

  useEffect(() => {
    if (assignmentId) assignmentIdRef.current = assignmentId;
  }, [assignmentId]);

  useEffect(() => {
    if (allQuestions && allQuestions.length > 0) {
        const finalQuestions = allQuestions.map(q => ({
            ...q,
            choices: [...q.choices].sort(() => 0.5 - Math.random())
        }));
        setQuestions(finalQuestions);
        setLoading(false);
    } else {
        setLoading(false);
    }
  }, [allQuestions]);

  const currentQuestion = questions[currentIndex];

  const playAudio = React.useCallback(() => {
    if (!currentQuestion) return; 
    stopSpeak(); 
    
    if (isPractice) {
        if (isSubmitted) {
            speak("เฉลยคือ.. " + currentQuestion.explanation);
        } else {
            let textToRead = "คำถาม.. " + currentQuestion.text;
            currentQuestion.choices.forEach((c, i) => {
                textToRead += `. ข้อ ${choiceLabels[i]}.. ${c.text}`;
            });
            speak(textToRead);
        }
    } else {
        if (!isSubmitted) {
            let textToRead = "คำถาม.. " + currentQuestion.text;
            currentQuestion.choices.forEach((c, i) => {
                textToRead += `. ข้อ ${choiceLabels[i]}.. ${c.text}`;
            });
            speak(textToRead);
        }
    }
  }, [currentQuestion, isPractice, isSubmitted, choiceLabels]);

  useEffect(() => {
    if (isTTSEnabled) playAudio();
    else stopSpeak();
    return () => stopSpeak();
  }, [currentIndex, isSubmitted, isTTSEnabled, playAudio]);

  const handleChoiceSelect = (choiceId: string) => {
    if (isSubmitted && !isExam) return;
    setSelectedChoice(choiceId);
  };

  const handleSubmit = () => {
    if (!selectedChoice || isTransitioning) return;
    
    const isCorrect = String(selectedChoice) === String(currentQuestion.correctChoiceId);
    const newScore = isCorrect ? score + 1 : score;
    
    if (isExam || isHomework) {
        // 🛡️ โหมดข้อสอบ/การบ้าน: ไม่แสดงเฉลยระหว่างทำ
        if (isLastQuestion) {
            setIsTransitioning(true);
            // จบการทดสอบทันที
            onFinish(newScore, questions.length, assignmentIdRef.current, category);
        } else {
            setScore(newScore);
            handleNext(newScore);
        }
    } else {
        // โหมดฝึกฝนปกติ: แสดงเฉลยให้ดูก่อน
        setIsSubmitted(true);
        if (isCorrect) {
          setScore(newScore);
          speak("ถูกต้องครับ เก่งมาก");
        } else {
          speak("ลองดูเฉลยนะครับ");
        }
    }
  };

  const handleNext = (currentScore?: number) => {
    const finalScore = currentScore !== undefined ? currentScore : score;
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedChoice(null);
      setIsSubmitted(false);
    } else {
      setIsTransitioning(true);
      onFinish(finalScore, questions.length, assignmentIdRef.current, category);
    }
  };

  if (loading || isTransitioning) {
    return (
        <div className="flex flex-col justify-center items-center h-64 text-indigo-500 font-black gap-4">
            <Loader2 className="animate-spin" size={48}/>
            <p className="text-xl animate-pulse">{isTransitioning ? 'กำลังสรุปผลคะแนน...' : 'กำลังเตรียมข้อสอบ...'}</p>
        </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto font-prompt animate-fade-in pb-10 px-4">
      {/* Header Info */}
      <div className={`flex items-center justify-between mb-4 p-3 md:p-4 rounded-[20px] ${isExam ? 'bg-slate-900 text-white shadow-xl' : 'bg-white text-slate-600 shadow-md border-b-4 border-black/5'}`}>
        <button onClick={onBack} className="font-bold text-sm flex items-center gap-1 hover:opacity-70 transition-opacity"><ArrowLeft size={18} /> ออก</button>
        
        <div className="flex items-center gap-3 md:gap-4">
            <div className="flex flex-col items-center">
                <div className="font-black text-sm md:text-base leading-none">{currentIndex + 1} / {questions.length}</div>
                <div className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase mt-1 tracking-tighter ${isPractice ? 'bg-emerald-100 text-emerald-600' : isHomework ? 'bg-orange-100 text-orange-600' : 'bg-rose-100 text-rose-600'}`}>
                    {isPractice ? 'Practice' : isHomework ? 'Homework' : 'Simulation'}
                </div>
            </div>
            
            <div className="w-12 md:w-20 h-2 bg-black/5 rounded-full overflow-hidden hidden sm:block">
                <div className={`h-full transition-all duration-500 ${isExam ? 'bg-amber-500' : 'bg-indigo-600'}`} style={{ width: `${((currentIndex+1) / questions.length) * 100}%` }}></div>
            </div>

            <button 
                onClick={() => setIsTTSEnabled(!isTTSEnabled)}
                className={`p-2 rounded-xl transition-all shadow-sm active:scale-90 ${isTTSEnabled ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-slate-100 text-slate-400'}`}
            >
                {isTTSEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
        </div>
      </div>

      <div className="bg-white rounded-[35px] shadow-2xl p-6 md:p-10 mb-6 border-b-[10px] border-slate-100 relative overflow-hidden">
        <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-8 leading-relaxed pr-6">{currentQuestion?.text}</h2>

        <div className="grid gap-3">
          {currentQuestion?.choices.map((choice, index) => {
            const isSelected = selectedChoice === choice.id;
            const isCorrect = choice.id === currentQuestion.correctChoiceId;
            
            let btnClass = "w-full p-4 rounded-2xl text-left font-bold text-base border-2 transition-all flex items-center gap-4 ";
            
            if (isPractice) {
              if (isSubmitted) {
                if (isCorrect) btnClass += "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-md scale-[1.01]";
                else if (isSelected) btnClass += "bg-rose-50 border-rose-500 text-rose-800 animate-shake";
                else btnClass += "bg-slate-50 border-slate-100 text-slate-300 opacity-50 grayscale";
              } else {
                btnClass += isSelected ? "bg-indigo-50 border-indigo-500 text-indigo-800 shadow-xl scale-[1.01]" : "bg-white border-slate-100 text-slate-600 hover:border-indigo-300";
              }
            } else {
              btnClass += isSelected ? "bg-indigo-600 border-indigo-700 text-white shadow-xl scale-[1.01]" : "bg-white border-slate-100 text-slate-600 hover:border-indigo-300";
            }

            return (
              <div
                key={choice.id}
                role="button"
                onClick={() => !isSubmitted && handleChoiceSelect(choice.id)}
                className={`w-full p-2 md:p-3 rounded-xl text-left ${btnClass} ${!isSubmitted ? 'cursor-pointer' : ''}`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${isSelected ? (!isPractice ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white') : 'bg-slate-100 text-slate-400'}`}>
                   {choiceLabels[index]}
                </div>
                <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm md:text-base break-words">{choice.text}</span>
                </div>
                {isPractice && isSubmitted && isCorrect && <CheckCircle className="text-emerald-500 shrink-0" size={24}/>}
                {isPractice && isSubmitted && isSelected && !isCorrect && <XCircle className="text-rose-500 shrink-0" size={24}/>}
              </div>
            );
          })}
        </div>
      </div>

      {/* อธิบายคำตอบ (เฉพาะโหมดฝึกฝน) */}
      {isPractice && isSubmitted && (
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-[25px] p-6 mb-24 animate-fade-in shadow-inner relative">
              <div className="absolute top-4 right-6 opacity-10"><HelpCircle size={32}/></div>
              <h4 className="font-black text-emerald-800 text-base mb-2 flex items-center gap-2"><CheckCircle size={18}/> อธิบายคำตอบ</h4>
              <p className="text-emerald-700 text-sm leading-relaxed font-medium">{currentQuestion?.explanation}</p>
          </div>
      )}

      {/* FOOTER ACTIONS */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-slate-200 md:static md:bg-transparent md:border-0 md:p-0 z-20">
          <div className="max-w-3xl mx-auto">
              {!isSubmitted ? (
                  <button 
                      onClick={handleSubmit} 
                      disabled={!selectedChoice || isTransitioning} 
                      className={`w-full py-4 rounded-2xl font-black text-lg text-white shadow-2xl transition-all transform active:scale-95 flex items-center justify-center gap-3 ${
                          selectedChoice && !isTransitioning
                          ? (isPractice ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : (isExam ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200')) 
                          : 'bg-slate-300 cursor-not-allowed'
                      }`}
                  >
                      {isLastQuestion ? (
                          <><Award size={22}/> ส่งคำตอบข้อสุดท้าย</>
                      ) : (
                          isPractice ? 'ส่งคำตอบเพื่อดูเฉลย' : <><Send size={20}/> ยืนยันคำตอบ</>
                      )}
                  </button>
              ) : (
                  isPractice && (
                      <button onClick={() => handleNext()} className="w-full py-4 rounded-2xl font-black text-lg text-white shadow-2xl transition-all bg-emerald-600 flex items-center justify-center gap-3 active:scale-95 shadow-emerald-200">
                          {isLastQuestion ? (
                              <><CheckCircle size={22}/> ดูสรุปผลการฝึกฝนทั้งหมด</>
                          ) : (
                              <>ไปข้อถัดไป <ArrowRight size={20}/></>
                          )}
                      </button>
                  )
              )}
          </div>
      </div>
    </div>
  );
};

export default PracticeMode;
