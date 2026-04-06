import React, { useState } from 'react';
import {
    Bell,
    BellOff,
    Check,
    Trash2,
    Clock,
    ArrowRight,
    Package,
    Truck,
    User,
    AlertCircle,
    CheckCircle2,
    Search,
    Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';

const NotificationsPage = () => {
    const navigate = useNavigate();
    const {
        notificationsList,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications
    } = useNotification();

    const [filter, setFilter] = useState('all'); // all, unread, read
    const [searchTerm, setSearchTerm] = useState('');

    const filteredNotifications = notificationsList.filter(n => {
        const matchesFilter = filter === 'all' || (filter === 'unread' ? !n.read : n.read);
        const matchesSearch = !searchTerm || 
            (n.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (n.message?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const handleNotificationClick = (notification) => {
        if (!notification.read) markAsRead(notification.id);

        // Navigation based on metadata
        if (notification.type === 'order' && notification.metadata?.orderId) {
            navigate(`/orders/${notification.metadata.orderId}`);
        } else if (notification.type === 'driver' && notification.metadata?.driverId) {
            navigate(`/drivers/${notification.metadata.driverId}`);
        } else if (notification.type === 'customer' && notification.metadata?.customerId) {
            navigate(`/customers/${notification.metadata.customerId}`);
        } else if (notification.type === 'user' && notification.metadata?.userId) {
            navigate(`/users/${notification.metadata.userId}`);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'order': return <Package className="w-5 h-5 text-blue-500" />;
            case 'driver': return <Truck className="w-5 h-5 text-green-500" />;
            case 'user': return <User className="w-5 h-5 text-purple-500" />;
            default: return <AlertCircle className="w-5 h-5 text-orange-500" />;
        }
    };

    const formatRelativeTime = (date) => {
        if (!date) return '';
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'الآن';
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays === 1) return 'أمس';
        if (diffInDays < 7) return `منذ ${diffInDays} أيام`;
        return date.toLocaleDateString('ar-EG');
    };

    return (
        <div className="p-8 max-w-5xl mx-auto font-arabic" dir="rtl">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-primary-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-primary-200">
                        <Bell className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 mb-1">مركز التنبيهات</h1>
                        <p className="text-gray-500 font-bold flex items-center gap-2">
                            لديك {unreadCount} تنبيهات غير مقروءة حالياً
                        </p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-3">
                    <button
                        onClick={markAllAsRead}
                        disabled={unreadCount === 0}
                        className="px-6 h-14 bg-white border-2 border-primary-100 rounded-2xl text-primary-600 font-black flex items-center gap-2 hover:bg-primary-50 transition-all disabled:opacity-50 disabled:hover:bg-white"
                    >
                        <CheckCircle2 className="w-5 h-5" />
                        تحديد الكل كمقروء
                    </button>
                    <button
                        onClick={deleteAllNotifications}
                        disabled={notificationsList.length === 0}
                        className="px-6 h-14 bg-white border-2 border-red-100 rounded-2xl text-red-500 font-black flex items-center gap-2 hover:bg-red-50 transition-all disabled:opacity-50 disabled:hover:bg-white"
                    >
                        <Trash2 className="w-5 h-5" />
                        حذف الكل
                    </button>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-6">
                <div className="flex-1 relative">
                    <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="ابحث في التنبيهات..."
                        className="w-full pr-14 pl-6 h-14 bg-gray-50 rounded-2xl border-transparent focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-50 outline-none transition-all font-bold"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                    {[
                        { id: 'all', label: 'الكل' },
                        { id: 'unread', label: 'غير المقروءة' },
                        { id: 'read', label: 'المقروءة' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id)}
                            className={`px-8 py-3 rounded-xl font-black text-sm transition-all ${filter === tab.id
                                ? 'bg-white text-primary-700 shadow-md'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="p-20 text-center bg-white rounded-[3rem] border border-gray-50">
                        <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-400 font-bold">جاري تحميل التنبيهات...</p>
                    </div>
                ) : filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`group relative p-6 rounded-[2.5rem] border-2 transition-all hover:shadow-xl hover:shadow-primary-900/5 flex items-start gap-6 ${
                                !notification.read
                                ? 'bg-primary-50 border-primary-200'
                                : 'bg-white border-transparent hover:border-gray-200'
                                }`}
                        >
                            {/* Icon Wrapper */}
                            <div
                                onClick={() => handleNotificationClick(notification)}
                                className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center cursor-pointer transition-transform group-hover:scale-105 ${!notification.read ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'
                                    }`}
                            >
                                {getIcon(notification.type)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 cursor-pointer" onClick={() => handleNotificationClick(notification)}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                                    <h4 className={`text-lg font-black ${!notification.read ? 'text-gray-900' : 'text-gray-500'}`}>
                                        {notification.title}
                                    </h4>
                                    <span className="text-xs font-bold text-gray-400 flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                                        <Clock className="w-3.5 h-3.5" />
                                        {formatRelativeTime(notification.createdAt)}
                                    </span>
                                </div>
                                <p className={`text-sm font-bold leading-relaxed mb-4 ${!notification.read ? 'text-gray-600' : 'text-gray-400'}`}>
                                    {notification.message}
                                </p>

                                <div className="flex items-center gap-4">
                                    {!notification.read && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                markAsRead(notification.id);
                                            }}
                                            className="text-xs font-black text-primary-600 hover:text-primary-700 flex items-center gap-1.5"
                                        >
                                            <Check className="w-4 h-4" />
                                            تعيين كمقروء
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleNotificationClick(notification);
                                        }}
                                        className="text-xs font-black text-gray-500 hover:text-primary-600 flex items-center gap-1.5"
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                        عرض التفاصيل
                                    </button>
                                </div>
                            </div>

                            {/* Actions (Delete and Mark as Read) */}
                            <div className="flex flex-row md:flex-col items-center gap-2 self-center">
                                {!notification.read ? (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            markAsRead(notification.id);
                                        }}
                                        className="w-12 h-12 rounded-2xl bg-white border border-primary-200 text-primary-600 hover:bg-primary-600 hover:text-white transition-all shadow-sm flex items-center justify-center transform active:scale-95"
                                        title="تحديد كمقروء"
                                    >
                                        <Check className="w-6 h-6" />
                                    </button>
                                ) : (
                                    <div 
                                        className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-300 flex items-center justify-center border border-gray-100"
                                        title="مقروء"
                                    >
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                )}

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(notification.id);
                                    }}
                                    className="w-12 h-12 rounded-2xl bg-white border border-red-100 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center justify-center transform active:scale-95"
                                    title="حذف التنبيه"
                                >
                                    <Trash2 className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Unread Indicator Status Bar */}
                            {!notification.read && (
                                <div className="absolute top-0 right-0 bottom-0 w-2 bg-primary-600 rounded-r-3xl shadow-lg ring-4 ring-primary-50 animate-pulse" />
                            )}
                        </div>
                    ))
                ) : (
                    <div className="py-32 flex flex-col items-center justify-center text-center px-10 bg-white rounded-[3rem] border border-dashed border-gray-200">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-8">
                            <BellOff className="w-12 h-12 text-gray-200" />
                        </div>
                        <h4 className="text-gray-900 font-black text-xl mb-3">لا توجد تنبيهات تطابق بحثك</h4>
                        <p className="text-gray-400 font-bold max-w-sm leading-relaxed">
                            {searchTerm || filter !== 'all'
                                ? 'جرب تغيير فلاتر البحث أو الكلمات المستخدمة لتجد ما تبحث عنه.'
                                : 'أنت مطلع على كل شيء! ستظهر التنبيهات الجديدة هنا فور حدوثها.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
