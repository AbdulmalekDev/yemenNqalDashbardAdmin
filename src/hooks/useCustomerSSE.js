import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * SSE hook — يتصل بـ /api/customers/stream ويحدّث كاش React Query تلقائيًا
 * عند وصول أي تغيير من Firestore عبر الخادم.
 */
export const useCustomerSSE = () => {
    const queryClient = useQueryClient();
    const eventSourceRef = useRef(null);

    useEffect(() => {
        let cancelled = false;

        const connectSSE = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                if (!token) return;

                // إغلاق الاتصال السابق إن وُجد
                if (eventSourceRef.current) {
                    eventSourceRef.current.close();
                }

                // EventSource لا يدعم Headers مباشرة — نمرر التوكن كـ query param
                const url = `${API_BASE_URL}/customers/stream?token=${encodeURIComponent(token)}`;
                const es = new EventSource(url);
                eventSourceRef.current = es;

                es.onmessage = (event) => {
                    if (cancelled) return;
                    try {
                        const payload = JSON.parse(event.data);
                        if (payload.type === "customers_update" && payload.data) {
                            queryClient.setQueryData(["customers"], payload.data);
                        }
                    } catch {
                        // ignore malformed messages
                    }
                };

                es.onerror = () => {
                    // إعادة المحاولة تلقائيًا بعد 5 ثوانٍ
                    es.close();
                    if (!cancelled) {
                        setTimeout(connectSSE, 5000);
                    }
                };
            } catch (err) {
                console.error("SSE connection error:", err);
                if (!cancelled) {
                    setTimeout(connectSSE, 5000);
                }
            }
        };

        connectSSE();

        return () => {
            cancelled = true;
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, [queryClient]);
};
