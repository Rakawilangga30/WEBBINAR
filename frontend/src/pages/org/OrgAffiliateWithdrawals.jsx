import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';

function OrgAffiliateWithdrawals() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/organization/affiliate-withdrawals');
            setRequests(res.data || []);
        } catch (err) {
            console.error('Error:', err);
            toast.error('Gagal memuat data');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async (id, userName, amount) => {
        if (!window.confirm(`Konfirmasi payout Rp ${amount.toLocaleString('id-ID')} untuk ${userName}? Dana akan diteruskan ke admin untuk diproses.`)) return;

        setProcessing(id);
        try {
            await api.put(`/organization/affiliate-withdrawals/${id}/confirm`);
            toast.success(`✅ Payout ${userName} berhasil dikonfirmasi!`);
            fetchRequests();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Gagal konfirmasi');
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (id, userName) => {
        const reason = window.prompt(`Alasan penolakan payout ${userName}:`);
        if (reason === null) return; // user cancel
        if (!reason.trim()) {
            toast.error('Berikan alasan penolakan');
            return;
        }

        setProcessing(id);
        try {
            await api.put(`/organization/affiliate-withdrawals/${id}/reject`, { reason });
            toast.success('Payout ditolak');
            fetchRequests();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Gagal menolak');
        } finally {
            setProcessing(null);
        }
    };

    const getStatusBadge = (req) => {
        if (req.status === 'REJECTED') return <span style={badge('#fee2e2', '#dc2626')}>❌ Ditolak</span>;
        if (req.payout_status === 'COMPLETED') return <span style={badge('#dcfce7', '#15803d')}>✅ Selesai</span>;
        if (req.payout_status === 'PROCESSING') return <span style={badge('#dbeafe', '#1d4ed8')}>🔄 Diproses Admin</span>;
        if (req.org_confirmed) return <span style={badge('#fef9c3', '#854d0e')}>⏳ Menunggu Admin</span>;
        return <span style={badge('#fef3c7', '#b45309')}>🔔 Perlu Konfirmasi</span>;
    };

    const badge = (bg, color) => ({
        background: bg, color, padding: '4px 12px', borderRadius: '20px',
        fontSize: '0.78rem', fontWeight: '700', whiteSpace: 'nowrap'
    });

    const pendingCount = requests.filter(r => !r.org_confirmed && r.status === 'PENDING').length;

    if (loading) {
        return <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Memuat data...</div>;
    }

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: "24px" }}>
                <h2 style={{ margin: "0 0 4px 0", color: "#1e293b", fontSize: "1.5rem" }}>
                    💸 Konfirmasi Payout Affiliate
                </h2>
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                    Konfirmasi permintaan payout dari affiliate di event Anda sebelum diproses admin
                </p>
            </div>

            {/* Info box */}
            <div style={{
                background: "#fffbeb", border: "1px solid #fbbf24", borderRadius: "10px",
                padding: "14px 18px", marginBottom: "20px", fontSize: "0.85rem", color: "#92400e"
            }}>
                <strong>📌 Cara Kerja:</strong> Affiliate punya partnership aktif di event Anda bisa mengajukan payout.
                Anda perlu <strong>mengkonfirmasi</strong> bahwa mereka memang terdaftar sebelum admin memprosesnya ke sistem payout.
            </div>

            {/* Stats */}
            {pendingCount > 0 && (
                <div style={{
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    borderRadius: "12px", padding: "16px 24px", marginBottom: "20px",
                    color: "white", display: "flex", alignItems: "center", gap: "12px"
                }}>
                    <div style={{ fontSize: "2rem", fontWeight: "700" }}>{pendingCount}</div>
                    <div>
                        <div style={{ fontWeight: "600" }}>Payout Menunggu Konfirmasi</div>
                        <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>Harap segera ditinjau</div>
                    </div>
                </div>
            )}

            {/* List */}
            {requests.length === 0 ? (
                <div style={{
                    background: "white", borderRadius: "12px", padding: "60px",
                    textAlign: "center", border: "1px solid #e2e8f0"
                }}>
                    <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📭</div>
                    <p style={{ color: "#64748b", margin: 0 }}>Belum ada permintaan payout dari affiliate</p>
                </div>
            ) : (
                <div style={{ display: "grid", gap: "14px" }}>
                    {requests.map((req) => (
                        <div key={req.id} style={{
                            background: "white", borderRadius: "12px", padding: "20px",
                            border: "1px solid #e2e8f0",
                            borderLeft: `4px solid ${req.payout_status === 'COMPLETED' ? '#22c55e' :
                                    req.payout_status === 'PROCESSING' ? '#3b82f6' :
                                        req.org_confirmed ? '#f59e0b' :
                                            req.status === 'REJECTED' ? '#ef4444' : '#f97316'
                                }`
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
                                <div>
                                    <h3 style={{ margin: "0 0 4px 0", color: "#1e293b" }}>{req.user_name}</h3>
                                    <div style={{ color: "#64748b", fontSize: "0.85rem" }}>{req.user_email}</div>
                                </div>
                                {getStatusBadge(req)}
                            </div>

                            {/* Detail grid */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginBottom: "14px" }}>
                                <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: "8px" }}>
                                    <div style={{ color: "#64748b", fontSize: "12px", marginBottom: "2px" }}>💰 Jumlah Payout</div>
                                    <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "1.05rem" }}>
                                        Rp {req.amount?.toLocaleString('id-ID')}
                                    </div>
                                </div>
                                <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: "8px" }}>
                                    <div style={{ color: "#64748b", fontSize: "12px", marginBottom: "2px" }}>🏦 Rekening Tujuan</div>
                                    <div style={{ fontWeight: "500", color: "#1e293b", fontSize: "0.9rem" }}>
                                        {req.bank_name} — {req.bank_account}
                                    </div>
                                    <div style={{ color: "#64748b", fontSize: "0.8rem" }}>{req.bank_account_name}</div>
                                </div>
                                <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: "8px" }}>
                                    <div style={{ color: "#64748b", fontSize: "12px", marginBottom: "2px" }}>📅 Event Partnership</div>
                                    <div style={{ fontWeight: "500", color: "#1e293b", fontSize: "0.85rem" }}>
                                        {req.event_titles || '-'}
                                    </div>
                                </div>
                                <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: "8px" }}>
                                    <div style={{ color: "#64748b", fontSize: "12px", marginBottom: "2px" }}>🗓️ Tanggal Request</div>
                                    <div style={{ fontWeight: "500", color: "#1e293b", fontSize: "0.85rem" }}>
                                        {new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>
                                </div>
                            </div>

                            {/* Confirmed info */}
                            {req.org_confirmed && req.status !== 'REJECTED' && (
                                <div style={{
                                    padding: "8px 14px", background: "#f0fdf4",
                                    borderRadius: "8px", fontSize: "0.83rem", color: "#15803d",
                                    marginBottom: "10px"
                                }}>
                                    ✅ Dikonfirmasi oleh organisasi {req.org_confirmed_at ? `pada ${new Date(req.org_confirmed_at).toLocaleDateString('id-ID')}` : ''}
                                </div>
                            )}

                            {/* Action buttons — only if pending and not yet confirmed */}
                            {!req.org_confirmed && req.status === 'PENDING' && (
                                <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                                    <button
                                        onClick={() => handleConfirm(req.id, req.user_name, req.amount)}
                                        disabled={processing === req.id}
                                        style={{
                                            flex: 1, padding: "10px 16px",
                                            background: "linear-gradient(135deg, #22c55e, #16a34a)",
                                            border: "none", borderRadius: "8px", color: "white",
                                            fontWeight: "600", cursor: "pointer",
                                            opacity: processing === req.id ? 0.5 : 1
                                        }}
                                    >
                                        {processing === req.id ? '...' : '✅ Konfirmasi Payout'}
                                    </button>
                                    <button
                                        onClick={() => handleReject(req.id, req.user_name)}
                                        disabled={processing === req.id}
                                        style={{
                                            flex: 1, padding: "10px 16px",
                                            background: "transparent",
                                            border: "2px solid #ef4444",
                                            borderRadius: "8px", color: "#ef4444",
                                            fontWeight: "600", cursor: "pointer",
                                            opacity: processing === req.id ? 0.5 : 1
                                        }}
                                    >
                                        ❌ Tolak
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default OrgAffiliateWithdrawals;
