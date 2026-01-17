import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api";

export default function OrgApplicationDetail() {
    const { appId } = useParams();
    const navigate = useNavigate();
    const [app, setApp] = useState(null);
    const [loading, setLoading] = useState(true);

    // Review modal states
    const [showReviewModal, setShowReviewModal] = useState(null); // 'APPROVED' or 'REJECTED'
    const [reviewNote, setReviewNote] = useState("");

    useEffect(() => {
        fetchDetail();
    }, [appId]);

    const getImgUrl = (path) => {
        if (!path) return null;
        if (path.startsWith("http")) return path;
        return `http://localhost:8080/${path}`;
    };

    const fetchDetail = async () => {
        try {
            const res = await api.get(`/admin/organization/applications/${appId}`);
            setApp(res.data.application || null);
        } catch (error) {
            console.error("Gagal load detail:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = (status) => {
        setReviewNote("");
        setShowReviewModal(status);
    };

    const confirmReview = async () => {
        if (showReviewModal === 'REJECTED' && !reviewNote.trim()) {
            toast.error("Alasan penolakan wajib diisi!");
            return;
        }

        try {
            await api.post(`/admin/organization/applications/${appId}/review`, {
                status: showReviewModal,
                note: reviewNote || ""
            });
            toast.success(`Aplikasi berhasil ${showReviewModal === 'APPROVED' ? 'Disetujui' : 'Ditolak'}`);
            setShowReviewModal(null);
            setReviewNote("");
            fetchDetail();
        } catch (error) {
            toast.error("Gagal memproses: " + (error.response?.data?.error || "Error"));
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            PENDING: { bg: "#fef3c7", color: "#d97706", label: "⏳ Pending" },
            APPROVED: { bg: "#dcfce7", color: "#16a34a", label: "✅ Approved" },
            REJECTED: { bg: "#fee2e2", color: "#dc2626", label: "❌ Rejected" }
        };
        const s = styles[status] || styles.PENDING;
        return (
            <span style={{
                fontSize: "0.9rem",
                background: s.bg,
                color: s.color,
                padding: "6px 14px",
                borderRadius: "8px",
                fontWeight: "600"
            }}>
                {s.label}
            </span>
        );
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        return d.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
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
                Memuat data aplikasi...
            </div>
        );
    }

    if (!app) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <div style={{ fontSize: "3rem", marginBottom: "16px" }}>❌</div>
                <p>Aplikasi tidak ditemukan</p>
                <Link to="/dashboard/admin/approvals" style={{ color: "#3b82f6" }}>
                    ← Kembali ke daftar pengajuan
                </Link>
            </div>
        );
    }

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
                        📋 Review Pengajuan
                    </h2>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                        Detail pengajuan organisasi #{appId}
                    </p>
                </div>
                <Link
                    to="/dashboard/admin/approvals"
                    style={{
                        padding: "10px 18px",
                        background: "white",
                        color: "#374151",
                        textDecoration: "none",
                        borderRadius: "8px",
                        fontWeight: "500",
                        fontSize: "0.9rem",
                        border: "1px solid #e2e8f0"
                    }}
                >
                    ← Kembali
                </Link>
            </div>

            {/* Organization Info Card */}
            <div style={{
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                padding: "24px",
                marginBottom: "24px"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                    <h3 style={{ margin: 0, color: "#1e293b" }}>🏢 Informasi Organisasi</h3>
                    {getStatusBadge(app.status)}
                </div>

                <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                    {/* Logo */}
                    <div style={{
                        width: "100px",
                        height: "100px",
                        borderRadius: "12px",
                        background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                    }}>
                        {app.org_logo_url ? (
                            <img src={getImgUrl(app.org_logo_url)} alt={app.org_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            <span style={{ fontSize: "2.5rem" }}>🏢</span>
                        )}
                    </div>

                    {/* Info Fields */}
                    <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                        <div>
                            <label style={labelStyle}>Nama Organisasi</label>
                            <p style={valueStyle}>{app.org_name}</p>
                        </div>
                        <div>
                            <label style={labelStyle}>Kategori</label>
                            <span style={{
                                display: "inline-block",
                                background: "#dbeafe",
                                color: "#1d4ed8",
                                padding: "4px 12px",
                                borderRadius: "6px",
                                fontWeight: "600",
                                fontSize: "0.85rem"
                            }}>
                                {app.org_category}
                            </span>
                        </div>
                        <div>
                            <label style={labelStyle}>Email Organisasi</label>
                            <p style={valueStyle}>{app.org_email}</p>
                        </div>
                        <div>
                            <label style={labelStyle}>Telepon</label>
                            <p style={valueStyle}>{app.org_phone || "-"}</p>
                        </div>
                        <div>
                            <label style={labelStyle}>Website</label>
                            {app.org_website ? (
                                <a href={app.org_website} target="_blank" rel="noreferrer" style={{ color: "#3b82f6", fontSize: "0.95rem" }}>
                                    {app.org_website}
                                </a>
                            ) : (
                                <p style={valueStyle}>-</p>
                            )}
                        </div>
                        <div>
                            <label style={labelStyle}>Social Media</label>
                            <p style={valueStyle}>{app.social_media || "-"}</p>
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <label style={labelStyle}>Deskripsi</label>
                            <p style={valueStyle}>{app.org_description || "-"}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Applicant Info Card */}
            <div style={{
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                padding: "24px",
                marginBottom: "24px"
            }}>
                <h3 style={{ margin: "0 0 16px 0", color: "#1e293b" }}>👤 Informasi Pemohon</h3>

                <div style={{ display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                        {/* User Avatar */}
                        <div style={{
                            width: "60px",
                            height: "60px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                        }}>
                            {app.user_profile_img ? (
                                <img src={getImgUrl(app.user_profile_img)} alt="User" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                                <span style={{ fontSize: "1.5rem" }}>👤</span>
                            )}
                        </div>

                        <div>
                            <div style={{ fontWeight: "600", color: "#1e293b", fontSize: "1.1rem" }}>{app.user_name || "-"}</div>
                            <div style={{ color: "#64748b", fontSize: "0.9rem" }}>{app.user_email || "-"}</div>
                            <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>User ID: #{app.user_id}</div>
                        </div>
                    </div>

                    <Link to={`/dashboard/admin/users/${app.user_id}`} style={{
                        padding: "10px 20px",
                        background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                        color: "white",
                        textDecoration: "none",
                        borderRadius: "8px",
                        fontWeight: "500",
                        fontSize: "0.9rem"
                    }}>
                        📋 Lihat Detail User
                    </Link>
                </div>
            </div>

            {/* Reason Card */}
            <div style={{
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                padding: "24px",
                marginBottom: "24px"
            }}>
                <h3 style={{ margin: "0 0 16px 0", color: "#1e293b" }}>📝 Alasan Pengajuan</h3>
                <div style={{
                    background: "#f8fafc",
                    padding: "16px 20px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontStyle: "italic",
                    color: "#475569",
                    fontSize: "0.95rem",
                    lineHeight: "1.6"
                }}>
                    "{app.reason}"
                </div>

                <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                    <div>
                        <label style={labelStyle}>Tanggal Pengajuan</label>
                        <p style={valueStyle}>{formatDate(app.submitted_at)}</p>
                    </div>
                    {app.reviewed_at && (
                        <div>
                            <label style={labelStyle}>Tanggal Review</label>
                            <p style={valueStyle}>{formatDate(app.reviewed_at)}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Review Note (if exists) */}
            {app.review_note && (
                <div style={{
                    background: app.status === "APPROVED" ? "#f0fdf4" : "#fef2f2",
                    borderRadius: "12px",
                    padding: "20px 24px",
                    marginBottom: "24px",
                    border: `1px solid ${app.status === "APPROVED" ? "#bbf7d0" : "#fecaca"}`
                }}>
                    <h4 style={{ margin: "0 0 8px 0", color: app.status === "APPROVED" ? "#166534" : "#991b1b" }}>
                        {app.status === "APPROVED" ? "✅ Catatan Persetujuan" : "❌ Alasan Penolakan"}
                    </h4>
                    <p style={{ margin: 0, color: app.status === "APPROVED" ? "#15803d" : "#b91c1c" }}>
                        {app.review_note}
                    </p>
                </div>
            )}

            {/* Action Buttons (only for PENDING) */}
            {app.status === "PENDING" && (
                <div style={{
                    background: "white",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    padding: "24px",
                    display: "flex",
                    gap: "16px",
                    justifyContent: "flex-end",
                    flexWrap: "wrap"
                }}>
                    <button
                        onClick={() => handleReview("REJECTED")}
                        style={{
                            padding: "12px 24px",
                            background: "linear-gradient(135deg, #ef4444, #dc2626)",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "1rem",
                            transition: "all 0.2s ease"
                        }}
                    >
                        ❌ Tolak Pengajuan
                    </button>
                    <button
                        onClick={() => handleReview("APPROVED")}
                        style={{
                            padding: "12px 24px",
                            background: "linear-gradient(135deg, #22c55e, #16a34a)",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "1rem",
                            transition: "all 0.2s ease"
                        }}
                    >
                        ✅ Setujui Pengajuan
                    </button>
                </div>
            )}

            {/* Review Modal */}
            {showReviewModal && (
                <div style={modalOverlay}>
                    <div style={modalContent}>
                        <h3 style={{ margin: "0 0 16px 0", color: showReviewModal === 'APPROVED' ? "#16a34a" : "#dc2626" }}>
                            {showReviewModal === 'APPROVED' ? '✅ Setujui Pengajuan' : '❌ Tolak Pengajuan'}
                        </h3>
                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                                {showReviewModal === 'APPROVED' ? 'Catatan Persetujuan (Opsional)' : 'Alasan Penolakan *'}
                            </label>
                            <textarea
                                value={reviewNote}
                                onChange={(e) => setReviewNote(e.target.value)}
                                placeholder={showReviewModal === 'APPROVED' ? "Tambahkan catatan jika diperlukan..." : "Jelaskan alasan penolakan..."}
                                style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", minHeight: "100px", boxSizing: "border-box" }}
                            />
                        </div>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                            <button onClick={() => setShowReviewModal(null)} style={{ padding: "10px 18px", background: "white", color: "#374151", border: "1px solid #e2e8f0", borderRadius: "6px", cursor: "pointer", fontWeight: "500" }}>Batal</button>
                            <button onClick={confirmReview} style={{ padding: "10px 18px", background: showReviewModal === 'APPROVED' ? "linear-gradient(135deg, #22c55e, #16a34a)" : "linear-gradient(135deg, #ef4444, #dc2626)", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>
                                {showReviewModal === 'APPROVED' ? '✅ Setujui' : '❌ Tolak'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const labelStyle = {
    display: "block",
    fontSize: "0.8rem",
    fontWeight: "600",
    color: "#64748b",
    marginBottom: "4px",
    textTransform: "uppercase"
};

const valueStyle = {
    margin: 0,
    color: "#1e293b",
    fontSize: "0.95rem"
};

const modalOverlay = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000
};

const modalContent = {
    background: "white",
    padding: "24px",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "500px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
};
