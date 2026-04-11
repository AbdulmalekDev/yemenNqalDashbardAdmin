import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const RECONNECT_DELAY_MS = 5000;

/**
 * useRealTime — هوك مركزي يربط الواجهة بـ /api/stream
 *
 * تدفق البيانات:
 * Firestore → Backend onSnapshot() → SSE Event → هذا الهوك → React Query Cache → UI
 *
 * الأحداث المدعومة:
 *   drivers/list, drivers/added, drivers/updated, drivers/deleted
 *   orders/list,   orders/added,  orders/updated,  orders/deleted
 *   customers/list, customers/added, customers/updated, customers/deleted
 *   revenues/list
 *   connection/established
 *   error
 */
export const useRealTime = () => {
    const queryClient = useQueryClient();
    const eventSourceRef = useRef(null);
    const retryCountRef = useRef(0);
    const cancelledRef = useRef(false);

    // ── معالج الحدث المركزي ─────────────────────────────────────────────────────
    const handleEvent = useCallback(
        (payload) => {
            const { type, data } = payload;

            switch (type) {
                // ── السائقون ──────────────────────────────────────────────────
                case "drivers/list":
                    queryClient.setQueryData(["drivers"], data);
                    break;

                case "drivers/added":
                    queryClient.setQueryData(["drivers"], (old = []) => {
                        const exists = old.some((d) => d.id === data.id);
                        return exists ? old : [data, ...old];
                    });
                    // تحديث إحصائيات لوحة التحكم
                    queryClient.setQueryData(["dashboard"], (old) => {
                        if (!old || !old.stats) return old;
                        return { 
                            ...old, 
                            stats: { 
                                ...old.stats, 
                                totalDrivers: old.stats.totalDrivers + 1,
                                offlineDrivers: (old.stats.offlineDrivers || 0) + 1 
                            } 
                        };
                    });
                    break;

                case "drivers/updated":
                    queryClient.setQueryData(["drivers"], (old = []) => {
                        const updatedList = old.map((d) => (d.id === data.id ? { ...d, ...data } : d));
                        // تحديث الإحصائيات إذا تغيرت حالة الاتصال
                        const oldDoc = old.find(d => d.id === data.id);
                        if (oldDoc && data.isOnline !== undefined && oldDoc.isOnline !== data.isOnline) {
                            queryClient.setQueryData(["dashboard"], (dash) => {
                                if (!dash || !dash.stats) return dash;
                                const isOnline = data.isOnline;
                                return {
                                    ...dash,
                                    stats: {
                                        ...dash.stats,
                                        connectedDrivers: dash.stats.connectedDrivers + (isOnline ? 1 : -1),
                                        offlineDrivers: dash.stats.offlineDrivers + (isOnline ? -1 : 1)
                                    }
                                };
                            });
                        }
                        return updatedList;
                    });
                    queryClient.setQueryData(["drivers", data.id], (old) =>
                        old ? { ...old, ...data } : data
                    );
                    break;

                case "drivers/deleted":
                    queryClient.setQueryData(["drivers"], (old = []) =>
                        old.filter((d) => d.id !== data.id)
                    );
                    queryClient.setQueryData(["dashboard"], (old) => {
                        if (!old || !old.stats) return old;
                        return { ...old, stats: { ...old.stats, totalDrivers: Math.max(0, old.stats.totalDrivers - 1) } };
                    });
                    break;

                // ── الطلبات ───────────────────────────────────────────────────
                case "orders/list":
                    queryClient.setQueryData(["orders"], data);
                    break;

                case "orders/added":
                    queryClient.setQueryData(["orders"], (old = []) => {
                        const exists = old.some((o) => o.id === data.id);
                        return exists ? old : [data, ...old];
                    });
                    queryClient.setQueryData(["dashboard"], (old) => {
                        if (!old || !old.stats) return old;
                        return { 
                            ...old, 
                            stats: { ...old.stats, activeOrders: old.stats.activeOrders + 1 } 
                        };
                    });
                    break;

                case "orders/updated":
                    queryClient.setQueryData(["orders"], (old = []) =>
                        old.map((o) => (o.id === data.id ? { ...o, ...data } : o))
                    );
                    // تحديث الإحصائيات (مثلاً إذا اكتمل الطلب)
                    queryClient.setQueryData(["dashboard"], (dash) => {
                        if (!dash || !dash.stats) return dash;
                        const isCompleted = ["completed", "rated", "مكتمل"].includes(data.status);
                        if (isCompleted) {
                            return {
                                ...dash,
                                stats: {
                                    ...dash.stats,
                                    activeOrders: Math.max(0, dash.stats.activeOrders - 1),
                                    completedToday: dash.stats.completedToday + 1,
                                    todayRevenue: dash.stats.todayRevenue + Number(data.price || data.estimatedPrice || 0)
                                }
                            };
                        }
                        return dash;
                    });
                    break;

                case "orders/deleted":
                    queryClient.setQueryData(["orders"], (old = []) =>
                        old.filter((o) => o.id !== data.id)
                    );
                    break;

                // ── العملاء ───────────────────────────────────────────────────
                case "customers/list":
                    queryClient.setQueryData(["customers"], data);
                    break;

                case "customers/added":
                    queryClient.setQueryData(["customers"], (old = []) => {
                        const exists = old.some((c) => c.id === data.id);
                        return exists ? old : [data, ...old];
                    });
                    queryClient.setQueryData(["dashboard"], (old) => {
                        if (!old || !old.stats) return old;
                        return { 
                            ...old, 
                            stats: { ...old.stats, totalCustomers: old.stats.totalCustomers + 1 } 
                        };
                    });
                    break;

                case "customers/updated":
                    queryClient.setQueryData(["customers"], (old = []) =>
                        old.map((c) => (c.id === data.id ? { ...c, ...data } : c))
                    );
                    break;

                case "customers/deleted":
                    queryClient.setQueryData(["customers"], (old = []) =>
                        old.filter((c) => c.id !== data.id)
                    );
                    queryClient.setQueryData(["dashboard"], (old) => {
                        if (!old || !old.stats) return old;
                        return { 
                            ...old, 
                            stats: { ...old.stats, totalCustomers: Math.max(0, old.stats.totalCustomers - 1) } 
                        };
                    });
                    break;

                case "revenues/list":
                    queryClient.setQueryData(["revenues"], data);
                    break;

                // ── التتبع ────────────────────────────────────────────────────
                case "tracking/added":
                case "tracking/updated":
                    queryClient.setQueryData(["tracking"], (old = {}) => ({
                        ...old,
                        [data.id]: data
                    }));
                    break;

                case "tracking/deleted":
                    queryClient.setQueryData(["tracking"], (old = {}) => {
                        const newTracking = { ...old };
                        delete newTracking[data.id];
                        return newTracking;
                    });
                    break;

                // ── التنبيهات ──────────────────────────────────────────────────
                case "notifications/added":
                    queryClient.setQueryData(["notifications"], (old = []) => {
                        const exists = old.some(n => n.id === data.id);
                        if (exists) return old;
                        return [data, ...old].slice(0, 50); // الاحتفاظ بآخر 50
                    });
                    // قد ترغب في تحديث عداد التنبيهات غير المقروءة هنا لو كان مستقلاً
                    break;

                case "notifications/updated":
                    queryClient.setQueryData(["notifications"], (old = []) =>
                        old.map(n => n.id === data.id ? { ...n, ...data } : n)
                    );
                    break;

                case "notifications/deleted":
                    queryClient.setQueryData(["notifications"], (old = []) =>
                        old.filter(n => n.id !== data.id)
                    );
                    break;

                // ── حالة الاتصال ──────────────────────────────────────────────
                case "connection/established":
                    retryCountRef.current = 0; 
                    break;

                case "error":
                    console.error("[SSE] Server error:", data);
                    break;

                default:
                    break;
            }
        },
        [queryClient]
    );

    // ── إنشاء اتصال SSE ─────────────────────────────────────────────────────────
    const connectSSE = useCallback(async () => {
        if (cancelledRef.current) return;

        try {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                // المستخدم غير مسجل دخوله بعد، نحاول مرة أخرى بعد 3 ثوانٍ
                setTimeout(connectSSE, 3000);
                return;
            }

            // إغلاق الاتصال القديم إن وُجد
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }

            const url = `${API_BASE_URL}/stream?token=${encodeURIComponent(token)}`;
            const es = new EventSource(url);
            eventSourceRef.current = es;

            // استقبال الأحداث
            es.onmessage = (event) => {
                if (cancelledRef.current) return;
                try {
                    const payload = JSON.parse(event.data);
                    handleEvent(payload);
                } catch {
                    // تجاهل الرسائل غير الصالحة (مثل heartbeat)
                }
            };

            // إعادة الاتصال عند الانقطاع تلقائياً
            es.onerror = () => {
                es.close();
                if (cancelledRef.current) return;
                retryCountRef.current += 1;
                const delay = Math.min(RECONNECT_DELAY_MS * retryCountRef.current, 30000);
                console.warn(`[SSE] Connection lost. Reconnecting in ${delay / 1000}s...`);
                setTimeout(connectSSE, delay);
            };
        } catch (err) {
            console.error("[SSE] Connection error:", err);
            if (!cancelledRef.current) {
                setTimeout(connectSSE, RECONNECT_DELAY_MS);
            }
        }
    }, [handleEvent]);

    useEffect(() => {
        cancelledRef.current = false;
        connectSSE();

        return () => {
            cancelledRef.current = true;
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, [connectSSE]);
};
