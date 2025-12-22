import { useEffect, useState } from "react";
import api from "../../api"; // Pastikan path ini sesuai dengan struktur folder Anda

export default function UserList() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    // Helper untuk URL gambar (handle path relatif dari backend)
    const getImgUrl = (path) => {
        if (!path) return null;
        if (path.startsWith("http")) return path;
        return `http://localhost:8080/${path}`; // Sesuaikan dengan port backend Anda
    };

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            // Mengambil data user dari endpoint Admin
            const res = await api.get("/admin/users");
            setUsers(res.data.users || []);
        } catch (err) {
            console.error("Gagal mengambil data user:", err);
            setError("Gagal memuat data user. Pastikan Anda login sebagai Admin.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Yakin ingin menghapus user ini? Aksi ini tidak dapat dibatalkan.")) return;
        
        try {
            await api.delete(`/admin/users/${id}`);
            // Update state lokal agar tidak perlu refresh halaman
            setUsers(users.filter(u => u.id !== id));
            alert("User berhasil dihapus.");
        } catch (err) {
            console.error(err);
            alert("Gagal menghapus user: " + (err.response?.data?.error || "Terjadi kesalahan"));
        }
    };

    return (
        <div style={{ background: "white", padding: 25, borderRadius: 8, boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ margin: 0, color: "#2d3748" }}>👥 Manajemen User</h2>
                <button 
                    onClick={fetchUsers} 
                    style={{ padding: "8px 12px", background: "#edf2f7", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14 }}
                >
                    🔄 Refresh
                </button>
            </div>

            {error && (
                <div style={{ background: "#fff5f5", color: "#c53030", padding: 15, borderRadius: 6, marginBottom: 20 }}>
                    {error}
                </div>
            )}

            {loading ? (
                <p style={{ textAlign: "center", color: "#718096" }}>⏳ Memuat data user...</p>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
                        <thead>
                            <tr style={{ background: "#f7fafc", textAlign: "left" }}>
                                <th style={{ padding: "12px 15px", borderBottom: "2px solid #edf2f7", color: "#4a5568" }}>ID</th>
                                <th style={{ padding: "12px 15px", borderBottom: "2px solid #edf2f7", color: "#4a5568" }}>User Info</th>
                                <th style={{ padding: "12px 15px", borderBottom: "2px solid #edf2f7", color: "#4a5568" }}>Email</th>
                                <th style={{ padding: "12px 15px", borderBottom: "2px solid #edf2f7", color: "#4a5568" }}>Role</th>
                                <th style={{ padding: "12px 15px", borderBottom: "2px solid #edf2f7", color: "#4a5568", textAlign: "center" }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: 20, textAlign: "center", color: "#718096" }}>
                                        Tidak ada data user.
                                    </td>
                                </tr>
                            ) : (
                                users.map(u => (
                                    <tr key={u.id} style={{ borderBottom: "1px solid #edf2f7", transition: "0.2s" }}>
                                        <td style={{ padding: 15, verticalAlign: "top" }}>#{u.id}</td>
                                        
                                        {/* Kolom Nama + Foto */}
                                        <td style={{ padding: 15, verticalAlign: "top" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#e2e8f0", overflow: "hidden", flexShrink: 0 }}>
                                                    {u.profile_img ? (
                                                        <img 
                                                            src={getImgUrl(u.profile_img)} 
                                                            alt={u.name} 
                                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                            onError={(e) => {e.target.style.display='none'}} // Sembunyikan jika gambar rusak
                                                        />
                                                    ) : (
                                                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>👤</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: "bold", color: "#2d3748" }}>{u.name}</div>
                                                    <div style={{ fontSize: 12, color: "#718096" }}>{u.phone || "-"}</div>
                                                </div>
                                            </div>
                                        </td>

                                        <td style={{ padding: 15, verticalAlign: "top", color: "#4a5568" }}>{u.email}</td>

                                        {/* Kolom Role (Logic Pewarnaan Badge) */}
                                        <td style={{ padding: 15, verticalAlign: "top" }}>
                                            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                                                {u.roles && u.roles.length > 0 ? (
                                                    u.roles.map((r, idx) => {
                                                        let badgeColor = { bg: "#edf2f7", text: "#4a5568" }; // Default USER
                                                        if (r === "ADMIN") badgeColor = { bg: "#fed7d7", text: "#822727" };
                                                        if (r === "ORGANIZATION") badgeColor = { bg: "#c6f6d5", text: "#22543d" };

                                                        return (
                                                            <span key={idx} style={{ 
                                                                background: badgeColor.bg, 
                                                                color: badgeColor.text, 
                                                                padding: "2px 8px", 
                                                                borderRadius: 4, 
                                                                fontSize: 11, 
                                                                fontWeight: "bold",
                                                                border: "1px solid rgba(0,0,0,0.05)"
                                                            }}>
                                                                {r}
                                                            </span>
                                                        );
                                                    })
                                                ) : (
                                                    <span style={{ background: "#edf2f7", color: "#718096", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>USER</span>
                                                )}
                                            </div>
                                        </td>

                                        <td style={{ padding: 15, verticalAlign: "top", textAlign: "center" }}>
                                            {/* Mencegah Admin menghapus dirinya sendiri (opsional logic di frontend) */}
                                            {u.roles?.includes("ADMIN") ? (
                                                <span style={{ fontSize: 12, color: "#cbd5e0", fontStyle: "italic" }}>Protected</span>
                                            ) : (
                                                <button 
                                                    onClick={() => handleDelete(u.id)} 
                                                    style={{ 
                                                        color: "white", 
                                                        background: "#e53e3e", 
                                                        border: "none", 
                                                        padding: "6px 12px", 
                                                        borderRadius: 4, 
                                                        cursor: "pointer", 
                                                        fontWeight: "bold", 
                                                        fontSize: 12,
                                                        transition: "0.2s"
                                                    }}
                                                    onMouseOver={(e) => e.target.style.background = "#c53030"}
                                                    onMouseOut={(e) => e.target.style.background = "#e53e3e"}
                                                >
                                                    🗑 Hapus
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}