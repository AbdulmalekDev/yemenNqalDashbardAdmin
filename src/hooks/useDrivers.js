import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import {
    getDrivers,
    getDriverById,
    updateDriverStatus as updateStatusAPI,
    verifyDriver as verifyDriverAPI,
    addDriver as addDriverAPI,
    updateDriver as updateDriverAPI,
    deleteDriver as deleteDriverAPI,
} from "../services/driverService";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ==================== جلب جميع السائقين ====================
export const useDrivers = (params = {}) => {
    return useQuery({
        queryKey: ["drivers", params],
        queryFn: async () => {
            const result = await getDrivers(params);
            // نعيد النتيجة كاملة لتشمل الـ pagination
            return result; 
        },
        staleTime: 1000 * 60 * 2,
        refetchOnWindowFocus: true,
    });
};

// ==================== جلب سائق واحد ====================
export const useDriver = (id) => {
    return useQuery({
        queryKey: ["drivers", id],
        queryFn: async () => {
            const result = await getDriverById(id);
            return result.data;
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 2,
    });
};

// ==================== توثيق السائق (مع Optimistic Update) ====================
export const useUpdateDriverStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }) => {
            // الإيقاف (معلق) → PATCH /drivers/:id/status (يقبل اللغة العربية)
            // القبول/الرفض   → PUT  /drivers/:id/verify  (يقبل accepted/rejected فقط)
            if (status === 'معلق' || status === 'pending') {
                return updateStatusAPI(id, 'معلق');
            }
            const mappedStatus = status === 'مقبول' ? 'accepted' : status === 'مرفوض' ? 'rejected' : status;
            return verifyDriverAPI(id, mappedStatus);
        },

        // Optimistic Update
        onMutate: async ({ id, status }) => {
            await queryClient.cancelQueries({ queryKey: ["drivers"] });

            const previousDrivers = queryClient.getQueryData(["drivers"]);

            // نحول الحالة للعربية للتخزين في الكاش المحلي ليتوافق مع الواجهات
            const dbStatus = status === 'accepted' ? 'مقبول' : status === 'rejected' ? 'مرفوض' : status;

            queryClient.setQueryData(["drivers"], (old) => {
                if (!old) return old;
                return old.map((driver) =>
                    driver.id === id ? { ...driver, verificationStatus: dbStatus } : driver
                );
            });

            // Also update the single driver cache if it exists
            const previousDriver = queryClient.getQueryData(["drivers", id]);
            if (previousDriver) {
                queryClient.setQueryData(["drivers", id], {
                    ...previousDriver,
                    verificationStatus: dbStatus,
                });
            }

            return { previousDrivers, previousDriver };
        },

        onError: (_err, { id }, context) => {
            if (context?.previousDrivers) {
                queryClient.setQueryData(["drivers"], context.previousDrivers);
            }
            if (context?.previousDriver) {
                queryClient.setQueryData(["drivers", id], context.previousDriver);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["drivers"] });
        },
    });
};

// ==================== إضافة سائق جديد ====================
export const useAddDriver = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: addDriverAPI,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["drivers"] });
        },
    });
};

// ==================== تحديث بيانات السائق ====================
export const useUpdateDriver = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => updateDriverAPI(id, data),
        onSuccess: (data, { id }) => {
            queryClient.invalidateQueries({ queryKey: ["drivers"] });
            queryClient.invalidateQueries({ queryKey: ["drivers", id] });
        },
    });
};

// ==================== حذف سائق ====================
export const useDeleteDriver = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => deleteDriverAPI(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["drivers"] });
        },
    });
};

// ==================== SSE: بث تحديثات السائقين المباشرة ====================
export const useDriversSSE = () => {
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

                const url = `${API_BASE_URL}/drivers/stream?token=${encodeURIComponent(token)}`;
                const es = new EventSource(url);
                eventSourceRef.current = es;

                es.onmessage = (event) => {
                    if (cancelled) return;
                    try {
                        const payload = JSON.parse(event.data);
                        if (payload.type === "drivers_update" && Array.isArray(payload.data)) {
                            // نقوم بتحديث كاش السائقين بالقائمة الجديدة (البيانات الحية المحدثة)
                            const updatedDriversList = payload.data;
                            
                            // Iterate through the query cache and update all "drivers" queries
                            queryClient.setQueriesData({ queryKey: ["drivers"] }, (old) => {
                                if (!old || !old.data) return old;
                                
                                // if old is a single driver object
                                if (!Array.isArray(old.data)) {
                                     // (not a list, ignore)
                                     return old;
                                }

                                // Merging real-time data with currently viewed page
                                // Since SSE sends all drivers, for a robust paginated view we update the specific ones that are visible,
                                // or simply replace the list if pagination matches (simplification: we map updates).
                                const updatedPageData = old.data.map(existingDriver => {
                                    const refreshed = updatedDriversList.find(d => d.id === existingDriver.id);
                                    return refreshed || existingDriver;
                                });

                                return {
                                    ...old,
                                    data: updatedPageData
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
