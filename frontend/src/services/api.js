const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://examforge-backend-cx6p.onrender.com/api'
    : 'http://localhost:5000/api')
).replace(/\/+$/, '');

const TOKEN_KEY = 'examforge_token';
const USER_KEY = 'examforge_user';

export const authStorage = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  },
  getUser() {
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setUser(user) {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY);
  }
};

async function handleResponse(response) {
  if (response.status === 401) {
    authStorage.clear();
  }

  if (!response.ok) {
    let errorDetail = 'Network request failed';
    let errorObj = null;
    try {
      const errorData = await response.json();
      errorDetail = errorData.error || errorData.message || JSON.stringify(errorData);
      errorObj = errorData;
    } catch {
      errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    }
    const err = new Error(errorDetail);
    if (errorObj) {
      err.data = errorObj;
    }
    throw err;
  }
  return response.json();
}

function getAuthHeaders(isFormData = false) {
  const token = authStorage.getToken();
  const headers = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Authentication endpoints
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await handleResponse(res);
    if (data.token) {
      authStorage.setToken(data.token);
      authStorage.setUser(data.user);
    }
    return data;
  },

  async register(email, password, full_name, role = 'teacher') {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name, role })
    });
    const data = await handleResponse(res);
    if (data.token) {
      authStorage.setToken(data.token);
      authStorage.setUser(data.user);
    }
    return data;
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  logout() {
    authStorage.clear();
  },

  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse(res);
  },

  async getDashboardStats() {
    const res = await fetch(`${API_BASE}/dashboard/stats`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Tamil Nadu State Board Curriculum
  async getCurriculumClasses() {
    const res = await fetch(`${API_BASE}/curriculum/classes`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getCurriculumSubjects(classGrade) {
    const res = await fetch(`${API_BASE}/curriculum/subjects?class_grade=${encodeURIComponent(classGrade)}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getCurriculumChapters(classGrade, subject) {
    const res = await fetch(
      `${API_BASE}/curriculum/chapters?class_grade=${encodeURIComponent(classGrade)}&subject=${encodeURIComponent(subject)}`,
      {
        headers: getAuthHeaders()
      }
    );
    return handleResponse(res);
  },

  // Admin: Staff Management
  async getStaff() {
    const res = await fetch(`${API_BASE}/admin/staff`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async createStaff(data) {
    const res = await fetch(`${API_BASE}/admin/staff`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateStaff(id, data) {
    const res = await fetch(`${API_BASE}/admin/staff/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async resetStaffPassword(id, password) {
    const res = await fetch(`${API_BASE}/admin/staff/${id}/reset-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ password })
    });
    return handleResponse(res);
  },

  async deleteStaff(id) {
    const res = await fetch(`${API_BASE}/admin/staff/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Admin: Dataset Management
  async uploadDataset(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/admin/datasets/upload`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData
    });
    return handleResponse(res);
  },

  async getDatasets() {
    const res = await fetch(`${API_BASE}/admin/datasets`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getDataset(id) {
    const res = await fetch(`${API_BASE}/admin/datasets/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async validateDataset(id, columnMapping, defaultClass = null) {
    const res = await fetch(`${API_BASE}/admin/datasets/${id}/validate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ column_mapping: columnMapping, default_class: defaultClass })
    });
    return handleResponse(res);
  },

  async importDatasetToQuestionBank(id) {
    const res = await fetch(`${API_BASE}/admin/datasets/${id}/import`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Admin: Model Training & Evaluation (Random Forest)
  async trainRandomForestModel(payload) {
    const res = await fetch(`${API_BASE}/admin/models/train`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async getModelVersions(task = '') {
    const q = task ? `?task=${encodeURIComponent(task)}` : '';
    const res = await fetch(`${API_BASE}/admin/models/versions${q}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async activateModelVersion(id) {
    const res = await fetch(`${API_BASE}/admin/models/${id}/activate`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getModelEvaluation() {
    const res = await fetch(`${API_BASE}/models/evaluation`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getModelStatus() {
    const res = await fetch(`${API_BASE}/models/status`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getAdminOverview() {
    const res = await fetch(`${API_BASE}/admin/overview`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Question Bank
  async getQuestions(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const res = await fetch(`${API_BASE}/questions?${query.toString()}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getQuestionFilters(classGrade = '') {
    const q = classGrade ? `?class_grade=${encodeURIComponent(classGrade)}` : '';
    const res = await fetch(`${API_BASE}/questions/filters${q}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async createQuestion(data) {
    const res = await fetch(`${API_BASE}/questions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async classifyQuestion(text) {
    const res = await fetch(`${API_BASE}/classify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ question: text, text })
    });
    return handleResponse(res);
  },

  // Question Paper Generation
  async previewPaper(payload) {
    const res = await fetch(`${API_BASE}/generate-paper/preview`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async generatePaper(payload) {
    const res = await fetch(`${API_BASE}/generate-paper`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async getHistory() {
    const res = await fetch(`${API_BASE}/history`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getPaperDetails(paperId) {
    const res = await fetch(`${API_BASE}/papers/${paperId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  getPaperDownloadUrl(paperId) {
    const token = authStorage.getToken();
    const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${API_BASE}/papers/${paperId}/download${tokenQuery}`;
  },

  async downloadPaperPdf(paperId, filename = null) {
    const res = await fetch(`${API_BASE}/papers/${paperId}/download`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      let msg = 'Failed to download PDF';
      try {
        const err = await res.json();
        msg = err.error || err.message || msg;
      } catch { }
      throw new Error(msg);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `examforge_paper_${paperId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Chairman Institutional Governance Endpoints
  async getChairmanPrincipals() {
    const res = await fetch(`${API_BASE}/chairman/principals`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async createChairmanPrincipal(data) {
    const res = await fetch(`${API_BASE}/chairman/principals`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateChairmanPrincipal(id, data) {
    const res = await fetch(`${API_BASE}/chairman/principals/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async resetChairmanPrincipalPassword(id, password) {
    const res = await fetch(`${API_BASE}/chairman/principals/${id}/reset-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ password })
    });
    return handleResponse(res);
  },

  async getChairmanTeacherStats() {
    const res = await fetch(`${API_BASE}/chairman/teacher-stats`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Principal Faculty & Subject Management Endpoints
  async getPrincipalTeachers() {
    const res = await fetch(`${API_BASE}/principal/teachers`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async createPrincipalTeacher(data) {
    const res = await fetch(`${API_BASE}/principal/teachers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updatePrincipalTeacher(id, data) {
    const res = await fetch(`${API_BASE}/principal/teachers/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async resetPrincipalTeacherPassword(id, password) {
    const res = await fetch(`${API_BASE}/principal/teachers/${id}/reset-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ password })
    });
    return handleResponse(res);
  },

  // Admin: EduBloom Dataset Pipeline & Candidate Models
  async validateEduBloomDataset() {
    const res = await fetch(`${API_BASE}/admin/edubloom/validate`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async trainEduBloomCandidateModel(payload = {}) {
    const res = await fetch(`${API_BASE}/admin/edubloom/train-candidate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async stageEduBloomQuestions(payload = {}) {
    const res = await fetch(`${API_BASE}/admin/edubloom/stage-questions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async getEduBloomSummary() {
    const res = await fetch(`${API_BASE}/admin/edubloom/summary`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Admin: Combined Training Dataset & Candidate Models
  async buildCombinedDataset(forceRebuild = true) {
    const res = await fetch(`${API_BASE}/admin/datasets/merge-combined`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ force_rebuild: forceRebuild })
    });
    return handleResponse(res);
  },

  async getCombinedDatasetSummary() {
    const res = await fetch(`${API_BASE}/admin/datasets/combined-summary`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async trainCombinedCandidateModel(payload = {}) {
    const res = await fetch(`${API_BASE}/admin/combined/train-candidate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  }
};

