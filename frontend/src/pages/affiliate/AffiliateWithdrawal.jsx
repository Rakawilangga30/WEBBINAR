import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

export default function AffiliateWithdrawal() {
    const [balance, setBalance] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        amount: '',
        payment_method: 'BANK',
        account_name: '',
        account_number: '',
        bank_name: ''
    });

    const MIN_WITHDRAWAL = 50000;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [balanceRes, historyRes] = await Promise.all([
                api.get('/affiliate/balance'),
                api.get('/affiliate/withdrawals')
            ]);
            setBalance(balanceRes.data.balance);
            setHistory(historyRes.data.transactions || []);
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

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const amount = parseInt(form.amount) || 0;

        if (amount < MIN_WITHDRAWAL) {
            alert(`Minimal penarikan ${formatPrice(MIN_WITHDRAWAL)}`);
            return;
        }

        if (amount > (balance?.available_balance || 0)) {
            alert('Saldo tidak mencukupi');
            return;
        }

        if (!form.account_name || !form.account_number) {
            alert('Lengkapi data rekening/akun');
            return;
        }

        if (form.payment_method === 'BANK' && !form.bank_name) {
            alert('Masukkan nama bank');
            return;
        }

        // Confirmation
        const methodLabel = form.payment_method === 'BANK'
            ? `Bank ${form.bank_name}`
            : form.payment_method;

        const confirmMsg = `Konfirmasi Penarikan:\n\n` +
            `Jumlah: ${formatPrice(amount)}\n` +
            `Ke: ${methodLabel}\n` +
            `Nama: ${form.account_name}\n` +
            `No. Rekening/Akun: ${form.account_number}\n\n` +
            `Lanjutkan?`;

        if (!window.confirm(confirmMsg)) return;

        setSubmitting(true);

        try {
            const response = await api.post('/affiliate/withdraw', {
                amount: amount,
                payment_method: form.payment_method,
                account_name: form.account_name,
                account_number: form.account_number,
                bank_name: form.bank_name
            });

            alert(`✅ ${response.data.message}\n\nReferensi: ${response.data.reference}\nSaldo baru: ${formatPrice(response.data.new_balance)}`);

            // Reset form and refresh data
            setForm({ ...form, amount: '' });
            fetchData();
        } catch (error) {
            alert('❌ ' + (error.response?.data?.error || 'Gagal memproses penarikan'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                Memuat...
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: "32px" }}>
                <Link to="/dashboard/affiliate" style={{ color: "#3b82f6", textDecoration: "none", fontSize: "0.9rem", display: "inline-block", marginBottom: "12px" }}>
                    ← Kembali ke Dashboard
                </Link>
                <h1 style={{ margin: "0 0 8px 0", color: "#1e293b", fontSize: "1.75rem" }}>💸 Tarik Dana</h1>
                <p style={{ margin: 0, color: "#64748b" }}>Tarik pendapatan Anda ke rekening bank atau e-wallet</p>
            </div>

            {/* Balance Summary */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
                marginBottom: "32px"
            }}>
                <div style={{
                    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                    borderRadius: "12px",
                    padding: "20px",
                    color: "white"
                }}>
                    <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>💳 Saldo Tersedia</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: "700", marginTop: "4px" }}>
                        {formatPrice(balance?.available_balance || 0)}
                    </div>
                </div>
                <div style={{
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    borderRadius: "12px",
                    padding: "20px",
                    color: "white"
                }}>
                    <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>💰 Total Pendapatan</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: "700", marginTop: "4px" }}>
                        {formatPrice(balance?.total_earned || 0)}
                    </div>
                </div>
                <div style={{
                    background: "linear-gradient(135deg, #64748b, #475569)",
                    borderRadius: "12px",
                    padding: "20px",
                    color: "white"
                }}>
                    <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>📤 Total Ditarik</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: "700", marginTop: "4px" }}>
                        {formatPrice(balance?.total_withdrawn || 0)}
                    </div>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                {/* Withdrawal Form */}
                <div style={{
                    background: "white",
                    borderRadius: "16px",
                    padding: "24px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    border: "1px solid #e2e8f0"
                }}>
                    <h2 style={{ margin: "0 0 20px 0", color: "#1e293b", fontSize: "1.25rem" }}>Form Penarikan</h2>

                    <div style={{
                        background: "#fef3c7",
                        border: "1px solid #fcd34d",
                        borderRadius: "8px",
                        padding: "12px",
                        marginBottom: "20px",
                        fontSize: "0.9rem",
                        color: "#92400e"
                    }}>
                        ⚠️ Minimal penarikan: <strong>{formatPrice(MIN_WITHDRAWAL)}</strong>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: "16px" }}>
                            <label style={labelStyle}>Jumlah Penarikan (Rp)</label>
                            <input
                                type="number"
                                value={form.amount}
                                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                placeholder="Masukkan jumlah"
                                style={inputStyle}
                                min={MIN_WITHDRAWAL}
                                max={balance?.available_balance || 0}
                                required
                            />
                            <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
                                <button type="button" onClick={() => setForm({ ...form, amount: String(Math.floor((balance?.available_balance || 0) * 0.5)) })}
                                    style={quickAmountBtn}>50%</button>
                                <button type="button" onClick={() => setForm({ ...form, amount: String(Math.floor((balance?.available_balance || 0) * 0.75)) })}
                                    style={quickAmountBtn}>75%</button>
                                <button type="button" onClick={() => setForm({ ...form, amount: String(balance?.available_balance || 0) })}
                                    style={quickAmountBtn}>Semua</button>
                            </div>
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <label style={labelStyle}>Metode Pembayaran</label>
                            <select
                                value={form.payment_method}
                                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                                style={inputStyle}
                            >
                                <option value="BANK">🏦 Transfer Bank</option>
                                <option value="DANA">💙 DANA</option>
                                <option value="GOPAY">💚 GoPay</option>
                                <option value="OVO">💜 OVO</option>
                                <option value="SHOPEEPAY">🧡 ShopeePay</option>
                            </select>
                        </div>

                        {form.payment_method === 'BANK' && (
                            <div style={{ marginBottom: "16px" }}>
                                <label style={labelStyle}>Nama Bank</label>
                                <input
                                    type="text"
                                    value={form.bank_name}
                                    onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                                    placeholder="BCA, Mandiri, BNI, BRI, dll"
                                    style={inputStyle}
                                    required
                                />
                            </div>
                        )}

                        <div style={{ marginBottom: "16px" }}>
                            <label style={labelStyle}>
                                {form.payment_method === 'BANK' ? 'Nomor Rekening' : 'Nomor HP/Akun'}
                            </label>
                            <input
                                type="text"
                                value={form.account_number}
                                onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                                placeholder={form.payment_method === 'BANK' ? '1234567890' : '08123456789'}
                                style={inputStyle}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: "24px" }}>
                            <label style={labelStyle}>Nama Pemilik Akun</label>
                            <input
                                type="text"
                                value={form.account_name}
                                onChange={(e) => setForm({ ...form, account_name: e.target.value })}
                                placeholder="Nama sesuai rekening/akun"
                                style={inputStyle}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || (balance?.available_balance || 0) < MIN_WITHDRAWAL}
                            style={{
                                width: "100%",
                                padding: "14px",
                                background: submitting || (balance?.available_balance || 0) < MIN_WITHDRAWAL
                                    ? "#94a3b8"
                                    : "linear-gradient(135deg, #10b981, #059669)",
                                color: "white",
                                border: "none",
                                borderRadius: "10px",
                                cursor: submitting || (balance?.available_balance || 0) < MIN_WITHDRAWAL ? "not-allowed" : "pointer",
                                fontWeight: "600",
                                fontSize: "1rem"
                            }}
                        >
                            {submitting ? "Memproses..." : "💸 Tarik Dana Sekarang"}
                        </button>

                        {(balance?.available_balance || 0) < MIN_WITHDRAWAL && (
                            <div style={{ marginTop: "12px", textAlign: "center", color: "#ef4444", fontSize: "0.9rem" }}>
                                Saldo belum mencukupi minimal penarikan
                            </div>
                        )}
                    </form>
                </div>

                {/* Withdrawal History */}
                <div style={{
                    background: "white",
                    borderRadius: "16px",
                    padding: "24px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    border: "1px solid #e2e8f0"
                }}>
                    <h2 style={{ margin: "0 0 20px 0", color: "#1e293b", fontSize: "1.25rem" }}>📋 Riwayat Penarikan</h2>

                    {history.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                            <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📭</div>
                            <div>Belum ada riwayat penarikan</div>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {history.map((tx) => (
                                <div key={tx.id} style={{
                                    background: "#f8fafc",
                                    borderRadius: "10px",
                                    padding: "16px",
                                    border: "1px solid #e2e8f0"
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <div>
                                            <div style={{ fontWeight: "600", color: "#1e293b", fontSize: "1.1rem" }}>
                                                {formatPrice(tx.amount)}
                                            </div>
                                            <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "4px" }}>
                                                {tx.description}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <div style={{
                                                background: "#dcfce7",
                                                color: "#166534",
                                                padding: "4px 10px",
                                                borderRadius: "20px",
                                                fontSize: "0.75rem",
                                                fontWeight: "600"
                                            }}>
                                                ✅ Berhasil
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{
                                        marginTop: "12px",
                                        paddingTop: "12px",
                                        borderTop: "1px solid #e2e8f0",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        fontSize: "0.8rem",
                                        color: "#94a3b8"
                                    }}>
                                        <span>{tx.reference_id}</span>
                                        <span>{formatDate(tx.created_at)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const labelStyle = {
    display: "block",
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "6px"
};

const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "0.95rem",
    boxSizing: "border-box"
};

const quickAmountBtn = {
    padding: "6px 12px",
    background: "#e2e8f0",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.8rem",
    color: "#475569"
};
