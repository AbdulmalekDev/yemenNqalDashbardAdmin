import api from "./api";

// ==================== جلب جميع الإداريين ====================
export const fetchAdmins = async () => {
    const { data } = await api.get("/admin/users");
    console.log("Fetched Admins:", data);
    return data;
};

// ==================== إنشاء حساب إداري جديد ====================
export const createAdminAccount = async (adminData) => {
    // adminData يمكن أن يحتوي على: name, email, password, role, phone, permissions
    const { data } = await api.post("/admin/signup", adminData);
    return data;
};

// ==================== تعديل بيانات المستخدم ====================
export const updateAdmin = async (uid, updateData) => {
    // updateData يمكن أن يحتوي على: name, role, phone, permissions
    const { data } = await api.put(`/admin/users/${uid}`, updateData);
    return data;
};

// ==================== تفعيل أو تعطيل الحساب ====================
export const toggleAdminStatus = async (uid, isActive) => {
    const { data } = await api.patch(`/admin/users/${uid}/status`, { disabled: !isActive });
    return data;
};

// ==================== حذف الحساب ====================
export const deleteAdminAccount = async (uid) => {
    const { data } = await api.delete(`/admin/users/${uid}`);
    return data;
};