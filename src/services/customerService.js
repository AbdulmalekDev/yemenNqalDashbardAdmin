import api from "./api";

// ==================== جلب جميع العملاء ====================
export const getCustomers = async (params = {}) => {
    // params: { page, limit, fields }
    const { data } = await api.get("/customers", { params });
    return data; // { success, data, pagination, message }
};

// ==================== جلب عميل واحد ====================
export const getCustomerById = async (id) => {
    const { data } = await api.get(`/customers/${id}`);
    return data;
};

// ==================== تحديث حالة العميل ====================
export const updateCustomerStatus = async (id, status) => {
    const { data } = await api.patch(`/customers/${id}/status`, { status });
    return data;
};

// ==================== تحديث بيانات العميل ====================
export const updateCustomer = async (id, updateData) => {
    const { data } = await api.put(`/customers/${id}`, updateData);
    return data;
};

// ==================== إضافة عميل ====================
export const addCustomer = async (customerData) => {
    const { data } = await api.post("/customers", customerData);
    return data;
};

// ==================== حذف عميل ====================
export const deleteCustomer = async (id) => {
    const { data } = await api.delete(`/customers/${id}`);
    return data;
};
