import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";

export default function OrgEventList() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalPurchases, setTotalPurchases] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);

    useEffect(() => {
        fetchMyEvents();
    }, []);

    const fetchMyEvents = async () => {
        try {
            const res = await api.get("/organization/report");
            const eventsData = res.data.events || [];
            setEvents(eventsData);
            const total = eventsData.reduce((sum, ev) => sum + (ev.buyers || 0), 0);
            setTotalPurchases(total);
            setTotalRevenue(res.data.total_revenue || 0);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <div style={{
                    width: "32px",
                    height: "32px",
                    border: "3px solid #e2e8f0",
                    borderTopColor: "#3b82f6",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 12px"
                }}></div>
                Memuat data...
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
                flexWrap: "wrap",
                gap: "16px"
            }}>
                <div>
                    <h2 style={{ margin: "0 0 4px 0", color: "#1e293b", fontSize: "1.5rem" }}>
                        📊 Report Penjualan
                    </h2>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                        Lihat total penjualan dan detail pembeli
                    </p>
                </div>
                <Link
                    to="/dashboard/org"
                    style={{
                        padding: "10px 18px",
                        background: "white",
                        color: "#374151",
                        textDecoration: "none",
                        borderRadius: "8px",
                        fontWeight: "500",
                        fontSize: "0.9rem",
                        border: "1px solid #e2e8f0",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px"
                    }}
                >
                    🏢 Dashboard Org
                </Link>
            </div>

            {/* Summary Cards */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
                marginBottom: "24px"
            }}>
                {/* Total Revenue Card */}
                <div style={{
                    background: "linear-gradient(135deg, #22c55e, #16a34a)",
                    borderRadius: "12px",
                    padding: "20px",
                    color: "white",
                    boxShadow: "0 4px 6px -1px rgba(34, 197, 94, 0.3)"
                }}>
                    <div style={{ fontSize: "0.85rem", opacity: 0.9, marginBottom: "4px" }}>
                        💰 Total Pendapatan
                    </div>
                    <div style={{ fontSize: "1.8rem", fontWeight: "700" }}>
                        Rp {totalRevenue.toLocaleString()}
                    </div>
                </div>

                {/* Total Buyers Card */}
                <div style={{
                    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                    borderRadius: "12px",
                    padding: "20px",
                    color: "white",
                    boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.3)"
                }}>
                    <div style={{ fontSize: "0.85rem", opacity: 0.9, marginBottom: "4px" }}>
                        👥 Total Pembeli
                    </div>
                    <div style={{ fontSize: "1.8rem", fontWeight: "700" }}>
                        {totalPurchases} orang
                    </div>
                    <div style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: "4px" }}>
                        dari {events.length} event
                    </div>
                </div>
            </div>

            {/* Content Card */}
            <div style={{
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                padding: "24px",
                minHeight: "200px"
            }}>
                <h3 style={{ margin: "0 0 16px 0", color: "#1e293b", fontSize: "1rem" }}>
                    📋 Detail per Event
                </h3>

                {events.length === 0 ? (
                    <div style={{
                        textAlign: "center",
                        padding: "48px 20px",
                        color: "#64748b"
                    }}>
                        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📭</div>
                        <p style={{ margin: "0 0 8px 0", fontWeight: "500", color: "#1e293b" }}>
                            Belum ada event
                        </p>
                        <p style={{ margin: 0, fontSize: "0.9rem" }}>
                            Buat event untuk mulai menjual
                        </p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: "12px" }}>
                        {events.map(event => (
                            <div
                                key={event.id}
                                style={{
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "10px",
                                    padding: "16px 20px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    background: "#fafafa",
                                    flexWrap: "wrap",
                                    gap: "12px"
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: "0 0 8px 0", color: "#1e293b", fontSize: "1rem" }}>
                                        {event.title}
                                    </h4>
                                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                                        <span style={{ color: "#64748b", fontSize: "0.85rem" }}>
                                            👥 {event.buyers || 0} pembeli
                                        </span>
                                        <span style={{ color: "#16a34a", fontSize: "0.85rem", fontWeight: "600" }}>
                                            💰 Rp {(event.revenue || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                {event.buyers > 0 ? (
                                    <Link
                                        to={`/dashboard/org/report/event/${event.id}/buyers`}
                                        style={{
                                            padding: "8px 16px",
                                            background: "#dbeafe",
                                            color: "#3b82f6",
                                            textDecoration: "none",
                                            borderRadius: "20px",
                                            fontWeight: "500",
                                            fontSize: "0.85rem"
                                        }}
                                    >
                                        👁️ Lihat Detail
                                    </Link>
                                ) : (
                                    <span style={{
                                        padding: "8px 16px",
                                        background: "#f1f5f9",
                                        color: "#94a3b8",
                                        borderRadius: "20px",
                                        fontSize: "0.85rem"
                                    }}>
                                        Belum ada pembeli
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}