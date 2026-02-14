import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api";
import { getBackendUrl } from "../../utils/url";

export default function AdminFeaturedEvents() {
    const [featuredEvents, setFeaturedEvents] = useState([]);
    const [availableEvents, setAvailableEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [featuredRes, availableRes] = await Promise.all([
                api.get("/admin/featured-events"),
                api.get("/admin/featured-events/available")
            ]);
            setFeaturedEvents(featuredRes.data.featured || []);
            setAvailableEvents(availableRes.data.events || []);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Gagal memuat data. Pastikan tabel featured_events sudah dibuat.");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (eventId) => {
        if (featuredEvents.length >= 10) {
            toast.error("Maksimal 10 event featured!");
            return;
        }
        setAdding(true);
        try {
            await api.post("/admin/featured-events", { event_id: eventId });
            await fetchData();
        } catch (err) {
            toast.error("Gagal menambahkan: " + (err.response?.data?.error || err.message));
        } finally {
            setAdding(false);
        }
    };

    const handleRemove = async (id) => {
        if (!window.confirm("Hapus event dari featured?")) return;
        try {
            await api.delete(`/admin/featured-events/${id}`);
            await fetchData();
        } catch (err) {
            toast.error("Gagal menghapus: " + err.message);
        }
    };

    const moveUp = async (index) => {
        if (index <= 0) return;
        const newOrder = [...featuredEvents];
        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
        const orderIds = newOrder.map(f => f.id);

        try {
            await api.put("/admin/featured-events/reorder", { order: orderIds });
            await fetchData();
        } catch (err) {
            console.error("Error reordering:", err);
        }
    };

    const moveDown = async (index) => {
        if (index >= featuredEvents.length - 1) return;
        const newOrder = [...featuredEvents];
        [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
        const orderIds = newOrder.map(f => f.id);

        try {
            await api.put("/admin/featured-events/reorder", { order: orderIds });
            await fetchData();
        } catch (err) {
            console.error("Error reordering:", err);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                Memuat data...
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: "32px" }}>
                <h1 style={{ margin: "0 0 8px 0", color: "#1e293b", fontSize: "1.75rem" }}>
                    ⭐ Kelola Featured Banner
                </h1>
                <p style={{ margin: 0, color: "#64748b" }}>
                    Pilih event untuk ditampilkan di slider banner halaman utama (maksimal 10)
                </p>
            </div>

            {error && (
                <div style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#dc2626",
                    padding: "16px",
                    borderRadius: "8px",
                    marginBottom: "24px"
                }}>
                    ⚠️ {error}
                    <div style={{ marginTop: "8px", fontSize: "0.85rem" }}>
                        Jalankan SQL migration: <code>migrations/2026-01-02-featured-events.sql</code>
                    </div>
                </div>
            )}

            {/* Current Featured */}
            <div style={{
                background: "white",
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "32px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                border: "1px solid #e2e8f0"
            }}>
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px"
                }}>
                    <h2 style={{ margin: 0, color: "#1e293b", fontSize: "1.1rem" }}>
                        🎯 Event dalam Banner ({featuredEvents.length}/10)
                    </h2>
                </div>

                {featuredEvents.length === 0 ? (
                    <div style={{
                        textAlign: "center",
                        padding: "40px",
                        background: "#f8fafc",
                        borderRadius: "12px",
                        color: "#64748b"
                    }}>
                        <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📭</div>
                        Belum ada event dalam banner. Tambahkan dari daftar di bawah.
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {featuredEvents.map((item, index) => (
                            <div key={item.id} style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "16px",
                                background: "#f8fafc",
                                padding: "16px",
                                borderRadius: "12px",
                                border: "1px solid #e2e8f0"
                            }}>
                                {/* Order */}
                                <div style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "8px",
                                    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                                    color: "white",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: "700",
                                    flexShrink: 0
                                }}>
                                    {index + 1}
                                </div>

                                {/* Thumbnail */}
                                <div style={{
                                    width: "80px",
                                    height: "50px",
                                    borderRadius: "8px",
                                    background: "#e2e8f0",
                                    overflow: "hidden",
                                    flexShrink: 0
                                }}>
                                    {item.thumbnail_url ? (
                                        <img
                                            src={getBackendUrl(item.thumbnail_url.replace(/^\/+/, ""))}
                                            alt=""
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: "100%",
                                            height: "100%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
                                        }}>🖼️</div>
                                    )}
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontWeight: "600",
                                        color: "#1e293b",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis"
                                    }}>
                                        {item.title}
                                    </div>
                                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                        {item.category || "Umum"}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <button
                                        onClick={() => moveUp(index)}
                                        disabled={index === 0}
                                        style={{
                                            padding: "6px 10px",
                                            background: index === 0 ? "#e2e8f0" : "white",
                                            border: "1px solid #d1d5db",
                                            borderRadius: "6px",
                                            cursor: index === 0 ? "not-allowed" : "pointer",
                                            opacity: index === 0 ? 0.5 : 1
                                        }}
                                        title="Naik"
                                    >⬆️</button>
                                    <button
                                        onClick={() => moveDown(index)}
                                        disabled={index === featuredEvents.length - 1}
                                        style={{
                                            padding: "6px 10px",
                                            background: index === featuredEvents.length - 1 ? "#e2e8f0" : "white",
                                            border: "1px solid #d1d5db",
                                            borderRadius: "6px",
                                            cursor: index === featuredEvents.length - 1 ? "not-allowed" : "pointer",
                                            opacity: index === featuredEvents.length - 1 ? 0.5 : 1
                                        }}
                                        title="Turun"
                                    >⬇️</button>
                                    <button
                                        onClick={() => handleRemove(item.id)}
                                        style={{
                                            padding: "6px 10px",
                                            background: "#fef2f2",
                                            border: "1px solid #fecaca",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            color: "#dc2626"
                                        }}
                                        title="Hapus dari featured"
                                    >🗑️</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Available Events */}
            <div style={{
                background: "white",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                border: "1px solid #e2e8f0"
            }}>
                <h2 style={{ margin: "0 0 20px 0", color: "#1e293b", fontSize: "1.1rem" }}>
                    📦 Event Tersedia ({availableEvents.length})
                </h2>

                {availableEvents.length === 0 ? (
                    <div style={{
                        textAlign: "center",
                        padding: "40px",
                        background: "#f8fafc",
                        borderRadius: "12px",
                        color: "#64748b"
                    }}>
                        <div style={{ fontSize: "2rem", marginBottom: "8px" }}>✅</div>
                        Semua event sudah ditambahkan ke banner atau tidak ada event publik.
                    </div>
                ) : (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                        gap: "16px"
                    }}>
                        {availableEvents.map(evt => (
                            <div key={evt.id} style={{
                                background: "#f8fafc",
                                borderRadius: "12px",
                                overflow: "hidden",
                                border: "1px solid #e2e8f0"
                            }}>
                                {/* Thumbnail */}
                                <div style={{
                                    height: "100px",
                                    background: "#e2e8f0",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    overflow: "hidden"
                                }}>
                                    {evt.thumbnail_url ? (
                                        <img
                                            src={getBackendUrl(evt.thumbnail_url.replace(/^\/+/, ""))}
                                            alt={evt.title}
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                        />
                                    ) : (
                                        <span style={{ fontSize: "2rem" }}>🖼️</span>
                                    )}
                                </div>

                                {/* Content */}
                                <div style={{ padding: "16px" }}>
                                    <h4 style={{
                                        margin: "0 0 4px 0",
                                        color: "#1e293b",
                                        fontSize: "0.95rem",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis"
                                    }}>
                                        {evt.title}
                                    </h4>
                                    <div style={{
                                        fontSize: "0.8rem",
                                        color: "#64748b",
                                        marginBottom: "12px"
                                    }}>
                                        {evt.org_name || evt.category || "Umum"}
                                    </div>
                                    <button
                                        onClick={() => handleAdd(evt.id)}
                                        disabled={adding || featuredEvents.length >= 10}
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            background: featuredEvents.length >= 10
                                                ? "#e2e8f0"
                                                : "linear-gradient(135deg, #10b981, #059669)",
                                            color: featuredEvents.length >= 10 ? "#64748b" : "white",
                                            border: "none",
                                            borderRadius: "8px",
                                            cursor: featuredEvents.length >= 10 ? "not-allowed" : "pointer",
                                            fontWeight: "600",
                                            fontSize: "0.9rem"
                                        }}
                                    >
                                        {adding ? "..." : featuredEvents.length >= 10 ? "Max 10" : "➕ Tambah ke Banner"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
