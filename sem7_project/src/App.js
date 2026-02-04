import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import { SocketProvider } from './context/SocketContext';

// Layout Components
import MainLayout from './components/layout/MainLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import AuthLayout from './components/layout/AuthLayout';

// Auth Pages
import Login from './pages/auth/Login';
import UnifiedLogin from './pages/auth/UnifiedLogin';
import RegisterUser from './pages/auth/RegisterUser';
import RegisterAgent from './pages/auth/RegisterAgent';
import OtpVerification from './pages/auth/OtpVerification';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Public Pages
import Home from './pages/Home';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import Agents from './pages/Agents';
import AgentProfile from './pages/AgentProfile';
import About from './pages/About';
import Contact from './pages/Contact';
import TestBackendConnection from './pages/TestBackendConnection';
import TestUsers from './pages/TestUsers';
import TestRegistrations from './pages/TestRegistrations';

// User Dashboard Pages
import UserDashboard from './pages/dashboard/user/UserDashboard';
import UserProfile from './pages/dashboard/user/UserProfile';
import SavedProperties from './pages/dashboard/user/SavedProperties';
import PropertyApprovals from './pages/dashboard/user/PropertyApprovals';
import UserTransactions from './pages/dashboard/user/UserTransactions';
import UserMessages from './pages/dashboard/user/UserMessages';

// Agent Dashboard Pages
import AgentDashboard from './pages/dashboard/agent/AgentDashboard';
import AgentProperties from './pages/dashboard/agent/AgentProperties';
import AddProperty from './pages/dashboard/agent/AddProperty';
import EditProperty from './pages/dashboard/agent/EditProperty';
import AgentProfilePage from './pages/dashboard/agent/AgentProfile';
import AgentMessages from './pages/dashboard/agent/AgentMessages';
import AgentTransactions from './pages/dashboard/agent/AgentTransactions';

// Admin Dashboard Pages
import AdminDashboard from './pages/dashboard/admin/AdminDashboard';
import AdminUsers from './pages/dashboard/admin/AdminUsers';
import AdminAgents from './pages/dashboard/admin/AdminAgents';
import AdminProperties from './pages/dashboard/admin/AdminProperties';
import AdminTransactions from './pages/dashboard/admin/AdminTransactions';
import AdminReports from './pages/dashboard/admin/AdminReports';
import AdminSettings from './pages/dashboard/admin/AdminSettings';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user } = useAuthStore();

  console.log('ProtectedRoute - isAuthenticated:', isAuthenticated, 'user role:', user?.role, 'allowedRoles:', allowedRoles);

  if (!isAuthenticated) {
    console.log('User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Handle table-based access (userType from backend)
  if (allowedRoles.length > 0) {
    const userType = user?.userType || user?.role;
    const userRole = user?.role;
    
    const hasAccess = allowedRoles.includes(userType) || 
                     allowedRoles.includes(userRole) ||
                     (allowedRoles.includes('user') && ['buyer', 'seller', 'user'].includes(userType));
    
    if (!hasAccess) {
      console.log('User not allowed, redirecting to home. UserType:', userType, 'Role:', userRole, 'Allowed roles:', allowedRoles);
      return <Navigate to="/" replace />;
    }
  }

  console.log('Access granted for user role:', user?.role);
  return children;
};

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <SocketProvider>
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
        <Route path="/login"  element={<Login/>} />
        <Route path="/unified-login" element={<UnifiedLogin />} />
        <Route path="/register-user" element={<RegisterUser />} />
        <Route path="/register-agent" element={<RegisterAgent />} />
        <Route path="/otp-verification" element={<OtpVerification />} />
        <Route path="/verify-otp" element={<OtpVerification />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      {/* Public Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/properties/:id" element={<PropertyDetail />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/agents/:id" element={<AgentProfile />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/test-backend" element={<TestBackendConnection />} />
        <Route path="/test-users" element={<TestUsers />} />
        <Route path="/test-registrations" element={<TestRegistrations />} />
      </Route>

      {/* User Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['user', 'buyer', 'seller']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<UserDashboard />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path="property-approvals" element={<PropertyApprovals />} />
        <Route path="saved-properties" element={<SavedProperties />} />
        <Route path="transactions" element={<UserTransactions />} />
        <Route path="transactions" element={<UserTransactions />} />
      </Route>

      {/* Agent Dashboard Routes */}
      <Route
        path="/agent-dashboard"
        element={
          <ProtectedRoute allowedRoles={['agent']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AgentDashboard />} />
        <Route path="properties" element={<AgentProperties />} />
        <Route path="properties/add" element={<AddProperty />} />
        <Route path="properties/edit/:id" element={<EditProperty />} />
        <Route path="profile" element={<AgentProfilePage />} />
        <Route path="profile" element={<AgentProfilePage />} />
        <Route path="transactions" element={<AgentTransactions />} />
      </Route>

      {/* Admin Dashboard Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="agents" element={<AdminAgents />} />
        <Route path="properties" element={<AdminProperties />} />
        <Route path="transactions" element={<AdminTransactions />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </SocketProvider>
  );
}

export default App;
