import React from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';

const NotificationBell = () => {
    const { unreadCount } = useNotification();
    const navigate = useNavigate();

    const handleBellClick = () => {
        navigate('/notifications');
    };

    return (
        <div className="relative font-arabic" dir="rtl">
            {/* --- أيقونة الجرس والبادج --- */}
            <button
                onClick={handleBellClick}
                className="relative p-3 rounded-2xl transition-all duration-300 bg-white hover:bg-gray-50 text-gray-400 hover:text-primary-600 border border-gray-100 shadow-sm"
                title="التنبيهات"
            >
                <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'animate-swing' : ''}`} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[10px] font-black rounded-lg border-4 border-white flex items-center justify-center shadow-lg shadow-red-100 scale-110">
                        {unreadCount > 9 ? '+9' : unreadCount}
                    </span>
                )}
            </button>
        </div>
    );
};

export default NotificationBell;
