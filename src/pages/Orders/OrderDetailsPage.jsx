import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  MapPin,
  Clock,
  Package,
  Truck,
  User,
  XCircle,
  CheckCircle,
  Navigation,
  AlertCircle,
  RefreshCw,
  Star,
} from 'lucide-react';
import { useOrder, useUpdateOrderStatus } from '../../hooks/useOrders';
import { useAuth } from '../../context/AuthContext';

const OrderDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const canManage = hasRole(['manager', 'supervisor']);

  // ==================== React Query ====================
  const { data: order, isLoading, isError, error, refetch } = useOrder(id);
  const updateStatus = useUpdateOrderStatus();

  // ==================== تحديث الحالة ====================
  const handleAction = (action) => {
    const statusMap = {
      cancel: 'cancelled',
      complete: 'completed',
      accept: 'accepted',
    };
    const newStatus = statusMap[action];
    if (newStatus) {
      updateStatus.mutate({ id, status: newStatus });
    }
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
      // Fallback for Arabic
      'مقبول': 'bg-blue-100 text-blue-800',
      'جاري': 'bg-orange-100 text-orange-800',
      'مكتمل': 'bg-green-100 text-green-800',
      'ملغي': 'bg-red-100 text-red-800',
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const map = {
      'no_driver': 'بانتظار السائق',
      'accepted': 'مقبول',
      'searching': 'جاري',
      'completed': 'مكتمل',
      'cancelled': 'ملغي',
      'arrived': 'وصل موقع العميل',
      'rated': 'تم التقييم',
    };
    return map[status] || status || '-';
  };

  // Helper to format Firestore timestamps
  const formatTimestamp = (ts) => {
    if (!ts) return null;
    const date = ts._seconds
      ? new Date(ts._seconds * 1000)
      : ts.seconds
        ? new Date(ts.seconds * 1000)
        : new Date(ts);
    
    // Check if valid date
    if (isNaN(date.getTime())) return '-';
    
    return date.toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // ==================== حالة التحميل ====================
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
        <p className="text-gray-500 text-lg">جاري تحميل تفاصيل الطلب...</p>
      </div>
    );
  }

  // ==================== حالة الخطأ ====================
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-red-500 text-lg">حدث خطأ أثناء تحميل تفاصيل الطلب</p>
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

  // ==================== الطلب غير موجود ====================
  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">لم يتم العثور على الطلب</p>
        <button
          onClick={() => navigate('/orders')}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          العودة إلى قائمة الطلبات
        </button>
      </div>
    );
  }

  const clientName = order.clientFirstName || order.clientName || 'غير محدد';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">تفاصيل الطلب</h1>
            <p className="text-gray-600">رقم الطلب: {order.orderId || order.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusBadge(order.status)}`}>
            {getStatusText(order.status)}
          </span>
          {canManage && (order.status === 'معلق' || order.status === 'مقبول') && (
            <button
              onClick={() => handleAction('cancel')}
              disabled={updateStatus.isPending}
              className="flex items-center space-x-2 space-x-reverse bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              <span>إلغاء الطلب</span>
            </button>
          )}
          {canManage && order.status === 'جاري' && (
            <button
              onClick={() => handleAction('complete')}
              disabled={updateStatus.isPending}
              className="flex items-center space-x-2 space-x-reverse bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>إنهاء الطلب</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Details */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-3 space-x-reverse">
              <Package className="w-6 h-6 text-primary-700" />
              <span>معلومات الطلب</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع البضاعة</label>
                <p className="text-gray-900">{order.cargoType || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع المركبة</label>
                <p className="text-gray-900">{order.vehicleType || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المسافة</label>
                <p className="text-gray-900">{order.distance || '-'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">السعر</label>
                <p className="text-gray-900 font-bold text-green-600">
                  {order.price || order.estimatedPrice || 0} ريال
                </p>
              </div>

            </div>

            {order.notes && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{order.notes}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-3 space-x-reverse">
              <MapPin className="w-6 h-6 text-primary-700" />
              <span>معلومات الموقع والعناوين</span>
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 space-x-reverse p-4 bg-green-50 rounded-lg">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">موقع الانطلاق</p>
                  <p className="text-sm text-gray-600">{order.pickupLocation?.address || '-'}</p>
                </div>
                <Navigation className="w-5 h-5 text-green-600" />
              </div>

              <div className="flex items-center space-x-4 space-x-reverse p-4 bg-red-50 rounded-lg">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">موقع الوصول</p>
                  <p className="text-sm text-gray-600">
                    {order.dropoffLocation?.address || order.deliveryLocation?.address || '-'}
                  </p>
                </div>
                <MapPin className="w-5 h-5 text-red-600" />
              </div>
            </div>


          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-3 space-x-reverse">
              <User className="w-6 h-6 text-primary-700" />
              <span>معلومات العميل</span>
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-700 font-semibold">
                    {clientName.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{clientName}</p>
                  <p className="text-sm text-gray-500">الاسم الكامل</p>
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">رقم الهاتف:</span>
                  <span className="text-sm font-medium text-gray-900" dir="ltr">
                    {order.clientPhone || order.customerPhone || '-'}
                  </span>
                </div>
                {order.clientEmail && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">البريد الإلكتروني:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {order.clientEmail}
                    </span>
                  </div>
                )}
                {order.clientId && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">معرف العميل:</span>
                    <span className="text-sm font-mono text-xs text-gray-400">
                      {order.clientId}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Driver Info */}
          {order.driverName ? (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-3 space-x-reverse">
                <Truck className="w-6 h-6 text-primary-700" />
                <span>معلومات السائق</span>
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-700 font-semibold">
                      {order.driverName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{order.driverName}</p>
                    <p className="text-sm text-gray-500">السائق المعتمد</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">رقم الهاتف:</span>
                    <span className="text-sm font-medium text-gray-900" dir="ltr">
                      {order.driverPhone || order.phone || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">نوع المركبة:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {order.vehicleType || '-'}
                    </span>
                  </div>
                  {order.plateNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">رقم اللوحة:</span>
                      <span className="text-sm font-medium text-gray-900" dir="ltr">
                        {order.plateNumber}
                      </span>
                    </div>
                  )}
                  {order.driverRating && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">تقييم السائق:</span>
                      <div className="flex items-center space-x-1 space-x-reverse">
                        <span className="text-sm font-medium text-gray-900">{order.driverRating}</span>
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      </div>
                    </div>
                  )}
                  {order.driverId && (
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-gray-500">معرف السائق:</span>
                      <span className="text-sm font-mono text-xs text-gray-400">
                        {order.driverId}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <p className="text-gray-500 text-center">لم يتم تعيين سائق بعد</p>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-3 space-x-reverse">
              <Clock className="w-6 h-6 text-primary-700" />
              <span>الجدول الزمني</span>
            </h3>

            <div className="space-y-4">
              <div className="flex items-start space-x-3 space-x-reverse">
                <div className="w-3 h-3 bg-blue-500 rounded-full mt-1"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">تم إنشاء الطلب</p>
                  <p className="text-xs text-gray-500">
                    {formatTimestamp(order.createdAt) || '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 space-x-reverse">
                <div className={`w-3 h-3 rounded-full mt-1 ${order.driverId || order.assignedDate ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">تم تعيين سائق</p>
                  <p className="text-xs text-gray-500">
                    {formatTimestamp(order.assignedDate) || (order.driverId ? 'تم التعيين' : 'لم يتم التعيين بعد')}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 space-x-reverse">
                <div className={`w-3 h-3 rounded-full mt-1 ${order.status === 'completed' || order.status === 'rated' || order.completedDate ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">تم إكمال الطلب</p>
                  <p className="text-xs text-gray-500">
                    {formatTimestamp(order.completedDate) || (order.status === 'completed' || order.status === 'rated' ? 'تم الإكمال' : '-')}
                  </p>
                </div>
              </div>

              {(order.status === 'cancelled' || order.canceledDate) && (
                <div className="flex items-start space-x-3 space-x-reverse">
                  <div className="w-3 h-3 bg-red-500 rounded-full mt-1"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">تم إلغاء الطلب</p>
                    <p className="text-xs text-gray-500">
                      {formatTimestamp(order.canceledDate) || 'تم الإلغاء'}
                    </p>
                    {order.cancelReason && (
                      <p className="text-xs text-gray-600 mt-1">{order.cancelReason}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
