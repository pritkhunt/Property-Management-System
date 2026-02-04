import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Menu, X, Home, Building, Users, Phone, LogIn, UserPlus, User, LogOut, Heart, Briefcase } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import LogoutDialog from '../ui/LogoutDialog';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const MainLayout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
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

  const getDashboardLink = () => {
    console.log('Getting dashboard link for userType:', user?.userType, 'role:', user?.role, 'tableType:', user?.tableType);
    
    // Use userType (table-based) instead of role
    const userType = user?.userType || user?.role;
    
    switch (userType) {
      case 'admin':
        console.log('Navigating to admin dashboard: /admin');
        return '/admin';
      case 'agent':
        console.log('Navigating to agent dashboard: /agent-dashboard');
        return '/agent-dashboard';
      case 'user':
      case 'buyer':
      case 'seller':
        console.log('Navigating to user dashboard: /dashboard');
        return '/dashboard';
      default:
        console.log('Default navigation to user dashboard: /dashboard for userType:', userType);
        return '/dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <Building className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-gray-900">PropertyHub</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-1 text-gray-700 hover:text-primary transition">
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
              <Link to="/properties" className="flex items-center space-x-1 text-gray-700 hover:text-primary transition">
                <Building className="h-4 w-4" />
                <span>Properties</span>
              </Link>
              <Link to="/agents" className="flex items-center space-x-1 text-gray-700 hover:text-primary transition">
                <Users className="h-4 w-4" />
                <span>Agents</span>
              </Link>
              <Link to="/contact" className="flex items-center space-x-1 text-gray-700 hover:text-primary transition">
                <Phone className="h-4 w-4" />
                <span>Contact</span>
              </Link>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Debug: Show user data in console */}
              {isAuthenticated && console.log('User data:', user)}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="relative h-14 w-14 rounded-full p-1 hover:bg-blue-50 transition-colors"
                      onDoubleClick={() => navigate(getDashboardLink())}
                      title="Double-click to go to dashboard"
                    >
                      <Avatar className="h-12 w-12 border-3 border-blue-400 shadow-lg ring-2 ring-blue-200 bg-blue-500">
                        <AvatarImage 
                          src={(() => {
                            const pic = user?.ProfilePic || user?.profilepic;
                            if (!pic) return null;
                            if (pic.startsWith('http')) return pic;
                            return `http://localhost:5000${pic.startsWith('/') ? '' : '/'}${pic}`;
                          })()} 
                          alt={user?.Name || user?.name || user?.Username || user?.username || 'User'} 
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold text-lg border-0">
                          {(() => {
                            const name = user?.Name || user?.name || user?.Username || user?.username || '';
                            const email = user?.Email || user?.email || '';
                            return name.charAt(0)?.toUpperCase() || email.charAt(0)?.toUpperCase() || 'U';
                          })()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => navigate(getDashboardLink())}
                      className="font-medium text-primary cursor-pointer"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Go to Dashboard</span>
                    </DropdownMenuItem>
                    {user?.role === 'user' && (
                      <DropdownMenuItem onClick={() => navigate('/dashboard/saved-properties')}>
                        <Heart className="mr-2 h-4 w-4" />
                        <span>Saved Properties</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={openLogoutDialog}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button variant="outline" onClick={() => navigate('/login')}>
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Register
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate('/register-user')}>
                        <User className="mr-2 h-4 w-4" />
                        Register as User
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/register-agent')}>
                        <Briefcase className="mr-2 h-4 w-4" />
                        Register as Agent
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden rounded-md p-2 text-gray-700 hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden pb-4">
              <div className="flex flex-col space-y-2 pt-2">
                <Link
                  to="/"
                  className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Link>
                <Link
                  to="/properties"
                  className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Building className="h-4 w-4" />
                  <span>Properties</span>
                </Link>
                <Link
                  to="/agents"
                  className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Users className="h-4 w-4" />
                  <span>Agents</span>
                </Link>
                <Link
                  to="/contact"
                  className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Phone className="h-4 w-4" />
                  <span>Contact</span>
                </Link>
                
                <div className="pt-2 border-t">
                  {isAuthenticated ? (
                    <>
                      <Link
                        to={getDashboardLink()}
                        className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                      <button
                        onClick={() => {
                          openLogoutDialog();
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md w-full text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <LogIn className="h-4 w-4" />
                        <span>Login</span>
                      </Link>
                      <div className="border-l-2 border-gray-200 ml-6 pl-2">
                        <p className="text-xs text-gray-500 mb-1 px-2">Register as:</p>
                        <Link
                          to="/register-user"
                          className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <User className="h-4 w-4" />
                          <span>User (Buyer/Seller)</span>
                        </Link>
                        <Link
                          to="/register-agent"
                          className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Briefcase className="h-4 w-4" />
                          <span>Property Agent</span>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold">PropertyHub</span>
              </div>
              <p className="text-gray-400">
                Your trusted platform for buying, selling, and renting properties.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-400 hover:text-white">Home</Link></li>
                <li><Link to="/properties" className="text-gray-400 hover:text-white">Properties</Link></li>
                <li><Link to="/agents" className="text-gray-400 hover:text-white">Agents</Link></li>
                <li><Link to="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Services</h3>
              <ul className="space-y-2">
                <li><Link to="/properties?type=buy" className="text-gray-400 hover:text-white">Buy Property</Link></li>
                <li><Link to="/properties?type=rent" className="text-gray-400 hover:text-white">Rent Property</Link></li>
                <li><Link to="/register-agent" className="text-gray-400 hover:text-white">Become an Agent</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white">Contact Support</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact Info</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Email: info@propertyhub.com</li>
                <li>Phone: +91 98765 43210</li>
                <li>Address: Mumbai, India</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 PropertyHub. All rights reserved.</p>
          </div>
        </div>
      </footer>

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

export default MainLayout;
