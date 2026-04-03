import api from "./api";

// ==================== جلب التقارير ====================
export const getReports = async () => {
    const { data } = await api.get("/reports");
    return data; // { success, data, message }
};
