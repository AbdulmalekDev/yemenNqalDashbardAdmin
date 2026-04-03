import api from "./api";

// ==================== جلب إحصائيات الإيرادات ====================
export const getRevenueStats = async () => {
    const { data } = await api.get("/revenues/stats");
    return data; // { success, data, message }
};

// ==================== جلب جميع الإيرادات ====================
export const getRevenues = async () => {
    const { data } = await api.get("/revenues");
    return data;
};
