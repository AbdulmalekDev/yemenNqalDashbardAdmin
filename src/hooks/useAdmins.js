import { useQuery } from '@tanstack/react-query';
import { fetchAdmins } from '../services/adminService';

// ==================== جلب قائمة المدراء ====================
export const useAdmins = () => {
  return useQuery({
    queryKey: ['admins', 'list'],
    queryFn: async () => {
      const response = await fetchAdmins();
      // استخراج المصفوفة من { success, data }
      return response.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
};
