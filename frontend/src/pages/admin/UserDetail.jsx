import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api";

export default function UserDetail() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [eventsJoined, setEventsJoined] = useState([]);
    const [organization, setOrganization] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", bio: "", reason: "" });

    // Modal states
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [reasonInput, setReasonInput] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(null); // { role, adminLevel, label }

    useEffect(() => {
        fetchUserDetail();
    }, [userId]);

    const getImgUrl = (path) => {
        if (!path) return null;
        if (path.startsWith("http")) return path;
        return `http://localhost:8080/${path}`;
    };

    const fetchUserDetail = async () => {
        try {
            const res = await api.get(`/admin/users/${userId}`);
            setUser(res.data.user || null);
            setEventsJoined(res.data.events_joined || []);
            setOrganization(res.data.organization || null);
            if (res.data.user) {
                setEditForm({
                    name: res.data.user.name || "",
                    email: res.data.user.email || "",
                    phone: res.data.user.phone || "",
                    bio: res.data.user.bio || "",
                    reason: ""  // Clear reason on fetch
                });
            }
        } catch (error) {
            console.error("Gagal load user detail:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        // Show reason modal
        setReasonInput("");
        setShowReasonModal(true);
    };

    const confirmUpdate = async () => {
        if (!reasonInput.trim()) {
            toast.error("Alasan perubahan wajib diisi!");
            return;
        }

        try {
            await api.put(`/admin/users/${userId}`, { ...editForm, reason: reasonInput });
            toast.success("User berhasil diupdate! User akan menerima notifikasi perubahan.");
            setEditMode(false);
            setShowReasonModal(false);
            setReasonInput("");
            fetchUserDetail();
        } catch (error) {
            toast.error("Gagal update user: " + (error.response?.data?.error || error.message));
        }
    };

    const handleDelete = async () => {
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/admin/users/${userId}`);
            toast.success("User berhasil dihapus!");
            setShowDeleteModal(false);
            navigate("/dashboard/admin/users");
        } catch (error) {
            toast.error("Gagal hapus user: " + (error.response?.data?.error || error.message));
        }
    };

    const handleSetRole = async (role, adminLevel = 0) => {
        const roleLabels = {
            "USER": "User Biasa",
            "ORGANIZATION": "Organisasi",
            "ADMIN": adminLevel === 1 ? "Super Admin" : "Admin"
        };

        setShowRoleModal({ role, adminLevel, label: roleLabels[role] });
    };

    const confirmSetRole = async () => {
        if (!showRoleModal) return;
        const { role, adminLevel } = showRoleModal;

        try {
            const res = await api.post(`/admin/users/${userId}/set-role`, {
                role: role,
                admin_level: adminLevel
            });
            toast.success(res.data.message);
            setShowRoleModal(null);
            fetchUserDetail();
        } catch (error) {
            toast.error("Gagal: " + (error.response?.data?.error || error.message));
        }
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
                Memuat data user...
            </div>
        );
    }

    if (!user) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <div style={{ fontSize: "3rem", marginBottom: "16px" }}>❌</div>
                <p>User tidak ditemukan</p>
                <Link to="/dashboard/admin/users" style={{ color: "#3b82f6" }}>
                    ← Kembali ke daftar user
                </Link>
            </div>
        );
    }

    const isAdmin = user.roles?.includes("ADMIN");
    const isSuperAdmin = user.admin_level === 1;
    // Super Admin selalu protected, tapi Admin biasa bisa dikelola oleh Super Admin
    const isProtected = isSuperAdmin;

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
                        👤 Detail User
                    </h2>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                        Kelola informasi user #{userId}
                    </p>
                </div>
                <Link
                    to="/dashboard/admin/users"
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

            {/* User Info Card */}
            <div style={{
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                padding: "24px",
                marginBottom: "24px"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                    <h3 style={{ margin: 0, color: "#1e293b" }}>📋 Informasi User</h3>
                    {!isProtected && (
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {editMode ? (
                                <>
                                    <button onClick={() => setEditMode(false)} style={btnSecondary}>
                                        Batal
                                    </button>
                                    <button onClick={handleUpdate} style={btnPrimary}>
                                        💾 Simpan
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setEditMode(true)} style={btnPrimary}>
                                        ✏️ Edit
                                    </button>
                                    <select
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === "USER") handleSetRole("USER");
                                            else if (val === "ORGANIZATION") handleSetRole("ORGANIZATION");
                                            else if (val === "ADMIN_2") handleSetRole("ADMIN", 2);
                                            else if (val === "ADMIN_1") handleSetRole("ADMIN", 1);
                                            e.target.value = "";
                                        }}
                                        style={{
                                            padding: "8px 12px",
                                            borderRadius: "6px",
                                            border: "1px solid #e2e8f0",
                                            fontSize: "0.85rem",
                                            fontWeight: "500",
                                            cursor: "pointer",
                                            background: "#f59e0b",
                                            color: "white"
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>🔄 Ubah Role</option>
                                        <option value="USER">👤 User Biasa</option>
                                        <option value="ORGANIZATION">🏢 Organisasi</option>
                                        <option value="ADMIN_2">🛡️ Admin</option>
                                        <option value="ADMIN_1">👑 Super Admin</option>
                                    </select>
                                    <button onClick={handleDelete} style={btnDanger}>
                                        🗑 Hapus
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                    {isProtected && (
                        <span style={{ background: "#fbbf24", color: "#78350f", padding: "6px 12px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "600" }}>
                            👑 Super Admin (Protected)
                        </span>
                    )}
                </div>

                <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                    {/* Avatar */}
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
                        {user.profile_img ? (
                            <img src={getImgUrl(user.profile_img)} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            <span style={{ fontSize: "2.5rem" }}>👤</span>
                        )}
                    </div>

                    {/* Info Fields */}
                    <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                        <div>
                            <label style={labelStyle}>Nama</label>
                            {editMode ? (
                                <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={inputStyle} />
                            ) : (
                                <p style={valueStyle}>{user.name}</p>
                            )}
                        </div>
                        <div>
                            <label style={labelStyle}>Email</label>
                            {editMode ? (
                                <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} style={inputStyle} />
                            ) : (
                                <p style={valueStyle}>{user.email}</p>
                            )}
                        </div>
                        <div>
                            <label style={labelStyle}>Telepon</label>
                            {editMode ? (
                                <input type="text" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} style={inputStyle} />
                            ) : (
                                <p style={valueStyle}>{user.phone || "-"}</p>
                            )}
                        </div>
                        <div>
                            <label style={labelStyle}>Jenis Kelamin</label>
                            <p style={valueStyle}>{user.gender || "-"}</p>
                        </div>
                        <div>
                            <label style={labelStyle}>Tanggal Lahir</label>
                            <p style={valueStyle}>{user.birthdate || "-"}</p>
                        </div>
                        <div>
                            <label style={labelStyle}>Role</label>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                {user.roles?.map((r, i) => {
                                    let style = { bg: "#f1f5f9", text: "#475569" };
                                    if (r === "ADMIN") style = { bg: "#fef2f2", text: "#dc2626" };
                                    if (r === "ORGANIZATION" || r === "ORGANIZER") style = { bg: "#f0fdf4", text: "#16a34a" };
                                    return (
                                        <span key={i} style={{ background: style.bg, color: style.text, padding: "4px 10px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "600" }}>
                                            {r}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <label style={labelStyle}>Alamat</label>
                            <p style={valueStyle}>{user.address || "-"}</p>
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <label style={labelStyle}>Bio</label>
                            {editMode ? (
                                <textarea value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} style={{ ...inputStyle, minHeight: "80px" }} />
                            ) : (
                                <p style={valueStyle}>{user.bio || "-"}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Events Joined */}
            <div style={{
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                padding: "24px",
                marginBottom: "24px"
            }}>
                <h3 style={{ margin: "0 0 16px 0", color: "#1e293b" }}>
                    🎯 Event yang Diikuti ({eventsJoined.length})
                </h3>
                {eventsJoined.length === 0 ? (
                    <p style={{ color: "#64748b", margin: 0 }}>Belum mengikuti event apapun</p>
                ) : (
                    <div style={{ display: "grid", gap: "12px" }}>
                        {eventsJoined.map(ev => (
                            <div key={ev.event_id} style={{
                                border: "1px solid #e2e8f0",
                                borderRadius: "8px",
                                padding: "14px 18px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                background: "#fafafa"
                            }}>
                                <div>
                                    <div style={{ fontWeight: "600", color: "#1e293b" }}>{ev.event_title}</div>
                                    <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                                        {ev.sessions_count} sesi • Rp {ev.total_paid?.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Organization Info (if organizer) */}
            {organization && (
                <div style={{
                    background: "white",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    padding: "24px"
                }}>
                    <h3 style={{ margin: "0 0 16px 0", color: "#1e293b" }}>
                        🏢 Organisasi: {organization.name}
                    </h3>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "20px" }}>
                        <div style={{ background: "#f0fdf4", padding: "16px", borderRadius: "8px", textAlign: "center" }}>
                            <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#16a34a" }}>{organization.events_count}</div>
                            <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Total Event</div>
                        </div>
                        <div style={{ background: "#eff6ff", padding: "16px", borderRadius: "8px", textAlign: "center" }}>
                            <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#3b82f6" }}>{organization.category || "-"}</div>
                            <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Kategori</div>
                        </div>
                    </div>

                    <h4 style={{ margin: "0 0 12px 0", color: "#475569" }}>📋 Daftar Event</h4>
                    {organization.events?.length === 0 ? (
                        <p style={{ color: "#64748b", margin: 0 }}>Belum ada event</p>
                    ) : (
                        <div style={{ display: "grid", gap: "10px" }}>
                            {organization.events?.map(ev => (
                                <div key={ev.id} style={{
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "8px",
                                    padding: "12px 16px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    background: "#fafafa"
                                }}>
                                    <div>
                                        <div style={{ fontWeight: "500", color: "#1e293b" }}>{ev.title}</div>
                                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                            {ev.sessions_count} sesi • {ev.buyers_count} pembeli
                                        </div>
                                    </div>
                                    <span style={{
                                        padding: "4px 10px",
                                        borderRadius: "20px",
                                        fontSize: "0.75rem",
                                        fontWeight: "600",
                                        background: ev.publish_status === "PUBLISHED" ? "#dcfce7" : "#fef3c7",
                                        color: ev.publish_status === "PUBLISHED" ? "#16a34a" : "#d97706"
                                    }}>
                                        {ev.publish_status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Update Reason Modal */}
            {showReasonModal && (
                <div style={modalOverlay}>
                    <div style={modalContent}>
                        <h3 style={{ margin: "0 0 16px 0", color: "#1e293b" }}>📝 Alasan Perubahan</h3>
                        <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "16px" }}>
                            Masukkan alasan perubahan profil user ini (akan dikirim ke user):
                        </p>
                        <textarea
                            value={reasonInput}
                            onChange={(e) => setReasonInput(e.target.value)}
                            placeholder="Contoh: Update data berdasarkan verifikasi dokumen"
                            style={{ ...inputStyle, minHeight: "100px", marginBottom: "16px" }}
                        />
                        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                            <button onClick={() => setShowReasonModal(false)} style={btnSecondary}>Batal</button>
                            <button onClick={confirmUpdate} style={btnPrimary}>💾 Simpan Perubahan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div style={modalOverlay}>
                    <div style={modalContent}>
                        <h3 style={{ margin: "0 0 16px 0", color: "#dc2626" }}>⚠️ Konfirmasi Hapus</h3>
                        <p style={{ color: "#64748b", marginBottom: "20px" }}>
                            Yakin ingin menghapus user <strong>{user?.name}</strong>? Data akan dihapus permanen dan user akan menerima notifikasi.
                        </p>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                            <button onClick={() => setShowDeleteModal(false)} style={btnSecondary}>Batal</button>
                            <button onClick={confirmDelete} style={btnDanger}>🗑️ Hapus Permanen</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Role Change Modal */}
            {showRoleModal && (
                <div style={modalOverlay}>
                    <div style={modalContent}>
                        <h3 style={{ margin: "0 0 16px 0", color: "#f59e0b" }}>⚠️ Ubah Role User</h3>
                        <p style={{ color: "#64748b", marginBottom: "20px" }}>
                            Yakin ingin mengubah role user <strong>{user?.name}</strong> menjadi <strong>{showRoleModal.label}</strong>?
                        </p>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                            <button onClick={() => setShowRoleModal(null)} style={btnSecondary}>Batal</button>
                            <button onClick={confirmSetRole} style={btnWarning}>✅ Konfirmasi</button>
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

const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "0.9rem",
    boxSizing: "border-box"
};

const btnPrimary = {
    padding: "8px 16px",
    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "0.85rem"
};

const btnSecondary = {
    padding: "8px 16px",
    background: "white",
    color: "#374151",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "0.85rem"
};

const btnDanger = {
    padding: "8px 16px",
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "0.85rem"
};

const btnWarning = {
    padding: "8px 16px",
    background: "linear-gradient(135deg, #f59e0b, #d97706)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "0.85rem"
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
    maxWidth: "450px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
};
