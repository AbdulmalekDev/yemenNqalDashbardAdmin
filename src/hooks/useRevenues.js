import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getRevenueStats } from "../services/revenueService";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// ==================== جلب إحصائيات الإيرادات ====================
export const useRevenueStats = () => {
    return useQuery({
        queryKey: ["revenueStats"],
        queryFn: async () => {
            const result = await getRevenueStats();
            return result.data; // unwrap { success, data, message } → data
        },
        staleTime: 1000 * 60 * 2,
        refetchOnWindowFocus: true,
    });
};

// ==================== SSE: بث تحديثات الإيرادات ====================
export const useRevenueSSE = () => {
    const queryClient = useQueryClient();
    const eventSourceRef = useRef(null);

    useEffect(() => {
        let cancelled = false;

        const connectSSE = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                if (!token) return;

                if (eventSourceRef.current) {
                    eventSourceRef.current.close();
                }

                const url = `${API_BASE_URL}/revenues/stream?token=${encodeURIComponent(token)}`;
                const es = new EventSource(url);
                eventSourceRef.current = es;

                es.onmessage = (event) => {
                    if (cancelled) return;
                    try {
                        const payload = JSON.parse(event.data);
                        if (payload.type === "revenue_update" && payload.data) {
                            queryClient.setQueryData(["revenueStats"], (old) => {
                                if (!old) return old;
                                return {
                                    ...old,
                                    todayRevenue: payload.data.todayRevenue,
                                    completedOrders: payload.data.completedOrders,
                                };
                            });
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
