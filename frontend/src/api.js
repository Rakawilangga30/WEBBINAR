import axios from "axios";

// 1. Konfigurasi Dasar
const API_BASE_URL = "http://localhost:8080/api";

const api = axios.create({
    baseURL: API_BASE_URL,
});

// ============================================================
// 2. INTERCEPTOR (Agar Token Otomatis Terkirim)
// ============================================================
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle jika token expired (401)
        if (error.response && error.response.status === 401) {
            if (window.location.pathname !== "/login") {
                console.warn("Sesi habis, logout otomatis...");
                localStorage.clear();
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

// ============================================================
// 3. FUNGSI HELPER (Wajib Ada untuk Organization & Events)
// ============================================================

// Mengambil detail event untuk halaman Manage
export const getMyEventDetail = async (eventID) => {
    const response = await api.get(`/organization/events/${eventID}`);
    return response.data;
};

// Update data text event
export const updateEvent = async (eventID, data) => {
    const response = await api.put(`/organization/events/${eventID}`, data);
    return response.data;
};

// Update session
export const updateSession = async (sessionID, data) => {
    const response = await api.put(`/organization/sessions/${sessionID}`, data);
    return response.data;
};

// Upload Thumbnail Event (Ini yang menyebabkan error sebelumnya)
export const uploadEventThumbnail = async (eventID, file) => {
    const formData = new FormData();
    formData.append("thumbnail", file); // Key harus sesuai dengan backend ("thumbnail")
    
    const response = await api.post(`/organization/events/${eventID}/thumbnail`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

// 1. Buat Sesi Baru
export const createSession = async (eventID, data) => {
    const response = await api.post(`/organization/events/${eventID}/sessions`, data);
    return response.data;
};

// 2. Hapus Sesi
export const deleteSession = async (sessionID) => {
    const response = await api.delete(`/organization/sessions/${sessionID}`);
    return response.data;
};

// 3. Upload Video ke Sesi
export const uploadSessionVideo = async (sessionID, file) => {
    const formData = new FormData();
    formData.append("video", file); // Key backend: "video"
    const response = await api.post(`/organization/sessions/${sessionID}/videos`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

// 4. Upload File (PDF) ke Sesi
export const uploadSessionFile = async (sessionID, file) => {
    const formData = new FormData();
    formData.append("file", file); // Key backend: "file"
    const response = await api.post(`/organization/sessions/${sessionID}/files`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

// 5. Publish/Unpublish Event
export const setEventPublishStatus = async (eventID, isPublish) => {
    const endpoint = isPublish ? "publish" : "unpublish";
    const response = await api.put(`/organization/events/${eventID}/${endpoint}`);
    return response.data;
};

// Export Default
export default api;