import React, { useState } from 'react';
import {
  Shield,
  Key,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Users,
  UserCheck,
  Download,
  Mail as MailIcon,
  ShieldCheck,
} from 'lucide-react';
import ReportActions from '../../components/common/ReportActions';
import { useSettings } from '../../hooks/useSettings';
import { useAdmins } from '../../hooks/useAdmins';
import ReportService from '../../services/ReportService';

const RolesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: settings } = useSettings(true);
  const { data: admins, isLoading, isError, refetch } = useAdmins();

  const dynamicLogo = settings?.system?.logo || '/assets/images/logo.png';

  const filteredAdmins = admins?.filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.role?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const totals = {
    managers: admins?.filter(a => a.role?.toLowerCase() === 'manager' || a.role === 'مدير').length || 0,
    supervisors: admins?.filter(a => a.role?.toLowerCase() === 'supervisor' || a.role === 'مشرف').length || 0,
    active: admins?.filter(a => !a.disabled).length || 0
  };

  const exportPDF = async () => {
    try {
      await ReportService.generateReport(filteredAdmins, 'roles', {
        title: "تقرير مسؤولي النظام والصلاحيات",
        logoUrl: dynamicLogo,
        filename: `Admins_Report_${new Date().getTime()}.pdf`
      });
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("حدث خطأ أثناء تصدير التقرير");
    }
  };

  const exportExcel = () => {
    try {
      const timestamp = new Date().getTime();
      const filename = `Admins_Roles_Report_${timestamp}.xlsx`;
      const excelData = filteredAdmins.map((a, i) => [
        i + 1,
        a.name || '-',
        a.email || '-',
        a.phone || a.phoneNumber || '-',
        a.role || 'مشرف',
        !a.disabled ? 'نشط' : 'معطل'
      ]);

      const sheets = [{
        name: 'تقرير صلاحيات النظام',
        headers: ["#", "المستخدم", "البريد الإلكتروني", "رقم الهاتف", "الدور", "الحالة"],
        data: excelData
      }];

      import('../../utils/ExcelReportGenerator').then(module => {
        module.default.export({ filename, sheets });
      });
    } catch (e) {
      alert("فشل تصدير ملف Excel");
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] font-arabic">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
      <p className="text-gray-500 font-black">جاري جلب قائمة مسؤولي النظام...</p>
    </div>
  );

  if (isError) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-red-50 rounded-3xl border border-red-100 font-arabic">
      <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
      <h3 className="text-xl font-bold text-gray-900 mb-2">فشل جلب قائمة الإداريين</h3>
      <button onClick={() => refetch()} className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-bold">
        إعادة المحاولة
      </button>
    </div>
  );

  return (
    <div className="space-y-8 bg-[#f8fafc] min-h-screen p-6 font-arabic print:bg-white print:p-0 print:m-0 print:space-y-6" dir="rtl">
      {/* رأس تقرير مخصص للطباعة */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-gray-900 pb-4 mb-6">
        <div className="flex items-center gap-4">
          <img src={dynamicLogo} alt="Logo" className="w-16 h-16 object-contain" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">يمن نقل - Yemen Naql</h1>
            <p className="text-sm font-bold text-gray-600">نظام إدارة خدمات النقل الذكي</p>
          </div>
        </div>
        <div className="text-left text-right">
          <h2 className="text-xl font-bold text-gray-900">تقرير صلاحيات ومسؤولي النظام</h2>
          <p className="text-sm font-bold text-gray-600">التاريخ: {new Date().toLocaleDateString('ar-YE')}</p>
        </div>
      </div>

      {/* --- Premium Header --- */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 transition-all hover:shadow-md print:hidden">
        <div className="flex items-center space-x-6 space-x-reverse">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl shadow-lg flex items-center justify-center transform hover:rotate-3 transition-transform">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">إدارة الصلاحيات تقرير </h1>
            <p className="text-gray-400 font-bold text-sm mt-1">تقرير تفصيلي بمستخدمي النظام ذوي الرتب الإدارية</p>
          </div>
        </div>

        
        <ReportActions 
          onExportExcel={exportExcel}
          onExportPDF={exportPDF}
          onRefresh={refetch}
          isLoading={isLoading}
        />
      </div>

      {/* --- Quick Stats Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 print:grid-cols-3 print:gap-4">
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 flex items-center space-x-6 space-x-reverse group hover:shadow-xl transition-all">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
            <Key className="w-8 h-8 text-purple-700" />
          </div>
          <div>
            <p className="text-xs font-normal text-gray-400 uppercase tracking-widest mb-1">مدراء النظام</p>
            <p className="text-3xl font-normal text-gray-900">{totals.managers}</p>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 flex items-center space-x-6 space-x-reverse group hover:shadow-xl transition-all">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
            <Users className="w-8 h-8 text-blue-700" />
          </div>
          <div>
            <p className="text-xs font-normal text-gray-400 uppercase tracking-widest mb-1">إجمالي المشرفين</p>
            <p className="text-3xl font-normal text-gray-900">{totals.supervisors}</p>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 flex items-center space-x-6 space-x-reverse group hover:shadow-xl transition-all border-t-4 border-t-green-500">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
            <UserCheck className="w-8 h-8 text-green-700" />
          </div>
          <div>
            <p className="text-xs font-normal text-gray-400 uppercase tracking-widest mb-1">حسابات نشطة</p>
            <p className="text-3xl font-normal text-gray-900">{totals.active}</p>
          </div>
        </div>
      </div>

      {/* --- Management Toolbar --- */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row items-center justify-between gap-6 print:hidden">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="بحث باسم الإداري أو الدور..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 font-bold transition-all"
          />
        </div>
      </div>

      {/* --- Data Table --- */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-none print:rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100 print:bg-gray-100">
              <tr>
                <th className="px-8 py-6 text-sm font-black text-gray-400 uppercase tracking-wider text-right">المسـتخدم</th>
                <th className="px-8 py-6 text-sm font-black text-gray-400 uppercase tracking-wider text-right">البريد الإلكتروني</th>
                <th className="px-8 py-6 text-sm font-black text-gray-400 uppercase tracking-wider text-right">رقم الهاتف</th>
                <th className="px-8 py-6 text-sm font-black text-gray-400 uppercase tracking-wider text-right">الـدور</th>
                <th className="px-8 py-6 text-sm font-black text-gray-400 uppercase tracking-wider text-right">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAdmins.map((admin) => (
                <tr key={admin.uid || admin.id} className="hover:bg-primary-50/10 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center font-normal text-lg shadow-sm group-hover:scale-110 transition-transform">
                        {admin.name?.charAt(0) || 'A'}
                      </div>
                      <div>
                        <span className="font-bold text-gray-950 block">{admin.name || '-'}</span>
                        <span className="text-[10px] text-gray-400 font-normal uppercase tracking-widest">ID: {admin.uid?.slice(-6) || 'N/A'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-slate-600 font-sans tracking-tight">
                    {admin.email || '-'}
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-slate-800 font-sans tracking-tight">
                    {admin.phone || admin.phoneNumber || '-'}
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[11px] font-black tracking-wider shadow-sm border ${
                      admin.role?.toLowerCase() === 'manager' || admin.role === 'مدير' 
                        ? 'bg-purple-100 text-purple-700 border-purple-200' 
                        : 'bg-indigo-100 text-indigo-700 border-indigo-200'
                    }`}>
                      {admin.role || 'مشرف'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-right">
                      {!admin.disabled ? (
                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 font-black text-xs">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>نشط</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-xl border border-red-100 font-black text-xs">
                          <XCircle className="w-4 h-4" />
                          <span>معطل</span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAdmins.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-8 py-20 text-center text-gray-400 font-bold">
                    لا يوجد مستخدمون إداريون يطابقون بحثك حالياً
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-center pb-10 print:mt-10">
        <p className="text-gray-400 text-xs font-black uppercase tracking-[0.3em] print:text-gray-600">نظام إدارة الرتب والصلاحيات - يمن نقل 2026</p>
      </div>
    </div>
  );
};

export default RolesPage;
