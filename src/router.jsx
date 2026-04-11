import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './layouts/AdminLayout';
import { Toaster } from 'react-hot-toast';

// Pages
import LoginPage from './pages/Login/LoginPage';
import ForgotPassword from './pages/Login/ForgotPassword';
import VerifyCode from './pages/Login/VerifyCode';
import ResetPassword from './pages/Login/ResetPassword';
import DashboardPage from './pages/Dashboard/DashboardPage';
import DriversPage from './pages/Drivers/DriversPage';
import DriverProfilePage from './pages/Drivers/DriverProfilePage';
import DriverFormPage from './pages/Drivers/DriverFormPage';
import CustomersPage from './pages/Customers/CustomersPage';
import CustomerProfilePage from './pages/Customers/CustomerProfilePage';
import CustomerFormPage from './pages/Customers/CustomerFormPage';
import OrdersPage from './pages/Orders/OrdersPage';
import OrderDetailsPage from './pages/Orders/OrderDetailsPage';
// import TrackingPage from './pages/Tracking/TrackingPage';
import VerificationPage from './pages/Verification/VerificationPage';
import RevenuesPage from './pages/Revenues/RevenuesPage';
import SettingsPage from './pages/Settings/SettingsPage';
import ReportsPage from './pages/Reports/ReportsPage';
import OrdersReportPage from './pages/Reports/OrdersReportPage';
import DriversReportPage from './pages/Reports/DriversReportPage';
import CustomersReportPage from './pages/Reports/CustomersReportPage';
import RolesPage from './pages/Reports/RolesPage';
import UserList from './pages/Users/UserList';
import AddUser from './pages/Users/AddUser';
import EditUser from './pages/Users/EditUser';
import UserProfilePage from './pages/Users/UserProfilePage';
import NotificationsPage from './pages/Notifications/NotificationsPage';

// React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: true,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Role Based Route Component
const RoleRoute = ({ children, allowedRoles }) => {
  const { user, loading, hasRole } = useAuth();

  if (loading) return null;

  if (!hasRole(allowedRoles)) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <div className="bg-red-100 p-4 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">تم رفض الوصول</h2>
          <p className="text-gray-600 max-w-md">
            ليس لديك الصلاحيات الكافية للوصول إلى هذه الصفحة. يرجى التواصل مع مدير النظام.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return children;
};

// Admin Only Route Component (manager role required)
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
      </div>
    );
  }

  // isAdmin يعتمد على role === 'manager' من الباكيند
  if (!user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Permission Based Route Component
const PermissionRoute = ({ children, requiredPermission }) => {
  const { user, loading, hasPermission } = useAuth();

  if (loading) return null;

  if (!hasPermission(requiredPermission)) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <div className="bg-amber-100 p-4 rounded-full mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">صلاحية غير كافية</h2>
          <p className="text-gray-600 max-w-md">
            ليس لديك الصلاحية المطلوبة للوصول إلى هذه الصفحة. تواصل مع المدير لطلب الصلاحية.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return children;
};

// Main App Routes
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-code" element={<VerifyCode />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/admin">
        <Route path="login" element={<LoginPage />} />
        {/* <Route path="signup" element={<SignupPage />} /> */}
        <Route path="dashboard" element={
          <ProtectedRoute>
            <AdminLayout>
              <DashboardPage />
            </AdminLayout>
          </ProtectedRoute>
        } />
      </Route>

      {/* Common Routes - Supervisor & Manager */}
      <Route path="/" element={
        <ProtectedRoute>
          <AdminLayout>
            <DashboardPage />
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AdminLayout>
            <DashboardPage />
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/drivers" element={
        <ProtectedRoute>
          <PermissionRoute requiredPermission={['view_drivers', 'manage_drivers']}>
            <AdminLayout>
              <DriversPage />
            </AdminLayout>
          </PermissionRoute>
        </ProtectedRoute>
      } />

      <Route path="/drivers/:id" element={
        <ProtectedRoute>
          <PermissionRoute requiredPermission={['view_drivers', 'manage_drivers']}>
            <AdminLayout>
              <DriverProfilePage />
            </AdminLayout>
          </PermissionRoute>
        </ProtectedRoute>
      } />

      <Route path="/drivers/new" element={
        <ProtectedRoute>
          <PermissionRoute requiredPermission="manage_drivers">
            <AdminLayout>
              <DriverFormPage />
            </AdminLayout>
          </PermissionRoute>
        </ProtectedRoute>
      } />

      <Route path="/drivers/edit/:id" element={
        <ProtectedRoute>
          <PermissionRoute requiredPermission="manage_drivers">
            <AdminLayout>
              <DriverFormPage />
            </AdminLayout>
          </PermissionRoute>
        </ProtectedRoute>
      } />

      <Route path="/customers" element={
        <ProtectedRoute>
          <PermissionRoute requiredPermission={['view_customers', 'manage_customers']}>
            <AdminLayout>
              <CustomersPage />
            </AdminLayout>
          </PermissionRoute>
        </ProtectedRoute>
      } />

      <Route path="/customers/:id" element={
        <ProtectedRoute>
          <PermissionRoute requiredPermission={['view_customers', 'manage_customers']}>
            <AdminLayout>
              <CustomerProfilePage />
            </AdminLayout>
          </PermissionRoute>
        </ProtectedRoute>
      } />

      <Route path="/customers/new" element={
        <ProtectedRoute>
          <PermissionRoute requiredPermission="manage_customers">
            <AdminLayout>
              <CustomerFormPage />
            </AdminLayout>
          </PermissionRoute>
        </ProtectedRoute>
      } />

      <Route path="/customers/edit/:id" element={
        <ProtectedRoute>
          <PermissionRoute requiredPermission="manage_customers">
            <AdminLayout>
              <CustomerFormPage />
            </AdminLayout>
          </PermissionRoute>
        </ProtectedRoute>
      } />

      <Route path="/orders" element={
        <ProtectedRoute>
          <PermissionRoute requiredPermission={['view_orders', 'manage_orders']}>
            <AdminLayout>
              <OrdersPage />
            </AdminLayout>
          </PermissionRoute>
        </ProtectedRoute>
      } />

      <Route path="/orders/:id" element={
        <ProtectedRoute>
          <PermissionRoute requiredPermission={['view_orders', 'manage_orders']}>
            <AdminLayout>
              <OrderDetailsPage />
            </AdminLayout>
          </PermissionRoute>
        </ProtectedRoute>
      } />

      {/* <Route path="/tracking" element={
        <ProtectedRoute>
          <PermissionRoute requiredPermission="view_tracking">
            <AdminLayout>
              <TrackingPage />
            </AdminLayout>
          </PermissionRoute>
        </ProtectedRoute>
      } /> */}

      <Route path="/verification" element={
        <ProtectedRoute>
          <PermissionRoute requiredPermission="view_verification">
            <AdminLayout>
              <VerificationPage />
            </AdminLayout>
          </PermissionRoute>
        </ProtectedRoute>
      } />

      {/* Manager Routes */}
      <Route path="/revenues" element={
        <ProtectedRoute>
          <PermissionRoute requiredPermission="view_revenues">
            <AdminLayout>
              <RevenuesPage />
            </AdminLayout>
          </PermissionRoute>
        </ProtectedRoute>
      } />

      <Route path="/reports" element={
        <ProtectedRoute>
          <PermissionRoute requiredPermission="view_reports">
            <AdminLayout>
              <ReportsPage />
            </AdminLayout>
          </PermissionRoute>
        </ProtectedRoute>
      } />

      <Route path="/reports/orders" element={
        <ProtectedRoute>
          <PermissionRoute requiredPermission="view_reports">
            <AdminLayout>
              <OrdersReportPage />
            </AdminLayout>
          </PermissionRoute>
        </ProtectedRoute>
      } />

      <Route path="/reports/drivers" element={
        <ProtectedRoute>
          <PermissionRoute requiredPermission="view_reports">
            <AdminLayout>
              <DriversReportPage />
            </AdminLayout>
          </PermissionRoute>
        </ProtectedRoute>
      } />

      <Route path="/reports/customers" element={
        <ProtectedRoute>
          <PermissionRoute requiredPermission="view_reports">
            <AdminLayout>
              <CustomersReportPage />
            </AdminLayout>
          </PermissionRoute>
        </ProtectedRoute>
      } />

      <Route path="/reports/roles" element={
        <ProtectedRoute>
          <PermissionRoute requiredPermission="view_reports">
            <AdminLayout>
              <RolesPage />
            </AdminLayout>
          </PermissionRoute>
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <PermissionRoute requiredPermission="manage_settings">
            <AdminLayout>
              <SettingsPage />
            </AdminLayout>
          </PermissionRoute>
        </ProtectedRoute>
      } />

      <Route path="/users" element={
        <ProtectedRoute>
          <PermissionRoute requiredPermission="manage_users">
            <AdminLayout>
              <UserList />
            </AdminLayout>
          </PermissionRoute>
        </ProtectedRoute>
      } />

      <Route path="/users/new" element={
        <ProtectedRoute>
          <PermissionRoute requiredPermission="manage_users">
            <AdminLayout>
              <AddUser />
            </AdminLayout>
          </PermissionRoute>
        </ProtectedRoute>
      } />

      <Route path="/users/edit/:id" element={
        <ProtectedRoute>
          <PermissionRoute requiredPermission="manage_users">
            <AdminLayout>
              <EditUser />
            </AdminLayout>
          </PermissionRoute>
        </ProtectedRoute>
      } />

      <Route path="/users/:id" element={
        <ProtectedRoute>
          <PermissionRoute requiredPermission={['view_profile', 'manage_users']}>
            <AdminLayout>
              <UserProfilePage />
            </AdminLayout>
          </PermissionRoute>
        </ProtectedRoute>
      } />

      <Route path="/notifications" element={
        <ProtectedRoute>
          <AdminLayout>
            <NotificationsPage />
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

import { NotificationProvider } from './context/NotificationContext';

// Main App Component
const App = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <QueryClientProvider client={queryClient}>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Toaster

              position="bottom-left"
              reverseOrder={false}
              toastOptions={{
                success: {
                  style: {
                    background: '#10B981',
                    color: '#fff',
                    direction: 'rtl',
                    fontWeight: 'bold',
                  },
                  iconTheme: {
                    primary: '#fff',
                    secondary: '#10B981',
                  },
                },
                error: {
                  style: {
                    background: '#EF4444',
                    color: '#fff',
                  },
                },
              }}
            />
            <AppRoutes />
          </Router>
        </QueryClientProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;