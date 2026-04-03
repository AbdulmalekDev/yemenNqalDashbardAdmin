import React, { useState } from 'react';
import {
    Users,
    Search,
    FileText,
    RefreshCw,
    AlertCircle,
    Star,
    TrendingUp,
    ShieldCheck,
    Truck,
    Printer,
    FileDown,
    DollarSign,
    CheckCircle,
} from 'lucide-react';
import ReportActions from '../../components/common/ReportActions';
import { useDrivers } from '../../hooks/useDrivers';
import { getDrivers } from '../../services/driverService';
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

const DriversReportPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);

    const { data: settings } = useSettings(true);
    const dynamicLogo = settings?.system?.logo || '/assets/images/logo.png';

    const { data: response, isLoading, isError, error, refetch } = useDrivers({
        page,
        limit: 20,
        searchTerm: searchTerm,
        status: statusFilter,
        fields: 'id,name,firstName,phone,verificationStatus,isOnline,rating,completedTrips,cancelledTrips,revenue,vehicleType'
    });

    const driversData = response?.data || [];
    const pagination = response?.pagination || { total: 0, totalPages: 1 };

    const normalizeStatus = (status) => {
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

    // Removed client-side filtering; filtering is now handled on the server.
    const displayDrivers = driversData;

    const onSearchChange = (val) => {
        setSearchTerm(val);
        setPage(1);
    };

    const onFilterChange = (val) => {
        setStatusFilter(val);
        setPage(1);
    };

    const stats = [
        { label: 'إجمالي السائقين', value: response?.pagination?.total || driversData.length, icon: Users, colorClass: 'bg-blue-600' },
        { label: 'سائقين متصلين', value: driversData.filter(d => d.isOnline || d.online).length, icon: CheckCircle, colorClass: 'bg-emerald-600' },
        { label: 'إجمالي الرحلات', value: driversData.reduce((acc, d) => acc + (d.completedTrips || 0), 0), icon: Truck, colorClass: 'bg-purple-600' },
        { label: 'إجمالي الإيرادات', value: `${driversData.reduce((acc, d) => acc + (d.revenue || 0), 0).toLocaleString()} ر.ي`, icon: DollarSign, colorClass: 'bg-orange-600' },
    ];

    const exportPDF = async () => {
        try {
            const allResponse = await getDrivers({
                limit: 5000,
                searchTerm: searchTerm,
                status: statusFilter,
                fields: 'id,name,firstName,phone,verificationStatus,isOnline,rating,completedTrips,cancelledTrips,revenue,vehicleType'
            });
            const allDrivers = allResponse?.data || displayDrivers;

            const pdfMetrics = stats.map(s => ({
                label: s.label,
                value: s.value,
                bgColor: [248, 250, 252]
            }));

            await ReportService.generateReport(allDrivers, 'drivers', {
                title: "تقرير أداء السائقين الاستراتيجي",
                logoUrl: dynamicLogo,
                filename: `تقرير_السائقين_يمن_نقل_${new Date().getTime()}.pdf`,
                metrics: pdfMetrics
            });
        } catch (err) {
            console.error("PDF Export Error:", err);
            alert("حدث خطأ أثناء تصدير التقرير PDF");
        }
    };

    const exportExcel = async () => {
        try {
            const allResponse = await getDrivers({
                limit: 5000,
                searchTerm: searchTerm,
                status: statusFilter,
                fields: 'id,name,firstName,phone,identityNumber,verificationStatus,isOnline,rating,completedTrips,cancelledTrips,revenue,vehicleType'
            });
            const allDrivers = allResponse?.data || displayDrivers;

            const timestamp = new Date().getTime();
            const filename = `Drivers_Report_${timestamp}.xlsx`;

            const driverData = allDrivers.map((d, i) => [
                i + 1,
                d.name || d.firstName || '-',
                d.phone || '-',
                d.vehicleType || '-',
                d.completedTrips || 0,
                d.revenue || 0,
                (d.rating || 0).toFixed(1),
                normalizeStatus(d.verificationStatus)
            ]);

            const sheets = [{
                name: 'تقرير السائقين الشامل',
                headers: ["#", "السائق", "الهاتف", "المركبة", "المكتملة", "الإيرادات", "التقييم", "حالة التوثيق"],
                data: driverData
            }];

            ExcelReportGenerator.export({ filename, sheets });
        } catch (error) {
            console.error("Excel export error:", error);
            alert("حدث خطأ أثناء تصدير ملف الإكسيل");
        }
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-40 animate-pulse text-primary-700">
            <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-6"></div>
            <p className="font-bold tracking-widest text-sm uppercase">جاري تحليل أداء الأسطول الاستراتيجي...</p>
        </div>
    );

    if (isError) return (
        <div className="flex flex-col items-center justify-center py-20 text-red-500 bg-red-50 rounded-[2rem] border border-red-100 mx-6">
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
                    <h2 className="text-xl font-bold text-gray-900">تقرير أداء السائقين</h2>
                    <p className="text-sm font-bold text-gray-600">التاريخ: {new Date().toLocaleDateString('ar-YE')}</p>
                </div>
            </div>

            {/* --- Premium Header & Strategic Action Bar --- */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8 bg-white p-10 rounded-[3rem] shadow-sm border border-gray-50 transform hover:shadow-md transition-all print:hidden">
                <div className="flex items-center space-x-6 space-x-reverse">
                    <div className="w-20 h-20 bg-gradient-to-tr from-primary-700 to-primary-500 rounded-[2rem] shadow-xl flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-500">
                        <Users className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-gray-950 tracking-tight">تقرير السائقين</h1>
                        <p className="text-gray-500 font-bold text-base mt-1">مراقبة وتحليل أداء أسطول النقل والتوثيق</p>
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
                            placeholder="بحث باسم السائق أو الهاتف..."
                            className="w-full pr-14 pl-6 py-4 border-none bg-white rounded-2xl shadow-sm focus:ring-4 focus:ring-primary-100 transition-all font-bold text-gray-950"
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-4 w-full xl:w-auto">
                        <div className="flex items-center gap-2 bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-50">
                            <ShieldCheck className="w-5 h-5 text-gray-400" />
                            <select
                                className="border-none bg-transparent focus:ring-0 font-bold text-gray-700 min-w-[150px]"
                                value={statusFilter}
                                onChange={(e) => onFilterChange(e.target.value)}
                            >
                                <option value="all">الكل</option>
                                <option value="مقبول">مقبول</option>
                                <option value="معلق">معلق</option>
                                <option value="مرفوض">مرفوض</option>
                            </select>
                        </div>
                        <div className="bg-primary-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-primary-100 flex items-center gap-3">
                            <TrendingUp className="w-5 h-5" />
                            <span>{displayDrivers.length} سجل</span>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        {/* --- Table Header (Professional Slate Style) --- */}
                        <thead className="bg-slate-100 border-b-2 border-slate-200 text-slate-900 uppercase tracking-widest font-normal print:bg-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-right text-xs font-normal text-slate-500 uppercase">السائق</th>
                                <th className="px-6 py-4 text-center text-xs font-normal text-slate-500 uppercase">الهاتف</th>
                                <th className="px-6 py-4 text-center text-xs font-normal text-slate-500 uppercase">المركبة</th>
                                <th className="px-6 py-4 text-center text-xs font-normal text-slate-500 uppercase">المكتملة</th>
                                <th className="px-6 py-4 text-right text-xs font-normal text-slate-500 uppercase">الإيرادات</th>
                                <th className="px-6 py-4 text-center text-xs font-normal text-slate-500 uppercase">التقييم</th>

                                <th className="px-10 py-6 text-[11px] min-w-[150px] text-center whitespace-nowrap">حالة التوثيق</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {displayDrivers.map((driver) => (
                                <tr key={driver.id} className="hover:bg-primary-50/10 transition-colors group">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center font-normal text-lg shadow-inner group-hover:scale-110 transition-transform">
                                                {driver.name?.charAt(0) || driver.firstName?.charAt(0) || 'D'}
                                            </div>
                                            <div>
                                                <p className="font-normal text-slate-900">{driver.name || driver.firstName || '-'}</p>
                                                <p className="text-[10px] text-slate-400 font-normal">رقم: {String(driver.id).slice(-6)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-sm font-normal text-gray-900 font-sans tracking-tight text-center">{driver.phone || '-'}</td>
                                    <td className="px-10 py-8 text-center">
                                        <span className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-normal text-gray-700 uppercase border border-gray-200">
                                            {driver.vehicleType || '-'}
                                        </span>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-800 font-normal text-sm border border-green-200">
                                            {driver.completedTrips || 0}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <span className="text-sm text-slate-700 font-normal">{(driver.revenue || 0).toLocaleString()} ر.ي</span>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <div className="flex items-center justify-center gap-1.5 bg-amber-100 py-2 px-4 rounded-2xl border border-amber-200 w-fit mx-auto shadow-sm">
                                            <Star className="w-4 h-4 text-amber-600 fill-current" />
                                            <span className="text-sm font-normal text-amber-800">{(driver.rating || 0).toFixed(1)}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-2xl text-[11px] font-normal tracking-wider shadow-md border-b-2 ${normalizeStatus(driver.verificationStatus) === 'مقبول' ? 'bg-green-600 text-white border-green-700' :
                                            normalizeStatus(driver.verificationStatus) === 'مرفوض' ? 'bg-red-600 text-white border-red-700' :
                                                'bg-amber-500 text-white border-amber-600'
                                            }`}>
                                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                            {normalizeStatus(driver.verificationStatus)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {displayDrivers.length === 0 && (
                    <div className="py-40 flex flex-col items-center justify-center space-y-6">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center shadow-inner">
                            <Users className="w-12 h-12 text-gray-200" />
                        </div>
                        <div className="text-center">
                            <h4 className="text-xl font-black text-gray-950">لا توجد بيانات متاحة</h4>
                            <p className="text-gray-400 font-bold">يرجى تغيير معايير البحث أو اختيار حالة أخرى</p>
                        </div>
                    </div>
                )}
            </div>

            {/* --- Professional Pagination Controls --- */}
            <div className="flex items-center justify-between bg-white px-10 py-6 rounded-[2.5rem] shadow-sm border border-gray-100 font-arabic print:hidden" dir="rtl">
                <div className="text-sm font-bold text-gray-400">
                    عرض الصفحة <span className="text-primary-700">{page}</span> من <span className="text-gray-950">{pagination.totalPages}</span> صفحات
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

export default DriversReportPage;
