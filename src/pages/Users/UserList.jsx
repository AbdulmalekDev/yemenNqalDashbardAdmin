import React, { useState, useMemo } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Trash2,
  ShieldCheck,
  Shield,
  UserX,
  UserCheck,
  Search,
  Edit2,
  Loader2,
  Eye,
  AlertCircle,
  Phone,
  FileText,
  Printer,
  ChevronDown
} from 'lucide-react';
import { getUsers, toggleUserStatus, deleteUser } from './UserService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useSettings } from '../../hooks/useSettings';
import ReportService from '../../services/ReportService';

const UserList = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { showNotification } = useNotification();
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { data: settings } = useSettings(true);
  const dynamicLogo = settings?.system?.logo || '/assets/images/logo.png';

  // تحديث الجلب ليدعم التحميل التدريجي (Pagination)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError
  } = useInfiniteQuery({
    queryKey: ['admins', 'paginated'],
    queryFn: ({ pageParam }) => getUsers({ lastId: pageParam, limit: 10 }),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.lastId : undefined,
    initialPageParam: null,
    staleTime: 5 * 60 * 1000,
  });

  // تجميع كل المستخدمين من كل الصفحات
  const allUsers = useMemo(() => {
    return data?.pages.flatMap(page => page.data) || [];
  }, [data]);

  // تحديث الحالة (Optimistic UI)
  const statusMutation = useMutation({
    mutationFn: ({ uid, disabled }) => toggleUserStatus(uid, disabled),
    onMutate: async ({ uid, disabled }) => {
      await queryClient.cancelQueries({ queryKey: ['admins', 'paginated'] });
      const previousData = queryClient.getQueryData(['admins', 'paginated']);

      queryClient.setQueryData(['admins', 'paginated'], old => ({
        ...old,
        pages: old.pages.map(page => ({
          ...page,
          data: page.data.map(user => 
            user.uid === uid ? { ...user, status: disabled ? 'disabled' : 'active' } : user
          )
        }))
      }));

      return { previousData };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['admins', 'paginated'], context.previousData);
      showNotification(err.message || 'فشل تحديث الحالة', 'error');
    },
    onSuccess: (res) => {
      showNotification(res.message, 'success');
    }
  });

  // الحذف (Optimistic UI)
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onMutate: async (uid) => {
      await queryClient.cancelQueries({ queryKey: ['admins', 'paginated'] });
      const previousData = queryClient.getQueryData(['admins', 'paginated']);

      queryClient.setQueryData(['admins', 'paginated'], old => ({
        ...old,
        pages: old.pages.map(page => ({
          ...page,
          data: page.data.filter(user => user.uid !== uid)
        }))
      }));

      setDeleteConfirm(null);
      return { previousData };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['admins', 'paginated'], context.previousData);
      showNotification(err.message || 'فشل حذف المستخدم', 'error');
    },
    onSuccess: (res) => {
      showNotification(res.message, 'success');
    }
  });

  const filteredUsers = allUsers.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportPDF = async () => {
    try {
      // Prepare metrics for the summary cards
      const metrics = [
        { label: "إجمالي المستخدمين", value: allUsers.length, bgColor: [249, 250, 251] },
        { label: "نشطين حالياً", value: allUsers.filter(u => u.status === 'active').length, color: [5, 150, 105], bgColor: [236, 253, 245] },
        { label: "مدراء النظام", value: allUsers.filter(u => u.role === 'manager').length, color: [124, 58, 237], bgColor: [245, 243, 255] }
      ];

      // Format data for the PDF table
      const reportData = filteredUsers.map(u => ({
        name: u.name || '-',
        email: u.email || '-',
        phone: u.phone || '-',
        role: u.role === 'manager' ? 'مدير نظام' : u.role === 'supervisor' ? 'مشرف' : 'مستخدم',
        status: u.status === 'active' ? 'نشط' : 'معطل'
      }));

      await ReportService.generateReport(reportData, 'users', {
        title: "تقرير مستخدمي النظام والإداريين",
        logoUrl: dynamicLogo,
        filename: `تقرير_المستخدمين_${new Date().getTime()}.pdf`,
        metrics: metrics
      });
    } catch (err) {
      console.error("PDF Export Error:", err);
      showNotification("حدث خطأ أثناء تصدير التقرير", "error");
    }
  };

  const isManager = currentUser?.role === 'manager';

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
      <p className="text-gray-500 font-medium font-arabic">جاري تحميل قائمة المستخدمين...</p>
    </div>
  );

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 bg-red-50 rounded-[3rem] border border-red-100 mx-4 animate-in fade-in duration-500 font-arabic" dir="rtl">
      <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mb-6 text-red-500 shadow-xl shadow-red-100">
        <AlertCircle className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-black text-red-900 mb-2">فشل جلب المستخدمين</h2>
      <button
        onClick={() => queryClient.invalidateQueries({ queryKey: ['admins'] })}
        className="px-8 py-3 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all flex items-center gap-2"
      >
        إعادة المحاولة
      </button>
    </div>
  );

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 font-arabic" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center mb-1">
            <Users className="ml-3 text-primary-600 w-8 h-8" />
            إدارة حسابات المستخدمين
          </h1>
          <p className="text-gray-500 font-medium text-base">عرض وتحكم في حسابات الإداريين والمشرفين والنظام</p>
        </div>
        
        <div className="flex items-center gap-4">


          {isManager && (
            <Link
              to="/users/new"
              className="flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 font-bold"
            >
              <UserPlus className="ml-2 w-5 h-5" />
              إضافة مستخدم جديد
            </Link>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="بحث بالاسم أو البريد..."
            className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-transparent rounded-[1.5rem] focus:ring-4 focus:ring-primary-100 focus:bg-white focus:border-primary-500 transition-all outline-none font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="px-6 py-3 bg-primary-50 rounded-2xl border border-primary-100 flex items-center gap-2">
          <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
          <span className="text-sm font-normal text-primary-700">{filteredUsers.length} مستخدم معروض</span>
        </div>
      </div>

      {/* Table View */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-8 py-6 text-sm font-black text-gray-400 uppercase tracking-wider text-right">المسـتخدم</th>
              <th className="px-8 py-6 text-sm font-black text-gray-400 uppercase tracking-wider text-right">البريد الإلكتروني</th>
              <th className="px-8 py-6 text-sm font-black text-gray-400 uppercase tracking-wider text-right">رقم الهاتف</th>
              <th className="px-8 py-6 text-sm font-black text-gray-400 uppercase tracking-wider text-right">الـدور</th>
              <th className="px-8 py-6 text-sm font-black text-gray-400 uppercase tracking-wider text-right">الحالة</th>
              <th className="px-8 py-6 text-sm font-black text-gray-400 uppercase tracking-wider text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredUsers.map((u) => (
              <tr key={u.uid} className="hover:bg-primary-50/30 transition-colors group">
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 text-primary-700 flex items-center justify-center font-black text-xl border border-primary-200 shadow-sm group-hover:scale-110 transition-transform duration-300">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-base font-black text-gray-900 leading-none mb-1">{u.name}</div>
                      <div className="text-[10px] font-normal text-gray-400 uppercase tracking-tighter">معرف: {u.uid.substring(0, 8)}...</div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap text-sm font-normal text-gray-500">
                  {u.email}
                </td>
                <td className="px-8 py-6 whitespace-nowrap text-sm font-normal text-gray-600 font-sans">
                  {u.phone || '—'}
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-normal uppercase tracking-wider ${
                    u.role === 'manager' ? 'bg-purple-100 text-purple-700' : 
                    u.role === 'supervisor' ? 'bg-blue-100 text-blue-700' : 
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {u.role === 'manager' && <ShieldCheck className="w-3.5 h-3.5" />}
                    {u.role === 'supervisor' && <Shield className="w-3.5 h-3.5" />}
                    {u.role === 'default' && <Users className="w-3.5 h-3.5" />}
                    {u.role === 'manager' ? 'مدير نظام' : u.role === 'supervisor' ? 'مشرف' : 'مستخدم'}
                  </div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></span>
                    {u.status === 'active' ? 'نشط الآن' : 'معطل'}
                  </div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      to={`/users/${u.uid}`}
                      className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 hover:bg-primary-100 shadow-sm transition-all"
                      title="عرض الملف"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>

                    {isManager && currentUser?.uid !== u.uid && (
                      <>
                        <Link
                          to={`/users/edit/${u.uid}`}
                          className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 hover:bg-blue-100 shadow-sm transition-all"
                          title="تعديل"
                        >
                          <Edit2 className="w-5 h-5" />
                        </Link>

                        <button
                          onClick={() => {
                            if (window.confirm(`هل أنت متأكد من ${u.status === 'active' ? 'تعطيل' : 'تفعيل'} حساب ${u.name}؟`)) {
                              statusMutation.mutate({ uid: u.uid, disabled: u.status === 'active' });
                            }
                          }}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-all ${u.status === 'active' ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                          title={u.status === 'active' ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                        >
                          {u.status === 'active' ? <UserX className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                        </button>

                        <button
                          onClick={() => setDeleteConfirm(u)}
                          className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600 hover:bg-red-100 shadow-sm transition-all"
                          title="حذف نهائي"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {hasNextPage && (
          <div className="p-8 flex justify-center border-t border-gray-50">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="px-10 py-4 bg-gray-50 text-gray-700 font-black rounded-2xl hover:bg-gray-100 transition-all border border-gray-100 flex items-center gap-3 disabled:opacity-50"
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري التحميل...
                </>
              ) : (
                <>
                  <ChevronDown className="w-5 h-5" />
                  تحميل المزيد من المستخدمين
                </>
              )}
            </button>
          </div>
        )}

        {filteredUsers.length === 0 && (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-[2rem] flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10" />
            </div>
            <p className="font-black text-gray-400">لم يتم العثور على مستخدمين</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Overlay */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-sm shadow-2xl p-10 text-center animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
              <AlertCircle className="w-12 h-12" />
            </div>
            <h3 className="text-3xl font-black text-gray-900 mb-3">تنبيه حـذف!</h3>
            <p className="text-gray-500 text-sm mb-10 leading-relaxed font-medium">
              هل أنت متأكد من حذف <span className="font-black text-red-600">"{deleteConfirm.name}"</span>؟
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => deleteMutation.mutate(deleteConfirm.uid)}
                disabled={deleteMutation.isPending}
                className="flex-[2] bg-red-600 text-white font-black h-16 rounded-2xl hover:bg-red-700 transition-all"
              >
                {deleteMutation.isPending ? 'جاري الحذف...' : 'حذف نهائي'}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-100 text-gray-700 font-black h-16 rounded-2xl hover:bg-gray-200 transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
