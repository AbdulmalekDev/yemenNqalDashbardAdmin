import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Phone,
  Mail,
  Calendar,
  Package,
  DollarSign,
  Ban,
  UserX,
  Eye,
  AlertCircle,
  RefreshCw,
  Edit,
} from 'lucide-react';
import { useCustomer, useUpdateCustomerStatus } from '../../hooks/useCustomers';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const CustomerProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const canEdit = hasPermission('manage_customers');
  const { showNotification } = useNotification();

  // ==================== React Query ====================
  const { data: customer, isLoading, isError, error, refetch } = useCustomer(id);
  const updateStatus = useUpdateCustomerStatus();

  // ==================== تحديث الحالة ====================
  const handleStatusChange = async (newStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status: newStatus });
      showNotification(`تم تحديث حالة العميل إلى: ${newStatus}`, 'success');
    } catch (err) {
      showNotification('حدث خطأ أثناء تحديث الحالة', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'نشط': 'bg-green-100 text-green-800',
      'محظور': 'bg-red-100 text-red-800',
      'غير نشط': 'bg-gray-100 text-gray-800',
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  };

  // ==================== حالة التحميل ====================
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
        <p className="text-gray-500 text-lg">جاري تحميل البيانات...</p>
      </div>
    );
  }

  // ==================== حالة الخطأ ====================
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-red-500 text-lg">حدث خطأ أثناء تحميل بيانات العميل</p>
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

  // ==================== العميل غير موجود ====================
  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">لم يتم العثور على العميل</p>
        <button
          onClick={() => navigate('/customers')}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          العودة إلى قائمة العملاء
        </button>
      </div>
    );
  }

  // ==================== تواريخ ====================
  const joinDate = customer.createdAt?._seconds
    ? new Date(customer.createdAt._seconds * 1000)
    : customer.createdAt
      ? new Date(customer.createdAt)
      : new Date();

  const totalOrders = customer.totalOrders || 0;
  const totalSpent = customer.totalSpent || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <button
            onClick={() => navigate('/customers')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">الملف الشخصي للعميل</h1>

          </div>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          {canEdit && (
            <>
              <button
                onClick={() => navigate(`/customers/edit/${id}`)}
                className="flex items-center space-x-2 space-x-reverse bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              >
                <Edit className="w-4 h-4" />
                <span>تعديل البيانات</span>
              </button>
              {customer.status === 'نشط' ? (
                <button
                  onClick={() => handleStatusChange('محظور')}
                  disabled={updateStatus.isPending}
                  className="flex items-center space-x-2 space-x-reverse bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  <Ban className="w-4 h-4" />
                  <span>حظر العميل</span>
                </button>
              ) : (
                <button
                  onClick={() => handleStatusChange('نشط')}
                  disabled={updateStatus.isPending}
                  className="flex items-center space-x-2 space-x-reverse bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <UserX className="w-4 h-4" />
                  <span>إلغاء الحظر</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* بطاقة الملف الشخصي */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="text-center">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-700 font-bold text-2xl">
                  {(customer.name || 'ع').charAt(0)}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{customer.name || 'بدون اسم'}</h2>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-center space-x-2 space-x-reverse text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{customer.phone || 'لا يوجد'}</span>
                </div>
                <div className="flex items-center justify-center space-x-2 space-x-reverse text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{customer.email || 'لا يوجد'}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">الحالة</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
                      customer.status
                    )}`}
                  >
                    {customer.status || 'نشط'}
                  </span>
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

        {/* تفاصيل العميل */}
        <div className="lg:col-span-2 space-y-6">
          {/* الإحصائيات */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">إحصائيات العميل</h3>

            <div className="grid grid-cols-1 gap-4">
              <div className="bg-primary-50 rounded-lg p-6 text-center">
                <Package className="w-10 h-10 text-primary-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-primary-700">{totalOrders}</p>
                <p className="text-sm font-medium text-primary-600">إجمالي الطلبات</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
};

export default CustomerProfilePage;
