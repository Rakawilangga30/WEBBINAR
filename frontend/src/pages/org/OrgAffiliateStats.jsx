import { useState, useEffect } from 'react';
import api from '../../api';

function OrgAffiliateStats() {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/organization/affiliate-stats');
            setStats(res.data || []);
        } catch (err) {
            console.error('Error:', err);
            setError(err.response?.data?.error || 'Gagal memuat data');
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
                Memuat statistik...
            </div>
        );
    }

    const totalBuyers = stats.reduce((acc, s) => acc + (s.total_buyers || 0), 0);
    const totalEarnings = stats.reduce((acc, s) => acc + (s.total_earnings || 0), 0);

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
                        📊 Statistik Affiliate
                    </h2>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                        Performa affiliate yang mempromosikan event Anda
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
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
                    color: "white",
                    boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.3)"
                }}>
                    <div style={{ fontSize: "0.8rem", opacity: 0.9, marginBottom: "4px" }}>
                        👥 Total Affiliate
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>
                        {stats.length} orang
                    </div>
                </div>

                <div style={{
                    background: "linear-gradient(135deg, #22c55e, #16a34a)",
                    borderRadius: "12px",
                    padding: "20px",
                    color: "white",
                    boxShadow: "0 4px 6px -1px rgba(34, 197, 94, 0.3)"
                }}>
                    <div style={{ fontSize: "0.8rem", opacity: 0.9, marginBottom: "4px" }}>
                        🛒 Pembeli via Affiliate
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>
                        {totalBuyers} orang
                    </div>
                </div>

                <div style={{
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    borderRadius: "12px",
                    padding: "20px",
                    color: "white",
                    boxShadow: "0 4px 6px -1px rgba(245, 158, 11, 0.3)"
                }}>
                    <div style={{ fontSize: "0.8rem", opacity: 0.9, marginBottom: "4px" }}>
                        💰 Total Komisi Affiliate
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>
                        Rp {totalEarnings.toLocaleString('id-ID')}
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
                    📋 Detail Affiliate
                </h3>

                {error ? (
                    <div style={{ textAlign: "center", padding: "48px 20px", color: "#ef4444" }}>
                        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>⚠️</div>
                        <p style={{ margin: "0 0 8px 0", fontWeight: "500" }}>{error}</p>
                    </div>
                ) : stats.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 20px", color: "#64748b" }}>
                        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📭</div>
                        <p style={{ margin: "0 0 8px 0", fontWeight: "500", color: "#1e293b" }}>
                            Belum ada affiliate yang disetujui
                        </p>
                        <p style={{ margin: 0, fontSize: "0.9rem" }}>
                            Affiliate akan muncul setelah Anda menyetujui permintaan mereka
                        </p>
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                            <thead>
                                <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                                    <th style={{ textAlign: "left", padding: "12px 8px", color: "#64748b", fontWeight: "600" }}>Affiliate</th>
                                    <th style={{ textAlign: "left", padding: "12px 8px", color: "#64748b", fontWeight: "600" }}>Event</th>
                                    <th style={{ textAlign: "left", padding: "12px 8px", color: "#64748b", fontWeight: "600" }}>Kode Promo</th>
                                    <th style={{ textAlign: "center", padding: "12px 8px", color: "#64748b", fontWeight: "600" }}>Komisi</th>
                                    <th style={{ textAlign: "center", padding: "12px 8px", color: "#64748b", fontWeight: "600" }}>Pembeli</th>
                                    <th style={{ textAlign: "right", padding: "12px 8px", color: "#64748b", fontWeight: "600" }}>Pendapatan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.map((s) => (
                                    <tr key={s.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                                        <td style={{ padding: "12px 8px" }}>
                                            <div style={{ fontWeight: "500", color: "#1e293b" }}>{s.user_name}</div>
                                            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{s.user_email}</div>
                                        </td>
                                        <td style={{ padding: "12px 8px", color: "#374151" }}>{s.event_title}</td>
                                        <td style={{ padding: "12px 8px" }}>
                                            <code style={{
                                                background: "#dbeafe",
                                                color: "#3b82f6",
                                                padding: "4px 8px",
                                                borderRadius: "6px",
                                                fontSize: "0.85rem",
                                                fontWeight: "500"
                                            }}>{s.unique_code}</code>
                                        </td>
                                        <td style={{ textAlign: "center", padding: "12px 8px" }}>
                                            <span style={{
                                                background: "#fef3c7",
                                                color: "#b45309",
                                                padding: "4px 10px",
                                                borderRadius: "20px",
                                                fontSize: "0.8rem",
                                                fontWeight: "600"
                                            }}>{s.commission_percentage}%</span>
                                        </td>
                                        <td style={{ textAlign: "center", padding: "12px 8px", fontWeight: "600", color: "#3b82f6" }}>
                                            {s.total_buyers || 0}
                                        </td>
                                        <td style={{ textAlign: "right", padding: "12px 8px", fontWeight: "600", color: "#22c55e" }}>
                                            Rp {(s.total_earnings || 0).toLocaleString('id-ID')}
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

export default OrgAffiliateStats;
