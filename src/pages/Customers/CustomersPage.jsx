import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ReportPDFGenerator from '../../utils/ReportPDFGenerator';
import { useSettings } from '../../hooks/useSettings';
import {
  UserCheck,
  Search,
  Eye,
  Ban,
  UserX,
  Phone,
  Mail as MailIcon,
  Calendar,
  DollarSign,
  Package,
  RefreshCw,
  AlertCircle,
  UserPlus,
  Edit,
  FileText,
  Printer,
  Trash2,
} from 'lucide-react';
import { useCustomers, useUpdateCustomerStatus, useDeleteCustomer } from '../../hooks/useCustomers';
import { useAuth } from '../../context/AuthContext';

const CustomersPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { user, hasPermission } = useAuth();
  const isManager = user?.role === 'manager';
  const canEdit = hasPermission('manage_customers');
  const { data: settings } = useSettings(true);
  const dynamicLogo = settings?.system?.logo || '/assets/images/logo.png';

  // ==================== React Query & Selective Loading ====================
  // جلب الحقول المطلوبة فقط لتقليل الحجم (اسم، هاتف، بريد) كما في الشريحة 6
  const fields = 'id,name,phone,email,status,totalOrders,totalSpent,createdAt,updatedAt';

  const { data: response, isLoading, isError, error, refetch } = useCustomers({
    limit,
    searchTerm,
    status: statusFilter,
    fields,
    page // Backend will interpret this to manage cursors if needed
  });

  const customersData = response?.data || [];
  const pagination = response?.pagination || { total: 0, totalPages: 1 };
  const updateStatus = useUpdateCustomerStatus();

  // ==================== تحديث حالة العميل ====================
  const handleStatusChange = async (customerId, newStatus) => {
    if (!window.confirm("هل أنت متأكد من تنفيذ هذه العملية؟")) return;

    try {
      await updateStatus.mutateAsync({ id: customerId, status: newStatus });
      toast.success(newStatus === 'محظور' ? "تم حظر العميل بنجاح" : "تم فك الحظر عن العميل", {
        style: { borderRadius: '15px' },
        icon: newStatus === 'محظور' ? '🚫' : '✅'
      });
    } catch (err) {
      toast.error("حدث خطأ أثناء تعديل الحظر");
    }
  };

  // ==================== حذف العميل ====================
  const deleteCustomer = useDeleteCustomer();
  const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm("هل أنت متأكد من رغبتك في حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء.")) return;

    try {
      await deleteCustomer.mutateAsync(customerId);
      toast.success("تم حذف العميل بنجاح", {
        style: { borderRadius: '15px' },
        icon: '🗑️'
      });
    } catch (err) {
      toast.error("حدث خطأ أثناء حذف العميل");
    }
  };

  // ==================== شارة الحالة ====================
  const getStatusBadge = (status) => {
    switch (status) {
      case 'نشط':
        return 'bg-green-100 text-green-700';
      case 'محظور':
        return 'bg-red-100 text-red-700';
      case 'غير نشط':
        return 'bg-gray-200 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Removed client-side filtering; filtering is now handled on the server.
  const displayCustomers = customersData;

  const onSearchChange = (val) => {
    setSearchTerm(val);
    setPage(1);
  };

  const onFilterChange = (val) => {
    setStatusFilter(val);
    setPage(1);
  };

  const formatPhone = (p) => p ? p.replace(/^\+967|^967/, '') : '-';

  // ==================== حالة التحميل ====================
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
        <p className="text-gray-500 text-lg">جاري تحميل العملاء...</p>
      </div>
    );
  }

  // ==================== حالة الخطأ ====================
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-red-500 text-lg">حدث خطأ أثناء تحميل العملاء</p>
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
      const reporter = await ReportPDFGenerator.init();

      // Top Header Global Standard
      await reporter.addHeaderGlobal("تقرير بيانات العملاء الشامل", dynamicLogo, displayCustomers.length);

      // Table Section
      reporter.addSectionTitle("جدول تفصيلي لبيانات العملاء");

      const headers = ["اسم العميل", "رقم الهاتف", "البريد الإلكتروني", "عدد الطلبات", "حالة النشاط"];
      const data = displayCustomers.map((customer, index) => [
        customer.name || '-',
        customer.phone || '-',
        customer.email || '-',
        (customer.totalOrders || 0).toString(),
        customer.status || 'نشط'
      ]);

      reporter.addTable(headers, data);

      // Statistics Section
      reporter.addSectionTitle("خلاصة وإحصائيات التقرير");

      const totalCustomers = displayCustomers.length;
      const activeCustomers = displayCustomers.filter(c => c.status === 'نشط').length;
      const suspendedCustomers = displayCustomers.filter(c => c.status === 'محظور' || c.status === 'غير نشط').length;

      reporter.addSummary([
        { label: "إجمالي العملاء", value: totalCustomers },
        { label: "العملاء النشطين", value: activeCustomers },
        { label: "العملاء الموقوفين", value: suspendedCustomers },
        { label: "إجمالي الطلبات", value: displayCustomers.reduce((s, c) => s + (c.totalOrders || 0), 0) }
      ]);

      reporter.save(`yemen_naql_customers_report_${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error("Error generating Global PDF:", err);
      alert("حدث خطأ أثناء استخراج التقرير العالمي");
    }
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {/* رأس تقرير مخصص للطباعة */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-gray-900 pb-4 mb-6">
        <div className="flex items-center gap-4">
          <img src={dynamicLogo} alt="Logo" className="w-16 h-16 object-contain" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">يمن نقل - Yemen Naql</h1>
            <p className="text-sm font-bold text-gray-600">نظام إدارة خدمات النقل الذكي</p>
          </div>
        </div>
        <div className="text-left">
          <h2 className="text-xl font-bold text-gray-900">تقرير بيانات العملاء</h2>
          <p className="text-sm font-bold text-gray-600">التاريخ: {new Date().toLocaleDateString('ar-YE')}</p>
        </div>
      </div>

      {/* العنوان وإجمالي العملاء */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-3 space-x-reverse">
          <UserCheck className="w-8 h-8 text-primary-700" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة العملاء</h1>
            <p className="text-gray-600">إدارة ومراقبة جميع العملاء (Pagination Mode)</p>
          </div>
        </div>
        <div className="flex items-center space-x-4 space-x-reverse font-arabic" dir="rtl">
          {hasPermission('manage_customers') && (
            <button
              onClick={() => navigate('/customers/new')}
              className="flex items-center space-x-2 space-x-reverse bg-primary-700 text-white px-4 py-2 rounded-lg hover:bg-primary-800 transition shadow-md font-bold"
            >
              <UserPlus className="w-5 h-5" />
              <span>إضافة عميل</span>
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
            <p className="text-sm text-gray-500">إجمالي العملاء</p>
            <p className="text-2xl font-bold text-primary-700">{pagination.total}</p>
          </div>
        </div>
      </div>

      {/* الفلاتر */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="بحث باسم العميل أو الهاتف..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">الكل</option>
            <option value="نشط">نشط</option>
            <option value="محظور">محظور</option>
            <option value="غير نشط">غير نشط</option>
          </select>
          <div className="flex items-center justify-center bg-primary-50 rounded-lg px-4 py-2">
            <span className="text-primary-700 font-medium">
              {displayCustomers.length} في الصفحة (الإجمالي: {pagination.total})
            </span>
          </div>
        </div>
      </div>

      {/* جدول العملاء */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden print:shadow-none print:border-none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 print:bg-gray-100">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">اسم العميل</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">رقم الهاتف</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">البريد الإلكتروني</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 print:w-32">عدد الطلبات</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">حالة النشاط</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 print:hidden">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayCustomers.map((customer) => {
                const joinDate = customer.createdAt?._seconds
                  ? new Date(customer.createdAt._seconds * 1000)
                  : customer.createdAt
                    ? new Date(customer.createdAt)
                    : new Date();
                const lastOrderDate = customer.updatedAt?._seconds
                  ? new Date(customer.updatedAt._seconds * 1000)
                  : customer.updatedAt
                    ? new Date(customer.updatedAt)
                    : new Date();

                return (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-700 font-bold">
                            {(customer.name || 'ع').charAt(0)}
                          </span>
                        </div>
                        <p className="font-normal text-gray-900">{customer.name || 'بدون اسم'}</p>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-gray-700">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{formatPhone(customer.phone)}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-gray-700 align-middle text-right" dir="ltr">
                      <div className="flex items-center justify-end gap-2">
                        <MailIcon className="w-4 h-4 opacity-50" />
                        <span>{customer.email || 'لا يوجد'}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-normal text-gray-900 bg-gray-50 px-3 py-1 rounded-lg">
                        {customer.orderCount || customer.totalOrders || 0} طلب
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
                          customer.status
                        )}`}
                      >
                        {customer.status || 'نشط'}
                      </span>
                    </td>

                    <td className="px-6 py-4 print:hidden">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        {canEdit && (
                          <button
                            onClick={() => navigate(`/customers/edit/${customer.id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="تعديل البيانات"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => navigate(`/customers/${customer.id}`)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                          title="عرض الملف الشخصي"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {hasPermission('manage_customers') && (
                          customer.status === 'نشط' ? (
                            <button
                              onClick={() => handleStatusChange(customer.id, 'محظور')}
                              disabled={updateStatus.isPending}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                              title="حظر العميل"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(customer.id, 'نشط')}
                              disabled={updateStatus.isPending}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                              title="إلغاء الحظر"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          )
                        )}

                        {hasPermission('manage_customers') && (
                          <button
                            onClick={() => handleDeleteCustomer(customer.id)}
                            disabled={deleteCustomer.isPending}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                            title="حذف العميل"
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
      </div>

      {displayCustomers.length === 0 && (
        <div className="text-center py-12">
          <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">لا يوجد عملاء يطابقون معايير البحث</p>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl shadow-lg border border-gray-100 print:hidden">
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

export default CustomersPage;
