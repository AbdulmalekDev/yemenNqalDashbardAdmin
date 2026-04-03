import pdfMake from "pdfmake/build/pdfmake";
import { loadArabicFonts } from './pdfFonts';
import bidiFactory from 'bidi-js';

/**
 * Professional Arabic PDF Report Generator for Yemen Naql System
 * 
 * Strategy:
 *   1. Use full Amiri fonts (loaded dynamically) — no subsetted fonts
 *   2. DO NOT use arabic-persian-reshaper — pdfmake's fontkit handles Arabic shaping natively
 *   3. Only use bidi-js for logical→visual reordering (word/sentence order)
 *   4. RTL layout achieved via right-alignment + manual column reversal
 * 
 * Usage:
 *   const reporter = await ReportPDFGenerator.init();
 *   await reporter.addHeaderGlobal("تقرير العملاء", '/logo.png', 100);
 *   reporter.addSummary([{ label: "إجمالي", value: 100 }]);
 *   reporter.addTable(headers, data);
 *   reporter.save("report.pdf");
 */
class ReportPDFGenerator {
  constructor() {
    this._bidi = null;
    try {
      this._bidi = bidiFactory();
    } catch (e) {
      console.warn("bidi-js init failed:", e);
    }
    this.docDefinition = this._getInitialDocDefinition();
  }

  _getInitialDocDefinition() {
    return {
      content: [],
      styles: {
        headerTitle: { font: 'Amiri', fontSize: 20, bold: true, alignment: 'center', color: '#111827' },
        systemName: { font: 'Amiri', fontSize: 12, bold: true, color: '#1f2937' },
        systemSub: { font: 'Amiri', fontSize: 9, color: '#6b7280' },
        metaText: { font: 'Amiri', fontSize: 10, color: '#4b5563' },
        tableHeader: {
          font: 'Amiri',
          bold: true,
          fontSize: 9,
          color: 'white',
          fillColor: '#0f172a',
          alignment: 'center',
          margin: [4, 8, 4, 8]
        },
        tableCell: {
          font: 'Amiri',
          fontSize: 9,
          color: '#374151',
          alignment: 'center',
          margin: [3, 6, 3, 6]
        },
        summaryLabel: { font: 'Amiri', fontSize: 9, color: '#6b7280', alignment: 'center', margin: [0, 0, 0, 2] },
        summaryValue: { font: 'Amiri', fontSize: 13, bold: true, color: '#111827', alignment: 'center' },
        summarySectionTitle: { font: 'Amiri', fontSize: 12, bold: true, color: '#111827', margin: [0, 15, 0, 10], alignment: 'right' },
        metadataLabel: { font: 'Amiri', fontSize: 9, color: '#6b7280', alignment: 'left' },
        metadataValue: { font: 'Amiri', fontSize: 9, color: '#111827', bold: true, alignment: 'left' }
      },
      defaultStyle: {
        font: 'Amiri',
        fontSize: 10,
        alignment: 'right'
      },
      pageMargins: [30, 40, 30, 60],
      footer: (currentPage, pageCount) => {
        return {
          stack: [
            {
              canvas: [{ type: 'line', x1: 30, y1: 0, x2: 565, y2: 0, lineWidth: 0.5, lineColor: '#cbd5e1' }],
              margin: [0, 5, 0, 5]
            },
            {
              columns: [
                {
                  text: this.fixArabic(`صفحة ${currentPage} من ${pageCount}`),
                  alignment: 'left',
                  margin: [30, 0],
                  fontSize: 9,
                  color: '#64748b'
                },
                {
                  text: this.fixArabic('جميع الحقوق محفوظة © 2026 نظام يمن نقل'),
                  alignment: 'right',
                  margin: [30, 0],
                  fontSize: 9,
                  color: '#1e293b',
                  bold: true
                }
              ]
            }
          ],
          margin: [0, 10, 0, 10]
        };
      }
    };
  }

  /**
   * Initialize: loads Arabic fonts and resets the document
   */
  async init() {
    await loadArabicFonts();
    this.docDefinition = this._getInitialDocDefinition();
    return this;
  }

  /**
   * Arabic text fixer: applies BiDi reordering for visual display.
   * NO reshaping is done — pdfmake's fontkit handles Arabic letter connectivity natively.
   */
  fixArabic(text) {
    if (text === null || text === undefined) return "";
    let str = String(text).trim();
    if (str === "") return "";

    if (this._bidi) {
      try {
        const embedLevelsResult = this._bidi.getEmbeddingLevels(str, 'rtl');
        str = this._bidi.getReorderedString(str, embedLevelsResult);
      } catch (e) {
        console.warn("Bidi error:", e);
      }
    }

    return str;
  }

  /**
   * Professional Header with trisection layout:
   * [Left: Date/Meta] [Center: Title] [Right: Logo/System Name]
   */
  async addHeaderGlobal(title, logoUrl = '/assets/images/logo.png', recordCount = 0) {
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleDateString('ar-YE', { month: 'long' });
    const year = now.getFullYear();
    const dateStr = `${day} ${month} ${year}`;

    let logoBase64 = null;
    try {
      logoBase64 = await this._loadImageBase64(logoUrl);
    } catch (e) {
      console.warn("Logo load failed:", e);
    }

    const columns = [
      // Left: Report metadata
      {
        stack: [
          { text: this.fixArabic(`تاريخ التقرير: ${dateStr}`), style: 'metadataValue' },
          { text: this.fixArabic('المصدر: لوحة التحكم'), style: 'metadataLabel', margin: [0, 2, 0, 0] }
        ],
        width: 'auto'
      },
      // Center: Report title
      {
        text: this.fixArabic(title),
        style: 'headerTitle',
        alignment: 'center',
        width: '*',
        margin: [0, 10, 0, 0]
      },
      // Right: Logo + System name
      {
        stack: [
          logoBase64 ? {
            image: logoBase64,
            width: 45,
            alignment: 'right',
            margin: [0, 0, 0, 5]
          } : { text: '', height: 10 },
          { text: this.fixArabic('نظام يمن نقل'), style: 'systemName', alignment: 'right' },
          { text: this.fixArabic('لوحة التحكم - التقارير'), style: 'systemSub', alignment: 'right' }
        ],
        width: 'auto'
      }
    ];

    this.docDefinition.content.push(
      { columns, margin: [0, 0, 0, 20] },
      {
        text: [
          { text: this.fixArabic('إجمالي السجلات: '), font: 'Amiri', color: '#64748b' },
          { text: this.fixArabic(`( ${recordCount} )`), font: 'Amiri', bold: true, color: '#111827' }
        ],
        alignment: 'center',
        margin: [0, 0, 0, 15]
      },
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 535, y2: 0, lineWidth: 0.5, lineColor: '#e2e8f0' }],
        margin: [0, 0, 0, 25]
      }
    );
  }

  // Compatibility aliases
  async addHeader(title, logoUrl = '/assets/images/logo.png') { return this.addHeaderGlobal(title, logoUrl, 0); }
  async addHeaderV4(title, logoUrl = '/assets/images/logo.png') { return this.addHeaderGlobal(title, logoUrl, 0); }
  async addHeaderPremium(title, logoUrl = '/assets/images/logo.png', recordCount = 0) { return this.addHeaderGlobal(title, logoUrl, recordCount); }

  addSectionTitle(title) {
    this.docDefinition.content.push(
      { text: this.fixArabic(title), style: 'summarySectionTitle' }
    );
  }

  /**
   * Summary statistics section with RTL column reversal
   */
  addSummary(metrics = []) {
    const revMetrics = [...metrics].reverse();

    const columns = revMetrics.map(m => ({
      stack: [
        { text: this.fixArabic(String(m.label)), style: 'summaryLabel' },
        { text: this.fixArabic(String(m.value)), style: 'summaryValue' }
      ],
      margin: [5, 10, 5, 10]
    }));

    this.docDefinition.content.push(
      { text: this.fixArabic("ملخص وإحصائيات التقرير"), style: 'summarySectionTitle' },
      {
        table: {
          widths: columns.map(() => '*'),
          body: [columns]
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: (i) => (i === 0 || i === columns.length) ? 0 : 0.5,
          vLineColor: () => '#e5e7eb',
          fillColor: () => '#f9fafb',
          paddingTop: () => 12,
          paddingBottom: () => 12,
        },
        margin: [0, 0, 0, 25]
      }
    );
  }

  /**
   * Data table with RTL column reversal and smart formatting
   */
  addTable(headers, data, options = {}) {
    const revHeaders = [...headers].reverse();
    const revData = data.map(row => [...row].reverse());

    const tableWidths = options.widths || revHeaders.map((h) => {
      const t = String(h);
      if (t.includes("#") || t === "ت") return 25;
      if (t.includes("اسم") || t.includes("العميل") || t.includes("السائق") || t.includes("من") || t.includes("إلى")) return '*';
      if (t.includes("البريد") || t.includes("@")) return 120;
      if (t.includes("رقم") || t.includes("هاتف") || t.includes("هوية")) return 80;
      if (t.includes("الحالة") || t.includes("نشاط") || t.includes("توثيق")) return 60;
      if (t.includes("عدد") || t.includes("طلب") || t.includes("مكتمل") || t.includes("ملغ")) return 50;
      if (t.includes("تقييم") || t.includes("سعر") || t.includes("إيراد")) return 60;
      if (t.includes("تاريخ")) return 65;
      return 'auto';
    });

    this.docDefinition.content.push({
      table: {
        headerRows: 1,
        widths: tableWidths,
        body: [
          // Header row
          revHeaders.map(h => ({
            text: this.fixArabic(String(h)),
            style: 'tableHeader'
          })),
          // Data rows
          ...revData.map(row => row.map((cell, cellIndex) => {
            const header = revHeaders[cellIndex];
            const text = String(cell || '-');

            // Status badge
            if (header && (header.includes("الحالة") || header.includes("نشاط") || header.includes("توثيق"))) {
              const isActive = text.includes("نشط") || text.includes("مقبول") || text.includes("مكتمل") || text.toLowerCase().includes("active");
              const isBlocked = text.includes("محظور") || text.includes("مرفوض") || text.includes("ملغ") || text.toLowerCase().includes("blocked");
              return {
                text: this.fixArabic(text),
                color: isActive ? '#059669' : (isBlocked ? '#dc2626' : '#d97706'),
                fillColor: isActive ? '#ecfdf5' : (isBlocked ? '#fef2f2' : '#fffbeb'),
                fontSize: 8, bold: true, alignment: 'center',
                margin: [4, 8, 4, 8]
              };
            }

            // Name column with avatar
            if (header && (header.includes("اسم") || header.includes("العميل") || header.includes("السائق"))) {
              const initial = text.charAt(0);
              return {
                columns: [
                  {
                    text: this.fixArabic(text),
                    alignment: 'right', width: '*', fontSize: 9, bold: true, margin: [0, 6, 8, 0]
                  },
                  {
                    stack: [
                      { canvas: [{ type: 'rect', x: 0, y: 0, w: 22, h: 22, r: 11, color: '#f1f5f9' }] },
                      { text: initial, color: '#64748b', fontSize: 9, bold: true, alignment: 'center', margin: [0, -16, 0, 0] }
                    ],
                    width: 22, margin: [0, 4, 0, 0]
                  }
                ],
                margin: [0, 4, 0, 4]
              };
            }

            return {
              text: this.fixArabic(text),
              style: 'tableCell',
              margin: [0, 6, 0, 0]
            };
          }))
        ]
      },
      layout: {
        hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length) ? 0.5 : 0.3,
        hLineColor: (i) => i === 1 ? '#0f172a' : '#f1f5f9',
        vLineWidth: () => 0,
        paddingLeft: () => 5,
        paddingRight: () => 5,
      },
      margin: [0, 10, 0, 20]
    });
  }

  async _loadImageBase64(url) {
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  save(filename = 'report.pdf') {
    const safeFilename = filename.replace(/[\\/:*?"<>|]/g, "_");
    try {
      const pdfInstance = pdfMake.default || pdfMake;
      pdfInstance.createPdf(this.docDefinition, {}).download(safeFilename);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("حدث خطأ أثناء تصدير التقرير: " + error.message);
    }
  }
}

export default new ReportPDFGenerator();
