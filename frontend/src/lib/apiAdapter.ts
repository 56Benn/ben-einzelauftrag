import { userApi, examApi, predictionApi } from './api';
import { User, Exam, Prediction } from '@/types';

// Adapter functions to convert between backend (Long IDs) and frontend (String IDs) formats

export const apiAdapter = {
  // Convert backend User to frontend User
  userToFrontend(backendUser: any): User {
    return {
      id: String(backendUser.id),
      username: backendUser.username,
      email: backendUser.email,
      password: backendUser.password || '',
      role: backendUser.role?.toLowerCase() === 'teacher' ? 'teacher' : 'student',
    };
  },

  // Convert frontend User to backend User
  userToBackend(frontendUser: User): any {
    return {
      id: frontendUser.id ? Number(frontendUser.id) : undefined,
      username: frontendUser.username,
      email: frontendUser.email,
      password: frontendUser.password,
      role: frontendUser.role.toUpperCase(),
    };
  },

  // Convert backend Exam to frontend Exam
  examToFrontend(backendExam: any): Exam {
    const grades: Record<string, number> = {};
    if (backendExam.grades) {
      Object.keys(backendExam.grades).forEach((key) => {
        grades[String(key)] = backendExam.grades[key];
      });
    }
    return {
      id: String(backendExam.id),
      title: backendExam.title,
      subject: backendExam.subject,
      description: backendExam.description,
      date: backendExam.date,
      isClosed: backendExam.isClosed || false,
      grades,
    };
  },

  // Convert frontend Exam to backend Exam
  examToBackend(frontendExam: Exam): any {
    const grades: Record<number, number> = {};
    if (frontendExam.grades) {
      Object.keys(frontendExam.grades).forEach((key) => {
        grades[Number(key)] = frontendExam.grades![key];
      });
    }
    return {
      id: frontendExam.id ? Number(frontendExam.id) : undefined,
      title: frontendExam.title,
      subject: frontendExam.subject,
      description: frontendExam.description,
      date: frontendExam.date,
      isClosed: frontendExam.isClosed,
      grades,
    };
  },

  // Convert backend Prediction to frontend Prediction
  predictionToFrontend(backendPrediction: any): Prediction {
    return {
      examId: String(backendPrediction.exam?.id || backendPrediction.examId),
      studentId: String(backendPrediction.student?.id || backendPrediction.studentId),
      prediction1: backendPrediction.prediction1,
      prediction2: backendPrediction.prediction2,
      points1: backendPrediction.points1,
      points2: backendPrediction.points2,
    };
  },

  // Convert frontend Prediction to backend Prediction
  predictionToBackend(frontendPrediction: Prediction): any {
    return {
      prediction1: frontendPrediction.prediction1,
      prediction2: frontendPrediction.prediction2,
      points1: frontendPrediction.points1,
      points2: frontendPrediction.points2,
    };
  },
};

// Wrapper functions that use the adapter
export const api = {
  // User API
  async login(email: string, password: string): Promise<User> {
    const backendUser = await userApi.login(email, password);
    return apiAdapter.userToFrontend(backendUser);
  },

  async getAllUsers(): Promise<User[]> {
    const backendUsers = await userApi.getAllUsers();
    return backendUsers.map((u: any) => apiAdapter.userToFrontend(u));
  },

  async getUserById(id: string): Promise<User> {
    const backendUser = await userApi.getUserById(id);
    return apiAdapter.userToFrontend(backendUser);
  },

  async getUserByEmail(email: string): Promise<User> {
    const backendUser = await userApi.getUserByEmail(email);
    return apiAdapter.userToFrontend(backendUser);
  },

  // Exam API
  async getAllExams(): Promise<Exam[]> {
    const backendExams = await examApi.getAllExams();
    return backendExams.map((e: any) => apiAdapter.examToFrontend(e));
  },

  async getPendingExams(): Promise<Exam[]> {
    const backendExams = await examApi.getPendingExams();
    return backendExams.map((e: any) => apiAdapter.examToFrontend(e));
  },

  async getGradedExams(): Promise<Exam[]> {
    const backendExams = await examApi.getGradedExams();
    return backendExams.map((e: any) => apiAdapter.examToFrontend(e));
  },

  async getExamById(id: string): Promise<Exam> {
    const backendExam = await examApi.getExamById(id);
    return apiAdapter.examToFrontend(backendExam);
  },

  async createExam(exam: Exam): Promise<Exam> {
    const backendExam = apiAdapter.examToBackend(exam);
    const created = await examApi.createExam(backendExam);
    return apiAdapter.examToFrontend(created);
  },

  async updateExam(id: string, exam: Exam): Promise<Exam> {
    const backendExam = apiAdapter.examToBackend(exam);
    const updated = await examApi.updateExam(id, backendExam);
    return apiAdapter.examToFrontend(updated);
  },

  async closeExam(id: string): Promise<Exam> {
    const backendExam = await examApi.closeExam(id);
    return apiAdapter.examToFrontend(backendExam);
  },

  async deleteExam(id: string): Promise<void> {
    await examApi.deleteExam(id);
  },

  // Prediction API
  async getAllPredictions(): Promise<Prediction[]> {
    const backendPredictions = await predictionApi.getAllPredictions();
    return backendPredictions.map((p: any) => apiAdapter.predictionToFrontend(p));
  },

  async getPredictionByExamAndStudent(examId: string, studentId: string): Promise<Prediction | null> {
    const backendPrediction = await predictionApi.getPredictionByExamAndStudent(examId, studentId);
    if (!backendPrediction) return null;
    return apiAdapter.predictionToFrontend(backendPrediction);
  },

  async getPredictionsByExam(examId: string): Promise<Prediction[]> {
    const backendPredictions = await predictionApi.getPredictionsByExam(examId);
    return backendPredictions.map((p: any) => apiAdapter.predictionToFrontend(p));
  },

  async getPredictionsByStudent(studentId: string): Promise<Prediction[]> {
    const backendPredictions = await predictionApi.getPredictionsByStudent(studentId);
    return backendPredictions.map((p: any) => apiAdapter.predictionToFrontend(p));
  },

  async createOrUpdatePrediction(examId: string, studentId: string, prediction: Prediction): Promise<Prediction> {
    const backendPrediction = apiAdapter.predictionToBackend(prediction);
    const created = await predictionApi.createOrUpdatePrediction(examId, studentId, backendPrediction);
    return apiAdapter.predictionToFrontend(created);
  },
};

