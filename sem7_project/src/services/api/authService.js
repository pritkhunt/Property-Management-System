import axiosInstance from './axiosInstance';

// Authentication API service
class AuthService {
  // Login
  async login(credentials) {
    const response = await axiosInstance.post('/auth/login', credentials);
    
    // Store token and user info if successful
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  }

  // Register User
  async registerUser(userData) {
    const response = await axiosInstance.post('/auth/register-user', userData);
    return response.data;
  }

  // Register Agent
  async registerAgent(agentData) {
    const response = await axiosInstance.post('/auth/register-agent', agentData);
    return response.data;
  }

  // Verify OTP
  async verifyOtp(data) {
    const response = await axiosInstance.post('/auth/verify-otp', data);
    
    // Store token and user info if successful
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  }

  // Logout
  async logout() {
    try {
      await axiosInstance.post('/auth/logout');
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  }

  // Get current user profile
  async getCurrentUser() {
    const response = await axiosInstance.get('/auth/profile');
    return response.data;
  }

  // Resend OTP
  async resendOtp(email) {
    const response = await axiosInstance.post('/auth/resend-otp', { Email: email });
    return response.data;
  }

  // Forgot password
  async forgotPassword(email) {
    const response = await axiosInstance.post('/auth/forgot-password', { email });
    return response.data;
  }

  // Reset password
  async resetPassword(token, newPassword) {
    const response = await axiosInstance.post('/auth/reset-password', {
      token,
      newPassword
    });
    return response.data;
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    const response = await axiosInstance.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  }

  // Verify email
  async verifyEmail(token) {
    const response = await axiosInstance.post('/auth/verify-email', { token });
    return response.data;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  }

  // Get stored user
  getStoredUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
}

export default new AuthService();
