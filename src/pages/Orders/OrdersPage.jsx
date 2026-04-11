import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReportService from '../../services/ReportService';
import { useSettings } from '../../hooks/useSettings';
import {
  Package,
  Search,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  RefreshCw,
  FileText,
  Printer,
} from 'lucide-react';
import { useOrders, useUpdateOrderStatus } from '../../hooks/useOrders';
import { useAuth } from '../../context/AuthContext';

const OrdersPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { user, hasPermission } = useAuth();
  const isManager = user?.role === 'manager';
  const { data: settings } = useSettings(true);
  const dynamicLogo = settings?.system?.logo || '/assets/images/logo.png';

  // ==================== React Query & Selective Loading ====================
  // جلب الحقول الأساسية مع معرفات العميل والسائق لضمان ظهور الأسماء
  const fields = 'id,orderId,clientFirstName,clientName,clientId,clientPhone,driverId,driverName,cargoType,vehicleType,distance,pickupLocation,dropoffLocation,deliveryLocation,price,estimatedPrice,createdAt,status';

  const { data: response, isLoading, isError, error, refetch } = useOrders({
    limit,
    searchTerm,
    status: statusFilter,
    fields,
    page // We'll keep page for trigger, but backend uses lastId if provided. 
    // For a truly professional cursor pagination, we'd manage lastId in state.
  });

  const ordersData = response?.data || [];
  const pagination = response?.pagination || { total: 0, totalPages: 1 };
  const updateStatus = useUpdateOrderStatus();

  // ==================== حالة الطلب ====================
  const handleStatusChange = (orderId, newStatus) => {
    updateStatus.mutate({ id: orderId, status: newStatus });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'accepted': 'bg-blue-100 text-blue-800',
      'searching': 'bg-orange-100 text-orange-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'no_driver': 'bg-gray-100 text-gray-800',
      'arrived': 'bg-green-100 text-green-800',
      'rated': 'bg-green-100 text-green-800',
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    if (status === 'no_driver') return 'لا يوجد سائق';
    return status || '-';
  };

  const getStatusIcon = (status) => {
    const iconClasses = {
      'accepted': Clock,
      'searching': Truck,
      'completed': CheckCircle,
      'cancelled': XCircle,
      'no_driver': Clock,
      'arrived': Truck,
      'rated': CheckCircle,
    };
    const Icon = iconClasses[status] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  // دالة تطبيع الحالة: تحوّل أي قيمة (عربية أو إنجليزية) إلى النص العربي للعرض والمقارنة
  const normalizeStatus = (status) => {
    const map = {
      'no_driver': 'لا يوجد سائق',
      'accepted': 'مقبول',
      'searching': 'جاري',
      'completed': 'مكتمل',
      'cancelled': 'ملغي',
      'arrived': 'وصل موقع العميل',
      'rated': 'تم التقييم',

    };
    return map[status] ?? (status || '-');
  };

  // Removed client-side filtering; filtering is now handled on the server.
  const displayOrders = ordersData;


  // ==================== حالة التحميل ====================
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
        <p className="text-gray-500 text-lg">جاري تحميل الطلبات...</p>
      </div>
    );
  }

  // ==================== حالة الخطأ ====================
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-red-500 text-lg">حدث خطأ أثناء تحميل الطلبات</p>
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

  // Helper to safely format Firestore timestamps
  const formatDate = (ts) => {
    if (!ts) return '-';
    const date = ts._seconds ? new Date(ts._seconds * 1000) : ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return date.toLocaleDateString('ar-SA');
  };

  const exportPDF = async () => {
    try {
      await ReportService.generateReport(displayOrders, 'orders', {
        title: "تقرير إدارة ومراقبة الطلبات",
        logoUrl: dynamicLogo,
        filename: `إدارة_الطلبات_${new Date().getTime()}.pdf`
      });
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("حدث خطأ أثناء تصدير تقرير الطلبات");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between font-arabic" dir="rtl">
        <div className="flex items-center space-x-3 space-x-reverse">
          <Package className="w-8 h-8 text-primary-700" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة الطلبات</h1>
            <p className="text-gray-600 font-medium">مراقبة وإدارة جميع طلبات النقل في النظام</p>
          </div>
        </div>
        <div className="flex items-center space-x-4 space-x-reverse">
          <button
            onClick={() => refetch()}
            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
            title="تحديث البيانات"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <div className="text-left border-r pr-4 border-gray-200">
            <p className="text-sm text-gray-500">إجمالي الطلبات</p>
            <p className="text-2xl font-bold text-primary-700">{pagination.total}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="بحث برقم الطلب أو الاسم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">الكل</option>
            <option value="no_driver">لا يوجد سائق</option>
            <option value="accepted">مقبول</option>
            <option value="searching">جاري</option>
            <option value="arrived">وصل موقع العميل</option>
            <option value="completed">مكتمل</option>
            <option value="cancelled">ملغي</option>
            <option value="rated">تم التقييم</option>
          </select>

          <div className="flex items-center justify-center bg-primary-50 rounded-lg px-4 py-2">
            <span className="text-primary-700 font-medium">
              {displayOrders.length} في الصفحة (الإجمالي: {pagination.total})
            </span>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-normal text-gray-900">رقم الطلب</th>
                <th className="px-6 py-4 text-right text-sm font-normal text-gray-900">اسم العميل</th>
                <th className="px-6 py-4 text-right text-sm font-normal text-gray-900">اسم السائق</th>
                <th className="px-6 py-4 text-right text-sm font-normal text-gray-900">نوع النقل</th>
                <th className="px-6 py-4 text-right text-sm font-normal text-gray-900">الحالة</th>
                <th className="px-6 py-4 text-right text-sm font-normal text-gray-900">تاريخ الطلب</th>
                <th className="px-6 py-4 text-right text-sm font-normal text-gray-900">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  {/* Order ID */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {getStatusIcon(order.status)}
                      <span className="font-normal text-primary-700">
                        #{String(order.orderId || order.id).slice(-8)}
                      </span>
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="px-6 py-4">
                    <p className="font-normal text-gray-900">{order.clientName || order.clientFirstName || 'عميل'}</p>
                    <p className="text-xs text-gray-400">{order.clientPhone || '-'}</p>
                  </td>

                  {/* Driver Name */}
                  <td className="px-6 py-4 text-gray-900 font-normal">
                    {order.driverName || '-'}
                  </td>

                  {/* Transport Type */}
                  <td className="px-6 py-4 text-gray-900 font-normal">
                    {order.cargoType || order.vehicleType || '-'}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-normal ${getStatusBadge(order.status)}`}>
                      {normalizeStatus(order.status)}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4 text-gray-900 font-normal">
                    {formatDate(order.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="عرض تفاصيل الطلب"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {hasPermission('manage_orders') && order.status === 'searching' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'completed')}
                          disabled={updateStatus.isPending}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                          title="إنهاء الطلب"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}

                      {hasPermission('manage_orders') && (order.status === 'pending' || order.status === 'accepted') && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'cancelled')}
                          disabled={updateStatus.isPending}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="إلغاء الطلب"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {displayOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">لا يوجد طلبات تطابق معايير البحث</p>
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
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition"
          >
            السابق
          </button>

          <div className="flex items-center space-x-1 space-x-reverse">
            {[...Array(pagination.totalPages)].map((_, i) => {
              const p = i + 1;
              if (pagination.totalPages > 7 && Math.abs(p - page) > 2 && p !== 1 && p !== pagination.totalPages) {
                if (p === 2 || p === pagination.totalPages - 1) return <span key={p}>...</span>;
                return null;
              }
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition ${page === p ? 'bg-primary-700 text-white' : 'hover:bg-gray-100 text-gray-600'
                    }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition"
          >
            التالي
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
