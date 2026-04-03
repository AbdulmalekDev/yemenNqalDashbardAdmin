import api from "./api";

// ==================== تسجيل الدخول عبر Backend ====================
// نقوم بإرسال البريد الإلكتروني وكلمة المرور مباشرة للباكيند
export const loginWithBackend = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    // الباكيند يجب أن يعيد توكن (JWT) وبيانات المستخدم
    if (data.token) {
        localStorage.setItem('adminToken', data.token);
    }
    return data;
};

// ==================== تسجيل الخروج ====================
export const logoutFromBackend = async () => {
    localStorage.removeItem('adminToken');
    // اختياري: إبلاغ الباكيند بتسجيل الخروج
    try {
        await api.post("/auth/logout");
    } catch (err) {
        console.warn("Logout request failed, but local session cleared.");
    }
};

// ==================== جلب بيانات المستخدم الحالي ====================
export const getCurrentUser = async () => {
    const { data } = await api.get("/auth/me");
    return data; // { success, data: { uid, email, role, ... }, message }
};

// ==================== تحديث الملف الشخصي ====================
export const updateProfile = async (profileData) => {
    const { data } = await api.patch("/auth/update-profile", profileData);
    return data;
};

// ==================== تغيير كلمة المرور ====================
export const updatePassword = async (passwordData) => {
    const { data } = await api.patch("/auth/update-password", passwordData);
    return data;
};
