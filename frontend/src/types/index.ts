export type UserRole = 'student' | 'teacher';

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export type ExamStatus = 'open' | 'evaluation' | 'closed';

export interface Exam {
  id: string;
  title: string;
  subject: string;
  description?: string;
  date: string; // ISO date string
  isClosed: boolean;
  closedAt?: string; // ISO date string when manually closed by teacher
  grades?: Record<string, number>; // studentId -> grade
}

export interface Prediction {
  examId: string;
  studentId: string;
  prediction1?: number; // Before exam (1, 1.25, 1.5, ..., 6)
  prediction2?: number; // After exam
  points1?: number; // Points from first prediction
  points2?: number; // Points from second prediction
}

export interface LeaderboardEntry {
  studentId: string;
  studentName: string;
  totalPoints: number;
  rank: number;
}

export interface ClassMembership {
  studentId: string;
  teacherId: string;
  joinedAt: string; // ISO date string
}

export interface ClassRequest {
  id: string;
  studentId: string;
  studentEmail: string;
  studentName: string;
  teacherEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string; // ISO date string
  respondedAt?: string; // ISO date string
}


