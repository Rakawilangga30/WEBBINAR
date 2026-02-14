import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import { getBackendUrl } from '../../utils/url';
import toast from 'react-hot-toast';

export default function AffiliateEvents() {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
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
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await api.get('/affiliate/events');
            setEvents(response.data.events || []);
        } catch (error) {
            console.error('Error fetching events:', error);
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
            year: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const styles = {
            PENDING: { bg: '#fef3cd', color: '#856404', text: '⏳ Pending' },
            APPROVED: { bg: '#d4edda', color: '#155724', text: '✅ Disetujui' },
            REJECTED: { bg: '#f8d7da', color: '#721c24', text: '❌ Ditolak' }
        };
        const style = styles[status] || styles.PENDING;
        return (
            <span style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: '500',
                backgroundColor: style.bg,
                color: style.color
            }}>
                {style.text}
            </span>
        );
    };

    if (loading) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                Memuat event...
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
                <div>
                    <h1 style={{ margin: "0 0 8px 0", color: "#1e293b", fontSize: "1.75rem" }}>📦 Event Saya</h1>
                    <p style={{ margin: 0, color: "#64748b" }}>Daftar event yang telah Anda ajukan</p>
                </div>
                <Link to="/dashboard/affiliate/submit" style={submitButton}>
                    ➕ Ajukan Event Baru
                </Link>
            </div>

            {events.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "4rem", marginBottom: "16px" }}>📭</div>
                    <h3 style={{ margin: "0 0 8px 0", color: "#1e293b" }}>Belum Ada Event</h3>
                    <p style={{ margin: "0 0 24px 0", color: "#64748b" }}>Ajukan event pertama Anda dan mulai dapatkan penghasilan!</p>
                    <Link to="/dashboard/affiliate/submit" style={submitButton}>➕ Ajukan Event Pertama</Link>
                </div>
            ) : (
                <div style={{ display: "grid", gap: "16px" }}>
                    {events.map(event => (
                        <div key={event.id} style={eventCard}>
                            <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
                                {/* Thumbnail */}
                                {event.poster_url ? (
                                    <img
                                        src={getBackendUrl(event.poster_url)}
                                        alt="Poster"
                                        style={{ width: "120px", height: "80px", objectFit: "cover", borderRadius: "8px" }}
                                    />
                                ) : (
                                    <div style={{ width: "120px", height: "80px", background: "#e2e8f0", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                                        📷
                                    </div>
                                )}

                                {/* Info */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                                        <h3 style={{ margin: 0, color: "#1e293b", fontSize: "1.1rem" }}>{event.event_title}</h3>
                                        {getStatusBadge(event.status)}
                                    </div>
                                    <div style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "12px" }}>
                                        Diajukan: {formatDate(event.created_at)} • Harga: {formatPrice(event.event_price)}
                                    </div>

                                    {/* Stats */}
                                    {event.status === 'APPROVED' && (
                                        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                                            <div>
                                                <span style={{ color: "#64748b", fontSize: "0.85rem" }}>Penjualan: </span>
                                                <span style={{ fontWeight: "600", color: "#1e293b" }}>{event.total_sales}</span>
                                            </div>
                                            <div>
                                                <span style={{ color: "#64748b", fontSize: "0.85rem" }}>Pendapatan: </span>
                                                <span style={{ fontWeight: "600", color: "#10b981" }}>{formatPrice(event.total_earnings)}</span>
                                            </div>
                                            {event.pending_earnings > 0 && (
                                                <div>
                                                    <span style={{ color: "#64748b", fontSize: "0.85rem" }}>Menunggu: </span>
                                                    <span style={{ fontWeight: "600", color: "#f59e0b" }}>{formatPrice(event.pending_earnings)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const submitButton = {
    display: "inline-block",
    padding: "12px 24px",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "white",
    textDecoration: "none",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "0.95rem"
};

const eventCard = {
    background: "white",
    borderRadius: "12px",
    padding: "20px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
};
