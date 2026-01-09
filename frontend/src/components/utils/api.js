import axios from 'axios';

// Base API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
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

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH APIs ====================

export const authAPI = {
  // Signup
  signup: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },

  // Login
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Get current user
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Check password strength
  checkPassword: async (password) => {
    const response = await api.post('/auth/check-password', { password });
    return response.data;
  },
};

// ==================== CHAT APIs ====================

export const chatAPI = {
  // Start or get active chat
  startChat: async () => {
    const response = await api.post('/chat/start');
    return response.data;
  },

  // Send message
  sendMessage: async (chatId, message) => {
    const response = await api.post('/chat/message', { chatId, message });
    return response.data;
  },

  // Get chat history
  getChatHistory: async (page = 1, limit = 10) => {
    const response = await api.get(`/chat/history?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get chat messages
  getChatMessages: async (chatId, page = 1, limit = 50) => {
    const response = await api.get(`/chat/${chatId}/messages?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Add reaction
  addReaction: async (messageId, reactionType) => {
    const response = await api.post(`/chat/message/${messageId}/react`, { reactionType });
    return response.data;
  },

  // Delete chat
  deleteChat: async (chatId) => {
    const response = await api.delete(`/chat/${chatId}`);
    return response.data;
  },

  // Export chat
  exportChat: async (chatId, format = 'json') => {
    const response = await api.get(`/chat/${chatId}/export?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

// ==================== ADMIN APIs ====================

export const adminAPI = {
  // Get analytics
  getAnalytics: async () => {
    const response = await api.get('/admin/analytics');
    return response.data;
  },

  // Get all users
  getAllUsers: async (page = 1, limit = 10, search = '', status = 'all') => {
    const response = await api.get(
      `/admin/users?page=${page}&limit=${limit}&search=${search}&status=${status}`
    );
    return response.data;
  },

  // Get user details
  getUserDetails: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  // Deactivate user
  deactivateUser: async (userId) => {
    const response = await api.put(`/admin/users/${userId}/deactivate`);
    return response.data;
  },

  // Activate user
  activateUser: async (userId) => {
    const response = await api.put(`/admin/users/${userId}/activate`);
    return response.data;
  },

  // Delete user
  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // Get system stats
  getSystemStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
};

export default api;