
export interface Student {
  id: string;
  name: string;
  school?: string; 
  avatar: string; 
  stars: number;
  login_count?: number;
  last_login?: number;
  inventory?: string[]; 
  grade?: string;
  classroom?: string;
  status?: 'pending' | 'active' | 'rejected' | 'suspended';
  created_at?: string;
  major?: string;
  exam_type?: 'TEACHER';
}

export interface Teacher {
  id?: string | number; 
  username?: string;
  password?: string;
  name: string;
  school: string;
  role?: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER'; 
  position?: string; 
  advisorClass?: string;
  gradeLevel?: string;
  teachingClasses?: string[];
  teachingClassroomIds?: string[];
  status?: string;
  login_count?: number;
  citizen_id?: string;
}

export interface School {
  id: string;
  name: string;
  schoolCode: string; 
  allowAllManageStudents?: boolean;
}

export type Subject = string;

export interface Question {
  id: string;
  subject: Subject;
  subjectId?: string;
  text: string;
  image?: string;
  choices: {
    id: string;
    text: string;
    image?: string;
  }[];
  correctChoiceId: string;
  explanation: string;
  category?: AssignmentCategory;
  school?: string;
  grade?: string;
  assignment_id?: string;
}

export type AssignmentCategory = 'PART_A' | 'PART_B' | 'PART_B_PROFESSIONAL' | 'PART_B_LAWS' | 'MAJOR' | 'EXAM' | 'PROFESSIONAL';

export interface ExamResult {
  id: string;
  studentId: string;
  subject: Subject;
  subjectId?: string;
  score: number;
  totalQuestions: number;
  timestamp: number;
  assignmentId?: string | null;
  category?: AssignmentCategory;
  school?: string;
}

export interface Assignment {
  id: string;
  school: string;
  subject: Subject;
  subjectId?: string;
  questionCount: number;
  deadline: string; 
  createdBy: string;
  title?: string;
  category?: AssignmentCategory; 
  grade?: string;
  targetClassrooms?: string[];
  targetClassroomIds?: string[];
  publishDate?: string; 
  expiryDate?: string;
}

export interface SubjectConfig {
  id: string;
  name: string; 
  fullName: string; 
  school: string;
  teacherId: string;
  grade: string; 
  icon: string;
  color: string;
  targetClassrooms?: string[];
  targetClassroomIds?: string[];
}

export interface RegistrationRequest {
  id: string;
  citizenId: string;
  name: string;
  surname: string;
  schoolId: string;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
  type?: 'TEACHER' | 'STUDENT'; 
  avatar?: string;
  major?: string;
  exam_type?: 'TEACHER';
}

export interface Classroom {
  id: string;
  school: string;
  grade_level: string;
  room_number: string;
  name: string;
}

export interface Reward {
  id: string;
  name: string;
  cost: number;
  icon: string;
  description: string;
  category: string;
}
