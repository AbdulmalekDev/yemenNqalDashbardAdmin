import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getOrders,
    getOrderById,
    updateOrderStatus as updateStatusAPI,
} from "../services/orderService";

// ==================== جلب جميع الطلبات ====================
export const useOrders = (params = {}) => {
    return useQuery({
        queryKey: ["orders", params],
        queryFn: async () => {
            const result = await getOrders(params);
            return result; // نرجع النتيجة كاملة للميتا-داتا والصفحات
        },
        staleTime: 1000 * 60 * 2,
        refetchOnWindowFocus: true,
    });
};

// ==================== جلب طلب واحد ====================
export const useOrder = (id) => {
    return useQuery({
        queryKey: ["orders", id],
        queryFn: async () => {
            const result = await getOrderById(id);
            return result.data;
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 2,
    });
};

// ==================== تحديث حالة الطلب (مع Optimistic Update) ====================
export const useUpdateOrderStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }) => updateStatusAPI(id, status),

        // Optimistic Update
        onMutate: async ({ id, status }) => {
            await queryClient.cancelQueries({ queryKey: ["orders"] });

            const previousOrders = queryClient.getQueryData(["orders"]);

            queryClient.setQueriesData({ queryKey: ["orders"] }, (old) => {
                if (!old) return old;
                const updateList = (list) => list.map((order) =>
                    order.id === id ? { ...order, status } : order
                );

                if (Array.isArray(old)) return updateList(old);
                if (old.data && Array.isArray(old.data)) {
                    return { ...old, data: updateList(old.data) };
                }
                return old;
            });

            // Also update the single order cache
            const previousOrder = queryClient.getQueryData(["orders", id]);
            if (previousOrder) {
                queryClient.setQueryData(["orders", id], {
                    ...previousOrder,
                    status,
                });
            }

            return { previousOrders, previousOrder };
        },

        onError: (_err, { id }, context) => {
            if (context?.previousOrders) {
                queryClient.setQueryData(["orders"], context.previousOrders);
            }
            if (context?.previousOrder) {
                queryClient.setQueryData(["orders", id], context.previousOrder);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
    });
};
