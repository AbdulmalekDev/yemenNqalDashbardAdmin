import api from "./api";

// ==================== جلب إحصائيات لوحة التحكم ====================
export const getDashboardStats = async () => {
    const { data } = await api.get("/dashboard");
    return data; // { success, data, message }
};
