import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api";
import { getBackendUrl } from "../../utils/url";

export default function AdminOrgList() {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Delete modal states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteReason, setDeleteReason] = useState("");

    useEffect(() => {
        fetchOrganizations();
    }, []);

    const fetchOrganizations = async () => {
        try {
            const res = await api.get("/admin/organizations");
            setOrganizations(res.data.organizations || []);
        } catch (error) {
            console.error("Error fetching organizations:", error);
        } finally {
            setLoading(false);
        }
    };

    const getImgUrl = (path) => {
        if (!path) return null;
        if (path.startsWith("http")) return path;
        return getBackendUrl(path);
    };

    const handleDelete = (org) => {
        setDeleteTarget(org);
        setDeleteReason("");
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deleteReason.trim()) {
            toast.error("Alasan penghapusan wajib diisi!");
            return;
        }

        try {
            await api.delete(`/admin/organizations/${deleteTarget.id}`, { data: { reason: deleteReason } });
            toast.success("Organisasi berhasil dihapus!");
            setShowDeleteModal(false);
            setDeleteTarget(null);
            setDeleteReason("");
            fetchOrganizations();
        } catch (error) {
            toast.error("Gagal menghapus: " + (error.response?.data?.error || error.message));
        }
    };

    const filteredOrgs = organizations.filter(org => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            org.name?.toLowerCase().includes(q) ||
            org.owner_name?.toLowerCase().includes(q) ||
            org.owner_email?.toLowerCase().includes(q) ||
            org.email?.toLowerCase().includes(q) ||
            org.phone?.toLowerCase().includes(q) ||
            org.category?.toLowerCase().includes(q)
        );
    });

    if (loading) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <div style={{
                    width: "32px", height: "32px",
                    border: "3px solid #e2e8f0", borderTopColor: "#3b82f6",
                    borderRadius: "50%", animation: "spin 1s linear infinite",
                    margin: "0 auto 12px"
                }}></div>
                Memuat organisasi...
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                    <h2 style={{ margin: "0 0 4px 0", color: "#1e293b", fontSize: "1.5rem" }}>
                        🏢 Kelola Organisasi
                    </h2>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                        {organizations.length} organisasi terdaftar
                    </p>
                </div>
            </div>

            {/* Search */}
            <div style={{
                background: "white",
                borderRadius: "12px",
                padding: "16px 20px",
                marginBottom: "20px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                border: "1px solid #e2e8f0"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "1.2rem" }}>🔍</span>
                    <input
                        type="text"
                        placeholder="Cari organisasi berdasarkan nama, owner, email, atau kategori..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            flex: 1,
                            padding: "12px 16px",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            fontSize: "0.95rem",
                            outline: "none"
                        }}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            style={{
                                padding: "8px 16px",
                                background: "#f1f5f9",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontSize: "0.85rem",
                                color: "#64748b"
                            }}
                        >
                            ✕ Clear
                        </button>
                    )}
                </div>
                {search && (
                    <div style={{ marginTop: "10px", fontSize: "0.85rem", color: "#64748b" }}>
                        Menampilkan {filteredOrgs.length} dari {organizations.length} organisasi
                    </div>
                )}
            </div>

            {/* Table */}
            <div style={{
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                overflow: "hidden"
            }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                            <th style={thStyle}>Organisasi</th>
                            <th style={thStyle}>Kategori</th>
                            <th style={thStyle}>Owner</th>
                            <th style={thStyle}>Events</th>
                            <th style={thStyle}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrgs.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                                    {search ? `Tidak ada organisasi yang cocok dengan "${search}"` : "Tidak ada organisasi ditemukan"}
                                </td>
                            </tr>
                        ) : (
                            filteredOrgs.map(org => (
                                <tr key={org.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                    <td style={tdStyle}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <div style={{
                                                width: "44px", height: "44px", borderRadius: "10px",
                                                background: "#f1f5f9", overflow: "hidden",
                                                display: "flex", alignItems: "center", justifyContent: "center"
                                            }}>
                                                {org.logo_url ? (
                                                    <img src={getImgUrl(org.logo_url)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                ) : (
                                                    <span style={{ fontSize: "1.3rem" }}>🏢</span>
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: "600", color: "#1e293b" }}>{org.name}</div>
                                                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{org.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={tdStyle}>
                                        <span style={{
                                            background: "#eff6ff", color: "#3b82f6",
                                            padding: "4px 10px", borderRadius: "6px",
                                            fontSize: "0.8rem", fontWeight: "500"
                                        }}>
                                            {org.category || "Uncategorized"}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>
                                        <div>
                                            <div style={{ fontWeight: "500", color: "#1e293b" }}>{org.owner_name}</div>
                                            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{org.owner_email}</div>
                                        </div>
                                    </td>
                                    <td style={tdStyle}>
                                        <span style={{ fontWeight: "600", color: "#1e293b" }}>{org.event_count}</span>
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <Link to={`/dashboard/admin/organizations/${org.id}`} style={{
                                                padding: "8px 14px",
                                                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                                                color: "white",
                                                textDecoration: "none",
                                                borderRadius: "6px",
                                                fontSize: "0.85rem",
                                                fontWeight: "500"
                                            }}>
                                                Detail
                                            </Link>
                                            <button onClick={() => handleDelete(org)} style={{
                                                padding: "8px 14px",
                                                background: "#fef2f2",
                                                color: "#dc2626",
                                                border: "1px solid #fecaca",
                                                borderRadius: "6px",
                                                fontSize: "0.85rem",
                                                fontWeight: "500",
                                                cursor: "pointer"
                                            }}>
                                                Hapus
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && deleteTarget && (
                <div style={modalOverlay}>
                    <div style={modalContent}>
                        <h3 style={{ margin: "0 0 16px 0", color: "#dc2626" }}>⚠️ Hapus Organisasi</h3>
                        <p style={{ color: "#64748b", marginBottom: "12px" }}>
                            Yakin ingin menghapus organisasi <strong>"{deleteTarget.name}"</strong>?
                        </p>
                        <p style={{ color: "#ef4444", fontSize: "0.9rem", background: "#fef2f2", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
                            ⚠️ Semua event dan sesi akan ikut dihapus!
                        </p>
                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Alasan Penghapusan *</label>
                            <textarea
                                value={deleteReason}
                                onChange={(e) => setDeleteReason(e.target.value)}
                                placeholder="Masukkan alasan penghapusan..."
                                style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", minHeight: "80px", boxSizing: "border-box" }}
                            />
                        </div>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                            <button onClick={() => setShowDeleteModal(false)} style={{ padding: "10px 18px", background: "white", color: "#374151", border: "1px solid #e2e8f0", borderRadius: "6px", cursor: "pointer", fontWeight: "500" }}>Batal</button>
                            <button onClick={confirmDelete} style={{ padding: "10px 18px", background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>🗑️ Hapus Permanen</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const thStyle = {
    padding: "14px 16px",
    textAlign: "left",
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "#64748b"
};

const tdStyle = {
    padding: "14px 16px"
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
