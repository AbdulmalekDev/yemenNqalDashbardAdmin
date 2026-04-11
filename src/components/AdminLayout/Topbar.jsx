import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, LogOut, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import SearchBox from './SearchBox';
import UserAvatar from './UserAvatar';
import RoleBadge from './RoleBadge';
import NotificationBell from './NotificationBell';

const Topbar = ({ onOpenSidebar, user, onLogout }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-16 print:hidden">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center space-x-4 space-x-reverse">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden text-gray-600 hover:text-gray-900"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* <SearchBox className="hidden md:block" /> */}
        </div>

        <div className="flex items-center space-x-4 space-x-reverse h-full group">
          <div className="flex items-center space-x-6 space-x-reverse h-full border-l border-gray-100 pl-4 border-opacity-50">
            <RoleBadge role={user?.role} className="hidden sm:inline-block" />

            <NotificationBell />
          </div>

          <div className="flex items-center space-x-4 space-x-reverse h-full relative" ref={profileRef}>
            <div 
              className="flex items-center space-x-4 space-x-reverse h-full cursor-pointer"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <UserAvatar name={user?.name} className="w-10 h-10 ring-2 ring-primary-50 ring-offset-2 transition-transform hover:scale-105" />
              
              <div className="hidden lg:flex flex-col items-start text-right">
                <span className="text-sm font-bold text-gray-800 leading-tight">
                  {user?.name || 'مدير النظام'}
                </span>
                <span className="text-xs text-gray-400 font-medium">
                  {user?.email || 'admin@yemennaql.com'}
                </span>
              </div>
            </div>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div className="absolute top-16 left-0 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-gray-100 mb-2">
                  <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                
                <Link
                  to={user?.uid ? `/users/${user.uid}` : '#'}
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center px-4 py-2 text-sm font-bold text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                >
                  <UserIcon className="w-4 h-4 ml-2" />
                  حسابي
                </Link>
                
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    if (onLogout) onLogout();
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors mt-1"
                >
                  <LogOut className="w-4 h-4 ml-2" />
                  تسجيل الخروج
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
