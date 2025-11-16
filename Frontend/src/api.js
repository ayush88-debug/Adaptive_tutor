import axios from "axios";

const API_BASE = ""; // empty when using Vite proxy.

const client = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  },
  validateStatus: () => true
});

client.interceptors.response.use(
  (response) => {
    const json = response.data;
    if (!json || typeof json !== "object") {
      return Promise.reject(new Error("Invalid JSON response from server"));
    }
    const httpOk = response.status >= 200 && response.status < 300;
    if (!httpOk || json.success === false) {
      const msg = json.message || "Request failed";
      return Promise.reject(new Error(msg));
    }
    return json.data;
  },
  (error) => {
    if (error.response && error.response.data && error.response.data.message) {
      return Promise.reject(new Error(error.response.data.message));
    }
    return Promise.reject(error);
  }
);

export const signup = (username, email, password) =>
  client.post("/api/v1/auth/signup", { username, email, password });

export const login = (email, password) =>
  client.post("/api/v1/auth/login", { email, password });

export const verifyEmail = (verificationToken, verificationCode) =>
  client.post(
    "/api/v1/auth/verify-email",
    { verificationCode },
    {
      headers: { Authorization: `Bearer ${verificationToken}` }
    }
  );

export const logout = () => client.post("/api/v1/auth/logout");

export const getUser = () => client.get("/api/v1/user/get-user");

export const getSubjects = () => client.get("/api/v1/subjects");

export const enrollInSubject = (subjectId) => client.post(`/api/v1/progress/enroll/${subjectId}`);

export const getStudentProgress = (subjectId) => client.get(`/api/v1/progress/subject/${subjectId}`);

export const getModule = (moduleId) => client.get(`/api/v1/modules/${moduleId}`);

export const submitQuiz = (moduleId, answers) => 
  client.post(`/api/v1/quizzes/${moduleId}/submit`, { answers });

export const getAttemptHistory = (userId) => client.get(`/api/v1/attempts/user/${userId}`);

export const executeCode = (language, sourceCode, stdin) => client.post("/api/v1/code/execute", { language, sourceCode, stdin });

// ... (Teacher)
export const getStudentsProgress = () => client.get("/api/v1/admin/students-progress");
export const getStudentDetails = (studentId) => client.get(`/api/v1/admin/student/${studentId}`);
export const getClassAnalytics = () => client.get("/api/v1/admin/class-analytics");
export const getChallengingModules = (subjectId = '') => client.get(`/api/v1/admin/analytics/challenging-modules?subjectId=${subjectId}`);

export const generateReport = (studentId, subjectId) => client.post('/api/v1/reports/generate', { userId: studentId, subjectId });
export const getReports = (studentId) => client.get(`/api/v1/reports/user/${studentId}`);