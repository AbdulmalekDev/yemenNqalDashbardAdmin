import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getDrivers,
    getDriverById,
    updateDriverStatus as updateStatusAPI,
    verifyDriver as verifyDriverAPI,
    addDriver as addDriverAPI,
    updateDriver as updateDriverAPI,
} from "../services/driverService";

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
