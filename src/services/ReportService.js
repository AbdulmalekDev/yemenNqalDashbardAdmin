import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import bidiFactory from 'bidi-js';
import arabicReshaper from 'arabic-persian-reshaper';

/**
 * Global Report Engine for Yemen Naql
 * Production Version: 2.0 (Optimized for Arabic RTL)
 */

class ReportService {
    constructor() {
        this.bidi = bidiFactory();
        this.fontName = 'Amiri';
        this.primaryColor = [15, 23, 42]; // Dark Blue (#0f172a)
        this.accentColor = [37, 99, 235]; // Blue-600
        this.successColor = '#059669'; // Emerald-600
        this.dangerColor = '#dc2626'; // Red-600
    }

    processArabicText(text) {
        if (!text) return "";
        const str = String(text).trim();
        const hasArabic = /[\u0600-\u06FF]/.test(str);

        if (!hasArabic) return str;

        try {
            // Step 1: Reshape characters using Ligatures (Initial, Medial, Final)
            const reshaped = arabicReshaper.reshape(str);

            // Step 2: Use Bidi for correct RTL alignment of characters
            // jsPDF doesn't handle RTL natively, so we reverse the already shaped text
            const reversed = reshaped.split('').reverse().join('');

            // Numbers Fix: Keep numbers (12, 50, etc) in their logical order (LTR)
            return reversed.replace(/[\d,.]+/g, (match) => match.split('').reverse().join(''));
        } catch (error) {
            return str;
        }
    }

    async loadAssetAsBase64(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load asset: ${url}`);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Helper: Draw Professional Statistical Summary Cards
     */
    drawStatsCards(doc, metrics = []) {
        const pageWidth = doc.internal.pageSize.getWidth();
        const cardWidth = 55;
        const cardHeight = 22;
        const spacing = 5;
        const startY = 48;

        // Calculate total width of the metrics group to center it
        const totalWidth = (metrics.length * cardWidth) + ((metrics.length - 1) * spacing);
        let currentX = (pageWidth - totalWidth) / 2;

        metrics.forEach((m, index) => {
            // Card Background (Light Color)
            const bgColor = m.bgColor || [248, 250, 252];
            doc.setFillColor(...bgColor);
            doc.roundedRect(currentX, startY, cardWidth, cardHeight, 3, 3, 'F');

            // Border (Very Light)
            doc.setDrawColor(226, 232, 240);
            doc.roundedRect(currentX, startY, cardWidth, cardHeight, 3, 3, 'S');

            // Accent Line
            doc.setFillColor(...(m.color || this.accentColor));
            doc.rect(currentX + cardWidth - 2, startY + 5, 2, 12, 'F');

            // Card Label
            doc.setFontSize(9);
            doc.setTextColor(71, 85, 105); // Slate-600 for better clarity
            doc.setFont(this.fontName, 'normal');
            doc.text(this.processArabicText(m.label), currentX + cardWidth - 6, startY + 8, { align: 'right' });

            // Card Value
            doc.setFontSize(15);
            doc.setTextColor(15, 23, 42); // Slate-900
            doc.setFont(this.fontName, 'normal');
            doc.text(String(m.value), currentX + cardWidth - 6, startY + 17, { align: 'right' });

            doc.setFont(this.fontName, 'normal');
            currentX += (cardWidth + spacing);
        });

        return startY + cardHeight + 10;
    }

    /**
     * Unified Production Report Generator
     */
    async generateReport(rawData, type, options = {}) {
        const {
            title = "تقرير النظام المعتمد",
            logoUrl = "/assets/images/logo.png",
            filename = `Production_Report_${type}.pdf`,
            metrics: overrideMetrics = null
        } = options;

        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

        // --- STEP 1: ASSETS ---
        try {
            const amiriResRegular = await this.loadAssetAsBase64('/Amiri-Regular.ttf');
            doc.addFileToVFS('Amiri-Regular.ttf', amiriResRegular);
            doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
            doc.addFont('Amiri-Regular.ttf', 'Amiri', 'bold');
            doc.setFont('Amiri');
        } catch (e) {
            console.error("Font Load Failed", e);
        }

        const pageWidth = doc.internal.pageSize.getWidth();

        // --- STEP 2: BALANCED PRODUCTION HEADER ---
        doc.setFillColor(248, 250, 252);
        doc.rect(0, 0, pageWidth, 45, 'F');

        // A. Right Section: Logo
        try {
            const logoData = await this.loadAssetAsBase64(logoUrl);
            const imgProps = doc.getImageProperties(`data:image/png;base64,${logoData}`);
            const logoWidth = 28;
            const logoHeight = (imgProps.height * logoWidth) / imgProps.width;
            doc.addImage(`data:image/png;base64,${logoData}`, 'PNG', pageWidth - logoWidth - 15, 8, logoWidth, logoHeight);
        } catch (e) { console.warn("Logo skipped"); }

        // B. Center Section: Title
        doc.setFontSize(22);
        doc.setTextColor(15, 23, 42); // Slate-900
        doc.setFont(this.fontName, 'normal');
        doc.text(this.processArabicText(title), pageWidth / 2, 38, { align: 'center' });
        doc.setFont(this.fontName, 'normal');

        // C. Left Section: Meta
        doc.setFontSize(11); // Increased for clarity
        doc.setTextColor(51, 65, 85); // Slate-700 for high clarity
        doc.setFont(this.fontName, 'normal');
        const dateStr = new Date().toLocaleDateString('ar-YE', { year: 'numeric', month: 'long', day: 'numeric' });
        doc.text(this.processArabicText(`تاريخ التقرير: ${dateStr}`), 15, 15);
        doc.text(this.processArabicText(`يمن نقل للخدمات اللوجستية`), 15, 23);
        doc.text(this.processArabicText(`مركز البيانات الاستراتيجي`), 15, 31);
        doc.setFont(this.fontName, 'normal');

        // Header Separator Line
        doc.setDrawColor(226, 232, 240); // Slate-200
        doc.setLineWidth(0.8);
        doc.line(15, 45, pageWidth - 15, 45);

        // --- STEP 3: DATA PURIFICATION & STATS ---
        const cleanData = rawData;

        // Dynamic metrics (Use overrides if provided by page, otherwise calculate locally)
        const metrics = overrideMetrics || this._getMetrics(cleanData, type);
        const tableStartY = this.drawStatsCards(doc, metrics);

        // --- STEP 4: PRODUCTION TABLE ---
        const { headers, dataMapping, colStyles } = this._getTableConfig(type);
        const processedHeaders = headers.map(h => this.processArabicText(h)).reverse();
        const tableBody = cleanData.map((item, index) => dataMapping(item, this, index, cleanData).reverse());

        autoTable(doc, {
            startY: tableStartY,
            head: [processedHeaders],
            body: tableBody,
            styles: {
                font: 'Amiri', fontSize: 10, halign: 'right', cellPadding: 5,
                lineWidth: 0.1, lineColor: [226, 232, 240], // Darker borders
                overflow: 'visible'
            },
            headStyles: {
                fillColor: [226, 232, 240], // Slightly darker header
                textColor: [15, 23, 42],    // Black text
                fontStyle: 'normal',
                halign: 'center',
                lineWidth: 0.2,
                lineColor: [203, 213, 225]
            },
            margin: { left: 15, right: 15 }, // Balanced margins for centering
            columnStyles: colStyles,
            didParseCell: (hookData) => {
                if (hookData.section === 'body') {
                    const cellText = String(hookData.cell.raw);
                    // Semantic Logic (Arabic only keys)
                    if (cellText.includes('مكتمل') || cellText.includes('نشط') || cellText.includes('متصل') || cellText.includes('مقبول')) {
                        hookData.cell.styles.textColor = this.successColor;
                    } else if (cellText.includes('ملغى') || cellText.includes('محظور') || cellText.includes('مرفوض') || cellText.includes('غير متصل')) {
                        hookData.cell.styles.textColor = this.dangerColor;
                    }
                }
            },
            didDrawPage: (data) => {
                const pageCount = doc.internal.getNumberOfPages();
                doc.setFontSize(9); // Increased for clarity
                doc.setTextColor(71, 85, 105); // Slate-600 
                doc.setFont(this.fontName, 'normal');

                const footerY = doc.internal.pageSize.getHeight() - 10;

                // Left: Branding
                const footerBranding = this.processArabicText("مؤسسة يمن نقل للخدمات اللوجستية المحدودة © 2026");
                doc.text(footerBranding, 15, footerY);

                // Center: Page Number
                doc.text(this.processArabicText(`صفحة ${data.pageNumber} من ${pageCount}`), pageWidth / 2, footerY, { align: 'center' });

                // Right: Strategic Note
                const stratNote = this.processArabicText("تقرير سري - للاستخدام الإداري فقط");
                doc.text(stratNote, pageWidth - 15, footerY, { align: 'right' });
            }
        });

        doc.save(filename);
    }

    _getTypeName(type) {
        const names = {
            'customers': 'تقرير العملاء',
            'drivers': 'تقرير السائقين',
            'orders': 'تقرير الطلبات',
            'revenue': 'تقرير الإيرادات والأرباح المالية',
            'roles': 'تقرير الصلاحيات والأدوار'
        };
        return names[type] || 'تقرير عام';
    }

    _getMetrics(data, type) {
        if (!Array.isArray(data) || data.length === 0) return [];

        if (type === 'customers') {
            return [
                { label: "إجمالي العملاء", value: data.length, bgColor: [239, 246, 255] },
                { label: "نشطون معتمدون", value: data.filter(c => String(c?.status).includes('نشط') || String(c?.status).toLowerCase().includes('active')).length, color: [5, 150, 105], bgColor: [236, 253, 245] }
            ];
        }
        if (type === 'drivers') {
            return [
                { label: "إجمالي السائقين", value: data.length, bgColor: [239, 246, 255] },
                { label: "متصلون الآن", value: data.filter(d => d?.isOnline || d?.online).length, color: [5, 150, 105], bgColor: [236, 253, 245] },
                { label: "محظورون", value: data.filter(d => String(d?.status).includes('محظور') || String(d?.status).toLowerCase().includes('blocked')).length, color: [220, 38, 38], bgColor: [254, 242, 242] }
            ];
        }
        if (type === 'orders') {
            return [
                { label: "إجمالي الطلبات", value: data.length, bgColor: [249, 250, 251] },
                { label: "طلبات مكتملة", value: data.filter(o => String(o?.status).includes('مكتمل') || String(o?.status).toLowerCase().includes('completed')).length, color: [5, 150, 105], bgColor: [236, 253, 245] },
                { label: "طلبات ملغاة", value: data.filter(o => String(o?.status).includes('ملغى') || String(o?.status).toLowerCase().includes('cancelled')).length, color: [220, 38, 38], bgColor: [254, 242, 242] }
            ];
        }
        if (type === 'revenue') {
            const totalRevenue = data.reduce((sum, item) => sum + (Number(item?.revenue) || 0), 0);
            return [
                { label: "إجمالي أرباح الفترة", value: `${totalRevenue.toLocaleString()} ر.ي`, bgColor: [236, 253, 245] },
                { label: "إجمالي الطلبات", value: data.reduce((sum, item) => sum + (Number(item?.orders) || 0), 0), bgColor: [239, 246, 255] },
                { label: "صافي ربح المنصة", value: `${Math.round(totalRevenue * 0.05).toLocaleString()} ر.ي`, color: [37, 99, 235], bgColor: [248, 250, 252] }
            ];
        }
        if (type === 'roles') {
            return [
                { label: "إجمالي الأدوار", value: data.length, bgColor: [245, 243, 255] },
                { label: "مدراء النظام", value: data.filter(r => String(r?.role || '').toLowerCase().includes('manager') || String(r?.role || '').includes('مدير')).length, color: [126, 34, 206], bgColor: [250, 245, 255] }
            ];
        }
        // If it's a summary card report, we don't need additional metrics cards
        if (type === 'summary') return [];

        return [{ label: "إجمالي السجلات", value: data.length, bgColor: [248, 250, 252] }];
    }

    _getTableConfig(type) {
        if (type === 'drivers') {
            return {
                headers: ["السائق", "الهاتف", "المركبة", "المكتملة", "الإيرادات", "التقييم", "حالة التوثيق"],
                dataMapping: (item, s) => [
                    s.processArabicText(item.name || item.firstName || '-'),
                    s.processArabicText((item.phone || '').replace(/^\+967|^967/, '') || '-'),
                    s.processArabicText(item.vehicleType || '-'),
                    s.processArabicText(`${item.completedTrips || 0} رحلة`),
                    s.processArabicText(`${(item.revenue || 0).toLocaleString()} ر.ي`),
                    s.processArabicText(`${(item.rating || 0).toFixed(1)}`),
                    s.processArabicText(item.verificationStatus === 'accepted' || item.verificationStatus === 'مقبول' ? 'مقبول' : item.verificationStatus === 'rejected' || item.verificationStatus === 'مرفوض' ? 'مرفوض' : 'معلق')
                ],
                colStyles: {
                    0: { cellWidth: 20, halign: 'center' }, // Status
                    1: { cellWidth: 20, halign: 'center' }, // Rating
                    2: { cellWidth: 35, halign: 'center' }, // Revenue
                    3: { cellWidth: 35, halign: 'center' }, // Completed
                    4: { cellWidth: 25 },                   // Vehicle
                    5: { cellWidth: 25 },                   // Phone
                    6: { cellWidth: 30 }                    // Name
                }
            };
        }
        if (type === 'orders') {
            return {
                headers: ["رقم الطلب", "العميل", "السائق", "النوع", "السعر", "الحالة", "التاريخ"],
                dataMapping: (item, s) => [
                    s.processArabicText(String(item.orderId || item.id).slice(-8)),
                    s.processArabicText(item.clientName || item.clientFirstName || '-'),
                    s.processArabicText(item.driverName || '-'),
                    s.processArabicText(item.cargoType || item.vehicleType || '-'),
                    s.processArabicText(`${(item.price || 0).toLocaleString()} ر.ي`),
                    s.processArabicText(item.status || 'معلق'),
                    s.processArabicText(item.createdAt ? (item.createdAt._seconds ? new Date(item.createdAt._seconds * 1000).toLocaleDateString('ar-YE') : new Date(item.createdAt).toLocaleDateString('ar-YE')) : '-')
                ],
                colStyles: {
                    0: { cellWidth: 22, halign: 'center' }, // Date
                    1: { cellWidth: 20, halign: 'center' }, // Status
                    2: { cellWidth: 30 }, // Price
                    3: { cellWidth: 25 }, // Type
                    4: { cellWidth: 35 }, // Driver
                    5: { cellWidth: 35 }, // Client
                    6: { cellWidth: 18 }  // ID
                }
            };
        }
        if (type === 'revenue') {
            return {
                headers: ["الشهر", "الإيرادات", "عدد الطلبات", "متوسط الطلب", "النمو"],
                dataMapping: (item, s, index, allData) => {
                    const avgOrderValue = item.orders > 0 ? Math.round(item.revenue / item.orders) : 0;
                    const prevRevenue = allData && index > 0 ? allData[index - 1].revenue : 0;
                    const growth = prevRevenue > 0 ? (((item.revenue - prevRevenue) / prevRevenue) * 100).toFixed(1) : "0";

                    return [
                        s.processArabicText(item.month || '-'),
                        s.processArabicText(`${(item.revenue || 0).toLocaleString()} ر.ي`),
                        s.processArabicText(`${item.orders || 0} طلب`),
                        s.processArabicText(`${avgOrderValue.toLocaleString()} ر.ي`),
                        s.processArabicText(`${growth}%`)
                    ];
                },
                colStyles: {
                    0: { cellWidth: 20, halign: 'center' }, // Growth
                    1: { cellWidth: 35, halign: 'center' }, // avg
                    2: { cellWidth: 35, halign: 'center' }, // orders
                    3: { cellWidth: 40, halign: 'center' }, // revenue
                    4: { cellWidth: 30 }  // month
                }
            };
        }
        if (type === 'roles') {
            return {
                headers: ["المسـتخدم", "البريد الإلكتروني", "رقم الهاتف", "الـدور", "الحالة"],
                dataMapping: (item, s) => [
                    s.processArabicText(item.name || '-'),
                    s.processArabicText(item.email || '-'),
                    s.processArabicText(item.phone || item.phoneNumber || '-'),
                    s.processArabicText(item.role || 'مشرف'),
                    s.processArabicText(item.disabled ? 'معطل' : 'نشط')
                ],
                colStyles: { 
                    0: { cellWidth: 25, halign: 'center' }, // Status
                    1: { cellWidth: 35, halign: 'center' }, // Role
                    2: { cellWidth: 35, halign: 'center' }, // Phone
                    3: { cellWidth: 45 },                   // Email
                    4: { cellWidth: 40 }                    // User
                }
            };
        }
        if (type === 'summary') {
            return {
                headers: ["المعيار الإحصائي", "القيمة / الحالة"],
                dataMapping: (item, s) => [
                    s.processArabicText(item.label || '-'),
                    s.processArabicText(String(item.value || '0'))
                ],
                colStyles: {
                    0: { cellWidth: 80 },
                    1: { cellWidth: 80 }
                }
            };
        }
        return {
            headers: ["اسم العميل ", "رقم الهاتف", "البريد الإلكتروني", "عدد الطلبات", "حالة النشاط "],
            dataMapping: (item, s) => [
                s.processArabicText(item.name || '-'),
                s.processArabicText((item.phone || '').replace(/^\+967|^967/, '') || '-'),
                s.processArabicText(item.email || '-'),
                s.processArabicText(`${item.orderCount || item.totalOrders || 0} طلب`),
                s.processArabicText(item.status || 'نشط')
            ],
            colStyles: {
                0: { cellWidth: 30, halign: 'center' }, // Status
                3: { cellWidth: 40, halign: 'center' }, // Order Count (Increased to 40)
                4: { cellWidth: 55 } // Name
            }
        };
    }
}

export default new ReportService();
