import { useQuery } from "@tanstack/react-query";

/**
 * useTrackingSSE - هوك تم تعديله ليكون مجرد قشرة (Proxy)
 * يجلب البيانات من كاش React Query الذي يحدثه المسار المركزي الموحد
 */
export const useTrackingSSE = () => {
    const { data: trackingData = {} } = useQuery({
        queryKey: ['tracking'],
        staleTime: Infinity,
    });

    return { trackingData };
};
