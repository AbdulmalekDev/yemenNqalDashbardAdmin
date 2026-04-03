import React from 'react';
import { FileDown, FileText, Printer, RefreshCw } from 'lucide-react';

/**
 * ReportActions Component
 * Standardized action bar for all report pages.
 */
const ReportActions = ({ 
  onExportExcel, 
  onExportPDF, 
  onPrint = () => window.print(), 
  onRefresh,
  isLoading = false 
}) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 bg-white/50 p-2 rounded-full border border-gray-100 shadow-sm backdrop-blur-sm print:hidden">
      
      {/* Excel Button - Green */}
      {onExportExcel && (
        <button
          onClick={onExportExcel}
          disabled={isLoading}
          className="flex items-center gap-2 bg-[#22c55e] hover:bg-[#1ca850] text-white px-6 py-2.5 rounded-full font-black text-sm transition-all shadow-md hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
          title="تصدير إلى Excel"
        >
          <FileDown className="w-4 h-4" />
          <span>Excel</span>
        </button>
      )}

      {/* PDF Button - Red */}
      {onExportPDF && (
        <button
          onClick={onExportPDF}
          disabled={isLoading}
          className="flex items-center gap-2 bg-[#ef4444] hover:bg-[#dc2626] text-white px-6 py-2.5 rounded-full font-black text-sm transition-all shadow-md hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
          title="تصدير إلى PDF"
        >
          <FileText className="w-4 h-4" />
          <span>PDF</span>
        </button>
      )}

      {/* Print Button - Orange */}
      {onPrint && (
        <button
          onClick={onPrint}
          disabled={isLoading}
          className="flex items-center gap-2 bg-[#f97316] hover:bg-[#ea580c] text-white px-6 py-2.5 rounded-full font-black text-sm transition-all shadow-md hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
          title="طباعة التقرير"
        >
          <Printer className="w-4 h-4" />
          <span>Print</span>
        </button>
      )}

      {/* Refresh Button (Optional) */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2.5 text-gray-400 hover:text-primary-600 hover:bg-white rounded-full transition-all border border-transparent hover:border-gray-100 hover:shadow-sm active:rotate-180 duration-500 disabled:opacity-50"
          title="تحديث البيانات"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
};

export default ReportActions;
