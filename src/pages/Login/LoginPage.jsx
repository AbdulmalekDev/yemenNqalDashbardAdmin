import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Truck, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { useNotification } from '../../context/NotificationContext';

const LoginPage = () => {
  const { data: settings } = useSettings(true);
  const dynamicLogo = settings?.system?.logo || '/assets/images/logo.png';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, logout, isAuthenticated, loading: authLoading, resetPassword } = useAuth();
  const { showNotification } = useNotification();

  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Navigate to the requested page or dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.error) {
        setError(result.error);
        showNotification(result.error, 'error');
        setIsLoading(false);
      } else {
        showNotification('تم تسجيل الدخول بنجاح', 'success');
      }
      // Note: redirection is handled by the useEffect hook above
      // once isAuthenticated updates to true
    } catch (error) {
      setError('حدث خطأ أثناء تسجيل الدخول');
      showNotification('حدث خطأ أثناء تسجيل الدخول', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState({ text: '', type: '' });


  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage({ text: '', type: '' });

    const result = await resetPassword(forgotEmail);
    if (result.success) {
      setForgotMessage({ text: 'تم توليد رابط استعادة كلمة المرور الرسمي. يرجى مراجعة بريدك الإلكتروني (أو سجلات السيرفر إذا كنت في مرحلة التجربة).', type: 'success' });
      showNotification('تم إرسال رابط استعادة كلمة المرور بنجاح', 'success');
      // لا نحتاج لإغلاق النافذة فوراً، لنعطيه فرصة لقراءة الرسالة
      setTimeout(() => setShowForgotModal(false), 5000);
    } else {
      setForgotMessage({ text: result.error || 'فشل إرسال الرابط، تأكد من أن بريدك مسجل كمسؤول', type: 'error' });
      showNotification(result.error, 'error');
    }
    setForgotLoading(false);
  };

  // حماية من Flickering: إذا كان جاري التحقق من التوكن أو المستخدم مسجل بالفعل، لا تظهر النموذج
  if (authLoading || isAuthenticated) {
    return (
      <div className="min-h-screen bg-primary-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-white mb-2">يمن نقل</h1>
          <p className="text-primary-100">Yemen Naql - لوحة تحكم النظام</p>
        </div>

        {/* Login Form */}
        <div className="glass-card bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            تسجيل دخول المدير
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors duration-200"
                  placeholder="example@domain.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  كلمة المرور
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-accent-600 hover:text-accent-700 font-medium"
                >
                  نسيت كلمة المرور؟
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors duration-200"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 left-0 pl-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600 font-medium text-center">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent-500 text-white py-3 px-4 rounded-lg hover:bg-accent-600 focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                  جاري تسجيل الدخول...
                </div>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>


        </div>
      </div>
    </div>
  );
};

export default LoginPage;



















