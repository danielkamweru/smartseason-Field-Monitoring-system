import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const Layout = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { to: '/fields', label: 'Fields', icon: ClipboardDocumentListIcon },
    ...(user?.role === 'admin' ? [{ to: '/agents', label: 'Agents', icon: UserGroupIcon }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  if (!isAuthenticated) return <Outlet />;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-[#14532d] flex flex-col transform transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-green-800">
          <div className="flex items-center gap-3">
            <img src="/shamba-logo.jpeg" alt="Shamba" className="w-9 h-9 rounded-xl object-cover shadow-lg" />
            <div>
              <p className="text-white font-bold text-base leading-tight font-poppins">SmartSeason</p>
              <p className="text-green-400 text-xs">Field Monitor</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-green-300 hover:text-white">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive(to)
                  ? 'bg-shamba-green text-white shadow-md'
                  : 'text-green-200 hover:bg-green-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="px-4 py-4 border-t border-green-800">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-800/50">
            <div className="w-8 h-8 rounded-full bg-shamba-green flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">{user?.username?.[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.username}</p>
              <p className="text-green-400 text-xs capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="text-green-300 hover:text-red-400 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 hover:text-gray-900">
            <Bars3Icon className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/shamba-logo.jpeg" alt="Shamba" className="w-7 h-7 rounded-lg object-cover" />
            <span className="font-bold text-shamba-dark-green font-poppins">SmartSeason</span>
          </div>
          <div className="w-6" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
