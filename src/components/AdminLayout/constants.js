import {
  LayoutDashboard,
  Users,
  UserCheck,
  Package,
  MapPin,
  Shield,
  DollarSign,
  Settings,
  BarChart3,
} from 'lucide-react';

export const ADMIN_MENU_ITEMS = [
  { 
    path: '/dashboard', 
    icon: LayoutDashboard, 
    label: 'الصفحة الرئيسية', 
    roles: ['default', 'supervisor', 'manager'], 
    permission: null 
  },
  {
    id: 'drivers',
    icon: Users,
    label: 'إدارة السائقين',
    roles: ['default', 'supervisor', 'manager'],
    permission: 'view_drivers', // Everyone can at least view
    children: [
      { path: '/drivers', label: 'عرض السائقين', permission: 'view_drivers' },
      { path: '/drivers/new', label: 'إضافة سائق جديد', permission: 'manage_drivers' },
      { path: '/verification', label: 'توثيق السائقين', permission: 'view_verification' },
    ]
  },
  {
    id: 'customers',
    icon: UserCheck,
    label: 'إدارة العملاء',
    roles: ['default', 'supervisor', 'manager'],
    permission: 'view_customers',
    children: [
      { path: '/customers', label: 'عرض العملاء', permission: 'view_customers' },
      { path: '/customers/new', label: 'إضافة عيل جديد', permission: 'manage_customers' },
    ]
  },
  { 
    path: '/orders', 
    icon: Package, 
    label: 'إدارة الطلبات', 
    roles: ['default', 'supervisor', 'manager'], 
    permission: 'view_orders' 
  },
  // { 
  //   path: '/tracking', 
  //   icon: MapPin, 
  //   label: 'التتبع المباشر', 
  //   roles: ['default', 'supervisor', 'manager'], 
  //   permission: 'view_tracking' 
  // },
  { 
    path: '/revenues', 
    icon: DollarSign, 
    label: 'الأرباح', 
    roles: ['manager'], 
    permission: 'view_revenues' 
  },
  {
    id: 'reports',
    icon: BarChart3,
    label: 'التقارير ',
    roles: ['manager'], // تقييد التقارير للمدير فقط بناءً على طلب العميل
    permission: 'view_reports',
    children: [
      { path: '/reports', label: 'اللوحة الرئيسية للتقارير' },
      { path: '/reports/orders', label: 'تقرير الطلبات' },
      { path: '/reports/drivers', label: 'تقرير السائقين' },
      { path: '/reports/customers', label: 'تقرير العملاء' },
      { path: '/reports/roles', label: 'تقرير الأدوار' },
    ]
  },
  { 
    path: '/settings', 
    icon: Settings, 
    label: 'الإعدادات', 
    roles: ['supervisor', 'manager'], 
    permission: 'manage_settings' 
  },
  {
    id: 'users',
    icon: Shield,
    label: 'إدارة المستخدمين',
    roles: ['manager'],
    permission: 'manage_users',
    children: [
      { path: '/users', label: 'قائمة المستخدمين' },
      { path: '/users/new', label: 'إضافة مستخدم جديد' },
    ]
  },
];

export const ROLE_LABELS = {
  manager: 'مدير',
  supervisor: 'مشرف عمليات',
  default: 'مشاهد (Viewer)',
};

export const ROLE_COLORS = {
  manager: 'bg-purple-100 text-purple-700',
  supervisor: 'bg-blue-100 text-blue-700',
  default: 'bg-gray-100 text-gray-700',
};

// This matches the backend configuration
export const ROLE_PERMISSIONS = {
  manager: ['*'],
  supervisor: [
    'view_drivers', 'manage_drivers',
    'view_customers', 'manage_customers',
    'view_orders', 'manage_orders',
    'view_tracking', 'view_verification',
    'manage_settings'
  ],
  default: [
    'view_drivers',
    'view_customers',
    'view_orders',
    'view_tracking',
    'view_profile'
  ]
};
