import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { useNotification } from '../../context/NotificationContext';

const VerifyCode = () => {
  const { data: settings } = useSettings(true);
  const dynamicLogo = settings?.system?.logo || '/assets/images/logo.png';
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();
  const email = location.state?.email || 'بريدك الإلكتروني';

  // Handle input change
  const handleChange = (index, value) => {
    if (isNaN(value)) return; // Only allow numbers

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Focus next input
    if (value !== '' && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && index > 0 && code[index] === '') {
      inputRefs[index - 1].current.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    const pasteData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pasteData)) return;

    const newCode = [...code];
    pasteData.split('').forEach((char, index) => {
      if (index < 6) newCode[index] = char;
    });
    setCode(newCode);

    // Focus last input or appropriate one
    const nextIndex = pasteData.length < 6 ? pasteData.length : 5;
    inputRefs[nextIndex].current.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length < 6) {
      showNotification('يرجى إدخال رمز التحقق كاملاً', 'error');
      return;
    }

    setIsLoading(true);
    // Since Firebase uses links, this is a placeholder UI flow as requested.
    // In a real OTP system, we would verify here. 
    // For now, we simulate success and guide the user.
    setTimeout(() => {
      setIsLoading(false);
      showNotification('لمزيد من الأمان، يرجى الضغط على الرابط المرسل إلى بريدك الإلكتروني لتفعيل تغيير كلمة المرور.', 'info');
      // We don't navigate to ResetPassword directly because it needs oobCode from URL
    }, 1500);
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
          <h1 className="text-3xl font-bold text-white mb-2">رمز التحقق</h1>
          <p className="text-primary-100">تم إرسال رمز التحقق إلى بريدك الإلكتروني</p>
        </div>

        {/* OTP Form */}
        <div className="glass-card bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary-100 rounded-full text-primary-600">
              <ShieldCheck className="w-8 h-8" />
            </div>
          </div>

          <div className="text-center mb-8">
            <p className="text-gray-600 mb-2">أدخل الرمز المكون من 6 أرقام المرسل إلى:</p>
            <p className="font-bold text-gray-900" dir="ltr">{email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex justify-between gap-2" dir="ltr">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-accent-500 focus:ring-2 focus:ring-accent-500 transition-all outline-none bg-white text-gray-900"
                  required
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent-500 text-white py-3 px-4 rounded-lg hover:bg-accent-600 focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                  جاري التحقق...
                </div>
              ) : (
                'تحقق الآن'
              )}
            </button>
          </form>

          <div className="mt-8 text-center space-y-4">
            <p className="text-sm text-gray-500">
              لم يصلك الرمز؟{' '}
              <button
                onClick={() => navigate('/forgot-password')}
                className="text-accent-600 hover:underline font-medium"
              >
                إعادة الإرسال
              </button>
            </p>
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

export default VerifyCode;
