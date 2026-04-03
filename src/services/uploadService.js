import api from "./api";

// ==================== رفع ملف ====================
export const uploadFile = async (file, folder = "general") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const { data } = await api.post("/upload", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    
    // data struct: { success, data: { url, name }, message }
    return data.data.url;
};
