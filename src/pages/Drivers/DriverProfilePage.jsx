// import React from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import {
//   ArrowRight,
//   Phone,
//   Mail,
//   Calendar,
//   Truck,
//   FileText,
//   Star,
//   Package,
//   DollarSign,
//   Pause,
//   Check,
//   X,
//   AlertCircle,
//   RefreshCw,
//   Edit,
// } from 'lucide-react';
// import { useDriver, useUpdateDriverStatus } from '../../hooks/useDrivers';
// import { useAuth } from '../../context/AuthContext';
// import { useNotification } from '../../context/NotificationContext';

// const DriverProfilePage = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const { user, hasPermission } = useAuth();
//   const canEdit = hasPermission('manage_drivers');
//   const { showNotification } = useNotification();

//   // ==================== React Query ====================
//   const { data: driver, isLoading, isError, error, refetch } = useDriver(id);
//   const updateStatus = useUpdateDriverStatus();

//   // ==================== تحديث الحالة ====================
//   const handleAction = async (action) => {
//     const statusMap = {
//       accept: 'مقبول',
//       reject: 'مرفوض',
//       suspend: 'معلق',
//     };
//     const newStatus = statusMap[action];
//     if (newStatus) {
//       try {
//         await updateStatus.mutateAsync({ id, status: newStatus });
//         showNotification(`تم تحديث حالة السائق إلى: ${newStatus}`, 'success');
//       } catch (err) {
//         showNotification('حدث خطأ أثناء تحديث الحالة', 'error');
//       }
//     }
//   };

//   const getStatusBadge = (status) => {
//     const statusClasses = {
//       'متصل': 'bg-green-100 text-green-800',
//       'غير متصل': 'bg-gray-100 text-gray-800',
//     };
//     return statusClasses[status] || 'bg-gray-100 text-gray-800';
//   };

//   const getAccountStatusBadge = (status) => {
//     const statusClasses = {
//       'مقبول': 'bg-green-100 text-green-800',
//       'معلق': 'bg-yellow-100 text-yellow-800',
//       'مرفوض': 'bg-red-100 text-red-800',
//     };
//     return statusClasses[status] || 'bg-gray-100 text-gray-800';
//   };

//   // ==================== حالة التحميل ====================
//   if (isLoading) {
//     return (
//       <div className="flex flex-col items-center justify-center py-20 space-y-4">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
//         <p className="text-gray-500 text-lg">جاري تحميل بيانات السائق...</p>
//       </div>
//     );
//   }

//   // ==================== حالة الخطأ ====================
//   if (isError) {
//     return (
//       <div className="flex flex-col items-center justify-center py-20 space-y-4">
//         <AlertCircle className="w-12 h-12 text-red-400" />
//         <p className="text-red-500 text-lg">حدث خطأ أثناء تحميل بيانات السائق</p>
//         <p className="text-gray-400 text-sm">{error?.message}</p>
//         <button
//           onClick={() => refetch()}
//           className="flex items-center space-x-2 space-x-reverse bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
//         >
//           <RefreshCw className="w-4 h-4" />
//           <span>إعادة المحاولة</span>
//         </button>
//       </div>
//     );
//   }

//   // ==================== السائق غير موجود ====================
//   if (!driver) {
//     return (
//       <div className="text-center py-12">
//         <p className="text-gray-500">لم يتم العثور على السائق</p>
//         <button
//           onClick={() => navigate('/drivers')}
//           className="mt-4 text-primary-600 hover:text-primary-700"
//         >
//           العودة إلى قائمة السائقين
//         </button>
//       </div>
//     );
//   }

//   const driverName = driver.name || driver.firstName || 'بدون اسم';
//   const accountStatus = driver.verificationStatus || 'معلق';
//   const onlineStatus = driver.isOnline ? 'متصل' : 'غير متصل';
//   const joinDate = driver.createdAt?._seconds
//     ? new Date(driver.createdAt._seconds * 1000)
//     : driver.createdAt
//       ? new Date(driver.createdAt)
//       : new Date();

//   return (
//     <div className="space-y-6">
//       {/* Page Header */}
//       <div className="flex items-center justify-between">
//         <div className="flex items-center space-x-4 space-x-reverse">
//           <button
//             onClick={() => navigate('/drivers')}
//             className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
//           >
//             <ArrowRight className="w-5 h-5" />
//           </button>
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900">الملف الشخصي للسائق</h1>
//             <p className="text-gray-600">معلومات شاملة عن السائق</p>
//           </div>
//         </div>

//         <div className="flex items-center space-x-3 space-x-reverse">
//           {canEdit && (
//             <>
//               {accountStatus === 'معلق' && (
//                 <div className="flex items-center space-x-3 space-x-reverse">
//                   <button
//                     onClick={() => handleAction('accept')}
//                     disabled={updateStatus.isPending}
//                     className="flex items-center space-x-2 space-x-reverse bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
//                   >
//                     <Check className="w-4 h-4" />
//                     <span>قبول السائق</span>
//                   </button>
//                   <button
//                     onClick={() => handleAction('reject')}
//                     disabled={updateStatus.isPending}
//                     className="flex items-center space-x-2 space-x-reverse bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
//                   >
//                     <X className="w-4 h-4" />
//                     <span>رفض السائق</span>
//                   </button>
//                 </div>
//               )}

//               {accountStatus === 'مقبول' && (
//                 <button
//                   onClick={() => handleAction('suspend')}
//                   disabled={updateStatus.isPending}
//                   className="flex items-center space-x-2 space-x-reverse bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition disabled:opacity-50 font-bold"
//                 >
//                   <Pause className="w-5 h-5" />
//                   <span>إيقاف الحساب</span>
//                 </button>
//               )}

//               <button
//                 onClick={() => navigate(`/drivers/edit/${id}`)}
//                 className="flex items-center space-x-2 space-x-reverse bg-primary-700 text-white px-4 py-2 rounded-lg hover:bg-primary-800 transition shadow-md font-bold"
//               >
//                 <Edit className="w-5 h-5" />
//                 <span>تعديل البيانات</span>
//               </button>
//             </>
//           )}
//         </div>
//       </div>

//       {/* Driver Card + Details */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Profile Card */}
//         <div className="lg:col-span-1">
//           <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
//             <div className="text-center">
//               <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <span className="text-primary-700 font-bold text-2xl">
//                   {driverName.charAt(0)}
//                 </span>
//               </div>
//               <h2 className="text-xl font-bold text-gray-900 mb-2">{driverName}</h2>

//               <div className="space-y-2 mb-4">
//                 <div className="flex items-center justify-center space-x-2 space-x-reverse text-sm text-gray-600">
//                   <Phone className="w-4 h-4" />
//                   <span>{driver.phone || 'لا يوجد'}</span>
//                 </div>
//                 <div className="flex items-center justify-center space-x-2 space-x-reverse text-sm text-gray-600">
//                   <Mail className="w-4 h-4" />
//                   <span>{driver.email || 'لا يوجد'}</span>
//                 </div>
//               </div>

//               <div className="space-y-3">
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-gray-600">حالة الاتصال</span>
//                   <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(onlineStatus)}`}>
//                     {onlineStatus}
//                   </span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-gray-600">حالة الحساب</span>
//                   <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAccountStatusBadge(accountStatus)}`}>
//                     {accountStatus}
//                   </span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-gray-600">التقييم</span>
//                   <div className="flex items-center space-x-1 space-x-reverse">
//                     <Star className="w-4 h-4 text-yellow-400 fill-current" />
//                     <span className="font-medium">{driver.rating || 0}</span>
//                   </div>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-gray-600">تاريخ الانضمام</span>
//                   <span className="text-sm font-medium text-gray-900">
//                     {joinDate.toLocaleDateString('ar-SA')}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Details */}
//         <div className="lg:col-span-2 space-y-6">
//           {/* Vehicle Info */}
//           <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
//             <div className="flex items-center space-x-3 space-x-reverse mb-4">
//               <Truck className="w-6 h-6 text-primary-700" />
//               <h3 className="text-xl font-bold text-gray-900">بيانات المركبة</h3>
//             </div>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">نوع المركبة</label>
//                 <p className="text-gray-900">{driver.vehicleType || '-'}</p>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">موديل المركبة</label>
//                 <p className="text-gray-900">{driver.vehicleModel || '-'}</p>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">رقم اللوحة</label>
//                 <p className="text-gray-900">{driver.plateNumber || '-'}</p>
//               </div>
//             </div>
//           </div>

//           {/* Statistics */}
//           <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
//             <h3 className="text-xl font-bold text-gray-900 mb-4">الإحصائيات</h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="bg-primary-50 rounded-lg p-4 text-center">
//                 <Package className="w-8 h-8 text-primary-600 mx-auto mb-2" />
//                 <p className="text-2xl font-bold text-primary-700">{driver.completedTrips || 0}</p>
//                 <p className="text-sm text-primary-600">إجمالي الرحلات</p>
//               </div>
//               <div className="bg-green-50 rounded-lg p-4 text-center">
//                 <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
//                 <p className="text-2xl font-bold text-green-700">{(driver.totalEarnings || 0).toLocaleString()}</p>
//                 <p className="text-sm text-green-600">إجمالي الأرباح (ريال)</p>
//               </div>
//             </div>
//           </div>

//           {/* Documents */}
//           <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
//             <div className="flex items-center space-x-3 space-x-reverse mb-4">
//               <FileText className="w-6 h-6 text-primary-700" />
//               <h3 className="text-xl font-bold text-gray-900">المستندات</h3>
//             </div>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               {/* ID Card */}
//               <div className="border border-gray-200 rounded-lg p-4 text-center">
//                 {driver.idCardImage ? (
//                   <div className="mb-2 h-32 w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
//                     <img src={driver.idCardImage} alt="الهوية الوطنية" className="max-h-full max-w-full object-contain" />
//                   </div>
//                 ) : (
//                   <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
//                     <FileText className="w-8 h-8 text-gray-400" />
//                   </div>
//                 )}
//                 <p className="font-medium text-gray-900">الهوية الوطنية</p>
//                 <p className="text-sm text-gray-500">{driver.idCardImage ? 'متوفرة' : 'غير متوفرة'}</p>
//                 {driver.idCardImage && (
//                   <a href={driver.idCardImage} target="_blank" rel="noreferrer" className="text-xs text-primary-600 hover:underline mt-1 block">عرض الصورة</a>
//                 )}
//               </div>

//               {/* License */}
//               <div className="border border-gray-200 rounded-lg p-4 text-center">
//                 {driver.licenseImage ? (
//                   <div className="mb-2 h-32 w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
//                     <img src={driver.licenseImage} alt="رخصة القيادة" className="max-h-full max-w-full object-contain" />
//                   </div>
//                 ) : (
//                   <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
//                     <FileText className="w-8 h-8 text-gray-400" />
//                   </div>
//                 )}
//                 <p className="font-medium text-gray-900">رخصة القيادة</p>
//                 <p className="text-sm text-gray-500">{driver.licenseImage ? 'متوفرة' : 'غير متوفرة'}</p>
//                 {driver.licenseImage && (
//                   <a href={driver.licenseImage} target="_blank" rel="noreferrer" className="text-xs text-primary-600 hover:underline mt-1 block">عرض الصورة</a>
//                 )}
//               </div>

//               {/* Vehicle Document */}
//               <div className="border border-gray-200 rounded-lg p-4 text-center">
//                 {driver.vehicleDocumentImage ? (
//                   <div className="mb-2 h-32 w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
//                     <img src={driver.vehicleDocumentImage} alt="وثائق المركبة" className="max-h-full max-w-full object-contain" />
//                   </div>
//                 ) : (
//                   <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
//                     <FileText className="w-8 h-8 text-gray-400" />
//                   </div>
//                 )}
//                 <p className="font-medium text-gray-900">وثائق المركبة</p>
//                 <p className="text-sm text-gray-500">{driver.vehicleDocumentImage ? 'متوفرة' : 'غير متوفرة'}</p>
//                 {driver.vehicleDocumentImage && (
//                   <a href={driver.vehicleDocumentImage} target="_blank" rel="noreferrer" className="text-xs text-primary-600 hover:underline mt-1 block">عرض الصورة</a>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DriverProfilePage;













































import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Phone,
  Mail,
  Calendar,
  Truck,
  FileText,
  Star,
  Package,
  DollarSign,
  Pause,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  Edit,
} from 'lucide-react';
import { useDriver, useUpdateDriverStatus } from '../../hooks/useDrivers';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const DriverProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const canEdit = hasPermission('manage_drivers');
  const { showNotification } = useNotification();
  const [viewImage, setViewImage] = useState(null);

  // ==================== React Query ====================
  const { data: driver, isLoading, isError, error, refetch } = useDriver(id);
  const updateStatus = useUpdateDriverStatus();

  // ==================== تحديث الحالة ====================
  const handleAction = async (action) => {
    let reason = undefined;
    if (action === 'reject') {
      reason = window.prompt("يرجى إدخال سبب الرفض (سيظهر للسائق في التطبيق للتعديل):");
      if (reason === null) return; // المشرف ضغط إلغاء
    }

    const statusMap = {
      accept: 'accepted',
      reject: 'rejected',
      suspend: 'pending',
    };
    const newStatus = statusMap[action];
    if (newStatus) {
      try {
        await updateStatus.mutateAsync({ id, status: newStatus, reason });
        showNotification(`تم تحديث حالة السائق إلى: ${newStatus}`, 'success');
      } catch (err) {
        showNotification('حدث خطأ أثناء تحديث الحالة', 'error');
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'متصل': 'bg-green-100 text-green-800',
      'غير متصل': 'bg-gray-100 text-gray-800',
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  };

  const getAccountStatusBadge = (status) => {
    const statusClasses = {
      'مقبول': 'bg-green-100 text-green-800',
      'معلق': 'bg-yellow-100 text-yellow-800',
      'مرفوض': 'bg-red-100 text-red-800',
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  };

  // ==================== حالة التحميل ====================
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
        <p className="text-gray-500 text-lg">جاري تحميل بيانات السائق...</p>
      </div>
    );
  }

  // ==================== حالة الخطأ ====================
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-red-500 text-lg">حدث خطأ أثناء تحميل بيانات السائق</p>
        <p className="text-gray-400 text-sm">{error?.message}</p>
        <button
          onClick={() => refetch()}
          className="flex items-center space-x-2 space-x-reverse bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>إعادة المحاولة</span>
        </button>
      </div>
    );
  }

  // ==================== السائق غير موجود ====================
  if (!driver) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">لم يتم العثور على السائق</p>
        <button
          onClick={() => navigate('/drivers')}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          العودة إلى قائمة السائقين
        </button>
      </div>
    );
  }

  const driverName = driver.name || driver.firstName || 'بدون اسم';
  const accountStatus = driver.verificationStatus || 'معلق';
  const onlineStatus = driver.isOnline ? 'متصل' : 'غير متصل';
  const joinDate = driver.createdAt?._seconds
    ? new Date(driver.createdAt._seconds * 1000)
    : driver.createdAt
      ? new Date(driver.createdAt)
      : new Date();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <button
            onClick={() => navigate('/drivers')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">الملف الشخصي للسائق</h1>
            <p className="text-gray-600">معلومات شاملة عن السائق</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 space-x-reverse">
          {canEdit && (
            <>
              {accountStatus === 'معلق' && (
                <div className="flex items-center space-x-3 space-x-reverse">
                  <button
                    onClick={() => handleAction('accept')}
                    disabled={updateStatus.isPending}
                    className="flex items-center space-x-2 space-x-reverse bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    <Check className="w-4 h-4" />
                    <span>قبول السائق</span>
                  </button>
                  <button
                    onClick={() => handleAction('reject')}
                    disabled={updateStatus.isPending}
                    className="flex items-center space-x-2 space-x-reverse bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                  >
                    <X className="w-4 h-4" />
                    <span>رفض السائق</span>
                  </button>
                </div>
              )}
              
              {accountStatus === 'مقبول' && (
                <button
                  onClick={() => handleAction('suspend')}
                  disabled={updateStatus.isPending}
                  className="flex items-center space-x-2 space-x-reverse bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition disabled:opacity-50 font-bold"
                >
                  <Pause className="w-5 h-5" />
                  <span>إيقاف الحساب</span>
                </button>
              )}

              <button
                onClick={() => navigate(`/drivers/edit/${id}`)}
                className="flex items-center space-x-2 space-x-reverse bg-primary-700 text-white px-4 py-2 rounded-lg hover:bg-primary-800 transition shadow-md font-bold"
              >
                <Edit className="w-5 h-5" />
                <span>تعديل البيانات</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Driver Card + Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="text-center">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-700 font-bold text-2xl">
                  {driverName.charAt(0)}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{driverName}</h2>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-center space-x-2 space-x-reverse text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{driver.phone || 'لا يوجد'}</span>
                </div>
                <div className="flex items-center justify-center space-x-2 space-x-reverse text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{driver.email || 'لا يوجد'}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">حالة الاتصال</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(onlineStatus)}`}>
                    {onlineStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">حالة الحساب</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAccountStatusBadge(accountStatus)}`}>
                    {accountStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">التقييم</span>
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="font-medium">{driver.rating || 0}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">تاريخ الانضمام</span>
                  <span className="text-sm font-medium text-gray-900">
                    {joinDate.toLocaleDateString('ar-SA')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle Info */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center space-x-3 space-x-reverse mb-4">
              <Truck className="w-6 h-6 text-primary-700" />
              <h3 className="text-xl font-bold text-gray-900">بيانات المركبة</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع المركبة</label>
                <p className="text-gray-900">{driver.vehicleType || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">موديل المركبة</label>
                <p className="text-gray-900">{driver.vehicleModel || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم اللوحة</label>
                <p className="text-gray-900">{driver.plateNumber || '-'}</p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">الإحصائيات</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-primary-50 rounded-lg p-4 text-center">
                <Package className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-primary-700">{driver.completedTrips || 0}</p>
                <p className="text-sm text-primary-600">إجمالي الرحلات</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-700">{(driver.totalEarnings || 0).toLocaleString()}</p>
                <p className="text-sm text-green-600">إجمالي الأرباح (ريال)</p>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center space-x-3 space-x-reverse mb-4">
              <FileText className="w-6 h-6 text-primary-700" />
              <h3 className="text-xl font-bold text-gray-900">المستندات</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              
              {/* الهوية / الجواز */}
              {driver.identityType === 'passport' ? (
                <DocumentBox title="جواز السفر" imageUrl={driver.passportImage} onImageClick={setViewImage} />
              ) : (
                <>
                  <DocumentBox title="الهوية (أمامي)" imageUrl={driver.idFrontImage} onImageClick={setViewImage} />
                  <DocumentBox title="الهوية (خلفي)" imageUrl={driver.idBackImage} onImageClick={setViewImage} />
                </>
              )}

              {/* رخصة القيادة */}
              <DocumentBox title="رخصة القيادة" imageUrl={driver.driverLicense} onImageClick={setViewImage} />

              {/* وثائق المركبة */}
              <DocumentBox title="ملكية المركبة" imageUrl={driver.vehicleLicense} onImageClick={setViewImage} />

              {/* صورة المركبة */}
              <DocumentBox title="صورة المركبة" imageUrl={driver.vehicleImage} onImageClick={setViewImage} />
              
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {viewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4"
          onClick={() => setViewImage(null)}
        >
          <div className="relative max-w-4xl w-full h-full flex items-center justify-center p-4">
            <button
              className="absolute top-4 right-4 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-colors z-10 shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                setViewImage(null);
              }}
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={viewImage} 
              alt="تكبير الوثيقة" 
              className="max-h-full max-w-full object-contain cursor-default rounded-lg shadow-2xl" 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== مكوّن جانبي لعرض الوثائق ====================
const DocumentBox = ({ title, imageUrl, onImageClick }) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 text-center flex flex-col h-full">
      <div className="flex-grow flex flex-col justify-center">
        {imageUrl ? (
          <div className="mb-2 h-32 w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
            <img 
              src={imageUrl} 
              alt={title} 
              className="max-h-full max-w-full object-contain cursor-zoom-in hover:scale-105 transition-transform" 
              onClick={() => onImageClick(imageUrl)} 
            />
          </div>
        ) : (
          <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
        )}
      </div>
      <p className="font-medium text-gray-900 mt-2">{title}</p>
      <p className="text-sm text-gray-500">{imageUrl ? 'متوفرة' : 'غير متوفرة'}</p>
      {imageUrl && (
        <button 
          onClick={() => onImageClick(imageUrl)} 
          className="text-xs text-primary-600 hover:underline mt-1 block w-full text-center"
        >
          عرض مكبّر
        </button>
      )}
    </div>
  );
};

export default DriverProfilePage;
