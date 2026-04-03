import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, ArrowRight, KeyRound } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { useNotification } from '../../context/NotificationContext';

const ForgotPassword = () => {
  const { data: settings } = useSettings(true);
  const dynamicLogo = settings?.system?.logo || '/assets/images/logo.png';
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      showNotification('يرجى إدخال البريد الإلكتروني', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPassword(email);
      if (result.success) {
        showNotification('تم إرسال رمز التحقق بنجاح', 'success');
        navigate('/verify-code', { state: { email } });
      } else {
        showNotification(result.error || 'فشل إرسال الرابط، يرجى التاكد من صحة البريد', 'error');
      }
    } catch (error) {
      showNotification('حدث خطأ أثناء الاتصال بالخادم', 'error');
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
          <h1 className="text-3xl font-bold text-white mb-2">استعادة كلمة المرور</h1>
          <p className="text-primary-100">أدخل بريدك الإلكتروني لإرسال الرابط</p>
        </div>

        {/* Forgot Password Form */}
        <div className="glass-card bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary-100 rounded-full text-primary-600">
              <KeyRound className="w-8 h-8" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="block w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors duration-200 text-left"
                  placeholder=" أدخل البريد الالكتروني "
                  dir="ltr"
                  required
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
                  جاري الإرسال...
                </div>
              ) : (
                'إرسال الرابط'
              )}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-accent-600 transition-colors"
            >
              <ArrowRight className="w-4 h-4 ml-1" />
              العودة إلى صفحة تسجيل الدخول
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
