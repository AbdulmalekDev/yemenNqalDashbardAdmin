import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Upload,
  DollarSign,
  Clock,
  Truck,
  Package,
  Shield,
  User,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  Image as ImageIcon,
  Edit2,
  Check,
} from 'lucide-react';
import { useSettings, useUpdateSettings } from '../../hooks/useSettings';
import { useAuth } from '../../context/AuthContext';
import { uploadSystemLogo } from '../../services/managementService';
import { updateProfile, updatePassword } from '../../services/authService';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const { user } = useAuth();
  const { data: settingsData, isLoading, isError, error, refetch } = useSettings();
  const updateSettingsMutation = useUpdateSettings();
  const [activeTab, setActiveTab] = useState(user?.role === 'manager' ? 'pricing' : 'profile');
  const [localSettings, setLocalSettings] = useState(null);
  const [showConfirm, setShowConfirm] = useState({ show: false, action: null, id: null, type: null });
  const [isUploading, setIsUploading] = useState(false);
  const [editingVehicles, setEditingVehicles] = useState({});

  // حالات الملف الشخصي والأمان
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isProfileUpdating, setIsProfileUpdating] = useState(false);
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);

  // تحديث الإعدادات المحلية عند جلب البيانات
  useEffect(() => {
    if (settingsData) {
      setLocalSettings(settingsData);
    }
  }, [settingsData]);

  // تحديث نموذج الملف الشخصي عند توفر بيانات المستخدم
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.displayName || user.name || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const handleSave = () => {
    if (!localSettings || !settingsData) return;

    const changes = [];

    // فحص تغيرات العمولة
    if (localSettings.commission?.platform !== settingsData.commission?.platform) {
      changes.push("نسب العمولة");
    }

    // فحص الإضافات للقوائم
    const hasAdded = localSettings.vehicleTypes?.some(v => String(v.id).startsWith('new_')) ||
      localSettings.cargoTypes?.some(c => String(c.id).startsWith('new_'));

    if (hasAdded) {
      changes.push("إضافة عناصر جديدة");
    }

    // فحص تغيرات ساعات العمل
    if (localSettings.workingHours?.start !== settingsData.workingHours?.start ||
      localSettings.workingHours?.end !== settingsData.workingHours?.end) {
      changes.push("ساعات العمل");
    }

    // فحص تغيرات أسعار المركبات (perKm)
    const oldPerKm = JSON.stringify(settingsData.pricing?.perKm || {});
    const newPerKm = JSON.stringify(localSettings.pricing?.perKm || {});
    if (oldPerKm !== newPerKm) {
      changes.push("أسعار المركبات");
    }

    const { id, ...dataToSave } = localSettings;

    let successMessage = "تم حفظ التغييرات بنجاح";
    if (changes.length > 0) {
      successMessage = `تم بنجاح تحديث ${changes.join(" و ")}`;
    }

    toast.promise(
      updateSettingsMutation.mutateAsync(dataToSave),
      {
        loading: 'جاري حفظ الإعدادات...',
        success: successMessage,
        error: 'حدث خطأ أثناء حفظ البيانات',
      }
    );
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!profileForm.name || !profileForm.email) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setIsProfileUpdating(true);
    toast.promise(
      updateProfile(profileForm).finally(() => setIsProfileUpdating(false)),
      {
        loading: 'جاري تحديث الملف الشخصي...',
        success: 'تم تعديل الملف الشخصي بنجاح',
        error: 'فشل تحديث البيانات',
      }
    );
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('يرجى ملء جميع حقول كلمة المرور');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('كلمات المرور الجديدة غير متطابقة');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('يجب أن تكون كلمة المرور 6 أحرف على الأقل');
      return;
    }

    setIsPasswordUpdating(true);
    toast.promise(
      updatePassword({ currentPassword, newPassword }).finally(() => setIsPasswordUpdating(false)),
      {
        loading: 'جاري تغيير كلمة المرور...',
        success: (response) => {
          if (response.success) {
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            return 'تم تحديث كلمة المرور بنجاح';
          }
          throw new Error(response.message || 'فشل تحديث البيانات');
        },
        error: (err) => err?.message || 'فشل تحديث البيانات',
      }
    );
  };

  const handleInputChange = (section, field, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // --- إدارة أسعار المركبات (perKm) ---
  const vehicleNameMap = {
    dina: 'دينا',
    pickup: 'بيك أب',
    sathha: 'سطحة',
    truck: 'شاحنة',
  };

  const handlePerKmChange = (vehicleKey, newPrice) => {
    setLocalSettings(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        perKm: {
          ...prev.pricing?.perKm,
          [vehicleKey]: parseInt(newPrice) || 0
        }
      }
    }));
  };

  const confirmVehicleEdit = async (vehicleKey) => {
    // إغلاق وضع التعديل
    setEditingVehicles(prev => ({ ...prev, [vehicleKey]: false }));

    // إرسال التحديث المستقل للباكند مباشرة
    const updatedPerKm = localSettings.pricing?.perKm || {};

    toast.promise(
      updateSettingsMutation.mutateAsync({
        pricing: {
          perKm: updatedPerKm
        }
      }),
      {
        loading: 'جاري تحديث سعر المركبة...',
        success: 'تم تعديل السعر في قاعدة البيانات بنجاح',
        error: 'فشل في تحديث السعر'
      }
    );
  };

  const addVehiclePricing = () => {
    const key = `vehicle_${Date.now()}`;
    setLocalSettings(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        perKm: {
          ...prev.pricing?.perKm,
          [key]: 0
        }
      }
    }));
    toast.success('تم إضافة مركبة جديدة. قم بتحديث الاسم والسعر ثم اضغط حفظ.');
  };

  const removeVehiclePricing = (vehicleKey) => {
    setLocalSettings(prev => {
      const updatedPerKm = { ...prev.pricing?.perKm };
      delete updatedPerKm[vehicleKey];
      return {
        ...prev,
        pricing: {
          ...prev.pricing,
          perKm: updatedPerKm
        }
      };
    });
    toast.success('تم حذف المركبة محلياً. اضغط "حفظ التغييرات" للتأكيد.');
  };

  const renameVehicleKey = (oldKey, newKey) => {
    if (!newKey || newKey === oldKey) return;
    setLocalSettings(prev => {
      const currentPerKm = { ...prev.pricing?.perKm };
      const price = currentPerKm[oldKey];
      delete currentPerKm[oldKey];
      currentPerKm[newKey] = price;
      return {
        ...prev,
        pricing: {
          ...prev.pricing,
          perKm: currentPerKm
        }
      };
    });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    toast.promise(
      (async () => {
        const url = await uploadSystemLogo(file);
        const updatedSystem = { ...(localSettings?.system || {}), logo: url };
        setLocalSettings(prev => ({ ...prev, system: updatedSystem }));
        return updateSettingsMutation.mutateAsync({ system: updatedSystem });
      })().finally(() => setIsUploading(false)),
      {
        loading: 'جاري رفع وحفظ الشعار...',
        success: 'تم رفع شعار النظام بنجاح',
        error: 'حدث خطأ أثناء رفع الشعار',
      }
    );
  };


  // حالة التحميل
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الإعدادات...</p>
        </div>
      </div>
    );
  }

  // حالة الخطأ
  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">حدث خطأ في تحميل الإعدادات</h3>
          <p className="text-gray-500 mb-4">{error?.message || "حدث خطأ غير متوقع"}</p>
          <button
            onClick={() => refetch()}
            className="flex items-center mx-auto space-x-2 space-x-reverse bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            < RefreshCw className="w-4 h-4" />
            <span>إعادة المحاولة</span>
          </button>
        </div>
      </div>
    );
  }

  if (!localSettings) return null;

  const settings = localSettings;

  const tabs = [
    { id: 'pricing', label: 'الأسعار', icon: DollarSign, roles: ['manager'] },
    { id: 'security', label: 'الأمان', icon: Shield, roles: ['supervisor', 'manager', 'default'] },
    { id: 'profile', label: 'الملف الشخصي', icon: User, roles: ['supervisor', 'manager', 'default'] }
  ].filter(tab => tab.roles.includes(user?.role));

  const renderPricingSettings = () => (
    <div className="space-y-6">
      {/* --- جدول أسعار المركبات حسب الكيلومتر (قابل للتعديل) --- */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        {/* <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <Truck className="w-6 h-6 text-primary-700" />
            <h3 className="text-xl font-bold text-gray-900">أسعار المركبات لكل كيلومتر</h3>
          </div>
          <button
            onClick={addVehiclePricing}
            className="flex items-center space-x-2 space-x-reverse bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مركبة</span>
          </button>
        </div> */}

        {/* جدول المركبات */}
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">نوع المركبة</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">السعر لكل كيلومتر (ريال)</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 w-24">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {settings.pricing?.perKm && Object.entries(settings.pricing.perKm).map(([key, value]) => {
                const displayName = vehicleNameMap[key] || key;
                const isKnownVehicle = !!vehicleNameMap[key];
                return (
                  <tr key={key} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Truck className="w-5 h-5 text-primary-700" />
                        </div>
                        {isKnownVehicle ? (
                          <span className="font-semibold text-gray-900">{displayName}</span>
                        ) : (
                          <input
                            type="text"
                            value={key}
                            onChange={(e) => renameVehicleKey(key, e.target.value.trim())}
                            placeholder="اسم المركبة (بالإنجليزية)"
                            className="border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent font-semibold text-gray-900 w-48"
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingVehicles[key] ? (
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => handlePerKmChange(key, e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent font-bold text-primary-700 w-40"
                          min="0"
                        />
                      ) : (
                        <span className="font-bold text-primary-700 bg-primary-50 px-4 py-1.5 rounded-lg">
                          {Number(value).toLocaleString()} ريال
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => {
                            if (editingVehicles[key]) {
                              confirmVehicleEdit(key);
                            } else {
                              setEditingVehicles(prev => ({ ...prev, [key]: true }));
                            }
                          }}
                          className={`p-2 rounded-lg transition-colors ${editingVehicles[key] ? 'text-green-600 hover:bg-green-50' : 'text-blue-500 hover:bg-blue-50'}`}
                          title={editingVehicles[key] ? "حفظ التعديل" : "تعديل السعر"}
                        >
                          {editingVehicles[key] ? <Check className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => setShowConfirm({ show: true, type: 'perKm', id: key })}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف المركبة"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(!settings.pricing?.perKm || Object.keys(settings.pricing.perKm).length === 0) && (
                <tr>
                  <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                    لا توجد مركبات مسجلة. اضغط "إضافة مركبة" لإضافة مركبة جديدة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-4">نسب العمولة</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">عمولة المنصة (%)</label>
            <input
              type="number"
              value={settings.commission?.platform || 0}
              onChange={(e) => handleInputChange('commission', 'platform', parseInt(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              max="100"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-4">تغيير كلمة المرور</h3>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور الحالية</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور الجديدة</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">تأكيد كلمة المرور</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
          <button
            onClick={handlePasswordUpdate}
            disabled={isPasswordUpdating}
            className="flex items-center space-x-2 space-x-reverse bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {isPasswordUpdating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Shield className="w-4 h-4" />
            )}
            <span>تحديث كلمة المرور</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-4">الملف الشخصي</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الاسم</label>
            <input
              type="text"
              value={profileForm.name}
              onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
            <input
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={handleProfileUpdate}
            disabled={isProfileUpdating}
            className="flex items-center space-x-2 space-x-reverse bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {isProfileUpdating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <User className="w-4 h-4" />
            )}
            <span>تحديث البيانات الشخصية</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-4">شعار النظام</h3>
        <div className="flex items-center space-x-6 space-x-reverse">
          <div className="w-32 h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden group relative">
            {settings.system?.logo ? (
              <img src={settings.system.logo} alt="شعار التطبيق" className="w-full h-full object-contain p-2" />
            ) : (
              <ImageIcon className="w-12 h-12 text-gray-300" />
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700"></div>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div className="relative">
              <input
                type="file"
                id="logo-upload"
                className="hidden"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={isUploading}
              />
              <label
                htmlFor="logo-upload"
                className={`flex items-center space-x-2 space-x-reverse bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-all cursor-pointer shadow-md active:scale-95 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Upload className="w-5 h-5" />
                <span>{isUploading ? 'جاري الرفع...' : 'رفع شعار جديد'}</span>
              </label>
            </div>
            <p className="text-sm text-gray-500">يدعم PNG, JPG حتى 5MB. سيتم التحديث في جميع الصفحات.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'pricing': return renderPricingSettings();
      case 'security': return renderSecuritySettings();
      case 'profile': return renderProfileSettings();
      default: return renderPricingSettings();
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 space-x-reverse">
          <Settings className="w-8 h-8 text-primary-700" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">الإعدادات</h1>
            <p className="text-gray-600">إدارة إعدادات النظام والتكوين</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <button
            onClick={handleSave}
            disabled={updateSettingsMutation.isPending}
            className="flex items-center space-x-2 space-x-reverse bg-primary-700 text-white px-6 py-2 rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-50"
          >
            {updateSettingsMutation.isPending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>حفظ التغييرات</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100">
            <nav className="p-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg text-right transition-colors ${activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {renderTabContent()}
        </div>
        {/* Confirmation Modal */}
        {showConfirm.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 scale-in-center overflow-hidden">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4 text-red-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">تأكيد الحذف</h3>
              <p className="text-gray-500 text-center mb-6">
                هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
              <div className="flex space-x-3 space-x-reverse">
                <button
                  onClick={() => {
                    if (showConfirm.type === 'perKm') {
                      removeVehiclePricing(showConfirm.id);
                    }
                    setShowConfirm({ show: false, action: null, id: null, type: null });
                  }}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  حذف
                </button>
                <button
                  onClick={() => setShowConfirm({ show: false, action: null, id: null, type: null })}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;