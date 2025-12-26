import { useState, useEffect } from "react";
import api from "../../api";

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get("/user/notifications");
            setNotifications(res.data.notifications || []);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
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

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case "application_approved": return "🎉";
            case "application_rejected": return "❌";
            case "new_session": return "📚";
            case "new_purchase": return "💰";
            case "profile_updated": return "👤";
            case "new_application": return "📝";
            case "role_changed": return "🔄";
            case "account_warning": return "⚠️";
            default: return "🔔";
        }
    };

    if (loading) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <div style={{
                    width: "32px", height: "32px",
                    border: "3px solid #e2e8f0", borderTopColor: "#3b82f6",
                    borderRadius: "50%", animation: "spin 1s linear infinite",
                    margin: "0 auto 12px"
                }}></div>
                Memuat notifikasi...
            </div>
        );
    }

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                    <h2 style={{ margin: "0 0 4px 0", color: "#1e293b", fontSize: "1.5rem" }}>
                        🔔 Notifikasi
                    </h2>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                        {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : "Semua notifikasi sudah dibaca"}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        style={{
                            padding: "10px 16px",
                            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: "500",
                            fontSize: "0.9rem"
                        }}
                    >
                        Tandai Semua Dibaca
                    </button>
                )}
            </div>

            {/* Notification List */}
            {notifications.length === 0 ? (
                <div style={{
                    background: "white",
                    borderRadius: "12px",
                    padding: "60px 40px",
                    textAlign: "center",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                }}>
                    <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🔕</div>
                    <h3 style={{ margin: "0 0 8px 0", color: "#1e293b" }}>Tidak Ada Notifikasi</h3>
                    <p style={{ margin: 0, color: "#64748b" }}>
                        Anda akan menerima notifikasi saat ada pembaruan penting.
                    </p>
                </div>
            ) : (
                <div style={{
                    background: "white",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    overflow: "hidden"
                }}>
                    {notifications.map(notif => (
                        <div
                            key={notif.id}
                            onClick={() => !notif.is_read && markAsRead(notif.id)}
                            style={{
                                padding: "20px",
                                borderBottom: "1px solid #f1f5f9",
                                background: notif.is_read ? "white" : "#eff6ff",
                                cursor: notif.is_read ? "default" : "pointer",
                                display: "flex",
                                gap: "16px",
                                alignItems: "flex-start",
                                transition: "background 0.2s"
                            }}
                        >
                            <div style={{
                                width: "44px",
                                height: "44px",
                                borderRadius: "12px",
                                background: notif.is_read ? "#f1f5f9" : "#dbeafe",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.3rem",
                                flexShrink: 0
                            }}>
                                {getTypeIcon(notif.type)}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontWeight: "600",
                                    color: "#1e293b",
                                    marginBottom: "4px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px"
                                }}>
                                    {notif.title}
                                    {!notif.is_read && (
                                        <span style={{
                                            background: "#3b82f6",
                                            color: "white",
                                            fontSize: "0.65rem",
                                            padding: "2px 6px",
                                            borderRadius: "4px"
                                        }}>
                                            Baru
                                        </span>
                                    )}
                                </div>
                                <div style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: "1.5", marginBottom: "8px" }}>
                                    {notif.message}
                                </div>
                                <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                                    {formatDate(notif.created_at)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
