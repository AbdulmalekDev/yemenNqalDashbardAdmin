// import React, { useState } from 'react';
// import {
//   Shield,
//   Search,
//   FileText,
//   Check,
//   X,
//   Eye,
//   Truck,
//   Calendar,
//   Phone,
//   AlertCircle,
//   RefreshCw,
// } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';
// import { useDrivers, useUpdateDriverStatus } from '../../hooks/useDrivers';
// import { useAuth } from '../../context/AuthContext';
// import { useNotification } from '../../context/NotificationContext';

// const VerificationPage = () => {
//   const { data: driversResult, isLoading, isError, error, refetch } = useDrivers();
//   const drivers = driversResult?.data || [];
//   const updateStatusMutation = useUpdateDriverStatus();
//   const [searchTerm, setSearchTerm] = useState('');
//   const { user, hasRole } = useAuth();
//   const navigate = useNavigate();
//   const canVerify = hasRole(['manager', 'supervisor']);
//   const { showNotification } = useNotification();

//   // Note: useRealTime in AdminLayout handles global SSE synchronization.

//   // 1️⃣ تصفية السائقين المعلقين فقط
//   const pendingDrivers = React.useMemo(() => {
//     return drivers.filter(
//       (d) =>
//         !['مقبول', 'مرفوض', 'accepted', 'rejected', 'verified'].includes(d.verificationStatus)
//     );
//   }, [drivers]);

//   // 2️⃣ تصفية البحث
//   const filteredDrivers = React.useMemo(() => {
//     const term = (searchTerm || '').toLowerCase().trim();
//     if (!term) return pendingDrivers;

//     return pendingDrivers.filter(driver =>
//       (driver.name || driver.firstName || driver.lastName || '').toLowerCase().includes(term) ||
//       (driver.phone || '').includes(term) ||
//       (driver.vehicleType || '').toLowerCase().includes(term) ||
//       (driver.vehicleModel || '').toLowerCase().includes(term)
//     );
//   }, [pendingDrivers, searchTerm]);

//   // 3️⃣ قبول أو رفض السائق
//   const handleAction = async (action, driverId) => {
//     const statusMap = {
//       accept: 'accepted',
//       reject: 'rejected',
//     };
//     const newStatus = statusMap[action];
//     if (newStatus) {
//       try {
//         await updateStatusMutation.mutateAsync({ id: driverId, status: newStatus });
//         const message = action === 'accept' ? 'تم قبول السائق بنجاح' : 'تم رفض طلب السائق';
//         showNotification(message, action === 'accept' ? 'success' : 'warning');
//       } catch (err) {
//         showNotification('حدث خطأ أثناء تحديث الحالة', 'error');
//       }
//     }
//   };

//   // 4️⃣ حالة التحميل
//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-[60vh]">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700 mx-auto mb-4"></div>
//           <p className="text-gray-600">جاري تحميل طلبات التوثيق...</p>
//         </div>
//       </div>
//     );
//   }

//   // 5️⃣ حالة الخطأ
//   if (isError) {
//     return (
//       <div className="flex items-center justify-center min-h-[60vh]">
//         <div className="text-center">
//           <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
//           <h3 className="text-lg font-medium text-gray-900 mb-2">حدث خطأ في تحميل البيانات</h3>
//           <p className="text-gray-500 mb-4">{error?.message || "حدث خطأ غير متوقع"}</p>
//           <button
//             onClick={() => refetch()}
//             className="flex items-center mx-auto space-x-2 space-x-reverse bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
//           >
//             <RefreshCw className="w-4 h-4" />
//             <span>إعادة المحاولة</span>
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div className="flex items-center space-x-3 space-x-reverse mb-8">
//           <Truck className="w-10 h-10 text-primary-600" />
//           <h1 className="text-3xl font-normal text-gray-900">توثيق السائقين</h1>
//         </div>
//         <div className="text-left">
//           <p className="text-sm text-gray-500">طلبات معلقة</p>
//           <p className="text-2xl font-normal text-yellow-600">{pendingDrivers.length}</p>
//         </div>
//       </div>

//       {/* Search */}
//       <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
//         <div className="relative">
//           <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//           <input
//             type="text"
//             placeholder="بحث باسم السائق أو الهاتف أو نوع المركبة..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
//           />
//         </div>
//       </div>

//       {/* Pending Drivers */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
//         {filteredDrivers.map((driver) => (
//           <div key={driver.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
//             {/* Header */}
//             <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-6 py-4 border-b border-gray-200">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center space-x-3 space-x-reverse">
//                   <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
//                     <span className="text-yellow-700 font-normal text-lg">
//                       {(driver.name || '?').charAt(0)}
//                     </span>
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <h3 className="font-normal text-gray-900">{driver.name || driver.firstName || 'سائق غير معروف'}</h3>
//                     <p className="text-sm text-gray-500">{driver.vehicleType || 'نوع غير محدد'} | {driver.plateNumber || 'بدون لوحة'}</p>
//                   </div>
//                 </div>
//                 <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
//               </div>
//             </div>

//             {/* Driver Info */}
//             <div className="p-6 space-y-4">
//               <div className="space-y-3">
//                 <div className="flex items-center space-x-3 space-x-reverse text-sm">
//                   <Phone className="w-4 h-4 text-gray-400" />
//                   <span className="text-gray-600">{driver.phone || '-'}</span>
//                 </div>
//                 <div className="flex items-center space-x-3 space-x-reverse text-sm">
//                   <Truck className="w-4 h-4 text-gray-400" />
//                   <span className="text-gray-600">{driver.vehicleType || '-'} - {driver.vehicleModel || '-'}</span>
//                 </div>
//                 <div className="flex items-center space-x-3 space-x-reverse text-sm">
//                   <Calendar className="w-4 h-4 text-gray-400" />
//                   <span className="text-gray-600">
//                     {driver.createdAt
//                       ? `انضم في ${new Date(driver.createdAt._seconds ? driver.createdAt._seconds * 1000 : driver.createdAt).toLocaleDateString('ar-SA')}`
//                       : 'تاريخ غير محدد'}
//                   </span>
//                 </div>
//               </div>

//               {/* Documents */}
//               <div className="space-y-2">
//                 <h4 className="font-medium text-gray-900 flex items-center space-x-2 space-x-reverse">
//                   <FileText className="w-4 h-4" />
//                   <span>حالة المستندات</span>
//                 </h4>
//                 <div className="space-y-2">
//                   <div className="flex items-center justify-between p-2 bg-green-50 rounded">
//                     <span className="text-sm text-gray-700">الهوية الوطنية</span>
//                     <div className={`w-4 h-4 rounded-full ${driver.documents?.nationalId ? 'bg-green-500' : 'bg-gray-300'}`}></div>
//                   </div>
//                   <div className="flex items-center justify-between p-2 bg-green-50 rounded">
//                     <span className="text-sm text-gray-700">رخصة القيادة</span>
//                     <div className={`w-4 h-4 rounded-full ${driver.documents?.driverLicense ? 'bg-green-500' : 'bg-gray-300'}`}></div>
//                   </div>
//                   <div className="flex items-center justify-between p-2 bg-green-50 rounded">
//                     <span className="text-sm text-gray-700">وثائق المركبة</span>
//                     <div className={`w-4 h-4 rounded-full ${driver.documents?.vehicleDocs ? 'bg-green-500' : 'bg-gray-300'}`}></div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Actions */}
//             <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center space-x-3 space-x-reverse">
//               <button
//                 onClick={() => navigate(`/drivers/${driver.id}`)}
//                 className="flex-1 flex items-center justify-center space-x-2 space-x-reverse bg-primary-600 text-white px-3 py-2 rounded-lg hover:bg-primary-700 transition-colors"
//               >
//                 <FileText className="w-4 h-4" />
//                 <span>توثيق المستندات</span>
//               </button>
//               {canVerify && (
//                 <>
//                   <button
//                     onClick={() => handleAction('accept', driver.id)}
//                     disabled={updateStatusMutation.isPending}
//                     className="flex-1 flex items-center justify-center space-x-2 space-x-reverse bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
//                   >
//                     <Check className="w-4 h-4" />
//                     <span>قبول</span>
//                   </button>
//                   <button
//                     onClick={() => handleAction('reject', driver.id)}
//                     disabled={updateStatusMutation.isPending}
//                     className="flex-1 flex items-center justify-center space-x-2 space-x-reverse bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
//                   >
//                     <X className="w-4 h-4" />
//                     <span>رفض</span>
//                   </button>
//                 </>
//               )}
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Empty State */}
//       {filteredDrivers.length === 0 && (
//         <div className="text-center py-12">
//           <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
//           <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد طلبات معلقة</h3>
//           <p className="text-gray-500">
//             {pendingDrivers.length === 0
//               ? 'جميع طلبات التوثيق تمت مراجعتها'
//               : 'لا توجد طلبات تطابق معايير البحث'}
//           </p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default VerificationPage;























































import React, { useState } from 'react';
import {
  Shield,
  Search,
  FileText,
  Check,
  X,
  Eye,
  Truck,
  Calendar,
  Phone,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDrivers, useUpdateDriverStatus } from '../../hooks/useDrivers';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const VerificationPage = () => {
  const { data: driversResult, isLoading, isError, error, refetch } = useDrivers();
  const drivers = driversResult?.data || [];
  const updateStatusMutation = useUpdateDriverStatus();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDriverForDocs, setSelectedDriverForDocs] = useState(null);
  const [viewImage, setViewImage] = useState(null);
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const canVerify = hasRole(['manager', 'supervisor']);
  const { showNotification } = useNotification();

  // Note: useRealTime in AdminLayout handles global SSE synchronization.

  // 1️⃣ تصفية السائقين المعلقين فقط
  const pendingDrivers = React.useMemo(() => {
    return drivers.filter(
      (d) =>
        !['مقبول', 'مرفوض', 'accepted', 'rejected', 'verified'].includes(d.verificationStatus)
    );
  }, [drivers]);

  // 2️⃣ تصفية البحث
  const filteredDrivers = React.useMemo(() => {
    const term = (searchTerm || '').toLowerCase().trim();
    if (!term) return pendingDrivers;

    return pendingDrivers.filter(driver =>
      (driver.name || driver.firstName || driver.lastName || '').toLowerCase().includes(term) ||
      (driver.phone || '').includes(term) ||
      (driver.vehicleType || '').toLowerCase().includes(term) ||
      (driver.vehicleModel || '').toLowerCase().includes(term)
    );
  }, [pendingDrivers, searchTerm]);

  // 3️⃣ قبول أو رفض السائق
  const handleAction = async (action, driverId) => {
    let reason = undefined;
    if (action === 'reject') {
      reason = window.prompt("يرجى إدخال سبب الرفض (سيظهر للسائق في التطبيق للتعديل):");
      if (reason === null) return; // المشرف ضغط على زر إلغاء
    }

    const statusMap = {
      accept: 'accepted',
      reject: 'rejected',
    };
    const newStatus = statusMap[action];
    if (newStatus) {
      try {
        await updateStatusMutation.mutateAsync({ id: driverId, status: newStatus, reason });
        const message = action === 'accept' ? 'تم قبول السائق بنجاح' : 'تم رفض طلب السائق';
        showNotification(message, action === 'accept' ? 'success' : 'warning');
        if (selectedDriverForDocs?.id === driverId) setSelectedDriverForDocs(null); // إغلاق النافذة المنبثقة
      } catch (err) {
        showNotification('حدث خطأ أثناء تحديث الحالة', 'error');
      }
    }
  };

  // 4️⃣ حالة التحميل
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل طلبات التوثيق...</p>
        </div>
      </div>
    );
  }

  // 5️⃣ حالة الخطأ
  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">حدث خطأ في تحميل البيانات</h3>
          <p className="text-gray-500 mb-4">{error?.message || "حدث خطأ غير متوقع"}</p>
          <button
            onClick={() => refetch()}
            className="flex items-center mx-auto space-x-2 space-x-reverse bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            <RefreshCw className="w-4 h-4" />
            <span>إعادة المحاولة</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 space-x-reverse mb-8">
          <Truck className="w-10 h-10 text-primary-600" />
          <h1 className="text-3xl font-normal text-gray-900">توثيق السائقين</h1>
        </div>
        <div className="text-left">
          <p className="text-sm text-gray-500">طلبات معلقة</p>
          <p className="text-2xl font-normal text-yellow-600">{pendingDrivers.length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="بحث باسم السائق أو الهاتف أو نوع المركبة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Pending Drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredDrivers.map((driver) => (
          <div key={driver.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-700 font-normal text-lg">
                      {(driver.name || '?').charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-normal text-gray-900">{driver.name || driver.firstName || 'سائق غير معروف'}</h3>
                    <p className="text-sm text-gray-500">{driver.vehicleType || 'نوع غير محدد'} | {driver.plateNumber || 'بدون لوحة'}</p>
                  </div>
                </div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Driver Info */}
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3 space-x-reverse text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{driver.phone || '-'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Truck className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{driver.vehicleType || '-'} - {driver.vehicleModel || '-'}</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    <Shield className="w-3 h-3" />
                    <span className="font-bold">{driver.nationalId || 'بدون رقم هوية'}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3 space-x-reverse text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    {driver.createdAt
                      ? `انضم في ${new Date(driver.createdAt._seconds ? driver.createdAt._seconds * 1000 : driver.createdAt).toLocaleDateString('ar-SA')}`
                      : 'تاريخ غير محدد'}
                  </span>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 flex items-center space-x-2 space-x-reverse">
                  <FileText className="w-4 h-4" />
                  <span>حالة المستندات</span>
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <span className="text-sm text-gray-700">{driver.identityType === 'passport' ? 'جواز السفر' : 'الهوية الوطنية'}</span>
                    <div className={`w-4 h-4 rounded-full ${(driver.idFrontImage || driver.passportImage) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <span className="text-sm text-gray-700">رخصة القيادة</span>
                    <div className={`w-4 h-4 rounded-full ${driver.driverLicense ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <span className="text-sm text-gray-700">وثائق ورسم المركبة</span>
                    <div className={`w-4 h-4 rounded-full ${(driver.vehicleLicense && driver.vehicleImage) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center space-x-3 space-x-reverse">
              <button
                onClick={() => setSelectedDriverForDocs(driver)}
                className="flex-1 flex items-center justify-center space-x-2 space-x-reverse bg-primary-600 text-white px-3 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>توثيق المستندات</span>
              </button>
              {canVerify && (
                <>
                  <button
                    onClick={() => handleAction('accept', driver.id)}
                    disabled={updateStatusMutation.isPending}
                    className="flex-1 flex items-center justify-center space-x-2 space-x-reverse bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>قبول</span>
                  </button>
                  <button
                    onClick={() => handleAction('reject', driver.id)}
                    disabled={updateStatusMutation.isPending}
                    className="flex-1 flex items-center justify-center space-x-2 space-x-reverse bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    <span>رفض</span>
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredDrivers.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد طلبات معلقة</h3>
          <p className="text-gray-500">
            {pendingDrivers.length === 0
              ? 'جميع طلبات التوثيق تمت مراجعتها'
              : 'لا توجد طلبات تطابق معايير البحث'}
          </p>
        </div>
      )}

      {/* Docs Modal */}
      {selectedDriverForDocs && (
        <div 
          className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-60 p-4"
          onClick={() => setSelectedDriverForDocs(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">مراجعة مستندات: {selectedDriverForDocs.name || selectedDriverForDocs.firstName || 'سائق'}</h2>
                <p className="text-sm text-gray-500">رقم الهوية: <span className="font-bold text-gray-800">{selectedDriverForDocs.nationalId || 'غير متوفر'}</span></p>
              </div>
              <button
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                onClick={() => setSelectedDriverForDocs(null)}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body: Documents Grid */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* الهوية / الجواز */}
              {selectedDriverForDocs.identityType === 'passport' ? (
                <DocumentBox title="جواز السفر" imageUrl={selectedDriverForDocs.passportImage} onImageClick={setViewImage} />
              ) : (
                <>
                  <DocumentBox title="الهوية (أمامي)" imageUrl={selectedDriverForDocs.idFrontImage} onImageClick={setViewImage} />
                  <DocumentBox title="الهوية (خلفي)" imageUrl={selectedDriverForDocs.idBackImage} onImageClick={setViewImage} />
                </>
              )}

              {/* رخصة القيادة */}
              <DocumentBox title="رخصة القيادة" imageUrl={selectedDriverForDocs.driverLicense} onImageClick={setViewImage} />

              {/* وثائق المركبة */}
              <DocumentBox title="ملكية المركبة" imageUrl={selectedDriverForDocs.vehicleLicense} onImageClick={setViewImage} />

              {/* صورة المركبة */}
              <DocumentBox title="صورة المركبة" imageUrl={selectedDriverForDocs.vehicleImage} onImageClick={setViewImage} />
            </div>

            {/* Modal Footer: Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3 space-x-reverse sticky bottom-0 z-10">
              <button
                onClick={() => setSelectedDriverForDocs(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors"
              >
                إغلاق
              </button>
              {canVerify && (
                <>
                  <button
                    onClick={() => handleAction('reject', selectedDriverForDocs.id)}
                    disabled={updateStatusMutation.isPending}
                    className="flex items-center space-x-2 space-x-reverse bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <X className="w-5 h-5" />
                    <span>رفض الطلب</span>
                  </button>
                  <button
                    onClick={() => handleAction('accept', selectedDriverForDocs.id)}
                    disabled={updateStatusMutation.isPending}
                    className="flex items-center space-x-2 space-x-reverse bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Check className="w-5 h-5" />
                    <span>قبول واعتماد السائق</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Modal (Zoom) */}
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
    <div className="border border-gray-200 rounded-lg p-4 text-center flex flex-col h-full bg-white shadow-sm hover:shadow-md transition-shadow">
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
          className="text-xs text-primary-600 hover:underline mt-2 block w-full text-center bg-primary-50 py-1 rounded"
        >
          عرض مكبّر
        </button>
      )}
    </div>
  );
};

export default VerificationPage;
