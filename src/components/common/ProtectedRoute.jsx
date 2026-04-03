import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Mكون حماية المسارات (ProtectedRoute)
 * يتحقق من حالة المصادقة والدور المطلوب للوصول للمسار
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
        <p className="mt-4 text-gray-500 font-arabic">جاري التحقق من الصلاحيات...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // توجيه المستخدم لصفحة تسجيل الدخول مع حفظ المسار الذي كان يحاول الوصول إليه
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // إذا تم تحديد أدوار معينة للوصول
  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    // توجيه المستخدم للصفحة الرئيسية إذا لم يكن يملك الدور المطلوب
    console.warn(`Access denied to ${location.pathname}. Required roles: ${allowedRoles.join(', ')}`);
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
