import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (userData: { username: string; email: string; password: string; role: string }) => api.post('/auth/register', userData),
  login: (credentials: { email: string; password: string }) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
};

// Fields API calls
export const fieldsAPI = {
  getAll: () => api.get('/fields'),
  getById: (id: number | string) => api.get(`/fields/${id}`),
  create: (fieldData: { name: string; crop_type: string; planting_date: string; assigned_agent_id?: number | null }) => api.post('/fields', fieldData),
  update: (id: number | string, fieldData: { name: string; crop_type: string; planting_date: string; assigned_agent_id?: number | null }) => api.put(`/fields/${id}`, fieldData),
  delete: (id: number | string) => api.delete(`/fields/${id}`),
  updateStage: (id: number | string, stageData: { stage: string; notes?: string }) => api.put(`/fields/${id}/stage`, stageData),
  getUpdates: (id: number | string) => api.get(`/fields/${id}/updates`),
  getDashboardStats: () => api.get('/fields/stats/dashboard'),
};

// Users API calls
export const usersAPI = {
  getAgents: () => api.get('/users/agents'),
};

export default api;
