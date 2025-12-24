import { useState, useEffect } from "react";
import api from "../../api";

export default function UserProfile() {
    const [user, setUser] = useState({ name: "", email: "", bio: "", phone: "", username: "", profile_img: "" });
    const [previewImg, setPreviewImg] = useState(null);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState(null);
    const [orgProfile, setOrgProfile] = useState(null);

    const getImgUrl = (path) => {
        if (!path) return null;
        if (path.startsWith("http")) return path;
        const cleanPath = path.replace(/^\/+/, '');
        return `http://localhost:8080/${cleanPath}`;
    };

    useEffect(() => {
        loadProfile();
        loadOrgIfNeeded();
    }, []);

    const loadProfile = async () => {
        setPageLoading(true);
        setError(null);
        try {
            console.log("Fetching user profile...");
            const res = await api.get("/user/profile");
            console.log("Full profile response:", JSON.stringify(res.data, null, 2));

            // Handle different possible response structures
            let serverUser = {};
            if (res.data && res.data.user) {
                serverUser = res.data.user;
            } else if (res.data && res.data.id) {
                serverUser = res.data;
            }

            console.log("Server user data:", serverUser);

            // Get localStorage data for fallback/merge
            let localUser = {};
            try {
                localUser = JSON.parse(localStorage.getItem("user") || "{}");
            } catch (e) {
                console.warn("Failed to parse localStorage user data");
            }

            // Merge data - prioritize server data, use nullish coalescing
            const mergedUser = {
                id: serverUser.id ?? localUser.id ?? 0,
                name: serverUser.name ?? localUser.name ?? "",
                email: serverUser.email ?? localUser.email ?? "",
                phone: serverUser.phone ?? "",
                bio: serverUser.bio ?? "",
                username: serverUser.username ?? localUser.username ?? "",
                profile_img: serverUser.profile_img ?? ""
            };

            console.log("Merged user data:", mergedUser);
            setUser(mergedUser);

            // Set profile image preview
            if (mergedUser.profile_img) {
                const imgUrl = getImgUrl(mergedUser.profile_img);
                console.log("Profile image URL:", imgUrl);
                setPreviewImg(imgUrl);
            }

            // Sync to localStorage
            try {
                const updatedLocal = {
                    ...localUser,
                    id: mergedUser.id,
                    name: mergedUser.name,
                    email: mergedUser.email,
                    phone: mergedUser.phone,
                    profile_img: mergedUser.profile_img,
                    bio: mergedUser.bio,
                    username: mergedUser.username
                };
                localStorage.setItem("user", JSON.stringify(updatedLocal));
            } catch (e) {
                console.warn("Failed to update localStorage", e);
            }
        } catch (err) {
            console.error("Failed to load profile:", err);
            console.error("Error response:", err.response?.data);

            // Friendly error message
            if (err.response?.status === 401) {
                setError("Sesi login telah habis. Silakan login kembali.");
            } else if (err.response?.status === 404) {
                setError("Data profil tidak ditemukan.");
            } else {
                setError("Gagal memuat profil: " + (err.response?.data?.error || err.message));
            }

            // Try to use localStorage data as fallback
            try {
                const localUser = JSON.parse(localStorage.getItem("user") || "{}");
                console.log("Trying localStorage fallback:", localUser);
                if (localUser.name || localUser.email) {
                    setUser({
                        id: localUser.id || 0,
                        name: localUser.name || "",
                        email: localUser.email || "",
                        phone: localUser.phone || "",
                        bio: localUser.bio || "",
                        username: localUser.username || "",
                        profile_img: localUser.profile_img || ""
                    });
                    if (localUser.profile_img) {
                        setPreviewImg(getImgUrl(localUser.profile_img));
                    }
                    setError("⚠️ Menggunakan data cached. Data mungkin tidak terbaru.");
                }
            } catch (e) {
                console.warn("Failed to read localStorage fallback", e);
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
                console.log("User is organizer, fetching org profile...");
                const res = await api.get("/organization/profile");
                console.log("Org profile response:", res.data);

                const org = res.data.organization || res.data || null;
                if (org) {
                    org.website = org.website || "";
                    org.social_link = org.social_link || "";
                    org.address = org.address || "";
                }
                setOrgProfile(org);
            }
        } catch (e) {
            console.warn("Failed to load org profile (may not be organizer):", e);
            setOrgProfile(null);
        }
    };

    const handleChange = (e) => setUser({ ...user, [e.target.name]: e.target.value });

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            if (selected.size > 2 * 1024 * 1024) {
                alert("Ukuran file maksimal 2MB!");
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
            console.log("=== Starting profile update ===");
            console.log("User data to update:", {
                name: user.name,
                username: user.username,
                phone: user.phone,
                bio: user.bio,
                profile_img: user.profile_img
            });

            // Update profile text data
            const updateResponse = await api.put("/user/profile", {
                name: user.name,
                username: user.username || "",
                phone: user.phone || "",
                bio: user.bio || "",
                profile_img: user.profile_img || ""
            });

            console.log("Profile update response:", updateResponse.data);

            // Update org profile if applicable
            if (orgProfile) {
                try {
                    console.log("Updating org profile...");
                    await api.put("/organization/profile", {
                        name: orgProfile.name,
                        description: orgProfile.description,
                        category: orgProfile.category,
                        logo_url: orgProfile.logo_url,
                        email: orgProfile.email,
                        phone: orgProfile.phone,
                        website: orgProfile.website,
                        social_link: orgProfile.social_link,
                        address: orgProfile.address,
                    });
                    console.log("Org profile updated successfully");
                } catch (err) {
                    console.warn('Gagal update organization profile:', err.response?.data || err.message);
                }
            }

            // Upload new profile image if selected
            if (file) {
                console.log("Uploading profile image...", file.name);
                const formData = new FormData();
                formData.append("profile_img", file);

                const uploadResp = await api.post("/user/profile/upload-image", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                console.log("Upload response:", uploadResp.data);

                const url = uploadResp.data?.url || uploadResp.data?.profile_img || null;
                if (url) {
                    setUser(prev => ({ ...prev, profile_img: url }));
                    setPreviewImg(getImgUrl(url));
                    console.log("Profile image updated to:", url);
                }
                setFile(null);
            }

            // Update localStorage with latest data
            try {
                const localUser = JSON.parse(localStorage.getItem("user") || "{}");
                const updatedLocalUser = {
                    ...localUser,
                    name: user.name,
                    username: user.username,
                    phone: user.phone,
                    bio: user.bio
                };
                localStorage.setItem("user", JSON.stringify(updatedLocalUser));
                console.log("LocalStorage updated:", updatedLocalUser);
            } catch (e) {
                console.warn("Failed to update localStorage", e);
            }

            // Reload profile data from server to ensure sync
            console.log("Reloading profile from server...");
            await loadProfile();

            // Reload org profile if applicable
            if (orgProfile) await loadOrgIfNeeded();

            alert("✅ Profil berhasil diperbarui!");
            console.log("=== Profile update completed ===");

        } catch (error) {
            console.error("=== Profile update FAILED ===");
            console.error("Error object:", error);
            console.error("Error response:", error.response?.data);
            console.error("Error status:", error.response?.status);

            const errorMsg = error.response?.data?.error || error.message || "Terjadi kesalahan";
            setError("Gagal update profil: " + errorMsg);
            alert("❌ Gagal update profil: " + errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <div style={{
                    width: "40px",
                    height: "40px",
                    border: "3px solid #e2e8f0",
                    borderTopColor: "#3b82f6",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 16px"
                }}></div>
                Memuat profil...
            </div>
        );
    }

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

            {/* Error/Warning Message */}
            {error && (
                <div style={{
                    background: error.includes("cached") ? "#fffbeb" : "#fef2f2",
                    border: error.includes("cached") ? "1px solid #fed7aa" : "1px solid #fecaca",
                    color: error.includes("cached") ? "#b45309" : "#dc2626",
                    padding: "16px",
                    borderRadius: "8px",
                    marginBottom: "20px",
                    fontSize: "0.9rem"
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
                        display: "flex",
                        alignItems: "center",
                        gap: "24px",
                        padding: "20px",
                        background: "#f8fafc",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0"
                    }}>
                        <div style={{
                            width: "100px",
                            height: "100px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
                            overflow: "hidden",
                            border: "3px solid #3b82f6",
                            flexShrink: 0
                        }}>
                            {previewImg ? (
                                <img
                                    src={previewImg}
                                    alt="Profil"
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    onError={(e) => {
                                        console.log("Image failed to load:", previewImg);
                                        e.target.style.display = 'none';
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: "100%",
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "2.5rem"
                                }}>
                                    👤
                                </div>
                            )}
                        </div>
                        <div>
                            <label style={{
                                display: "inline-block",
                                padding: "10px 18px",
                                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                                color: "white",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontWeight: "600",
                                fontSize: "0.9rem"
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
                            padding: "8px 12px",
                            background: "#f1f5f9",
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                            color: "#64748b",
                            display: "inline-block",
                            alignSelf: "flex-start"
                        }}>
                            🔑 User ID: {user.id}
                        </div>
                    )}

                    {/* Form Fields */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        <div>
                            <label style={labelStyle}>Nama Lengkap</label>
                            <input
                                type="text"
                                name="name"
                                value={user.name || ""}
                                onChange={handleChange}
                                style={inputStyle}
                                required
                                placeholder="Masukkan nama lengkap"
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Username</label>
                            <input
                                type="text"
                                name="username"
                                value={user.username || ""}
                                onChange={handleChange}
                                style={inputStyle}
                                placeholder="Username untuk ditampilkan"
                            />
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        <div>
                            <label style={labelStyle}>Email</label>
                            <input
                                type="email"
                                value={user.email || ""}
                                disabled
                                style={{
                                    ...inputStyle,
                                    background: "#f1f5f9",
                                    color: "#64748b",
                                    cursor: "not-allowed"
                                }}
                            />
                            <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                                Email tidak dapat diubah
                            </span>
                        </div>
                        <div>
                            <label style={labelStyle}>No. Telepon</label>
                            <input
                                type="text"
                                name="phone"
                                value={user.phone || ""}
                                onChange={handleChange}
                                style={inputStyle}
                                placeholder="Contoh: 08123456789"
                            />
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>Biodata</label>
                        <textarea
                            name="bio"
                            value={user.bio || ""}
                            onChange={handleChange}
                            rows="4"
                            style={{
                                ...inputStyle,
                                resize: "vertical"
                            }}
                            placeholder="Ceritakan sedikit tentang dirimu..."
                        />
                    </div>

                    {/* Organization Section */}
                    {orgProfile && (
                        <div style={{
                            padding: "20px",
                            background: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                            borderRadius: "12px"
                        }}>
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "16px"
                            }}>
                                <h3 style={{ margin: 0, color: "#166534", fontSize: "1rem" }}>
                                    🏢 Organisasi: {orgProfile.name}
                                </h3>
                                <a
                                    href="/dashboard/org"
                                    style={{
                                        padding: "8px 14px",
                                        background: "linear-gradient(135deg, #22c55e, #16a34a)",
                                        color: "white",
                                        borderRadius: "6px",
                                        textDecoration: "none",
                                        fontSize: "0.85rem",
                                        fontWeight: "600"
                                    }}
                                >
                                    Kelola Organisasi
                                </a>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {orgProfile.website && (
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <span style={{ color: "#64748b", fontSize: "0.9rem", minWidth: "100px" }}>🌐 Website:</span>
                                        <a
                                            href={orgProfile.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: "#3b82f6", fontSize: "0.9rem", flex: 1, wordBreak: "break-all" }}
                                        >
                                            {orgProfile.website}
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(orgProfile.website);
                                                alert("Link website berhasil disalin!");
                                            }}
                                            style={{
                                                padding: "6px 12px",
                                                background: "#e0f2fe",
                                                color: "#0284c7",
                                                border: "1px solid #bae6fd",
                                                borderRadius: "6px",
                                                cursor: "pointer",
                                                fontSize: "0.8rem",
                                                fontWeight: "500"
                                            }}
                                        >
                                            📋 Copy
                                        </button>
                                    </div>
                                )}
                                {orgProfile.social_link && (
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <span style={{ color: "#64748b", fontSize: "0.9rem", minWidth: "100px" }}>📱 Social:</span>
                                        <a
                                            href={orgProfile.social_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: "#3b82f6", fontSize: "0.9rem", flex: 1, wordBreak: "break-all" }}
                                        >
                                            {orgProfile.social_link}
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(orgProfile.social_link);
                                                alert("Link social media berhasil disalin!");
                                            }}
                                            style={{
                                                padding: "6px 12px",
                                                background: "#e0f2fe",
                                                color: "#0284c7",
                                                border: "1px solid #bae6fd",
                                                borderRadius: "6px",
                                                cursor: "pointer",
                                                fontSize: "0.8rem",
                                                fontWeight: "500"
                                            }}
                                        >
                                            📋 Copy
                                        </button>
                                    </div>
                                )}
                                {!orgProfile.website && !orgProfile.social_link && (
                                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem", fontStyle: "italic" }}>
                                        Belum ada website atau social link. Edit di halaman Kelola Organisasi.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: "14px 24px",
                            background: loading
                                ? "#94a3b8"
                                : "linear-gradient(135deg, #3b82f6, #2563eb)",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: loading ? "not-allowed" : "pointer",
                            fontWeight: "600",
                            fontSize: "1rem",
                            transition: "all 0.2s ease"
                        }}
                    >
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