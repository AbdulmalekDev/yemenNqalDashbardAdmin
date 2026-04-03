import * as XLSX from 'xlsx';

/**
 * Professional Excel Report Generator for Yemen Naql
 * Powered by xlsx library
 */
class ExcelReportGenerator {
    /**
     * Export data to an Excel file with proper formatting and multiple sheets
     * @param {Object} options - Configuration options
     * @param {string} options.filename - The name of the file to save
     * @param {Array} options.sheets - Array of sheet objects { name: 'SheetName', data: [[]], headers: [] }
     */
    export(options) {
        const { filename, sheets } = options;
        
        // 1. Create a new workbook
        const wb = XLSX.utils.book_new();
        
        sheets.forEach(sheet => {
            // 2. Prepare data with headers
            const fullData = [sheet.headers, ...sheet.data];
            
            // 3. Create worksheet from data
            const ws = XLSX.utils.aoa_to_sheet(fullData);
            
            // 4. Basic RTL configuration (Best effort in standard xlsx)
            // Note: Native Excel RTL is a workbook/worksheet property bit, 
            // but standard 'xlsx' library support for UI RTL is limited without Pro.
            // However, we ensure Arabic characters are preserved correctly.
            
            // 5. Column width auto-sizing (Basic)
            const colWidths = sheet.headers.map((h, i) => {
                const maxLen = Math.max(
                    String(h).length,
                    ...sheet.data.map(row => String(row[i] || '').length)
                );
                return { wch: maxLen + 5 };
            });
            ws['!cols'] = colWidths;

            // 6. Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, sheet.name);
        });

        // 7. Write and save
        XLSX.writeFile(wb, filename);
    }

    /**
     * Quickly export a single array of objects to Excel
     * @param {Array} data - Array of objects
     * @param {string} filename - Filename
     * @param {string} sheetName - Name of the sheet
     */
    exportSimple(data, filename, sheetName = 'Data') {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, filename);
    }
}

export default new ExcelReportGenerator();
