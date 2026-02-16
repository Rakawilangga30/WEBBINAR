/**
 * URL Helper untuk mendapatkan base URL backend.
 * Di lokal: http://localhost:8080
 * Di production: URL Railway (dari env variable VITE_BACKEND_URL)
 */
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

/**
 * Menghasilkan URL lengkap ke resource backend (gambar, video, file, dll).
 * @param {string} path - Path relatif, contoh: "uploads/events/thumbnail.jpg"
 * @returns {string} URL lengkap, contoh: "https://xxx.up.railway.app/uploads/events/thumbnail.jpg"
 */
export function getBackendUrl(path) {
    if (!path) return '';
    // If path is already an absolute URL (e.g. Supabase public URL), return as-is
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    const cleanPath = path.replace(/^\/+/, '').replace(/\\/g, '/');
    return `${BACKEND_URL}/${cleanPath}`;
}

/**
 * Base URL backend (tanpa trailing slash).
 * Gunakan ini jika perlu membuat URL sendiri.
 */
export { BACKEND_URL };
