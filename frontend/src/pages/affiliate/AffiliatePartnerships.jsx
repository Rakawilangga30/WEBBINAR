import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';

function AffiliatePartnerships() {
    const navigate = useNavigate();
    const [partnerships, setPartnerships] = useState([]);
    const [loading, setLoading] = useState(true);

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
        fetchPartnerships();
    }, []);

    const fetchPartnerships = async () => {
        try {
            const res = await api.get('/affiliate/partnerships');
            setPartnerships(res.data || []);
        } catch (err) {
            console.error('Error fetching partnerships:', err);
        } finally {
            setLoading(false);
        }
    };

    const copyCode = (code) => {
        navigator.clipboard.writeText(code);
        toast.success('Kode berhasil disalin!');
    };

    if (loading) {
        return <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Memuat data...</div>;
    }

    const approvedCount = partnerships.filter(p => p.status === 'APPROVED').length;
    const pendingCount = partnerships.filter(p => p.status === 'PENDING').length;

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: "32px" }}>
                <h1 style={{ margin: "0 0 8px 0", color: "#1e293b", fontSize: "1.75rem" }}>
                    🎫 Kode Promo Saya
                </h1>
                <p style={{ margin: 0, color: "#64748b" }}>
                    Daftar event yang Anda promosikan sebagai affiliate
                </p>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "32px" }}>
                <div style={{ background: "linear-gradient(135deg, #27ae60, #2ecc71)", borderRadius: "12px", padding: "20px", color: "white" }}>
                    <div style={{ fontSize: "2rem", fontWeight: "700" }}>{approvedCount}</div>
                    <div style={{ opacity: 0.9 }}>Kode Aktif</div>
                </div>
                <div style={{ background: "linear-gradient(135deg, #f39c12, #e67e22)", borderRadius: "12px", padding: "20px", color: "white" }}>
                    <div style={{ fontSize: "2rem", fontWeight: "700" }}>{pendingCount}</div>
                    <div style={{ opacity: 0.9 }}>Menunggu Approval</div>
                </div>
            </div>

            {/* Content */}
            {partnerships.length === 0 ? (
                <div style={{ background: "white", borderRadius: "12px", padding: "60px 40px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "4rem", marginBottom: "16px" }}>📭</div>
                    <h3 style={{ color: "#1e293b", marginBottom: "12px" }}>Belum Ada Kemitraan</h3>
                    <p style={{ color: "#64748b", marginBottom: "24px" }}>
                        Kunjungi halaman event dan klik "Gabung Affiliate" untuk mempromosikan event
                    </p>
                    <Link to="/" style={{
                        display: "inline-block",
                        background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                        color: "white",
                        padding: "12px 32px",
                        borderRadius: "8px",
                        textDecoration: "none",
                        fontWeight: "600"
                    }}>
                        🔍 Cari Event
                    </Link>
                </div>
            ) : (
                <div style={{ display: "grid", gap: "16px" }}>
                    {partnerships.map((p) => (
                        <div key={p.id} style={{
                            background: "white",
                            borderRadius: "12px",
                            padding: "24px",
                            border: "1px solid #e2e8f0",
                            borderLeft: `4px solid ${p.status === 'APPROVED' ? '#27ae60' : p.status === 'PENDING' ? '#f39c12' : '#e74c3c'}`
                        }}>
                            {/* Header */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                                <div>
                                    <h3 style={{ margin: "0 0 6px 0", color: "#1e293b", fontSize: "1.25rem" }}>
                                        {p.event_title}
                                    </h3>
                                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                                        📍 {p.organization_name}
                                    </p>
                                </div>
                                <span style={{
                                    background: p.status === 'APPROVED' ? '#dcfce7' : p.status === 'PENDING' ? '#fef3c7' : '#fee2e2',
                                    color: p.status === 'APPROVED' ? '#166534' : p.status === 'PENDING' ? '#92400e' : '#991b1b',
                                    padding: "6px 14px",
                                    borderRadius: "20px",
                                    fontSize: "13px",
                                    fontWeight: "600"
                                }}>
                                    {p.status === 'APPROVED' ? '✓ Aktif' : p.status === 'PENDING' ? '⏳ Menunggu' : '✕ Ditolak'}
                                </span>
                            </div>

                            {/* Promo Code Section - Only for APPROVED */}
                            {p.status === 'APPROVED' && (
                                <div style={{
                                    background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                                    border: "2px dashed #86efac",
                                    borderRadius: "12px",
                                    padding: "20px",
                                    marginBottom: "16px"
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                                        <div>
                                            <div style={{ fontSize: "12px", color: "#15803d", marginBottom: "6px", fontWeight: "500" }}>
                                                KODE PROMO ANDA
                                            </div>
                                            <code style={{
                                                fontSize: "1.5rem",
                                                fontWeight: "700",
                                                color: "#166534",
                                                background: "white",
                                                padding: "8px 16px",
                                                borderRadius: "8px",
                                                display: "inline-block"
                                            }}>
                                                {p.unique_code}
                                            </code>
                                        </div>
                                        <button
                                            onClick={() => copyCode(p.unique_code)}
                                            style={{
                                                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                                                border: "none",
                                                color: "white",
                                                padding: "12px 24px",
                                                borderRadius: "8px",
                                                cursor: "pointer",
                                                fontWeight: "600",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                                fontSize: "0.95rem"
                                            }}
                                        >
                                            📋 Salin Kode
                                        </button>
                                    </div>
                                    <div style={{ marginTop: "16px", display: "flex", gap: "24px", flexWrap: "wrap" }}>
                                        <div style={{ color: "#15803d" }}>
                                            <span style={{ fontWeight: "500" }}>💰 Komisi:</span> <strong>{p.commission_percentage}%</strong>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Pending Message */}
                            {p.status === 'PENDING' && (
                                <div style={{
                                    background: "#fffbeb",
                                    border: "1px solid #fcd34d",
                                    borderRadius: "8px",
                                    padding: "16px",
                                    color: "#92400e"
                                }}>
                                    ⏳ Menunggu persetujuan dari organisasi. Anda akan mendapat notifikasi jika disetujui.
                                </div>
                            )}

                            {/* Rejected Message */}
                            {p.status === 'REJECTED' && (
                                <div style={{
                                    background: "#fef2f2",
                                    border: "1px solid #fca5a5",
                                    borderRadius: "8px",
                                    padding: "16px",
                                    color: "#991b1b"
                                }}>
                                    ❌ Permintaan Anda ditolak oleh organisasi.
                                </div>
                            )}

                            {/* Footer */}
                            <div style={{ marginTop: "16px", fontSize: "0.85rem", color: "#64748b" }}>
                                📅 Bergabung: {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AffiliatePartnerships;
