import api from "./api";

// ==================== جلب الإعدادات ====================
export const getSettings = async () => {
    const { data } = await api.get("/settings");
    return data; // { success, data, message }
};

// ==================== تحديث الإعدادات ====================
export const updateSettings = async (settingsData) => {
    const { data } = await api.patch("/settings", settingsData);
    return data;
};
// ==================== جلب الإعدادات العامة ====================
export const getPublicSettings = async () => {
    const { data } = await api.get("/settings/public");
    return data;
};
