
import React, { useState, useEffect, useRef } from 'react';
import { Student, Question } from '../types';
import { Users, Trophy, Play, CheckCircle, Volume2, VolumeX, Crown, LogIn, Loader2, RefreshCw, AlertTriangle, AlertCircle, Wifi, WifiOff, X, Zap, Speaker } from 'lucide-react';
import { speak, playBGM, stopBGM, playSFX, toggleMuteSystem, stopSpeak } from '../utils/soundUtils';
import { supabase } from '../services/supabaseConfig';

interface GameModeProps {
  student: Student;
  initialRoomCode?: string;
  onExit: () => void;
  onFinish?: (score: number, total: number) => void;
}

type GameStatus = 'INPUT_PIN' | 'LOBBY' | 'COUNTDOWN' | 'PLAYING' | 'FINISHED';

const GameMode: React.FC<GameModeProps> = ({ student, initialRoomCode, onExit, onFinish }) => {
  const [roomCode, setRoomCode] = useState<string>(initialRoomCode || '');
  const [status, setStatus] = useState<GameStatus>(initialRoomCode ? 'LOBBY' : 'INPUT_PIN');
  
  const [inputPin, setInputPin] = useState('');
  const [joinError, setJoinError] = useState('');
  const [dbError, setDbError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const [players, setPlayers] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [countdown, setCountdown] = useState(5);
  const [scores, setScores] = useState<any>({});
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  
  const [isMuted, setIsMuted] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState(false);
  const [timer, setTimer] = useState(0);
  const [maxTime, setMaxTime] = useState(20);
  
  const isAdmin = student.id === '99999'; 
  
  const timerRef = useRef<number | null>(null);
  const pollingRef = useRef<number | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
      if (initialRoomCode) {
          setRoomCode(initialRoomCode);
          connectToRoom(initialRoomCode);
      }
  }, [initialRoomCode]);

  useEffect(() => {
      if (status === 'LOBBY' && roomCode) {
          fetchPlayers(roomCode);
          if (pollingRef.current) window.clearInterval(pollingRef.current);
          pollingRef.current = window.setInterval(() => fetchPlayers(roomCode), 3000);
      }
      return () => { if (pollingRef.current) window.clearInterval(pollingRef.current); };
  }, [status, roomCode]);

  const toggleSound = () => {
    const newState = !isMuted;
    setIsMuted(newState);
    toggleMuteSystem(newState);
  };

  const enableAudio = () => {
    setAudioEnabled(true);
    setIsMuted(false);
    toggleMuteSystem(false);
    playBGM('LOBBY'); 
  };

  useEffect(() => {
    if (!audioEnabled) return;
    if (status === 'LOBBY') playBGM('LOBBY');
    else if (status === 'COUNTDOWN') { stopBGM(); playSFX('COUNTDOWN'); }
    else if (status === 'PLAYING') playBGM('GAME');
    else if (status === 'FINISHED') playBGM('VICTORY');
  }, [status, audioEnabled]);

  useEffect(() => {
      if (status === 'PLAYING' && isTTSEnabled && questions[currentQuestionIndex]) {
          const q = questions[currentQuestionIndex];
          let text = "โจทย์.. " + q.text;
          q.choices.forEach((c, i) => text += `. ตัวเลือกที่ ${i+1}.. ${c.text}`);
          speak(text);
      } else {
          stopSpeak();
      }
  }, [currentQuestionIndex, isTTSEnabled, status]);

  const handleJoinGame = async () => {
      if (inputPin.length !== 6) return setJoinError("กรุณากรอกรหัส 6 หลัก");
      setJoinError('');
      setIsJoining(true);
      await connectToRoom(inputPin);
      setIsJoining(false);
  };

  const fetchPlayers = async (code: string) => {
      try {
          const { data, error } = await supabase.from('game_players').select('*').eq('room_code', code);
          if (error) { setIsConnected(false); return; }
          setIsConnected(true);
          if (data) {
              setPlayers(data);
              const s: any = {};
              data.forEach((p: any) => s[p.student_id] = p.score);
              setScores(s);
          }
      } catch (err) { setIsConnected(false); }
  };

  const connectToRoom = async (code: string) => {
      try {
        const { data: gameData, error } = await supabase.from('games').select('*').eq('room_code', code).single();
        if (error || !gameData) { setJoinError("ไม่พบห้องเกมนี้"); return; }
        if (gameData.status === 'FINISHED') { setJoinError("เกมจบลงแล้ว"); return; }

        if (!isAdmin) {
            const { error: insertError } = await supabase.from('game_players').upsert({
                room_code: code, student_id: student.id, name: student.name, avatar: student.avatar, score: 0, online: true
            }, { onConflict: 'room_code,student_id' });
            if (insertError) { setJoinError("เข้าร่วมไม่สำเร็จ: " + insertError.message); return; }
        }

        setRoomCode(code);
        setStatus(gameData.status || 'LOBBY');
        setCurrentQuestionIndex(gameData.current_question_index || 0);
        setTimer(gameData.timer || 0);
        setMaxTime(gameData.time_per_question || 20);
        setQuestions(typeof gameData.questions === 'string' ? JSON.parse(gameData.questions) : gameData.questions);

        if (channelRef.current) supabase.removeChannel(channelRef.current);
        const channel = supabase.channel(`game_room_${code}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `room_code=eq.${code}` }, (payload) => {
            const newData = payload.new as any;
            if (newData) {
                if (newData.status) setStatus(newData.status);
                if (newData.current_question_index !== undefined) setCurrentQuestionIndex(newData.current_question_index);
                if (newData.timer !== undefined) setTimer(newData.timer);
            }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'game_players', filter: `room_code=eq.${code}` }, () => fetchPlayers(code))
        .subscribe();
        channelRef.current = channel;
        await fetchPlayers(code);
      } catch (e: any) { setJoinError("เกิดข้อผิดพลาดในการเชื่อมต่อ"); }
  };

  useEffect(() => {
    setHasAnswered(false);
    setSelectedChoiceId(null);
  }, [currentQuestionIndex]);

  // Admin Timer Control
  useEffect(() => {
    if (!isAdmin || !roomCode || status === 'INPUT_PIN' || status === 'LOBBY' || status === 'FINISHED') return;
    if (timerRef.current) window.clearInterval(timerRef.current);

    if (status === 'COUNTDOWN') {
        let localCount = 5;
        setCountdown(localCount);
        timerRef.current = window.setInterval(() => {
            localCount--;
            setCountdown(localCount);
            if (localCount <= 0) {
                window.clearInterval(timerRef.current!);
                supabase.from('games').update({ status: 'PLAYING', timer: maxTime }).eq('room_code', roomCode).then();
            }
        }, 1000);
    } else if (status === 'PLAYING') {
        let currentTimer = maxTime; 
        timerRef.current = window.setInterval(() => {
            currentTimer--;
            if (currentTimer >= 0) supabase.from('games').update({ timer: currentTimer }).eq('room_code', roomCode).then();
            if (currentTimer < 0) {
                window.clearInterval(timerRef.current!);
                if (currentQuestionIndex < questions.length - 1) {
                    supabase.from('games').update({ current_question_index: currentQuestionIndex + 1, timer: maxTime }).eq('room_code', roomCode).then();
                } else {
                    supabase.from('games').update({ status: 'FINISHED', timer: 0 }).eq('room_code', roomCode).then();
                }
            }
        }, 1000);
    }
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [status, isAdmin, roomCode, currentQuestionIndex, questions.length]);

  const handleStartGame = async () => {
    if (questions.length === 0) return alert("ไม่พบข้อสอบ");
    await supabase.from('games').update({ status: 'COUNTDOWN' }).eq('room_code', roomCode);
  };

  const handleReset = async () => {
    await supabase.from('games').update({ 
      status: 'LOBBY', 
      current_question_index: 0, 
      timer: 0 
    }).eq('room_code', roomCode);
    await supabase.from('game_players').update({ score: 0 }).eq('room_code', roomCode);
  };

  const handleAnswer = async (choiceId: string) => {
    if (hasAnswered || timer <= 0) return;
    setHasAnswered(true);
    setSelectedChoiceId(choiceId);
    
    if ("vibrate" in navigator) navigator.vibrate(50);

    const currentQ = questions[currentQuestionIndex];
    const isCorrect = String(choiceId) === String(currentQ.correctChoiceId);
    const points = isCorrect ? (50 + Math.round(50 * (timer / maxTime))) : 0;
    
    if (points > 0) {
       const newScore = (scores[student.id] || 0) + points;
       setScores({...scores, [student.id]: newScore});
       await supabase.from('game_players').update({ score: newScore }).eq('room_code', roomCode).eq('student_id', student.id);
       playSFX('CORRECT');
    } else {
       playSFX('WRONG');
    }
  };

  // --- RENDERS ---

  if (status === 'INPUT_PIN' && !isAdmin) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] font-prompt px-4">
              <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm border-b-4 border-purple-500 text-center animate-fade-in">
                  <div className="bg-purple-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-purple-600">
                      <LogIn size={32}/>
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-1">เข้าร่วมเกม</h2>
                  <p className="text-xs text-slate-400 mb-6 font-bold">ใส่รหัส PIN 6 หลัก</p>
                  
                  <input 
                      type="text" 
                      maxLength={6}
                      value={inputPin}
                      onChange={(e) => setInputPin(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full p-4 text-center text-4xl font-black border-2 border-slate-100 rounded-2xl focus:border-purple-400 bg-slate-50 outline-none mb-6 tracking-widest text-slate-800 transition-all"
                      placeholder="000000"
                  />
                  
                  {joinError && <div className="text-red-500 font-bold text-xs mb-4 bg-red-50 p-3 rounded-xl border border-red-100 animate-shake">{joinError}</div>}
                  
                  <button onClick={handleJoinGame} disabled={isJoining || inputPin.length !== 6} className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-purple-700 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                      {isJoining ? <Loader2 className="animate-spin" size={24}/> : 'เข้าร่วมตอนนี้'}
                  </button>
                  <button onClick={onExit} className="mt-4 text-slate-400 font-bold text-xs hover:underline">ยกเลิก</button>
              </div>
          </div>
      );
  }

  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

  if (status === 'LOBBY') {
    return (
      <div className="text-center py-6 min-h-[60vh] flex flex-col justify-center relative font-prompt px-4">
        <div className="absolute top-0 right-0 flex gap-2">
            <button onClick={toggleSound} className={`p-2 rounded-full shadow ${isMuted?'bg-slate-200 text-slate-500':'bg-white text-indigo-600'}`}>{isMuted?<VolumeX size={18}/>:<Volume2 size={18}/>}</button>
        </div>
        
        <div className="mb-6">
            <h2 className="text-sm text-slate-400 font-black mb-1 uppercase tracking-widest">Game PIN:</h2>
            <div className="text-6xl font-black text-indigo-900 bg-white inline-block px-8 py-3 rounded-2xl shadow-xl border-b-4 border-indigo-100">
                {roomCode}
            </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-lg max-w-2xl mx-auto w-full mb-8 border border-white/50">
          <div className="text-lg font-black text-indigo-600 flex items-center gap-2 justify-center mb-4 border-b border-slate-100 pb-3">
              <Users size={20}/> ผู้เล่นที่พร้อมแล้ว ({players.length})
          </div>
          <div className="flex flex-wrap justify-center gap-4 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
            {players.map((p, i) => (
              <div key={i} className="flex flex-col items-center animate-scale-in">
                  <div className="text-3xl bg-slate-50 w-14 h-14 rounded-xl flex items-center justify-center border border-indigo-100 shadow-sm">{p.avatar}</div>
                  <span className="text-[10px] font-black mt-1 bg-white px-2 py-0.5 rounded-full shadow-sm text-slate-600 border border-slate-50">{p.name}</span>
              </div>
            ))}
            {players.length === 0 && <div className="text-slate-300 py-6 text-sm font-bold italic">รอนักเรียนเข้าร่วม...</div>}
          </div>
        </div>

        {isAdmin ? (
            <button onClick={handleStartGame} disabled={players.length === 0} className="bg-green-600 text-white px-10 py-4 rounded-2xl text-xl font-bold shadow-lg hover:bg-green-700 transition-all mx-auto flex items-center gap-2 border-b-4 border-green-800 disabled:opacity-50">
                <Play fill="currentColor" size={24}/> เริ่มแข่งขันเลย!
            </button>
        ) : (
            <div className="flex flex-col items-center gap-3">
                {!audioEnabled && <button onClick={enableAudio} className="bg-yellow-400 text-yellow-900 px-6 py-2 rounded-full font-bold text-sm shadow animate-pulse">เปิดเสียงเกม</button>}
                <div className="text-indigo-600 font-bold text-sm animate-pulse bg-white/50 px-4 py-2 rounded-full">รอคุณครูเริ่มการแข่งขัน...</div>
            </div>
        )}
        <button onClick={onExit} className="text-slate-400 font-bold text-xs mt-8 hover:underline">ออกจากห้อง</button>
      </div>
    );
  }

  if (status === 'COUNTDOWN') {
    return (
        <div className="h-[60vh] flex flex-col items-center justify-center font-prompt">
            <div className="text-sm font-black text-slate-300 mb-2 uppercase tracking-[0.3em]">Ready?</div>
            <div className="text-[10rem] font-black text-indigo-600 animate-ping">
                {countdown}
            </div>
        </div>
    );
  }

  if (status === 'PLAYING' && questions[currentQuestionIndex]) {
    const q = questions[currentQuestionIndex];
    const timePercent = (timer / maxTime) * 100;
    const timerColor = timePercent > 50 ? 'bg-green-500' : timePercent > 20 ? 'bg-orange-500' : 'bg-red-600';
    
    return (
      <div className="max-w-3xl mx-auto pt-2 pb-10 relative font-prompt px-2">
        <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
                <button onClick={toggleSound} className={`p-2 rounded-xl shadow-sm ${isMuted?'bg-slate-200 text-slate-400':'bg-white text-indigo-600'}`}>{isMuted?<VolumeX size={18}/>:<Volume2 size={18}/>}</button>
                <button onClick={() => setIsTTSEnabled(!isTTSEnabled)} className={`p-2 rounded-xl shadow-sm ${isTTSEnabled ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400'}`}><Speaker size={18}/></button>
            </div>
            <div className="bg-white px-4 py-1.5 rounded-full shadow-sm text-xs font-black text-slate-500 border border-slate-50">ข้อ {currentQuestionIndex+1} / {questions.length}</div>
        </div>
        
        <div className="bg-white p-3 rounded-2xl shadow-md flex items-center gap-4 mb-6">
            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 shadow-inner">
                <div className={`h-full transition-all duration-1000 ease-linear rounded-full ${timerColor}`} style={{width:`${timePercent}%`}}></div>
            </div>
            <div className={`text-2xl font-black w-10 text-center ${timer<=5?'text-red-600 animate-pulse':'text-slate-700'}`}>{timer}</div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[30px] shadow-xl border-b-8 border-slate-100 text-center mb-6 relative overflow-hidden">
            {timer <= 0 && <div className="absolute inset-0 bg-slate-900/20 z-20 flex items-center justify-center backdrop-blur-[2px]"><span className="bg-red-600 text-white px-6 py-2 rounded-2xl text-xl font-black shadow-xl">หมดเวลา!</span></div>}
            <h2 className="text-xl md:text-2xl font-bold mb-8 text-slate-800 leading-relaxed">{q.text}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.choices.map((c, i) => {
                    const colors = [
                        'bg-rose-500 hover:bg-rose-600 text-white border-rose-700',
                        'bg-blue-500 hover:bg-blue-600 text-white border-blue-700',
                        'bg-yellow-400 hover:bg-yellow-500 text-slate-900 border-yellow-600',
                        'bg-green-500 hover:bg-green-600 text-white border-green-700'
                    ];
                    const isSelected = selectedChoiceId === c.id;
                    const isCorrect = String(c.id) === String(q.correctChoiceId);

                    return (
                        <button 
                            key={c.id} 
                            onClick={()=>handleAnswer(c.id)} 
                            disabled={hasAnswered || timer<=0} 
                            className={`p-4 rounded-2xl font-bold text-lg border-b-4 relative transition-all active:translate-y-0.5 active:border-b-0 min-h-[70px] flex items-center gap-3 ${colors[i%4]} ${(hasAnswered && !isSelected)?'opacity-40 grayscale-[0.3]':''} ${isSelected ? 'scale-105 shadow-lg ring-2 ring-white' : ''}`}
                        >
                            {(hasAnswered || timer<=0) && isCorrect && <div className="absolute inset-0 bg-white/20 flex items-center justify-center z-10 rounded-2xl border-2 border-white"><CheckCircle size={32}/></div>}
                            <span className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black">{i+1}</span>
                            <span className="flex-1 text-sm text-left">{c.text}</span>
                        </button>
                    );
                })}
            </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-50">
            <h3 className="text-xs font-black text-slate-400 mb-4 flex items-center gap-2 uppercase tracking-widest"><Trophy size={14} className="text-yellow-500"/> Leaderboard</h3>
            <div className="space-y-2">
                {sortedPlayers.slice(0, 3).map((p, i) => (
                    <div key={p.student_id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${i===0?'bg-yellow-50 border-yellow-100 shadow-sm':i===1?'bg-slate-50 border-slate-100':i===2?'bg-orange-50 border-orange-100':'border-transparent'}`}>
                        <div className="flex items-center gap-3">
                            <span className="font-black text-lg w-6 text-center">{i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</span>
                            <div className="text-2xl bg-white p-1 rounded-lg shadow-sm">{p.avatar}</div>
                            <span className="font-bold text-sm text-slate-700">{p.name} {p.student_id===student.id && '(คุณ)'}</span>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-black text-indigo-600">{p.score}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    );
  }

  if (status === 'FINISHED') {
    const winner = sortedPlayers[0];
    return (
        <div className="text-center py-10 px-4 font-prompt animate-fade-in flex flex-col items-center">
            <Trophy size={100} className="text-yellow-400 mb-6 drop-shadow-lg animate-bounce"/>
            <h1 className="text-3xl font-black text-indigo-900 mb-8">การแข่งขันสิ้นสุด!</h1>
            
            <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl border-b-8 border-yellow-300 relative overflow-hidden">
                <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4 drop-shadow-sm"/>
                <div className="text-7xl mb-4">{winner?.avatar}</div>
                <div className="text-xl font-bold text-slate-800 mb-1">{winner?.name}</div>
                <div className="text-4xl font-black text-indigo-600">{winner?.score||0} <span className="text-sm text-slate-400 font-bold">แต้ม</span></div>
            </div>

            <div className="mt-10 flex flex-col md:flex-row gap-3 w-full max-w-sm">
                <button onClick={onExit} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-xl font-bold text-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-2"><X size={20}/> ออก</button>
                {isAdmin && <button onClick={handleReset} className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"><RefreshCw size={20}/> เริ่มรอบใหม่</button>}
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-indigo-500 font-prompt">
        <Loader2 className="animate-spin mb-4" size={48}/>
        <p className="font-bold">กำลังเตรียมข้อมูล...</p>
    </div>
  );
};

export default GameMode;
