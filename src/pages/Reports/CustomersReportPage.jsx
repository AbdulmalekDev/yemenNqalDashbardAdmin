import React, { useState } from 'react';
import {
    UserCheck,
    Search,
    FileText,
    RefreshCw,
    AlertCircle,
    Calendar,
    Package,
    Printer,
    FileDown,
    Activity,
    Mail as MailIcon,
    Phone,
} from 'lucide-react';
import ReportActions from '../../components/common/ReportActions';
import { useCustomers } from '../../hooks/useCustomers';
import { getCustomers } from '../../services/customerService';
import { useSettings } from '../../hooks/useSettings';
import ReportService from '../../services/ReportService';
import ExcelReportGenerator from '../../utils/ExcelReportGenerator';

// --- Premium Stat Card ---
const PremiumStatCard = ({ label, value, icon: Icon, colorClass, subValue }) => (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-xl transition-all duration-500 hover:-translate-y-1 relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-2 h-full ${colorClass.replace('bg-', 'bg-')}`}></div>
        <div className="flex items-center space-x-4 space-x-reverse">
            <div className={`p-4 rounded-2xl ${colorClass} bg-opacity-10 shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                <Icon className={`w-7 h-7 ${colorClass.replace('bg-', 'text-')}`} />
            </div>
            <div>
                <p className="text-gray-400 text-[10px] font-normal uppercase tracking-wider mb-1">{label}</p>
                <h4 className="text-2xl font-normal text-gray-900">{value}</h4>
                {subValue && <p className="text-[10px] text-primary-600 font-normal mt-1">{subValue}</p>}
            </div>
        </div>
    </div>
);

const CustomersReportPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);

    const { data: settings } = useSettings(true);
    const dynamicLogo = settings?.system?.logo || '/assets/images/logo.png';

    const { data: response, isLoading, isError, error, refetch } = useCustomers({
        page,
        limit: 20,
        searchTerm: searchTerm,
        fields: 'id,name,phone,email,status,orderCount,totalOrders,createdAt'
    });

    const customersData = response?.data || [];
    const pagination = response?.pagination || { total: 0, totalPages: 1 };

    // Removed client-side filtering; filtering is now handled on the server.
    const displayCustomers = customersData;

    const onSearchChange = (val) => {
        setSearchTerm(val);
        setPage(1);
    };

    const exportExcel = async () => {
        try {
            const allResponse = await getCustomers({
                limit: 5000,
                searchTerm: searchTerm,
                fields: 'id,name,phone,email,status,orderCount,totalOrders,createdAt'
            });
            const allCustomers = allResponse?.data || displayCustomers;

            const timestamp = new Date().getTime();
            const filename = `Customers_Report_${timestamp}.xlsx`;

            const clientData = allCustomers.map((c, i) => [
                i + 1,
                c.name || '-',
                c.phone || '-',
                c.email || '-',
                c.orderCount || c.totalOrders || 0,
                c.status || 'نشط'
            ]);

            const sheets = [{
                name: 'تقرير العملاء الاستراتيجي',
                headers: ["#", "اسم العميل", "رقم الهاتف", "البريد الإلكتروني", "عدد الطلبات", "حالة النشاط"],
                data: clientData
            }];

            ExcelReportGenerator.export({ filename, sheets });
        } catch (error) {
            console.error("Excel export error:", error);
            alert("حدث خطأ أثناء تصدير ملف الإكسيل الكامل");
        }
    };

    const stats = [
        { label: 'إجمالي العملاء', value: response?.pagination?.total || customersData.length, icon: UserCheck, colorClass: 'bg-blue-600' },
        { label: 'عملاء نشطين', value: customersData.filter(c => c.status === 'active' || c.status === 'نشط').length, icon: Calendar, colorClass: 'bg-green-600' },
        { label: 'إجمالي الطلبات', value: customersData.reduce((acc, c) => acc + (c.orderCount || c.totalOrders || 0), 0), icon: Package, colorClass: 'bg-orange-600' },
        { label: 'سجلات مفلترة', value: displayCustomers.length, icon: Activity, colorClass: 'bg-purple-600' },
    ];

    const exportPDF = async () => {
        try {
            const allResponse = await getCustomers({
                limit: 5000,
                searchTerm: searchTerm,
                fields: 'id,name,phone,email,status,orderCount,totalOrders,createdAt'
            });
            const allCustomers = allResponse?.data || displayCustomers;

            const reportData = allCustomers.map(c => ({
                name: c.name || 'بدون اسم',
                phone: c.phone || '-',
                email: c.email || '-',
                status: c.status || 'نشط'
            }));

            const pdfMetrics = stats.map(s => ({
                label: s.label,
                value: s.value,
                bgColor: [248, 250, 252]
            }));

            await ReportService.generateReport(reportData, 'customers', {
                title: "تقرير تحليل بيانات العملاء",
                logoUrl: dynamicLogo,
                filename: `تقرير_العملاء_يمن_نقل_${new Date().getTime()}.pdf`,
                metrics: pdfMetrics
            });

        } catch (err) {
            console.error("PDF Export Error:", err);
            alert("حدث خطأ أثناء تصدير التقرير PDF الكامل");
        }
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-40 animate-pulse">
            <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-6"></div>
            <p className="text-gray-400 font-bold tracking-widest text-sm uppercase">جاري تحليل بيانات العملاء...</p>
        </div>
    );

    if (isError) return (
        <div className="flex flex-col items-center justify-center py-20 text-red-500 bg-red-50 rounded-[2rem] border border-red-100">
            <AlertCircle className="w-16 h-16 mb-4" />
            <h3 className="text-xl font-black mb-2">فشل جلب البيانات</h3>
            <p className="text-sm font-bold opacity-70">خطأ: {error?.message}</p>
            <button onClick={() => refetch()} className="mt-6 px-8 py-3 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-all shadow-lg">إعادة المحاولة</button>
        </div>
    );


    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20 print:space-y-6 print:pb-0">
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
                    <h2 className="text-xl font-bold text-gray-900">تقرير بيانات العملاء</h2>
                    <p className="text-sm font-bold text-gray-600">التاريخ: {new Date().toLocaleDateString('ar-YE')}</p>
                </div>
            </div>

            {/* --- Premium Header --- */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-white p-10 rounded-[3rem] shadow-sm border border-gray-50 transform hover:shadow-md transition-all print:hidden">
                <div className="flex items-center space-x-6 space-x-reverse">
                    <div className="w-20 h-20 bg-gradient-to-tr from-primary-700 to-primary-500 rounded-[2rem] shadow-xl flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-500">
                        <UserCheck className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">تقرير العملاء</h1>
                        <p className="text-gray-400 font-bold text-base mt-1">تحليل مفصل لسلوك ونشاط العملاء على المنصة</p>
                    </div>
                </div>

                <ReportActions
                    onExportExcel={exportExcel}
                    onExportPDF={exportPDF}
                    onRefresh={refetch}
                    isLoading={isLoading}
                />
            </div>

            {/* --- Stats Grid --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 print:grid-cols-4 print:gap-4">
                {stats.map((stat, i) => (
                    <PremiumStatCard key={i} {...stat} />
                ))}
            </div>

            {/* --- Advanced Table Container --- */}
            <div className="bg-white rounded-[3.5rem] shadow-sm border border-gray-100 overflow-hidden relative print:shadow-none print:border-none print:rounded-none">
                <div className="p-10 border-b border-gray-50 flex flex-col xl:flex-row gap-6 items-center justify-between print:hidden bg-gray-50/30">
                    <div className="relative w-full xl:w-[500px]">
                        <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
                        <input
                            type="text"
                            placeholder="بحث باسم العميل، الهاتف أو البريد..."
                            className="w-full pr-14 pl-6 py-4 border-none bg-white rounded-2xl shadow-sm focus:ring-4 focus:ring-primary-100 transition-all font-bold text-gray-900"
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead className="bg-slate-50 border-b border-gray-100 text-slate-700 uppercase tracking-widest font-normal print:bg-gray-100">
                            <tr>
                                <th className="px-10 py-6 text-[11px] text-primary-700 font-normal">اسم العميل</th>
                                <th className="px-10 py-6 text-[11px] text-primary-700 font-normal">رقم الهاتف</th>
                                <th className="px-10 py-6 text-[11px] text-primary-700 font-normal">البريد الإلكتروني</th>
                                <th className="px-10 py-6 text-[11px] text-center text-primary-700 font-normal">عدد الطلبات</th>
                                <th className="px-10 py-6 text-[11px] text-center text-primary-700 font-normal">حالة النشاط</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {displayCustomers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-primary-50/10 transition-colors group">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center font-normal text-lg shadow-inner group-hover:scale-110 transition-transform">
                                                {customer.name?.charAt(0) || 'C'}
                                            </div>
                                            <span className="font-normal text-gray-900 text-base block">{customer.name || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-2 text-sm font-normal text-gray-600 bg-gray-50 px-4 py-2 rounded-xl w-fit">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <span className="font-sans">{customer.phone || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-2 text-sm font-normal text-gray-400">
                                            <MailIcon className="w-4 h-4" />
                                            <span className="font-sans lowercase">{customer.email || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <div className="inline-flex items-center justify-center bg-primary-50 text-primary-700 px-6 py-2 rounded-2xl font-normal text-sm border border-primary-100">
                                            {customer.orderCount || customer.totalOrders || 0} طلب
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <span className={`inline-flex items-center gap-2 px-6 py-2 rounded-2xl text-[10px] font-normal tracking-wider shadow-sm ${(customer.status === 'نشط' || customer.status === 'active') ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                            }`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                            {customer.status || 'نشط'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {displayCustomers.length === 0 && (
                    <div className="py-40 flex flex-col items-center justify-center space-y-6">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center">
                            <Activity className="w-12 h-12 text-gray-200" />
                        </div>
                        <div className="text-center">
                            <h4 className="text-xl font-black text-gray-900">لا توجد بيانات متاحة</h4>
                            <p className="text-gray-400 font-bold">يرجى تغيير معايير البحث أو اختيار حالة أخرى</p>
                        </div>
                    </div>
                )}
            </div>

            {/* --- Professional Pagination Controls --- */}
            <div className="flex items-center justify-between bg-white px-10 py-6 rounded-[2.5rem] shadow-sm border border-gray-100 font-arabic print:hidden" dir="rtl">
                <div className="text-sm font-bold text-gray-400">
                    عرض الصفحة <span className="text-primary-700">{page}</span> من <span className="text-gray-900">{pagination.totalPages}</span> صفحات
                </div>
                <div className="flex items-center space-x-3 space-x-reverse">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-6 py-4 border-2 border-gray-50 rounded-2xl text-sm font-black text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        السابق
                    </button>

                    <div className="flex items-center space-x-2 space-x-reverse">
                        {[...Array(pagination.totalPages)].map((_, i) => {
                            const p = i + 1;
                            if (pagination.totalPages > 5 && Math.abs(p - page) > 1 && p !== 1 && p !== pagination.totalPages) {
                                if (p === 2 || p === pagination.totalPages - 1) return <span key={p} className="text-gray-300">...</span>;
                                return null;
                            }
                            return (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`w-12 h-12 flex items-center justify-center rounded-2xl text-sm font-black transition-all ${page === p 
                                        ? 'bg-primary-700 text-white shadow-lg shadow-primary-100 scale-110' 
                                        : 'hover:bg-primary-50 text-gray-400 hover:text-primary-700'
                                    }`}
                                >
                                    {p}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => setPage((p) => Math.min(pagination.totalPages || 1, p + 1))}
                        disabled={page >= (pagination.totalPages || 1)}
                        className="px-6 py-4 border-2 border-gray-50 rounded-2xl text-sm font-black text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        التالي
                    </button>
                </div>
            </div>

            <div className="text-center print:mt-10">
                <p className="text-gray-300 text-[10px] font-black uppercase tracking-[0.4em] print:text-gray-600">YEMEN NAQL LOGISTICS CENTER • STRATEGIC DATA 2026</p>
            </div>
        </div>
    );
};

export default CustomersReportPage;