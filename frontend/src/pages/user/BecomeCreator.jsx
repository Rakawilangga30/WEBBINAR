import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";

export default function BecomeCreator() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);
    const [isOrganizer, setIsOrganizer] = useState(false);
    const [isAffiliate, setIsAffiliate] = useState(false);
    const [hasAffiliateSubmissions, setHasAffiliateSubmissions] = useState(false);
    const [profileIncomplete, setProfileIncomplete] = useState(false);
    const [missingFields, setMissingFields] = useState([]);
    const [orgApplication, setOrgApplication] = useState(null);
    const [selectedPath, setSelectedPath] = useState(null);

    const [orgForm, setOrgForm] = useState({
        org_name: "", org_description: "", org_category: "Teknologi",
        org_email: "", org_phone: "", org_website: "", reason: "", social_media: ""
    });

    const categories = [
        "Teknologi", "Bisnis", "Pendidikan", "Kesehatan",
        "Seni & Kreativitas", "Olahraga", "Musik", "Gaming", "Lifestyle", "Lainnya"
    ];

    useEffect(() => { checkStatus(); }, []);

    const checkStatus = async () => {
        try {
            const profileRes = await api.get("/user/profile");
            const user = profileRes.data.user;

            if (user.roles?.includes("ORGANIZER")) {
                setIsOrganizer(true);
                setCheckingStatus(false);
                return;
            }
            if (user.roles?.includes("AFFILIATE")) {
                setIsAffiliate(true);
                setCheckingStatus(false);
                return;
            }

            // Check if has any affiliate submissions (even without AFFILIATE role)
            try {
                const affRes = await api.get("/affiliate/events");
                if (affRes.data.events?.length > 0) {
                    setHasAffiliateSubmissions(true);
                }
            } catch (e) { }

            // Check profile completeness
            const missing = [];
            if (!user.name?.trim()) missing.push("Nama Lengkap");
            if (!user.email?.trim()) missing.push("Email");

            if (missing.length > 0) {
                setProfileIncomplete(true);
                setMissingFields(missing);
                setCheckingStatus(false);
                return;
            }

            // Check existing org application
            try {
                const orgRes = await api.get("/organization/my-application");
                if (orgRes.data.has_application) setOrgApplication(orgRes.data.application);
            } catch (e) { }

        } catch (error) {
            console.error("Error checking status:", error);
        } finally {
            setCheckingStatus(false);
        }
    };

    const handleOrgSubmit = async (e) => {
        e.preventDefault();
        if (!orgForm.org_name || !orgForm.reason) {
            alert("Nama Organisasi dan Alasan wajib diisi!");
            return;
        }
        setLoading(true);
        try {
            await api.post("/organization/apply", orgForm);
            alert("✅ Pengajuan organisasi berhasil dikirim!");
            window.location.reload();
        } catch (error) {
            alert("❌ Gagal: " + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    // Loading
    if (checkingStatus) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <div style={{ width: "32px", height: "32px", border: "3px solid #e2e8f0", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }}></div>
                Memeriksa status...
            </div>
        );
    }

    // Already an organizer
    if (isOrganizer) {
        return (
            <div style={cardStyle}>
                <div style={{ fontSize: "4rem", marginBottom: "20px" }}>🎉</div>
                <h2 style={{ margin: "0 0 12px 0", color: "#1e293b" }}>Anda Sudah Menjadi Creator!</h2>
                <p style={{ color: "#64748b", marginBottom: "24px" }}>Anda sudah terdaftar sebagai Creator/Organizer.</p>
                <Link to="/dashboard/org" style={buttonGreen}>🏢 Buka Dashboard Organisasi</Link>
            </div>
        );
    }

    // Already an affiliate or has submissions
    if (isAffiliate || hasAffiliateSubmissions) {
        return (
            <div style={cardStyle}>
                <div style={{ fontSize: "4rem", marginBottom: "20px" }}>🤝</div>
                <h2 style={{ margin: "0 0 12px 0", color: "#1e293b" }}>
                    {isAffiliate ? "Anda Sudah Menjadi Affiliate!" : "Anda Sudah Mengajukan Event!"}
                </h2>
                <p style={{ color: "#64748b", marginBottom: "24px" }}>
                    {isAffiliate
                        ? "Anda sudah terdaftar sebagai Affiliate Partner."
                        : "Event Anda sedang dalam proses review admin."}
                </p>
                <Link to="/dashboard/affiliate" style={buttonGreen}>📊 Buka Dashboard Affiliate</Link>
            </div>
        );
    }

    // Profile incomplete
    if (profileIncomplete) {
        return (
            <div style={cardStyle}>
                <div style={{ fontSize: "4rem", marginBottom: "20px" }}>⚠️</div>
                <h2 style={{ margin: "0 0 12px 0", color: "#dc2626" }}>Profil Belum Lengkap</h2>
                <p style={{ color: "#64748b", marginBottom: "20px" }}>Lengkapi profil Anda terlebih dahulu.</p>
                <div style={{ background: "#fef2f2", borderRadius: "10px", padding: "16px", marginBottom: "24px", border: "1px solid #fecaca", textAlign: "left" }}>
                    <p style={{ margin: "0 0 8px 0", fontWeight: "600", color: "#991b1b" }}>Data yang belum lengkap:</p>
                    <ul style={{ margin: 0, padding: "0 0 0 20px", color: "#dc2626" }}>
                        {missingFields.map(field => <li key={field}>{field}</li>)}
                    </ul>
                </div>
                <Link to="/dashboard/profile" style={buttonBlue}>👤 Lengkapi Profil</Link>
            </div>
        );
    }

    // Check pending org application
    if (orgApplication?.status === "PENDING") {
        return (
            <div style={cardStyle}>
                <div style={{ fontSize: "4rem", marginBottom: "20px" }}>⏳</div>
                <h2 style={{ margin: "0 0 12px 0", color: "#d97706" }}>Menunggu Review</h2>
                <p style={{ color: "#64748b", marginBottom: "20px" }}>
                    Pengajuan Organisasi "{orgApplication.org_name}" sedang direview admin.
                </p>
                <p style={{ color: "#92400e", fontSize: "0.9rem" }}>
                    💡 Ingin langsung mulai? Coba jalur Affiliate!
                </p>
                <div style={{ marginTop: "20px" }}>
                    <button onClick={() => setSelectedPath('affiliate')} style={buttonGreen}>
                        🤝 Jadi Affiliate Dulu
                    </button>
                </div>
            </div>
        );
    }

    // Show path selection or form
    if (!selectedPath) {
        return (
            <div>
                <div style={{ marginBottom: "32px", textAlign: "center" }}>
                    <h2 style={{ margin: "0 0 8px 0", color: "#1e293b", fontSize: "1.75rem" }}>🚀 Jadi Creator</h2>
                    <p style={{ margin: 0, color: "#64748b" }}>Pilih jalur yang sesuai dengan kebutuhan Anda</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
                    {/* Organization Option */}
                    <div style={optionCard} onClick={() => setSelectedPath('organization')}>
                        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🏢</div>
                        <h3 style={{ margin: "0 0 12px 0", color: "#1e293b" }}>Jadi Organisasi</h3>
                        <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "16px" }}>
                            Buat organisasi sendiri, kelola event, dan jual kursus dengan brand Anda.
                        </p>
                        <ul style={{ textAlign: "left", color: "#475569", fontSize: "0.85rem", paddingLeft: "20px", margin: "0 0 20px 0" }}>
                            <li>Dashboard organisasi lengkap</li>
                            <li>Kelola banyak event</li>
                            <li>Brand & logo sendiri</li>
                            <li>Perlu persetujuan admin dulu</li>
                        </ul>
                        <div style={{ ...buttonBlue, textAlign: "center" }}>Pilih Organisasi →</div>
                    </div>

                    {/* Affiliate Option */}
                    <div style={optionCard} onClick={() => setSelectedPath('affiliate')}>
                        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🤝</div>
                        <h3 style={{ margin: "0 0 12px 0", color: "#1e293b" }}>Jadi Affiliate</h3>
                        <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "16px" }}>
                            Langsung ajukan event dan dapatkan 90% dari setiap penjualan.
                        </p>
                        <ul style={{ textAlign: "left", color: "#475569", fontSize: "0.85rem", paddingLeft: "20px", margin: "0 0 20px 0" }}>
                            <li>Langsung submit event</li>
                            <li>Tidak perlu kelola organisasi</li>
                            <li>90% pendapatan per penjualan</li>
                            <li>Event dipublikasi di Official</li>
                        </ul>
                        <div style={{ ...buttonGreen, textAlign: "center" }}>Pilih Affiliate →</div>
                    </div>
                </div>
            </div>
        );
    }

    // Show Organization Form
    if (selectedPath === 'organization') {
        return (
            <div>
                <button onClick={() => setSelectedPath(null)} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", marginBottom: "20px", fontSize: "0.9rem" }}>
                    ← Kembali ke Pilihan
                </button>

                <div style={{ marginBottom: "24px" }}>
                    <h2 style={{ margin: "0 0 4px 0", color: "#1e293b", fontSize: "1.5rem" }}>🏢 Jadi Organisasi</h2>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>Daftarkan organisasi Anda</p>
                </div>

                <form onSubmit={handleOrgSubmit}>
                    <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", padding: "24px", marginBottom: "24px" }}>
                        <h3 style={{ margin: "0 0 20px 0", color: "#1e293b" }}>Informasi Organisasi</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                            <div>
                                <label style={labelStyle}>Nama Organisasi *</label>
                                <input type="text" name="org_name" value={orgForm.org_name} onChange={(e) => setOrgForm({ ...orgForm, org_name: e.target.value })} placeholder="Tech Academy Indonesia" style={inputStyle} required />
                            </div>
                            <div>
                                <label style={labelStyle}>Kategori</label>
                                <select name="org_category" value={orgForm.org_category} onChange={(e) => setOrgForm({ ...orgForm, org_category: e.target.value })} style={inputStyle}>
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Email Organisasi</label>
                                <input type="email" value={orgForm.org_email} onChange={(e) => setOrgForm({ ...orgForm, org_email: e.target.value })} placeholder="info@organisasi.com" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Nomor Telepon</label>
                                <input type="text" value={orgForm.org_phone} onChange={(e) => setOrgForm({ ...orgForm, org_phone: e.target.value })} placeholder="0812-xxxx-xxxx" style={inputStyle} />
                            </div>
                            <div style={{ gridColumn: "1 / -1" }}>
                                <label style={labelStyle}>Deskripsi Organisasi</label>
                                <textarea value={orgForm.org_description} onChange={(e) => setOrgForm({ ...orgForm, org_description: e.target.value })} placeholder="Ceritakan tentang organisasi Anda..." style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }} />
                            </div>
                            <div style={{ gridColumn: "1 / -1" }}>
                                <label style={labelStyle}>Alasan Pengajuan *</label>
                                <textarea value={orgForm.reason} onChange={(e) => setOrgForm({ ...orgForm, reason: e.target.value })} placeholder="Mengapa Anda ingin menjadi creator?" style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }} required />
                            </div>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                        <button type="button" onClick={() => setSelectedPath(null)} style={{ padding: "14px 28px", background: "white", color: "#374151", border: "1px solid #e2e8f0", borderRadius: "10px", cursor: "pointer" }}>Batal</button>
                        <button type="submit" disabled={loading} style={{ padding: "14px 32px", background: loading ? "#94a3b8" : "linear-gradient(135deg, #3b82f6, #2563eb)", color: "white", border: "none", borderRadius: "10px", cursor: loading ? "not-allowed" : "pointer", fontWeight: "600" }}>
                            {loading ? "Mengirim..." : "🚀 Kirim Pengajuan"}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    // Affiliate - Redirect to submit event page
    if (selectedPath === 'affiliate') {
        navigate('/dashboard/affiliate/submit');
        return null;
    }
}

const cardStyle = {
    background: "white", borderRadius: "16px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    padding: "48px", textAlign: "center", maxWidth: "500px", margin: "40px auto"
};

const optionCard = {
    background: "white", borderRadius: "16px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    padding: "32px", textAlign: "center", cursor: "pointer",
    transition: "all 0.3s ease", border: "2px solid transparent"
};

const buttonGreen = {
    display: "inline-block", padding: "14px 28px",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "white", textDecoration: "none", borderRadius: "10px", fontWeight: "600"
};

const buttonBlue = {
    display: "inline-block", padding: "14px 28px",
    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
    color: "white", textDecoration: "none", borderRadius: "10px", fontWeight: "600"
};

const labelStyle = { display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#374151", marginBottom: "6px" };

const inputStyle = {
    width: "100%", padding: "12px 14px", border: "1px solid #d1d5db",
    borderRadius: "8px", fontSize: "0.95rem", boxSizing: "border-box"
};
