import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Lock, ArrowRight, ArrowLeft, Loader2, UserPlus, Building2, CreditCard, Phone, FileText } from "lucide-react";
import toast from 'react-hot-toast';
import api from "../api";

export default function Register() {
    const [registerType, setRegisterType] = useState("user"); // 'user' or 'organization'
    const [step, setStep] = useState(1); // 1 or 2 for organization

    // Step 1 - User data
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");

    // Step 2 - Organization data
    const [orgName, setOrgName] = useState("");
    const [orgDescription, setOrgDescription] = useState("");
    const [orgCategory, setOrgCategory] = useState("");
    const [orgPhone, setOrgPhone] = useState("");
    const [bankName, setBankName] = useState("");
    const [bankAccount, setBankAccount] = useState("");
    const [bankAccountName, setBankAccountName] = useState("");
    const [orgWebsite, setOrgWebsite] = useState("");
    const [orgSocialMedia, setOrgSocialMedia] = useState("");

    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleNextStep = (e) => {
        e.preventDefault();
        // Validate step 1
        if (!name || !email || !password) {
            toast.error("Lengkapi semua data yang diperlukan");
            return;
        }
        if (password.length < 6) {
            toast.error("Password minimal 6 karakter");
            return;
        }
        setStep(2);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                name,
                email,
                password,
                phone,
                register_type: registerType
            };

            // Add organization data if registering as org
            if (registerType === "organization") {
                if (!orgName || !orgCategory) {
                    toast.error("Nama organisasi dan kategori wajib diisi");
                    setLoading(false);
                    return;
                }
                payload.org_name = orgName;
                payload.org_description = orgDescription;
                payload.org_category = orgCategory;
                payload.org_phone = orgPhone;
                payload.bank_name = bankName;
                payload.bank_account = bankAccount;
                payload.bank_account_name = bankAccountName;
                payload.org_website = orgWebsite;
                payload.social_media = orgSocialMedia;
            }

            const res = await api.post("/register", payload);

            if (registerType === "organization") {
                toast.success("Registrasi Berhasil! Pengajuan organisasi sedang ditinjau admin.", { duration: 4000 });
            } else {
                toast.success("Registrasi Berhasil! Silakan Login.");
            }

            setTimeout(() => {
                navigate("/login");
            }, 1500);
        } catch (error) {
            console.error(error);
            toast.error("Registrasi Gagal: " + (error.response?.data?.error || "Terjadi kesalahan"));
        } finally {
            setLoading(false);
        }
    };

    const resetToStep1 = () => {
        setStep(1);
    };

    const handleTypeChange = (type) => {
        setRegisterType(type);
        setStep(1); // Reset to step 1 when changing type
    };

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%)",
            padding: "20px"
        }}>
            <div className="animate-scale-in" style={{
                width: "100%",
                maxWidth: "500px",
                padding: "40px",
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(10px)",
                borderRadius: "24px",
                boxShadow: "0 20px 40px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.5)"
            }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "24px" }}>
                    <div style={{
                        width: "64px",
                        height: "64px",
                        background: registerType === "organization"
                            ? "linear-gradient(135deg, #3b82f6, #2563eb)"
                            : "linear-gradient(135deg, var(--success-500), #059669)",
                        borderRadius: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 16px",
                        color: "white",
                        boxShadow: registerType === "organization"
                            ? "0 10px 15px -3px rgba(59, 130, 246, 0.3)"
                            : "0 10px 15px -3px rgba(16, 185, 129, 0.3)",
                        transition: "all 0.3s ease"
                    }}>
                        {registerType === "organization" ? <Building2 size={32} /> : <UserPlus size={32} />}
                    </div>
                    <h2 style={{
                        margin: "0 0 8px 0",
                        color: "var(--gray-900)",
                        fontSize: "1.75rem",
                        fontWeight: "700",
                        letterSpacing: "-0.025em"
                    }}>
                        Buat Akun Baru
                    </h2>
                    <p style={{
                        color: "var(--gray-500)",
                        margin: 0,
                        fontSize: "0.95rem"
                    }}>
                        {registerType === "organization"
                            ? "Daftarkan organisasi Anda untuk membuat event"
                            : "Bergabunglah dan mulai belajar hari ini!"}
                    </p>
                </div>

                {/* Tab Navigation */}
                <div style={{
                    display: "flex",
                    background: "#f1f5f9",
                    borderRadius: "12px",
                    padding: "4px",
                    marginBottom: "24px"
                }}>
                    <button
                        type="button"
                        onClick={() => handleTypeChange("user")}
                        style={{
                            flex: 1,
                            padding: "12px 16px",
                            border: "none",
                            borderRadius: "10px",
                            background: registerType === "user" ? "white" : "transparent",
                            color: registerType === "user" ? "#1e293b" : "#64748b",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            boxShadow: registerType === "user" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                            transition: "all 0.2s ease"
                        }}
                    >
                        <User size={18} />
                        User Biasa
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTypeChange("organization")}
                        style={{
                            flex: 1,
                            padding: "12px 16px",
                            border: "none",
                            borderRadius: "10px",
                            background: registerType === "organization" ? "white" : "transparent",
                            color: registerType === "organization" ? "#1e293b" : "#64748b",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            boxShadow: registerType === "organization" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                            transition: "all 0.2s ease"
                        }}
                    >
                        <Building2 size={18} />
                        Organisasi
                    </button>
                </div>

                {/* Step Indicator for Organization */}
                {registerType === "organization" && (
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "12px",
                        marginBottom: "24px"
                    }}>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}>
                            <div style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                background: step >= 1 ? "#3b82f6" : "#e2e8f0",
                                color: step >= 1 ? "white" : "#94a3b8",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "600",
                                fontSize: "14px"
                            }}>1</div>
                            <span style={{ fontSize: "0.85rem", color: step === 1 ? "#1e293b" : "#64748b" }}>Data Akun</span>
                        </div>
                        <div style={{
                            width: "40px",
                            height: "2px",
                            background: step >= 2 ? "#3b82f6" : "#e2e8f0"
                        }} />
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}>
                            <div style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                background: step >= 2 ? "#3b82f6" : "#e2e8f0",
                                color: step >= 2 ? "white" : "#94a3b8",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "600",
                                fontSize: "14px"
                            }}>2</div>
                            <span style={{ fontSize: "0.85rem", color: step === 2 ? "#1e293b" : "#64748b" }}>Data Organisasi</span>
                        </div>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={registerType === "organization" && step === 1 ? handleNextStep : handleRegister}
                    style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                    {/* Step 1 - User Data (shown for both types and org step 1) */}
                    {(registerType === "user" || step === 1) && (
                        <>
                            <div>
                                <label className="form-label">Nama Lengkap</label>
                                <div style={{ position: "relative" }}>
                                    <User size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Masukkan nama lengkap"
                                        required
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        style={{ paddingLeft: "40px" }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="form-label">Email</label>
                                <div style={{ position: "relative" }}>
                                    <Mail size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="nama@email.com"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        style={{ paddingLeft: "40px" }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="form-label">Password</label>
                                <div style={{ position: "relative" }}>
                                    <Lock size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
                                    <input
                                        type="password"
                                        className="form-input"
                                        placeholder="Minimal 6 karakter"
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        style={{ paddingLeft: "40px" }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="form-label">No. Telepon <span style={{ color: "#94a3b8", fontWeight: "400" }}>(opsional)</span></label>
                                <div style={{ position: "relative" }}>
                                    <Phone size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
                                    <input
                                        type="tel"
                                        className="form-input"
                                        placeholder="08xxxxxxxxxx"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        style={{ paddingLeft: "40px" }}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Step 2 - Organization Data */}
                    {registerType === "organization" && step === 2 && (
                        <>
                            {/* Organization Info */}
                            <div style={{
                                background: "#eff6ff",
                                borderRadius: "12px",
                                padding: "12px 16px",
                                marginBottom: "4px"
                            }}>
                                <p style={{
                                    fontSize: "0.85rem",
                                    color: "#3b82f6",
                                    fontWeight: "600",
                                    margin: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px"
                                }}>
                                    <Building2 size={16} /> Informasi Organisasi
                                </p>
                            </div>

                            <div>
                                <label className="form-label">Nama Organisasi *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Nama organisasi Anda"
                                    required
                                    value={orgName}
                                    onChange={e => setOrgName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="form-label">Deskripsi Singkat</label>
                                <textarea
                                    className="form-input"
                                    placeholder="Jelaskan tentang organisasi Anda..."
                                    value={orgDescription}
                                    onChange={e => setOrgDescription(e.target.value)}
                                    style={{ minHeight: "80px", resize: "vertical" }}
                                />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label className="form-label">Kategori *</label>
                                    <select
                                        className="form-input"
                                        value={orgCategory}
                                        onChange={e => setOrgCategory(e.target.value)}
                                        required
                                        style={{ cursor: "pointer" }}
                                    >
                                        <option value="">Pilih</option>
                                        <option value="Teknologi">Teknologi</option>
                                        <option value="Bisnis">Bisnis</option>
                                        <option value="Pendidikan">Pendidikan</option>
                                        <option value="Kesehatan">Kesehatan</option>
                                        <option value="Seni & Desain">Seni & Desain</option>
                                        <option value="Lainnya">Lainnya</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">No. Telepon Org</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        placeholder="08xxx"
                                        value={orgPhone}
                                        onChange={e => setOrgPhone(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label className="form-label">Website</label>
                                    <input
                                        type="url"
                                        className="form-input"
                                        placeholder="https://..."
                                        value={orgWebsite}
                                        onChange={e => setOrgWebsite(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Social Media</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="@instagram / link socmed"
                                        value={orgSocialMedia}
                                        onChange={e => setOrgSocialMedia(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Bank Info */}
                            <div style={{
                                background: "#f0fdf4",
                                borderRadius: "12px",
                                padding: "12px 16px",
                                marginTop: "8px",
                                marginBottom: "4px"
                            }}>
                                <p style={{
                                    fontSize: "0.85rem",
                                    color: "#16a34a",
                                    fontWeight: "600",
                                    margin: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px"
                                }}>
                                    <CreditCard size={16} /> Informasi Rekening (untuk pencairan dana)
                                </p>
                            </div>

                            <div>
                                <label className="form-label">Nama Bank</label>
                                <select
                                    className="form-input"
                                    value={bankName}
                                    onChange={e => setBankName(e.target.value)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <option value="">Pilih Bank</option>
                                    <option value="BCA">BCA</option>
                                    <option value="BNI">BNI</option>
                                    <option value="BRI">BRI</option>
                                    <option value="Mandiri">Mandiri</option>
                                    <option value="CIMB Niaga">CIMB Niaga</option>
                                    <option value="DANA">DANA</option>
                                    <option value="OVO">OVO</option>
                                    <option value="GoPay">GoPay</option>
                                </select>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label className="form-label">No. Rekening</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="1234567890"
                                        value={bankAccount}
                                        onChange={e => setBankAccount(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Atas Nama</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Nama pemilik"
                                        value={bankAccountName}
                                        onChange={e => setBankAccountName(e.target.value)}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Buttons */}
                    <div style={{
                        display: "flex",
                        gap: "12px",
                        marginTop: "8px",
                        flexDirection: registerType === "organization" && step === 2 ? "row" : "column"
                    }}>
                        {/* Back Button for Step 2 */}
                        {registerType === "organization" && step === 2 && (
                            <button
                                type="button"
                                onClick={resetToStep1}
                                style={{
                                    flex: 1,
                                    padding: "14px",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "12px",
                                    background: "white",
                                    color: "#64748b",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px"
                                }}
                            >
                                <ArrowLeft size={18} /> Kembali
                            </button>
                        )}

                        {/* Main Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-full"
                            style={{
                                flex: registerType === "organization" && step === 2 ? 2 : 1,
                                padding: "14px",
                                background: loading
                                    ? "var(--gray-400)"
                                    : registerType === "organization"
                                        ? "linear-gradient(135deg, #3b82f6, #2563eb)"
                                        : "linear-gradient(135deg, var(--success-500), #059669)",
                                color: "white",
                                boxShadow: registerType === "organization"
                                    ? "0 4px 6px -1px rgba(59, 130, 246, 0.2)"
                                    : "0 4px 6px -1px rgba(16, 185, 129, 0.2)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px"
                            }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} /> Memproses...
                                </>
                            ) : registerType === "organization" ? (
                                step === 1 ? (
                                    <>Lanjut ke Data Organisasi <ArrowRight size={20} /></>
                                ) : (
                                    <>Daftar & Ajukan Organisasi <ArrowRight size={20} /></>
                                )
                            ) : (
                                <>Daftar Sekarang <ArrowRight size={20} /></>
                            )}
                        </button>
                    </div>
                </form>

                {/* Info for Organization */}
                {registerType === "organization" && (
                    <div style={{
                        marginTop: "16px",
                        padding: "12px 16px",
                        background: "#fef3c7",
                        borderRadius: "10px",
                        fontSize: "0.85rem",
                        color: "#92400e"
                    }}>
                        ⚠️ Setelah mendaftar, Anda bisa langsung login. Fitur organisasi akan aktif setelah diverifikasi admin.
                    </div>
                )}

                {/* Footer */}
                <div style={{ marginTop: "24px", textAlign: "center" }}>
                    <p style={{ fontSize: "0.9rem", color: "var(--gray-500)" }}>
                        Sudah punya akun?{" "}
                        <Link to="/login" style={{ color: "var(--primary-600)", fontWeight: "600" }}>
                            Login disini
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}