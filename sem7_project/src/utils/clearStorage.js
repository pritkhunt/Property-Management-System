// Utility to clear corrupted localStorage data
export const clearAuthStorage = () => {
  try {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    console.log('Auth storage cleared successfully');
  } catch (error) {
    console.error('Error clearing auth storage:', error);
  }
};

// Check and clean up invalid localStorage data
export const validateAndCleanStorage = () => {
  try {
    // Check user data
    const storedUser = localStorage.getItem('user');
    if (storedUser && (storedUser === 'undefined' || storedUser === 'null')) {
      localStorage.removeItem('user');
      console.log('Removed invalid user data from localStorage');
    }

    // Check token data
    const storedToken = localStorage.getItem('token');
    if (storedToken && (storedToken === 'undefined' || storedToken === 'null')) {
      localStorage.removeItem('token');
      console.log('Removed invalid token data from localStorage');
    }

    // Try to parse user data to check if it's valid JSON
    if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
      try {
        JSON.parse(storedUser);
      } catch (error) {
        localStorage.removeItem('user');
        console.log('Removed corrupted user JSON from localStorage');
      }
    }
  } catch (error) {
    console.error('Error validating localStorage:', error);
  }
};

// Run validation on import
validateAndCleanStorage();
