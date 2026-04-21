import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  HomeIcon, 
  ClipboardDocumentListIcon, 
  UserIcon, 
  ArrowRightOnRectangleIcon,
  CogIcon
} from '@heroicons/react/24/outline';
const Layout = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  if (!isAuthenticated) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-xl font-bold text-shamba-green">
                  SmartSeason
                </Link>
              </div>

              {/* Navigation Links */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/dashboard"
                  className={`${
                    isActive('/dashboard')
                      ? 'border-shamba-green text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <HomeIcon className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
                <Link
                  to="/fields"
                  className={`${
                    isActive('/fields')
                      ? 'border-shamba-green text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <ClipboardDocumentListIcon className="w-4 h-4 mr-2" />
                  Fields
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    to="/agents"
                    className={`${
                      isActive('/agents')
                        ? 'border-shamba-green text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    <UserIcon className="w-4 h-4 mr-2" />
                    Agents
                  </Link>
                )}
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">
                    {user?.username} ({user?.role})
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-shamba-green text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-shamba-dark-green transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
