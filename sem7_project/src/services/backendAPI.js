import axios from 'axios';
import API_ENDPOINTS from '../config/apiEndpoints';

// Create axios instance for Node.js backend
const backendAPI = axios.create({
  baseURL: API_ENDPOINTS.BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
backendAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
backendAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  // User Registration
  registerUser: async (userData) => {
    const response = await backendAPI.post(API_ENDPOINTS.AUTH.REGISTER_USER, userData);
    return response.data;
  },

  // Agent Registration
  registerAgent: async (agentData) => {
    // Handle file uploads
    const formData = new FormData();
    
    // Add text fields
    Object.keys(agentData).forEach(key => {
      if (key !== 'AdharCardFront' && key !== 'PanCard') {
        formData.append(key, agentData[key]);
      }
    });
    
    // Add files if present
    if (agentData.AdharCardFront) {
      formData.append('AdharCardFront', agentData.AdharCardFront);
    }
    if (agentData.PanCard) {
      formData.append('PanCard', agentData.PanCard);
    }
    
    const response = await backendAPI.post(API_ENDPOINTS.AUTH.REGISTER_AGENT, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Login
  login: async (credentials) => {
    const response = await backendAPI.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    
    // Store token and user data
    if (response.data.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('userType', response.data.userType);
    }
    
    return response.data;
  },

  // Verify OTP
  verifyOTP: async (email, otp) => {
    const response = await backendAPI.post(API_ENDPOINTS.AUTH.VERIFY_OTP, {
      Email: email,
      Otp: otp
    });
    
    // Store token and user data
    if (response.data.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('userType', response.data.userType);
    }
    
    return response.data;
  },

  // Resend OTP
  resendOTP: async (email) => {
    const response = await backendAPI.post(API_ENDPOINTS.AUTH.RESEND_OTP, {
      Email: email
    });
    return response.data;
  },

  // Logout
  logout: async () => {
    try {
      await backendAPI.post(API_ENDPOINTS.AUTH.LOGOUT);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('userType');
    }
  },

  // Get Profile
  getProfile: async () => {
    const response = await backendAPI.get(API_ENDPOINTS.AUTH.PROFILE);
    return response.data;
  },
};

// User Management API
export const userAPI = {
  // Get all users
  getAllUsers: async () => {
    const response = await backendAPI.get(API_ENDPOINTS.USERS.GET_ALL);
    return response.data;
  },

  // Get user by ID
  getUserById: async (id) => {
    const response = await backendAPI.get(API_ENDPOINTS.USERS.GET_BY_ID(id));
    return response.data;
  },

  // Get users by role
  getUsersByRole: async (role) => {
    const response = await backendAPI.get(API_ENDPOINTS.USERS.GET_BY_ROLE(role));
    return response.data;
  },

  // Update user
  updateUser: async (id, userData) => {
    const response = await backendAPI.put(API_ENDPOINTS.USERS.UPDATE(id), userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (id) => {
    const response = await backendAPI.delete(API_ENDPOINTS.USERS.DELETE(id));
    return response.data;
  },

  // Get user statistics
  getUserStats: async () => {
    const response = await backendAPI.get(API_ENDPOINTS.USERS.STATS);
    return response.data;
  },
};

// Agent Management API
export const agentAPI = {
  // Get all agents (public - approved only)
  getAllAgents: async () => {
    const response = await backendAPI.get(API_ENDPOINTS.AGENTS.GET_ALL);
    return response.data;
  },

  // Get all agents for admin dashboard (all statuses)
  getAdminAgents: async () => {
    const response = await backendAPI.get(API_ENDPOINTS.AGENTS.GET_ADMIN_ALL);
    return response.data;
  },

  // Get agent by ID
  getAgentById: async (id) => {
    const response = await backendAPI.get(API_ENDPOINTS.AGENTS.GET_BY_ID(id));
    return response.data;
  },

  // Get agents by status
  getAgentsByStatus: async (status) => {
    const response = await backendAPI.get(API_ENDPOINTS.AGENTS.GET_BY_STATUS(status));
    return response.data;
  },

  // Update agent
  updateAgent: async (id, agentData) => {
    const response = await backendAPI.put(API_ENDPOINTS.AGENTS.UPDATE(id), agentData);
    return response.data;
  },

  // Update agent status
  updateAgentStatus: async (id, status) => {
    const response = await backendAPI.put(API_ENDPOINTS.AGENTS.UPDATE_STATUS(id), {
      Status: status
    });
    return response.data;
  },

  // Delete agent
  deleteAgent: async (id) => {
    const response = await backendAPI.delete(API_ENDPOINTS.AGENTS.DELETE(id));
    return response.data;
  },

  // Get agent statistics
  getAgentStats: async () => {
    const response = await backendAPI.get(API_ENDPOINTS.AGENTS.STATS);
    return response.data;
  },

  // Bulk approve agents
  bulkApproveAgents: async (agentIds) => {
    const response = await backendAPI.post(API_ENDPOINTS.AGENTS.BULK_APPROVE, {
      agentIds
    });
    return response.data;
  },
};

// Property Management API
export const propertyAPI = {
  // Get all properties (public)
  getAllProperties: async (filters = {}) => {
    const response = await backendAPI.get(API_ENDPOINTS.PROPERTIES.GET_ALL, { params: filters });
    return response.data;
  },

  // Get agent's properties
  getAgentProperties: async () => {
    const response = await backendAPI.get(API_ENDPOINTS.PROPERTIES.GET_AGENT_PROPERTIES);
    return response.data;
  },

  // Get owner's properties
  getOwnerProperties: async () => {
    const response = await backendAPI.get(API_ENDPOINTS.PROPERTIES.GET_OWNER_PROPERTIES);
    return response.data;
  },

  // Get admin properties
  getAdminProperties: async () => {
    const response = await backendAPI.get(API_ENDPOINTS.PROPERTIES.GET_ADMIN_PROPERTIES);
    return response.data;
  },

  // Get property by ID
  getPropertyById: async (id) => {
    const response = await backendAPI.get(API_ENDPOINTS.PROPERTIES.GET_BY_ID(id));
    return response.data;
  },

  // Create property
  createProperty: async (propertyData) => {
    const response = await backendAPI.post(API_ENDPOINTS.PROPERTIES.CREATE, propertyData);
    return response.data;
  },

  // Update property
  updateProperty: async (id, propertyData) => {
    const response = await backendAPI.put(API_ENDPOINTS.PROPERTIES.UPDATE(id), propertyData);
    return response.data;
  },

  // Delete property
  deleteProperty: async (id) => {
    const response = await backendAPI.delete(API_ENDPOINTS.PROPERTIES.DELETE(id));
    return response.data;
  },

  // Approve property
  approveProperty: async (id) => {
    const response = await backendAPI.put(API_ENDPOINTS.PROPERTIES.APPROVE(id));
    return response.data;
  },

  // Reject property
  rejectProperty: async (id) => {
    const response = await backendAPI.put(API_ENDPOINTS.PROPERTIES.REJECT(id));
    return response.data;
  },
};

// Utility API
export const utilityAPI = {
  // Health check
  healthCheck: async () => {
    const response = await backendAPI.get(API_ENDPOINTS.HEALTH);
    return response.data;
  },

  // Get API info
  getAPIInfo: async () => {
    const response = await backendAPI.get(API_ENDPOINTS.ROOT);
    return response.data;
  },
};

// Payment API
export const paymentAPI = {
  createOrder: (propertyId) => backendAPI.post(API_ENDPOINTS.PAYMENT.CREATE_ORDER, { propertyId }),
  verifyPayment: (paymentData) => backendAPI.post(API_ENDPOINTS.PAYMENT.VERIFY, paymentData),
  getTransactions: () => backendAPI.get(API_ENDPOINTS.PAYMENT.TRANSACTIONS),
  getTransactionById: (id) => backendAPI.get(API_ENDPOINTS.PAYMENT.TRANSACTION_BY_ID(id)),
  getAdminTransactions: () => backendAPI.get(API_ENDPOINTS.PAYMENT.ADMIN_TRANSACTIONS),
  getAgentTransactions: () => backendAPI.get(API_ENDPOINTS.PAYMENT.AGENT_TRANSACTIONS),
};

// Chat API
export const chatAPI = {
  getHistory: async (otherId) => {
    const response = await backendAPI.get(API_ENDPOINTS.CHAT.HISTORY(otherId));
    return response.data;
  },
  getConversations: async () => {
    const response = await backendAPI.get(API_ENDPOINTS.CHAT.CONVERSATIONS);
    return response.data;
  },
};

export default backendAPI;

