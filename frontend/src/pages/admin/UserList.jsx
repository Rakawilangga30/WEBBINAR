import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";

export default function UserList() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "USER", admin_level: 2, org_name: "" });

    useEffect(() => {
        fetchUsers();
    }, []);

    const getImgUrl = (path) => {
        if (!path) return null;
        if (path.startsWith("http")) return path;
        return `http://localhost:8080/${path}`;
    };

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get("/admin/users");
            setUsers(res.data.users || []);
        } catch (err) {
            console.error("Gagal mengambil data user:", err);
            setError("Gagal memuat data user. Pastikan Anda login sebagai Admin.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await api.post("/admin/users", newUser);
            alert("✅ User berhasil dibuat!");
            setShowCreate(false);
            setNewUser({ name: "", email: "", password: "", role: "USER", admin_level: 2, org_name: "" });
            fetchUsers();
        } catch (err) {
            alert("❌ Gagal membuat user: " + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div>
            {/* Header */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
                flexWrap: "wrap",
                gap: "12px"
            }}>
                <div>
                    <h2 style={{ margin: "0 0 4px 0", color: "#1e293b", fontSize: "1.5rem" }}>
                        👥 Manajemen User
                    </h2>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                        Kelola semua pengguna terdaftar
                    </p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button
                        onClick={() => setShowCreate(true)}
                        style={{
                            padding: "10px 16px",
                            background: "linear-gradient(135deg, #22c55e, #16a34a)",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "0.9rem",
                            fontWeight: "600",
                            color: "white"
                        }}
                    >
                        ➕ Buat Akun
                    </button>
                    <button
                        onClick={fetchUsers}
                        style={{
                            padding: "10px 16px",
                            background: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "0.9rem",
                            fontWeight: "500",
                            color: "#374151"
                        }}
                    >
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* Summary Card */}
            <div style={{
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "24px",
                color: "white",
                boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.3)"
            }}>
                <div style={{ fontSize: "0.9rem", opacity: 0.9, marginBottom: "4px" }}>
                    Total User Terdaftar
                </div>
                <div style={{ fontSize: "2rem", fontWeight: "700" }}>
                    {users.length} user
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div style={{
                    background: "#fef2f2",
                    color: "#dc2626",
                    padding: "16px",
                    borderRadius: "8px",
                    marginBottom: "20px",
                    border: "1px solid #fecaca",
                    fontSize: "0.9rem"
                }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Table Card */}
            <div style={{
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                overflow: "hidden"
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
                        Memuat data user...
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                            <thead>
                                <tr style={{ background: "#f8fafc" }}>
                                    <th style={thStyle}>ID</th>
                                    <th style={thStyle}>User Info</th>
                                    <th style={thStyle}>Email</th>
                                    <th style={thStyle}>Role</th>
                                    <th style={{ ...thStyle, textAlign: "center" }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                                            Tidak ada data user.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map(u => (
                                        <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            <td style={tdStyle}>
                                                <span style={{
                                                    background: "#eff6ff",
                                                    color: "#3b82f6",
                                                    padding: "4px 8px",
                                                    borderRadius: "6px",
                                                    fontSize: "0.8rem",
                                                    fontWeight: "600"
                                                }}>
                                                    #{u.id}
                                                </span>
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                    <div style={{
                                                        width: "42px",
                                                        height: "42px",
                                                        borderRadius: "10px",
                                                        background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
                                                        overflow: "hidden",
                                                        flexShrink: 0,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center"
                                                    }}>
                                                        {u.profile_img ? (
                                                            <img
                                                                src={getImgUrl(u.profile_img)}
                                                                alt={u.name}
                                                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                                onError={(e) => { e.target.style.display = 'none' }}
                                                            />
                                                        ) : (
                                                            <span style={{ fontSize: "1.2rem" }}>👤</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: "600", color: "#1e293b", fontSize: "0.9rem" }}>
                                                            {u.name}
                                                        </div>
                                                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                                            {u.phone || "No phone"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ ...tdStyle, color: "#475569" }}>{u.email}</td>
                                            <td style={tdStyle}>
                                                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                                    {u.roles && u.roles.length > 0 ? (
                                                        u.roles.map((r, idx) => {
                                                            let badgeStyle = { bg: "#f1f5f9", text: "#475569" };
                                                            let displayName = r;

                                                            if (r === "ADMIN") {
                                                                if (u.admin_level === 1) {
                                                                    badgeStyle = { bg: "#fbbf24", text: "#78350f" };
                                                                    displayName = "👑 SUPER ADMIN";
                                                                } else {
                                                                    badgeStyle = { bg: "#fef2f2", text: "#dc2626" };
                                                                    displayName = "🛡️ ADMIN";
                                                                }
                                                            }
                                                            if (r === "ORGANIZATION" || r === "ORGANIZER") badgeStyle = { bg: "#f0fdf4", text: "#16a34a" };
                                                            return (
                                                                <span key={idx} style={{
                                                                    background: badgeStyle.bg,
                                                                    color: badgeStyle.text,
                                                                    padding: "4px 10px",
                                                                    borderRadius: "6px",
                                                                    fontSize: "0.75rem",
                                                                    fontWeight: "600"
                                                                }}>
                                                                    {displayName}
                                                                </span>
                                                            );
                                                        })
                                                    ) : (
                                                        <span style={{
                                                            background: "#f1f5f9",
                                                            color: "#64748b",
                                                            padding: "4px 10px",
                                                            borderRadius: "6px",
                                                            fontSize: "0.75rem",
                                                            fontWeight: "600"
                                                        }}>
                                                            USER
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: "center" }}>
                                                <Link
                                                    to={`/dashboard/admin/users/${u.id}`}
                                                    style={{
                                                        color: "white",
                                                        background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                                                        border: "none",
                                                        padding: "8px 14px",
                                                        borderRadius: "6px",
                                                        fontWeight: "600",
                                                        fontSize: "0.8rem",
                                                        textDecoration: "none",
                                                        display: "inline-block"
                                                    }}
                                                >
                                                    ⚙️ Kelola
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create User Modal */}
            {showCreate && (
                <div style={{
                    position: "fixed",
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0,0,0,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                    padding: "20px"
                }}>
                    <div style={{
                        background: "white",
                        borderRadius: "16px",
                        padding: "24px",
                        width: "100%",
                        maxWidth: "450px",
                        maxHeight: "90vh",
                        overflowY: "auto"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h3 style={{ margin: 0, color: "#1e293b" }}>➕ Buat Akun Baru</h3>
                            <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#64748b" }}>×</button>
                        </div>
                        <form onSubmit={handleCreateUser} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label style={labelStyle}>Nama Lengkap</label>
                                <input type="text" required value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} style={inputStyle} placeholder="Nama pengguna" />
                            </div>
                            <div>
                                <label style={labelStyle}>Email</label>
                                <input type="email" required value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} style={inputStyle} placeholder="email@example.com" />
                            </div>
                            <div>
                                <label style={labelStyle}>Password</label>
                                <input type="password" required value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} style={inputStyle} placeholder="Min. 6 karakter" />
                            </div>
                            <div>
                                <label style={labelStyle}>Role</label>
                                <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} style={inputStyle}>
                                    <option value="USER">👤 User Biasa</option>
                                    <option value="ORGANIZATION">🏢 Organisasi</option>
                                    <option value="ADMIN">🛡️ Admin</option>
                                </select>
                            </div>
                            {newUser.role === "ADMIN" && (
                                <div>
                                    <label style={labelStyle}>Level Admin</label>
                                    <select value={newUser.admin_level} onChange={e => setNewUser({ ...newUser, admin_level: parseInt(e.target.value) })} style={inputStyle}>
                                        <option value={2}>🛡️ Admin Biasa</option>
                                        <option value={1}>👑 Super Admin</option>
                                    </select>
                                </div>
                            )}
                            {newUser.role === "ORGANIZATION" && (
                                <div>
                                    <label style={labelStyle}>Nama Organisasi (Opsional)</label>
                                    <input type="text" value={newUser.org_name} onChange={e => setNewUser({ ...newUser, org_name: e.target.value })} style={inputStyle} placeholder="Kosongkan jika user akan isi sendiri" />
                                </div>
                            )}
                            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                                <button type="button" onClick={() => setShowCreate(false)} style={{ padding: "10px 20px", background: "white", border: "1px solid #e2e8f0", borderRadius: "8px", cursor: "pointer", fontWeight: "500" }}>
                                    Batal
                                </button>
                                <button type="submit" style={{ padding: "10px 20px", background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
                                    💾 Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const thStyle = {
    padding: "14px 16px",
    textAlign: "left",
    fontWeight: "600",
    color: "#475569",
    fontSize: "0.8rem",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: "2px solid #e2e8f0"
};

const tdStyle = {
    padding: "16px",
    verticalAlign: "middle"
};

const labelStyle = {
    display: "block",
    fontSize: "0.8rem",
    fontWeight: "600",
    color: "#64748b",
    marginBottom: "6px"
};

const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "0.9rem",
    boxSizing: "border-box"
};