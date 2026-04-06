import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getCustomers,
    getCustomerById,
    updateCustomerStatus as updateStatusAPI,
    addCustomer as addCustomerAPI,
    updateCustomer as updateCustomerAPI,
    deleteCustomer as deleteCustomerAPI,
} from "../services/customerService";

// ==================== جلب جميع العملاء ====================
export const useCustomers = (params = {}) => {
    return useQuery({
        queryKey: ["customers", params],
        queryFn: async () => {
            const result = await getCustomers(params);
            return result; // نرجع النتيجة كاملة للميتا-داتا والصفحات
        },
        staleTime: 1000 * 60 * 2, // دقيقتان
        refetchOnWindowFocus: true,
    });
};

// ==================== جلب عميل واحد ====================
export const useCustomer = (id) => {
    return useQuery({
        queryKey: ["customers", id],
        queryFn: async () => {
            const result = await getCustomerById(id);
            return result.data;
        },
        enabled: !!id, // لا تجلب إذا لم يكن هناك id
        staleTime: 1000 * 60 * 2,
    });
};

// ==================== تحديث حالة العميل (مع Optimistic Update) ====================
export const useUpdateCustomerStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }) => updateStatusAPI(id, status),

        // Optimistic Update
        onMutate: async ({ id, status }) => {
            // إلغاء أي استعلامات جارية
            await queryClient.cancelQueries({ queryKey: ["customers"] });

            // حفظ البيانات السابقة للتراجع عند الخطأ
            const previousCustomers = queryClient.getQueryData(["customers"]);

            // تحديث فوري في الكاش
            queryClient.setQueryData(["customers"], (old) => {
                if (!old) return old;
                return old.map((customer) =>
                    customer.id === id ? { ...customer, status } : customer
                );
            });

            return { previousCustomers };
        },

        // التراجع عند حدوث خطأ
        onError: (_err, _vars, context) => {
            if (context?.previousCustomers) {
                queryClient.setQueryData(["customers"], context.previousCustomers);
            }
        },

        // إعادة الجلب بعد الانتهاء (نجاح أو فشل)
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
        },
    });
};

// ==================== إضافة عميل جديد ====================
export const useAddCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: addCustomerAPI,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
        },
    });
};

// ==================== تحديث بيانات العميل ====================
export const useUpdateCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => updateCustomerAPI(id, data),
        onSuccess: (data, { id }) => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            queryClient.invalidateQueries({ queryKey: ["customers", id] });
        },
    });
};

// ==================== حذف عميل ====================
export const useDeleteCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => deleteCustomerAPI(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
        },
    });
};
