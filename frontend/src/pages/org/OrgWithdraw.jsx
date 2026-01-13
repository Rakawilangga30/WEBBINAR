import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';

function OrgWithdraw() {
    const [balance, setBalance] = useState(0);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        amount: '',
        bank_name: '',
        bank_account: '',
        bank_account_name: '',
        notes: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [balanceRes, historyRes] = await Promise.all([
                api.get('/organization/balance'),
                api.get('/user/withdrawal-requests?type=ORGANIZATION')
            ]);
            const data = balanceRes.data;
            let balanceValue = 0;

            if (data && data.balance) {
                balanceValue = data.balance.available_balance ?? data.balance.balance ?? 0;
            } else if (typeof data === 'number') {
                balanceValue = data;
            } else if (data && typeof data.available_balance === 'number') {
                balanceValue = data.available_balance;
            }

            setBalance(balanceValue);
            setHistory(historyRes.data || []);
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.amount || !form.bank_name || !form.bank_account || !form.bank_account_name) {
            toast.error('Lengkapi semua data');
            return;
        }
        if (parseFloat(form.amount) > balance) {
            toast.error('Jumlah melebihi saldo tersedia');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/organization/withdrawal-request', {
                ...form,
                amount: parseFloat(form.amount)
            });
            toast.success('Permintaan penarikan berhasil diajukan!');
            setShowForm(false);
            setForm({ amount: '', bank_name: '', bank_account: '', bank_account_name: '', notes: '' });
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Gagal submit');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            PENDING: { bg: '#fef3c7', color: '#b45309' },
            APPROVED: { bg: '#dcfce7', color: '#16a34a' },
            REJECTED: { bg: '#fee2e2', color: '#dc2626' }
        };
        const texts = { PENDING: 'Menunggu', APPROVED: 'Disetujui', REJECTED: 'Ditolak' };
        const s = styles[status] || { bg: '#e2e8f0', color: '#64748b' };
        return (
            <span style={{
                background: s.bg,
                color: s.color,
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: '600'
            }}>
                {texts[status] || status}
            </span>
        );
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
            <div style={{ marginBottom: "24px" }}>
                <h2 style={{ margin: "0 0 4px 0", color: "#1e293b", fontSize: "1.5rem" }}>
                    💰 Tarik Dana Organisasi
                </h2>
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                    Ajukan penarikan pendapatan organisasi Anda
                </p>
            </div>

            {/* Balance Card */}
            <div style={{
                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                borderRadius: "16px",
                padding: "32px",
                textAlign: "center",
                marginBottom: "24px",
                color: "white",
                boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.3)"
            }}>
                <div style={{ fontSize: "0.9rem", opacity: 0.9, marginBottom: "8px" }}>
                    💳 Saldo Tersedia
                </div>
                <div style={{ fontSize: "2.5rem", fontWeight: "700", marginBottom: "20px" }}>
                    Rp {balance.toLocaleString('id-ID')}
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    disabled={balance <= 0}
                    style={{
                        background: "white",
                        color: "#1d4ed8",
                        border: "none",
                        padding: "14px 32px",
                        borderRadius: "10px",
                        fontWeight: "600",
                        fontSize: "16px",
                        cursor: balance > 0 ? "pointer" : "not-allowed",
                        opacity: balance > 0 ? 1 : 0.6
                    }}
                >
                    Ajukan Penarikan
                </button>
                <p style={{ fontSize: "0.85rem", opacity: 0.9, marginTop: "16px", marginBottom: 0 }}>
                    ⚠️ 1 penarikan per bulan. Jika ditolak, bisa coba lagi (maks 7 percobaan/bulan)
                </p>
            </div>

            {/* History Section */}
            <div style={{
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                padding: "24px"
            }}>
                <h3 style={{ margin: "0 0 16px 0", color: "#1e293b", fontSize: "1rem" }}>
                    📋 Riwayat Permintaan
                </h3>

                {history.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📭</div>
                        <p style={{ margin: 0 }}>Belum ada riwayat penarikan</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: "12px" }}>
                        {history.map(h => (
                            <div key={h.id} style={{
                                border: "1px solid #e2e8f0",
                                borderRadius: "10px",
                                padding: "16px",
                                background: "#fafafa"
                            }}>
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: "12px",
                                    marginBottom: "8px"
                                }}>
                                    <div>
                                        <div style={{ fontWeight: "600", fontSize: "1.1rem", color: "#1e293b" }}>
                                            Rp {h.amount.toLocaleString('id-ID')}
                                        </div>
                                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                            {new Date(h.created_at).toLocaleDateString('id-ID', {
                                                day: 'numeric', month: 'long', year: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                    {getStatusBadge(h.status)}
                                </div>
                                <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                                    🏦 {h.bank_name} - {h.bank_account} ({h.bank_account_name})
                                </div>
                                {h.admin_notes && (
                                    <div style={{
                                        marginTop: "8px",
                                        padding: "8px 12px",
                                        background: "#f1f5f9",
                                        borderRadius: "6px",
                                        fontSize: "0.85rem",
                                        color: "#64748b"
                                    }}>
                                        💬 Admin: {h.admin_notes}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Request Form Modal */}
            {showForm && (
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
                        margin: "20px"
                    }}>
                        <h3 style={{ margin: "0 0 20px 0", color: "#1e293b" }}>Ajukan Penarikan Dana</h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: "16px" }}>
                                <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", fontSize: "14px", color: "#374151" }}>
                                    Jumlah (Rp)
                                </label>
                                <input
                                    type="number"
                                    value={form.amount}
                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                    placeholder="Contoh: 500000"
                                    max={balance}
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        borderRadius: "8px",
                                        border: "1px solid #d1d5db",
                                        fontSize: "15px",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: "16px" }}>
                                <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", fontSize: "14px", color: "#374151" }}>
                                    Nama Bank
                                </label>
                                <select
                                    value={form.bank_name}
                                    onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        borderRadius: "8px",
                                        border: "1px solid #d1d5db",
                                        fontSize: "15px",
                                        boxSizing: "border-box",
                                        background: "white"
                                    }}
                                >
                                    <option value="">Pilih Bank</option>
                                    <option value="BCA">BCA</option>
                                    <option value="BNI">BNI</option>
                                    <option value="BRI">BRI</option>
                                    <option value="Mandiri">Mandiri</option>
                                    <option value="CIMB Niaga">CIMB Niaga</option>
                                    <option value="DANA">DANA</option>
                                    <option value="OVO">OVO</option>
                                    <option value="GoPay">GoPay</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: "16px" }}>
                                <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", fontSize: "14px", color: "#374151" }}>
                                    Nomor Rekening
                                </label>
                                <input
                                    type="text"
                                    value={form.bank_account}
                                    onChange={(e) => setForm({ ...form, bank_account: e.target.value })}
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        borderRadius: "8px",
                                        border: "1px solid #d1d5db",
                                        fontSize: "15px",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: "16px" }}>
                                <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", fontSize: "14px", color: "#374151" }}>
                                    Atas Nama
                                </label>
                                <input
                                    type="text"
                                    value={form.bank_account_name}
                                    onChange={(e) => setForm({ ...form, bank_account_name: e.target.value })}
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        borderRadius: "8px",
                                        border: "1px solid #d1d5db",
                                        fontSize: "15px",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: "16px" }}>
                                <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", fontSize: "14px", color: "#374151" }}>
                                    Catatan (opsional)
                                </label>
                                <textarea
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    placeholder="Catatan tambahan..."
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        borderRadius: "8px",
                                        border: "1px solid #d1d5db",
                                        fontSize: "15px",
                                        minHeight: "60px",
                                        resize: "vertical",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>
                            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "20px" }}>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    style={{
                                        padding: "12px 24px",
                                        borderRadius: "8px",
                                        border: "1px solid #d1d5db",
                                        background: "white",
                                        color: "#374151",
                                        cursor: "pointer"
                                    }}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{
                                        padding: "12px 24px",
                                        borderRadius: "8px",
                                        border: "none",
                                        background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                                        color: "white",
                                        fontWeight: "600",
                                        cursor: submitting ? "not-allowed" : "pointer",
                                        opacity: submitting ? 0.7 : 1
                                    }}
                                >
                                    {submitting ? 'Mengirim...' : 'Kirim Permintaan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default OrgWithdraw;
