import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api";
import { getBackendUrl, BACKEND_URL } from "../utils/url";
import QuizTaker from "../components/QuizTaker";
import CertificateViewer from "../components/CertificateViewer";
import SecureVideoPlayer from "../components/SecureVideoPlayer";
import SecureDocumentViewer from "../components/SecureDocumentViewer";
import PurchaseButton from "../components/PurchaseButton";
import {
    AlertCircle, ArrowLeft, BookOpen, Calculator,
    Calendar, CheckCircle2, ChevronDown, ChevronUp,
    Clock, FileText, Lock, PlayCircle, ShieldCheck,
    Unlock, User
} from "lucide-react";
import toast from "react-hot-toast";

export default function EventDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [organization, setOrganization] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedSessionMedia, setSelectedSessionMedia] = useState(null);
    const [activeVideoUrl, setActiveVideoUrl] = useState(null);
    const [expandedMediaId, setExpandedMediaId] = useState(null);
    const [activeDocument, setActiveDocument] = useState(null); // For secure document viewer

    // Quiz & Certificate
    const [quizSessionId, setQuizSessionId] = useState(null);
    const [showCertificate, setShowCertificate] = useState(false);
    const [quizProgress, setQuizProgress] = useState(null);
    const [joiningAffiliate, setJoiningAffiliate] = useState(false);
    const [affiliateStatus, setAffiliateStatus] = useState(null); // null = not checked, 'PENDING', 'APPROVED', 'REJECTED', 'none'

    useEffect(() => {
        fetchEventDetail();
        fetchQuizProgress();
        checkAffiliateStatus();
    }, [id]);

    const fetchEventDetail = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/events/${id}`);
            console.log("Event Data:", response.data); // Debugging

            if (!response.data || !response.data.event) {
                throw new Error("Data event tidak lengkap dari server.");
            }

            setEvent(response.data.event);
            setOrganization(response.data.organization || null);

            // Safety check for sessions
            const sessionData = Array.isArray(response.data.sessions) ? response.data.sessions : [];
            const initialSessions = sessionData.map(s => ({ ...s, isPurchased: false }));
            setSessions(initialSessions);

            const token = localStorage.getItem("token");
            if (token) {
                checkPurchaseStatus(initialSessions);
            }
        } catch (err) {
            console.error("Gagal ambil detail event", err);
            const msg = err.response?.data?.error || err.message || "Terjadi kesalahan saat memuat event.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const fetchQuizProgress = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const res = await api.get(`/user/events/${id}/progress`);
            setQuizProgress(res.data);
        } catch (err) {
            console.error("Gagal ambil progress quiz:", err);
        }
    };

    const checkAffiliateStatus = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setAffiliateStatus('none');
            return;
        }
        try {
            const res = await api.get('/affiliate/partnerships');
            const partnerships = res.data || [];
            const existing = partnerships.find(p => p.event_id == id);
            if (existing) {
                setAffiliateStatus(existing.status);
            } else {
                setAffiliateStatus('none');
            }
        } catch (err) {
            setAffiliateStatus('none');
        }
    };

    const getSessionQuiz = (sessionId) => {
        if (!quizProgress?.progress) return null;
        return quizProgress.progress.find(p => p.session_id === sessionId);
    };

    const checkPurchaseStatus = async (currentSessions) => {
        const updatedSessions = await Promise.all(currentSessions.map(async (s) => {
            try {
                const res = await api.get(`/user/sessions/${s.id}/check-purchase`);
                return { ...s, isPurchased: res.data.has_purchased };
            } catch (error) {
                return s;
            }
        }));
        setSessions(updatedSessions);
    };

    const handleBuy = async (sessionId) => {
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Silakan login untuk membeli tiket.");
            navigate("/login");
            return;
        }

        try {
            await api.post(`/user/buy/${sessionId}`);
            toast.success("Pembelian berhasil! Selamat belajar.");
            fetchEventDetail();
        } catch (error) {
            toast.error("Gagal membeli: " + (error.response?.data?.error || "Terjadi kesalahan"));
        }
    };

    const handleAddToCart = async (sessionId) => {
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Silakan login terlebih dahulu");
            navigate("/login");
            return;
        }
        try {
            await api.post('/user/cart/add', { session_id: sessionId });
            toast.success("Ditambahkan ke keranjang!");
        } catch (error) {
            toast.error(error.response?.data?.error || "Gagal menambahkan ke keranjang");
        }
    };

    // Affiliate form modal
    const [showAffiliateForm, setShowAffiliateForm] = useState(false);
    const [affiliateForm, setAffiliateForm] = useState({
        bank_name: '',
        bank_account: '',
        bank_account_name: '',
        social_media: ''
    });

    // Profile warning modal state
    const [showProfileWarning, setShowProfileWarning] = useState(false);
    const [missingProfileFields, setMissingProfileFields] = useState([]);

    const handleOpenAffiliateForm = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Silakan login terlebih dahulu");
            navigate("/login");
            return;
        }

        // Check profile completeness first
        try {
            const res = await api.get('/user/profile');
            const profile = res.data.user; // API returns {user: ...}
            const missingFields = [];

            if (!profile.name) missingFields.push("Nama");
            if (!profile.phone) missingFields.push("Nomor Telepon");
            if (!profile.address) missingFields.push("Alamat");
            if (!profile.gender) missingFields.push("Jenis Kelamin");
            if (!profile.birthdate) missingFields.push("Tanggal Lahir");

            if (missingFields.length > 0) {
                setMissingProfileFields(missingFields);
                setShowProfileWarning(true);
                return;
            }

            setShowAffiliateForm(true);
        } catch (error) {
            toast.error("Gagal memuat profil");
        }
    };

    const handleSubmitAffiliate = async (e) => {
        e.preventDefault();
        if (!affiliateForm.bank_name || !affiliateForm.bank_account || !affiliateForm.bank_account_name || !affiliateForm.social_media) {
            toast.error("Lengkapi semua data");
            return;
        }
        setJoiningAffiliate(true);
        try {
            await api.post(`/affiliate/join/${id}`, affiliateForm);
            toast.success("Permintaan affiliate terkirim! Menunggu persetujuan organisasi.");
            setShowAffiliateForm(false);
            setAffiliateForm({ bank_name: '', bank_account: '', bank_account_name: '', social_media: '' });
            checkAffiliateStatus(); // Refresh status
        } catch (error) {
            const errData = error.response?.data;
            if (errData?.profile_incomplete) {
                toast.error("Lengkapi profil Anda terlebih dahulu");
                setShowAffiliateForm(false);
                navigate("/dashboard/profile");
            } else {
                toast.error(errData?.error || "Gagal join affiliate");
            }
        } finally {
            setJoiningAffiliate(false);
        }
    };

    const handleOpenMaterial = async (sessionID) => {
        try {
            const res = await api.get(`/user/sessions/${sessionID}/media`);
            const safeData = {
                session_id: res.data?.session_id ?? sessionID,
                videos: Array.isArray(res.data?.videos) ? res.data.videos : [],
                files: Array.isArray(res.data?.files) ? res.data.files : [],
            };
            setSelectedSessionMedia(safeData);
            setActiveVideoUrl(null);
            setExpandedMediaId(null);
            document.getElementById("learning-area")?.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error("Gagal membuka materi:", error);
            toast.error("Gagal membuka materi: " + (error.response?.data?.error || "Error"));
        }
    };

    const toggleMedia = (id) => {
        setExpandedMediaId(expandedMediaId === id ? null : id);
    };

    const handlePlayVideo = async (videoUrl) => {
        if (!videoUrl) return toast.error("URL video tidak valid!");
        try {
            const filename = videoUrl.split(/[/\\]/).pop();
            const res = await api.get(`/user/sessions/signed-video/${filename}`);
            const fullUrl = getBackendUrl(res.data.url);
            setActiveVideoUrl(fullUrl);
        } catch (error) {
            toast.error("Gagal memuat video! Pastikan sesi valid.");
        }
    };

    const handleOpenFile = async (fileUrl, fileTitle) => {
        if (!fileUrl) return toast.error("URL file tidak valid!");
        try {
            const filename = fileUrl.split(/[/\\]/).pop();
            const res = await api.get(`/user/sessions/signed-file/${filename}`);
            const fullUrl = getBackendUrl(res.data.url);
            setActiveDocument({ url: fullUrl, title: fileTitle || filename });
        } catch (error) {
            toast.error("Gagal memuat file!");
        }
    };

    // Loading State
    if (loading) {
        return (
            <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "60vh",
                color: "#64748b"
            }}>
                <div className="animate-spin" style={{
                    width: "48px",
                    height: "48px",
                    border: "4px solid #e2e8f0",
                    borderTopColor: "#3b82f6",
                    borderRadius: "50%",
                    marginBottom: "16px"
                }}></div>
                <p style={{ fontWeight: 500 }}>Memuat detail event...</p>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "60vh",
                textAlign: "center",
                padding: "20px"
            }}>
                <div style={{
                    width: "80px",
                    height: "80px",
                    background: "#fee2e2",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "20px",
                    color: "#ef4444"
                }}>
                    <AlertCircle size={40} />
                </div>
                <h2 style={{ fontSize: "1.5rem", color: "#1e293b", marginBottom: "8px" }}>Gagal Memuat Event</h2>
                <p style={{ color: "#64748b", marginBottom: "24px", maxWidth: "400px" }}>{error}</p>
                <Link to="/" className="btn btn-primary">
                    <ArrowLeft size={18} /> Kembali ke Beranda
                </Link>
            </div>
        );
    }

    if (!event) return null;

    return (
        <div style={{
            padding: "32px 24px",
            maxWidth: "1280px",
            margin: "0 auto",
            minHeight: "100vh"
        }}>
            {/* Breadcrumb / Back */}
            <Link to="/" style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "#64748b",
                marginBottom: "24px",
                fontSize: "0.9rem"
            }}>
                <ArrowLeft size={16} /> Kembali ke Daftar Event
            </Link>

            {/* Hero Section */}
            <div style={{
                background: "white",
                borderRadius: "24px",
                padding: "40px",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                border: "1px solid #e2e8f0",
                marginBottom: "32px",
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "40px",
                alignItems: "center"
            }}>
                <div>
                    <div style={{
                        display: "flex",
                        gap: "10px",
                        marginBottom: "16px"
                    }}>
                        <span className="badge badge-primary">
                            {event.category || "Edukasi"}
                        </span>
                        {event.publish_status === 'SCHEDULED' && (
                            <span className="badge badge-warning">
                                <Calendar size={12} style={{ marginRight: 4 }} />
                                Tayang: {new Date(event.publish_at).toLocaleDateString()}
                            </span>
                        )}
                    </div>

                    <h1 style={{
                        fontSize: "2.5rem",
                        fontWeight: "800",
                        color: "#1e293b",
                        marginBottom: "16px",
                        lineHeight: "1.2"
                    }}>
                        {event.title}
                    </h1>

                    <p style={{
                        fontSize: "1.1rem",
                        color: "#475569",
                        lineHeight: "1.6",
                        maxWidth: "800px"
                    }}>
                        {event.description}
                    </p>

                    <div style={{ marginTop: "24px", display: "flex", gap: "24px", color: "#64748b", fontSize: "0.95rem", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <User size={18} /> {event.instructor_name || "Instruktur Ahli"}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <BookOpen size={18} /> {sessions.length} Sesi Materi
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <ShieldCheck size={18} /> Sertifikat Kompetensi
                        </div>
                    </div>

                    {/* Organization Info - YouTube Style */}
                    {organization && organization.id > 0 && (
                        <Link
                            to={`/organization/${organization.id}`}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "10px",
                                marginTop: "20px",
                                textDecoration: "none",
                                padding: "6px 12px 6px 6px",
                                borderRadius: "24px",
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#f1f5f9";
                                e.currentTarget.style.borderColor = "#cbd5e1";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#f8fafc";
                                e.currentTarget.style.borderColor = "#e2e8f0";
                            }}
                        >
                            <img
                                src={organization.logo_url
                                    ? getBackendUrl(organization.logo_url)
                                    : "https://ui-avatars.com/api/?name=" + encodeURIComponent(organization.name) + "&background=3b82f6&color=fff&size=40"
                                }
                                alt={organization.name}
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    objectFit: "cover"
                                }}
                            />
                            <span style={{
                                fontSize: "0.9rem",
                                fontWeight: "500",
                                color: "#1e293b"
                            }}>
                                {organization.name}
                            </span>
                        </Link>
                    )}

                    {/* Join Affiliate Button */}
                    {localStorage.getItem("token") && organization && !organization.is_official && affiliateStatus === 'none' && (
                        <button
                            onClick={handleOpenAffiliateForm}
                            disabled={joiningAffiliate}
                            style={{
                                marginTop: "16px",
                                padding: "10px 20px",
                                background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                                border: "none",
                                borderRadius: "10px",
                                color: "white",
                                fontWeight: "600",
                                cursor: joiningAffiliate ? "not-allowed" : "pointer",
                                opacity: joiningAffiliate ? 0.7 : 1,
                                display: "flex",
                                alignItems: "center",
                                gap: "8px"
                            }}
                        >
                            🤝 {joiningAffiliate ? "Mengirim..." : "Gabung Affiliate"}
                        </button>
                    )}

                    {/* Already Registered as Affiliate */}
                    {localStorage.getItem("token") && affiliateStatus && affiliateStatus !== 'none' && (
                        <div style={{
                            marginTop: "16px",
                            padding: "10px 16px",
                            background: affiliateStatus === 'APPROVED' ? '#dcfce7' : affiliateStatus === 'PENDING' ? '#fef3c7' : '#fee2e2',
                            border: `1px solid ${affiliateStatus === 'APPROVED' ? '#86efac' : affiliateStatus === 'PENDING' ? '#fcd34d' : '#fca5a5'}`,
                            borderRadius: "10px",
                            color: affiliateStatus === 'APPROVED' ? '#166534' : affiliateStatus === 'PENDING' ? '#92400e' : '#991b1b',
                            fontWeight: "500",
                            fontSize: "0.9rem"
                        }}>
                            {affiliateStatus === 'APPROVED' && '✅ Anda sudah terdaftar sebagai affiliate'}
                            {affiliateStatus === 'PENDING' && '⏳ Permintaan affiliate Anda sedang diproses'}
                            {affiliateStatus === 'REJECTED' && '❌ Permintaan affiliate Anda ditolak'}
                        </div>
                    )}
                </div>
            </div>

            {/* Progress Section (Logged In) */}
            {localStorage.getItem("token") && quizProgress?.has_quizzes && (
                <div style={{
                    padding: '24px',
                    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                    border: '1px solid #bfdbfe',
                    borderRadius: '16px',
                    marginBottom: '32px',
                    color: '#1e40af'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ background: "white", padding: "10px", borderRadius: "10px" }}>
                                <Calculator size={24} color="#2563eb" />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Progress Sertifikat</h3>
                                <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem' }}>
                                    Minimal skor {quizProgress.min_score_required || 80}% untuk lulus
                                </p>
                            </div>
                        </div>
                        {quizProgress.total_percent >= (quizProgress.min_score_required || 80) ? (
                            <button
                                onClick={() => setShowCertificate(true)}
                                className="btn btn-primary"
                                style={{ background: "#10b981", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)" }}
                            >
                                🎓 Klaim Sertifikat
                            </button>
                        ) : (
                            <div style={{ fontWeight: "700", fontSize: "1.25rem" }}>
                                {(quizProgress.total_percent || 0).toFixed(0)}%
                            </div>
                        )}
                    </div>
                    <div style={{
                        height: '8px',
                        background: 'rgba(255,255,255,0.6)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        border: "1px solid rgba(255,255,255,0.8)"
                    }}>
                        <div style={{
                            width: `${Math.min(100, quizProgress.total_percent || 0)}%`,
                            height: '100%',
                            background: quizProgress.total_percent >= (quizProgress.min_score_required || 80) ? '#10b981' : '#3b82f6',
                            transition: 'width 0.5s ease',
                            borderRadius: "4px"
                        }} />
                    </div>
                </div>
            )}

            {/* Main Content Grid */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) 400px",
                gap: "32px",
                alignItems: "start",
                width: "100%",
                maxWidth: "1280px",
                margin: "0 auto"
            }}>
                {/* Left Column: Learning Area & Sessions */}
                <div style={{ width: "100%", overflow: "hidden" }}>
                    {/* Learning Area */}
                    <div id="learning-area" style={{ marginBottom: "32px", width: "100%" }}>
                        <h3 style={{ margin: "0 0 16px 0", fontSize: "1.25rem", color: "#1e293b" }}>
                            📺 Area Belajar
                        </h3>
                        <div style={{
                            background: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: "16px",
                            padding: "24px",
                            width: "100%",
                            height: "600px",
                            minHeight: "600px",
                            overflowY: "auto",
                            display: "flex",
                            flexDirection: "column",
                            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)",
                            boxSizing: "border-box"
                        }}>
                            {!selectedSessionMedia ? (
                                <div style={{
                                    textAlign: "center",
                                    padding: "40px",
                                    color: "#94a3b8",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: "100%",
                                    gap: "16px"
                                }}>
                                    <div style={{
                                        width: "64px", height: "64px",
                                        borderRadius: "50%", background: "#f1f5f9",
                                        display: "flex", alignItems: "center", justifyContent: "center"
                                    }}>
                                        <PlayCircle size={32} />
                                    </div>
                                    <p>Pilih sesi di sebelah kanan untuk mulai belajar.</p>
                                </div>
                            ) : (
                                <div>
                                    {/* Videos */}
                                    {selectedSessionMedia?.videos?.length > 0 && (
                                        <div style={{ marginBottom: "24px" }}>
                                            <h4 style={{ fontSize: "1rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                                                <PlayCircle size={18} className="text-primary" /> Video Materi
                                            </h4>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                                {selectedSessionMedia.videos.map((vid) => (
                                                    <div key={vid.id} style={{
                                                        border: "1px solid #e2e8f0",
                                                        borderRadius: "10px",
                                                        overflow: "hidden"
                                                    }}>
                                                        <div
                                                            onClick={() => toggleMedia(vid.id)}
                                                            style={{
                                                                padding: "12px 16px",
                                                                cursor: "pointer",
                                                                background: "#f8fafc",
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                                fontWeight: "500"
                                                            }}
                                                        >
                                                            <span>{vid.title || "Video Pembelajaran"}</span>
                                                            {expandedMediaId === vid.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                        </div>
                                                        {expandedMediaId === vid.id && (
                                                            <div style={{ padding: "16px", background: "white", borderTop: "1px solid #e2e8f0" }}>
                                                                <p style={{ fontSize: "0.9rem", color: "#64748b", marginBottom: "12px" }}>
                                                                    {vid.description || "Tidak ada deskripsi untuk video ini."}
                                                                </p>
                                                                <button
                                                                    onClick={() => handlePlayVideo(vid.video_url)}
                                                                    className="btn btn-primary"
                                                                    style={{ fontSize: "0.85rem", padding: "8px 16px" }}
                                                                >
                                                                    <PlayCircle size={16} /> Putar Video
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Files */}
                                    {selectedSessionMedia?.files?.length > 0 && (
                                        <div>
                                            <h4 style={{ fontSize: "1rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                                                <FileText size={18} className="text-warning" /> Modul Dokumen
                                            </h4>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                                {selectedSessionMedia.files.map((f) => (
                                                    <div key={f.id} style={{
                                                        border: "1px solid #e2e8f0",
                                                        borderRadius: "10px",
                                                        overflow: "hidden"
                                                    }}>
                                                        <div
                                                            onClick={() => toggleMedia("file-" + f.id)}
                                                            style={{
                                                                padding: "12px 16px",
                                                                cursor: "pointer",
                                                                background: "#fffbeb",
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                                fontWeight: "500",
                                                                color: "#92400e"
                                                            }}
                                                        >
                                                            <span>{f.title || "Dokumen Materi"}</span>
                                                            {expandedMediaId === ("file-" + f.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                        </div>
                                                        {expandedMediaId === ("file-" + f.id) && (
                                                            <div style={{ padding: "16px", background: "white", borderTop: "1px solid #fef3c7" }}>
                                                                <button
                                                                    onClick={() => handleOpenFile(f.file_url, f.title)}
                                                                    className="btn"
                                                                    style={{
                                                                        fontSize: "0.85rem",
                                                                        padding: "8px 16px",
                                                                        background: "#f59e0b",
                                                                        color: "white"
                                                                    }}
                                                                >
                                                                    <FileText size={16} /> Buka Dokumen
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Session List */}
                <div style={{ position: "sticky", top: "20px" }}>
                    <h3 style={{ margin: "0 0 16px 0", fontSize: "1.25rem", color: "#1e293b" }}>
                        📑 Daftar Sesi
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {sessions.map((s, index) => (
                            <div key={s.id} style={{
                                background: "white",
                                border: s.isPurchased ? "2px solid #22c55e" : "1px solid #e2e8f0",
                                borderRadius: "16px",
                                padding: "20px",
                                transition: "all 0.2s ease",
                                boxShadow: s.isPurchased ? "0 4px 12px rgba(34, 197, 94, 0.1)" : "0 2px 4px rgba(0,0,0,0.05)"
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <span style={{
                                        fontWeight: "700",
                                        color: "#94a3b8",
                                        fontSize: "0.8rem",
                                        textTransform: "uppercase",
                                        letterSpacing: "1px"
                                    }}>
                                        Sesi {index + 1}
                                    </span>
                                    {s.isPurchased ?
                                        <CheckCircle2 size={18} color="#22c55e" /> :
                                        <Lock size={18} color="#94a3b8" />
                                    }
                                </div>

                                <h4 style={{ margin: "0 0 8px 0", fontSize: "1.1rem", color: "#1e293b" }}>
                                    {s.title}
                                </h4>

                                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "0.9rem", marginBottom: "16px" }}>
                                    <Clock size={14} /> {s.duration || "60 Menit"}
                                    {s.price > 0 && (
                                        <span style={{ marginLeft: "auto", fontWeight: "700", color: "#0f172a" }}>
                                            Rp {s.price.toLocaleString()}
                                        </span>
                                    )}
                                </div>

                                {s.isPurchased ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        <button
                                            onClick={() => handleOpenMaterial(s.id)}
                                            className="btn btn-primary btn-full"
                                            style={{ background: "#22c55e", border: "none" }}
                                        >
                                            <Unlock size={16} /> Buka Materi
                                        </button>

                                        {/* Quiz Button */}
                                        {localStorage.getItem("token") && (() => {
                                            const sessionQuiz = getSessionQuiz(s.id);
                                            if (!sessionQuiz) return null;
                                            return (
                                                <button
                                                    onClick={() => setQuizSessionId(s.id)}
                                                    className="btn btn-secondary btn-full"
                                                    style={{
                                                        fontSize: "0.85rem",
                                                        background: sessionQuiz.completed ? "#f0fdf4" : "white",
                                                        borderColor: sessionQuiz.completed ? "#86efac" : "#e2e8f0"
                                                    }}
                                                >
                                                    {sessionQuiz.completed ? (
                                                        <span style={{ color: "#16a34a" }}>✅ Kuis Selesai ({sessionQuiz.score}%)</span>
                                                    ) : "📝 Kerjakan Kuis"}
                                                </button>
                                            );
                                        })()}
                                    </div>
                                ) : (
                                    event.publish_status === 'SCHEDULED' ? (
                                        <button className="btn btn-secondary btn-full" disabled>
                                            🔒 Belum Tersedia
                                        </button>
                                    ) : s.price === 0 || s.price === null ? (
                                        <button
                                            onClick={() => handleBuy(s.id)}
                                            className="btn btn-primary btn-full"
                                        >
                                            Gratis - Daftar
                                        </button>
                                    ) : (
                                        <>
                                            <PurchaseButton
                                                sessionId={s.id}
                                                sessionName={s.title}
                                                price={s.price}
                                                onSuccess={() => fetchEventDetail()}
                                                className="btn btn-primary btn-full"
                                            />
                                            {/* Add to Cart button */}
                                            <button
                                                onClick={() => handleAddToCart(s.id)}
                                                style={{
                                                    marginTop: "8px",
                                                    padding: "10px",
                                                    background: "transparent",
                                                    border: "1px solid #e2e8f0",
                                                    borderRadius: "8px",
                                                    color: "#64748b",
                                                    cursor: "pointer",
                                                    width: "100%",
                                                    fontSize: "0.85rem"
                                                }}
                                            >
                                                🛒 Tambah ke Keranjang
                                            </button>
                                        </>
                                    )
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {/* Video Player Modal - Same style as SecureDocumentViewer */}
            {activeVideoUrl && (
                <div
                    className="animate-fade-in"
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.95)",
                        backdropFilter: "blur(10px)",
                        zIndex: 9999,
                        display: "flex",
                        flexDirection: "column"
                    }}
                >
                    {/* Header */}
                    <div style={{
                        width: "100%",
                        padding: "16px 24px",
                        background: "rgba(255, 255, 255, 0.05)",
                        borderBottom: "1px solid rgba(255,255,255,0.1)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        boxSizing: "border-box"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ fontSize: "1.5rem" }}>🎬</span>
                            <div>
                                <h3 style={{ margin: 0, color: "white", fontSize: "1.1rem", fontWeight: "600", letterSpacing: "-0.025em" }}>
                                    Video Pembelajaran
                                </h3>
                                <span style={{
                                    fontSize: "0.75rem",
                                    color: "rgba(255,255,255,0.6)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em"
                                }}>
                                    MP4 &bull; Secure Streaming
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => setActiveVideoUrl(null)}
                            className="btn"
                            style={{
                                background: "rgba(255,255,255,0.1)",
                                border: "1px solid rgba(255,255,255,0.2)",
                                color: "white",
                                padding: "8px 16px",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontWeight: "600",
                                fontSize: "0.9rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                                e.currentTarget.style.transform = "translateY(-1px)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                                e.currentTarget.style.transform = "translateY(0)";
                            }}
                        >
                            ✕ Tutup
                        </button>
                    </div>

                    {/* Video Container */}
                    <div style={{
                        flex: 1,
                        width: "100%",
                        maxWidth: "1000px",
                        margin: "0 auto",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px",
                        boxSizing: "border-box"
                    }}>
                        <div style={{
                            width: "100%",
                            background: "#000",
                            borderRadius: "12px",
                            overflow: "hidden",
                            boxShadow: "0 0 100px rgba(0,0,0,0.5)"
                        }}>
                            <SecureVideoPlayer src={activeVideoUrl} autoPlay={true} />
                        </div>
                    </div>

                    {/* Footer - Security Notice */}
                    <div style={{
                        padding: "12px 24px",
                        background: "rgba(0, 0, 0, 0.4)",
                        borderTop: "1px solid rgba(255,255,255,0.05)",
                        width: "100%",
                        textAlign: "center",
                        boxSizing: "border-box",
                        backdropFilter: "blur(5px)"
                    }}>
                        <p style={{
                            margin: 0,
                            color: "#94a3b8",
                            fontSize: "0.85rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px"
                        }}>
                            🔒 Video ini dilindungi dengan standar keamanan tinggi.
                        </p>
                    </div>
                </div>
            )}

            {quizSessionId && (
                <QuizTaker
                    sessionId={quizSessionId}
                    onClose={() => setQuizSessionId(null)}
                    onComplete={() => { setQuizSessionId(null); fetchQuizProgress(); }}
                />
            )}
            {showCertificate && (
                <CertificateViewer
                    eventId={id}
                    onClose={() => setShowCertificate(false)}
                />
            )}
            {activeDocument && (
                <SecureDocumentViewer
                    src={activeDocument.url}
                    title={activeDocument.title}
                    onClose={() => setActiveDocument(null)}
                />
            )}

            {/* Affiliate Join Form Modal */}
            {showAffiliateForm && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0,0,0,0.7)", display: "flex",
                    alignItems: "center", justifyContent: "center", zIndex: 9999
                }}>
                    <div style={{
                        background: "white", borderRadius: "16px", padding: "32px",
                        width: "100%", maxWidth: "450px", color: "#1e293b"
                    }}>
                        <h3 style={{ margin: "0 0 8px 0", fontSize: "1.3rem" }}>🤝 Gabung Affiliate</h3>
                        <p style={{ color: "#64748b", marginBottom: "20px" }}>
                            Isi data berikut untuk bergabung sebagai affiliate
                        </p>
                        <form onSubmit={handleSubmitAffiliate}>
                            <div style={{ marginBottom: "16px" }}>
                                <label style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}>Nama Bank *</label>
                                <select
                                    value={affiliateForm.bank_name}
                                    onChange={(e) => setAffiliateForm({ ...affiliateForm, bank_name: e.target.value })}
                                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                                    required
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
                                    <option value="ShopeePay">ShopeePay</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: "16px" }}>
                                <label style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}>Nomor Rekening *</label>
                                <input
                                    type="text"
                                    value={affiliateForm.bank_account}
                                    onChange={(e) => setAffiliateForm({ ...affiliateForm, bank_account: e.target.value })}
                                    placeholder="Contoh: 1234567890"
                                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: "16px" }}>
                                <label style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}>Atas Nama *</label>
                                <input
                                    type="text"
                                    value={affiliateForm.bank_account_name}
                                    onChange={(e) => setAffiliateForm({ ...affiliateForm, bank_account_name: e.target.value })}
                                    placeholder="Nama pemilik rekening"
                                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: "24px" }}>
                                <label style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}>Media Sosial *</label>
                                <input
                                    type="text"
                                    value={affiliateForm.social_media}
                                    onChange={(e) => setAffiliateForm({ ...affiliateForm, social_media: e.target.value })}
                                    placeholder="Instagram/TikTok/YouTube"
                                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                                    required
                                />
                            </div>
                            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                                <button
                                    type="button"
                                    onClick={() => setShowAffiliateForm(false)}
                                    style={{ padding: "12px 24px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "white", cursor: "pointer" }}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={joiningAffiliate}
                                    style={{
                                        padding: "12px 24px", borderRadius: "8px", border: "none",
                                        background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                                        color: "white", fontWeight: "600", cursor: "pointer"
                                    }}
                                >
                                    {joiningAffiliate ? "Mengirim..." : "Kirim Permintaan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Profile Warning Modal */}
            {showProfileWarning && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0,0,0,0.7)", display: "flex",
                    alignItems: "center", justifyContent: "center", zIndex: 9999
                }}>
                    <div style={{
                        background: "white", borderRadius: "16px", padding: "32px",
                        width: "100%", maxWidth: "420px", color: "#1e293b", textAlign: "center"
                    }}>
                        <div style={{
                            width: "64px", height: "64px", borderRadius: "50%",
                            background: "#fef3c7", display: "flex", alignItems: "center",
                            justifyContent: "center", margin: "0 auto 20px", fontSize: "32px"
                        }}>
                            ⚠️
                        </div>
                        <h3 style={{ margin: "0 0 12px 0", fontSize: "1.3rem" }}>
                            Profil Belum Lengkap
                        </h3>
                        <p style={{ color: "#64748b", marginBottom: "16px", lineHeight: "1.6" }}>
                            Untuk menjadi affiliate, Anda harus melengkapi data profil berikut:
                        </p>
                        <div style={{
                            background: "#fef2f2", border: "1px solid #fecaca",
                            borderRadius: "8px", padding: "12px", marginBottom: "24px"
                        }}>
                            <ul style={{
                                margin: 0, padding: "0 0 0 20px", textAlign: "left",
                                color: "#991b1b", fontSize: "0.95rem"
                            }}>
                                {missingProfileFields.map((field, idx) => (
                                    <li key={idx}>{field}</li>
                                ))}
                            </ul>
                        </div>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                            <button
                                onClick={() => setShowProfileWarning(false)}
                                style={{
                                    padding: "12px 24px", borderRadius: "8px",
                                    border: "1px solid #e2e8f0", background: "white",
                                    cursor: "pointer", fontWeight: "500"
                                }}
                            >
                                Batalkan
                            </button>
                            <button
                                onClick={() => {
                                    setShowProfileWarning(false);
                                    navigate("/dashboard/profile");
                                }}
                                style={{
                                    padding: "12px 24px", borderRadius: "8px", border: "none",
                                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                                    color: "white", fontWeight: "600", cursor: "pointer"
                                }}
                            >
                                Lengkapi Profil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}