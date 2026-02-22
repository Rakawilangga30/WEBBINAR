import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';
import AffiliateWelcomeTour from '../../components/AffiliateWelcomeTour';

export default function AffiliateDashboard() {
    const navigate = useNavigate();
    const [balance, setBalance] = useState(null);
    const [partnerships, setPartnerships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTour, setShowTour] = useState(false);

    // Check if user has AFFILIATE role
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const roles = user.roles || [];
        if (!roles.includes("AFFILIATE")) {
            toast.error("Akses ditolak. Anda bukan affiliate.");
            navigate("/dashboard");
        }
    }, [navigate]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [balanceRes, partnershipsRes] = await Promise.all([
                api.get('/affiliate/balance'),
                api.get('/affiliate/partnerships')
            ]);

            // Backend returns { balance: {...} } so we access .balance
            const balanceData = balanceRes.data?.balance || balanceRes.data || {};
            setBalance({
                total_earned: balanceData.total_earned || 0,
                available_balance: balanceData.available_balance || 0,
                total_withdrawn: balanceData.total_withdrawn || 0
            });
            setPartnerships(partnershipsRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            setBalance({ total_earned: 0, available_balance: 0, total_withdrawn: 0 });
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const copyCode = (code) => {
        navigator.clipboard.writeText(code);
        toast.success('Kode berhasil disalin!');
    };

    if (loading) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                Memuat dashboard...
            </div>
        );
    }

    const approvedPartnerships = partnerships.filter(p => p.status === 'APPROVED');
    const pendingPartnerships = partnerships.filter(p => p.status === 'PENDING');

    return (
        <div>
            <AffiliateWelcomeTour open={showTour} onClose={() => setShowTour(false)} />
            {/* Header */}
            <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                <div>
                    <h1 style={{ margin: "0 0 8px 0", color: "#1e293b", fontSize: "1.75rem" }}>
                        🤝 Dashboard Affiliate
                    </h1>
                    <p style={{ margin: 0, color: "#64748b" }}>
                        Pantau pendapatan dari kode promo Anda
                    </p>
                </div>
                <button
                    onClick={() => setShowTour(true)}
                    style={{
                        background: "transparent", color: "#64748b",
                        padding: "10px 18px", border: "1px solid #e2e8f0",
                        borderRadius: "8px", cursor: "pointer",
                        fontWeight: "500", fontSize: "0.9rem",
                        display: "flex", alignItems: "center", gap: "6px"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.color = '#8b5cf6'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
                >
                    📖 Panduan
                </button>
            </div>

            {/* Balance Cards */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "20px",
                marginBottom: "32px"
            }}>
                {/* Total Pendapatan */}
                <div style={{
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    borderRadius: "16px",
                    padding: "24px",
                    color: "white"
                }}>
                    <div style={{ fontSize: "1rem", opacity: 0.9, marginBottom: "8px" }}>💰 Total Pendapatan</div>
                    <div style={{ fontSize: "1.75rem", fontWeight: "700" }}>
                        {formatPrice(balance?.total_earned || 0)}
                    </div>
                    <div style={{ fontSize: "0.85rem", opacity: 0.8, marginTop: "4px" }}>
                        Dari {approvedPartnerships.length} kode promo aktif
                    </div>
                </div>

                {/* Saldo Tersedia */}
                <div style={{
                    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                    borderRadius: "16px",
                    padding: "24px",
                    color: "white"
                }}>
                    <div style={{ fontSize: "1rem", opacity: 0.9, marginBottom: "8px" }}>💳 Saldo Tersedia</div>
                    <div style={{ fontSize: "1.75rem", fontWeight: "700" }}>
                        {formatPrice(balance?.available_balance || 0)}
                    </div>
                    <div style={{ fontSize: "0.85rem", opacity: 0.8, marginTop: "4px" }}>
                        Dapat ditarik
                    </div>
                </div>

                {/* Total Ditarik */}
                <div style={{
                    background: "linear-gradient(135deg, #64748b, #475569)",
                    borderRadius: "16px",
                    padding: "24px",
                    color: "white"
                }}>
                    <div style={{ fontSize: "1rem", opacity: 0.9, marginBottom: "8px" }}>📤 Total Ditarik</div>
                    <div style={{ fontSize: "1.75rem", fontWeight: "700" }}>
                        {formatPrice(balance?.total_withdrawn || 0)}
                    </div>
                    <div style={{ fontSize: "0.85rem", opacity: 0.8, marginTop: "4px" }}>
                        Sudah ditransfer
                    </div>
                </div>
            </div>

            {/* Kode Promo Aktif */}
            <div style={{ marginBottom: "32px" }}>
                <h2 style={{ margin: "0 0 16px 0", color: "#1e293b", fontSize: "1.25rem" }}>
                    🎫 Kode Promo Aktif ({approvedPartnerships.length})
                </h2>

                {approvedPartnerships.length === 0 ? (
                    <div style={{
                        background: "white",
                        borderRadius: "12px",
                        padding: "40px",
                        textAlign: "center",
                        border: "1px solid #e2e8f0"
                    }}>
                        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔍</div>
                        <p style={{ color: "#64748b", margin: 0 }}>
                            Belum ada kode promo aktif. Gabung sebagai affiliate di halaman event!
                        </p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: "16px" }}>
                        {approvedPartnerships.map((p) => (
                            <div key={p.id} style={{
                                background: "white",
                                borderRadius: "12px",
                                padding: "20px",
                                border: "1px solid #e2e8f0",
                                display: "flex",
                                flexWrap: "wrap",
                                alignItems: "center",
                                gap: "16px"
                            }}>
                                <div style={{ flex: "1", minWidth: "200px" }}>
                                    <div style={{ fontWeight: "600", color: "#1e293b", marginBottom: "4px" }}>
                                        {p.event_title}
                                    </div>
                                    <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                                        Komisi: {p.commission_percentage}%
                                    </div>
                                </div>
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    background: "#f0fdf4",
                                    padding: "8px 16px",
                                    borderRadius: "8px",
                                    border: "1px solid #86efac"
                                }}>
                                    <code style={{
                                        fontSize: "1.1rem",
                                        fontWeight: "700",
                                        color: "#166534"
                                    }}>
                                        {p.unique_code}
                                    </code>
                                    <button
                                        onClick={() => copyCode(p.unique_code)}
                                        style={{
                                            background: "#22c55e",
                                            border: "none",
                                            color: "white",
                                            padding: "6px 12px",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            fontSize: "0.8rem",
                                            fontWeight: "500"
                                        }}
                                    >
                                        📋 Salin
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pending Requests */}
            {pendingPartnerships.length > 0 && (
                <div style={{ marginBottom: "32px" }}>
                    <h2 style={{ margin: "0 0 16px 0", color: "#1e293b", fontSize: "1.25rem" }}>
                        ⏳ Menunggu Persetujuan ({pendingPartnerships.length})
                    </h2>
                    <div style={{ display: "grid", gap: "12px" }}>
                        {pendingPartnerships.map((p) => (
                            <div key={p.id} style={{
                                background: "#fffbeb",
                                borderRadius: "12px",
                                padding: "16px",
                                border: "1px solid #fcd34d",
                                display: "flex",
                                alignItems: "center",
                                gap: "12px"
                            }}>
                                <span style={{ fontSize: "1.5rem" }}>⏳</span>
                                <div>
                                    <div style={{ fontWeight: "500", color: "#92400e" }}>{p.event_title}</div>
                                    <div style={{ fontSize: "0.85rem", color: "#b45309" }}>
                                        Menunggu approval dari organisasi
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
                <Link to="/dashboard/affiliate/withdraw" style={actionCard}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>💸</div>
                    <h3 style={{ margin: "0 0 8px 0", color: "#166534" }}>Tarik Dana</h3>
                    <p style={{ margin: 0, color: "#15803d", fontSize: "0.9rem" }}>
                        Saldo: {formatPrice(balance?.balance || balance?.available_balance || 0)}
                    </p>
                </Link>

                <Link to="/" style={actionCard}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🔍</div>
                    <h3 style={{ margin: "0 0 8px 0", color: "#1e293b" }}>Cari Event</h3>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                        Gabung affiliate di event lain
                    </p>
                </Link>

                <Link to="/dashboard/notifications" style={actionCard}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🔔</div>
                    <h3 style={{ margin: "0 0 8px 0", color: "#1e293b" }}>Notifikasi</h3>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                        Lihat update & pesan
                    </p>
                </Link>
            </div>
        </div>
    );
}

const actionCard = {
    display: "block",
    background: "white",
    borderRadius: "16px",
    padding: "28px",
    textAlign: "center",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    border: "1px solid #e2e8f0",
    textDecoration: "none",
    transition: "all 0.3s ease"
};
