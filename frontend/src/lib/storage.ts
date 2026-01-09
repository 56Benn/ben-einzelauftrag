import { User, Exam, Prediction, ClassMembership, ClassRequest } from '@/types';

const STORAGE_KEYS = {
  USERS: 'app_users',
  EXAMS: 'app_exams',
  PREDICTIONS: 'app_predictions',
  CURRENT_USER: 'app_current_user',
  RECENT_USERS: 'app_recent_users',
  SUBJECTS: 'app_subjects',
  CLASS_MEMBERSHIPS: 'app_class_memberships',
  CLASS_REQUESTS: 'app_class_requests',
} as const;

// Initialize default data
export function initializeStorage() {
  // Initialize users if not exists
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const defaultUsers: User[] = [
      {
        id: '1',
        username: 'Schüler1',
        email: 'schueler1@test.ch',
        password: 'schueler1',
        role: 'student',
      },
      {
        id: '2',
        username: 'Schüler2',
        email: 'schueler2@test.ch',
        password: 'schueler2',
        role: 'student',
      },
      {
        id: '3',
        username: 'Lehrer',
        email: 'lehrer@test.ch',
        password: 'lehrer',
        role: 'teacher',
      },
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
  }

  // Initialize exams if not exists
  if (!localStorage.getItem(STORAGE_KEYS.EXAMS)) {
    const defaultExams: Exam[] = [
      {
        id: '1',
        title: 'Proportionalität',
        subject: 'Mathematik',
        description: 'Prüfung über Proportionalität',
        date: '2025-11-06',
        isClosed: false,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(defaultExams));
  }

  // Initialize predictions if not exists
  if (!localStorage.getItem(STORAGE_KEYS.PREDICTIONS)) {
    localStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify([]));
  }

  // Initialize subjects from existing exams
  if (!localStorage.getItem(STORAGE_KEYS.SUBJECTS)) {
    const exams = getExams();
    const subjects = [...new Set(exams.map(e => e.subject))];
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
  } else {
    // Clean up subjects that don't have exams
    cleanupSubjects();
  }

  // Initialize class memberships
  if (!localStorage.getItem(STORAGE_KEYS.CLASS_MEMBERSHIPS)) {
    localStorage.setItem(STORAGE_KEYS.CLASS_MEMBERSHIPS, JSON.stringify([]));
  }

  // Initialize class requests
  if (!localStorage.getItem(STORAGE_KEYS.CLASS_REQUESTS)) {
    localStorage.setItem(STORAGE_KEYS.CLASS_REQUESTS, JSON.stringify([]));
  }
}

// Subject operations
export function getSubjects(): string[] {
  const data = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
  return data ? JSON.parse(data) : [];
}

export function addSubject(subject: string) {
  const subjects = getSubjects();
  if (!subjects.includes(subject)) {
    subjects.push(subject);
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
  }
}

export function cleanupSubjects() {
  const exams = getExams();
  if (exams.length === 0) {
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify([]));
    return;
  }
  
  const examSubjects = new Set(exams.map(e => e.subject));
  const subjects = getSubjects();
  const validSubjects = subjects.filter(s => examSubjects.has(s));
  localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(validSubjects));
}

// User operations
export function getUsers(): User[] {
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : [];
}

export function getUserByEmail(email: string): User | null {
  const users = getUsers();
  return users.find(u => u.email === email) || null;
}

export function getCurrentUser(): User | null {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
}

export function setCurrentUser(user: User | null) {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    addRecentUser(user);
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

// Recent users for quick login
export function getRecentUsers(): User[] {
  const data = localStorage.getItem(STORAGE_KEYS.RECENT_USERS);
  return data ? JSON.parse(data) : [];
}

export function addRecentUser(user: User) {
  const recent = getRecentUsers();
  const filtered = recent.filter(u => u.id !== user.id);
  const updated = [user, ...filtered].slice(0, 3); // Keep max 3 recent users
  localStorage.setItem(STORAGE_KEYS.RECENT_USERS, JSON.stringify(updated));
}

// Exam operations
export function getExams(): Exam[] {
  const data = localStorage.getItem(STORAGE_KEYS.EXAMS);
  const exams = data ? JSON.parse(data) : [];
  
  // Auto-close exams after 5 days from exam date
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  let hasUpdates = false;
  
  exams.forEach((exam: Exam) => {
    if (!exam.isClosed) {
      const examDate = new Date(exam.date);
      examDate.setHours(0, 0, 0, 0);
      const daysSinceExam = Math.floor((now.getTime() - examDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceExam >= 5) {
        exam.isClosed = true;
        exam.closedAt = exam.closedAt || new Date().toISOString();
        hasUpdates = true;
      }
    }
  });
  
  if (hasUpdates) {
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
  }
  
  return exams;
}

export function getExamById(id: string): Exam | null {
  const exams = getExams();
  return exams.find(e => e.id === id) || null;
}

export function saveExam(exam: Exam) {
  const exams = getExams();
  const index = exams.findIndex(e => e.id === exam.id);
  
  // Set closedAt timestamp when manually closed
  if (exam.isClosed && !exam.closedAt) {
    exam.closedAt = new Date().toISOString();
  }
  
  // Auto-close if 5 days have passed since exam date
  if (!exam.isClosed) {
    const examDate = new Date(exam.date);
    examDate.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const daysSinceExam = Math.floor((now.getTime() - examDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceExam >= 5) {
      exam.isClosed = true;
      exam.closedAt = new Date().toISOString();
    }
  }
  
  if (index >= 0) {
    exams[index] = exam;
  } else {
    exams.push(exam);
  }
  localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
  // Add subject if it doesn't exist
  addSubject(exam.subject);
}

export function deleteExam(id: string) {
  const exams = getExams();
  const filtered = exams.filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(filtered));
  cleanupSubjects();
}

// Prediction operations
export function getPredictions(): Prediction[] {
  const data = localStorage.getItem(STORAGE_KEYS.PREDICTIONS);
  return data ? JSON.parse(data) : [];
}

export function getPrediction(examId: string, studentId: string): Prediction | null {
  const predictions = getPredictions();
  return predictions.find(p => p.examId === examId && p.studentId === studentId) || null;
}

export function savePrediction(prediction: Prediction) {
  const predictions = getPredictions();
  const index = predictions.findIndex(
    p => p.examId === prediction.examId && p.studentId === prediction.studentId
  );
  if (index >= 0) {
    predictions[index] = prediction;
  } else {
    predictions.push(prediction);
  }
  localStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify(predictions));
}

// Class Membership operations
export function getClassMemberships(): ClassMembership[] {
  const data = localStorage.getItem(STORAGE_KEYS.CLASS_MEMBERSHIPS);
  return data ? JSON.parse(data) : [];
}

export function getClassMembershipsByTeacher(teacherId: string): ClassMembership[] {
  return getClassMemberships().filter(m => m.teacherId === teacherId);
}

export function getClassMembershipsByStudent(studentId: string): ClassMembership[] {
  return getClassMemberships().filter(m => m.studentId === studentId);
}

export function isStudentInClass(studentId: string, teacherId: string): boolean {
  return getClassMemberships().some(
    m => m.studentId === studentId && m.teacherId === teacherId
  );
}

export function addStudentToClass(studentId: string, teacherId: string) {
  const memberships = getClassMemberships();
  if (!memberships.some(m => m.studentId === studentId && m.teacherId === teacherId)) {
    memberships.push({
      studentId,
      teacherId,
      joinedAt: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEYS.CLASS_MEMBERSHIPS, JSON.stringify(memberships));
  }
}

export function removeStudentFromClass(studentId: string, teacherId: string) {
  const memberships = getClassMemberships();
  const filtered = memberships.filter(
    m => !(m.studentId === studentId && m.teacherId === teacherId)
  );
  localStorage.setItem(STORAGE_KEYS.CLASS_MEMBERSHIPS, JSON.stringify(filtered));
}

// Class Request operations
export function getClassRequests(): ClassRequest[] {
  const data = localStorage.getItem(STORAGE_KEYS.CLASS_REQUESTS);
  return data ? JSON.parse(data) : [];
}

export function getClassRequestsByTeacher(teacherEmail: string): ClassRequest[] {
  return getClassRequests().filter(r => r.teacherEmail === teacherEmail);
}

export function getClassRequestsByStudent(studentId: string): ClassRequest[] {
  return getClassRequests().filter(r => r.studentId === studentId);
}

export function createClassRequest(
  studentId: string,
  studentEmail: string,
  studentName: string,
  teacherEmail: string
): ClassRequest {
  const requests = getClassRequests();
  // Check if request already exists
  const existingRequest = requests.find(
    r => r.studentId === studentId && r.teacherEmail === teacherEmail && r.status === 'pending'
  );
  if (existingRequest) {
    return existingRequest;
  }
  
  const newRequest: ClassRequest = {
    id: Date.now().toString(),
    studentId,
    studentEmail,
    studentName,
    teacherEmail,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  requests.push(newRequest);
  localStorage.setItem(STORAGE_KEYS.CLASS_REQUESTS, JSON.stringify(requests));
  return newRequest;
}

export function updateClassRequest(
  requestId: string,
  status: 'approved' | 'rejected',
  teacherId: string
) {
  const requests = getClassRequests();
  const index = requests.findIndex(r => r.id === requestId);
  if (index >= 0) {
    requests[index].status = status;
    requests[index].respondedAt = new Date().toISOString();
    
    if (status === 'approved') {
      // Automatically add student to class
      const student = getUserByEmail(requests[index].studentEmail);
      if (student) {
        addStudentToClass(student.id, teacherId);
      }
    }
    
    localStorage.setItem(STORAGE_KEYS.CLASS_REQUESTS, JSON.stringify(requests));
  }
}

// Initialize default class memberships after all functions are defined
function initializeDefaultClassMemberships() {
  try {
    const allUsers = getUsers();
    const teacher = allUsers.find(u => u.role === 'teacher');
    const students = allUsers.filter(u => u.role === 'student');
    
    if (teacher && students.length > 0) {
      const existingMemberships = getClassMemberships();
      let updated = false;
      
      students.forEach(student => {
        const exists = existingMemberships.some(m => m.studentId === student.id && m.teacherId === teacher.id);
        if (!exists) {
          existingMemberships.push({
            studentId: student.id,
            teacherId: teacher.id,
            joinedAt: new Date().toISOString(),
          });
          updated = true;
        }
      });
      
      if (updated) {
        localStorage.setItem(STORAGE_KEYS.CLASS_MEMBERSHIPS, JSON.stringify(existingMemberships));
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error initializing default class memberships:', error);
    }
  }
}

// Call initializeStorage on module load
try {
  initializeStorage();
  // Initialize default class memberships after storage is set up
  // Use setTimeout to ensure all functions are defined
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      initializeDefaultClassMemberships();
    }, 0);
  }
} catch (error) {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error initializing storage:', error);
  }
}
