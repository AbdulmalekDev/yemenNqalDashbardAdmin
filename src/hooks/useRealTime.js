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
                    // تحديث كاش القائمة الكاملة
                    queryClient.setQueryData(["drivers"], data);
                    break;

                case "drivers/added":
                    // إضافة سائق جديد للكاش دون إعادة الجلب
                    queryClient.setQueryData(["drivers"], (old = []) => {
                        const exists = old.some((d) => d.id === data.id);
                        return exists ? old : [data, ...old];
                    });
                    break;

                case "drivers/updated":
                    // تحديث السائق المعدّل في القائمة
                    queryClient.setQueryData(["drivers"], (old = []) =>
                        old.map((d) => (d.id === data.id ? { ...d, ...data } : d))
                    );
                    // تحديث كاش السائق الفردي أيضاً إن وُجد
                    queryClient.setQueryData(["drivers", data.id], (old) =>
                        old ? { ...old, ...data } : data
                    );
                    break;

                case "drivers/deleted":
                    queryClient.setQueryData(["drivers"], (old = []) =>
                        old.filter((d) => d.id !== data.id)
                    );
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
                    break;

                case "orders/updated":
                    queryClient.setQueryData(["orders"], (old = []) =>
                        old.map((o) => (o.id === data.id ? { ...o, ...data } : o))
                    );
                    queryClient.setQueryData(["orders", data.id], (old) =>
                        old ? { ...old, ...data } : data
                    );
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
                    break;

                case "customers/updated":
                    queryClient.setQueryData(["customers"], (old = []) =>
                        old.map((c) => (c.id === data.id ? { ...c, ...data } : c))
                    );
                    queryClient.setQueryData(["customers", data.id], (old) =>
                        old ? { ...old, ...data } : data
                    );
                    break;

                case "customers/deleted":
                    queryClient.setQueryData(["customers"], (old = []) =>
                        old.filter((c) => c.id !== data.id)
                    );
                    break;

                // ── الإيرادات ─────────────────────────────────────────────────
                case "revenues/list":
                    queryClient.setQueryData(["revenues"], data);
                    break;

                // ── حالة الاتصال ──────────────────────────────────────────────
                case "connection/established":
                    retryCountRef.current = 0; // إعادة تعيين عداد المحاولات عند نجاح الاتصال
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
