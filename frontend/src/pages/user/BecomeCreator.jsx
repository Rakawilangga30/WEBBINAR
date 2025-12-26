import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";

export default function BecomeCreator() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);
    const [isOrganizer, setIsOrganizer] = useState(false);
    const [profileIncomplete, setProfileIncomplete] = useState(false);
    const [missingFields, setMissingFields] = useState([]);
    const [application, setApplication] = useState(null); // { status, org_name, submitted_at, review_note }

    const [form, setForm] = useState({
        org_name: "",
        org_description: "",
        org_category: "Teknologi",
        org_email: "",
        org_phone: "",
        org_website: "",
        reason: "",
        social_media: ""
    });

    const categories = [
        "Teknologi", "Bisnis", "Pendidikan", "Kesehatan",
        "Seni & Kreativitas", "Olahraga", "Musik", "Gaming", "Lifestyle", "Lainnya"
    ];

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            // 1. Check user profile
            const profileRes = await api.get("/user/profile");
            const user = profileRes.data.user;

            if (user.roles?.includes("ORGANIZER")) {
                setIsOrganizer(true);
                setCheckingStatus(false);
                return;
            }

            // 2. Check profile completeness
            const missing = [];
            if (!user.name?.trim()) missing.push("Nama Lengkap");
            if (!user.email?.trim()) missing.push("Email");
            if (!user.phone?.trim()) missing.push("Nomor Telepon");
            if (!user.gender?.trim()) missing.push("Jenis Kelamin");
            if (!user.birthdate?.trim()) missing.push("Tanggal Lahir");
            if (!user.address?.trim()) missing.push("Alamat");

            if (missing.length > 0) {
                setProfileIncomplete(true);
                setMissingFields(missing);
                setCheckingStatus(false);
                return;
            }

            // 3. Check existing application
            const appRes = await api.get("/organization/my-application");
            if (appRes.data.has_application) {
                setApplication(appRes.data.application);
            }
        } catch (error) {
            console.error("Error checking status:", error);
        } finally {
            setCheckingStatus(false);
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.org_name || !form.reason) {
            alert("Nama Organisasi dan Alasan wajib diisi!");
            return;
        }

        setLoading(true);
        try {
            await api.post("/organization/apply", form);
            alert("✅ Pengajuan berhasil dikirim! Admin akan meninjau pengajuan Anda.");
            // Reload to show pending status
            window.location.reload();
        } catch (error) {
            alert("❌ Gagal: " + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    // Loading state
    if (checkingStatus) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <div style={{
                    width: "32px", height: "32px",
                    border: "3px solid #e2e8f0", borderTopColor: "#3b82f6",
                    borderRadius: "50%", animation: "spin 1s linear infinite",
                    margin: "0 auto 12px"
                }}></div>
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
                <p style={{ color: "#64748b", marginBottom: "24px" }}>
                    Anda sudah terdaftar sebagai Creator/Organizer.
                </p>
                <Link to="/dashboard/org" style={buttonGreen}>
                    🏢 Buka Dashboard Organisasi
                </Link>
            </div>
        );
    }

    // Profile incomplete
    if (profileIncomplete) {
        return (
            <div style={cardStyle}>
                <div style={{ fontSize: "4rem", marginBottom: "20px" }}>⚠️</div>
                <h2 style={{ margin: "0 0 12px 0", color: "#dc2626" }}>Profil Belum Lengkap</h2>
                <p style={{ color: "#64748b", marginBottom: "20px" }}>
                    Lengkapi profil Anda terlebih dahulu untuk mengajukan menjadi Creator.
                </p>
                <div style={{ background: "#fef2f2", borderRadius: "10px", padding: "16px", marginBottom: "24px", border: "1px solid #fecaca", textAlign: "left" }}>
                    <p style={{ margin: "0 0 8px 0", fontWeight: "600", color: "#991b1b" }}>Data yang belum lengkap:</p>
                    <ul style={{ margin: 0, padding: "0 0 0 20px", color: "#dc2626" }}>
                        {missingFields.map(field => <li key={field}>{field}</li>)}
                    </ul>
                </div>
                <Link to="/dashboard/profile" style={buttonBlue}>
                    👤 Lengkapi Profil Sekarang
                </Link>
            </div>
        );
    }

    // Has pending application
    if (application?.status === "PENDING") {
        return (
            <div style={cardStyle}>
                <div style={{ fontSize: "4rem", marginBottom: "20px" }}>⏳</div>
                <h2 style={{ margin: "0 0 12px 0", color: "#d97706" }}>Menunggu Review</h2>
                <p style={{ color: "#64748b", marginBottom: "20px" }}>
                    Pengajuan Anda sedang dalam proses review oleh admin.
                </p>
                <div style={{ background: "#fffbeb", borderRadius: "10px", padding: "20px", border: "1px solid #fed7aa", textAlign: "left" }}>
                    <div style={{ marginBottom: "12px" }}>
                        <span style={{ color: "#92400e", fontWeight: "600" }}>Nama Organisasi:</span>
                        <span style={{ marginLeft: "8px", color: "#1e293b" }}>{application.org_name}</span>
                    </div>
                    <div>
                        <span style={{ color: "#92400e", fontWeight: "600" }}>Diajukan:</span>
                        <span style={{ marginLeft: "8px", color: "#1e293b" }}>
                            {new Date(application.submitted_at).toLocaleDateString("id-ID", {
                                day: "numeric", month: "long", year: "numeric"
                            })}
                        </span>
                    </div>
                </div>
                <p style={{ marginTop: "20px", color: "#92400e", fontSize: "0.9rem" }}>
                    💡 Admin biasanya memproses pengajuan dalam 1-3 hari kerja.
                </p>
            </div>
        );
    }

    // Has rejected application
    if (application?.status === "REJECTED") {
        return (
            <div>
                <div style={{ ...cardStyle, marginBottom: "24px", maxWidth: "100%" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "16px" }}>❌</div>
                    <h2 style={{ margin: "0 0 12px 0", color: "#dc2626" }}>Pengajuan Ditolak</h2>
                    <p style={{ color: "#64748b", marginBottom: "16px" }}>
                        Pengajuan sebelumnya untuk "{application.org_name}" telah ditolak.
                    </p>
                    {application.review_note && (
                        <div style={{ background: "#fef2f2", borderRadius: "10px", padding: "16px", border: "1px solid #fecaca", textAlign: "left" }}>
                            <p style={{ margin: "0 0 4px 0", fontWeight: "600", color: "#991b1b" }}>Alasan Penolakan:</p>
                            <p style={{ margin: 0, color: "#dc2626" }}>{application.review_note}</p>
                        </div>
                    )}
                    <p style={{ marginTop: "16px", color: "#64748b", fontSize: "0.9rem" }}>
                        Anda dapat mengajukan kembali dengan informasi yang diperbaiki.
                    </p>
                </div>
                {/* Show form below for re-apply */}
                {renderForm()}
            </div>
        );
    }

    // No application - show form
    return renderForm();

    function renderForm() {
        return (
            <div>
                {/* Header */}
                <div style={{ marginBottom: "24px" }}>
                    <h2 style={{ margin: "0 0 4px 0", color: "#1e293b", fontSize: "1.5rem" }}>🚀 Jadi Creator</h2>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                        Daftarkan organisasi Anda dan mulai buat event!
                    </p>
                </div>

                {/* Info Card */}
                <div style={{ background: "linear-gradient(135deg, #eff6ff, #dbeafe)", borderRadius: "12px", padding: "20px 24px", marginBottom: "24px", border: "1px solid #bfdbfe" }}>
                    <h4 style={{ margin: "0 0 8px 0", color: "#1e40af" }}>ℹ️ Apa itu Creator?</h4>
                    <p style={{ margin: 0, color: "#3b82f6", fontSize: "0.9rem", lineHeight: "1.6" }}>
                        Sebagai Creator, Anda dapat membuat event, webinar, kursus online, dan menjualnya kepada pengguna.
                        Pengajuan akan ditinjau oleh admin dalam 1-3 hari kerja.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", padding: "24px", marginBottom: "24px" }}>
                        <h3 style={{ margin: "0 0 20px 0", color: "#1e293b" }}>🏢 Informasi Organisasi</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                            <div>
                                <label style={labelStyle}>Nama Organisasi *</label>
                                <input type="text" name="org_name" value={form.org_name} onChange={handleChange} placeholder="Contoh: Tech Academy Indonesia" style={inputStyle} required />
                            </div>
                            <div>
                                <label style={labelStyle}>Kategori</label>
                                <select name="org_category" value={form.org_category} onChange={handleChange} style={inputStyle}>
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Email Organisasi</label>
                                <input type="email" name="org_email" value={form.org_email} onChange={handleChange} placeholder="info@organisasi.com" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Nomor Telepon</label>
                                <input type="text" name="org_phone" value={form.org_phone} onChange={handleChange} placeholder="0812-xxxx-xxxx" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Website</label>
                                <input type="url" name="org_website" value={form.org_website} onChange={handleChange} placeholder="https://organisasi.com" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Social Media</label>
                                <input type="text" name="social_media" value={form.social_media} onChange={handleChange} placeholder="@instagram, @twitter" style={inputStyle} />
                            </div>
                            <div style={{ gridColumn: "1 / -1" }}>
                                <label style={labelStyle}>Deskripsi Organisasi</label>
                                <textarea name="org_description" value={form.org_description} onChange={handleChange} placeholder="Ceritakan tentang organisasi Anda..." style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", padding: "24px", marginBottom: "24px" }}>
                        <h3 style={{ margin: "0 0 20px 0", color: "#1e293b" }}>📝 Alasan Pengajuan</h3>
                        <div>
                            <label style={labelStyle}>Mengapa Anda ingin menjadi Creator? *</label>
                            <textarea name="reason" value={form.reason} onChange={handleChange} placeholder="Jelaskan alasan Anda ingin menjadi creator..." style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }} required />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                        <Link to="/dashboard" style={{ padding: "14px 28px", background: "white", color: "#374151", textDecoration: "none", borderRadius: "10px", fontWeight: "500", border: "1px solid #e2e8f0" }}>
                            Batal
                        </Link>
                        <button type="submit" disabled={loading} style={{
                            padding: "14px 32px",
                            background: loading ? "#94a3b8" : "linear-gradient(135deg, #22c55e, #16a34a)",
                            color: "white", border: "none", borderRadius: "10px",
                            cursor: loading ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "1rem"
                        }}>
                            {loading ? "Mengirim..." : "🚀 Kirim Pengajuan"}
                        </button>
                    </div>
                </form>
            </div>
        );
    }
}

const cardStyle = {
    background: "white", borderRadius: "16px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    padding: "48px", textAlign: "center", maxWidth: "500px", margin: "40px auto"
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
