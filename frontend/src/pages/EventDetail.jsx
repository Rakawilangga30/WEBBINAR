import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api";
import QuizTaker from "../components/QuizTaker";
import CertificateViewer from "../components/CertificateViewer";
import SecureVideoPlayer from "../components/SecureVideoPlayer";
import PurchaseButton from "../components/PurchaseButton";

export default function EventDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [sessions, setSessions] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedSessionMedia, setSelectedSessionMedia] = useState(null);
    const [activeVideoUrl, setActiveVideoUrl] = useState(null);
    const [expandedMediaId, setExpandedMediaId] = useState(null);

    // Quiz & Certificate
    const [quizSessionId, setQuizSessionId] = useState(null);
    const [showCertificate, setShowCertificate] = useState(false);
    const [quizProgress, setQuizProgress] = useState(null);

    useEffect(() => {
        fetchEventDetail();
        fetchQuizProgress();
    }, [id]);

    const fetchEventDetail = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/events/${id}`);
            setEvent(response.data.event);

            const initialSessions = response.data.sessions.map(s => ({ ...s, isPurchased: false }));
            setSessions(initialSessions);

            const token = localStorage.getItem("token");
            if (token) {
                checkPurchaseStatus(initialSessions);
            }
        } catch (err) {
            console.error("Gagal ambil detail event", err);
            if (err.response && err.response.status === 404) {
                setError("Event tidak ditemukan atau belum dipublikasikan.");
            } else {
                setError("Terjadi kesalahan saat memuat event.");
            }
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
            alert("Anda harus login terlebih dahulu untuk membeli tiket.");
            navigate("/login");
            return;
        }

        try {
            await api.post(`/user/buy/${sessionId}`);
            alert("Pembelian berhasil!");
            fetchEventDetail();
        } catch (error) {
            alert("Gagal membeli: " + (error.response?.data?.error || "Terjadi kesalahan"));
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
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error("Gagal membuka materi:", error);
            alert("Gagal membuka materi: " + (error.response?.data?.error || "Error"));
        }
    };

    const toggleMedia = (id) => {
        if (expandedMediaId === id) setExpandedMediaId(null);
        else setExpandedMediaId(id);
    };

    const handlePlayVideo = async (videoUrl) => {
        if (!videoUrl) return alert("URL video tidak valid!");
        try {
            const filename = videoUrl.split(/[/\\]/).pop();
            const res = await api.get(`/user/sessions/signed-video/${filename}`);
            const fullUrl = `http://localhost:8080${res.data.url}`;
            setActiveVideoUrl(fullUrl);
            setTimeout(() => {
                document.getElementById("video-player-area")?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        } catch (error) {
            alert("Gagal memuat video! Pastikan Anda sudah login.");
        }
    };

    const handleOpenFile = async (fileUrl) => {
        if (!fileUrl) return alert("URL file tidak valid!");
        try {
            const filename = fileUrl.split(/[/\\]/).pop();
            const res = await api.get(`/user/sessions/signed-file/${filename}`);
            const fullUrl = `http://localhost:8080${res.data.url}`;
            window.open(fullUrl, '_blank');
        } catch (error) {
            alert("Gagal memuat file!");
        }
    };

    // Loading State
    if (loading) {
        return (
            <div style={{
                padding: "60px",
                textAlign: "center",
                color: "#64748b"
            }}>
                <div style={{
                    width: "40px",
                    height: "40px",
                    border: "3px solid #e2e8f0",
                    borderTopColor: "#3b82f6",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 16px"
                }}></div>
                Memuat Event...
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div style={{
                padding: "60px",
                textAlign: "center",
                maxWidth: "500px",
                margin: "40px auto"
            }}>
                <div style={{
                    width: "80px",
                    height: "80px",
                    background: "#fef2f2",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                    fontSize: "2rem"
                }}>
                    ⚠️
                </div>
                <h2 style={{ color: "#dc2626", marginBottom: "12px" }}>{error}</h2>
                <Link to="/" style={{
                    display: "inline-block",
                    padding: "12px 24px",
                    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                    color: "white",
                    textDecoration: "none",
                    borderRadius: "8px",
                    fontWeight: "600"
                }}>
                    ← Kembali ke Home
                </Link>
            </div>
        );
    }

    if (!event) return null;

    return (
        <div style={{
            padding: "24px",
            maxWidth: "1200px",
            margin: "0 auto",
            minHeight: "100vh"
        }}>

            {/* Event Header */}
            <div style={{
                background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)",
                padding: "32px",
                borderRadius: "16px",
                color: "white",
                marginBottom: "32px",
                position: "relative",
                overflow: "hidden"
            }}>
                <div style={{
                    position: "absolute",
                    top: "-50%",
                    right: "-5%",
                    width: "200px",
                    height: "200px",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "50%"
                }}></div>

                <div style={{ position: "relative", zIndex: 1 }}>
                    <h1 style={{ margin: "0 0 12px 0", fontSize: "1.75rem" }}>{event.title}</h1>
                    <p style={{ margin: "0 0 16px 0", opacity: 0.9, maxWidth: "700px" }}>
                        {event.description}
                    </p>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <span style={{
                            background: "rgba(255,255,255,0.2)",
                            padding: "6px 16px",
                            borderRadius: "20px",
                            fontSize: "0.9rem",
                            fontWeight: "500"
                        }}>
                            {event.category}
                        </span>
                        {event.publish_status === 'SCHEDULED' && (
                            <span style={{
                                background: "#fbbf24",
                                color: "#78350f",
                                padding: "6px 16px",
                                borderRadius: "20px",
                                fontSize: "0.9rem",
                                fontWeight: "600"
                            }}>
                                📅 Upcoming - Tayang: {new Date(event.publish_at).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Progress & Certificate Summary */}
            {localStorage.getItem("token") && quizProgress?.has_quizzes && (
                <div style={{
                    padding: '20px',
                    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                    borderRadius: '12px',
                    color: 'white',
                    marginBottom: '24px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                            <h3 style={{ margin: '0 0 4px 0' }}>📊 Progress Sertifikat</h3>
                            <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem' }}>
                                Selesaikan semua kuis untuk mendapatkan sertifikat
                            </p>
                        </div>
                        {quizProgress.total_percent >= (quizProgress.min_score_required || 80) && (
                            <button
                                onClick={() => setShowCertificate(true)}
                                style={{
                                    padding: '10px 20px',
                                    background: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                🎓 Lihat Sertifikat
                            </button>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                            <span>Skor Total</span>
                            <span style={{ fontWeight: 'bold' }}>{(quizProgress.total_percent || 0).toFixed(1)}%</span>
                        </div>
                        <div style={{ height: '12px', background: 'rgba(255,255,255,0.2)', borderRadius: '6px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${Math.min(100, quizProgress.total_percent || 0)}%`,
                                height: '100%',
                                background: quizProgress.total_percent >= (quizProgress.min_score_required || 80) ? '#10b981' : quizProgress.total_percent > 50 ? '#f59e0b' : '#ef4444',
                                transition: 'width 0.5s, background 0.3s'
                            }} />
                        </div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '4px' }}>
                            Minimal {quizProgress.min_score_required || 80}% untuk mendapatkan sertifikat
                        </div>
                    </div>

                    {/* Status Message */}
                    <div style={{
                        padding: '12px',
                        background: quizProgress.total_percent >= (quizProgress.min_score_required || 80) ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        textAlign: 'center'
                    }}>
                        {quizProgress.total_percent >= (quizProgress.min_score_required || 80) ? (
                            <span>🎉 Selamat! Anda telah lulus dan mendapatkan sertifikat!</span>
                        ) : quizProgress.progress?.every(p => p.completed) ? (
                            <span>📚 Skor Anda belum mencukupi. Coba kuis lagi untuk meningkatkan skor.</span>
                        ) : (
                            <span>📝 Selesaikan semua kuis untuk melihat skor total Anda.</span>
                        )}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "350px 1fr",
                gap: "24px",
                alignItems: "start"
            }}>

                {/* Left: Session List */}
                <div>
                    <h3 style={{
                        margin: "0 0 16px 0",
                        color: "#1e293b",
                        fontSize: "1.1rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}>
                        📑 Daftar Sesi
                    </h3>

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {sessions.map((s) => (
                            <div key={s.id} style={{
                                background: s.isPurchased ? "#f0fdf4" : "white",
                                border: s.isPurchased ? "2px solid #86efac" : "1px solid #e2e8f0",
                                padding: "20px",
                                borderRadius: "12px",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                            }}>
                                <h4 style={{ margin: "0 0 8px 0", color: "#1e293b", fontSize: "1rem" }}>
                                    {s.title}
                                </h4>
                                <p style={{ margin: "0 0 16px 0", color: "#64748b", fontSize: "0.9rem" }}>
                                    Harga: <strong style={{ color: "#1e293b" }}>Rp {s.price?.toLocaleString()}</strong>
                                </p>

                                {s.isPurchased ? (
                                    <button
                                        onClick={() => handleOpenMaterial(s.id)}
                                        style={{
                                            width: "100%",
                                            background: "linear-gradient(135deg, #22c55e, #16a34a)",
                                            color: "white",
                                            padding: "12px",
                                            border: "none",
                                            borderRadius: "8px",
                                            cursor: "pointer",
                                            fontWeight: "600",
                                            fontSize: "0.9rem"
                                        }}
                                    >
                                        📂 Buka Materi
                                    </button>
                                ) : (
                                    event.publish_status === 'SCHEDULED' ? (
                                        <button
                                            disabled
                                            style={{
                                                width: "100%",
                                                background: "#e2e8f0",
                                                color: "#94a3b8",
                                                padding: "12px",
                                                border: "none",
                                                borderRadius: "8px",
                                                cursor: "not-allowed",
                                                fontWeight: "600",
                                                fontSize: "0.9rem"
                                            }}
                                        >
                                            🔒 Belum Dibuka
                                        </button>
                                    ) : s.price === 0 || s.price === null ? (
                                        /* FREE session - direct enrollment without payment */
                                        <button
                                            onClick={() => handleBuy(s.id)}
                                            style={{
                                                width: "100%",
                                                background: "linear-gradient(135deg, #10b981, #059669)",
                                                color: "white",
                                                padding: "12px",
                                                border: "none",
                                                borderRadius: "8px",
                                                cursor: "pointer",
                                                fontWeight: "600",
                                                fontSize: "0.9rem"
                                            }}
                                        >
                                            🎁 GRATIS - Daftar Sekarang
                                        </button>
                                    ) : (
                                        <PurchaseButton
                                            sessionId={s.id}
                                            sessionName={s.title}
                                            price={s.price}
                                            onSuccess={() => fetchEventDetail()}
                                            className="full-width"
                                        />
                                    )
                                )}

                                {/* Quiz Button - Show in session if purchased and has quiz */}
                                {s.isPurchased && localStorage.getItem("token") && (() => {
                                    const sessionQuiz = getSessionQuiz(s.id);
                                    if (!sessionQuiz) return null;
                                    return (
                                        <div style={{
                                            marginTop: '12px',
                                            padding: '12px',
                                            background: sessionQuiz.completed ? '#f0fdf4' : '#eff6ff',
                                            border: sessionQuiz.completed ? '1px solid #86efac' : '1px solid #93c5fd',
                                            borderRadius: '8px'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontWeight: '500', fontSize: '0.9rem', color: '#1e293b' }}>
                                                        📝 Kuis Sesi
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                        Bobot: {sessionQuiz.weight?.toFixed(1)}%
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {sessionQuiz.completed && (
                                                        <span style={{
                                                            padding: '4px 10px',
                                                            borderRadius: '16px',
                                                            background: sessionQuiz.passed ? '#10b981' : '#f59e0b',
                                                            color: 'white',
                                                            fontSize: '0.8rem',
                                                            fontWeight: '500'
                                                        }}>
                                                            {sessionQuiz.score?.toFixed(0)}%
                                                        </span>
                                                    )}
                                                    <button
                                                        onClick={() => setQuizSessionId(s.id)}
                                                        style={{
                                                            padding: '6px 14px',
                                                            background: sessionQuiz.completed
                                                                ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                                                                : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontWeight: '500',
                                                            fontSize: '0.8rem'
                                                        }}
                                                    >
                                                        {sessionQuiz.completed ? '🔄 Ulang Kuis' : '📝 Mulai Kuis'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Learning Area */}
                <div style={{
                    background: "white",
                    border: "1px solid #e2e8f0",
                    padding: "24px",
                    borderRadius: "12px",
                    minHeight: "500px",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)"
                }}>
                    <h3 style={{
                        margin: "0 0 20px 0",
                        paddingBottom: "12px",
                        borderBottom: "2px solid #e2e8f0",
                        color: "#1e293b",
                        fontSize: "1.1rem"
                    }}>
                        📖 Area Belajar
                    </h3>

                    {!selectedSessionMedia ? (
                        <div style={{
                            textAlign: "center",
                            padding: "60px 20px",
                            color: "#64748b"
                        }}>
                            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>👈</div>
                            <p style={{ margin: 0 }}>
                                Silakan klik tombol <strong>"Buka Materi"</strong> pada sesi di sebelah kiri.
                            </p>
                        </div>
                    ) : (
                        <div>
                            {/* Video Player */}
                            {activeVideoUrl && (
                                <div id="video-player-area" style={{
                                    marginBottom: "24px",
                                    background: "#000",
                                    borderRadius: "12px",
                                    overflow: "hidden"
                                }}>
                                    <SecureVideoPlayer src={activeVideoUrl} autoPlay={true} />
                                </div>
                            )}

                            {/* Video List */}
                            <h4 style={{ margin: "0 0 12px 0", color: "#1d4ed8", display: "flex", alignItems: "center", gap: "8px" }}>
                                📺 Video Pembelajaran
                            </h4>
                            {(selectedSessionMedia?.videos?.length || 0) === 0 ? (
                                <p style={{ color: "#94a3b8", fontStyle: "italic", marginBottom: "24px" }}>Tidak ada video.</p>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
                                    {selectedSessionMedia?.videos?.map((vid) => (
                                        <div key={vid.id} style={{
                                            border: "1px solid #e2e8f0",
                                            borderRadius: "8px",
                                            overflow: "hidden"
                                        }}>
                                            <div
                                                onClick={() => toggleMedia(vid.id)}
                                                style={{
                                                    padding: "12px 16px",
                                                    cursor: "pointer",
                                                    fontWeight: "500",
                                                    background: "#f8fafc",
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center"
                                                }}
                                            >
                                                <span>🎥 {vid.title || vid.video_url || 'Untitled video'}</span>
                                                <span>{expandedMediaId === vid.id ? "🔼" : "🔽"}</span>
                                            </div>
                                            {expandedMediaId === vid.id && (
                                                <div style={{ padding: "16px", borderTop: "1px solid #e2e8f0", background: "white" }}>
                                                    <p style={{ margin: "0 0 12px 0", color: "#64748b", fontSize: "0.9rem" }}>
                                                        {vid.description || 'Tidak ada deskripsi.'}
                                                    </p>
                                                    <button
                                                        onClick={() => handlePlayVideo(vid.video_url)}
                                                        style={{
                                                            background: "linear-gradient(135deg, #ef4444, #dc2626)",
                                                            color: "white",
                                                            border: "none",
                                                            padding: "8px 16px",
                                                            borderRadius: "6px",
                                                            cursor: "pointer",
                                                            fontWeight: "600",
                                                            fontSize: "0.85rem"
                                                        }}
                                                    >
                                                        ▶️ Putar Video
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* File List */}
                            <h4 style={{ margin: "0 0 12px 0", color: "#ea580c", display: "flex", alignItems: "center", gap: "8px" }}>
                                📄 Modul Dokumen
                            </h4>
                            {(selectedSessionMedia?.files?.length || 0) === 0 ? (
                                <p style={{ color: "#94a3b8", fontStyle: "italic" }}>Tidak ada file.</p>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    {selectedSessionMedia?.files?.map((f) => (
                                        <div key={f.id} style={{
                                            border: "1px solid #e2e8f0",
                                            borderRadius: "8px",
                                            overflow: "hidden"
                                        }}>
                                            <div
                                                onClick={() => toggleMedia("file-" + f.id)}
                                                style={{
                                                    padding: "12px 16px",
                                                    cursor: "pointer",
                                                    fontWeight: "500",
                                                    background: "#fffbeb",
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center"
                                                }}
                                            >
                                                <span>📑 {f.title || f.file_url || 'Untitled file'}</span>
                                                <span>{(expandedMediaId === ("file-" + f.id)) ? "🔼" : "🔽"}</span>
                                            </div>
                                            {(expandedMediaId === ("file-" + f.id)) && (
                                                <div style={{ padding: "16px", borderTop: "1px solid #e2e8f0", background: "white" }}>
                                                    <p style={{ margin: "0 0 12px 0", color: "#64748b", fontSize: "0.9rem" }}>
                                                        {f.description || 'Tidak ada deskripsi.'}
                                                    </p>
                                                    <button
                                                        onClick={() => handleOpenFile(f.file_url)}
                                                        style={{
                                                            background: "linear-gradient(135deg, #f59e0b, #d97706)",
                                                            color: "white",
                                                            border: "none",
                                                            padding: "8px 16px",
                                                            borderRadius: "6px",
                                                            cursor: "pointer",
                                                            fontWeight: "600",
                                                            fontSize: "0.85rem"
                                                        }}
                                                    >
                                                        📄 Buka File
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Quiz Taker Modal */}
            {quizSessionId && (
                <QuizTaker
                    sessionId={quizSessionId}
                    onClose={() => setQuizSessionId(null)}
                    onComplete={() => { setQuizSessionId(null); fetchQuizProgress(); }}
                />
            )}

            {/* Certificate Viewer Modal */}
            {showCertificate && (
                <CertificateViewer
                    eventId={id}
                    onClose={() => setShowCertificate(false)}
                />
            )}
        </div>
    );
}