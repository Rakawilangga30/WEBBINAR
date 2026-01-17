import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';

function MyCart() {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [promoCode, setPromoCode] = useState('');
    const [applyingPromo, setApplyingPromo] = useState(false);
    const [checkingOut, setCheckingOut] = useState(false);
    const navigate = useNavigate();
    const isCheckingOutRef = useRef(false);

    useEffect(() => {
        fetchCart();

        // Cleanup: reset affiliate code when leaving the page (unmount)
        return () => {
            // Only clear code if not currently checking out
            if (!isCheckingOutRef.current) {
                api.post('/user/cart/clear-code').catch(() => { });
            }
        };
    }, []);

    // Keep ref in sync with state
    useEffect(() => {
        isCheckingOutRef.current = checkingOut;
    }, [checkingOut]);

    const fetchCart = async () => {
        try {
            const res = await api.get('/user/cart');
            setCart(res.data);
            // Don't pre-fill promo code from saved cart - let user enter fresh each time
            // if (res.data?.affiliate_code) {
            //     setPromoCode(res.data.affiliate_code);
            // }
        } catch (err) {
            console.error('Error fetching cart:', err);
        } finally {
            setLoading(false);
        }
    };



    const handleRemoveItem = async (itemId) => {
        try {
            await api.delete(`/user/cart/items/${itemId}`);
            toast.success('Item dihapus');
            fetchCart();
        } catch (err) {
            toast.error('Gagal menghapus item');
        }
    };

    const handleApplyPromo = async () => {
        if (!promoCode.trim()) {
            toast.error('Masukkan kode promo');
            return;
        }
        setApplyingPromo(true);
        try {
            await api.post('/user/cart/apply-code', { code: promoCode });
            toast.success('Kode promo berhasil diterapkan!');
            fetchCart();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Kode tidak valid');
        } finally {
            setApplyingPromo(false);
        }
    };

    const handleClearCart = async () => {
        if (!window.confirm('Kosongkan keranjang?')) return;
        try {
            await api.delete('/user/cart');
            toast.success('Keranjang dikosongkan');
            fetchCart();
        } catch (err) {
            toast.error('Gagal mengosongkan keranjang');
        }
    };

    // For localhost testing when Midtrans popup fails
    const [pendingOrderId, setPendingOrderId] = useState(null);

    const handleCheckout = async () => {
        setCheckingOut(true);
        try {
            const res = await api.post('/user/cart/checkout');
            const orderId = res.data.order_id; // Base order ID for our DB
            setPendingOrderId(orderId); // Save for simulate payment fallback

            // Prioritize Snap popup over redirect
            if (res.data.token && window.snap) {
                window.snap.pay(res.data.token, {
                    onSuccess: async (result) => {
                        console.log('Payment success:', result);

                        // Check status to update database (important for localhost where webhook doesn't work)
                        try {
                            await api.post('/user/payment/check-status', { order_id: orderId });
                        } catch (e) {
                            console.log('Status check failed, webhook will handle:', e);
                        }

                        toast.success('Pembayaran berhasil!');
                        setCart(null);
                        setPendingOrderId(null);
                        navigate('/dashboard/my-courses');
                    },
                    onPending: async (result) => {
                        console.log('Payment pending:', result);

                        // Also check status for pending payments
                        try {
                            await api.post('/user/payment/check-status', { order_id: orderId });
                        } catch (e) {
                            console.log('Status check failed:', e);
                        }

                        toast.success('Pembayaran sedang diproses...');
                        navigate('/dashboard/payments');
                    },
                    onError: (result) => {
                        console.log('Payment error:', result);
                        toast.error('Pembayaran gagal - gunakan Simulasi Bayar untuk testing');
                        setCheckingOut(false);
                    },
                    onClose: async () => {
                        console.log('Payment popup closed');
                        // Check if payment was actually completed even though popup was closed
                        try {
                            const statusRes = await api.post('/user/payment/check-status', { order_id: orderId });
                            if (statusRes.data.status === 'PAID') {
                                toast.success('Pembayaran berhasil!');
                                setCart(null);
                                setPendingOrderId(null);
                                navigate('/dashboard/my-courses');
                                return;
                            }
                        } catch (e) {
                            console.log('Status check on close failed:', e);
                        }
                        setCheckingOut(false);
                        // Show hint about simulate payment
                        toast('Popup ditutup. Gunakan "Simulasi Bayar" jika Midtrans bermasalah.', { icon: 'ℹ️' });
                    }
                });
            } else if (res.data.redirect_url) {
                // Fallback to redirect
                window.location.href = res.data.redirect_url;
            } else {
                toast.error('Tidak dapat memproses pembayaran');
                setCheckingOut(false);
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Checkout gagal');
            setCheckingOut(false);
        }
    };

    // Simulate payment for localhost testing (bypasses Midtrans)
    const handleSimulatePayment = async () => {
        if (!pendingOrderId) {
            toast.error('Tidak ada order pending. Lakukan checkout dulu.');
            return;
        }

        try {
            const res = await api.post('/user/payment/simulate-success', { order_id: pendingOrderId });
            if (res.data.status === 'PAID') {
                toast.success('✅ Pembayaran disimulasikan berhasil!');
                setCart(null);
                setPendingOrderId(null);
                navigate('/dashboard/my-courses');
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Gagal simulasi pembayaran');
        }
    };

    const formatPrice = (price) => `Rp ${(price || 0).toLocaleString('id-ID')}`;

    if (loading) {
        return <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Memuat keranjang...</div>;
    }

    const items = cart?.items || [];
    const totalPrice = cart?.total_price || 0;
    const itemCount = cart?.item_count || 0;

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: "32px" }}>
                <h1 style={{ margin: "0 0 8px 0", color: "#1e293b", fontSize: "1.75rem" }}>
                    🛒 Keranjang Belanja
                </h1>
                <p style={{ margin: 0, color: "#64748b" }}>
                    {itemCount > 0 ? `${itemCount} item dalam keranjang` : 'Keranjang kosong'}
                </p>
            </div>

            {itemCount === 0 ? (
                <div style={{
                    background: "white",
                    borderRadius: "16px",
                    padding: "60px 40px",
                    textAlign: "center",
                    border: "1px solid #e2e8f0"
                }}>
                    <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🛒</div>
                    <h3 style={{ color: "#1e293b", marginBottom: "12px" }}>Keranjang Kosong</h3>
                    <p style={{ color: "#64748b", marginBottom: "24px" }}>
                        Yuk mulai belanja event atau kursus favorit kamu!
                    </p>
                    <Link to="/" style={{
                        display: "inline-block",
                        background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                        color: "white",
                        padding: "14px 32px",
                        borderRadius: "10px",
                        textDecoration: "none",
                        fontWeight: "600"
                    }}>
                        🔍 Jelajahi Event
                    </Link>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "24px" }}>
                    {/* Cart Items */}
                    <div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {items.map((item) => (
                                <div key={item.id} style={{
                                    background: "white",
                                    borderRadius: "12px",
                                    padding: "16px",
                                    border: "1px solid #e2e8f0",
                                    display: "flex",
                                    gap: "16px",
                                    alignItems: "center"
                                }}>
                                    <img
                                        src={item.thumbnail_url ? `http://localhost:8080/${item.thumbnail_url}` : '/placeholder.jpg'}
                                        alt={item.item_title}
                                        style={{
                                            width: "100px",
                                            height: "70px",
                                            objectFit: "cover",
                                            borderRadius: "8px",
                                            background: "#f1f5f9"
                                        }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: "0 0 4px 0", color: "#1e293b", fontSize: "1rem" }}>
                                            {item.item_title}
                                        </h4>
                                        <p style={{ margin: "0 0 8px 0", color: "#64748b", fontSize: "0.85rem" }}>
                                            📚 {item.event_title}
                                        </p>
                                        <span style={{
                                            fontSize: "12px",
                                            background: item.item_type === 'EVENT_PACKAGE' ? '#dbeafe' : '#f0fdf4',
                                            color: item.item_type === 'EVENT_PACKAGE' ? '#1d4ed8' : '#166534',
                                            padding: "4px 10px",
                                            borderRadius: "20px"
                                        }}>
                                            {item.item_type === 'EVENT_PACKAGE' ? '📦 Paket Lengkap' : '📹 Sesi'}
                                        </span>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>
                                            {formatPrice(item.price)}
                                        </div>
                                        <button
                                            onClick={() => handleRemoveItem(item.id)}
                                            style={{
                                                background: "#fee2e2",
                                                border: "none",
                                                color: "#dc2626",
                                                padding: "6px 12px",
                                                borderRadius: "6px",
                                                cursor: "pointer",
                                                fontSize: "13px"
                                            }}
                                        >
                                            🗑️ Hapus
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleClearCart}
                            style={{
                                marginTop: "16px",
                                background: "transparent",
                                border: "1px solid #e2e8f0",
                                color: "#64748b",
                                padding: "10px 20px",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontSize: "14px"
                            }}
                        >
                            🗑️ Kosongkan Keranjang
                        </button>
                    </div>

                    {/* Summary Sidebar */}
                    <div>
                        <div style={{
                            background: "white",
                            borderRadius: "16px",
                            padding: "24px",
                            border: "1px solid #e2e8f0",
                            position: "sticky",
                            top: "20px"
                        }}>
                            <h3 style={{ margin: "0 0 20px 0", color: "#1e293b" }}>Ringkasan Pembelian</h3>

                            {/* Promo Code */}
                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#1e293b", fontSize: "14px" }}>
                                    🎫 Kode Promo Affiliate
                                </label>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <input
                                        type="text"
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                        placeholder="Masukkan kode"
                                        disabled={!!cart?.affiliate_code}
                                        style={{
                                            flex: 1,
                                            padding: "12px",
                                            borderRadius: "8px",
                                            border: "1px solid #e2e8f0",
                                            fontSize: "15px",
                                            background: cart?.affiliate_code ? "#f8fafc" : "white"
                                        }}
                                    />
                                    {!cart?.affiliate_code && (
                                        <button
                                            onClick={handleApplyPromo}
                                            disabled={applyingPromo}
                                            style={{
                                                padding: "12px 16px",
                                                background: "#3b82f6",
                                                border: "none",
                                                color: "white",
                                                borderRadius: "8px",
                                                cursor: "pointer",
                                                fontWeight: "500"
                                            }}
                                        >
                                            {applyingPromo ? '...' : 'Terapkan'}
                                        </button>
                                    )}
                                </div>
                                {cart?.affiliate_code && (
                                    <div style={{
                                        marginTop: "8px",
                                        padding: "8px 12px",
                                        background: "#f0fdf4",
                                        border: "1px solid #86efac",
                                        borderRadius: "6px",
                                        color: "#166534",
                                        fontSize: "13px"
                                    }}>
                                        ✅ Kode <strong>{cart.affiliate_code}</strong> diterapkan!
                                    </div>
                                )}
                            </div>

                            {/* Price Breakdown */}
                            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "16px", marginBottom: "20px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px" }}>
                                    <span style={{ color: "#64748b" }}>Subtotal ({itemCount} item)</span>
                                    <span style={{ color: "#1e293b" }}>{formatPrice(totalPrice)}</span>
                                </div>
                                {cart?.affiliate_code && (
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px" }}>
                                        <span style={{ color: "#64748b" }}>Kode Promo</span>
                                        <span style={{ color: "#166534" }}>✓ Aktif</span>
                                    </div>
                                )}
                            </div>

                            {/* Total */}
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "16px",
                                background: "#f8fafc",
                                borderRadius: "10px",
                                marginBottom: "20px"
                            }}>
                                <span style={{ fontWeight: "600", color: "#1e293b", fontSize: "1.1rem" }}>Total</span>
                                <span style={{ fontWeight: "700", color: "#2563eb", fontSize: "1.5rem" }}>
                                    {formatPrice(totalPrice)}
                                </span>
                            </div>

                            {/* Checkout Button */}
                            <button
                                onClick={handleCheckout}
                                disabled={checkingOut}
                                style={{
                                    width: "100%",
                                    padding: "16px",
                                    background: checkingOut ? "#94a3b8" : "linear-gradient(135deg, #22c55e, #16a34a)",
                                    border: "none",
                                    borderRadius: "10px",
                                    color: "white",
                                    fontSize: "1.1rem",
                                    fontWeight: "700",
                                    cursor: checkingOut ? "not-allowed" : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px"
                                }}
                            >
                                💳 {checkingOut ? 'Memproses...' : `Bayar ${formatPrice(totalPrice)}`}
                            </button>

                            {/* Simulate Payment Button (Localhost Testing) */}
                            {pendingOrderId && (
                                <button
                                    onClick={handleSimulatePayment}
                                    style={{
                                        width: "100%",
                                        marginTop: "12px",
                                        padding: "12px",
                                        background: "linear-gradient(135deg, #f59e0b, #d97706)",
                                        border: "none",
                                        borderRadius: "10px",
                                        color: "white",
                                        fontSize: "0.95rem",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "8px"
                                    }}
                                >
                                    🧪 Simulasi Bayar (Testing)
                                </button>
                            )}

                            <p style={{ textAlign: "center", color: "#64748b", fontSize: "12px", marginTop: "12px" }}>
                                🔒 Pembayaran aman dengan Midtrans
                                {pendingOrderId && (
                                    <span style={{ display: "block", marginTop: "4px", color: "#f59e0b" }}>
                                        ⚠️ Ada order pending - gunakan Simulasi jika Midtrans bermasalah
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyCart;
