import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

export default function AffiliateDashboard() {
    const [stats, setStats] = useState(null);
    const [balance, setBalance] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profileComplete, setProfileComplete] = useState(true);
    const [missingFields, setMissingFields] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [dashboardRes, profileRes, balanceRes] = await Promise.all([
                api.get('/affiliate/dashboard'),
                api.get('/user/profile'),
                api.get('/affiliate/balance')
            ]);

            setStats(dashboardRes.data.stats);
            setProfile(profileRes.data.user);
            setBalance(balanceRes.data.balance);

            // Check profile completeness
            const user = profileRes.data.user;
            const missing = [];

            if (!user.name || user.name.trim() === '') missing.push('Nama Lengkap');
            if (!user.phone || user.phone.trim() === '') missing.push('No. Telepon');
            if (!user.address || user.address.trim() === '') missing.push('Alamat');
            if (!user.gender) missing.push('Jenis Kelamin');
            if (!user.birthdate) missing.push('Tanggal Lahir');

            setMissingFields(missing);
            setProfileComplete(missing.length === 0);
        } catch (error) {
            console.error('Error fetching data:', error);
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

    if (loading) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                Memuat dashboard...
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: "32px" }}>
                <h1 style={{ margin: "0 0 8px 0", color: "#1e293b", fontSize: "1.75rem" }}>
                    🤝 Dashboard Affiliate
                </h1>
                <p style={{ margin: 0, color: "#64748b" }}>
                    Kelola event dan pantau pendapatan Anda
                </p>
            </div>

            {/* Profile Incomplete Warning */}
            {!profileComplete && (
                <div style={{
                    background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
                    border: "2px solid #fca5a5",
                    borderRadius: "12px",
                    padding: "20px",
                    marginBottom: "24px"
                }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                        <span style={{ fontSize: "2rem" }}>⚠️</span>
                        <div>
                            <div style={{ fontWeight: "700", color: "#dc2626", fontSize: "1.1rem", marginBottom: "8px" }}>
                                Lengkapi Profil Anda Terlebih Dahulu!
                            </div>
                            <div style={{ color: "#991b1b", marginBottom: "12px" }}>
                                Untuk menjadi affiliate/creator, Anda harus melengkapi data profil berikut:
                            </div>
                            <div style={{
                                background: "white",
                                borderRadius: "8px",
                                padding: "12px",
                                marginBottom: "16px",
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "8px"
                            }}>
                                {missingFields.map((field, index) => (
                                    <span key={index} style={{
                                        background: "#fef2f2",
                                        color: "#dc2626",
                                        padding: "4px 12px",
                                        borderRadius: "20px",
                                        fontSize: "0.85rem",
                                        fontWeight: "500",
                                        border: "1px solid #fca5a5"
                                    }}>
                                        ❌ {field}
                                    </span>
                                ))}
                            </div>
                            <Link to="/dashboard/profile" style={{
                                display: "inline-block",
                                background: "linear-gradient(135deg, #dc2626, #b91c1c)",
                                color: "white",
                                padding: "10px 24px",
                                borderRadius: "8px",
                                textDecoration: "none",
                                fontWeight: "600",
                                fontSize: "0.9rem"
                            }}>
                                ✏️ Lengkapi Profil Sekarang
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Balance Cards - New Design */}
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
                        Dari {stats?.total_sales || 0} penjualan
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

            {/* Stats Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "32px" }}>
                <div style={statCard}>
                    <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>📦</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e293b" }}>{stats?.total_events || 0}</div>
                    <div style={{ color: "#64748b", fontSize: "0.85rem" }}>Event Diajukan</div>
                </div>
                <div style={statCard}>
                    <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>✅</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#10b981" }}>{stats?.approved_events || 0}</div>
                    <div style={{ color: "#64748b", fontSize: "0.85rem" }}>Disetujui</div>
                </div>
                <div style={statCard}>
                    <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>⏳</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#f59e0b" }}>{stats?.pending_events || 0}</div>
                    <div style={{ color: "#64748b", fontSize: "0.85rem" }}>Pending</div>
                </div>
                <div style={statCard}>
                    <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>🛒</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#3b82f6" }}>{stats?.total_sales || 0}</div>
                    <div style={{ color: "#64748b", fontSize: "0.85rem" }}>Penjualan</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
                {profileComplete ? (
                    <Link to="/dashboard/affiliate/submit" style={actionCard}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>➕</div>
                        <h3 style={{ margin: "0 0 8px 0", color: "#1e293b" }}>Ajukan Event Baru</h3>
                        <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                            Kirim event baru dengan materi untuk direview
                        </p>
                    </Link>
                ) : (
                    <div style={{ ...actionCard, opacity: 0.5, cursor: "not-allowed" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🔒</div>
                        <h3 style={{ margin: "0 0 8px 0", color: "#1e293b" }}>Ajukan Event Baru</h3>
                        <p style={{ margin: 0, color: "#ef4444", fontSize: "0.9rem", fontWeight: "500" }}>
                            Lengkapi profil untuk mengaktifkan
                        </p>
                    </div>
                )}

                <Link to="/dashboard/affiliate/events" style={actionCard}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📊</div>
                    <h3 style={{ margin: "0 0 8px 0", color: "#1e293b" }}>Event Saya</h3>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                        Lihat semua event dan pendapatan
                    </p>
                </Link>

                <Link to="/dashboard/affiliate/withdraw" style={{
                    ...actionCard,
                    background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                    border: "2px solid #86efac"
                }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>💸</div>
                    <h3 style={{ margin: "0 0 8px 0", color: "#166534" }}>Tarik Dana</h3>
                    <p style={{ margin: 0, color: "#15803d", fontSize: "0.9rem" }}>
                        Saldo: {formatPrice(balance?.available_balance || 0)}
                    </p>
                </Link>
            </div>
        </div>
    );
}

const statCard = {
    background: "white",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    border: "1px solid #e2e8f0"
};

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
