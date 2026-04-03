import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Download,
  Calendar,
  Truck,
  Package,
  CreditCard,
  BarChart3,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import ReportActions from '../../components/common/ReportActions';
import { useRevenueStats, useRevenueSSE } from '../../hooks/useRevenues';
import ReportService from '../../services/ReportService';
import ExcelReportGenerator from '../../utils/ExcelReportGenerator';
import { useSettings } from '../../hooks/useSettings';

const RevenuesPage = () => {
  const { data: revenueData, isLoading, isError, error, refetch } = useRevenueStats();
  const { data: settings } = useSettings(true);
  const [selectedPeriod, setSelectedPeriod] = useState('هذا الشهر');

  // تفعيل SSE للتحديثات الفورية
  useRevenueSSE();

  const onExportPDF = async () => {
    try {
      const { monthlyData = [] } = revenueData || {};
      const dynamicLogo = settings?.system?.logo || '/assets/images/logo.png';

      await ReportService.generateReport(monthlyData, 'revenue', {
        title: "تقرير الإيرادات والأرباح المالية",
        logoUrl: dynamicLogo,
        filename: `Revenue_Report_${new Date().getTime()}.pdf`
      });
    } catch (err) {
      console.error(err);
      alert("فشل تصدير تقرير PDF");
    }
  };

  const onExportExcel = () => {
    try {
      const { monthlyData = [] } = revenueData || {};
      const timestamp = new Date().getTime();
      const filename = `Financial_Revenue_${timestamp}.xlsx`;

      const excelData = monthlyData.map((data, index) => {
        const avgOrderValue = data.orders > 0 ? Math.round(data.revenue / data.orders) : 0;
        const growth = index > 0 && monthlyData[index - 1].revenue > 0
          ? ((data.revenue - monthlyData[index - 1].revenue) / monthlyData[index - 1].revenue * 100).toFixed(1)
          : 0;

        return [
          data.month,
          data.revenue,
          data.orders,
          avgOrderValue,
          `${growth}%`
        ];
      });

      const sheets = [
        {
          name: 'تقرير الأرباح',
          headers: ["الشهر", "الإيرادات", "عدد الطلبات", "متوسط الطلب", "النمو"],
          data: excelData
        }
      ];

      ExcelReportGenerator.export({ filename, sheets });
    } catch (e) {
      alert("فشل تصدير ملف Excel");
    }
  };

  // ملفات تعريف الطباعة لتحسين شكل التقرير
  const printStyles = `
    @media print {
      body {
        direction: rtl;
        font-family: 'Inter', 'Roboto', sans-serif;
        background: white !important;
      }
      .no-print, 
      button, 
      select, 
      nav, 
      aside {
        display: none !important;
      }
      .bg-gradient-to-r {
        background: #f3f4f6 !important;
        color: black !important;
        border: 1px solid #e5e7eb !important;
      }
      .text-white {
        color: black !important;
      }
      .text-green-100, .text-blue-100, .text-purple-100, .text-orange-100 {
        color: #4b5563 !important;
      }
      .shadow-lg {
        shadow: none !important;
        border: 1px solid #e5e7eb !important;
      }
      tr {
        page-break-inside: avoid;
      }
      @page {
        margin: 2cm;
      }
    }
  `;

  // حالة التحميل
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل بيانات الإيرادات...</p>
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

  const {
    todayRevenue = 0,
    weekRevenue = 0,
    monthRevenue = 0,
    completedOrders = 0,
    weeklyData = [],
    monthlyData = [],
    topDrivers = [],
  } = revenueData || {};

  return (
    <div className="space-y-6">
      <style>{printStyles}</style>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 space-x-reverse">
          <DollarSign className="w-8 h-8 text-primary-700" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة الأرباح</h1>
            <p className="text-gray-600">مراقبة وإدارة إيرادات النظام المالية</p>
          </div>
        </div>
        
        <ReportActions 
          onRefresh={refetch}
          isLoading={isLoading}
        />
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">إيرادات اليوم</p>
              <p className="text-2xl font-bold mt-2">{todayRevenue.toLocaleString()} ريال</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 ml-1" />
                <span className="text-sm">تحديث فوري</span>
              </div>
            </div>
            <DollarSign className="w-10 h-10 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">إيرادات هذا الأسبوع</p>
              <p className="text-2xl font-bold mt-2">{weekRevenue.toLocaleString()} ريال</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 ml-1" />
                <span className="text-sm">آخر 7 أيام</span>
              </div>
            </div>
            <Calendar className="w-10 h-10 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">إيرادات هذا الشهر</p>
              <p className="text-2xl font-bold mt-2">{monthRevenue.toLocaleString()} ريال</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 ml-1" />
                <span className="text-sm">آخر 30 يوم</span>
              </div>
            </div>
            <BarChart3 className="w-10 h-10 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">إجمالي الطلبات المكتملة</p>
              <p className="text-2xl font-bold mt-2">{completedOrders}</p>
              <div className="flex items-center mt-2">
                <Package className="w-4 h-4 ml-1" />
                <span className="text-sm">إجمالي</span>
              </div>
            </div>
            <Package className="w-10 h-10 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Revenue Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">الأرباح الأسبوعية</h3>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option>هذا الشهر</option>
              <option>الشهر الماضي</option>
              <option>آخر 3 شهور</option>
            </select>
          </div>

          {weeklyData.length > 0 ? (
            <>
              <div className="h-64 flex items-end space-x-4 space-x-reverse">
                {weeklyData.map((data, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="bg-gradient-to-t from-green-500 to-green-400 rounded-t w-full transition-all duration-500"
                      style={{
                        height: `${Math.max((data.revenue / Math.max(...weeklyData.map(d => d.revenue || 1))) * 180, 20)}px`,
                      }}
                      title={`${data.week}: ${data.revenue.toLocaleString()} ريال`}
                    ></div>
                    <span className="text-xs text-gray-500 mt-2 text-center">{data.week}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  إجمالي الأرباح: {weeklyData.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()} ريال
                </p>
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              لا توجد بيانات أسبوعية
            </div>
          )}
        </div>

        {/* Top Drivers */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6">أفضل السائقين في الأرباح</h3>

          {topDrivers.length > 0 ? (
            <div className="space-y-4">
              {topDrivers.map((driver, index) => (
                <div key={driver.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-500' : 'bg-gray-300'
                      }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{driver.name}</p>
                      <p className="text-sm text-gray-600">{driver.orders} طلب</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-green-600">{driver.earnings.toLocaleString()} ريال</p>
                    <p className="text-xs text-gray-500">إجمالي</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Truck className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>لا توجد بيانات سائقين</p>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Revenue Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">الأرباح الشهرية التفصيلية</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">الشهر</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">إجمالي الإيرادات</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">عدد الطلبات</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">متوسط قيمة الطلب</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">معدل النمو</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {monthlyData.length > 0 ? (
                monthlyData.map((data, index) => {
                  const avgOrderValue = data.orders > 0 ? Math.round(data.revenue / data.orders) : 0;
                  const growth = index > 0 && monthlyData[index - 1].revenue > 0
                    ? ((data.revenue - monthlyData[index - 1].revenue) / monthlyData[index - 1].revenue * 100).toFixed(1)
                    : 0;

                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{data.month}</td>
                      <td className="px-6 py-4 text-gray-900 font-bold">{data.revenue.toLocaleString()} ريال</td>
                      <td className="px-6 py-4 text-gray-600">{data.orders} طلب</td>
                      <td className="px-6 py-4 text-gray-600">{avgOrderValue.toLocaleString()} ريال</td>
                      <td className="px-6 py-4">
                        {index > 0 ? (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${parseFloat(growth) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {parseFloat(growth) > 0 ? '+' : ''}{growth}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">لا توجد بيانات شهرية</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Commission Summary */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6">ملخص العمولات</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <CreditCard className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <p className="text-2xl font-bold text-blue-700">
              {Math.round(monthRevenue * 0.15).toLocaleString()} ريال
            </p>
            <p className="text-sm text-blue-600 mt-1">عمولة المنصة (15%)</p>
          </div>

          <div className="text-center p-6 bg-green-50 rounded-lg">
            <Truck className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <p className="text-2xl font-bold text-green-700">
              {Math.round(monthRevenue * 0.85).toLocaleString()} ريال
            </p>
            <p className="text-sm text-green-600 mt-1">مدفوعات السائقين (85%)</p>
          </div>

          <div className="text-center p-6 bg-purple-50 rounded-lg">
            <DollarSign className="w-12 h-12 text-purple-600 mx-auto mb-3" />
            <p className="text-2xl font-bold text-purple-700">
              {Math.round(monthRevenue * 0.05).toLocaleString()} ريال
            </p>
            <p className="text-sm text-purple-600 mt-1">صافي ربح المنصة</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenuesPage;