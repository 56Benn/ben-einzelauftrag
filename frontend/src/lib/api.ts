const API_BASE_URL = 'http://localhost:8080/api';

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  type?: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      timestamp: new Date().toISOString(),
      status: response.status,
      error: 'Error',
      message: response.statusText,
    }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// User API
export const userApi = {
  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  async getAllUsers() {
    const response = await fetch(`${API_BASE_URL}/users`);
    return handleResponse(response);
  },

  async getUserById(id: string) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`);
    return handleResponse(response);
  },

  async getUserByEmail(email: string) {
    const response = await fetch(`${API_BASE_URL}/users/email/${encodeURIComponent(email)}`);
    return handleResponse(response);
  },
};

// Exam API
export const examApi = {
  async getAllExams() {
    const response = await fetch(`${API_BASE_URL}/exams`);
    return handleResponse(response);
  },

  async getPendingExams() {
    const response = await fetch(`${API_BASE_URL}/exams/pending`);
    return handleResponse(response);
  },

  async getGradedExams() {
    const response = await fetch(`${API_BASE_URL}/exams/graded`);
    return handleResponse(response);
  },

  async getExamById(id: string) {
    const response = await fetch(`${API_BASE_URL}/exams/${id}`);
    return handleResponse(response);
  },

  async createExam(exam: any) {
    const response = await fetch(`${API_BASE_URL}/exams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exam),
    });
    return handleResponse(response);
  },

  async updateExam(id: string, exam: any) {
    const response = await fetch(`${API_BASE_URL}/exams/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exam),
    });
    return handleResponse(response);
  },

  async closeExam(id: string) {
    const response = await fetch(`${API_BASE_URL}/exams/${id}/close`, {
      method: 'PUT',
    });
    return handleResponse(response);
  },

  async deleteExam(id: string) {
    const response = await fetch(`${API_BASE_URL}/exams/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete exam: ${response.statusText}`);
    }
  },
};

// Prediction API
export const predictionApi = {
  async getAllPredictions() {
    const response = await fetch(`${API_BASE_URL}/predictions`);
    return handleResponse(response);
  },

  async getPredictionById(id: string) {
    const response = await fetch(`${API_BASE_URL}/predictions/${id}`);
    return handleResponse(response);
  },

  async getPredictionByExamAndStudent(examId: string, studentId: string) {
    const response = await fetch(`${API_BASE_URL}/predictions/exam/${examId}/student/${studentId}`);
    if (response.status === 404) {
      return null;
    }
    return handleResponse(response);
  },

  async getPredictionsByExam(examId: string) {
    const response = await fetch(`${API_BASE_URL}/predictions/exam/${examId}`);
    return handleResponse(response);
  },

  async getPredictionsByStudent(studentId: string) {
    const response = await fetch(`${API_BASE_URL}/predictions/student/${studentId}`);
    return handleResponse(response);
  },

  async createOrUpdatePrediction(examId: string, studentId: string, prediction: any) {
    const response = await fetch(`${API_BASE_URL}/predictions/exam/${examId}/student/${studentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prediction),
    });
    return handleResponse(response);
  },

  async deletePrediction(id: string) {
    const response = await fetch(`${API_BASE_URL}/predictions/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete prediction: ${response.statusText}`);
    }
  },
};

