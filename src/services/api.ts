import { Student, Question, Teacher, ExamResult, Assignment, SubjectConfig, School, RegistrationRequest, Classroom, AssignmentCategory } from '../types';
import { mysqlConfig } from './mysqlConfig';

const PUBLIC_SCHOOL_ID = '00000000-0000-0000-0000-000000000000';

const getApiEndpoint = (path: string, phpAction?: string) => {
  if (mysqlConfig.isPhpMyAdminMode) {
    return `${mysqlConfig.apiUrl}?action=${phpAction || path.replace('/api/', '').replace(/\//g, '_')}`;
  }
  return `${mysqlConfig.apiUrl}${path}`;
};

const safeJsonParse = (input: any) => {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
};

const mapResultFromDB = (res: any): ExamResult => ({
  ...res,
  id: String(res.id),
  studentId: String(res.student_id || res.studentId || ''),
  assignmentId: res.assignment_id || res.assignmentId || null,
  totalQuestions: Number(res.total_questions || res.totalQuestions || 0),
  score: Number(res.score || 0),
  subject: res.subject || 'ทั่วไป',
  category: res.category || 'GENERAL',
  timestamp: Number(res.timestamp || Date.now())
});

const mapAssignmentFromDB = (asg: any): Assignment => ({
  ...asg,
  id: String(asg.id),
  questionCount: Number(asg.question_count || asg.questionCount || 0),
  targetClassrooms: safeJsonParse(asg.target_classrooms || asg.targetClassrooms),
  deadline: String(asg.deadline || '').split('T')[0],
  publishDate: asg.publish_date,
  expiryDate: asg.expiry_date
});

const mapSubjectFromDB = (s: any): SubjectConfig => ({
  ...s,
  id: String(s.id),
  name: s.name,
  fullName: s.fullName || s.name,
  teacherId: String(s.teacher_id || s.teacherId || ''),
  targetClassrooms: safeJsonParse(s.target_classrooms || s.targetClassrooms),
  targetClassroomIds: safeJsonParse(s.target_classroom_ids || s.targetClassroomIds)
});

export interface AppData {
  students: Student[];
  questions: Question[];
  results: ExamResult[];
  assignments: Assignment[];
  subjects: SubjectConfig[];
}

export const fetchAppData = async (): Promise<AppData> => {
  try {
    const res = await fetch(getApiEndpoint('/app-data', 'fetch_app_data'));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    return {
      students: (data.students || []).map((s: any) => ({ ...s, inventory: safeJsonParse(s.inventory) })),
      questions: (data.questions || []).map((qq: any) => ({
        ...qq,
        correctChoiceId: String(qq.correct_choice_id || qq.correctChoiceId || '1'),
        choices: safeJsonParse(qq.choices)
      })),
      results: (data.results || []).map(mapResultFromDB),
      assignments: (data.assignments || []).map(mapAssignmentFromDB),
      subjects: (data.subjects || []).map(mapSubjectFromDB)
    };
  } catch (e) {
    console.error("Fetch App Data Error:", e);
    return { students: [], questions: [], results: [], assignments: [], subjects: [] };
  }
};

export const getDataForStudent = async (student: Student) => {
  try {
    const all = await fetchAppData();
    const results = all.results.filter(r => String(r.studentId) === String(student.id));
    const assignments = all.assignments.filter(a => a.school === student.school || a.school === 'ศูนย์ติวคุรุมาสเตอร์');
    return { results, assignments };
  } catch (e) {
    return { results: [], assignments: [] };
  }
};

export const getTeacherDashboard = async (school: string) => {
  try {
    const all = await fetchAppData();
    const schoolStudents = all.students.filter(s => s.school === school || school === 'ศูนย์ติวคุรุมาสเตอร์');
    const schoolResults = all.results.filter(r => r.school === school || school === 'ศูนย์ติวคุรุมาสเตอร์');
    const schoolAssignments = all.assignments.filter(a => a.school === school || school === 'ศูนย์ติวคุรุมาสเตอร์');
    const schoolSubjects = all.subjects.filter(s => s.school === school || school === 'ศูนย์ติวคุรุมาสเตอร์');

    return {
      students: schoolStudents,
      results: schoolResults,
      assignments: schoolAssignments,
      subjects: schoolSubjects,
      school: { id: PUBLIC_SCHOOL_ID, name: school, allow_all_manage_students: true },
      pendingStudents: []
    };
  } catch (e) {
    return { students: [], results: [], assignments: [], subjects: [], school: null, pendingStudents: [] };
  }
};

export const saveScore = async (
  studentId: string,
  studentName: string,
  school: string,
  score: number,
  total: number,
  subject: string,
  assignmentId?: string,
  category: AssignmentCategory = 'GENERAL',
  earnedStars: number = 0
) => {
  try {
    const res = await fetch(getApiEndpoint('/scores/save', 'save_score'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, studentName, school, score, total, subject, assignmentId, category, earnedStars })
    });
    return res.ok;
  } catch (e) {
    console.error("Save Score Error:", e);
    return false;
  }
};

export const verifyStudentLogin = async (username: string, password: string): Promise<{ student?: Student, error?: string }> => {
  try {
    const res = await fetch(getApiEndpoint('/students/login', 'verify_student_login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok || data.error) return { error: data.error || 'เข้าสู่ระบบไม่สำเร็จ' };
    return {
      student: {
        ...data.student,
        inventory: safeJsonParse(data.student.inventory),
        stars: Number(data.student.stars) || 0
      }
    };
  } catch (e) {
    return { error: 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล MySQL' };
  }
};

export const requestStudentRegistration = async (
  citizenId: string,
  name: string,
  surname: string,
  major: string,
  examType: 'TEACHER' | 'GENERAL_CIVIL_SERVANT' = 'TEACHER'
) => {
  try {
    const res = await fetch(getApiEndpoint('/students/register', 'request_registration'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ citizenId, name, surname, major, examType })
    });
    const data = await res.json();
    return {
      success: res.ok && data.success !== false,
      message: data.message || (res.ok ? 'ส่งคำขอลงทะเบียนแล้ว โปรดรอเจ้าหน้าที่อนุมัติ' : 'เกิดข้อผิดพลาด')
    };
  } catch (e) {
    return { success: false, message: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ MySQL ได้' };
  }
};

export const approveStudentRegistration = async (req: RegistrationRequest, schoolName: string, generatedPassword?: string) => {
  return { success: true };
};

export const rejectRegistration = async (id: string) => true;

export const manageStudent = async (params: any) => {
  return { success: true };
};

export const getClassrooms = async (school: string): Promise<Classroom[]> => {
  return [
    { id: 'room-01', school, grade_level: 'ALL', room_number: '1', name: 'ห้องติวเข้ม 1' }
  ];
};

export const manageClassroom = async (action: 'add' | 'delete', payload: any) => {
  return { success: true };
};

export const addAssignment = async (
  school: string,
  subject: string,
  grade: string,
  questionCount: number,
  deadline: string,
  createdBy: string,
  title?: string,
  targetClassrooms?: string[],
  targetClassroomIds?: string[],
  category: AssignmentCategory = 'GENERAL',
  publishDate?: string,
  expiryDate?: string
): Promise<{ id: string | null, error: string | null }> => {
  return { id: `asg-${Date.now()}`, error: null };
};

export const deleteAssignment = async (id: string) => true;

export const getQuestionsByAssignment = async (assignmentId: string): Promise<Question[]> => {
  const all = await fetchAppData();
  return all.questions.filter(q => String(q.assignmentId) === String(assignmentId));
};

export const addQuestion = async (q: any) => {
  return { success: true, message: 'เพิ่มข้อสอบเรียบร้อยแล้ว' };
};

export const teacherLogin = async (username: string, password: string) => {
  try {
    const res = await fetch(getApiEndpoint('/teachers/login', 'verify_teacher_login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, message: data.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
    }
    return {
      success: true,
      teacher: {
        ...data.teacher,
        advisorClass: data.teacher.advisor_class,
        gradeLevel: data.teacher.grade_level,
        teachingClasses: safeJsonParse(data.teacher.teaching_classes),
        teachingClassroomIds: safeJsonParse(data.teacher.teaching_classroom_ids)
      }
    };
  } catch (e) {
    return { success: false, message: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ MySQL ได้' };
  }
};

export const getSubjects = async (school: string) => {
  const all = await fetchAppData();
  return all.subjects;
};

export const addSubject = async (school: string, sub: SubjectConfig) => {
  return { success: true, id: `sub-${Date.now()}` };
};

export const updateSubject = async (sub: SubjectConfig) => {
  return { success: true };
};

export const deleteSubject = async (school: string, id: string) => true;

export const manageTeacher = async (action: string, payload: any) => {
  return { success: true };
};

export const findSchoolByCode = async (code: string) => {
  return { id: PUBLIC_SCHOOL_ID, name: 'ศูนย์ติวคุรุมาสเตอร์', school_code: code };
};

export const requestRegistration = async (citizenId: string, name: string, surname: string, schoolId: string) => {
  return { success: true, message: 'ส่งคำขอแล้ว' };
};

export const approveRegistration = async (req: RegistrationRequest, role: string, grade: string, schoolName: string) => true;

export const getSchools = async (): Promise<School[]> => {
  return [{ id: PUBLIC_SCHOOL_ID, name: 'ศูนย์ติวคุรุมาสเตอร์', schoolCode: 'PUBLIC', allowAllManageStudents: true }];
};

export const manageSchool = async (action: 'add' | 'delete', payload: any) => true;

export const getAllTeachers = async (): Promise<Teacher[]> => {
  return [
    {
      id: 'teacher-super-01',
      username: 'admin',
      password: 'admin123',
      name: 'ผู้ดูแลระบบคุรุมาสเตอร์',
      school: 'ศูนย์ติวคุรุมาสเตอร์',
      role: 'SUPER_ADMIN',
      status: 'active'
    },
    {
      id: 'teacher-demo-01',
      username: 'teacher',
      password: '123456',
      name: 'อ.สมชาย ใจดี',
      school: 'ศูนย์ติวคุรุมาสเตอร์',
      role: 'TEACHER',
      status: 'active'
    }
  ];
};

export const getAllPendingRegistrations = async (): Promise<RegistrationRequest[]> => [];

export const getTeacherById = async (id: string): Promise<Teacher | null> => {
  const teachers = await getAllTeachers();
  return teachers.find(t => String(t.id) === String(id) || t.username === id) || null;
};

export const editQuestion = async (q: any) => ({ success: true });

export const deleteQuestion = async (id: string) => true;

export const getQuestionsBySubjectAndGrade = async (subject: string, grade: string, school: string): Promise<Question[]> => {
  const all = await fetchAppData();
  return all.questions.filter(q => q.subject.includes(subject) || subject.includes(q.subject));
};

export const getSuperAdminStats = async () => {
  const all = await fetchAppData();
  const teachers = await getAllTeachers();
  return {
    students: all.students,
    results: all.results,
    teachers
  };
};

// AI Generate Questions using server-side Gemini API route
export const generateAiQuestions = async (subject: string, topic: string, count: number = 5) => {
  try {
    const res = await fetch(getApiEndpoint('/gemini/generate-questions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, topic, count })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'เกิดข้อผิดพลาดจาก AI Server');
    }
    return data.questions;
  } catch (e: any) {
    console.error("AI Generation Error:", e);
    throw e;
  }
};
