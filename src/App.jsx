import React from "react";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// صفحات المشروع
import DashboardPage from "./pages/Dashboard/DashboardPage";
import CustomersPage from "./pages/Customers/CustomersPage";
import CustomerProfilePage from "./pages/Customers/CustomerProfilePage";
import CustomerFormPage from "./pages/Customers/CustomerFormPage";
import DriversPage from "./pages/Drivers/DriversPage";
import DriverProfilePage from "./pages/Drivers/DriverProfilePage";
import DriverFormPage from "./pages/Drivers/DriverFormPage";
import OrdersPage from "./pages/Orders/OrdersPage";
import OrderDetailPage from "./pages/Orders/OrderDetailPage";
import SettingsPage from "./pages/Settings/SettingsPage";
import ProtectedRoute from "./components/common/ProtectedRoute";

// التقارير
import ReportsPage from "./pages/Reports/ReportsPage";
import RolesPage from "./pages/Reports/RolesPage";
import DriversReportPage from "./pages/Reports/DriversReportPage";
import CustomersReportPage from "./pages/Reports/CustomersReportPage";
import OrdersReportPage from "./pages/Reports/OrdersReportPage";
import TrackingPage from "./pages/Tracking/TrackingPage";


import LoginPage from "./pages/Login/LoginPage";
import UserList from "./pages/Users/UserList";
import AddUser from "./pages/Users/AddUser";
import EditUser from "./pages/Users/EditUser";
import UserProfilePage from "./pages/Users/UserProfilePage";

import ForgotPassword from "./pages/Login/ForgotPassword";
import ResetPassword from "./pages/Login/ResetPassword";

import { ResetPassword } from "./pages/Login/ResetPassword"; // or just remove the line if it was only for toaster

const App = () => {
  return (
    <Router>
      <Routes>
        {/* الصفحة الرئيسية (محمية) */}
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />





        {/* إدارة العملاء (محمية) */}
        <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
        <Route path="/customers/new" element={<ProtectedRoute><CustomerFormPage /></ProtectedRoute>} />
        <Route path="/customers/edit/:id" element={<ProtectedRoute><CustomerFormPage /></ProtectedRoute>} />
        <Route path="/customers/:id" element={<ProtectedRoute><CustomerProfilePage /></ProtectedRoute>} />

        {/* إدارة السائقين (محمية) */}
        <Route path="/drivers" element={<ProtectedRoute><DriversPage /></ProtectedRoute>} />
        <Route path="/drivers/new" element={<ProtectedRoute><DriverFormPage /></ProtectedRoute>} />
        <Route path="/drivers/edit/:id" element={<ProtectedRoute><DriverFormPage /></ProtectedRoute>} />
        <Route path="/drivers/:id" element={<ProtectedRoute><DriverProfilePage /></ProtectedRoute>} />

        {/* إدارة الطلبات (محمية) */}
        <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />

        {/* التقارير والصلاحيات (للمدير فقط) */}
        <Route path="/reports" element={<ProtectedRoute allowedRoles={['manager']}><ReportsPage /></ProtectedRoute>} />
        <Route path="/reports/drivers" element={<ProtectedRoute allowedRoles={['manager']}><DriversReportPage /></ProtectedRoute>} />
        <Route path="/reports/customers" element={<ProtectedRoute allowedRoles={['manager']}><CustomersReportPage /></ProtectedRoute>} />
        <Route path="/reports/orders" element={<ProtectedRoute allowedRoles={['manager']}><OrdersReportPage /></ProtectedRoute>} />
        <Route path="/reports/roles" element={<ProtectedRoute allowedRoles={['manager']}><RolesPage /></ProtectedRoute>} />

        <Route path="/login" element={<LoginPage />} />

        {/* إدارة المسؤوليين (محمية للمدير فقط) */}
        <Route path="/users" element={<ProtectedRoute allowedRoles={['manager']}><UserList /></ProtectedRoute>} />
        <Route path="/users/new" element={<ProtectedRoute allowedRoles={['manager']}><AddUser /></ProtectedRoute>} />
        <Route path="/users/edit/:id" element={<ProtectedRoute allowedRoles={['manager']}><EditUser /></ProtectedRoute>} />
        <Route path="/users/:id" element={<ProtectedRoute allowedRoles={['manager']}><UserProfilePage /></ProtectedRoute>} />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />


        {/* الإعدادات (محمية للمدير والمشرف) */}
        <Route path="/settings" element={<ProtectedRoute allowedRoles={['manager', 'supervisor']}><SettingsPage /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
};

export default App;
