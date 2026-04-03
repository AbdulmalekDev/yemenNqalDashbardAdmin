// src/utils/useArabicPdfReport.js

import { jsPDF } from "jspdf";
import "jspdf-autotable";
import reshape from "arabic-persian-reshaper";
import bidiFactory from 'bidi-js';

const bidi = bidiFactory();

/* ===============================
   إصلاح النص العربي (الأهم)
================================ */
function fixArabic(text) {
  if (text === null || text === undefined) return "";
  let str = String(text).trim();
  if (str === "") return "";

  // 1. Reshape
  str = reshape(str);

  // 2. BiDi Reorder
  try {
    const levels = bidi.getEmbeddingLevels(str, 'rtl');
    const visual = bidi.getVisualString(str, levels);
    return visual;
  } catch (e) {
    return str;
  }
}

/* ===============================
   تحميل الخطوط
================================ */
async function loadFont(doc, name, url, weight = "normal") {
  const resp = await fetch(url);
  const arrayBuffer = await resp.arrayBuffer();

  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ""
    )
  );

  const fontStyle = weight === "bold" ? "Bold" : "Regular";

  doc.addFileToVFS(`${name}-${fontStyle}.ttf`, base64);
  doc.addFont(`${name}-${fontStyle}.ttf`, name, weight);
}

/* ===============================
   تحويل الصورة إلى Base64
================================ */
async function loadImageBase64(url) {
  const resp = await fetch(url);
  const blob = await resp.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(blob);
  });
}

/* ===============================
   إنشاء تقرير PDF عربي
================================ */
export async function generateArabicPdfReport({
  title,
  columns,
  data,
  logoUrl,
  filename,
  summaryFn,
}) {

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pdfWidth = doc.internal.pageSize.getWidth();

  try {

    /* تحميل الخط العربي */
    await Promise.all([
      loadFont(doc, "Amiri", "/fonts/Amiri-Regular.ttf", "normal"),
      loadFont(doc, "Amiri", "/fonts/Amiri-Bold.ttf", "bold"),
    ]);

    doc.setFont("Amiri");

    let currentY = 40;

    /* ===============================
       الشعار
    =============================== */

    if (logoUrl) {

      const logoBase64 = await loadImageBase64(logoUrl);

      const imgProps = doc.getImageProperties(logoBase64);

      const logoWidth = 120;
      const logoHeight = (imgProps.height * logoWidth) / imgProps.width;

      doc.addImage(
        logoBase64,
        imgProps.fileType,
        (pdfWidth - logoWidth) / 2,
        currentY,
        logoWidth,
        logoHeight
      );

      currentY += logoHeight + 20;
    }

    /* ===============================
       عنوان التقرير
    =============================== */

    doc.setFont("Amiri", "bold");
    doc.setFontSize(20);

    doc.text(
      fixArabic(title),
      pdfWidth - 40,
      currentY,
      { align: "right" }
    );

    currentY += 30;

    /* ===============================
       الجدول
    =============================== */

    doc.autoTable({

      startY: currentY,

      head: [
        columns.map(col => fixArabic(col.header))
      ],

      body: data.map(row =>
        columns.map(col =>
          fixArabic(row[col.dataKey] ?? "")
        )
      ),

      theme: "grid",

      styles: {
        font: "Amiri",
        fontSize: 11,
        halign: "right",
        cellPadding: 6,
        overflow: "linebreak",
        lineHeight: 1.4,
      },

      headStyles: {
        fillColor: [0, 102, 204],
        textColor: [255, 255, 255],
        font: "Amiri",
        fontStyle: "bold",
        halign: "right",
      },

      bodyStyles: {
        font: "Amiri",
        halign: "right",
      },

      didParseCell: function (data) {
        data.cell.styles.halign = "right";
      },

    });

    /* ===============================
       الملخص
    =============================== */

    if (summaryFn) {

      const summaryRows = summaryFn(data);

      if (summaryRows?.length) {

        doc.autoTable({

          startY: doc.lastAutoTable.finalY + 15,

          body: summaryRows.map(row =>
            row.map(cell => fixArabic(cell))
          ),

          theme: "plain",

          styles: {
            font: "Amiri",
            fontSize: 12,
            fontStyle: "bold",
            halign: "right",
            cellPadding: 6,
          },

        });
      }
    }

    /* ===============================
       التاريخ
    =============================== */

    const now = new Date();

    const arabicDate = now.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    doc.setFont("Amiri", "normal");
    doc.setFontSize(10);

    doc.text(
      fixArabic(`التاريخ: ${arabicDate}`),
      pdfWidth - 40,
      doc.lastAutoTable.finalY + 35,
      { align: "right" }
    );

    /* ===============================
       حفظ الملف
    =============================== */

    const safeFilename = filename.replace(/[\\/:*?"<>|]/g, "_");

    doc.save(`${safeFilename}.pdf`);

  } catch (err) {

    console.error("❌ PDF generation failed:", err);

    alert("فشل إنشاء التقرير PDF");

  }
}
