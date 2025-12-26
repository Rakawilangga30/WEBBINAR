import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get("/user/notifications");
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unread_count || 0);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/user/notifications/${id}/read`);
            fetchNotifications();
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put("/user/notifications/read-all");
            fetchNotifications();
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    const getTimeAgo = (dateString) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Baru saja";
        if (diffMins < 60) return `${diffMins} menit lalu`;
        if (diffHours < 24) return `${diffHours} jam lalu`;
        if (diffDays < 7) return `${diffDays} hari lalu`;
        return date.toLocaleDateString("id-ID");
    };

    return (
        <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "8px",
                    position: "relative",
                    fontSize: "1.3rem"
                }}
            >
                🔔
                {unreadCount > 0 && (
                    <span style={{
                        position: "absolute",
                        top: "2px",
                        right: "2px",
                        background: "#ef4444",
                        color: "white",
                        fontSize: "0.65rem",
                        fontWeight: "700",
                        padding: "2px 5px",
                        borderRadius: "10px",
                        minWidth: "16px",
                        textAlign: "center"
                    }}>
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    width: "340px",
                    background: "white",
                    borderRadius: "12px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                    zIndex: 1000,
                    overflow: "hidden"
                }}>
                    {/* Header */}
                    <div style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid #e2e8f0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                    }}>
                        <span style={{ fontWeight: "600", color: "#1e293b" }}>Notifikasi</span>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "#3b82f6",
                                    fontSize: "0.8rem",
                                    cursor: "pointer"
                                }}
                            >
                                Tandai semua dibaca
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div style={{ maxHeight: "350px", overflowY: "auto" }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8" }}>
                                <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🔕</div>
                                Tidak ada notifikasi
                            </div>
                        ) : (
                            notifications.slice(0, 5).map(notif => (
                                <div
                                    key={notif.id}
                                    onClick={() => !notif.is_read && markAsRead(notif.id)}
                                    style={{
                                        padding: "14px 16px",
                                        borderBottom: "1px solid #f1f5f9",
                                        background: notif.is_read ? "white" : "#eff6ff",
                                        cursor: notif.is_read ? "default" : "pointer",
                                        transition: "background 0.2s"
                                    }}
                                >
                                    <div style={{ fontWeight: "600", color: "#1e293b", marginBottom: "4px", fontSize: "0.9rem" }}>
                                        {notif.title}
                                    </div>
                                    <div style={{ color: "#64748b", fontSize: "0.85rem", lineHeight: "1.4" }}>
                                        {notif.message?.length > 80 ? notif.message.substring(0, 80) + "..." : notif.message}
                                    </div>
                                    <div style={{ color: "#94a3b8", fontSize: "0.75rem", marginTop: "6px" }}>
                                        {getTimeAgo(notif.created_at)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <Link
                            to="/dashboard/notifications"
                            onClick={() => setIsOpen(false)}
                            style={{
                                display: "block",
                                padding: "12px 16px",
                                textAlign: "center",
                                color: "#3b82f6",
                                textDecoration: "none",
                                borderTop: "1px solid #e2e8f0",
                                fontSize: "0.9rem",
                                fontWeight: "500"
                            }}
                        >
                            Lihat Semua Notifikasi
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
