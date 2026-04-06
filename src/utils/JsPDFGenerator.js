import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import arabicReshaper from 'arabic-persian-reshaper';
import bidiFactory from 'bidi-js';

/**
 * JsPDFGenerator: Professional Arabic PDF Generator for Yemen Naql
 * 
 * Features:
 *   1. Full RTL Support (Character joining via arabic-reshaper + RTL reordering via bidi-js)
 *   2. Support for Custom Arabic Fonts (Tajawal)
 *   3. jspdf-autotable integration for professional table layout
 *   4. Branding (Header, Logo, Footer, Page Numbers)
 */
class JsPDFGenerator {
    constructor() {
        this.doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
            putOnlyUsedFonts: true
        });

        this._bidi = bidiFactory();
        this.fontName = 'Tajawal';
        this.isFontRegistered = false;
    }

    /**
     * Reshapes and reorders Arabic text for proper rendering in jsPDF
     */
    fixArabic(text) {
        if (!text) return "";
        const str = String(text).trim();
        if (!str) return "";

        try {
            // 1. Reshape: connect letters (e.g., ع م ر -> عمر)
            const reshaped = arabicReshaper.reshape(str);

            // 2. Bidi: reorder characters for RTL rendering
            const bidiLevels = this._bidi.getEmbeddingLevels(reshaped, 'rtl');
            const visual = this._bidi.getReorderedString(reshaped, bidiLevels);

            return visual;
        } catch (error) {
            console.error("Arabic shaping error:", error);
            return str;
        }
    }

    /**
     * Registers the custom Arabic font from Base64
     */
    async registerFont(base64Data, name = 'Tajawal', style = 'normal') {
        if (!base64Data) {
            console.warn(`Font data missing for ${name}`);
            return;
        }

        const filename = `${name}-${style}.ttf`;
        this.doc.addFileToVFS(filename, base64Data);
        this.doc.addFont(filename, name, style);
        this.isFontRegistered = true;
    }

    /**
     * Headers with branding (Logo, Name, Date)
     */
    addHeader(title, logoUrl = '/assets/images/logo.png', stats = null) {
        const pageWidth = this.doc.internal.pageSize.getWidth();

        // Background branding
        this.doc.setFillColor(248, 250, 252); // slate-50
        this.doc.rect(0, 0, pageWidth, 45, 'F');

        // System Name & Logo
        this.doc.setFont(this.fontName, 'bold');
        this.doc.setTextColor(15, 23, 42); // slate-900
        this.doc.setFontSize(16);
        this.doc.text(this.fixArabic("نظام يمن نقل - Yemen Naql"), pageWidth - 15, 15, { align: 'right' });

        this.doc.setFontSize(10);
        this.doc.setTextColor(100, 116, 139); // slate-500
        this.doc.text(this.fixArabic("لوحة التحكم - التقارير الإحصائية"), pageWidth - 15, 22, { align: 'right' });

        // Report Title
        this.doc.setFontSize(18);
        this.doc.setTextColor(37, 99, 235); // blue-600
        this.doc.text(this.fixArabic(title), pageWidth / 2, 35, { align: 'center' });

        // Date & Metadata
        this.doc.setFontSize(9);
        this.doc.setTextColor(100, 116, 139);
        const dateStr = new Date().toLocaleDateString('ar-YE', { year: 'numeric', month: 'long', day: 'numeric' });
        this.doc.text(this.fixArabic(`تاريخ الاستخراج: ${dateStr}`), 15, 15);
        this.doc.text(this.fixArabic(`المصدر: نظام الإدارة الذكية`), 15, 22);

        // Underline
        this.doc.setDrawColor(226, 232, 240); // slate-200
        this.doc.line(15, 45, pageWidth - 15, 45);

        return 45; // Returns the height used
    }

    /**
     * Summary Section (Cards layout)
     */
    addSummary(metrics = []) {
        const pageWidth = this.doc.internal.pageSize.getWidth();
        const startY = 55;

        this.doc.setFont(this.fontName, 'bold');
        this.doc.setFontSize(12);
        this.doc.setTextColor(15, 23, 42);
        this.doc.text(this.fixArabic("ملخص التقرير البيانات"), pageWidth - 15, startY, { align: 'right' });

        // Draw boxes for metrics
        const cardWidth = (pageWidth - 40) / metrics.length;
        metrics.forEach((m, i) => {
            const x = 15 + (i * cardWidth);
            const y = startY + 5;

            this.doc.setDrawColor(241, 245, 249);
            this.doc.setFillColor(255, 255, 255);
            this.doc.roundedRect(x, y, cardWidth - 5, 20, 2, 2, 'FD');

            this.doc.setFontSize(8);
            this.doc.setTextColor(100, 116, 139);
            this.doc.text(this.fixArabic(m.label), x + (cardWidth / 2) - 2.5, y + 6, { align: 'center' });

            this.doc.setFontSize(11);
            this.doc.setTextColor(30, 41, 59);
            this.doc.text(this.fixArabic(String(m.value)), x + (cardWidth / 2) - 2.5, y + 14, { align: 'center' });
        });

        return startY + 30;
    }

    /**
     * Table Generation with RTL support and word-wrap
     */
    addTable(headers, data, startY) {
        // Reverse headers for RTL display in AutoTable
        const reversedHeaders = [...headers].reverse().map(h => this.fixArabic(h));

        // Reverse each data row
        const reversedData = data.map(row =>
            [...row].reverse().map(cell => this.fixArabic(cell))
        );

        this.doc.autoTable({
            startY: startY + 10,
            head: [reversedHeaders],
            body: reversedData,
            styles: {
                font: this.fontName,
                fontSize: 9,
                halign: 'right', // Align text to right
                textColor: [51, 65, 85],
                cellPadding: 4,
            },
            headStyles: {
                fillColor: [15, 23, 42], // slate-900
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center'
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252] // slate-50
            },
            margin: { left: 15, right: 15 },
            didDrawPage: (data) => {
                // Footer: Page numbers
                const pageWidth = this.doc.internal.pageSize.getWidth();
                const pageHeight = this.doc.internal.pageSize.getHeight();

                this.doc.setFontSize(8);
                this.doc.setTextColor(148, 163, 184);
                const str = this.fixArabic(`صفحة ${data.pageNumber} من ${this.doc.internal.getNumberOfPages()}`);
                this.doc.text(str, pageWidth / 2, pageHeight - 10, { align: 'center' });

                const rights = this.fixArabic("جميع الحقوق محفوظة © يمن نقل - 2026");
                this.doc.text(rights, pageWidth - 15, pageHeight - 10, { align: 'right' });
            }
        });
    }

    /**
     * Launch the PDF generation and download
     */
    save(filename = 'Yemen-Naql-Report.pdf') {
        const safeName = filename.endsWith('.pdf') ? filename : filename + '.pdf';
        this.doc.save(safeName);
    }
}

export default new JsPDFGenerator();
