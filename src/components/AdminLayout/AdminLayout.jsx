import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../hooks/useSettings';
import { useRealTime } from '../../hooks/useRealTime';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileOverlay from './MobileOverlay';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();
  const { data: settings } = useSettings();

  // تفعيل التحديثات الفورية لجميع الصفحات
  useRealTime();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSubmenu = (id) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="flex h-screen bg-gray-50 font-arabic overflow-hidden print:block print:h-auto print:bg-white print:overflow-visible">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        logout={handleLogout}
        settings={settings}
        openSubmenus={openSubmenus}
        toggleSubmenu={toggleSubmenu}
        hasPermission={hasPermission}
      />

      <div className="flex-1 flex flex-col min-w-0 print:block print:w-full">
        <Topbar
          onOpenSidebar={() => setSidebarOpen(true)}
          user={user}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto p-6 print:overflow-visible print:p-0 print:m-0">
          {children}
        </main>
      </div>

      <MobileOverlay
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </div>
  );
};

export default AdminLayout;
