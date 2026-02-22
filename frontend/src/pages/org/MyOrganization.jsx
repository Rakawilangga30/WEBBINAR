import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import api, { uploadEventThumbnail } from "../../api";
import { getBackendUrl } from "../../utils/url";

export default function MyOrganization() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showCreate, setShowCreate] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: "", description: "", category: "Teknologi" });
    const [thumbnailFile, setThumbnailFile] = useState(null);

    // Organization Profile State
    const [orgProfile, setOrgProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [editProfile, setEditProfile] = useState({
        name: "",
        description: "",
        category: "",
        logo_url: "",
        email: "",
        phone: "",
        website: "",
        social_link: "",
        address: ""
    });
    const [savingProfile, setSavingProfile] = useState(false);
    const [logoFile, setLogoFile] = useState(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    useEffect(() => {
        fetchMyEvents();
        fetchOrgProfile();
    }, []);

    const fetchOrgProfile = async () => {
        try {
            const res = await api.get("/organization/profile");
            const org = res.data.organization;
            setOrgProfile(org);
            setEditProfile({
                name: org.name || "",
                description: org.description || "",
                category: org.category || "",
                logo_url: org.logo_url || "",
                email: org.email || "",
                phone: org.phone || "",
                website: org.website || "",
                social_link: org.social_link || "",
                address: org.address || ""
            });
        } catch (error) {
            console.error("Gagal load profil organisasi:", error);
        } finally {
            setProfileLoading(false);
        }
    };

    const handleLogoUpload = async (file) => {
        if (!file) return;
        setUploadingLogo(true);
        try {
            const formData = new FormData();
            formData.append("logo", file);
            const res = await api.post("/organization/profile/logo", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            // Update logo_url in profile
            if (res.data.logo_url) {
                setEditProfile(prev => ({ ...prev, logo_url: res.data.logo_url }));
            }
            toast.success("Logo berhasil diupload!");
            setLogoFile(null);
        } catch (error) {
            console.error("Gagal upload logo:", error);
            toast.error("Gagal upload logo: " + (error.response?.data?.error || "Error"));
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        try {
            await api.put("/organization/profile", editProfile);
            await fetchOrgProfile();
            setShowEditProfile(false);
            toast.success("Profil organisasi berhasil diupdate!");
        } catch (error) {
            console.error(error);
            toast.error("Gagal update profil: " + (error.response?.data?.error || "Error"));
        } finally {
            setSavingProfile(false);
        }
    };

    const fetchMyEvents = async () => {
        try {
            const res = await api.get("/organization/events");
            setEvents(res.data.events || []);
        } catch (error) {
            console.error("Gagal load event:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post("/organization/events", newEvent);
            const createdId = res.data?.event_id || res.data?.id || res.data?.ID || null;

            if (thumbnailFile && createdId) {
                try {
                    await uploadEventThumbnail(createdId, thumbnailFile);
                } catch (err) {
                    console.error("Gagal upload thumbnail:", err);
                    toast.error("Event dibuat, tapi gagal upload thumbnail.");
                }
            }

            toast.success("Event berhasil dibuat!");
            setShowCreate(false);
            setNewEvent({ title: "", description: "", category: "Teknologi" });
            setThumbnailFile(null);
            fetchMyEvents();
        } catch (error) {
            console.error(error);
            toast.error("Gagal buat event: " + (error.response?.data?.error || "Error"));
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
                gap: "16px"
            }}>
                <div>
                    <h2 style={{ margin: "0 0 4px 0", color: "#1e293b", fontSize: "1.5rem" }}>
                        🏢 Dashboard Organisasi
                    </h2>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                        Kelola profil dan event organisasi Anda
                    </p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    style={{
                        background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                        color: "white",
                        padding: "10px 20px",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "0.9rem"
                    }}
                >
                    ➕ Buat Event Baru
                </button>
            </div>

            {/* Organization Profile Section */}
            <div style={{
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                marginBottom: "24px",
                overflow: "hidden"
            }}>
                <div style={{
                    background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
                    padding: "20px 24px",
                    color: "white",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <h3 style={{ margin: 0, fontSize: "1.1rem" }}>📋 Profil Organisasi</h3>
                    <button
                        onClick={() => setShowEditProfile(!showEditProfile)}
                        style={{
                            background: "rgba(255,255,255,0.2)",
                            color: "white",
                            padding: "8px 16px",
                            border: "1px solid rgba(255,255,255,0.3)",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "500",
                            fontSize: "0.85rem"
                        }}
                    >
                        {showEditProfile ? "❌ Batal" : "✏️ Edit Profil"}
                    </button>
                </div>

                {showEditProfile ? (
                    /* Edit Profile Form */
                    <form onSubmit={handleSaveProfile} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                        {/* Logo Upload Section */}
                        <div style={{ display: "flex", alignItems: "center", gap: "20px", paddingBottom: "16px", borderBottom: "1px solid #f1f5f9" }}>
                            <div style={{
                                width: "80px",
                                height: "80px",
                                borderRadius: "12px",
                                background: editProfile.logo_url ? "transparent" : "linear-gradient(135deg, #eff6ff, #dbeafe)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                overflow: "hidden",
                                border: "2px solid #e2e8f0",
                                flexShrink: 0
                            }}>
                                {editProfile.logo_url ? (
                                    <img
                                        src={getBackendUrl(editProfile.logo_url)}
                                        alt="Logo Organisasi"
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                ) : (
                                    <span style={{ fontSize: "2rem" }}>🏢</span>
                                )}
                            </div>
                            <div>
                                <label style={labelStyle}>Logo Organisasi</label>
                                <label style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "10px 16px",
                                    background: uploadingLogo ? "#94a3b8" : "#eff6ff",
                                    color: uploadingLogo ? "white" : "#3b82f6",
                                    borderRadius: "8px",
                                    fontSize: "0.9rem",
                                    fontWeight: "600",
                                    cursor: uploadingLogo ? "not-allowed" : "pointer",
                                    border: "1px solid #dbeafe",
                                    marginTop: "4px"
                                }}>
                                    {uploadingLogo ? "⏳ Uploading..." : "📷 Ganti Logo"}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        disabled={uploadingLogo}
                                        onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (file) handleLogoUpload(file);
                                        }}
                                        style={{ display: "none" }}
                                    />
                                </label>
                                <p style={{ margin: "8px 0 0 0", fontSize: "0.8rem", color: "#64748b" }}>
                                    Format: JPG, PNG, GIF. Max 2MB
                                </p>
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
                            <div>
                                <label style={labelStyle}>Nama Organisasi</label>
                                <input
                                    type="text"
                                    placeholder="Nama organisasi"
                                    value={editProfile.name}
                                    onChange={e => setEditProfile({ ...editProfile, name: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Kategori</label>
                                <select
                                    value={editProfile.category}
                                    onChange={e => setEditProfile({ ...editProfile, category: e.target.value })}
                                    style={inputStyle}
                                >
                                    <option value="">Pilih Kategori</option>
                                    <option value="Teknologi">Teknologi</option>
                                    <option value="Pendidikan">Pendidikan</option>
                                    <option value="Bisnis">Bisnis</option>
                                    <option value="Desain">Desain</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>Deskripsi</label>
                            <textarea
                                placeholder="Deskripsi organisasi..."
                                rows="3"
                                value={editProfile.description}
                                onChange={e => setEditProfile({ ...editProfile, description: e.target.value })}
                                style={{ ...inputStyle, resize: "vertical" }}
                            />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
                            <div>
                                <label style={labelStyle}>Email</label>
                                <input
                                    type="email"
                                    placeholder="email@organisasi.com"
                                    value={editProfile.email}
                                    onChange={e => setEditProfile({ ...editProfile, email: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Telepon</label>
                                <input
                                    type="text"
                                    placeholder="08xxx"
                                    value={editProfile.phone}
                                    onChange={e => setEditProfile({ ...editProfile, phone: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
                            <div>
                                <label style={labelStyle}>Website</label>
                                <input
                                    type="url"
                                    placeholder="https://website.com"
                                    value={editProfile.website}
                                    onChange={e => setEditProfile({ ...editProfile, website: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Social Link</label>
                                <input
                                    type="url"
                                    placeholder="https://instagram.com/..."
                                    value={editProfile.social_link}
                                    onChange={e => setEditProfile({ ...editProfile, social_link: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>Alamat</label>
                            <textarea
                                placeholder="Alamat lengkap..."
                                rows="2"
                                value={editProfile.address}
                                onChange={e => setEditProfile({ ...editProfile, address: e.target.value })}
                                style={{ ...inputStyle, resize: "vertical" }}
                            />
                        </div>

                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "8px" }}>
                            <button
                                type="button"
                                onClick={() => setShowEditProfile(false)}
                                style={{
                                    padding: "10px 20px",
                                    background: "white",
                                    color: "#374151",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    fontWeight: "500"
                                }}
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={savingProfile}
                                style={{
                                    padding: "10px 20px",
                                    background: savingProfile ? "#94a3b8" : "linear-gradient(135deg, #22c55e, #16a34a)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    cursor: savingProfile ? "not-allowed" : "pointer",
                                    fontWeight: "600"
                                }}
                            >
                                {savingProfile ? "Menyimpan..." : "💾 Simpan Profil"}
                            </button>
                        </div>
                    </form>
                ) : (
                    /* Display Profile */
                    <div style={{ padding: "24px" }}>
                        {orgProfile ? (
                            <div style={{ display: "grid", gap: "16px" }}>
                                <div style={{ display: "flex", gap: "20px", alignItems: "flex-start", flexWrap: "wrap" }}>
                                    {/* Logo Display Only */}
                                    <div style={{
                                        width: "80px",
                                        height: "80px",
                                        borderRadius: "12px",
                                        background: orgProfile.logo_url ? "transparent" : "linear-gradient(135deg, #eff6ff, #dbeafe)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        overflow: "hidden",
                                        border: "2px solid #e2e8f0",
                                        flexShrink: 0
                                    }}>
                                        {orgProfile.logo_url ? (
                                            <img
                                                src={getBackendUrl(orgProfile.logo_url)}
                                                alt="Logo Organisasi"
                                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                            />
                                        ) : (
                                            <span style={{ fontSize: "2rem" }}>🏢</span>
                                        )}
                                    </div>
                                    <div style={{ flex: 1, minWidth: "200px" }}>
                                        <h4 style={{ margin: "0 0 8px 0", color: "#1e293b", fontSize: "1.25rem" }}>
                                            {orgProfile.name || "Nama belum diset"}
                                        </h4>
                                        {orgProfile.category && (
                                            <span style={{
                                                background: "#dbeafe",
                                                color: "#1d4ed8",
                                                padding: "4px 12px",
                                                borderRadius: "6px",
                                                fontSize: "0.8rem",
                                                fontWeight: "600"
                                            }}>
                                                {orgProfile.category}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {orgProfile.description && (
                                    <p style={{ margin: 0, color: "#475569", fontSize: "0.9rem", lineHeight: 1.6 }}>
                                        {orgProfile.description}
                                    </p>
                                )}

                                <div style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "10px",
                                    paddingTop: "12px",
                                    borderTop: "1px solid #f1f5f9"
                                }}>
                                    {orgProfile.email && (
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "0.85rem" }}>
                                            <span style={{ width: "20px" }}>📧</span> {orgProfile.email}
                                        </div>
                                    )}
                                    {orgProfile.phone && (
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "0.85rem" }}>
                                            <span style={{ width: "20px" }}>📞</span> {orgProfile.phone}
                                        </div>
                                    )}
                                    {orgProfile.website && (
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "0.85rem" }}>
                                            <span style={{ width: "20px" }}>🌐</span>
                                            <a href={orgProfile.website} target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6", wordBreak: "break-all" }}>
                                                {orgProfile.website}
                                            </a>
                                        </div>
                                    )}
                                    {orgProfile.social_link && (
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "0.85rem" }}>
                                            <span style={{ width: "20px" }}>📱</span>
                                            <a href={orgProfile.social_link} target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6", wordBreak: "break-all" }}>
                                                {orgProfile.social_link}
                                            </a>
                                        </div>
                                    )}
                                    {orgProfile.address && (
                                        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", color: "#64748b", fontSize: "0.85rem" }}>
                                            <span style={{ width: "20px" }}>📍</span> {orgProfile.address}
                                        </div>
                                    )}
                                </div>

                                {!orgProfile.name && !orgProfile.description && !orgProfile.email && (
                                    <p style={{ margin: 0, color: "#94a3b8", fontStyle: "italic", fontSize: "0.9rem" }}>
                                        Profil belum lengkap. Klik "Edit Profil" untuk mengisi data organisasi.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div style={{ textAlign: "center", padding: "32px 20px", color: "#64748b" }}>
                                {profileLoading ? (
                                    <p style={{ margin: 0 }}>Memuat profil...</p>
                                ) : (
                                    <div>
                                        <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📝</div>
                                        <p style={{ margin: "0 0 8px 0", fontWeight: "500", color: "#1e293b" }}>
                                            Silahkan lengkapi profil organisasi
                                        </p>
                                        <p style={{ margin: 0, fontSize: "0.9rem" }}>
                                            Klik tombol "Edit Profil" di atas untuk mengisi data organisasi Anda
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Quick Actions Section */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
                marginBottom: "24px"
            }}>
                <Link to="/dashboard/org/report" style={quickActionStyle}>
                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📊</div>
                    <h4 style={{ margin: "0 0 4px 0", color: "#1e293b", fontSize: "1rem" }}>Lihat Laporan</h4>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.8rem" }}>Pantau penjualan & pendapatan</p>
                </Link>
                <Link to="/dashboard/org/withdraw" style={quickActionStyle}>
                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>💸</div>
                    <h4 style={{ margin: "0 0 4px 0", color: "#1e293b", fontSize: "1rem" }}>Tarik Dana (Payout)</h4>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.8rem" }}>Cairkan pendapatan Anda</p>
                </Link>
                <Link to="/dashboard/org/affiliate-withdrawals" style={quickActionStyle}>
                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>✅</div>
                    <h4 style={{ margin: "0 0 4px 0", color: "#1e293b", fontSize: "1rem" }}>Konfirmasi Payout Affiliate</h4>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.8rem" }}>Setujui payout affiliate Anda</p>
                </Link>
                <Link to="/dashboard/notifications" style={quickActionStyle}>
                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🔔</div>
                    <h4 style={{ margin: "0 0 4px 0", color: "#1e293b", fontSize: "1rem" }}>Notifikasi</h4>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.8rem" }}>Lihat pesan & update</p>
                </Link>
                <Link to="/dashboard/profile" style={quickActionStyle}>
                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>👤</div>
                    <h4 style={{ margin: "0 0 4px 0", color: "#1e293b", fontSize: "1rem" }}>Profil Saya</h4>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.8rem" }}>Edit data profil</p>
                </Link>
            </div>
            {showCreate && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0, 0, 0, 0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                    padding: "20px"
                }}>
                    <div style={{
                        background: "white",
                        padding: "24px",
                        borderRadius: "16px",
                        width: "100%",
                        maxWidth: "500px",
                        maxHeight: "90vh",
                        overflowY: "auto",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h3 style={{ margin: 0, color: "#1e293b" }}>✨ Buat Event Baru</h3>
                            <button
                                onClick={() => setShowCreate(false)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    fontSize: "1.5rem",
                                    cursor: "pointer",
                                    color: "#64748b"
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleCreateEvent} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label style={labelStyle}>Judul Event</label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Kursus Belajar Coding"
                                    required
                                    value={newEvent.title}
                                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>Deskripsi</label>
                                <textarea
                                    placeholder="Jelaskan detail event Anda..."
                                    required
                                    rows="3"
                                    value={newEvent.description}
                                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                    style={{ ...inputStyle, resize: "vertical" }}
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>Kategori</label>
                                <select
                                    value={newEvent.category}
                                    onChange={e => setNewEvent({ ...newEvent, category: e.target.value })}
                                    style={inputStyle}
                                >
                                    <option value="Teknologi">Teknologi</option>
                                    <option value="Bisnis">Bisnis</option>
                                    <option value="Desain">Desain</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            </div>

                            <div>
                                <label style={labelStyle}>Thumbnail (Opsional)</label>
                                <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                                    <label style={{
                                        padding: "10px 16px",
                                        background: "#f1f5f9",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        fontWeight: "500",
                                        fontSize: "0.9rem",
                                        border: "1px solid #e2e8f0"
                                    }}>
                                        📁 Pilih Gambar
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => setThumbnailFile(e.target.files?.[0] || null)}
                                            style={{ display: "none" }}
                                        />
                                    </label>
                                    <span style={{ color: "#64748b", fontSize: "0.9rem" }}>
                                        {thumbnailFile ? thumbnailFile.name : "Belum memilih file"}
                                    </span>
                                </div>
                                {thumbnailFile && (
                                    <div style={{ marginTop: "12px" }}>
                                        <img
                                            src={URL.createObjectURL(thumbnailFile)}
                                            alt="preview"
                                            style={{ maxWidth: "100%", maxHeight: "120px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                                        />
                                    </div>
                                )}
                            </div>

                            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "8px" }}>
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    style={{
                                        padding: "10px 20px",
                                        background: "white",
                                        color: "#374151",
                                        border: "1px solid #e2e8f0",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        fontWeight: "500"
                                    }}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        padding: "10px 20px",
                                        background: "linear-gradient(135deg, #22c55e, #16a34a)",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        fontWeight: "600"
                                    }}
                                >
                                    💾 Simpan Event
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Event List */}
            <div style={{
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                overflow: "hidden"
            }}>
                <div style={{
                    padding: "16px 24px",
                    borderBottom: "1px solid #f1f5f9",
                    background: "#fafafa"
                }}>
                    <h3 style={{ margin: 0, color: "#1e293b", fontSize: "1rem" }}>📚 Daftar Event</h3>
                </div>
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
                        Memuat event...
                    </div>
                ) : events.length === 0 ? (
                    <div style={{
                        textAlign: "center",
                        padding: "48px 20px",
                        color: "#64748b"
                    }}>
                        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📭</div>
                        <p style={{ margin: "0 0 8px 0", fontWeight: "500", color: "#1e293b" }}>
                            Belum ada event
                        </p>
                        <p style={{ margin: 0, fontSize: "0.9rem" }}>
                            Klik tombol "Buat Event Baru" untuk memulai
                        </p>
                    </div>
                ) : (
                    <div style={{ padding: "16px", display: "grid", gap: "12px" }}>
                        {events.map(evt => (
                            <div key={evt.id} style={{
                                border: "1px solid #e2e8f0",
                                padding: "20px",
                                borderRadius: "10px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                background: "#fafafa"
                            }}>
                                <div>
                                    <h4 style={{ margin: "0 0 8px 0", color: "#1e293b" }}>{evt.title}</h4>
                                    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                                        <span style={{
                                            background: "#eff6ff",
                                            color: "#3b82f6",
                                            fontSize: "0.75rem",
                                            padding: "4px 10px",
                                            borderRadius: "6px",
                                            fontWeight: "600"
                                        }}>
                                            {evt.category}
                                        </span>
                                        <span style={{
                                            fontSize: "0.8rem",
                                            fontWeight: "600",
                                            color: evt.publish_status === 'PUBLISHED'
                                                ? "#16a34a"
                                                : evt.publish_status === 'SCHEDULED'
                                                    ? "#f59e0b"
                                                    : "#64748b"
                                        }}>
                                            ● {evt.publish_status || "DRAFT"}
                                        </span>
                                    </div>
                                </div>
                                <Link
                                    to={`/dashboard/org/event/${evt.id}/manage`}
                                    style={{
                                        background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                                        color: "white",
                                        textDecoration: "none",
                                        padding: "10px 18px",
                                        borderRadius: "8px",
                                        fontWeight: "600",
                                        fontSize: "0.85rem"
                                    }}
                                >
                                    ⚙️ Kelola
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
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
    boxSizing: "border-box"
};

const quickActionStyle = {
    display: 'block',
    width: '100%',
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'center',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
    color: 'inherit'
};
