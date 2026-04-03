import { useQuery } from "@tanstack/react-query";
import { getReports } from "../services/reportsService";

// ==================== جلب التقارير ====================
export const useReports = () => {
    return useQuery({
        queryKey: ["reports"],
        queryFn: async () => {
            const result = await getReports();
            return result.data; // unwrap { success, data, message } → data
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: true,
    });
};
