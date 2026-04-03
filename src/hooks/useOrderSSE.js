import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * SSE hook — يتصل بـ /api/orders/stream ويحدّث كاش React Query تلقائيًا
 * عند وصول أي تغيير من Firestore عبر الخادم.
 */
export const useOrderSSE = () => {
    const queryClient = useQueryClient();
    const eventSourceRef = useRef(null);

    useEffect(() => {
        let cancelled = false;

        const connectSSE = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                if (!token) return;

                // Close previous connection
                if (eventSourceRef.current) {
                    eventSourceRef.current.close();
                }

                const url = `${API_BASE_URL}/orders/stream?token=${encodeURIComponent(token)}`;
                const es = new EventSource(url);
                eventSourceRef.current = es;

                es.onmessage = (event) => {
                    if (cancelled) return;
                    try {
                        const payload = JSON.parse(event.data);
                        if (payload.type === "orders_update" && payload.data) {
                            queryClient.setQueryData(["orders"], payload.data);
                        }
                    } catch {
                        // ignore malformed messages
                    }
                };

                es.onerror = () => {
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
