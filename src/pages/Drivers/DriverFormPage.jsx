import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
    ArrowRight,
    Save,
    Truck,
    User,
    Phone,
    Mail,
    Hash,
    Info,
    AlertCircle,
    Loader2,
    ShieldCheck,
    FileText,
    Calendar,
    Lock
} from 'lucide-react';
import { useDriver, useAddDriver, useUpdateDriver } from '../../hooks/useDrivers';
import { useNotification } from '../../context/NotificationContext';
import { uploadFile } from '../../services/uploadService';
import { useState } from 'react';

const DriverFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;
    const { showNotification } = useNotification();

    const { data: driver, isLoading: isLoadingDriver } = useDriver(id);
    const addDriver = useAddDriver();
    const updateDriver = useUpdateDriver();

    const [files, setFiles] = useState({
        idFrontImage: null,
        idBackImage: null,
        passportImage: null,
        driverLicense: null,
        vehicleLicense: null,
        vehicleImage: null,
    });
    const [uploading, setUploading] = useState(false);

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
            vehicleType: '',
            vehicleModel: '',
            plateNumber: '',
        }
    });

    // تعبئة البيانات في حالة التعديل
    useEffect(() => {
        if (isEdit && driver) {
            let cleanPhone = (driver.phone || '').toString();
            if (cleanPhone.startsWith('+967')) cleanPhone = cleanPhone.substring(4);
            else if (cleanPhone.startsWith('967')) cleanPhone = cleanPhone.substring(3);
            else if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);

            reset({
                name: driver.name || driver.firstName || '',
                phone: cleanPhone,
                email: driver.email || '',
                vehicleType: driver.vehicleType || '',
                vehicleModel: driver.vehicleModel || '',
                plateNumber: driver.plateNumber || '',
            });
        }
    }, [driver, reset, isEdit]);

    const handleFileChange = (e, fieldName) => {
        if (e.target.files && e.target.files[0]) {
            setFiles(prev => ({ ...prev, [fieldName]: e.target.files[0] }));
        }
    };

    // دالة لاستخراج الحقول التي تغيرت فقط (Dirty Check)
    const getDirtyFields = (newData, originalData) => {
        const dirtyFields = {};
        Object.keys(newData).forEach(key => {
            const newVal = newData[key]?.toString().trim() || '';
            const oldVal = (originalData[key] || originalData['firstName'] || '').toString().trim() || '';
            
            if (newVal !== oldVal) {
                dirtyFields[key] = newData[key];
            }
        });
        return dirtyFields;
    };

    const onSubmit = async (data) => {
        try {
            setUploading(true);
            
            // Format phone correctly before saving or dirty check
            const formattedData = { ...data };
            if (formattedData.phone && !formattedData.phone.startsWith('+967')) {
                formattedData.phone = `+967${formattedData.phone}`;
            }

            // رفع الصور إذا تم اختيارها
            const uploadedUrls = {};
            for (const [key, file] of Object.entries(files)) {
                if (file) {
                    uploadedUrls[key] = await uploadFile(file, 'drivers');
                }
            }
            
            // دمج روابط الصور الجديدة مع بيانات الفورم
            const finalData = { ...formattedData, ...uploadedUrls };

            if (isEdit) {
                const dirtyData = getDirtyFields(finalData, driver);
                
                // إضافة روابط الصور الجديدة دائماً إلى الـ dirtyData إن وجدت
                Object.assign(dirtyData, uploadedUrls);
                
                if (Object.keys(dirtyData).length === 0) {
                    showNotification('لم يتم إجراء أي تغييرات للحفظ', 'info');
                    setUploading(false);
                    return navigate('/drivers');
                }

                await updateDriver.mutateAsync({ id, data: dirtyData });
                showNotification('تم تحديث البيانات المتغيرة بنجاح (Partial Update)', 'success');
            } else {
                await addDriver.mutateAsync(finalData);
                showNotification('تم إضافة السائق بنجاح', 'success');
            }
            navigate('/drivers');
        } catch (error) {
            console.error('Error saving driver:', error);
            const errorMessage = error?.response?.data?.message || error?.original?.response?.data?.message || error?.message || 'حدث خطأ أثناء حفظ البيانات';
            showNotification(errorMessage, 'error');
        } finally {
            setUploading(false);
        }
    };

    if (isEdit && isLoadingDriver) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
                <p className="text-gray-500 font-medium">جاري تحميل بيانات السائق...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-12">
            {/* Breadcrumbs / Header */}
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center space-x-4 space-x-reverse">
                    <button
                        onClick={() => navigate('/drivers')}
                        className="group p-2 bg-white text-gray-600 hover:text-primary-700 rounded-xl shadow-sm border border-gray-200 transition-all active:scale-95"
                    >
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            {isEdit ? 'تعديل ملف السائق' : 'إضافة سائق للمنصة'}
                        </h1>
                        <p className="text-gray-500 mt-1">
                            {isEdit ? `تحديث بيانات السائق المتواجد في النظام` : 'قم بتعبئة البيانات الأساسية لتدشين حساب السائق الجديد'}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Personal Info Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center space-x-3 space-x-reverse">
                            <div className="p-2 bg-primary-100 rounded-lg">
                                <User className="w-5 h-5 text-primary-700" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">المعلومات الشخصية والاتصال</h3>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 flex items-center space-x-1 space-x-reverse">
                                    <span>اسم السائق بالكامل</span>
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <User className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                                    <input
                                        {...register('name', { required: 'الاسم الكامل مطلوب' })}
                                        placeholder="مثال: أحمد محمد علي"
                                        className={`w-full pr-11 pl-4 py-3 bg-gray-50 border-2 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all ${errors.name ? 'border-red-300 bg-red-50' : 'border-transparent'}`}
                                    />
                                </div>
                                {errors.name && <p className="text-red-500 text-xs font-medium flex items-center mt-1"><AlertCircle className="w-3 h-3 ml-1" /> {errors.name.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 flex items-center space-x-1 space-x-reverse">
                                    <span>نوع الهوية</span>
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    {...register('identityType')}
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                                >
                                    <option value="national_id">هوية وطنية</option>
                                    <option value="passport">جواز سفر</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 flex items-center space-x-1 space-x-reverse">
                                    <span>رقم الهوية / الجواز</span>
                                </label>
                                <div className="relative group">
                                    <Hash className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                                    <input
                                        {...register('nationalId')}
                                        placeholder="مثال: 0101XXXXXXXX"
                                        className="w-full pr-11 pl-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 flex items-center space-x-1 space-x-reverse">
                                    <span>رقم الهاتف</span>
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <Phone className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                                    <input
                                        {...register('phone', {
                                            required: 'رقم الهاتف مطلوب',
                                            pattern: { value: /^7\d{8}$/, message: 'يجب أن يتكون رقم الهاتف من 9 أرقام ويبدأ بالرقم 7 (مثال: 777123456)' }
                                        })}
                                        placeholder="7xxxxxxxx"
                                        className={`w-full pr-11 pl-4 py-3 bg-gray-50 border-2 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all ${errors.phone ? 'border-red-300 bg-red-50' : 'border-transparent'}`}
                                    />
                                </div>
                                {errors.phone && <p className="text-red-500 text-xs font-medium flex items-center mt-1"><AlertCircle className="w-3 h-3 ml-1" /> {errors.phone.message}</p>}
                            </div>



                            {!isEdit && (
                                <div className="space-y-2 md:col-span-2">
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

                    {/* Vehicle Info Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center space-x-3 space-x-reverse">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Truck className="w-5 h-5 text-blue-700" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">بيانات المركبة الفنية</h3>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">نوع المركبة</label>
                                <div className="relative group">
                                    <Info className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                                    <input
                                        {...register('vehicleType', { required: 'نوع المركبة مطلوب' })}
                                        placeholder="دينا، شاحنة..."
                                        className={`w-full pr-11 pl-4 py-3 bg-gray-50 border-2 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all ${errors.vehicleType ? 'border-red-300 bg-red-50' : 'border-transparent'}`}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">الموديل (السنة)</label>
                                <div className="relative group">
                                    <Calendar className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                                    <input
                                        {...register('vehicleModel')}
                                        placeholder="2024"
                                        className="w-full pr-11 pl-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">رقم اللوحة</label>
                                <div className="relative group">
                                    <Hash className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                                    <input
                                        {...register('plateNumber')}
                                        placeholder="1234 / أ"
                                        className="w-full pr-11 pl-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Document Info Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center space-x-3 space-x-reverse">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <FileText className="w-5 h-5 text-orange-700" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">المستندات الرسمية</h3>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* الوثائق بناءً على نوع الهوية */}
                            <div className="space-y-2 md:col-span-3">
                                <h4 className="text-sm font-bold text-primary-700 border-b pb-2 mb-4">وثائق إثبات الشخصية</h4>
                            </div>

                            {/* إذا اختار جواز سفر */}
                            {register('identityType').value === 'passport' ? (
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">صورة جواز السفر</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e, 'passportImage')}
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                    />
                                    {driver?.passportImage && !files.passportImage && (
                                        <p className="text-xs text-green-600 mt-1">✓ متوفرة</p>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">الهوية (الوجه الأمامي)</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, 'idFrontImage')}
                                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                        />
                                        {driver?.idFrontImage && !files.idFrontImage && (
                                            <p className="text-xs text-green-600 mt-1">✓ متوفرة</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">الهوية (الوجه الخلفي)</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, 'idBackImage')}
                                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                        />
                                        {driver?.idBackImage && !files.idBackImage && (
                                            <p className="text-xs text-green-600 mt-1">✓ متوفرة</p>
                                        )}
                                    </div>
                                </>
                            )}

                            <div className="space-y-2 md:col-span-3">
                                <h4 className="text-sm font-bold text-primary-700 border-b pb-2 mb-4 mt-4">وثائق القيادة والمركبة</h4>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">رخصة القيادة</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, 'driverLicense')}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                />
                                {driver?.driverLicense && !files.driverLicense && (
                                    <p className="text-xs text-green-600 mt-1">✓ متوفرة</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">ملكية المركبة</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, 'vehicleLicense')}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                />
                                {driver?.vehicleLicense && !files.vehicleLicense && (
                                    <p className="text-xs text-green-600 mt-1">✓ متوفرة</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">صورة المركبة</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, 'vehicleImage')}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                />
                                {driver?.vehicleImage && !files.vehicleImage && (
                                    <p className="text-xs text-green-600 mt-1">✓ متوفرة</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info & Actions */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                        <h3 className="font-bold text-gray-900 flex items-center space-x-2 space-x-reverse border-b pb-4">
                            <ShieldCheck className="w-5 h-5 text-green-600" />
                            <span>حالة الحساب والأمان</span>
                        </h3>

                        <div className="space-y-4">
                            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                                <div className="flex items-start space-x-3 space-x-reverse">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                    <div className="text-sm text-yellow-800">
                                        <p className="font-bold mb-1">ملاحظة تنظيمية:</p>
                                        <p className="leading-relaxed">
                                            {isEdit ? 'تعديل البيانات الأساسية لا يؤثر على حالة التوثيق الحالية إلا إذا تم تغيير الحقول الحساسة.' : 'عند الإضافة، يوضع الحساب في وضع "المراجعة" بشكل تلقائي حتى يتم التأكد من الوثائق.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 space-y-3">
                                <button
                                    type="submit"
                                    disabled={addDriver.isPending || updateDriver.isPending}
                                    className="w-full flex items-center justify-center space-x-2 space-x-reverse px-6 py-4 bg-primary-700 text-white font-bold rounded-xl hover:bg-primary-800 active:scale-95 transition-all shadow-lg shadow-primary-700/20 disabled:opacity-50"
                                >
                                    {(addDriver.isPending || updateDriver.isPending) ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Save className="w-5 h-5" />
                                    )}
                                    <span>{isEdit ? 'تحديث البيانات' : 'اعتماد السائق'}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate('/drivers')}
                                    className="w-full px-6 py-3 text-gray-600 font-medium bg-gray-100 rounded-xl hover:bg-gray-200 transition-all active:scale-95"
                                >
                                    تجاهل وإلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default DriverFormPage;
