import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom"; // Pastikan Link diimport
import api from "../api";

export default function EventDetail() {
    const { id } = useParams(); 
    const [event, setEvent] = useState(null);
    const [sessions, setSessions] = useState([]);
    
    // State Loading & Error
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // <--- State Error Baru

    // State Media Player
    const [selectedSessionMedia, setSelectedSessionMedia] = useState(null); 
    const [activeVideoUrl, setActiveVideoUrl] = useState(null); 
    const [expandedMediaId, setExpandedMediaId] = useState(null);

    useEffect(() => {
        fetchEventDetail();
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
            // Tangkap error 404
            if (err.response && err.response.status === 404) {
                setError("Event tidak ditemukan atau belum dipublikasikan.");
            } else {
                setError("Terjadi kesalahan saat memuat event.");
            }
        } finally {
            setLoading(false); // <--- PENTING: Matikan loading apa pun yang terjadi
        }
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

    // ... (Sisa fungsi handleBuy, handleOpenMaterial, dll SAMA SEPERTI SEBELUMNYA) ...
    // Copy ulang fungsi-fungsi tersebut dari kode sebelumnya jika perlu, 
    // atau biarkan kode di bawah ini jika Anda mau yang bersih:

    const handleBuy = async (sessionID) => {
        if (!confirm("Yakin mau beli sesi ini?")) return;
        try {
            await api.post(`/user/buy/${sessionID}`);
            alert("Pembelian Berhasil!");
            fetchEventDetail(); 
        } catch (error) {
            alert("Gagal membeli: " + (error.response?.data?.error || "Error"));
        }
    };

    const handleOpenMaterial = async (sessionID) => {
        try {
            const res = await api.get(`/user/sessions/${sessionID}/media`);
            setSelectedSessionMedia(res.data);
            setActiveVideoUrl(null); 
            setExpandedMediaId(null); 
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
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

    // --- TAMPILAN JIKA LOADING / ERROR ---
    if (loading) return <div style={{padding: "50px", textAlign: "center"}}>⏳ Memuat Event...</div>;
    
    if (error) return (
        <div style={{padding: "50px", textAlign: "center", color: "red"}}>
            <h2>⚠️ {error}</h2>
            <Link to="/dashboard" style={{color: "blue", textDecoration: "underline"}}>Kembali ke Dashboard</Link>
        </div>
    );

    if (!event) return null;

    return (
        <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "1200px", margin: "0 auto" }}>
            
            {/* Header Event */}
            <div style={{ marginBottom: "30px", borderBottom: "2px solid #ddd", paddingBottom: "20px" }}>
                <h1 style={{ marginBottom: "10px" }}>{event.title}</h1>
                <p style={{ color: "#555", fontSize: "1.1em" }}>{event.description}</p>
                <div style={{display: "flex", gap: "10px", alignItems: "center"}}>
                     <span style={{ background: "#eee", padding: "5px 15px", borderRadius: "20px", fontSize: "0.9em", fontWeight: "bold" }}>
                        {event.category}
                    </span>
                    {/* Badge jika ini Scheduled */}
                    {event.publish_status === 'SCHEDULED' && (
                        <span style={{ background: "#feebc8", color:"#744210", padding: "5px 15px", borderRadius: "20px", fontSize: "0.9em", fontWeight: "bold" }}>
                            📅 Upcoming (Tayang: {new Date(event.publish_at).toLocaleDateString()})
                        </span>
                    )}
                </div>
            </div>

            <div style={{ display: "flex", gap: "30px", flexDirection: "row", flexWrap: "wrap" }}>
                
                {/* KIRI: Daftar Sesi */}
                <div style={{ flex: 1, minWidth: "300px" }}>
                    <h2 style={{ borderBottom: "1px solid #ccc", paddingBottom: "10px" }}>Daftar Sesi</h2>
                    {sessions.map((s) => (
                        <div key={s.id} style={{ 
                            border: "1px solid #ccc", padding: "20px", marginBottom: "15px", borderRadius: "8px",
                            background: s.isPurchased ? "#f0fff4" : "white",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                        }}>
                            <h3 style={{ marginTop: 0 }}>{s.title}</h3>
                            <p style={{ color: "#666" }}>Harga: <strong>Rp {s.price.toLocaleString()}</strong></p>
                            
                            {s.isPurchased ? (
                                <button 
                                    onClick={() => handleOpenMaterial(s.id)}
                                    style={{ width: "100%", background: "#38a169", color: "white", padding: "10px", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
                                >
                                    📂 Buka Materi
                                </button>
                            ) : (
                                <button 
                                    onClick={() => handleBuy(s.id)}
                                    // Disable tombol beli jika event belum rilis (Scheduled)
                                    disabled={event.publish_status === 'SCHEDULED'}
                                    style={{ 
                                        width: "100%", 
                                        background: event.publish_status === 'SCHEDULED' ? "#ccc" : "#3182ce", 
                                        cursor: event.publish_status === 'SCHEDULED' ? "not-allowed" : "pointer",
                                        color: "white", padding: "10px", border: "none", borderRadius: "5px", fontWeight: "bold" 
                                    }}
                                >
                                    {event.publish_status === 'SCHEDULED' ? "Belum Dibuka" : "🛒 Beli Sesi Ini"}
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* KANAN: Area Belajar */}
                <div style={{ flex: 2, minWidth: "300px", border: "1px solid #ddd", padding: "25px", borderRadius: "8px", background: "#fafafa", minHeight: "500px" }}>
                    <h2 style={{ marginTop: 0, borderBottom: "1px solid #ccc", paddingBottom: "10px" }}>Area Belajar</h2>
                    
                    {!selectedSessionMedia ? (
                        <div style={{ textAlign: "center", padding: "50px", color: "#888" }}>
                            <p>👈 Silakan klik tombol <strong>"Buka Materi"</strong> pada sesi di sebelah kiri.</p>
                        </div>
                    ) : (
                        <div>
                            {/* PLAYER VIDEO */}
                            {activeVideoUrl && (
                                <div id="video-player-area" style={{ marginBottom: "30px", background: "black", borderRadius: "8px", overflow: "hidden" }}>
                                    <video controls width="100%" height="400px" src={activeVideoUrl} autoPlay />
                                </div>
                            )}

                            {/* LIST VIDEO */}
                            <h3 style={{ marginTop: 0, color: "#2b6cb0" }}>📺 Video Pembelajaran</h3>
                            {selectedSessionMedia.videos.length === 0 ? <p style={{color:"#888"}}>Tidak ada video.</p> : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "30px" }}>
                                    {selectedSessionMedia.videos.map((vid) => (
                                        <div key={vid.id} style={{border:"1px solid #ddd", borderRadius:"5px", background:"white"}}>
                                            <div onClick={() => toggleMedia(vid.id)} style={{padding:"10px", cursor:"pointer", fontWeight:"bold", background:"#f7fafc"}}>
                                                🎥 {vid.title} {expandedMediaId === vid.id ? "🔼" : "🔽"}
                                            </div>
                                            {expandedMediaId === vid.id && (
                                                <div style={{padding:"10px", borderTop:"1px solid #eee"}}>
                                                    <p>{vid.description}</p>
                                                    <button onClick={() => handlePlayVideo(vid.video_url)} style={{background:"#e53e3e", color:"white", border:"none", padding:"5px 10px", borderRadius:"3px", cursor:"pointer"}}>▶️ Putar</button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* LIST FILE */}
                            <h3 style={{ color: "#c05621" }}>📄 Modul Dokumen</h3>
                            {selectedSessionMedia.files.length === 0 ? <p style={{color:"#888"}}>Tidak ada file.</p> : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    {selectedSessionMedia.files.map((f) => (
                                        <div key={f.id} style={{border:"1px solid #ddd", borderRadius:"5px", background:"white"}}>
                                            <div onClick={() => toggleMedia(`file-${f.id}`)} style={{padding:"10px", cursor:"pointer", fontWeight:"bold", background:"#fffaf0"}}>
                                                📑 {f.title} {expandedMediaId === `file-${f.id}` ? "🔼" : "🔽"}
                                            </div>
                                            {expandedMediaId === `file-${f.id}` && (
                                                <div style={{padding:"10px", borderTop:"1px solid #eee"}}>
                                                    <p>{f.description}</p>
                                                    <button onClick={() => handleOpenFile(f.file_url)} style={{background:"#dd6b20", color:"white", border:"none", padding:"5px 10px", borderRadius:"3px", cursor:"pointer"}}>📄 Buka</button>
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
        </div>
    );
}