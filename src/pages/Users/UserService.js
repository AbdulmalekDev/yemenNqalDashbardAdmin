import api from "../../services/api";

export const getUsers = async ({ lastId, limit = 10 } = {}) => {
    const params = { limit };
    if (lastId) params.lastId = lastId;
    
    const { data } = await api.get("/admin/users", { params });
    return data;
};

export const addUser = async (userData) => {
    const { data } = await api.post("/admin/signup", userData);
    return data;
};

export const updateUser = async (uid, userData) => {
    // نستخدم PUT لتحديث البيانات الأساسية (الاسم، الدور)
    const { data } = await api.put(`/admin/users/${uid}`, userData);
    return data;
};

export const toggleUserStatus = async (uid, disabled) => {
    const { data } = await api.patch(`/admin/users/${uid}/status`, { disabled });
    return data;
};

export const deleteUser = async (uid) => {
    const { data } = await api.delete(`/admin/users/${uid}`);
    return data;
};
