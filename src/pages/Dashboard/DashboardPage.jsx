import React, { useState } from "react";
import {
  Users,
  UserCheck,
  Truck,
  Package,
  DollarSign,
  TrendingUp,
  MapPin,
  Activity,
  Eye,
  AlertCircle,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "../../hooks/useDashboard";

const StatCard = ({ title, value, icon: Icon, color, change }) => (
  <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-normal text-gray-600 truncate">{title}</p>
        <p className="text-xl font-normal text-gray-900 mt-2">{(value ?? 0).toLocaleString()}</p>
        {/* {change !== undefined && (
          <p className={`text-sm mt-1 flex items-center ${change > 0 ? "text-green-600" : "text-red-600"}`}>
            <TrendingUp className="w-4 h-4 ml-1" />
            {change > 0 ? "+" : ""}
            {change}% من أمس
          </p>
        )} */}
      </div>
      <div className={`p-2 lg:p-3 rounded-full ${color} flex-shrink-0`}>
        <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
      </div>
    </div>
  </div>
);

const DashboardPage = () => {
  const navigate = useNavigate();
  const { data: dashboard, isLoading, isError, error, refetch } = useDashboard();
  const [searchTerm, setSearchTerm] = useState("");

  // حالة التحميل
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل لوحة التحكم...</p>
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

  const stats = dashboard?.stats || {};
  const recentOrders = dashboard?.recentOrders || [];
  const chartData = dashboard?.chartData || [];
  const drivers = dashboard?.drivers || [];

  const filteredOrders = recentOrders.filter(order =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.clientName || order.clientFirstName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.driverName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ==================== Helper Functions ====================
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

  const normalizeStatus = (status) => {
    const map = {
      'no_driver': ' لا يوجد سائق',
      'accepted': 'مقبول',
      'searching': 'جاري',
      'completed': 'مكتمل',
      'cancelled': 'ملغي',
      'arrived': 'وصل موقع العميل',
      'rated': 'تم التقييم',
    };
    return map[status] ?? (status || '-');
  };

  const formatDate = (ts) => {
    if (!ts) return '-';
    // Handle Firestore Timestamp or ISO string
    const date = ts._seconds ? new Date(ts._seconds * 1000) : ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return date.toLocaleDateString('ar-SA');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-normal text-gray-900">لوحة التحكم</h1>
          <p className="text-gray-600 mt-1 text-sm font-normal">مرحباً بك في نظام إدارة يمن نقل</p>
        </div>
        <div className="text-left lg:text-right">
          <p className="text-sm text-gray-500">آخر تحديث</p>
          <p className="font-normal text-gray-900">{new Date().toLocaleString('ar-SA')}</p>
        </div>
      </div>

      {/* Global Dashboard Search */}
      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
        <div className="relative group">
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary-600 transition-colors" />
          <input
            type="text"
            placeholder="بحث سـريع عن سائق، عميل، أو رقم طلب..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pr-12 pl-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all text-gray-900 placeholder-gray-400"
          />
        </div>
        {searchTerm && (
          <p className="mt-2 text-xs text-gray-500 mr-2 animate-pulse">
            جاري تصفية النتائج بناءً على: <span className="text-primary-600 font-bold">{searchTerm}</span>
          </p>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6">
        <StatCard title="إجمالي العملاء" value={stats.totalCustomers} icon={UserCheck} color="bg-accent-500" />
        <StatCard title="إجمالي السائقين" value={stats.totalDrivers} icon={Users} color="bg-accent-500" />
        <StatCard title="السائقين المتصلين" value={stats.connectedDrivers} icon={Truck} color="bg-green-600" />
        <StatCard title="الطلبات الجارية" value={stats.activeOrders} icon={Package} color="bg-accent-400" />
        <StatCard title="الطلبات المكتملة اليوم" value={stats.completedToday} icon={Activity} color="bg-accent-600" />
        <StatCard title="إجمالي أرباح اليوم" value={stats.todayRevenue} icon={DollarSign} color="bg-green-700" />
      </div>

      {/* Orders Chart & Driver Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-4 lg:p-6 border border-gray-100">
          <h2 className="text-xl font-normal text-gray-900 mb-4">إحصائيات الطلبات الأسبوعية</h2>
          <div className="h-64 flex items-end space-x-2 space-x-reverse">
            {chartData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="bg-accent-500 rounded-t w-full transition-all duration-500 hover:bg-accent-600"
                  style={{
                    height: `${Math.max((data.orders / Math.max(...chartData.map(d => d.orders || 1))) * 200, 20)}px`
                  }}
                  title={`${new Date(data.date).toLocaleDateString('ar-SA')}: ${data.orders} طلب`}
                ></div>
                <span className="text-xs text-gray-500 mt-2 text-center">
                  {new Date(data.date).toLocaleDateString('ar-SA', { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Driver Status - Moved here */}
        <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">حالة السائقين</h2>
          <div className="space-y-3 lg:space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3 space-x-reverse text-sm">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-normal text-gray-900">متصل</span>
              </div>
              <span className="text-lg font-normal text-green-600">{stats.connectedDrivers || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3 space-x-reverse text-sm">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="font-normal text-gray-900">غير متصل</span>
              </div>
              <span className="text-lg font-normal text-gray-600">{stats.offlineDrivers !== undefined ? stats.offlineDrivers : ((stats.totalDrivers || 0) - (stats.connectedDrivers || 0))}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-accent-50 rounded-lg">
              <div className="flex items-center space-x-3 space-x-reverse text-sm">
                <div className="w-3 h-3 bg-accent-500 rounded-full"></div>
                <span className="font-normal text-gray-900">في انتظار الطلب</span>
              </div>
              <span className="text-lg font-normal text-accent-600">
                {stats.waitingDrivers !== undefined ? stats.waitingDrivers : 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table - Full Width Below */}
      <div className="grid grid-cols-1 gap-4 lg:gap-6">
        {/* Recent Orders Table */}
        <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6 border border-gray-100 overflow-x-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-normal text-gray-900">الطلبات الأخيرة</h2>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${searchTerm ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'}`}>
              {filteredOrders.length} نتيجة
            </div>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-right text-xs font-semibold">رقم الطلب</th>
                <th className="px-6 py-4 text-right text-xs font-semibold">اسم العميل</th>
                <th className="px-6 py-4 text-right text-xs font-semibold">اسم السائق</th>
                <th className="px-6 py-4 text-right text-xs font-semibold">نوع النقل</th>
                <th className="px-6 py-4 text-right text-xs font-semibold">الحالة</th>
                <th className="px-6 py-4 text-right text-xs font-semibold">تاريخ الطلب</th>
                <th className="px-6 py-4 text-right text-xs font-semibold">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 text-xs text-gray-900">
                  <td className="px-6 py-4 font-normal">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {getStatusIcon(order.status)}
                      <span className="font-normal text-primary-700">
                        #{String(order.orderId || order.id).slice(-8)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-normal">{order.clientName || order.clientFirstName || "-"}</td>
                  <td className="px-6 py-4 font-normal">{order.driverName || "-"}</td>
                  <td className="px-6 py-4 font-normal">{order.cargoType || order.vehicleType || "-"}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-normal ${getStatusBadge(order.status)}`}>
                      {normalizeStatus(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-normal">{formatDate(order.createdAt)}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-gray-500">
                    لا يوجد طلبات
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>


      </div>
    </div>
  );
};

export default DashboardPage;
