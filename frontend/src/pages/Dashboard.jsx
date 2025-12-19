import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function Dashboard() {
    const [events, setEvents] = useState([]);      // Event Published
    const [upcoming, setUpcoming] = useState([]);  // Event Scheduled
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await api.get("/events"); // Panggil API Public
                console.log("Data Home:", res.data); // Debug

                setEvents(res.data.events || []);
                setUpcoming(res.data.upcoming || []);
            } catch (error) {
                console.error("Gagal load events:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    // Helper: Format Tanggal Cantik
    const formatDate = (dateString) => {
        if (!dateString) return "Coming Soon";
        return new Date(dateString).toLocaleDateString("id-ID", {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) return <div style={{ padding: 40, textAlign: "center" }}>⏳ Memuat Event...</div>;

    return (
        <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "1200px", margin: "0 auto" }}>
            
            {/* HERO BANNER (Opsional) */}
            <div style={{ 
                background: "linear-gradient(to right, #3182ce, #63b3ed)", 
                color: "white", padding: "40px", borderRadius: "12px", marginBottom: "40px", textAlign: "center"
            }}>
                <h1 style={{ margin: 0, fontSize: "2.5em" }}>Selamat Datang di Learning Platform</h1>
                <p style={{ fontSize: "1.2em", opacity: 0.9 }}>Tingkatkan skillmu dengan materi terbaik dari para ahli.</p>
            </div>

            {/* SEKSI 1: UPCOMING EVENTS (Jika Ada) */}
            {upcoming.length > 0 && (
                <div style={{ marginBottom: "50px" }}>
                    <h2 style={{ 
                        borderLeft: "5px solid #ed8936", paddingLeft: "15px", color: "#2d3748", 
                        display: "flex", alignItems: "center", gap: "10px"
                    }}>
                        📅 Coming Soon <span style={{fontSize:"0.6em", fontWeight:"normal", color:"#718096"}}>(Segera Hadir)</span>
                    </h2>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "25px" }}>
                        {upcoming.map(evt => (
                            <div key={evt.id} style={{ 
                                border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden", 
                                background: "#fffaf0", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", position: "relative"
                            }}>
                                {/* Badge Scheduled */}
                                <div style={{ 
                                    position: "absolute", top: "10px", right: "10px", 
                                    background: "#ed8936", color: "white", padding: "5px 10px", 
                                    borderRadius: "15px", fontSize: "0.8em", fontWeight: "bold"
                                }}>
                                    🔜 Upcoming
                                </div>

                                {/* Placeholder Gambar */}
                                <div style={{ height: "180px", background: "#cbd5e0", display: "flex", alignItems: "center", justifyContent: "center", color: "#718096" }}>
                                    {evt.thumbnail_url ? (
                                        <img
                                            src={(evt.thumbnail_url || "").startsWith("http") ? evt.thumbnail_url : `http://localhost:8080/${(evt.thumbnail_url || "").replace(/^\/+/, "")}`}
                                            alt={evt.title}
                                            style={{width:"100%", height:"100%", objectFit:"cover"}}
                                        />
                                    ) : (
                                        <span>No Image</span>
                                    )}
                                </div>

                                <div style={{ padding: "20px" }}>
                                    <h3 style={{ margin: "0 0 10px 0", color: "#2c5282" }}>{evt.title}</h3>
                                    <p style={{ color: "#718096", fontSize: "0.9em", margin: "0 0 15px 0" }}>
                                        {evt.description.substring(0, 80)}...
                                    </p>
                                    
                                    <div style={{ background: "white", padding: "10px", borderRadius: "6px", border: "1px dashed #ed8936", fontSize: "0.9em", color: "#c05621", marginBottom: "15px" }}>
                                        ⏰ Tayang: {formatDate(evt.publish_at)}
                                    </div>

                                    <Link to={`/event/${evt.id}`} style={{ 
                                        display: "block", textAlign: "center", background: "white", color: "#ed8936", border: "1px solid #ed8936",
                                        padding: "10px", borderRadius: "6px", textDecoration: "none", fontWeight: "bold", transition: "0.2s"
                                    }}>
                                        Lihat Detail
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SEKSI 2: AVAILABLE NOW */}
            <div>
                <h2 style={{ borderLeft: "5px solid #48bb78", paddingLeft: "15px", color: "#2d3748" }}>
                    🔥 Available Now
                </h2>
                
                {events.length === 0 ? (
                    <p style={{ color: "#718096", fontStyle: "italic" }}>Belum ada event yang aktif saat ini.</p>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "25px" }}>
                        {events.map(evt => (
                            <div key={evt.id} style={{ 
                                border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden", 
                                background: "white", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", transition: "transform 0.2s"
                            }}>
                                {/* Placeholder Gambar */}
                                <div style={{ height: "180px", background: "#cbd5e0", display: "flex", alignItems: "center", justifyContent: "center", color: "#718096" }}>
                                    {evt.thumbnail_url ? (
                                        <img
                                            src={(evt.thumbnail_url || "").startsWith("http") ? evt.thumbnail_url : `http://localhost:8080/${(evt.thumbnail_url || "").replace(/^\/+/, "")}`}
                                            alt={evt.title}
                                            style={{width:"100%", height:"100%", objectFit:"cover"}}
                                        />
                                    ) : (
                                        <span>No Image</span>
                                    )}
                                </div>

                                <div style={{ padding: "20px" }}>
                                    <div style={{display: "flex", justifyContent: "space-between", alignItems: "start"}}>
                                        <h3 style={{ margin: "0 0 10px 0", color: "#2d3748" }}>{evt.title}</h3>
                                        <span style={{background: "#e2e8f0", fontSize:"0.7em", padding:"3px 8px", borderRadius:"10px", color:"#4a5568"}}>
                                            {evt.category}
                                        </span>
                                    </div>
                                    <p style={{ color: "#718096", fontSize: "0.9em", margin: "0 0 20px 0" }}>
                                        {evt.description.substring(0, 100)}...
                                    </p>
                                    <Link to={`/event/${evt.id}`} style={{ 
                                        display: "block", textAlign: "center", background: "#3182ce", color: "black", 
                                        padding: "10px", borderRadius: "6px", textDecoration: "none", fontWeight: "bold"
                                    }}>
                                        Mulai Belajar
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}