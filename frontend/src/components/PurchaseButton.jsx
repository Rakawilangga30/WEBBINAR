import { useState } from 'react';
import api from '../api';

/**
 * PurchaseButton Component
 * 
 * A reusable button for purchasing sessions via Midtrans Snap
 * 
 * @param {Object} props
 * @param {number} props.sessionId - The session ID to purchase
 * @param {string} props.sessionName - Display name of the session
 * @param {number} props.price - Price in Rupiah
 * @param {function} props.onSuccess - Callback when payment succeeds
 * @param {function} props.onPending - Callback when payment is pending
 * @param {function} props.onError - Callback when payment fails
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {string} props.className - Additional CSS classes
 */
export default function PurchaseButton({
    sessionId,
    sessionName,
    price,
    onSuccess,
    onPending,
    onError,
    disabled = false,
    className = ''
}) {
    const [loading, setLoading] = useState(false);

    const formatPrice = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const handlePurchase = async () => {
        if (loading || disabled) return;

        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Silakan login terlebih dahulu untuk membeli');
            window.location.href = '/login';
            return;
        }

        setLoading(true);

        try {
            // Get payment token from backend
            const response = await api.post('/user/payment/token', {
                session_id: sessionId
            });

            const { token: snapToken, order_id } = response.data;

            // Check if Snap is available
            if (!window.snap) {
                throw new Error('Midtrans Snap tidak tersedia. Silakan refresh halaman.');
            }

            // Open Snap payment popup
            window.snap.pay(snapToken, {
                onSuccess: function (result) {
                    console.log('Payment success:', result);
                    setLoading(false);
                    if (onSuccess) {
                        onSuccess(result, order_id);
                    } else {
                        alert('Pembayaran berhasil! Terima kasih atas pembelian Anda.');
                        window.location.reload();
                    }
                },
                onPending: function (result) {
                    console.log('Payment pending:', result);
                    setLoading(false);
                    if (onPending) {
                        onPending(result, order_id);
                    } else {
                        alert('Pembayaran menunggu verifikasi. Silakan selesaikan pembayaran Anda.');
                    }
                },
                onError: function (result) {
                    console.error('Payment error:', result);
                    setLoading(false);
                    if (onError) {
                        onError(result, order_id);
                    } else {
                        alert('Pembayaran gagal. Silakan coba lagi.');
                    }
                },
                onClose: function () {
                    console.log('Payment popup closed');
                    setLoading(false);
                }
            });

        } catch (error) {
            console.error('Error getting payment token:', error);
            setLoading(false);

            const errorMessage = error.response?.data?.error || error.message || 'Gagal memproses pembayaran';

            if (onError) {
                onError({ message: errorMessage });
            } else {
                alert(errorMessage);
            }
        }
    };

    return (
        <button
            className={`purchase-button ${className} ${loading ? 'loading' : ''}`}
            onClick={handlePurchase}
            disabled={loading || disabled}
        >
            {loading ? (
                <span className="loading-content">
                    <span className="spinner"></span>
                    Memproses...
                </span>
            ) : (
                <span className="button-content">
                    <span className="price-tag">{formatPrice(price)}</span>
                    <span className="buy-text">Beli Sekarang</span>
                </span>
            )}

            <style>{`
        .purchase-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #f0c040, #e6a700);
          color: #1a1a2e;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 180px;
        }

        .purchase-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(240, 192, 64, 0.4);
        }

        .purchase-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .purchase-button.loading {
          background: linear-gradient(135deg, #888, #666);
        }

        .button-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .price-tag {
          font-size: 1.2rem;
          font-weight: 700;
        }

        .buy-text {
          font-size: 0.85rem;
          opacity: 0.9;
        }

        .loading-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(26, 26, 46, 0.3);
          border-top-color: #1a1a2e;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Free variant */
        .purchase-button.free {
          background: linear-gradient(135deg, #4ade80, #22c55e);
        }

        /* Compact variant */
        .purchase-button.compact {
          padding: 0.5rem 1rem;
          min-width: auto;
        }

        .purchase-button.compact .button-content {
          flex-direction: row;
          gap: 0.5rem;
        }

        .purchase-button.compact .price-tag {
          font-size: 1rem;
        }

        .purchase-button.compact .buy-text {
          display: none;
        }
      `}</style>
        </button>
    );
}
