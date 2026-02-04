import { create } from 'zustand';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { validateAndCleanStorage } from '../utils/clearStorage';

// Clean up any corrupted data on load
validateAndCleanStorage();

// Helper function to safely parse JSON from localStorage
const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem('user');
    return storedUser && storedUser !== 'undefined' ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.warn('Failed to parse user from localStorage:', error);
    localStorage.removeItem('user'); // Clean up invalid data
    return null;
  }
};

const getStoredToken = () => {
  const token = localStorage.getItem('token');
  return token && token !== 'undefined' ? token : null;
};

const useAuthStore = create((set) => ({
  user: getStoredUser(),
  token: getStoredToken(),
  isAuthenticated: !!(getStoredToken() && getStoredUser()),
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(credentials);
      const { user, token } = response.data;
      
      // Safely store to localStorage
      if (token) {
        localStorage.setItem('token', token);
        console.log('🔐 Token stored in localStorage');
      }
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        console.log('👤 User data stored in localStorage:', user);
      }
      
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      // Verify storage worked
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      console.log('✅ Login complete - Storage verification:', {
        tokenStored: !!storedToken,
        userStored: !!storedUser,
        userType: user?.userType || user?.role
      });
      
      // Toast message is shown by Login component with user-specific message
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      set({ error: errorMessage, isLoading: false });
      // Error toast is shown by Login component
      throw error;
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.register(userData);
      toast.success('Registration successful! Please login.');
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  registerAgent: async (agentData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.registerAgent(agentData);
      toast.success('Agent registration successful! Please wait for approval.');
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Agent registration failed';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
      toast.success('Logged out successfully');
    }
  },

  updateProfile: async (profileData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.updateProfile(profileData);
      const updatedUser = response.data.user;
      
      console.log('📝 Profile update response:', updatedUser);
      console.log('   UserType:', updatedUser?.userType, '✅');
      console.log('   Authentication will be maintained');
      
      // Safely store updated user
      if (updatedUser) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
        console.log('✅ Updated user stored in localStorage');
      }
      
      // CRITICAL: Keep isAuthenticated true to prevent redirect
      set({ 
        user: updatedUser, 
        isLoading: false,
        isAuthenticated: true  // Maintain authentication state
      });
      
      toast.success('Profile updated successfully! ✓');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  uploadProfilePicture: async (file) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      console.log('📤 Uploading profile picture:', file.name);
      
      const response = await authAPI.uploadProfilePicture(formData);
      const updatedUser = response.data.user;
      
      console.log('📝 Profile picture upload response:', updatedUser);
      console.log('   UserType:', updatedUser?.userType, '✅');
      console.log('   ProfilePic:', updatedUser?.ProfilePic);
      
      // Safely store updated user
      if (updatedUser) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
        console.log('✅ Updated user with new profile picture stored in localStorage');
      }
      
      // CRITICAL: Keep isAuthenticated true to prevent redirect
      set({ 
        user: updatedUser, 
        isLoading: false,
        isAuthenticated: true
      });
      
      toast.success('Profile picture updated successfully! ✓');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to upload profile picture';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  checkAuth: () => {
    const token = getStoredToken();
    const user = getStoredUser();
    
    console.log('🔍 Checking auth on page load:', { 
      hasToken: !!token, 
      hasUser: !!user,
      userType: user?.userType || user?.role 
    });
    
    if (token && user) {
      // Both token and user exist, restore authentication state
      set({ 
        user, 
        token, 
        isAuthenticated: true 
      });
      console.log('✅ Authentication restored from localStorage');
    } else {
      // Missing token or user, clear everything
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ 
        isAuthenticated: false, 
        user: null, 
        token: null 
      });
      console.log('❌ Authentication cleared - missing token or user data');
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
