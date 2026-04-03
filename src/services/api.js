import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==================== Request Interceptor ====================
// يرسل التوكن الخاص بالباكيند تلقائيًا مع كل طلب
api.interceptors.request.use(
  async (config) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.error("خطأ في جلب الرمز من localStorage:", err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==================== Response Interceptor ====================
// معالجة مركزية للأخطاء
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    let message = error.response?.data?.message || "حدث خطأ غير متوقع";

    if (!error.response) {
      console.error(" Network Error (No Response):", error);
      message = "خطأ في الشبكة أو تعطل السيرفر. يرجى التأكد من تشغيل الباكند.";
    } else {
      console.error(` API Error [${status}]:`, error.response.data);
    }

    if (status === 401) {
      console.warn("جلسة منتهية — يرجى تسجيل الدخول مجددًا");
      // منع التكرار اللانهائي إذا كنا بالفعل في صفحة تسجيل الدخول
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject({ status, message, original: error });
  }
);

export default api;
