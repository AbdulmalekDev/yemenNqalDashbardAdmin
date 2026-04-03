import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginWithBackend, getCurrentUser, logoutFromBackend } from '../services/authService';
import api from '../services/api';
import { ROLE_PERMISSIONS } from '../components/AdminLayout/constants';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ==================== مراقبة حالة المصادقة عبر الباكيند ====================
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await getCurrentUser();
        if (response.success && response.data) {
          const userData = response.data;
          // isAdmin يأتي من الباكيند بناءً على role === 'manager'
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('adminToken');
        }
      } catch (err) {
        console.error('فشل في التحقق من حالة الجلسة:', err);
        localStorage.removeItem('adminToken');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // ==================== تسجيل الدخول عبر الباكيند ====================
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await loginWithBackend(email, password);

      if (response.success && response.data) {
        const userData = response.data;
        // isAdmin, role, permissions كلها تأتي من الباكيند (من Collection "admins")
        setUser(userData);
        setIsAuthenticated(true);
        return { user: userData, error: null };
      }

      return { user: null, error: response.message || 'بيانات الدخول غير صحيحة' };
    } catch (error) {
      if (error && (error.status === 400 || error.status === 403)) {
        return { user: null, error: error.message || 'بيانات الدخول غير صحيحة' };
      }
      console.error('Login error:', error);
      return { user: null, error: error?.message || 'فشل في تسجيل الدخول' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutFromBackend();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
    }
  };

  const resetPassword = async (email) => {
    try {
      const { data } = await api.post("/auth/reset-password", { email });
      return { success: data.success, error: data.message };
    } catch (error) {
      return { success: false, error: error.message || 'فشل في إرسال بريد استعادة كلمة المرور' };
    }
  };

  const confirmResetPassword = async (oobCode, newPassword) => {
    try {
      const { data } = await api.post("/auth/confirm-reset-password", { oobCode, newPassword });
      return { success: data.success, error: data.message };
    } catch (error) {
      return { success: false, error: error.message || 'فشل في تأكيد تغيير كلمة المرور' };
    }
  };

  const hasRole = (role) => {
    if (!user) return false;
    if (user.role === 'manager') return true;
    if (Array.isArray(role)) return role.includes(user.role);
    return user.role === role;
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === 'manager' || user.isAdmin) return true;

    const userRole = user.role || 'default';
    const userPermissions = user.permissions || [];
    const roleDefaults = ROLE_PERMISSIONS[userRole] || [];

    // التحقق من الصلاحيات المباشرة أو الصلاحيات الافتراضية للدور
    const innerCheck = (p) => userPermissions.includes(p) || roleDefaults.includes(p);

    if (Array.isArray(permission)) {
      return permission.some(p => innerCheck(p));
    }
    return innerCheck(permission);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    hasRole,
    hasPermission,
    resetPassword,
    confirmResetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};