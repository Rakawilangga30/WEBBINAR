import { useState, useEffect } from 'react';
import api from '../../api';

function OrgAffiliateStats() {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingAffiliate, setEditingAffiliate] = useState(null);
    const [editForm, setEditForm] = useState({ unique_code: '', commission_percentage: 10, expires_at: '' });
    const [processing, setProcessing] = useState(null);

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

    const handleEdit = (affiliate) => {
        setEditingAffiliate(affiliate);
        setEditForm({
            unique_code: affiliate.unique_code,
            commission_percentage: affiliate.commission_percentage,
            expires_at: affiliate.expires_at ? affiliate.expires_at.split('T')[0] : ''
        });
    };

    const handleSaveEdit = async () => {
        setProcessing(editingAffiliate.id);
        try {
            await api.put(`/organization/affiliate-requests/${editingAffiliate.id}/update`, editForm);
            alert('Berhasil diupdate!');
            setEditingAffiliate(null);
            fetchStats();
        } catch (err) {
            alert(err.response?.data?.error || 'Gagal update');
        } finally {
            setProcessing(null);
        }
    };

    const handleToggleActive = async (affiliate) => {
        if (!confirm(`Yakin ingin ${affiliate.is_active !== false ? 'menjadikan tidak aktif' : 'mengaktifkan kembali'} affiliate ini?`)) return;

        setProcessing(affiliate.id);
        try {
            await api.put(`/organization/affiliate-requests/${affiliate.id}/toggle-active`);
            fetchStats();
        } catch (err) {
            alert(err.response?.data?.error || 'Gagal mengubah status');
        } finally {
            setProcessing(null);
        }
    };

    const handleDelete = async (affiliate) => {
        if (!confirm(`Yakin ingin menghapus affiliate "${affiliate.user_name}"? Aksi ini tidak dapat dibatalkan.`)) return;
        setProcessing(affiliate.id);
        try {
            await api.delete(`/organization/affiliate-requests/${affiliate.id}`);
            alert('Affiliate berhasil dihapus');
            fetchStats();
        } catch (err) {
            alert(err.response?.data?.error || 'Gagal menghapus');
        } finally {
            setProcessing(null);
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
                        📊 Statistik & Kelola Affiliate
                    </h2>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                        Kelola affiliate yang mempromosikan event Anda
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
                                    <th style={{ textAlign: "center", padding: "12px 8px", color: "#64748b", fontWeight: "600" }}>Jangka Waktu</th>
                                    <th style={{ textAlign: "center", padding: "12px 8px", color: "#64748b", fontWeight: "600" }}>Status</th>
                                    <th style={{ textAlign: "center", padding: "12px 8px", color: "#64748b", fontWeight: "600" }}>Pembeli</th>
                                    <th style={{ textAlign: "right", padding: "12px 8px", color: "#64748b", fontWeight: "600" }}>Pendapatan</th>
                                    <th style={{ textAlign: "center", padding: "12px 8px", color: "#64748b", fontWeight: "600" }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.map((s) => (
                                    <tr key={s.id} style={{
                                        borderBottom: "1px solid #e2e8f0",
                                        opacity: s.is_active === false ? 0.5 : 1
                                    }}>
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
                                        <td style={{ textAlign: "center", padding: "12px 8px", fontSize: "0.8rem", color: "#64748b" }}>
                                            {s.expires_at ? (
                                                <span style={{
                                                    background: new Date(s.expires_at) < new Date() ? "#fee2e2" : "#dcfce7",
                                                    color: new Date(s.expires_at) < new Date() ? "#dc2626" : "#16a34a",
                                                    padding: "3px 8px",
                                                    borderRadius: "4px"
                                                }}>
                                                    {new Date(s.expires_at).toLocaleDateString('id-ID')}
                                                </span>
                                            ) : (
                                                <span style={{ color: "#94a3b8" }}>Selamanya</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: "center", padding: "12px 8px" }}>
                                            <span style={{
                                                background: s.is_active !== false ? "#dcfce7" : "#fee2e2",
                                                color: s.is_active !== false ? "#16a34a" : "#dc2626",
                                                padding: "3px 10px",
                                                borderRadius: "12px",
                                                fontSize: "0.75rem",
                                                fontWeight: "600"
                                            }}>
                                                {s.is_active !== false ? "Aktif" : "Tidak Aktif"}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: "center", padding: "12px 8px", fontWeight: "600", color: "#3b82f6" }}>
                                            {s.total_buyers || 0}
                                        </td>
                                        <td style={{ textAlign: "right", padding: "12px 8px", fontWeight: "600", color: "#22c55e" }}>
                                            Rp {(s.total_earnings || 0).toLocaleString('id-ID')}
                                        </td>
                                        <td style={{ textAlign: "center", padding: "12px 8px" }}>
                                            <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                                                <button
                                                    onClick={() => handleEdit(s)}
                                                    disabled={processing === s.id}
                                                    style={{
                                                        padding: "4px 8px",
                                                        background: "#eff6ff",
                                                        color: "#3b82f6",
                                                        border: "1px solid #bfdbfe",
                                                        borderRadius: "6px",
                                                        cursor: "pointer",
                                                        fontSize: "0.75rem"
                                                    }}
                                                >✏️</button>
                                                <button
                                                    onClick={() => handleToggleActive(s)}
                                                    disabled={processing === s.id}
                                                    style={{
                                                        padding: "4px 8px",
                                                        background: s.is_active !== false ? "#fef3c7" : "#dcfce7",
                                                        color: s.is_active !== false ? "#b45309" : "#16a34a",
                                                        border: `1px solid ${s.is_active !== false ? "#fcd34d" : "#86efac"}`,
                                                        borderRadius: "6px",
                                                        cursor: "pointer",
                                                        fontSize: "0.75rem"
                                                    }}
                                                >{s.is_active !== false ? "⏸️" : "▶️"}</button>
                                                <button
                                                    onClick={() => handleDelete(s)}
                                                    disabled={processing === s.id}
                                                    style={{
                                                        padding: "4px 8px",
                                                        background: "#fef2f2",
                                                        color: "#dc2626",
                                                        border: "1px solid #fecaca",
                                                        borderRadius: "6px",
                                                        cursor: "pointer",
                                                        fontSize: "0.75rem"
                                                    }}
                                                >🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingAffiliate && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0,0,0,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000
                }}>
                    <div style={{
                        background: "white",
                        borderRadius: "16px",
                        padding: "28px",
                        width: "100%",
                        maxWidth: "450px",
                        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)"
                    }}>
                        <h3 style={{ margin: "0 0 20px 0", color: "#1e293b" }}>
                            ✏️ Edit Affiliate
                        </h3>
                        <p style={{ margin: "0 0 16px 0", color: "#64748b", fontSize: "0.9rem" }}>
                            {editingAffiliate.user_name} - {editingAffiliate.event_title}
                        </p>

                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#374151" }}>
                                Kode Promo
                            </label>
                            <input
                                type="text"
                                value={editForm.unique_code}
                                onChange={(e) => setEditForm({ ...editForm, unique_code: e.target.value.toUpperCase() })}
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "8px",
                                    fontSize: "0.95rem"
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#374151" }}>
                                Persentase Komisi (1-50%)
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="50"
                                value={editForm.commission_percentage}
                                onChange={(e) => setEditForm({ ...editForm, commission_percentage: parseFloat(e.target.value) || 0 })}
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "8px",
                                    fontSize: "0.95rem"
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#374151" }}>
                                Berlaku Sampai (kosongkan untuk selamanya)
                            </label>
                            <input
                                type="date"
                                value={editForm.expires_at}
                                onChange={(e) => setEditForm({ ...editForm, expires_at: e.target.value })}
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "8px",
                                    fontSize: "0.95rem"
                                }}
                            />
                        </div>

                        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                            <button
                                onClick={() => setEditingAffiliate(null)}
                                style={{
                                    padding: "10px 20px",
                                    background: "white",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    color: "#64748b"
                                }}
                            >Batal</button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={processing}
                                style={{
                                    padding: "10px 20px",
                                    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                                    border: "none",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    color: "white",
                                    fontWeight: "600"
                                }}
                            >{processing ? "Menyimpan..." : "💾 Simpan"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default OrgAffiliateStats;
