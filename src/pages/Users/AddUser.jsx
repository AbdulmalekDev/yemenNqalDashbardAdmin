import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    UserPlus,
    ArrowRight,
    Shield,
    Mail,
    Lock,
    User,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    Phone
} from 'lucide-react';
import { addUser } from './UserService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const AddUser = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuth();
    const { showNotification } = useNotification();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'default'
    });
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const mutation = useMutation({
        mutationFn: addUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admins'] });
            showNotification('تم إضافة المستخدم بنجاح', 'success');
            setIsSuccess(true);
            setTimeout(() => navigate('/users'), 2000);
        },
        onError: (err) => {
            setError(err.message || 'فشل في إنشاء الحساب');
            showNotification(err.message || 'فشل في إنشاء الحساب', 'error');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (currentUser?.role !== 'manager') {
            showNotification('عذراً، هذا الإجراء مخصص للمديرين فقط', 'error');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('كلمات المرور غير متطابقة');
            return;
        }
        if (formData.password.length < 6) {
            setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            return;
        }

        mutation.mutate({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role
        });
    };

    return (
        <div className="max-w-2xl mx-auto py-10 px-4 animate-in fade-in duration-500 font-arabic" dir="rtl">
            <Link to="/users" className="inline-flex items-center text-gray-500 hover:text-primary-700 mb-8 transition-colors font-bold text-sm">
                <ArrowRight className="w-4 h-4 ml-2" />
                العودة لقائمة المستخدمين
            </Link>

            <div className="bg-white rounded-[3rem] shadow-2xl shadow-primary-50 border border-gray-100 overflow-hidden">
                <div className="bg-primary-600 px-10 py-12 text-white relative">
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center backdrop-blur-md">
                            <UserPlus className="w-10 h-10" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black mb-1">إضافة مستخدم جديد</h1>
                            <p className="text-primary-100 opacity-80 text-sm font-medium">
                                قم بإنشاء حساب جديد للوصول إلى لوحة التحكم حسب الصلاحيات
                            </p>
                        </div>
                    </div>
                    <div className="absolute top-0 left-0 w-full h-full opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mt-4"></div>
                </div>

                {isSuccess ? (
                    <div className="p-20 text-center animate-in zoom-in-95 duration-500">
                        <div className="w-28 h-28 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                            <CheckCircle2 className="w-16 h-16" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">تم الإنشاء بنجاح!</h2>
                        <p className="text-gray-500 font-medium">جاري تحويلك إلى قائمة المستخدمين...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-10 space-y-8">
                        {error && (
                            <div className="bg-red-50 border-r-4 border-red-500 p-4 rounded-2xl flex items-start text-sm text-red-700 font-medium animate-shake">
                                <AlertTriangle className="w-5 h-4 ml-3 mt-0.5 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-gray-700 mr-2 flex items-center gap-2">
                                    <User className="w-4 h-4 text-primary-500" /> الاسم الكامل للمسـتخدم
                                </label>
                                <input
                                    type="text" required
                                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:ring-4 focus:ring-primary-100 focus:bg-white focus:border-primary-500 transition-all outline-none font-bold"
                                    placeholder="مثال: يـاسر الأحمدي"
                                    autoComplete="off"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-black text-gray-700 mr-2 flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-primary-500" /> البريد الإلكتروني
                                </label>
                                <input
                                    type="email" required
                                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:ring-4 focus:ring-primary-100 focus:bg-white focus:border-primary-500 transition-all outline-none font-bold"
                                    placeholder="admin@yemennaql.com"
                                    autoComplete="off"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-black text-gray-700 mr-2 flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-primary-500" /> رقم الهاتف
                                </label>
                                <input
                                    type="text" required
                                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:ring-4 focus:ring-primary-100 focus:bg-white focus:border-primary-500 transition-all outline-none font-bold"
                                    placeholder="مثال: 777123456"
                                    autoComplete="off"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-black text-gray-700 mr-2 flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-primary-500" /> كلمة المرور
                                </label>
                                <input
                                    type="password" required minLength="6"
                                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:ring-4 focus:ring-primary-100 focus:bg-white focus:border-primary-500 transition-all outline-none text-left font-sans"
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-black text-gray-700 mr-2 flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-primary-500" /> تأكيد كلمة المرور
                                </label>
                                <input
                                    type="password" required
                                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:ring-4 focus:ring-primary-100 focus:bg-white focus:border-primary-500 transition-all outline-none text-left font-sans"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-black text-gray-700 mr-2 flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-primary-500" /> تعيين الصلاحيات (User Role)
                                </label>
                                <div className="grid grid-cols-3 gap-6">
                                    {[
                                        { id: 'default', label: 'مستخدم عادي' },
                                        { id: 'supervisor', label: 'مشرف' },
                                        { id: 'manager', label: 'مدير' }
                                    ].map((r) => (
                                        <button
                                            key={r.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, role: r.id })}
                                            className={`flex items-center justify-center gap-3 p-6 rounded-[2rem] border-2 transition-all font-black text-lg ${formData.role === r.id
                                                ? 'bg-primary-50 border-primary-500 text-primary-700 ring-4 ring-primary-50'
                                                : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                                                }`}
                                        >
                                            <Shield className="w-7 h-7" />
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-10 flex flex-col md:flex-row gap-5">
                            <button
                                type="submit"
                                disabled={mutation.isPending}
                                className="flex-3 bg-primary-600 text-white font-black h-16 rounded-[1.5rem] hover:bg-primary-700 shadow-xl shadow-primary-200 transition-all disabled:opacity-70 flex items-center justify-center gap-3 text-lg"
                            >
                                {mutation.isPending ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        جاري الإنشاء...
                                    </>
                                ) : (
                                    <>إنشاء حساب المستخدم الجديد</>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/users')}
                                className="flex-1 px-10 h-16 bg-gray-100 text-gray-700 font-black rounded-[1.5rem] hover:bg-gray-200 transition-all"
                            >
                                إلغاء
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AddUser;