
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Login from './views/Login';
import TeacherLogin from './views/TeacherLogin';
import TeacherDashboard from './views/TeacherDashboard';
import SuperAdminDashboard from './views/SuperAdminDashboard';
import Dashboard from './views/Dashboard';
import PracticeMode from './views/PracticeMode';
import GameMode from './views/GameMode';
import GameSetup from './views/GameSetup';
import Results from './views/Results';
import Stats from './views/Stats';
import CustomExamSetup from './views/CustomExamSetup';
import { Student, Question, Teacher, ExamResult, Assignment, SubjectConfig, AssignmentCategory } from './types';
import { fetchAppData, saveScore, getDataForStudent, getTeacherById } from './services/api';
import { Loader2, Database } from 'lucide-react';
import { isConfigured, mysqlConfig } from './services/mysqlConfig';

const App: React.FC = () => {
  // --- STATE ---
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [currentPage, setCurrentPage] = useState('login'); 
  
  const [selectedSubject, setSelectedSubject] = useState<SubjectConfig | null>(null);
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  const currentAssignmentRef = useRef<Assignment | null>(null);
  
  // Custom Exam Config
  const [customExamQuestions, setCustomExamQuestions] = useState<Question[]>([]);

  const [isMusicOn, setIsMusicOn] = useState(true);
  const [lastScore, setLastScore] = useState<{score: number, total: number, earnedStars: number, isExam?: boolean} | null>(null);
  
  const [students, setStudents] = useState<Student[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<SubjectConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gameRoomCode, setGameRoomCode] = useState<string>('');

  // --- INITIALIZATION ---
  useEffect(() => {
    const initData = async () => {
      try {
          const data = await fetchAppData();
          setStudents(data.students);
          setQuestions(data.questions);
          setExamResults(data.results);
          setAssignments(data.assignments);
          setSubjects(data.subjects); 
          
          const savedTeacherId = localStorage.getItem('MST_TEACHER_ID');
          if (savedTeacherId) {
              const freshTeacher = await getTeacherById(savedTeacherId);
              if (freshTeacher) {
                  setCurrentTeacher(freshTeacher);
                  if (freshTeacher.role === 'SUPER_ADMIN') {
                      setCurrentPage('super-admin-dashboard');
                  } else {
                      setCurrentPage('teacher-dashboard');
                  }
              }
          }
          
          const savedStudentId = localStorage.getItem('MST_STUDENT_ID');
          if (savedStudentId && !savedTeacherId) {
              const st = data.students.find(s => String(s.id) === String(savedStudentId));
              if (st) {
                  const studentObj = { ...st, inventory: typeof st.inventory === 'string' ? JSON.parse(st.inventory) : st.inventory };
                  setCurrentUser(studentObj);
                  handleLogin(studentObj);
              }
          }

      } catch (e) {
          console.error("Failed to load initial data", e);
      } finally {
          setIsLoading(false);
      }
    };
    initData();
  }, []);

  useEffect(() => {
      currentAssignmentRef.current = currentAssignment;
  }, [currentAssignment]);

  const refreshStudentData = async () => {
      if (currentUser) {
          const specificData = await getDataForStudent(currentUser);
          setExamResults(specificData.results);
          setAssignments(specificData.assignments);
          
          const freshData = await fetchAppData();
          const st = freshData.students.find(s => String(s.id) === String(currentUser.id));
          if (st) {
              setCurrentUser(prev => prev ? { 
                ...prev, 
                stars: Number(st.stars) || 0, 
                inventory: typeof st.inventory === 'string' ? JSON.parse(st.inventory) : st.inventory 
              } : null);
          }
      }
  };

  const handleLogin = async (student: Student) => { 
      setIsLoading(true);
      setCurrentUser(student);
      localStorage.setItem('MST_STUDENT_ID', student.id);
      try {
          const specificData = await getDataForStudent(student);
          setExamResults(specificData.results);
          setAssignments(specificData.assignments);
      } catch (e) { console.error(e); }
      setIsLoading(false);
      setCurrentPage('dashboard'); 
  };

  const handleTeacherLoginSuccess = (teacher: Teacher) => { 
      setCurrentTeacher(teacher); 
      if (teacher.id) localStorage.setItem('MST_TEACHER_ID', String(teacher.id));
      
      if (teacher.role === 'SUPER_ADMIN') {
          setCurrentPage('super-admin-dashboard');
      } else {
          setCurrentPage('teacher-dashboard');
      }
  };

  const handleLogout = () => { 
      localStorage.removeItem('MST_TEACHER_ID');
      localStorage.removeItem('MST_STUDENT_ID');
      setCurrentUser(null); 
      setCurrentTeacher(null); 
      setCurrentPage('login'); 
      setSelectedSubject(null); 
      setCurrentAssignment(null); 
  };

  const handleFinishExam = async (score: number, total: number, returnedAssignmentId?: string, category?: AssignmentCategory) => {
    const isExam = category === 'EXAM' || currentAssignmentRef.current?.category === 'EXAM';
    
    let starsEarned = 0;
    if (total > 0 && !isExam) {
        const percentage = (score / total) * 100;
        if (percentage === 100) starsEarned = 3;
        else if (percentage >= 70) starsEarned = 2;
        else if (percentage >= 50) starsEarned = 1;
    }
    
    const activeAssignmentId = returnedAssignmentId ? String(returnedAssignmentId) : (currentAssignmentRef.current?.id ? String(currentAssignmentRef.current.id) : undefined);
    const matchedAssignment = assignments.find(a => String(a.id) === String(activeAssignmentId));
    const subjectToSave = matchedAssignment ? matchedAssignment.subject : (selectedSubject?.name || 'จำลองสอบด้วยตัวเอง');
    const finalCategory = category || matchedAssignment?.category || 'GENERAL';

    setLastScore({ score, total, earnedStars: starsEarned, isExam });
    setCurrentPage('results');

    if (currentUser) {
        const tempResult: ExamResult = {
          id: `temp-${Date.now()}`,
          studentId: String(currentUser.id),
          subject: subjectToSave,
          score: score,
          totalQuestions: total,
          timestamp: Date.now(),
          assignmentId: activeAssignmentId,
          category: finalCategory
        };
        setExamResults(prev => [tempResult, ...prev]);

        saveScore(
          currentUser.id, 
          currentUser.name, 
          currentUser.school || '-', 
          score, 
          total, 
          subjectToSave, 
          activeAssignmentId, 
          finalCategory, 
          starsEarned
        ).then(success => {
            if (success) refreshStudentData();
        });
    }

    setCurrentAssignment(null); 
    setCustomExamQuestions([]);
  };

  const handleStartCustomExam = (config: { type: 'MAJOR' | 'PARTS', count: number }) => {
      let pool: Question[] = [];
      
      if (config.type === 'MAJOR' && currentUser?.major) {
          pool = questions.filter(q => 
              String(q.grade) === 'MAJOR' && 
              (String(q.subject).includes(currentUser.major!) || currentUser.major?.includes(String(q.subject)))
          ).sort(() => 0.5 - Math.random());
          setCustomExamQuestions(pool.slice(0, config.count));
      } else {
          const targetGrades = ['PART_A', 'PART_B_PROFESSIONAL', 'PART_B_LAWS'];
          const relevantQuestions = questions.filter(q => q.grade && targetGrades.includes(q.grade));
          const subjectsMap = new Map<string, Question[]>();
          relevantQuestions.forEach(q => {
              if (!subjectsMap.has(q.subject)) subjectsMap.set(q.subject, []);
              subjectsMap.get(q.subject)!.push(q);
          });
          const activeSubjects = Array.from(subjectsMap.keys());
          if (activeSubjects.length === 0) return alert("ไม่พบข้อสอบในคลังส่วนกลาง");
          const questionsPerSubject = Math.floor(config.count / activeSubjects.length);
          let finalPool: Question[] = [];
          activeSubjects.forEach(subName => {
              const subPool = subjectsMap.get(subName)!.sort(() => 0.5 - Math.random());
              finalPool = [...finalPool, ...subPool.slice(0, questionsPerSubject)];
          });
          if (finalPool.length < config.count) {
              const remainingCount = config.count - finalPool.length;
              const usedIds = new Set(finalPool.map(q => q.id));
              const availableRemaining = relevantQuestions.filter(q => !usedIds.has(q.id)).sort(() => 0.5 - Math.random());
              finalPool = [...finalPool, ...availableRemaining.slice(0, remainingCount)];
          }
          setCustomExamQuestions(finalPool.sort(() => 0.5 - Math.random()));
      }
      setSelectedSubject(null);
      setCurrentAssignment(null);
      setCurrentPage('practice-custom');
  };

  if (!isConfigured) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
              <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md border-b-4 border-red-500">
                  <Database size={48} className="text-red-500 mx-auto mb-4"/>
                  <h1 className="text-2xl font-bold text-slate-800">ยังไม่ได้เชื่อมต่อฐานข้อมูล</h1>
                  <p className="text-slate-500 mt-2 mb-6">กรุณาตั้งค่าการเชื่อมต่อในหน้าล็อคอินคุณครู</p>
              </div>
          </div>
      );
  }

  if (isLoading) return <div className="flex flex-col items-center justify-center min-h-[90vh] text-indigo-600 font-prompt"><Loader2 className="animate-spin mb-4" size={48} /><p className="font-black text-xl animate-pulse">กำลังโหลดระบบ...</p></div>;

  if (currentPage === 'teacher-login') return <TeacherLogin onLoginSuccess={handleTeacherLoginSuccess} onBack={() => setCurrentPage('login')} />;
  
  if (currentPage === 'super-admin-dashboard' && currentTeacher) {
      return <SuperAdminDashboard admin={currentTeacher} onLogout={handleLogout} />;
  }

  if (currentPage === 'teacher-dashboard' && currentTeacher) {
      return <TeacherDashboard teacher={currentTeacher} onLogout={handleLogout} onStartGame={() => setCurrentPage('game-setup')} onAdminLoginAsStudent={handleLogin} />;
  }

  if (currentPage === 'game-setup') return <GameSetup onBack={() => setCurrentPage('teacher-dashboard')} onGameCreated={(code) => { setGameRoomCode(code); setCurrentPage('teacher-game'); }} teacher={currentTeacher || undefined}/>;
  
  if (currentPage === 'teacher-game' && currentTeacher) {
      const teacherAsStudent: Student = { id: '99999', name: currentTeacher.name, school: currentTeacher.school, avatar: '👨‍🏫', stars: 0 };
      return <GameMode student={teacherAsStudent} initialRoomCode={gameRoomCode} onExit={() => setCurrentPage('teacher-dashboard')} />;
  }

  if (currentPage === 'login' && !currentUser) return <Login onLogin={handleLogin} onTeacherLoginClick={() => setCurrentPage('teacher-login')} />;

  return (
    <Layout studentName={currentUser?.name} onLogout={handleLogout} isMusicOn={isMusicOn} toggleMusic={() => setIsMusicOn(!isMusicOn)} currentPage={currentPage} onNavigate={setCurrentPage}>
      {(() => {
        switch (currentPage) {
          case 'dashboard':
            return <Dashboard 
                student={currentUser!} 
                assignments={assignments} 
                examResults={examResults} 
                subjects={subjects}
                onNavigate={setCurrentPage} 
                onStartAssignment={(a) => { setCurrentAssignment(a); setSelectedSubject(null); setCurrentPage('practice'); }}
                onSelectSubject={(subConfig) => { setSelectedSubject(subConfig); setCurrentAssignment(null); setCurrentPage('practice'); }}
                onRefreshSubjects={refreshStudentData}
            />;
          case 'custom-exam-setup':
            return <CustomExamSetup 
                studentMajor={currentUser?.major}
                subjects={subjects}
                onBack={() => setCurrentPage('dashboard')}
                onStart={handleStartCustomExam}
            />;
          case 'practice':
          case 'practice-custom': {
            let qList: Question[] = [];
            const isCustom = currentPage === 'practice-custom';
            
            if (isCustom) {
                qList = customExamQuestions;
            } else if (currentAssignment) {
                qList = questions.filter(q => String(q.assignment_id).trim() === String(currentAssignment.id).trim());
                if (currentAssignment.questionCount < qList.length) {
                    qList = qList.slice(0, currentAssignment.questionCount);
                }
            } else if (selectedSubject) {
                const pool = questions.filter(q => {
                    const matchSubject = String(q.subject).trim() === String(selectedSubject.name).trim();
                    const matchGrade = String(q.grade).trim() === String(selectedSubject.grade).trim();
                    const qSchool = String(q.school || '').trim();
                    const subSchool = String(selectedSubject.school || '').trim();
                    const matchSchool = qSchool === subSchool || qSchool === '' || qSchool === '-';
                    const noAssignment = !q.assignment_id || q.assignment_id === '-' || q.assignment_id === '';
                    return matchSubject && matchGrade && matchSchool && noAssignment;
                });

                if (pool.length > 0) {
                    const seenKey = `seen_q_${currentUser?.id}_${selectedSubject.name}`;
                    const seenIds = JSON.parse(localStorage.getItem(seenKey) || '[]');
                    const unseen = pool.filter(q => !seenIds.includes(q.id));
                    const seen = pool.filter(q => seenIds.includes(q.id));
                    const combinedPool = [...unseen.sort(() => 0.5 - Math.random()), ...seen.sort(() => 0.5 - Math.random())];
                    qList = combinedPool.slice(0, 10);
                    const newSeenIds = Array.from(new Set([...qList.map(q => q.id), ...seenIds])).slice(0, 100);
                    localStorage.setItem(seenKey, JSON.stringify(newSeenIds));
                }
            }
            
            return <PracticeMode 
                questions={qList} 
                onFinish={handleFinishExam} 
                onBack={() => { setCurrentPage('dashboard'); setCustomExamQuestions([]); }} 
                assignmentId={currentAssignment ? String(currentAssignment.id) : undefined} 
                category={isCustom ? 'EXAM' : currentAssignment?.category}
            />;
          }
          
          case 'game': return <GameMode student={currentUser!} onExit={() => setCurrentPage('dashboard')} onFinish={(s, t) => handleFinishExam(s, t)}/>;
          case 'results': return <Results score={lastScore?.score || 0} total={lastScore?.total || 0} earnedStars={lastScore?.earnedStars || 0} isHomework={!!lastScore && !lastScore.isExam} onRetry={() => setCurrentPage('dashboard')} onHome={() => setCurrentPage('dashboard')} />;
          case 'stats': return <Stats examResults={examResults} assignments={assignments} studentId={currentUser!.id} subjects={subjects} onBack={() => setCurrentPage('dashboard')} />;
          default: return <Dashboard student={currentUser!} onNavigate={setCurrentPage} />;
        }
      })()}
    </Layout>
  );
};

export default App;
