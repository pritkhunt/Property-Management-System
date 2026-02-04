import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable CORS with credentials for .NET backend
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
      // Only redirect to login if user was authenticated (had a token)
      const hadToken = !!localStorage.getItem('token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect if user was logged in, not for public page API failures
      if (hadToken) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Authentication APIs
export const authAPI = {
  // User registration and authentication
  registerUser: (data) => api.post('/auth/register-user', data),
  registerAgent: (data) => api.post('/auth/register-agent', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  
  // Profile management
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  uploadProfilePicture: (formData) => api.post('/auth/profile/upload-picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updatePassword: (data) => api.put('/auth/profile/update-password', data),
  
  // OTP management
  sendOtp: (email) => api.post('/auth/resend-otp', { Email: email }),
  resendOtp: (email) => api.post('/auth/resend-otp', { Email: email }),
  resetPassword: (email, newPassword) => api.post('/auth/reset-password', { email, newPassword }),
};

// Property APIs
export const propertyAPI = {
  getProperties: async (params) => {
    const response = await api.get('/properties', { params });
    // Ensure consistent response format
    if (Array.isArray(response.data)) {
      // If backend returns array, wrap it in expected format
      return {
        ...response,
        data: {
          properties: response.data,
          currentPage: 1,
          totalPages: 1,
          totalItems: response.data.length,
          itemsPerPage: 12
        }
      };
    }
    return response;
  },
  getPropertyById: (id) => api.get(`/properties/${id}`),
  createProperty: (formData) => 
    api.post('/properties', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  updateProperty: (id, data) => api.put(`/properties/${id}`, data),
  deleteProperty: (id) => api.delete(`/properties/${id}`),
  getAgentProperties: () => api.get('/properties/agent/my-properties'),
  uploadPropertyImages: (id, formData) => 
    api.post(`/properties/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  // Approval endpoints
  ownerApproveProperty: (id, data) => api.post(`/properties/${id}/owner-approval`, data),
  adminApproveProperty: (id, data) => api.post(`/properties/${id}/admin-approval`, data),
  getPendingOwnerApproval: () => api.get('/properties/pending-owner-approval'),
  getPendingAdminApproval: () => api.get('/properties/pending-admin-approval'),
  getOwnerProperties: () => api.get('/properties/owner/my-properties'),
  getAdminAllProperties: () => api.get('/properties/admin/all-properties'),
  // Other endpoints
  likeProperty: (id) => api.post(`/properties/${id}/like`),
  unlikeProperty: (id) => api.delete(`/properties/${id}/like`),
  getMyProperties: () => api.get('/properties/my-properties'),
  getFeaturedProperties: () => api.get('/properties/featured'),
  getPropertyTypes: () => api.get('/properties/types'),
  searchProperties: (query) => api.get(`/properties/search?q=${query}`),
};

// User APIs
export const userAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  suspendUser: (id, suspend) => api.post(`/users/${id}/suspend`, { suspend }),
  getUserProfile: () => api.get('/users/profile'),
  updateUserProfile: (data) => api.put('/users/profile', data),
  uploadProfilePicture: (formData) => 
    api.post('/users/profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  getSavedProperties: () => api.get('/properties/liked'),
  getSellers: () => api.get('/users/sellers'),
  getAllUsers: () => api.get('/users'),
};

// Agent APIs
export const agentAPI = {
  getAgents: (params) => api.get('/agents', { params }),
  getAgentById: (id) => api.get(`/agents/${id}`),
  updateAgent: (id, data) => api.put(`/agents/${id}`, data),
  deleteAgent: (id) => api.delete(`/agents/${id}`),
  getAgentProfile: () => api.get('/agents/profile/me'),
  updateAgentProfile: (data) => api.put('/agents/profile/me', data),
  uploadProfilePicture: (formData) => 
    api.post('/agents/profile/upload-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  getAgentProperties: (id) => api.get(`/agents/${id}/properties`),
  uploadAgentDocuments: (formData) => 
    api.post('/agents/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  updateAgentStatus: (id, status) => api.patch(`/agents/${id}/status`, { status }),
  getTopAgents: () => api.get('/agents/top'),
};

// Contact APIs
export const contactAPI = {
  sendContactMessage: (data) => api.post('/contact', data),
  getContactMessages: (params) => api.get('/contact', { params }),
  getContactMessageById: (id) => api.get(`/contact/${id}`),
  deleteContactMessage: (id) => api.delete(`/contact/${id}`),
};

// Feedback APIs
export const feedbackAPI = {
  createFeedback: (data) => api.post('/feedback', data),
  getFeedbacks: (params) => api.get('/feedback', { params }),
  getFeedbackById: (id) => api.get(`/feedback/${id}`),
  updateFeedback: (id, data) => api.put(`/feedback/${id}`, data),
  deleteFeedback: (id) => api.delete(`/feedback/${id}`),
  getPropertyFeedbacks: (propertyId) => api.get(`/feedback/property/${propertyId}`),
  getAgentFeedbacks: (agentId) => api.get(`/feedback/agent/${agentId}`),
};

// Transaction APIs
export const transactionAPI = {
  initiatePayment: (data) => api.post('/transactions/initiate', data),
  verifyPayment: (transactionId, data) => api.post(`/transactions/${transactionId}/verify`, data),
  getTransactionHistory: () => api.get('/transactions/history'),
  getTransactionById: (id) => api.get(`/transactions/${id}`),
};

// Admin APIs
export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard-stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getAgents: (params) => api.get('/admin/agents', { params }),
  getProperties: (params) => api.get('/admin/properties', { params }),
  approveAgent: (id) => api.post(`/admin/agents/${id}/approve`),
  rejectAgent: (id) => api.post(`/admin/agents/${id}/reject`),
  suspendUser: (id, data) => api.post(`/admin/users/${id}/suspend`, data),
  deleteProperty: (id) => api.delete(`/admin/properties/${id}`),
  getReports: (params) => api.get('/admin/reports', { params }),
};

// Location APIs
export const locationAPI = {
  getStates: () => api.get('/locations/states'),
  getCities: (stateId) => api.get(`/locations/cities/${stateId}`),
  getAreas: (cityId) => api.get(`/locations/areas/${cityId}`),
};

// Chat APIs
export const chatAPI = {
  getHistory: (otherId) => api.get(`/chat/history/${otherId}`),
  getConversations: () => api.get('/chat/conversations'),
};

export default api;
