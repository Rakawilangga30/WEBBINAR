import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api";

export default function EventBuyers() {
    const { eventId } = useParams();
    const [eventTitle, setEventTitle] = useState("");
    const [buyers, setBuyers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBuyers();
    }, [eventId]);

    const fetchBuyers = async () => {
        try {
            // Fetch buyers
            const res = await api.get(`/organization/events/${eventId}/buyers`);
            setBuyers(res.data.buyers || []);

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
                    to="/dashboard/org/report"
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
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
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
                    <div style={{ fontSize: "0.85rem", opacity: 0.9, marginBottom: "4px" }}>
                        👥 Total Pembeli
                    </div>
                    <div style={{ fontSize: "2rem", fontWeight: "700" }}>
                        {buyers.length} orang
                    </div>
                </div>

                {/* Total Revenue */}
                <div style={{
                    background: "linear-gradient(135deg, #22c55e, #16a34a)",
                    borderRadius: "12px",
                    padding: "20px",
                    color: "white",
                    boxShadow: "0 4px 6px -1px rgba(34, 197, 94, 0.3)"
                }}>
                    <div style={{ fontSize: "0.85rem", opacity: 0.9, marginBottom: "4px" }}>
                        💰 Total Pendapatan Event
                    </div>
                    <div style={{ fontSize: "2rem", fontWeight: "700" }}>
                        Rp {buyers.reduce((sum, b) => sum + (b.total_paid || 0), 0).toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Buyers Table */}
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
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                    <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: "600", color: "#64748b", fontSize: "0.85rem" }}>
                                        Nama
                                    </th>
                                    <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: "600", color: "#64748b", fontSize: "0.85rem" }}>
                                        Email
                                    </th>
                                    <th style={{ padding: "14px 20px", textAlign: "center", fontWeight: "600", color: "#64748b", fontSize: "0.85rem" }}>
                                        Jumlah Sesi
                                    </th>
                                    <th style={{ padding: "14px 20px", textAlign: "right", fontWeight: "600", color: "#64748b", fontSize: "0.85rem" }}>
                                        Total Bayar
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {buyers.map((buyer, idx) => (
                                    <tr key={idx} style={{ borderBottom: idx < buyers.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                                        <td style={{ padding: "14px 20px", color: "#1e293b", fontWeight: "500" }}>
                                            {buyer.user_name}
                                        </td>
                                        <td style={{ padding: "14px 20px", color: "#64748b" }}>
                                            {buyer.user_email}
                                        </td>
                                        <td style={{ padding: "14px 20px", textAlign: "center" }}>
                                            <span style={{
                                                background: "#dbeafe",
                                                color: "#3b82f6",
                                                padding: "4px 12px",
                                                borderRadius: "20px",
                                                fontSize: "0.85rem",
                                                fontWeight: "600"
                                            }}>
                                                {buyer.sessions_count} sesi
                                            </span>
                                        </td>
                                        <td style={{ padding: "14px 20px", textAlign: "right", color: "#16a34a", fontWeight: "600" }}>
                                            Rp {buyer.total_paid?.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
