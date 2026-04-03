import React, { useState, useRef, useEffect } from 'react';
import { 
    Bell, 
    BellOff, 
    Check, 
    Clock, 
    ChevronLeft, 
    AlertCircle, 
    User, 
    Truck, 
    Package,
    MailOpen
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';

// دالة مخصصة لعرض الوقت النسبي بالعربية
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

const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

    // إغلاق المنسدلة عند الضغط خارجها
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDropdown = () => setIsOpen(!isOpen);

    const handleNotificationClick = (notification) => {
        if (!notification.read) markAsRead(notification.id);
        
        // توجيه المستخدم بناءً على نوع التنبيه (اختياري)
        if (notification.type === 'order' && notification.metadata?.orderId) {
            navigate(`/orders?id=${notification.metadata.orderId}`);
        } else if (notification.type === 'driver' && notification.metadata?.driverId) {
            navigate(`/drivers?id=${notification.metadata.driverId}`);
        }
        
        setIsOpen(false);
    };

    const getIcon = (type) => {
        switch (type) {
            case 'order': return <Package className="w-5 h-5 text-blue-500" />;
            case 'driver': return <Truck className="w-5 h-5 text-green-500" />;
            case 'user': return <User className="w-5 h-5 text-purple-500" />;
            default: return <AlertCircle className="w-5 h-5 text-orange-500" />;
        }
    };

    return (
        <div className="relative font-arabic" ref={dropdownRef} dir="rtl">
            {/* --- أيقونة الجرس والبادج --- */}
            <button
                onClick={toggleDropdown}
                className={`relative p-3 rounded-2xl transition-all duration-300 ${
                    isOpen 
                    ? 'bg-primary-50 text-primary-700 shadow-inner' 
                    : 'bg-white hover:bg-gray-50 text-gray-400 hover:text-primary-600 border border-gray-100 shadow-sm'
                }`}
            >
                <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'animate-swing' : ''}`} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[10px] font-black rounded-lg border-4 border-white flex items-center justify-center shadow-lg shadow-red-100 scale-110">
                        {unreadCount > 9 ? '+9' : unreadCount}
                    </span>
                )}
            </button>

            {/* --- قائمة التنبيهات المنسدلة --- */}
            {isOpen && (
                <div className="absolute left-0 mt-4 w-[420px] bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-primary-900/10 border border-white/60 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-300 transform origin-top-left">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary-700 to-primary-600 p-6 flex items-center justify-between shadow-lg shadow-primary-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-inner">
                                <Bell className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-black text-lg">التنبيهات</h3>
                                <p className="text-primary-100 text-[10px] font-bold">لديك {unreadCount} تنبيهات غير مقروءة</p>
                            </div>
                        </div>
                        {unreadCount > 0 && (
                            <button 
                                onClick={markAllAsRead}
                                className="p-2 hover:bg-white/20 rounded-xl transition-colors group relative"
                                title="تحديد الكل كمقروء"
                            >
                                <Check className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[480px] overflow-y-auto scrollbar-hide bg-gray-50/50">
                        {notifications.length > 0 ? (
                            <div className="divide-y divide-gray-100/50">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`p-6 flex gap-4 cursor-pointer transition-all hover:bg-white group relative ${
                                            !notification.read ? 'before:absolute before:right-0 before:top-0 before:bottom-0 before:w-1.5 before:bg-primary-600' : ''
                                        }`}
                                    >
                                        <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ${
                                            !notification.read ? 'bg-primary-50 text-primary-600' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className={`text-sm font-black truncate ${!notification.read ? 'text-gray-900' : 'text-gray-500'}`}>
                                                    {notification.title}
                                                </h4>
                                                <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-gray-50">
                                                    <Clock className="w-3 h-3" />
                                                    {formatRelativeTime(notification.createdAt)}
                                                </span>
                                            </div>
                                            <p className={`text-xs font-bold leading-relaxed line-clamp-2 ${!notification.read ? 'text-gray-600' : 'text-gray-400'}`}>
                                                {notification.message}
                                            </p>
                                        </div>
                                        {/* Status Dot */}
                                        {!notification.read && (
                                            <div className="absolute top-6 left-6 w-2.5 h-2.5 bg-primary-600 rounded-full border-2 border-white shadow-sm ring-4 ring-primary-50 animate-pulse" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-24 flex flex-col items-center justify-center text-center px-10">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                    <BellOff className="w-10 h-10 text-gray-300" />
                                </div>
                                <h4 className="text-gray-900 font-bold text-lg mb-2">لا توجد تنبيهات</h4>
                                <p className="text-gray-400 text-sm font-bold leading-relaxed">
                                    أنت مطلع على كل شيء! ستظهر التنبيهات الجديدة هنا فور حدوثها.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-5 bg-white border-t border-gray-50">
                        <Link 
                            to="/notifications" 
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-center gap-2 w-full py-4 bg-gray-50 hover:bg-primary-50 text-gray-600 hover:text-primary-700 rounded-2xl text-sm font-black transition-all group"
                        >
                            <span>عرض جميع التنبيهات</span>
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
