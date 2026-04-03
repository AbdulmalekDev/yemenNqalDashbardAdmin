import React from 'react';
import {
    BarChart3,
    TrendingUp,
    Users,
    Truck,
    Package,
    DollarSign,
    Star,
    CheckCircle,
    AlertCircle,
    FileText,
    Activity,
    Download,
    Printer,
    UserCheck,
} from 'lucide-react';
import ReportActions from '../../components/common/ReportActions';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    YAxis,
    XAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';
import { useReports } from '../../hooks/useReports';
import { useSettings } from '../../hooks/useSettings';
import ReportService from '../../services/ReportService';
import ExcelReportGenerator from '../../utils/ExcelReportGenerator';
import { Link } from 'react-router-dom';

// --- Premium Stat Card (Top Row) ---
const TopStatCard = ({ label, value, icon: Icon, colorClass, subValue }) => (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
        <div className="flex items-center space-x-6 space-x-reverse">
            <div className={`p-5 rounded-3xl ${colorClass} bg-opacity-10 shadow-sm transition-all group-hover:scale-110 group-hover:rotate-3`}>
                <Icon className={`w-8 h-8 ${colorClass.replace('bg-', 'text-')}`} />
            </div>
            <div>
                <p className="text-gray-400 text-[10px] font-normal uppercase tracking-widest mb-1">{label}</p>
                <h4 className="text-2xl font-normal text-gray-950 tracking-tighter">{value}</h4>
                {subValue && <p className="text-[10px] text-primary-600 font-normal mt-1 bg-primary-50 w-fit px-2 py-0.5 rounded-full">{subValue}</p>}
            </div>
        </div>
    </div>
);

// --- KPI Indicator (Bottom Row) ---
const KPIIndicator = ({ label, value, icon: Icon, borderColor }) => (
    <div className="flex flex-col items-center justify-center p-10 bg-white rounded-[3rem] border-t-8 shadow-sm group hover:shadow-2xl transition-all duration-500 overflow-hidden relative" style={{ borderTopColor: borderColor }}>
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-gray-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
        <div className="p-5 rounded-[1.5rem] mb-6 relative z-10" style={{ backgroundColor: `${borderColor}15` }}>
            <Icon className="w-8 h-8" style={{ color: borderColor }} />
        </div>
        <p className="text-4xl font-normal text-gray-950 mb-2 relative z-10 tracking-tighter">{value}</p>
        <p className="text-[11px] text-gray-400 font-normal uppercase tracking-[0.2em] relative z-10">{label}</p>
    </div>
);

const STATUS_LABELS = {
    completed: 'مكتمل',
    cancelled: 'ملغي',
    in_progress: 'جاري',
    no_driver: 'بانتظار سائق',
    searching: 'جاري البحث',
    accepted: 'تم القبول',
    rated: 'تم التقييم'
};

const STATUS_COLORS = {
    completed: '#10b981',
    cancelled: '#ef4444',
    in_progress: '#f59e0b',
    no_driver: '#6B7280',
    searching: '#3b82f6',
    accepted: '#8B5CF6'
};

const PieChartIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
        <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
    </svg>
);

const ReportsPage = () => {
    const { data: reports, isLoading: reportsLoading, isError, error, refetch } = useReports();
    const { data: settings } = useSettings(true);

    const isLoading = reportsLoading;
    const dynamicLogo = settings?.system?.logo || '/assets/images/logo.png';

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] animate-pulse">
            <div className="w-20 h-20 border-8 border-primary-50 border-t-primary-600 rounded-full animate-spin mb-8 shadow-2xl"></div>
            <p className="text-primary-700 font-black tracking-[0.3em] uppercase italic text-sm">جاري تحليل البيانات الاستراتيجية لمركز يمن نقل...</p>
        </div>
    );

    if (isError) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-12 bg-red-50 rounded-[3rem] border border-red-100 mx-6 shadow-2xl">
            <AlertCircle className="w-24 h-24 text-red-500 mb-6 animate-bounce" />
            <h3 className="text-3xl font-black text-gray-950 mb-3 tracking-tighter">فشل المزامنة مع مركز البيانات</h3>
            <p className="text-gray-500 font-bold mb-10 max-w-lg mx-auto">تعذر جلب التقارير اللوجستية حالياً. يرجى التحقق من اتصال الشبكة وإعادة المحاولة.</p>
            <button onClick={() => refetch()} className="px-12 py-5 bg-red-600 text-white rounded-[2rem] hover:bg-red-700 transition-all font-black shadow-xl hover:-translate-y-1 active:scale-95">إعادة محاولة الاتصال</button>
        </div>
    );

    const {
        summary = {},
        ordersByStatus = {},
        monthlyTrends = [],
        driverPerformance = [],
        customerActivity = {},
    } = reports || {};

    const horizontalChartData = Object.entries(ordersByStatus).map(([status, count]) => ({
        name: STATUS_LABELS[status] || status,
        value: count,
        color: STATUS_COLORS[status] || '#cbd5e1'
    })).sort((a, b) => b.value - a.value);

    const exportPDF = async () => {
        try {
            const summaryData = [
                { label: "إجمالي العملاء", value: summary.totalCustomers },
                { label: "إجمالي السائقين", value: summary.totalDrivers },
                { label: "إجمالي الطلبات", value: summary.totalOrders },
                { label: "إجمالي الإيرادات", value: `${(summary.totalRevenue || 0).toLocaleString()} ر.ي` },
                { label: "متوسط قيمة الطلب", value: `${(summary.avgOrderValue || 0).toLocaleString()} ر.ي` },
                { label: "---", value: "---" },
                ...Object.entries(ordersByStatus).map(([status, count]) => ({
                    label: `طلبات (${STATUS_LABELS[status] || status})`,
                    value: count
                }))
            ];

            await ReportService.generateReport(summaryData, 'summary', {
                title: "التقرير الاستراتيجي الشامل للنظام",
                logoUrl: dynamicLogo,
                filename: `YemenNaql_Global_Summary_${new Date().getTime()}.pdf`
            });
        } catch (err) {
            console.error(err);
            alert("فشل تصدير التقرير الشامل");
        }
    };

    const exportExcel = () => {
        try {
            const timestamp = new Date().getTime();
            const filename = `Strategic_Overview_${timestamp}.xlsx`;
            const sheets = [
                {
                    name: 'الملخص الاستراتيجي',
                    headers: ["المعيار الرقمي", "القيمة الإحصائية"],
                    data: [
                        ["إجمالي العملاء", summary.totalCustomers],
                        ["إجمالي السائقين", summary.totalDrivers],
                        ["صافي الإيرادات", summary.totalRevenue],
                        ["إجمالي الطلبات", summary.totalOrders],
                        ["معدل التقييم العام", summary.avgDriverRating || 4.8]
                    ]
                },
                {
                    name: 'تحليلات السائقين',
                    headers: ["السائق", "الهاتف", "إجمالي الطلبات", "المكتملة", "صافي الربح", "التقييم"],
                    data: driverPerformance.map(d => [d.name, d.phone, d.totalOrders, d.completedOrders, d.revenue, d.rating])
                }
            ];
            ExcelReportGenerator.export({ filename, sheets });
        } catch (e) {
            alert("فشل تصدير ملف Excel");
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-1000 pb-20 font-arabic print:space-y-6 print:pb-0" dir="rtl">
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
                    <h2 className="text-xl font-bold text-gray-900">الملخص الاستراتيجي العام</h2>
                    <p className="text-sm font-bold text-gray-600">التاريخ: {new Date().toLocaleDateString('ar-YE')}</p>
                </div>
            </div>

            {/* --- Premium Header & Strategic Toolbar --- */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-10 bg-white p-12 rounded-[3.5rem] shadow-2xl border border-gray-50 transform hover:shadow-primary-100/20 transition-all duration-700 overflow-hidden relative group print:hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600 opacity-[0.02] rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>

                <div className="flex items-center space-x-8 space-x-reverse relative z-10">
                    <div className="w-24 h-24 bg-gradient-to-tr from-primary-700 to-primary-500 rounded-[2.5rem] shadow-[0_20px_40px_-10px_rgba(245,158,11,0.3)] flex items-center justify-center transform hover:rotate-6 transition-transform duration-500">
                        <BarChart3 className="w-12 h-12 text-white" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-normal text-gray-950 tracking-tighter mb-2">التقارير والتحليلات</h1>
                        <p className="text-gray-400 font-normal text-lg leading-relaxed">رؤية استراتيجية شاملة لأداء النظام والعمليات التشغيلية</p>
                    </div>
                </div>


                <ReportActions
                    onExportExcel={exportExcel}
                    onExportPDF={exportPDF}
                    onRefresh={refetch}
                    isLoading={isLoading}
                />
            </div>

            {/* --- Strategic Navigator --- */}
            <div className="flex flex-wrap items-center gap-4 bg-white/50 p-4 rounded-3xl border border-dashed border-gray-200 print:hidden">
                <span className="text-xs font-normal text-gray-400 px-4">انتقال سريع:</span>
                <Link to="/reports" className="px-6 py-2 bg-primary-700 text-white rounded-full text-xs font-normal shadow-lg shadow-primary-100">اللوحة الرئيسية</Link>
                <Link to="/reports/orders" className="px-6 py-2 bg-white text-gray-600 hover:bg-gray-50 rounded-full text-xs font-normal border border-gray-100 transition-all">تقرير الطلبات</Link>
                <Link to="/reports/drivers" className="px-6 py-2 bg-white text-gray-600 hover:bg-gray-50 rounded-full text-xs font-normal border border-gray-100 transition-all">تقرير السائقين</Link>
                <Link to="/reports/customers" className="px-6 py-2 bg-white text-gray-600 hover:bg-gray-50 rounded-full text-xs font-normal border border-gray-100 transition-all">تقرير العملاء</Link>
                <Link to="/reports/roles" className="px-6 py-2 bg-white text-gray-600 hover:bg-gray-50 rounded-full text-xs font-normal border border-gray-100 transition-all">تقرير الإداريين</Link>
            </div>

            {/* --- Premium Stats Row --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 print:grid-cols-4 print:gap-4 font-bold">
                <TopStatCard label="إجمالي العملاء" value={summary.totalCustomers || 0} subValue={`${customerActivity.activeCustomers || 0} نشط`} icon={Users} colorClass="bg-orange-500" />
                <TopStatCard label="إجمالي السائقين" value={summary.totalDrivers || 0} subValue={`${summary.verifiedDrivers || 0} موثّق`} icon={Truck} colorClass="bg-purple-600" />
                <TopStatCard label="إجمالي الإيرادات" value={`${(summary.totalRevenue || 0).toLocaleString()} ريال`} icon={DollarSign} colorClass="bg-emerald-600" />
                <TopStatCard label="إجمالي الطلبات" value={summary.totalOrders || 0} icon={Package} colorClass="bg-blue-600" />
            </div>

            {/* --- Visual Analysis Section (Charts) --- */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 print:grid-cols-1 print:gap-6">

                {/* 1. Monthly Trends Bar Chart */}
                <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-gray-50 flex flex-col group hover:shadow-xl transition-all duration-700">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h3 className="text-2xl font-black text-gray-950 tracking-tighter">الاتجاهات الشهرية</h3>
                            <p className="text-gray-400 text-xs font-bold uppercase mt-1 tracking-widest leading-loose">تحليل الإيرادات والطلبات للـ 6 أشهر الماضية</p>
                        </div>
                        <div className="p-5 bg-blue-50 rounded-3xl group-hover:rotate-12 transition-transform">
                            <Activity className="text-blue-600 w-8 h-8" />
                        </div>
                    </div>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyTrends}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="month" axisLine={{ stroke: '#cbd5e1' }} tickLine={false} tick={{ fill: '#475569', fontSize: 12, fontWeight: 900 }} dy={15} />
                                <YAxis axisLine={{ stroke: '#cbd5e1' }} tickLine={false} tick={{ fill: '#475569', fontSize: 12, fontWeight: 900 }} tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v} />
                                <Tooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{ borderRadius: '2rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', padding: '20px' }}
                                    itemStyle={{ fontWeight: 900, color: '#0EA5E9' }}
                                />
                                <Bar dataKey="revenue" radius={[15, 15, 0, 0]} barSize={45}>
                                    {monthlyTrends.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill="#3b82f6" fillOpacity={index === monthlyTrends.length - 1 ? 1 : 0.75} className="hover:opacity-100 transition-opacity duration-300" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-10 text-center border-t border-gray-50 pt-8">
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.5em] mb-3 block italic">Total Strategic Value</span>
                        <h4 className="text-3xl font-black text-primary-700 tracking-tighter">{(summary.totalRevenue || 0).toLocaleString()} <span className="text-lg">ريال</span></h4>
                    </div>
                </div>

                {/* 2. Order Distribution Horizontal Chart */}
                <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-gray-50 group hover:shadow-xl transition-all duration-700">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h3 className="text-2xl font-black text-gray-950 tracking-tighter">توزيع الطلبات حسب الحالة</h3>
                            <p className="text-gray-400 text-xs font-bold uppercase mt-1 tracking-widest leading-loose">تحليل الكفاءة التنفيذية للعمليات</p>
                        </div>
                        <div className="p-5 bg-emerald-50 rounded-3xl group-hover:rotate-12 transition-transform">
                            <PieChartIcon className="text-emerald-600 w-8 h-8" />
                        </div>
                    </div>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={horizontalChartData} margin={{ left: 60, right: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={{ stroke: '#cbd5e1' }} tickLine={false} tick={{ fill: '#1e293b', fontSize: 14, fontWeight: 900 }} width={140} />
                                <Tooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="value" radius={[0, 25, 25, 0]} barSize={35} label={{ position: 'right', fill: '#1e293b', fontSize: 13, fontWeight: 900 }}>
                                    {horizontalChartData.map((entry, index) => (
                                        <Cell key={`cell-h-${index}`} fill={entry.color} fillOpacity={1} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* --- Lower KPI Indicators (Executive Summary) --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 print:grid-cols-4 print:gap-4 mt-10">
                <KPIIndicator label="عملاء نشطون" value={customerActivity.activeCustomers || 0} icon={UserCheck} borderColor="#f97316" />
                <KPIIndicator label="سائقون متصلون الآن" value={summary.activeDrivers || 0} icon={Truck} borderColor="#8b5cf6" />
                <KPIIndicator label="معدل إتمام الطلبات" value={`${Math.round(((summary.totalOrders - (ordersByStatus.cancelled || 0)) / (summary.totalOrders || 1)) * 100)}%`} icon={CheckCircle} borderColor="#10b981" />
                <KPIIndicator label="متوسط قيمة الطلب" value={`${Math.round(summary.avgOrderValue || 0).toLocaleString()} ريال`} icon={TrendingUp} borderColor="#3b82f6" />
            </div>

            {/* --- Lower KPI Indicators (Executive Summary) --- */}


            <div className="text-center mt-10 print:mt-20">
                <p className="text-gray-300 text-[10px] font-black uppercase tracking-[0.5em] italic print:text-gray-600">YEMEN NAQL DATA HUB • OPERATIONAL EXCELLENCE PLATFORM v2.5 • STRATEGIC INTELLIGENCE</p>
            </div>
        </div>
    );
};

export default ReportsPage;
