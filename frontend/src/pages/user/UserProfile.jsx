import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import api from "../../api";
import { getBackendUrl } from "../../utils/url";

export default function UserProfile() {
    const [user, setUser] = useState({
        name: "", email: "", bio: "", phone: "", username: "", profile_img: "",
        gender: "", birthdate: "", address: ""
    });
    const [previewImg, setPreviewImg] = useState(null);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState(null);
    const [orgProfile, setOrgProfile] = useState(null);

    const getImgUrl = (path) => {
        if (!path) return null;
        if (path.startsWith("http")) return path;
        return getBackendUrl(path);
    };

    useEffect(() => {
        loadProfile();
        loadOrgIfNeeded();
    }, []);

    const loadProfile = async () => {
        setPageLoading(true);
        setError(null);
        try {
            const res = await api.get("/user/profile");
            let serverUser = res.data?.user || res.data || {};

            let localUser = {};
            try {
                localUser = JSON.parse(localStorage.getItem("user") || "{}");
            } catch (e) { }

            const mergedUser = {
                id: serverUser.id ?? localUser.id ?? 0,
                name: serverUser.name ?? localUser.name ?? "",
                email: serverUser.email ?? localUser.email ?? "",
                phone: serverUser.phone ?? "",
                bio: serverUser.bio ?? "",
                username: serverUser.username ?? localUser.username ?? "",
                profile_img: serverUser.profile_img ?? "",
                gender: serverUser.gender ?? "",
                birthdate: serverUser.birthdate ?? "",
                address: serverUser.address ?? ""
            };

            setUser(mergedUser);
            if (mergedUser.profile_img) {
                setPreviewImg(getImgUrl(mergedUser.profile_img));
            }

            try {
                localStorage.setItem("user", JSON.stringify({ ...localUser, ...mergedUser }));
            } catch (e) { }
        } catch (err) {
            if (err.response?.status === 401) {
                setError("Sesi login telah habis. Silakan login kembali.");
            } else {
                setError("Gagal memuat profil: " + (err.response?.data?.error || err.message));
            }
        } finally {
            setPageLoading(false);
        }
    };

    const loadOrgIfNeeded = async () => {
        try {
            const localUser = JSON.parse(localStorage.getItem("user") || "{}");
            const roles = localUser.roles || [];
            if (roles.includes("ORGANIZATION") || roles.includes("ORGANIZER")) {
                const res = await api.get("/organization/profile");
                setOrgProfile(res.data.organization || res.data || null);
            }
        } catch (e) {
            setOrgProfile(null);
        }
    };

    const handleChange = (e) => setUser({ ...user, [e.target.name]: e.target.value });

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            if (selected.size > 2 * 1024 * 1024) {
                toast.error("Ukuran file maksimal 2MB!");
                return;
            }
            setFile(selected);
            setPreviewImg(URL.createObjectURL(selected));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await api.put("/user/profile", {
                name: user.name,
                username: user.username || "",
                phone: user.phone || "",
                bio: user.bio || "",
                profile_img: user.profile_img || "",
                gender: user.gender || "",
                birthdate: user.birthdate || "",
                address: user.address || ""
            });

            if (orgProfile) {
                try {
                    await api.put("/organization/profile", orgProfile);
                } catch (err) { }
            }

            if (file) {
                const formData = new FormData();
                formData.append("profile_img", file);
                const uploadResp = await api.post("/user/profile/upload-image", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                const url = uploadResp.data?.url || uploadResp.data?.profile_img || null;
                if (url) {
                    setUser(prev => ({ ...prev, profile_img: url }));
                    setPreviewImg(getImgUrl(url));
                }
                setFile(null);
            }

            try {
                const localUser = JSON.parse(localStorage.getItem("user") || "{}");
                localStorage.setItem("user", JSON.stringify({ ...localUser, ...user }));
            } catch (e) { }

            await loadProfile();
            toast.success("Profil berhasil diperbarui!");

        } catch (error) {
            setError("Gagal update profil: " + (error.response?.data?.error || error.message));
            toast.error("Gagal update profil");
        } finally {
            setLoading(false);
        }
    };

    // Calculate profile completeness
    const getProfileCompleteness = () => {
        const requiredFields = ['name', 'email', 'phone', 'gender', 'birthdate', 'address'];
        const filled = requiredFields.filter(f => user[f] && user[f].trim() !== '').length;
        return Math.round((filled / requiredFields.length) * 100);
    };

    if (pageLoading) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <div style={{
                    width: "40px", height: "40px",
                    border: "3px solid #e2e8f0", borderTopColor: "#3b82f6",
                    borderRadius: "50%", animation: "spin 1s linear infinite",
                    margin: "0 auto 16px"
                }}></div>
                Memuat profil...
            </div>
        );
    }

    const completeness = getProfileCompleteness();

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: "24px" }}>
                <h2 style={{ margin: "0 0 4px 0", color: "#1e293b", fontSize: "1.5rem" }}>
                    👤 Profil Saya
                </h2>
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                    Kelola informasi profil Anda
                </p>
            </div>

            {error && (
                <div style={{
                    background: "#fef2f2", border: "1px solid #fecaca",
                    color: "#dc2626", padding: "16px", borderRadius: "8px",
                    marginBottom: "20px", fontSize: "0.9rem"
                }}>
                    {error}
                </div>
            )}

            {/* Profile Card */}
            <div style={{
                background: "white",
                padding: "32px",
                borderRadius: "12px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            }}>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                    {/* Profile Photo Section */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: "24px",
                        padding: "20px", background: "#f8fafc",
                        borderRadius: "12px", border: "1px solid #e2e8f0"
                    }}>
                        <div style={{
                            width: "100px", height: "100px", borderRadius: "50%",
                            background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
                            overflow: "hidden", border: "3px solid #3b82f6", flexShrink: 0
                        }}>
                            {previewImg ? (
                                <img src={previewImg} alt="Profil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem" }}>👤</div>
                            )}
                        </div>
                        <div>
                            <label style={{
                                display: "inline-block", padding: "10px 18px",
                                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                                color: "white", borderRadius: "8px", cursor: "pointer",
                                fontWeight: "600", fontSize: "0.9rem"
                            }}>
                                📷 Pilih Foto
                                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                            </label>
                            <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "8px", marginBottom: 0 }}>
                                Format: JPG, PNG, WEBP. Max 2MB.
                            </p>
                        </div>
                    </div>

                    {/* User ID */}
                    {user.id > 0 && (
                        <div style={{
                            padding: "8px 12px", background: "#f1f5f9", borderRadius: "6px",
                            fontSize: "0.8rem", color: "#64748b", display: "inline-block", alignSelf: "flex-start"
                        }}>
                            🔑 User ID: {user.id}
                        </div>
                    )}

                    {/* Biodata Section - All in one */}
                    <div>
                        <h3 style={{ margin: "0 0 16px 0", color: "#1e293b", fontSize: "1.1rem" }}>📋 Biodata</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
                            <div>
                                <label style={labelStyle}>Nama Lengkap *</label>
                                <input type="text" name="name" value={user.name || ""} onChange={handleChange} style={inputStyle} required placeholder="Masukkan nama lengkap" />
                            </div>
                            <div>
                                <label style={labelStyle}>Username</label>
                                <input type="text" name="username" value={user.username || ""} onChange={handleChange} style={inputStyle} placeholder="Username" />
                            </div>
                            <div>
                                <label style={labelStyle}>Email</label>
                                <input type="email" value={user.email || ""} disabled style={{ ...inputStyle, background: "#f1f5f9", color: "#64748b", cursor: "not-allowed" }} />
                            </div>
                            <div>
                                <label style={labelStyle}>No. Telepon *</label>
                                <input type="text" name="phone" value={user.phone || ""} onChange={handleChange} style={inputStyle} placeholder="08123456789" />
                            </div>
                            <div>
                                <label style={labelStyle}>Jenis Kelamin *</label>
                                <select name="gender" value={user.gender || ""} onChange={handleChange} style={inputStyle}>
                                    <option value="">-- Pilih --</option>
                                    <option value="Laki-laki">Laki-laki</option>
                                    <option value="Perempuan">Perempuan</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Tanggal Lahir *</label>
                                <input type="date" name="birthdate" value={user.birthdate || ""} onChange={handleChange} style={inputStyle} />
                            </div>
                            <div style={{ gridColumn: "1 / -1" }}>
                                <label style={labelStyle}>Alamat *</label>
                                <textarea name="address" value={user.address || ""} onChange={handleChange} style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} placeholder="Alamat lengkap (jalan, kota, provinsi, kode pos)" />
                            </div>
                            <div style={{ gridColumn: "1 / -1" }}>
                                <label style={labelStyle}>Bio</label>
                                <textarea name="bio" value={user.bio || ""} onChange={handleChange} rows="3" style={{ ...inputStyle, resize: "vertical" }} placeholder="Ceritakan sedikit tentang dirimu..." />
                            </div>
                        </div>
                    </div>

                    {/* Organization Section */}
                    {orgProfile && (
                        <div style={{ padding: "20px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <h3 style={{ margin: 0, color: "#166534", fontSize: "1rem" }}>🏢 Organisasi: {orgProfile.name}</h3>
                                <a href="/dashboard/org" style={{
                                    padding: "8px 14px", background: "linear-gradient(135deg, #22c55e, #16a34a)",
                                    color: "white", borderRadius: "6px", textDecoration: "none", fontSize: "0.85rem", fontWeight: "600"
                                }}>
                                    Kelola Organisasi
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button type="submit" disabled={loading} style={{
                        padding: "14px 24px",
                        background: loading ? "#94a3b8" : "linear-gradient(135deg, #3b82f6, #2563eb)",
                        color: "white", border: "none", borderRadius: "8px",
                        cursor: loading ? "not-allowed" : "pointer",
                        fontWeight: "600", fontSize: "1rem", transition: "all 0.2s ease"
                    }}>
                        {loading ? "⏳ Menyimpan..." : "💾 Simpan Perubahan"}
                    </button>
                </form>
            </div>
        </div>
    );
}

const labelStyle = {
    display: "block",
    marginBottom: "6px",
    fontWeight: "500",
    color: "#374151",
    fontSize: "0.875rem"
};

const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "0.95rem",
    transition: "all 0.2s ease",
    boxSizing: "border-box"
};