// API Endpoints Configuration for Node.js Backend
const API_ENDPOINTS = {
  // Base URL
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  
  // Authentication Endpoints
  AUTH: {
    REGISTER_USER: '/auth/register-user',
    REGISTER_AGENT: '/auth/register-agent',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    VERIFY_OTP: '/auth/verify-otp',
    RESEND_OTP: '/auth/resend-otp',
    PROFILE: '/auth/profile',
  },
  
  // User Management Endpoints
  USERS: {
    GET_ALL: '/users',
    GET_BY_ID: (id) => `/users/${id}`,
    GET_BY_ROLE: (role) => `/users/role/${role}`,
    UPDATE: (id) => `/users/${id}`,
    DELETE: (id) => `/users/${id}`,
    STATS: '/users/stats',
  },
  
  // Agent Management Endpoints
  AGENTS: {
    GET_ALL: '/agents',
    GET_ADMIN_ALL: '/agents/admin/all',
    GET_BY_ID: (id) => `/agents/${id}`,
    GET_BY_STATUS: (status) => `/agents/status/${status}`,
    UPDATE: (id) => `/agents/${id}`,
    UPDATE_STATUS: (id) => `/agents/${id}/status`,
    DELETE: (id) => `/agents/${id}`,
    STATS: '/agents/stats',
    BULK_APPROVE: '/agents/bulk-approve',
  },
  
  // Property Management Endpoints
  PROPERTIES: {
    GET_ALL: '/properties',
    GET_AGENT_PROPERTIES: '/properties/agent/my-properties',
    GET_OWNER_PROPERTIES: '/properties/owner/my-properties',
    GET_ADMIN_PROPERTIES: '/properties/admin/all-properties',
    GET_BY_ID: (id) => `/properties/${id}`,
    CREATE: '/properties',
    UPDATE: (id) => `/properties/${id}`,
    DELETE: (id) => `/properties/${id}`,
    APPROVE: (id) => `/properties/${id}/approve`,
    REJECT: (id) => `/properties/${id}/reject`,
  },
  
  // Payment Endpoints
  PAYMENT: {
    CREATE_ORDER: '/payment/create-order',
    VERIFY: '/payment/verify',
    TRANSACTIONS: '/payment/transactions',
    TRANSACTION_BY_ID: (id) => `/payment/transaction/${id}`,
    ADMIN_TRANSACTIONS: '/payment/admin/transactions',
    AGENT_TRANSACTIONS: '/payment/agent/transactions',
  },
  
  // Chat Endpoints
  CHAT: {
    HISTORY: (otherId) => `/chat/history/${otherId}`,
    CONVERSATIONS: '/chat/conversations',
  },
  
  // Utility Endpoints
  HEALTH: '/health',
  ROOT: '/',
};

export default API_ENDPOINTS;
