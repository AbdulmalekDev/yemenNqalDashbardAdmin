import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ReportService from '../../services/ReportService';
import { useSettings } from '../../hooks/useSettings';
import {
  Users,
  Search,
  Eye,
  Check,
  X,
  Pause,
  Phone,
  Star,
  Calendar,
  RefreshCw,
  AlertCircle,
  UserPlus,
  Edit,
  FileText,
  Printer,
  Trash2,
} from 'lucide-react';
import { useDrivers, useUpdateDriverStatus, useDriversSSE, useDeleteDriver } from '../../hooks/useDrivers';
import { useAuth } from '../../context/AuthContext';

const DriversPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [accountStatusFilter, setAccountStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { user, hasPermission } = useAuth();
  const isManager = user?.role === 'manager';
  const canEdit = hasPermission('manage_drivers');

  const { data: settings } = useSettings(true);
  const dynamicLogo = settings?.system?.logo || '/assets/images/logo.png';

  // ==================== React Query & SSE ====================
  // طلب الحقول المحددة فقط كما في الشريحة 5
  const fields = 'id,name,firstName,phone,vehicleType,plateNumber,verificationStatus,isOnline,rating,completedTrips,createdAt';

  // تفعيل SSE للتحديثات الفورية للسائقين
  useDriversSSE();

  const { data: response, isLoading, isError, error, refetch } = useDrivers({
    limit,
    searchTerm,
    status: accountStatusFilter,
    isOnline: statusFilter === 'online' ? true : statusFilter === 'offline' ? false : undefined,
    fields,
    page
  });

  const driversData = response?.data || [];
  const pagination = response?.pagination || { total: 0, totalPages: 1 };
  const updateStatus = useUpdateDriverStatus();

  // ==================== تحديث حالة السائق ====================
  const handleAction = async (action, driverId) => {
    if (!window.confirm("هل أنت متأكد من تنفيذ هذه العملية؟")) return;

    const statusMap = {
      accept: 'مقبول',
      reject: 'مرفوض',
      suspend: 'معلق',
    };
    const newStatus = statusMap[action];

    if (newStatus) {
      try {
        await updateStatus.mutateAsync({ id: driverId, status: newStatus });
        toast.success(newStatus === 'معلق' ? "تم تعليق السائق بنجاح" : "تم فك التعليق عن السائق وموافقته", {
          style: { borderRadius: '15px' },
          icon: newStatus === 'معلق' ? '⏸️' : '✅'
        });
      } catch (error) {
        toast.error("حدث خطأ أثناء تعديل الحالة");
      }
    }
  };

  // ==================== حذف السائق ====================
  const deleteDriver = useDeleteDriver();
  const handleDeleteDriver = async (driverId) => {
    if (!window.confirm("هل أنت متأكد من رغبتك في حذف هذا السائق؟ لا يمكن التراجع عن هذا الإجراء.")) return;

    try {
      await deleteDriver.mutateAsync(driverId);
      toast.success("تم حذف السائق بنجاح", {
        style: { borderRadius: '15px' },
        icon: '🗑️'
      });
    } catch (err) {
      toast.error("حدث خطأ أثناء حذف السائق");
    }
  };

  // ==================== شارات ====================
  const getStatusBadge = (driver) => {
    const isOnline = driver.isOnline;
    if (isOnline) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (driver) => {
    return driver.isOnline ? 'متصل' : 'غير متصل';
  };

  // دالة تطبيع حالة التحقق: تحوّل الإنجليزية → العربية
  const normalizeVerificationStatus = (status) => {
    const map = {
      'accepted': 'مقبول',
      'rejected': 'مرفوض',
      'pending': 'معلق',
      'verified': 'مقبول',
      'مقبول': 'مقبول',
      'معلق': 'معلق',
      'مرفوض': 'مرفوض',
    };
    return map[status] ?? (status || 'معلق');
  };

  // دالة لون شارة حالة الحساب
  const getAccountStatusBadge = (status) => {
    const normalized = normalizeVerificationStatus(status);
    const statusClasses = {
      'مقبول': 'bg-green-100 text-green-800',
      'معلق': 'bg-yellow-100 text-yellow-800',
      'مرفوض': 'bg-red-100 text-red-800',
    };
    return statusClasses[normalized] || 'bg-gray-100 text-gray-800';
  };


  // Removed client-side filtering; filtering is now handled on the server.
  const displayDrivers = driversData;

  const onSearchChange = (val) => {
    setSearchTerm(val);
    setPage(1);
  };

  const onStatusFilterChange = (val) => {
    setStatusFilter(val);
    setPage(1);
  };

  const onAccountFilterChange = (val) => {
    setAccountStatusFilter(val);
    setPage(1);
  };

  const formatPhone = (p) => p ? p.replace(/^\+967|^967/, '') : '-';

  // ==================== حالة التحميل ====================
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
        <p className="text-gray-500 text-lg">جاري تحميل السائقين...</p>
      </div>
    );
  }

  // ==================== حالة الخطأ ====================
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-red-500 text-lg">حدث خطأ أثناء تحميل السائقين</p>
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

  const exportPDF = async () => {
    try {
      await ReportService.generateReport(displayDrivers, 'drivers', {
        title: "تقرير إدارة ومراقبة السائقين",
        logoUrl: dynamicLogo,
        filename: `إدارة_السائقين_${new Date().getTime()}.pdf`
      });
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("حدث خطأ أثناء تصدير تقرير السائقين");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between font-arabic" dir="rtl">
        <div className="flex items-center space-x-3 space-x-reverse">
          <Users className="w-8 h-8 text-primary-700" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة السائقين</h1>
            <p className="text-gray-600 font-medium">إدارة ومراقبة جميع السائقين في النظام</p>
          </div>
        </div>
        <div className="flex items-center space-x-4 space-x-reverse">
          {hasPermission('manage_drivers') && (
            <button
              onClick={() => navigate('/drivers/new')}
              className="flex items-center space-x-2 space-x-reverse bg-primary-700 text-white px-4 py-2 rounded-lg hover:bg-primary-800 transition shadow-md font-bold"
            >
              <UserPlus className="w-5 h-5" />
              <span>إضافة سائق</span>
            </button>
          )}



          <button
            onClick={() => refetch()}
            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
            title="تحديث البيانات"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <div className="text-left border-r pr-4 border-gray-200">
            <p className="text-sm text-gray-500">إجمالي السائقين</p>
            <p className="text-2xl font-bold text-primary-700">{pagination.total}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="بحث باسم السائق أو الهاتف..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">الكل</option>
            <option value="online">متصل</option>
            <option value="offline">غير متصل</option>
          </select>

          <select
            value={accountStatusFilter}
            onChange={(e) => onAccountFilterChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">الكل</option>
            <option value="مقبول">مقبول</option>
            <option value="معلق">معلق</option>
            <option value="مرفوض">مرفوض</option>
          </select>

          <div className="flex items-center justify-center bg-primary-50 rounded-lg px-4 py-2">
            <span className="text-primary-700 font-medium">
              {displayDrivers.length} في هذه الصفحة (الإجمالي: {pagination.total})
            </span>
          </div>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">اسم السائق</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">رقم الهاتف</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">الطلبات المكتملة</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">الطلبات الملغاة</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">التقييم</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">الحالة</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayDrivers.map((driver) => {
                const driverName = driver.name || driver.firstName || 'بدون اسم';
                // تطبيع حالة الحساب لضمان العرض الصحيح
                const accountStatus = normalizeVerificationStatus(driver.verificationStatus);

                return (
                  <tr key={driver.id} className={`transition-colors ${driver.rating >= 4.8 ? 'bg-amber-50/60 border-r-4 border-r-amber-400' : 'hover:bg-gray-50'}`}>
                    {/* Driver Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-700 font-semibold text-lg">
                            {driver.rating >= 4.8 ? '🌟' : driverName.charAt(0)}
                          </span>
                        </div>
                        <p className="font-normal text-gray-900">
                          {driver.rating >= 4.8 && <span className="text-amber-500 ml-1">⭐</span>}
                          {driverName}
                        </p>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-6 py-4 text-gray-700">
                      {formatPhone(driver.phone)}
                    </td>

                    {/* Completed Trips */}
                    <td className="px-6 py-4">
                      <span className="font-normal text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                        {driver.completedTrips || 0}
                      </span>
                    </td>

                    {/* Cancelled Trips */}
                    <td className="px-6 py-4">
                      <span className="font-normal text-red-600 bg-red-50 px-3 py-1 rounded-lg">
                        {driver.cancelledTrips || 0}
                      </span>
                    </td>

                    {/* Rating */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1 space-x-reverse">
                        <Star className={`w-5 h-5 ${driver.rating >= 4.8 ? 'text-amber-500' : 'text-yellow-400'} fill-current`} />
                        <span className={`font-normal text-lg ${driver.rating >= 4.8 ? 'text-amber-600' : 'text-gray-900'}`}>{driver.rating || 0}</span>
                      </div>
                    </td>

                    {/* Online Status */}
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit space-x-1 space-x-reverse ${getStatusBadge(driver)}`}>
                        <span className={`w-2 h-2 rounded-full ${driver.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        <span>{getStatusText(driver)}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        {canEdit && (
                          <button
                            onClick={() => navigate(`/drivers/edit/${driver.id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="تعديل البيانات"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => navigate(`/drivers/${driver.id}`)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="عرض الملف الشخصي"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {hasPermission('manage_drivers') && accountStatus === 'معلق' && (
                          <>
                            <button
                              onClick={() => handleAction('accept', driver.id)}
                              disabled={updateStatus.isPending}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                              title="قبول السائق"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAction('reject', driver.id)}
                              disabled={updateStatus.isPending}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="رفض السائق"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {hasPermission('manage_drivers') && (accountStatus === 'مقبول' || accountStatus === 'معلق') && (
                          <button
                            onClick={() => handleAction(accountStatus === 'مقبول' ? 'suspend' : 'accept', driver.id)}
                            disabled={updateStatus.isPending}
                            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${accountStatus === 'مقبول' ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                            title={accountStatus === 'مقبول' ? 'إيقاف الحساب' : 'فك التعليق'}
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        )}
                        
                        {hasPermission('manage_drivers') && (
                          <button
                            onClick={() => handleDeleteDriver(driver.id)}
                            disabled={deleteDriver.isPending}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="حذف السائق"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {displayDrivers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">لا يوجد سائقين يطابقون معايير البحث</p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl shadow-lg border border-gray-100">
        <div className="text-sm text-gray-600">
          عرض الصفحة <span className="font-semibold text-primary-700">{page}</span> من <span className="font-semibold">{pagination.totalPages}</span> صفحات
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            السابق
          </button>

          <div className="flex items-center space-x-1 space-x-reverse">
            {[...Array(pagination.totalPages)].map((_, i) => {
              const p = i + 1;
              // إظهار الصفحات القريبة فقط إذا كان العدد كبيراً
              if (pagination.totalPages > 7 && Math.abs(p - page) > 2 && p !== 1 && p !== pagination.totalPages) {
                if (p === 2 || p === pagination.totalPages - 1) return <span key={p}>...</span>;
                return null;
              }
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition ${page === p ? 'bg-primary-700 text-white' : 'hover:bg-gray-100 text-gray-600'}
                    `}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            التالي
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriversPage;
