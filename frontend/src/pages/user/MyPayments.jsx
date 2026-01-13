import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api";

export default function MyPayments() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            const res = await api.get("/user/payments");
            setPayments(res.data.payments || []);
        } catch (error) {
            console.error("Failed to fetch payments:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleContinuePayment = (snapToken, orderId) => {
        if (!snapToken) {
            alert("Token pembayaran tidak tersedia. Silakan beli ulang.");
            return;
        }
        if (window.snap) {
            window.snap.pay(snapToken, {
                onSuccess: async () => {
                    // Check status to update database (important for localhost)
                    try {
                        if (orderId) {
                            await api.post('/user/payment/check-status', { order_id: orderId });
                        }
                    } catch (e) {
                        console.log('Status check failed:', e);
                    }
                    alert("Pembayaran berhasil!");
                    fetchPayments();
                },
                onPending: async () => {
                    // Check status for pending payments
                    try {
                        if (orderId) {
                            await api.post('/user/payment/check-status', { order_id: orderId });
                        }
                    } catch (e) {
                        console.log('Status check failed:', e);
                    }
                    alert("Pembayaran pending, silakan selesaikan pembayaran.");
                    fetchPayments();
                },
                onError: (result) => {
                    alert("Pembayaran gagal");
                },
                onClose: async () => {
                    // Check if payment was completed even though popup was closed
                    try {
                        if (orderId) {
                            const statusRes = await api.post('/user/payment/check-status', { order_id: orderId });
                            if (statusRes.data.status === 'PAID') {
                                alert("Pembayaran berhasil!");
                                fetchPayments();
                            }
                        }
                    } catch (e) {
                        console.log('Status check on close failed:', e);
                    }
                }
            });
        } else {
            alert("Payment gateway tidak tersedia. Pastikan Midtrans Snap sudah dimuat.");
        }
    };



    const formatPrice = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const getStatusBadge = (status) => {
        const styles = {
            PENDING: { bg: "#fef3c7", color: "#92400e", text: "Menunggu Bayar" },
            PAID: { bg: "#dcfce7", color: "#166534", text: "Lunas" },
            FAILED: { bg: "#fee2e2", color: "#991b1b", text: "Gagal" }
        };
        const s = styles[status] || styles.PENDING;
        return (
            <span style={{
                padding: "4px 12px",
                borderRadius: "20px",
                background: s.bg,
                color: s.color,
                fontSize: "0.8rem",
                fontWeight: "600"
            }}>
                {s.text}
            </span>
        );
    };

    const filteredPayments = payments.filter(p => {
        if (filter === "all") return true;
        return p.status?.toLowerCase() === filter.toLowerCase();
    });

    if (loading) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <div style={{
                    width: "40px",
                    height: "40px",
                    border: "3px solid #e2e8f0",
                    borderTopColor: "#3b82f6",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 16px"
                }}></div>
                Memuat pembayaran...
            </div>
        );
    }

    return (
        <div>
            <div style={{ marginBottom: "24px" }}>
                <h2 style={{ margin: "0 0 8px 0", color: "#1e293b", fontSize: "1.5rem" }}>
                    💳 Riwayat Pembayaran
                </h2>
                <p style={{ margin: 0, color: "#64748b" }}>
                    Lihat status pembayaran dan lanjutkan pembayaran yang tertunda
                </p>
            </div>

            {/* Filter Tabs */}
            <div style={{
                display: "flex",
                gap: "8px",
                marginBottom: "20px",
                flexWrap: "wrap"
            }}>
                {[
                    { key: "all", label: "Semua" },
                    { key: "pending", label: "Pending" },
                    { key: "paid", label: "Lunas" },
                    { key: "failed", label: "Gagal" }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "8px",
                            border: "none",
                            background: filter === tab.key ? "#3b82f6" : "#f1f5f9",
                            color: filter === tab.key ? "white" : "#64748b",
                            fontWeight: "500",
                            cursor: "pointer",
                            fontSize: "0.9rem"
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {filteredPayments.length === 0 ? (
                <div style={{
                    background: "white",
                    borderRadius: "12px",
                    padding: "60px 20px",
                    textAlign: "center",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                }}>
                    <div style={{ fontSize: "4rem", marginBottom: "16px" }}>💳</div>
                    <h3 style={{ margin: "0 0 12px 0", color: "#1e293b" }}>
                        {filter === "all" ? "Belum Ada Pembayaran" : `Tidak Ada Pembayaran ${filter.toUpperCase()}`}
                    </h3>
                    <p style={{ margin: "0 0 24px 0", color: "#64748b" }}>
                        Riwayat pembayaran Anda akan muncul di sini.
                    </p>
                    <Link to="/" style={{
                        display: "inline-block",
                        padding: "12px 24px",
                        background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                        color: "white",
                        borderRadius: "8px",
                        textDecoration: "none",
                        fontWeight: "600"
                    }}>
                        🔍 Jelajahi Kursus
                    </Link>
                </div>
            ) : (
                <div style={{
                    background: "white",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                }}>
                    {filteredPayments.map((payment, idx) => (
                        <div key={payment.id} style={{
                            padding: "20px",
                            borderBottom: idx < filteredPayments.length - 1 ? "1px solid #e2e8f0" : "none",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "16px"
                        }}>
                            <div style={{ flex: 1, minWidth: "200px" }}>
                                <h4 style={{ margin: "0 0 4px 0", color: "#1e293b" }}>
                                    {payment.session_title || "Sesi Kursus"}
                                </h4>
                                <p style={{ margin: "0 0 8px 0", color: "#64748b", fontSize: "0.85rem" }}>
                                    {payment.event_title || "Event"}
                                </p>
                                <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                                    {getStatusBadge(payment.status)}
                                    <span style={{ color: "#64748b", fontSize: "0.8rem" }}>
                                        {new Date(payment.created_at).toLocaleDateString('id-ID')}
                                    </span>
                                </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div style={{ fontWeight: "700", fontSize: "1.1rem", color: "#1e293b", marginBottom: "8px" }}>
                                    {formatPrice(payment.amount)}
                                </div>

                                {/* Continue Payment Button for PENDING payments */}
                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                    {payment.status === "PENDING" && payment.snap_token && (
                                        <button
                                            onClick={() => handleContinuePayment(payment.snap_token, payment.order_id)}
                                            style={{
                                                padding: "8px 16px",
                                                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "6px",
                                                cursor: "pointer",
                                                fontWeight: "600",
                                                fontSize: "0.85rem"
                                            }}
                                        >
                                            💳 Lanjutkan Bayar
                                        </button>
                                    )}
                                </div>

                                {/* View Course Button for PAID payments */}
                                {payment.status === "PAID" && payment.event_id && (
                                    <Link
                                        to={`/event/${payment.event_id}`}
                                        style={{
                                            display: "inline-block",
                                            padding: "8px 16px",
                                            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                                            color: "white",
                                            borderRadius: "6px",
                                            textDecoration: "none",
                                            fontWeight: "600",
                                            fontSize: "0.85rem"
                                        }}
                                    >
                                        📚 Lihat Kursus
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
