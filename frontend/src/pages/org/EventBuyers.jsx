import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api";

export default function EventBuyers() {
    const { eventId } = useParams();
    const [eventTitle, setEventTitle] = useState("");
    const [purchases, setPurchases] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedBuyers, setExpandedBuyers] = useState({});

    useEffect(() => {
        fetchBuyers();
    }, [eventId]);

    const fetchBuyers = async () => {
        try {
            // Fetch purchases with details
            const res = await api.get(`/organization/events/${eventId}/buyers`);
            setPurchases(res.data.purchases || []);
            setSummary(res.data.summary || null);

            // Get event title from report
            const reportRes = await api.get("/organization/report");
            const events = reportRes.data.events || [];
            const event = events.find(e => e.id == eventId);
            if (event) {
                setEventTitle(event.title);
            }
        } catch (error) {
            console.error("Gagal load pembeli:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        return date.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    // Group purchases by buyer
    const groupedBuyers = purchases.reduce((acc, p) => {
        const key = p.user_id;
        if (!acc[key]) {
            acc[key] = {
                user_id: p.user_id,
                user_name: p.user_name,
                user_email: p.user_email,
                user_phone: p.user_phone,
                sessions: [],
                total_paid: 0,
                total_commission: 0,
                total_net: 0,
                first_purchase: p.purchased_at
            };
        }
        acc[key].sessions.push({
            session_id: p.session_id,
            session_title: p.session_title,
            price_paid: p.price_paid,
            affiliate_code: p.affiliate_code,
            affiliate_name: p.affiliate_name,
            commission_pct: p.commission_pct,
            commission_amount: p.commission_amount,
            net_amount: p.net_amount,
            purchased_at: p.purchased_at,
            payment_status: p.payment_status
        });
        if (p.payment_status === "PAID") {
            acc[key].total_paid += p.price_paid;
            acc[key].total_commission += p.commission_amount;
            acc[key].total_net += p.net_amount;
        }
        return acc;
    }, {});

    const buyers = Object.values(groupedBuyers);

    const toggleBuyer = (userId) => {
        setExpandedBuyers(prev => ({
            ...prev,
            [userId]: !prev[userId]
        }));
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
                Memuat data pembeli...
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
                        👥 Daftar Pembeli
                    </h2>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                        {eventTitle || `Event #${eventId}`}
                    </p>
                </div>
                <Link
                    to="/dashboard/org/events"
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
                    ← Kembali ke Report
                </Link>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "16px",
                    marginBottom: "24px"
                }}>
                    <div style={{
                        background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                        borderRadius: "12px",
                        padding: "20px",
                        color: "white"
                    }}>
                        <div style={{ fontSize: "0.8rem", opacity: 0.9, marginBottom: "4px" }}>
                            👥 Total Pembeli
                        </div>
                        <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>
                            {buyers.length} orang
                        </div>
                        <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                            {summary.paid_count} lunas, {summary.pending_count} pending
                        </div>
                    </div>

                    <div style={{
                        background: "linear-gradient(135deg, #22c55e, #16a34a)",
                        borderRadius: "12px",
                        padding: "20px",
                        color: "white"
                    }}>
                        <div style={{ fontSize: "0.8rem", opacity: 0.9, marginBottom: "4px" }}>
                            💰 Pendapatan Kotor
                        </div>
                        <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>
                            Rp {(summary.gross_revenue || 0).toLocaleString()}
                        </div>
                    </div>

                    <div style={{
                        background: "linear-gradient(135deg, #f59e0b, #d97706)",
                        borderRadius: "12px",
                        padding: "20px",
                        color: "white"
                    }}>
                        <div style={{ fontSize: "0.8rem", opacity: 0.9, marginBottom: "4px" }}>
                            🤝 Komisi Affiliate
                        </div>
                        <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>
                            - Rp {(summary.total_commission || 0).toLocaleString()}
                        </div>
                    </div>

                    <div style={{
                        background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                        borderRadius: "12px",
                        padding: "20px",
                        color: "white"
                    }}>
                        <div style={{ fontSize: "0.8rem", opacity: 0.9, marginBottom: "4px" }}>
                            ✨ Pendapatan Bersih
                        </div>
                        <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>
                            Rp {(summary.net_revenue || 0).toLocaleString()}
                        </div>
                    </div>
                </div>
            )}

            {/* Buyers List */}
            <div style={{
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                overflow: "hidden"
            }}>
                {buyers.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 20px", color: "#64748b" }}>
                        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📭</div>
                        <p style={{ margin: "0 0 8px 0", fontWeight: "500", color: "#1e293b" }}>
                            Belum ada pembeli
                        </p>
                        <p style={{ margin: 0, fontSize: "0.9rem" }}>
                            Event ini belum memiliki pembeli
                        </p>
                    </div>
                ) : (
                    <div>
                        {buyers.map((buyer, idx) => (
                            <div key={buyer.user_id} style={{ borderBottom: idx < buyers.length - 1 ? "1px solid #e2e8f0" : "none" }}>
                                {/* Buyer Header - Clickable */}
                                <div
                                    onClick={() => toggleBuyer(buyer.user_id)}
                                    style={{
                                        padding: "16px 20px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "16px",
                                        cursor: "pointer",
                                        background: expandedBuyers[buyer.user_id] ? "#f8fafc" : "white",
                                        transition: "background 0.2s"
                                    }}
                                >
                                    {/* Expand Icon */}
                                    <div style={{
                                        width: "24px",
                                        height: "24px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        background: "#e2e8f0",
                                        borderRadius: "6px",
                                        fontSize: "0.8rem",
                                        transition: "transform 0.2s",
                                        transform: expandedBuyers[buyer.user_id] ? "rotate(90deg)" : "rotate(0deg)"
                                    }}>
                                        ▶
                                    </div>

                                    {/* User Info */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: "600", color: "#1e293b", fontSize: "0.95rem" }}>
                                            {buyer.user_name}
                                        </div>
                                        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "4px" }}>
                                            <span style={{ color: "#64748b", fontSize: "0.85rem" }}>
                                                📧 {buyer.user_email}
                                            </span>
                                            {buyer.user_phone && (
                                                <span style={{ color: "#64748b", fontSize: "0.85rem" }}>
                                                    📱 {buyer.user_phone}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ color: "#22c55e", fontWeight: "600" }}>
                                            Rp {buyer.total_net.toLocaleString()}
                                        </div>
                                        <div style={{ color: "#64748b", fontSize: "0.8rem" }}>
                                            {buyer.sessions.length} sesi
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Sessions */}
                                {expandedBuyers[buyer.user_id] && (
                                    <div style={{ background: "#f8fafc", padding: "0 20px 16px 60px" }}>
                                        <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "8px", fontWeight: "500" }}>
                                            Sesi yang dibeli:
                                        </div>
                                        <div style={{ display: "grid", gap: "8px" }}>
                                            {buyer.sessions.map((sess, sidx) => (
                                                <div
                                                    key={sidx}
                                                    style={{
                                                        background: "white",
                                                        borderRadius: "8px",
                                                        padding: "12px 16px",
                                                        border: "1px solid #e2e8f0"
                                                    }}
                                                >
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: "500", color: "#1e293b", marginBottom: "4px" }}>
                                                                📚 {sess.session_title}
                                                            </div>
                                                            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", fontSize: "0.8rem", color: "#64748b" }}>
                                                                <span>🕐 {formatDate(sess.purchased_at)}</span>
                                                                {sess.affiliate_code && (
                                                                    <span style={{ color: "#f59e0b" }}>
                                                                        🏷️ {sess.affiliate_code} ({sess.affiliate_name}, {sess.commission_pct}%)
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div style={{ textAlign: "right" }}>
                                                            <div style={{ fontWeight: "500" }}>
                                                                Rp {sess.price_paid?.toLocaleString()}
                                                            </div>
                                                            {sess.commission_amount > 0 && (
                                                                <div style={{ fontSize: "0.75rem", color: "#f59e0b" }}>
                                                                    Komisi: -Rp {sess.commission_amount?.toLocaleString()}
                                                                </div>
                                                            )}
                                                            <div style={{ fontSize: "0.75rem", color: "#22c55e" }}>
                                                                Bersih: Rp {sess.net_amount?.toLocaleString()}
                                                            </div>
                                                        </div>
                                                        <span style={{
                                                            background: sess.payment_status === "PAID" ? "#dcfce7" : "#fef3c7",
                                                            color: sess.payment_status === "PAID" ? "#16a34a" : "#92400e",
                                                            padding: "4px 10px",
                                                            borderRadius: "20px",
                                                            fontSize: "0.7rem",
                                                            fontWeight: "600"
                                                        }}>
                                                            {sess.payment_status === "PAID" ? "✓ Lunas" : "⏳ Pending"}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
