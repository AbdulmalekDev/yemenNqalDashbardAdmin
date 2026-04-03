import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getDashboardStats } from "../services/dashboardService";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// ==================== جلب إحصائيات لوحة التحكم ====================
export const useDashboard = () => {
    return useQuery({
        queryKey: ["dashboard"],
        queryFn: async () => {
            const result = await getDashboardStats();
            return result.data; // unwrap { success, data, message } → data
        },
        staleTime: 1000 * 60 * 2,
        refetchOnWindowFocus: true,
    });
};

// ==================== SSE: بث إحصائيات لوحة التحكم ====================
export const useDashboardSSE = () => {
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

                const url = `${API_BASE_URL}/dashboard/stream?token=${encodeURIComponent(token)}`;
                const es = new EventSource(url);
                eventSourceRef.current = es;

                es.onmessage = (event) => {
                    if (cancelled) return;
                    try {
                        const payload = JSON.parse(event.data);
                        if (payload.type === "dashboard_update" && payload.data) {
                            // تحديث الإحصائيات فقط (stats) مع الحفاظ على باقي البيانات
                            queryClient.setQueryData(["dashboard"], (old) => {
                                if (!old) return old;
                                return { ...old, stats: payload.data.stats };
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
