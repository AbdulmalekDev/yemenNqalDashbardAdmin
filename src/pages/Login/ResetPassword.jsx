import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { KeyRound, Lock, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';
// Function to parse URL parameters natively if needed
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const ResetPassword = () => {
  const { data: settings } = useSettings(true);
  const dynamicLogo = settings?.system?.logo || '/assets/images/logo.png';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const query = useQuery();
  const oobCode = query.get('oobCode');

  useEffect(() => {
    if (!oobCode) {
      setStatus('error');
      setErrorMessage('رابط إعادة تعيين كلمة المرور غير صالح أو مفقود.');
    }
  }, [oobCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      showNotification('يرجى تعبئة جميع الحقول', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showNotification('كلمات المرور غير متطابقة', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const { data } = await api.post("/auth/confirm-reset", { oobCode, newPassword });

      if (data.success) {
        setStatus('success');
        showNotification('تم تغيير كلمة المرور بنجاح!', 'success');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      setStatus('error');
      const message = error.message || 'حدث خطأ بالاتصال بالخادم';
      setErrorMessage(message);
      showNotification(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4" style={{ backgroundImage: 'url(/login-background.jpg)' }}>
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full shadow-lg mb-4 overflow-hidden">
            <img
              src={dynamicLogo}
              alt="يمن نقل - Yemen Naql"
              className="w-20 h-20 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">إعادة تعيين كلمة المرور</h1>
          <p className="text-primary-100">قم بإدخال كلمة المرور الجديدة لحسابك</p>
        </div>

        {/* Reset Password Form */}
        <div className="glass-card bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20">

          {status === 'success' ? (
            <div className="text-center py-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">تم التحديث بنجاح</h3>
              <p className="text-sm text-gray-500 mb-6">لقد تم تغيير كلمة المرور الخاصة بك بنجاح. جاري تحويلك لصفحة تسجيل الدخول...</p>
            </div>
          ) : status === 'error' && !oobCode ? (
            <div className="text-center py-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">رابط غير صالح</h3>
              <p className="text-sm text-gray-500">{errorMessage}</p>
            </div>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-primary-100 rounded-full text-primary-600">
                  <KeyRound className="w-8 h-8" />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {status === 'error' && oobCode && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600 font-medium text-center">{errorMessage}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    كلمة المرور الجديدة
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors duration-200 text-left"
                      placeholder="••••••••"
                      dir="ltr"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    تأكيد كلمة المرور
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors duration-200 text-left"
                      placeholder="••••••••"
                      dir="ltr"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-accent-500 text-white py-3 px-4 rounded-lg hover:bg-accent-600 focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                      جاري التحديث...
                    </div>
                  ) : (
                    'تحديث كلمة المرور'
                  )}
                </button>
              </form>
            </>
          )}

          {/* Back to Login Link */}
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-accent-600 transition-colors"
            >
              <ArrowRight className="w-4 h-4 ml-1" />
              العودة إلى تسجيل الدخول
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
