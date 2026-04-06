import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, ArrowRight, Key, CheckCircle2, Link, Loader2, Lock } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { useNotification } from '../../context/NotificationContext';

const ForgotPassword = () => {
  const { data: settings } = useSettings(true);
  const dynamicLogo = settings?.system?.logo || '/assets/images/logo.png';
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

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
        showNotification('تم توليد رابط استعادة كلمة المرور بنجاح', 'success');
        if (result.link) {
          setResetLink(result.link);
        }
      } else {
        showNotification(result.error || 'فشل إرسال الرابط، يرجى التاكد من صحة البريد', 'error');
      }
    } catch (error) {
      showNotification('حدث خطأ أثناء الاتصال بالخادم', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(resetLink);
    setIsCopied(true);
    showNotification('تم نسخ الرابط للحافظة', 'success');
    setTimeout(() => setIsCopied(false), 2000);
  };

  // إذا كان الرابط جاهزاً، اعرض "الشاشة النهائية" الاحترافية مع الزر المباشر
  if (resetLink) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 font-arabic animate-in fade-in zoom-in duration-500" dir="rtl">
        <div className="max-w-md w-full mx-auto bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-12 text-center border border-gray-100 ring-1 ring-black/5">
          <div className="w-28 h-28 bg-green-50 text-green-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-green-100/50 rotate-3 hover:rotate-0 transition-transform duration-300">
            <CheckCircle2 className="w-14 h-14" />
          </div>

          <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter">رابطك جاهز!</h2>
          <p className="text-gray-500 font-medium mb-12 leading-relaxed text-lg">
            انقر على الزر الموجود في الأسفل لنقلك مباشرة إلى نافذة تعيين كلمة المرور الجديدة:
          </p>

          <div className="space-y-8">
            <a
              href={String(resetLink)}
              className="w-full flex items-center justify-center gap-4 px-8 py-8 bg-primary-600 text-white rounded-[2rem] hover:bg-primary-700 transition-all shadow-2xl shadow-primary-200 font-black text-2xl border-b-[12px] border-primary-800 active:border-b-0 active:translate-y-2 transform hover:-translate-y-1 active:shadow-inner"
            >
              <Lock className="w-8 h-8" />
              تغيير كلمة المرور الآن
            </a>

            <div className="flex items-center gap-4 py-4">
              <div className="flex-1 h-px bg-gray-100"></div>
              <span className="text-xs text-gray-300 font-black uppercase tracking-widest">أو خيارات الإرسال</span>
              <div className="flex-1 h-px bg-gray-100"></div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={copyToClipboard}
                className="flex-1 flex items-center justify-center gap-3 py-5 bg-gray-50 text-gray-700 rounded-2xl hover:bg-gray-100 transition-all font-black border-2 border-gray-100 hover:border-primary-100"
              >
                {isCopied ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Link className="w-5 h-5" />}
                {isCopied ? 'تم النسخ!' : 'نسخ الرابط'}
              </button>

              <button
                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('يرجى الضغط على الرابط التالي لتغيير كلمة المرور الخاصة بك: ' + resetLink)}`, '_blank')}
                className="w-20 h-20 flex items-center justify-center bg-green-500 text-white rounded-3xl hover:bg-green-600 transition-all shadow-2xl shadow-green-100 transform hover:rotate-6 active:rotate-0"
                title="إرسال عبر واتساب"
              >
                <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.438 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                </svg>
              </button>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full py-4 text-gray-400 font-black hover:text-gray-900 transition-all text-sm"
            >
              العودة لشاشة الدخول
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-arabic" dir="rtl">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <img className="h-20 w-auto" src={dynamicLogo} alt="Logo" />
        </div>
        <h2 className="text-center text-4xl font-black text-gray-900 tracking-tight">استعادة كلمة المرور</h2>
        <p className="mt-2 text-center text-sm text-gray-500 font-medium">أدخل بريدك الإلكتروني كمسؤول لإرسال رابط الاستعادة الرسمي</p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-8 shadow-2xl rounded-[2.5rem] border border-gray-100 animate-in fade-in slide-in-from-bottom-5 duration-700">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-black text-gray-700 mr-1">البريد الإلكتروني</label>
              <div className="relative group">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full pr-12 pl-4 py-4 bg-gray-50 border-2 border-transparent border-gray-100 rounded-2xl placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-primary-100 focus:bg-white focus:border-primary-500 transition-all font-medium"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-4 px-4 bg-primary-600 hover:bg-primary-700 text-white text-lg font-black rounded-2xl shadow-lg shadow-primary-200 transition-all disabled:opacity-70 group"
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Key className="ml-2 w-6 h-6 group-hover:rotate-12 transition-transform" />
                    إرسال رابط الاستعادة
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 flex items-center justify-center">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center text-primary-600 hover:text-primary-500 font-black text-sm transition-colors group"
            >
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              العودة لتسجيل الدخول
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
