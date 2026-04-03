import api from "./api";

// ==================== جلب جميع السائقين ====================
export const getDrivers = async (params = {}) => {
    // params: { page, limit, fields }
    const { data } = await api.get("/drivers", { params });
    return data; // { success, data, pagination, message }
};

// ==================== جلب سائق واحد ====================
export const getDriverById = async (id) => {
    const { data } = await api.get(`/drivers/${id}`);
    return data;
};

// ==================== تحديث حالة السائق ====================
export const updateDriverStatus = async (id, status) => {
    const { data } = await api.patch(`/drivers/${id}/status`, { status });
    return data;
};

// ==================== توثيق السائق (قبول/رفض) ====================
export const verifyDriver = async (id, status) => {
    // status: "accepted" | "rejected"
    const { data } = await api.put(`/drivers/${id}/verify`, { status });
    return data;
};

// ==================== تحديث بيانات السائق ====================
export const updateDriver = async (id, updateData) => {
    const { data } = await api.put(`/drivers/${id}`, updateData);
    return data;
};

// ==================== إضافة سائق ====================
export const addDriver = async (driverData) => {
    const { data } = await api.post("/drivers", driverData);
    return data;
};

// ==================== حذف سائق ====================
export const deleteDriver = async (id) => {
    const { data } = await api.delete(`/drivers/${id}`);
    return data;
};
