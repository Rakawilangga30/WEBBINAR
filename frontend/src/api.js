import axios from 'axios';

// Arahkan ke Backend Go kamu
const API_BASE_URL = "http://localhost:8080/api";

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Interceptor: Setiap request otomatis selipkan Token JWT jika ada
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// --- FUNGSI-FUNGSI TAMBAHAN (Wajib Ada) ---

export const getMyEventDetail = async (eventID) => {
    const response = await api.get(`/organization/events/${eventID}`);
    return response.data;
};

export const updateEvent = async (eventID, data) => {
    const response = await api.put(`/organization/events/${eventID}`, data);
    return response.data;
};

export const updateSession = async (sessionID, data) => {
    const response = await api.put(`/organization/sessions/${sessionID}`, data);
    return response.data;
};

export const uploadEventThumbnail = async (eventID, file) => {
    const formData = new FormData();
    formData.append("thumbnail", file);
    const response = await api.post(`/organization/events/${eventID}/thumbnail`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

export default api;