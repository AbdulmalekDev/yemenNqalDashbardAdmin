import React from "react";
import ReportService from "../../services/ReportService";

export default function ReportButtons() {
  const driversColumns = [
    { header: "اسم السائق", dataKey: "name" },
    { header: "رقم الهاتف", dataKey: "phone" },
    { header: "المكتملة", dataKey: "completedTrips" },
    { header: "الملغاة", dataKey: "cancelledTrips" },
    { header: "التقييم", dataKey: "rating" },
  ];

  const driversData = [
    { name: "أحمد علي", phone: "0123456789", completedTrips: 42, cancelledTrips: 2, rating: 4.8 },
    { name: "سارة محمد", phone: "0987654321", completedTrips: 37, cancelledTrips: 1, rating: 4.5 },
  ];

  const customersColumns = [
    { header: "اسم العميل", dataKey: "name" },
    { header: "رقم الهاتف", dataKey: "phone" },
    { header: "البريد الإلكتروني", dataKey: "email" },
  ];

  const customersData = [
    { name: "خالد يوسف", email: "khaled@example.com", phone: "011223344" },
    { name: "منى علي", email: "mona@example.com", phone: "022334455" },
  ];

  const ordersColumns = [
    { header: "رقم الطلب", dataKey: "orderId" },
    { header: "اسم العميل", dataKey: "customerName" },
    { header: "اسم السائق", dataKey: "driverName" },
    { header: "الحالة", dataKey: "status" },
    { header: "السعر", dataKey: "price" },
    { header: "التاريخ", dataKey: "date" },
  ];

  const ordersData = [
    { orderId: "1001", customerName: "خالد يوسف", driverName: "أحمد علي", status: "مكتمل", price: 120, date: "2026-03-11" },
    { orderId: "1002", customerName: "منى علي", driverName: "سارة محمد", status: "ملغي", price: 80, date: "2026-03-10" },
  ];

  const handleDriversReport = async () => {
    await ReportService.generateReport(driversData, "drivers", {
      title: "تقرير السائقين",
      logoUrl: "/assets/images/logoYemen.png",
      filename: "تقرير_السائقين.pdf"
    });
  };

  const handleCustomersReport = async () => {
    await ReportService.generateReport(customersData, "customers", {
      title: "تقرير العملاء",
      logoUrl: "/assets/images/logoYemen.png",
      filename: "تقرير_العملاء.pdf"
    });
  };

  const handleOrdersReport = async () => {
    await ReportService.generateReport(ordersData, "orders", {
      title: "تقرير الطلبات",
      logoUrl: "/assets/images/logoYemen.png",
      filename: "تقرير_الطلبات.pdf"
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <button onClick={handleDriversReport} className="btn-primary">تقرير السائقين</button>
      <button onClick={handleCustomersReport} className="btn-primary">تقرير العملاء</button>
      <button onClick={handleOrdersReport} className="btn-primary">تقرير الطلبات</button>
    </div>
  );
}