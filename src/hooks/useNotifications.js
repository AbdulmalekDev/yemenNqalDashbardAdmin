import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL;
const RECONNECT_DELAY_MS = 5000;

/**
 * useNotifications - هوك لمتابعة التنبيهات عبر SSE من الباكيند مباشرة
 */
export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const eventSourceRef = useRef(null);
    const retryCountRef = useRef(0);

    const connectSSE = useCallback(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        // إغلاق أي اتصال قديم
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
                    setNotifications(items);
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

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read/all');
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead
    };
};
