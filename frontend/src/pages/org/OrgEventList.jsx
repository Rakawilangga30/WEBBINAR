import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";

export default function OrgEventList() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState({
        total_buyers: 0,
        gross_revenue: 0,
        affiliate_commission: 0,
        net_revenue: 0,
        available_balance: 0,
        total_withdrawn: 0
    });

    useEffect(() => {
        fetchMyEvents();
    }, []);

    const fetchMyEvents = async () => {
        try {
            const res = await api.get("/organization/report");
            setEvents(res.data.events || []);
            setReport({
                total_buyers: res.data.total_buyers || 0,
                gross_revenue: res.data.gross_revenue || 0,
                affiliate_commission: res.data.affiliate_commission || 0,
                net_revenue: res.data.net_revenue || 0,
                available_balance: res.data.available_balance || 0,
                total_withdrawn: res.data.total_withdrawn || 0
            });
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
                        📊 Laporan Keuangan
                    </h2>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                        Lihat pendapatan, komisi affiliate, dan saldo bersih
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
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "16px",
                marginBottom: "24px"
            }}>
                {/* Total Buyers */}
                <div style={{
                    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                    borderRadius: "12px",
                    padding: "20px",
                    color: "white",
                    boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.3)"
                }}>
                    <div style={{ fontSize: "0.8rem", opacity: 0.9, marginBottom: "4px" }}>
                        👥 Total Pembeli
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>
                        {report.total_buyers} orang
                    </div>
                    <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                        dari {events.length} event
                    </div>
                </div>

                {/* Gross Revenue */}
                <div style={{
                    background: "linear-gradient(135deg, #22c55e, #16a34a)",
                    borderRadius: "12px",
                    padding: "20px",
                    color: "white",
                    boxShadow: "0 4px 6px -1px rgba(34, 197, 94, 0.3)"
                }}>
                    <div style={{ fontSize: "0.8rem", opacity: 0.9, marginBottom: "4px" }}>
                        💰 Pendapatan Kotor
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>
                        Rp {report.gross_revenue.toLocaleString()}
                    </div>
                </div>

                {/* Affiliate Commission */}
                <div style={{
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    borderRadius: "12px",
                    padding: "20px",
                    color: "white",
                    boxShadow: "0 4px 6px -1px rgba(245, 158, 11, 0.3)"
                }}>
                    <div style={{ fontSize: "0.8rem", opacity: 0.9, marginBottom: "4px" }}>
                        🤝 Komisi Affiliate
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>
                        - Rp {report.affiliate_commission.toLocaleString()}
                    </div>
                </div>

                {/* Net Revenue */}
                <div style={{
                    background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                    borderRadius: "12px",
                    padding: "20px",
                    color: "white",
                    boxShadow: "0 4px 6px -1px rgba(139, 92, 246, 0.3)"
                }}>
                    <div style={{ fontSize: "0.8rem", opacity: 0.9, marginBottom: "4px" }}>
                        ✨ Pendapatan Bersih
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>
                        Rp {report.net_revenue.toLocaleString()}
                    </div>
                </div>

                {/* Available Balance */}
                <div style={{
                    background: "linear-gradient(135deg, #06b6d4, #0891b2)",
                    borderRadius: "12px",
                    padding: "20px",
                    color: "white",
                    boxShadow: "0 4px 6px -1px rgba(6, 182, 212, 0.3)"
                }}>
                    <div style={{ fontSize: "0.8rem", opacity: 0.9, marginBottom: "4px" }}>
                        💳 Saldo Tersedia
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>
                        Rp {report.available_balance.toLocaleString()}
                    </div>
                    {report.total_withdrawn > 0 && (
                        <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                            Sudah ditarik: Rp {report.total_withdrawn.toLocaleString()}
                        </div>
                    )}
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
                                    background: "#fafafa"
                                }}
                            >
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: "12px",
                                    marginBottom: "12px"
                                }}>
                                    <h4 style={{ margin: 0, color: "#1e293b", fontSize: "1rem" }}>
                                        {event.title}
                                    </h4>
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
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                                    gap: "12px",
                                    fontSize: "0.85rem"
                                }}>
                                    <div>
                                        <span style={{ color: "#64748b" }}>👥 Pembeli: </span>
                                        <span style={{ fontWeight: "600", color: "#1e293b" }}>{event.buyers || 0}</span>
                                    </div>
                                    <div>
                                        <span style={{ color: "#64748b" }}>💰 Kotor: </span>
                                        <span style={{ fontWeight: "600", color: "#22c55e" }}>Rp {(event.gross_revenue || 0).toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span style={{ color: "#64748b" }}>🤝 Komisi: </span>
                                        <span style={{ fontWeight: "600", color: "#f59e0b" }}>-Rp {(event.affiliate_commission || 0).toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span style={{ color: "#64748b" }}>✨ Bersih: </span>
                                        <span style={{ fontWeight: "600", color: "#8b5cf6" }}>Rp {(event.net_revenue || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}