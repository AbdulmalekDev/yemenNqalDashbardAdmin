import React from 'react';
import { X, LogOut } from 'lucide-react';
import SidebarItem from './SidebarItem';
import UserAvatar from './UserAvatar';
import RoleBadge from './RoleBadge';
import { ADMIN_MENU_ITEMS } from './constants';

const Sidebar = ({
  isOpen,
  onClose,
  user,
  logout,
  settings,
  openSubmenus,
  toggleSubmenu,
  hasPermission
}) => {
  const dynamicLogo = settings?.system?.logo || '/assets/images/logo.png';

  // تصفية القائمة بناءً على دور المستخدم وصلاحياته
  const filteredMenuItems = ADMIN_MENU_ITEMS
    .filter(item => {
      const userRole = user?.role || 'default';
      const isRoleAllowed = item.roles.includes(userRole) || userRole === 'manager';
      const isPermissionAllowed = !item.permission || hasPermission(item.permission);
      return isRoleAllowed && isPermissionAllowed;
    })
    .map(item => {
      if (item.children) {
        return {
          ...item,
          children: item.children.filter(child => {
            // إذا لم يكن للابن صلاحية محددة، يرث صلاحية الأب (التي تم فحصها بالفعل)
            if (!child.permission) return true;
            return hasPermission(child.permission);
          })
        };
      }
      return item;
    })
    .filter(item => !item.children || item.children.length > 0); // إخفاء القوائم الفارغة

  return (
    <aside className={`${isOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 print:hidden`}>
      {/* Header / Logo */}
      <div className="flex items-center justify-between h-16 px-6 bg-primary-900">
        <div className="flex items-center space-x-3 space-x-reverse">
          <img
            src={dynamicLogo}
            alt="يمن نقل - Yemen Naql"
            className="w-10 h-10 object-contain bg-white rounded p-1"
          />
          <div className="text-right">
            <span className="text-base font-bold text-white block">يمن نقل</span>
            <span className="text-[10px] text-primary-200">Yemen Naql</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden text-white hover:text-gray-300"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-6 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 12rem)' }}>
        {filteredMenuItems.map((item) => (
          <SidebarItem
            key={item.id || item.path}
            item={item}
            isOpen={openSubmenus[item.id]}
            onToggle={toggleSubmenu}
            onClick={() => onClose()}
          />
        ))}
      </nav>

      {/* Footer / User Settings */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-gray-50/50">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 font-bold rounded-lg transition-all duration-200 border border-transparent hover:border-red-100"
        >
          <LogOut className="w-4 h-4 ml-2" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
