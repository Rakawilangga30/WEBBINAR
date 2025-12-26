import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";

export default function AdminOrgApprovals() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("ALL"); // ALL, PENDING, APPROVED, REJECTED

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get("/admin/organization/applications");
            setApplications(res.data.applications || []);
        } catch (error) {
            console.error("Gagal memuat data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (appId, status) => {
        const reason = prompt(status === 'APPROVED' ? "Catatan Persetujuan (Opsional):" : "Alasan Penolakan:");
        if (status === 'REJECTED' && !reason) return alert("Alasan penolakan wajib diisi!");

        try {
            await api.post(`/admin/organization/applications/${appId}/review`, {
                status: status,
                rejection_reason: reason || ""
            });
            alert(`Aplikasi berhasil ${status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}`);
            loadData();
        } catch (error) {
            alert("Gagal memproses: " + (error.response?.data?.error || "Error"));
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
                fontSize: "0.75rem",
                background: s.bg,
                color: s.color,
                padding: "4px 10px",
                borderRadius: "6px",
                fontWeight: "600"
            }}>
                {s.label}
            </span>
        );
    };

    const filteredApps = filter === "ALL"
        ? applications
        : applications.filter(app => app.status === filter);

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: "24px" }}>
                <h2 style={{ margin: "0 0 4px 0", color: "#1e293b", fontSize: "1.5rem" }}>
                    📝 Persetujuan Creator
                </h2>
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                    Review pengajuan menjadi organizer
                </p>
            </div>

            {/* Filter Tabs */}
            <div style={{
                display: "flex",
                gap: "8px",
                marginBottom: "20px",
                flexWrap: "wrap"
            }}>
                {["ALL", "PENDING", "APPROVED", "REJECTED"].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "8px",
                            border: filter === f ? "none" : "1px solid #e2e8f0",
                            background: filter === f ? "#3b82f6" : "white",
                            color: filter === f ? "white" : "#64748b",
                            cursor: "pointer",
                            fontWeight: "500",
                            fontSize: "0.85rem",
                            transition: "all 0.2s"
                        }}
                    >
                        {f === "ALL" ? "Semua" : f}
                        {f !== "ALL" && (
                            <span style={{ marginLeft: "6px", opacity: 0.8 }}>
                                ({applications.filter(a => a.status === f).length})
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div style={{
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                padding: "24px"
            }}>
                {loading ? (
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
                ) : filteredApps.length === 0 ? (
                    <div style={{
                        textAlign: "center",
                        padding: "48px 20px",
                        color: "#64748b"
                    }}>
                        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>
                            {filter === "PENDING" ? "✅" : "📋"}
                        </div>
                        <p style={{ margin: 0, fontWeight: "500" }}>
                            {filter === "PENDING"
                                ? "Tidak ada pengajuan pending saat ini."
                                : `Tidak ada aplikasi dengan status ${filter}.`}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: "16px" }}>
                        {filteredApps.map(app => (
                            <div key={app.id} style={{
                                border: "1px solid #e2e8f0",
                                borderRadius: "12px",
                                padding: "20px",
                                background: "#fafafa",
                                transition: "all 0.2s ease"
                            }}>
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    flexWrap: "wrap",
                                    gap: "16px"
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                            marginBottom: "12px",
                                            flexWrap: "wrap"
                                        }}>
                                            <h3 style={{ margin: 0, color: "#1e293b", fontSize: "1.1rem" }}>
                                                {app.org_name}
                                            </h3>
                                            <span style={{
                                                fontSize: "0.75rem",
                                                background: "#dbeafe",
                                                color: "#1d4ed8",
                                                padding: "4px 10px",
                                                borderRadius: "6px",
                                                fontWeight: "600"
                                            }}>
                                                {app.org_category}
                                            </span>
                                            {getStatusBadge(app.status)}
                                        </div>

                                        <p style={{
                                            margin: "0 0 12px 0",
                                            fontSize: "0.9rem",
                                            color: "#475569"
                                        }}>
                                            <strong>Pemohon:</strong> {app.user_name || `User ID ${app.user_id}`} ({app.org_email})
                                        </p>

                                        <div style={{
                                            background: "white",
                                            padding: "12px 16px",
                                            borderRadius: "8px",
                                            border: "1px solid #e2e8f0",
                                            fontStyle: "italic",
                                            color: "#64748b",
                                            fontSize: "0.9rem",
                                            marginBottom: "12px"
                                        }}>
                                            "{app.reason}"
                                        </div>

                                        {app.org_website && (
                                            <a
                                                href={app.org_website}
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{
                                                    color: "#3b82f6",
                                                    fontSize: "0.9rem",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "4px"
                                                }}
                                            >
                                                🔗 Lihat Website
                                            </a>
                                        )}

                                        {/* Show review note if exists */}
                                        {app.review_note && (
                                            <div style={{
                                                marginTop: "12px",
                                                padding: "10px 14px",
                                                background: app.status === "APPROVED" ? "#f0fdf4" : "#fef2f2",
                                                borderRadius: "8px",
                                                fontSize: "0.85rem",
                                                color: app.status === "APPROVED" ? "#166534" : "#991b1b"
                                            }}>
                                                <strong>Catatan Review:</strong> {app.review_note}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: "flex", gap: "10px", flexShrink: 0, flexWrap: "wrap" }}>
                                        {/* Review Detail Button - Always visible */}
                                        <Link
                                            to={`/dashboard/admin/approvals/${app.id}`}
                                            style={{
                                                padding: "10px 18px",
                                                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "8px",
                                                cursor: "pointer",
                                                fontWeight: "600",
                                                fontSize: "0.9rem",
                                                textDecoration: "none",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "6px"
                                            }}
                                        >
                                            🔍 Review
                                        </Link>

                                        {/* Approve/Reject only for PENDING */}
                                        {app.status === "PENDING" && (
                                            <>
                                                <button
                                                    onClick={() => handleReview(app.id, "APPROVED")}
                                                    style={{
                                                        padding: "10px 18px",
                                                        background: "linear-gradient(135deg, #22c55e, #16a34a)",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "8px",
                                                        cursor: "pointer",
                                                        fontWeight: "600",
                                                        fontSize: "0.9rem",
                                                        transition: "all 0.2s ease"
                                                    }}
                                                >
                                                    ✅ Setujui
                                                </button>
                                                <button
                                                    onClick={() => handleReview(app.id, "REJECTED")}
                                                    style={{
                                                        padding: "10px 18px",
                                                        background: "linear-gradient(135deg, #ef4444, #dc2626)",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "8px",
                                                        cursor: "pointer",
                                                        fontWeight: "600",
                                                        fontSize: "0.9rem",
                                                        transition: "all 0.2s ease"
                                                    }}
                                                >
                                                    ❌ Tolak
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}