import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import api from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL;
const RECONNECT_DELAY_MS = 5000;

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    // --- Toast States (Existing) ---
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'success',
    });

    // --- Persistent Notifications States (New) ---
    const [notificationsList, setNotificationsList] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const eventSourceRef = useRef(null);
    const retryCountRef = useRef(0);

    // --- SSE Logic ---
    const connectSSE = useCallback(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        const url = `${API_BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`;
        const es = new EventSource(url);
        eventSourceRef.current = es;

        es.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                if (payload.type === 'notifications_update') {
                    const items = payload.data.map(item => ({
                        ...item,
                        createdAt: new Date(item.createdAt)
                    }));
                    setNotificationsList(items);
                    setUnreadCount(payload.unreadCount);
                    setLoading(false);
                    retryCountRef.current = 0;
                }
            } catch (err) {
                // Heartbeat or malformed data
            }
        };

        es.onerror = () => {
            es.close();
            retryCountRef.current += 1;
            const delay = Math.min(RECONNECT_DELAY_MS * retryCountRef.current, 30000);
            setTimeout(connectSSE, delay);
        };
    }, []);

    useEffect(() => {
        connectSSE();
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, [connectSSE]);

    // --- Notification Management Methods ---
    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            // Update local state for immediate feedback
            setNotificationsList(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read/all');
            setNotificationsList(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    const deleteAllNotifications = async () => {
        try {
            await api.delete('/notifications/delete/all');
            setNotificationsList([]);
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to delete all notifications:", error);
        }
    };

    const deleteNotification = async (id) => {
        try {
            await api.delete(`/notifications/${id}`);
            setNotificationsList(prev => prev.filter(n => n.id !== id));
            // Update unread count if it was unread
            const deleted = notificationsList.find(n => n.id === id);
            if (deleted && !deleted.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error("Failed to delete notification:", error);
        }
    };

    // --- Toast Methods (Existing) ---
    const showNotification = useCallback((message, severity = 'success') => {
        setNotification({
            open: true,
            message,
            severity,
        });
    }, []);

    const handleClose = useCallback(() => {
        setNotification((prev) => ({ ...prev, open: false }));
    }, []);

    // Auto-hide toast
    useEffect(() => {
        if (notification.open) {
            const timer = setTimeout(() => {
                handleClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification.open, handleClose]);

    const getIcon = (severity) => {
        switch (severity) {
            case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
            case 'warning': return <AlertCircle className="w-5 h-5 text-orange-500" />;
            case 'info': return <Info className="w-5 h-5 text-blue-500" />;
            default: return null;
        }
    };

    const getStyles = (severity) => {
        switch (severity) {
            case 'success': return 'bg-green-50 border-green-200 text-green-800';
            case 'error': return 'bg-red-50 border-red-200 text-red-800';
            case 'warning': return 'bg-orange-50 border-orange-200 text-orange-800';
            case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
            default: return 'bg-white border-gray-200 text-gray-800';
        }
    };

    return (
        <NotificationContext.Provider value={{ 
            showNotification,
            notificationsList,
            unreadCount,
            loading,
            markAsRead,
            markAllAsRead,
            deleteAllNotifications,
            deleteNotification
        }}>
            {children}

            {/* Global Snackbar UI */}
            <div
                className={`fixed bottom-6 right-6 z-[9999] transition-all duration-300 transform font-arabic ${notification.open ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
                    }`}
                dir="rtl"
            >
                <div className={`flex items-center space-x-3 space-x-reverse min-w-[320px] max-w-md p-5 rounded-2xl shadow-2xl border backdrop-blur-md ${getStyles(notification.severity)}`}>
                    <div className="flex-shrink-0">
                        {getIcon(notification.severity)}
                    </div>
                    <div className="flex-1 font-bold text-sm">
                        {notification.message}
                    </div>
                    <button
                        onClick={handleClose}
                        className="flex-shrink-0 p-1.5 rounded-xl hover:bg-black/5 transition-all opacity-40 hover:opacity-100"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </NotificationContext.Provider>
    );
};
