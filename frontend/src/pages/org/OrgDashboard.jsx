import { useEffect, useState } from "react";
import api from "../../api";
import { Link } from "react-router-dom";

export default function OrgDashboard() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyEvents();
    }, []);

    const fetchMyEvents = async () => {
        try {
            const res = await api.get("/organization/events");
            setEvents(res.data.events || []);
        } catch (error) {
            console.error("Gagal load event:", error);
            // Jika error 403, berarti user belum jadi Organization
            if (error.response?.status === 403) {
                alert("Anda belum terdaftar sebagai Organisasi!");
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{padding: 20}}>Loading Dashboard...</div>;

    return (
        <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                <h1>🎓 Dashboard Creator</h1>
                <Link to="/org/create-event">
                    <button style={{ background: "#3182ce", color: "white", padding: "12px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold" }}>
                        + Buat Event Baru
                    </button>
                </Link>
            </div>

            {events.length === 0 ? (
                <div style={{ textAlign: "center", color: "#888", marginTop: "50px" }}>
                    <p>Belum ada event. Yuk mulai buat event pertamamu!</p>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
                    {events.map((ev) => (
                        <div key={ev.id} style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden", background: "white", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
                            <div style={{ padding: "20px" }}>
                                <h3 style={{ margin: "0 0 10px 0", color: "#2d3748" }}>{ev.title}</h3>
                                <span style={{ background: "#edf2f7", padding: "4px 10px", borderRadius: "15px", fontSize: "0.8em", color: "#4a5568" }}>
                                    {ev.category}
                                </span>
                                <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                                    <Link to={`/org/event/${ev.id}/manage`} style={{ flex: 1 }}>
                                        <button style={{ width: "100%", background: "#2c5282", color: "white", padding: "10px", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                                            ⚙️ Kelola Materi
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}