import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL;
const RECONNECT_DELAY_MS = 5000;

/**
 * useNotifications - هوك لمتابعة التنبيهات عبر SSE من الباكيند مباشرة
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

/**
 * useNotifications - هوك معدل يعتمد على React Query والبث المركزي الموحد
 */
export const useNotifications = () => {
    const queryClient = useQueryClient();

    // جلب الإشعارات كاستعلام عادي (سيتم تحديثه عبر useRealTime)
    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const res = await api.get('/notifications');
            return res.data;
        },
        staleTime: Infinity, // التحديثات تأتي عبر SSE فقط بعد الجلب الأول
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsReadMutation = useMutation({
        mutationFn: (id) => api.put(`/notifications/${id}/read`),
        onSuccess: () => queryClient.invalidateQueries(['notifications'])
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: () => api.put('/notifications/read/all'),
        onSuccess: () => queryClient.invalidateQueries(['notifications'])
    });

    return {
        notifications,
        unreadCount,
        loading: isLoading,
        markAsRead: (id) => markAsReadMutation.mutate(id),
        markAllAsRead: () => markAllAsReadMutation.mutate()
    };
};

