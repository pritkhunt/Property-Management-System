// API Debug Helper - Helps diagnose connection issues

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://localhost:7073/api';

export const debugAPI = {
  // Test basic connectivity
  async testConnection() {
    console.group('🔍 API Connection Test');
    console.log('API Base URL:', API_BASE_URL);
    
    try {
      const response = await fetch(`${API_BASE_URL}/properties`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        console.log('✅ Connection successful!');
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Data received:', data);
        console.groupEnd();
        return { success: true, data };
      } else {
        console.error('❌ Connection failed');
        console.error('Status:', response.status);
        console.error('Status Text:', response.statusText);
        console.groupEnd();
        return { success: false, error: response.statusText };
      }
    } catch (error) {
      console.error('❌ Network error:', error.message);
      console.error('Full error:', error);
      
      if (error.message.includes('Failed to fetch')) {
        console.error('💡 Possible causes:');
        console.error('1. Backend is not running');
        console.error('2. CORS is not configured');
        console.error('3. SSL certificate issues');
        console.error('4. Wrong port or URL');
      }
      
      console.groupEnd();
      return { success: false, error: error.message };
    }
  },
  
  // Check CORS configuration
  async checkCORS() {
    console.group('🔍 CORS Configuration Check');
    
    try {
      const response = await fetch(`${API_BASE_URL}/properties`, {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type',
        },
      });
      
      console.log('CORS Headers:');
      console.log('Access-Control-Allow-Origin:', response.headers.get('Access-Control-Allow-Origin'));
      console.log('Access-Control-Allow-Methods:', response.headers.get('Access-Control-Allow-Methods'));
      console.log('Access-Control-Allow-Headers:', response.headers.get('Access-Control-Allow-Headers'));
      console.log('Access-Control-Allow-Credentials:', response.headers.get('Access-Control-Allow-Credentials'));
      
      console.groupEnd();
      return response.ok;
    } catch (error) {
      console.error('❌ CORS check failed:', error);
      console.groupEnd();
      return false;
    }
  },
  
  // Test authentication
  async testAuth(token) {
    console.group('🔍 Authentication Test');
    
    if (!token) {
      console.warn('No token provided');
      console.groupEnd();
      return { success: false, error: 'No token' };
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          title: 'Test Property',
          city: 'Test City',
        }),
      });
      
      if (response.ok) {
        console.log('✅ Authentication successful');
        console.groupEnd();
        return { success: true };
      } else {
        console.error('❌ Authentication failed');
        console.error('Status:', response.status);
        
        if (response.status === 401) {
          console.error('Token may be invalid or expired');
        } else if (response.status === 403) {
          console.error('User lacks necessary permissions');
        }
        
        console.groupEnd();
        return { success: false, status: response.status };
      }
    } catch (error) {
      console.error('❌ Auth test failed:', error);
      console.groupEnd();
      return { success: false, error: error.message };
    }
  },
  
  // Get detailed error information
  async getDetailedError() {
    console.group('🔍 Detailed Error Analysis');
    
    // Check if backend is reachable
    try {
      const swaggerResponse = await fetch('https://localhost:7073/swagger/index.html');
      if (swaggerResponse.ok) {
        console.log('✅ Backend is running (Swagger accessible)');
      } else {
        console.error('⚠️ Backend may be running but Swagger is not accessible');
      }
    } catch (error) {
      console.error('❌ Cannot reach backend at all');
      console.error('Make sure backend is running: dotnet run --launch-profile https');
    }
    
    // Check frontend proxy
    console.log('Frontend origin:', window.location.origin);
    console.log('API URL configured:', API_BASE_URL);
    console.log('Proxy configured in package.json:', 'https://localhost:7073');
    
    // Check browser settings
    console.log('Browser:', navigator.userAgent);
    console.log('Cookies enabled:', navigator.cookieEnabled);
    
    console.groupEnd();
  },
  
  // Full diagnostic
  async runFullDiagnostic() {
    console.log('========================================');
    console.log('🏥 Running Full API Diagnostic');
    console.log('========================================');
    
    const results = {
      connection: await this.testConnection(),
      cors: await this.checkCORS(),
      details: await this.getDetailedError(),
    };
    
    console.log('========================================');
    console.log('📋 Diagnostic Summary:');
    console.log('Connection:', results.connection.success ? '✅' : '❌');
    console.log('CORS:', results.cors ? '✅' : '❌');
    console.log('========================================');
    
    if (!results.connection.success) {
      console.log('💡 Next steps:');
      console.log('1. Run: cd PropertyManagementAPI/PropertyManagement.API && dotnet run --launch-profile https');
      console.log('2. Visit: https://localhost:7073/swagger');
      console.log('3. If SSL error, run: dotnet dev-certs https --trust');
      console.log('4. Check CORS in Program.cs');
    }
    
    return results;
  }
};

// Auto-run diagnostic in development
if (process.env.NODE_ENV === 'development' && window.location.pathname === '/test-backend') {
  window.debugAPI = debugAPI;
  console.log('🔧 API Debug Helper loaded!');
  console.log('Run window.debugAPI.runFullDiagnostic() in console for full diagnostic');
}

export default debugAPI;
