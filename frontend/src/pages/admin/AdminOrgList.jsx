import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";

export default function AdminOrgList() {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

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
        return `http://localhost:8080/${path}`;
    };

    const handleDelete = async (org) => {
        const reason = prompt(`⚠️ Yakin ingin menghapus organisasi "${org.name}"?\n\nSemua event dan sesi akan dihapus!\n\nMasukkan alasan penghapusan:`);
        if (reason === null) return; // User cancelled
        if (!reason.trim()) return alert("Alasan penghapusan wajib diisi!");

        try {
            await api.delete(`/admin/organizations/${org.id}`, { data: { reason: reason } });
            alert("✅ Organisasi berhasil dihapus!");
            fetchOrganizations();
        } catch (error) {
            alert("❌ Gagal menghapus: " + (error.response?.data?.error || error.message));
        }
    };

    const filteredOrgs = organizations.filter(org =>
        org.name.toLowerCase().includes(search.toLowerCase()) ||
        org.owner_name.toLowerCase().includes(search.toLowerCase())
    );

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
            <div style={{ marginBottom: "20px" }}>
                <input
                    type="text"
                    placeholder="🔍 Cari organisasi atau owner..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        width: "100%",
                        maxWidth: "400px",
                        padding: "12px 16px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        fontSize: "0.95rem"
                    }}
                />
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
                                    Tidak ada organisasi ditemukan
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
