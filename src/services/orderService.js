import api from "./api";

// ==================== جلب جميع الطلبات ====================
export const getOrders = async (params = {}) => {
    // params: { limit, lastId, fields }
    const { data } = await api.get("/orders", { params });
    return data; // { success, data, pagination, message }
};

// ==================== جلب طلب واحد ====================
export const getOrderById = async (id) => {
    const { data } = await api.get(`/orders/${id}`);
    return data;
};

// ==================== تحديث حالة الطلب ====================
export const updateOrderStatus = async (id, status) => {
    const { data } = await api.patch(`/orders/${id}/status`, { status });
    return data;
};

// ==================== تحديث بيانات الطلب ====================
export const updateOrder = async (id, updateData) => {
    const { data } = await api.put(`/orders/${id}`, updateData);
    return data;
};

// ==================== إضافة طلب ====================
export const addOrder = async (orderData) => {
    const { data } = await api.post("/orders", orderData);
    return data;
};

// ==================== جلب الطلب النشط لسائق ====================
export const getActiveOrderByDriver = async (driverId) => {
    // نجلب الطلبات التي تخص السائق وحالتها "جاري" أو "مقبول"
    const { data } = await api.get("/orders", { 
        params: { 
            driverId, 
            status: "in_progress,accepted,جاري,مقبول", // دعم الصيغ الإنجليزية والعربية
            limit: 1 // جلب أحدث طلب نشط واحد
        } 
    });
    return data.data?.[0] || null;
};

// ==================== حذف طلب ====================
export const deleteOrder = async (id) => {
    const { data } = await api.delete(`/orders/${id}`);
    return data;
};
