import api from "./api";

/**
 * Uploads a system logo via the Backend
 * @param {File} file - The logo file to upload
 * @returns {Promise<string>} - The download URL of the uploaded logo
 */
export const uploadSystemLogo = async (file) => {
    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "system");

        const { data } = await api.post("/upload", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        if (data.success) {
            return data.data.url;
        } else {
            throw new Error(data.message || "فشل في رفع الشعار");
        }
    } catch (error) {
        console.error("Error uploading logo via backend:", error);
        throw new Error(error.message || "فشل في رفع الشعار عبر الخادم");
    }
};
