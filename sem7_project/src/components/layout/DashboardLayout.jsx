import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Building, Menu, X, Home, User, Heart, CreditCard, MessageSquare, 
  Settings, LogOut, Users, FileText, BarChart, PlusCircle, List, Search, CheckCircle
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import LogoutDialog from '../ui/LogoutDialog';
import NotificationBell from '../NotificationBell';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setIsLogoutDialogOpen(false);
    await logout();
    navigate('/');
  };

  const openLogoutDialog = () => {
    setIsLogoutDialogOpen(true);
  };

  const closeLogoutDialog = () => {
    setIsLogoutDialogOpen(false);
  };

  // Define menu items based on user type (table-based)
  const getMenuItems = () => {
    const userType = user?.userType || user?.role;
    const userRole = (user?.Role || user?.role || '').toLowerCase(); // Get the actual role (buyer/seller/both)
    console.log('DashboardLayout - userType:', userType, 'role:', userRole, 'tableType:', user?.tableType);
    
    switch (userType) {
      case 'admin':
        return [
          { icon: Home, label: 'Dashboard', path: '/admin' },
          { icon: Users, label: 'Users', path: '/admin/users' },
          { icon: Users, label: 'Agents', path: '/admin/agents' },
          { icon: Building, label: 'Properties', path: '/admin/properties' },
          { icon: CreditCard, label: 'Transactions', path: '/admin/transactions' },
          { icon: BarChart, label: 'Reports', path: '/admin/reports' },
          { icon: Settings, label: 'Settings', path: '/admin/settings' },
        ];
      case 'agent':
        return [
          { icon: Home, label: 'Dashboard', path: '/agent-dashboard' },
          { icon: List, label: 'My Properties', path: '/agent-dashboard/properties' },
          { icon: PlusCircle, label: 'Add Property', path: '/agent-dashboard/properties/add' },
          { icon: User, label: 'Profile', path: '/agent-dashboard/profile' },
          { icon: CreditCard, label: 'Transactions', path: '/agent-dashboard/transactions' },
        ];
      default: // user (buyer/seller/both)
        const menuItems = [
          { icon: Home, label: 'Dashboard', path: '/dashboard' },
          { icon: User, label: 'Profile', path: '/dashboard/profile' },
        ];

        // Property Approvals - visible only to 'seller' and 'both'
        if (userRole === 'seller' || userRole === 'both') {
          menuItems.push({
            icon: CheckCircle,
            label: 'Property Approvals',
            path: '/dashboard/property-approvals'
          });
        }

        // Saved Properties - visible only to 'buyer' and 'both'
        if (userRole === 'buyer' || userRole === 'both') {
          menuItems.push({
            icon: Heart,
            label: 'Saved Properties',
            path: '/dashboard/saved-properties'
          });
        }

        // Common menu items for all user roles
        menuItems.push(
          { icon: CreditCard, label: 'Transactions', path: '/dashboard/transactions' },
        );

        return menuItems;
    }
  };

  const menuItems = getMenuItems();

  const getDashboardTitle = () => {
    switch (user?.role) {
      case 'admin':
        return 'Admin Dashboard';
      case 'agent':
        return 'Agent Dashboard';
      default:
        return 'User Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100 lg:hidden"
            >
              {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <Link to="/" className="flex items-center space-x-2 ml-4 lg:ml-0">
              <Building className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-gray-900 hidden sm:block">PropertyHub</span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-10 w-full"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <NotificationBell />
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={(() => {
                    const profilePic = user?.ProfilePic || user?.profilepic;
                    const imageUrl = profilePic?.startsWith('http') 
                      ? profilePic
                      : profilePic?.startsWith('/uploads')
                      ? `http://localhost:5000${profilePic}`
                      : profilePic;
                    return imageUrl;
                  })()}
                  alt={user?.Name || user?.name}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
                <AvatarFallback className="bg-primary text-white">
                  {(user?.Name || user?.name)?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.Name || user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.Role || user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex flex-col h-full pt-20 lg:pt-6">
            <div className="px-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-800">{getDashboardTitle()}</h2>
            </div>
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                      isActive
                        ? "bg-primary text-white"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="px-2 pb-4 border-t pt-4">
              <button
                onClick={openLogoutDialog}
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Logout Confirmation Dialog */}
      <LogoutDialog
        isOpen={isLogoutDialogOpen}
        onClose={closeLogoutDialog}
        onConfirm={handleLogout}
        userName={user?.Name}
      />
    </div>
  );
};

export default DashboardLayout;
