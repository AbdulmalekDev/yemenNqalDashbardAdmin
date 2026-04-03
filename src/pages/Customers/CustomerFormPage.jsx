import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
    ArrowRight,
    Save,
    User,
    Phone,
    Mail,
    Loader2,
    ShieldCheck,
    AlertCircle,
    BadgeCheck,
    Lock
} from 'lucide-react';
import { useCustomer, useAddCustomer, useUpdateCustomer } from '../../hooks/useCustomers';
import { useNotification } from '../../context/NotificationContext';

const CustomerFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;
    const { showNotification } = useNotification();

    const { data: customer, isLoading: isLoadingCustomer } = useCustomer(id);
    const addCustomer = useAddCustomer();
    const updateCustomer = useUpdateCustomer();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        defaultValues: {
            name: '',
            phone: '',
            password: 'yemen123456',
        }
    });

    // تعبئة البيانات في حالة التعديل
    useEffect(() => {
        if (isEdit && customer) {
            reset({
                name: customer.name || '',
                phone: customer.phone || '',
                email: customer.email || '',
            });
        }
    }, [customer, reset, isEdit]);

    // دالة لاستخراج الحقول التي تغيرت فقط (Dirty Check) لتقليل استهلاك الداتا
    const getDirtyFields = (newData, originalData) => {
        const dirtyFields = {};
        Object.keys(newData).forEach(key => {
            const newVal = newData[key]?.toString().trim() || '';
            const oldVal = (originalData[key] || '').toString().trim() || '';
            
            if (newVal !== oldVal) {
                dirtyFields[key] = newData[key];
            }
        });
        return dirtyFields;
    };

    const onSubmit = async (data) => {
        try {
            if (isEdit) {
                const dirtyData = getDirtyFields(data, customer);
                
                if (Object.keys(dirtyData).length === 0) {
                    showNotification('لم يتم إجراء أي تغييرات للحفظ', 'info');
                    return navigate('/customers');
                }

                await updateCustomer.mutateAsync({ id, data: dirtyData });
                showNotification('تم تحديث بيانات العميل بنجاح (Partial Update)', 'success');
            } else {
                // العملاء هم users في قاعدة البيانات
                await addCustomer.mutateAsync({ ...data, role: 'customer', status: 'نشط' });
                showNotification('تم إضافة العميل بنجاح', 'success');
            }
            navigate('/customers');
        } catch (error) {
            console.error('Error saving customer:', error);
            showNotification('حدث خطأ أثناء حفظ البيانات', 'error');
        }
    };

    if (isEdit && isLoadingCustomer) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
                <p className="text-gray-500 font-medium">جاري تحميل بيانات العميل...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-12">
            {/* Header Section */}
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center space-x-4 space-x-reverse">
                    <button
                        onClick={() => navigate('/customers')}
                        className="group p-2 bg-white text-gray-600 hover:text-primary-700 rounded-xl shadow-sm border border-gray-200 transition-all active:scale-95"
                    >
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            {isEdit ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
                        </h1>
                        <p className="text-gray-500 mt-1">
                            {isEdit ? 'تحديث المعلومات الأساسية لملف العميل' : 'قم بتعبئة بيانات العميل الجديد لإصدار حسابه'}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Basic Info Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center space-x-3 space-x-reverse">
                            <div className="p-2 bg-primary-100 rounded-lg">
                                <User className="w-5 h-5 text-primary-700" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">المعلومات الأساسية</h3>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 flex items-center space-x-1 space-x-reverse">
                                        <span>اسم العميل</span>
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative group">
                                        <User className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                                        <input
                                            {...register('name', { required: 'الاسم مطلوب' })}
                                            placeholder="الاسم الكامل"
                                            className={`w-full pr-11 pl-4 py-3 bg-gray-50 border-2 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all ${errors.name ? 'border-red-300 bg-red-50' : 'border-transparent'}`}
                                        />
                                    </div>
                                    {errors.name && <p className="text-red-500 text-xs font-medium flex items-center mt-1"><AlertCircle className="w-3 h-3 ml-1" /> {errors.name.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 flex items-center space-x-1 space-x-reverse">
                                        <span>رقم الهاتف</span>
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative group">
                                        <Phone className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                                        <input
                                            {...register('phone', { required: 'رقم الهاتف مطلوب' })}
                                            placeholder="7xxxxxxxx"
                                            className={`w-full pr-11 pl-4 py-3 bg-gray-50 border-2 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all ${errors.phone ? 'border-red-300 bg-red-50' : 'border-transparent'}`}
                                        />
                                    </div>
                                    {errors.phone && <p className="text-red-500 text-xs font-medium flex items-center mt-1"><AlertCircle className="w-3 h-3 ml-1" /> {errors.phone.message}</p>}
                                </div>
                            </div>



                            {!isEdit && (
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 flex items-center space-x-1 space-x-reverse">
                                        <span>كلمة المرور</span>
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative group">
                                        <Lock className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                                        <input
                                            {...register('password', { 
                                                required: 'كلمة المرور مطلوبة لإصدار الحساب',
                                                minLength: { value: 6, message: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل' }
                                            })}
                                            type="password"
                                            placeholder="••••••••"
                                            className={`w-full pr-11 pl-4 py-3 bg-gray-50 border-2 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all ${errors.password ? 'border-red-300 bg-red-50' : 'border-transparent'}`}
                                        />
                                    </div>
                                    {errors.password && <p className="text-red-500 text-xs font-medium flex items-center mt-1"><AlertCircle className="w-3 h-3 ml-1" /> {errors.password.message}</p>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                        <h3 className="font-bold text-gray-900 flex items-center space-x-2 space-x-reverse border-b pb-4">
                            <ShieldCheck className="w-5 h-5 text-green-600" />
                            <span>الإدارة والأمان</span>
                        </h3>

                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 border-dashed">
                                <div className="flex items-center space-x-3 space-x-reverse text-blue-800">
                                    <BadgeCheck className="w-5 h-5" />
                                    <span className="text-sm font-bold">حساب مفعل تلقائياً</span>
                                </div>
                                <p className="text-xs text-blue-600 mt-2 leading-relaxed">
                                    بمجرد إضافة العميل، سيتمكن من تسجيل الدخول واستخدام كافة مميزات المنصة فوراً دون انتظار مراجعة.
                                </p>
                            </div>

                            <div className="pt-4 space-y-3">
                                <button
                                    type="submit"
                                    disabled={addCustomer.isPending || updateCustomer.isPending}
                                    className="w-full flex items-center justify-center space-x-2 space-x-reverse px-6 py-4 bg-primary-700 text-white font-bold rounded-xl hover:bg-primary-800 active:scale-95 transition-all shadow-lg shadow-primary-700/20 disabled:opacity-50"
                                >
                                    {(addCustomer.isPending || updateCustomer.isPending) ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Save className="w-5 h-5" />
                                    )}
                                    <span>{isEdit ? 'حفظ التعديلات' : 'إضافة العميل'}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate('/customers')}
                                    className="w-full px-6 py-3 text-gray-600 font-medium bg-gray-100 rounded-xl hover:bg-gray-200 transition-all active:scale-95"
                                >
                                    إلغاء العملية
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CustomerFormPage;
