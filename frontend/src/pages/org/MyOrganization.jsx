import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";

export default function MyOrganization() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // State untuk Create Event Baru (Modal/Form simple)
    const [showCreate, setShowCreate] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: "", description: "", category: "Teknologi" });

    useEffect(() => {
        fetchMyEvents();
    }, []);

    const fetchMyEvents = async () => {
        try {
            // Panggil API List My Events
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
            await api.post("/organization/events", newEvent);
            alert("Event berhasil dibuat!");
            setShowCreate(false);
            setNewEvent({ title: "", description: "", category: "Teknologi" });
            fetchMyEvents(); // Refresh list
        } catch (error) {
            alert("Gagal buat event: " + (error.response?.data?.error || "Error"));
        }
    };

    return (
        <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto", fontFamily: "sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                <h1>🏢 Dashboard Organisasi</h1>
                <div style={{display:"flex", gap:"10px"}}>
                    <Link to="/" style={{textDecoration:"none", padding:"10px", border:"1px solid #ccc", borderRadius:"5px", color:"black"}}>🏠 Home</Link>
                    <button 
                        onClick={() => setShowCreate(!showCreate)}
                        style={{ background: "#3182ce", color: "white", padding: "10px 20px", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
                    >
                        + Buat Event Baru
                    </button>
                </div>
            </div>

            {/* FORM CREATE EVENT (Muncul jika tombol diklik) */}
            {showCreate && (
                <div style={{ background: "#f7fafc", padding: "20px", borderRadius: "8px", border: "1px solid #cbd5e0", marginBottom: "30px" }}>
                    <h3>Buat Event Baru</h3>
                    <form onSubmit={handleCreateEvent} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <input type="text" placeholder="Judul Event" required 
                            value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                            style={{ padding: "8px" }}
                        />
                        <textarea placeholder="Deskripsi Singkat" required 
                            value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                            style={{ padding: "8px" }}
                        />
                        <select 
                            value={newEvent.category} onChange={e => setNewEvent({...newEvent, category: e.target.value})}
                            style={{ padding: "8px" }}
                        >
                            <option value="Teknologi">Teknologi</option>
                            <option value="Bisnis">Bisnis</option>
                            <option value="Desain">Desain</option>
                            <option value="Lainnya">Lainnya</option>
                        </select>
                        <button type="submit" style={{ background: "#48bb78", color: "white", padding: "10px", border: "none", borderRadius: "5px", cursor: "pointer" }}>Simpan Event</button>
                    </form>
                </div>
            )}

            {/* LIST EVENT SAYA */}
            {loading ? <p>Loading...</p> : (
                <div style={{ display: "grid", gap: "20px" }}>
                    {events.length === 0 && <p>Belum ada event. Silakan buat baru.</p>}
                    
                    {events.map(evt => (
                        <div key={evt.id} style={{ border: "1px solid #e2e8f0", padding: "20px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
                            <div>
                                <h3 style={{ margin: "0 0 5px 0" }}>{evt.title}</h3>
                                <div style={{display:"flex", gap:"10px", alignItems:"center"}}>
                                    <span style={{ background: "#edf2f7", fontSize: "0.8em", padding: "3px 8px", borderRadius: "5px" }}>{evt.category}</span>
                                    <span style={{ 
                                        fontSize: "0.8em", fontWeight: "bold",
                                        color: evt.publish_status === 'PUBLISHED' ? "green" : (evt.publish_status === 'SCHEDULED' ? "orange" : "gray")
                                    }}>
                                        ● {evt.publish_status || "DRAFT"}
                                    </span>
                                </div>
                            </div>
                            <Link to={`/org/event/${evt.id}/manage`} style={{ background: "#2b6cb0", color: "white", textDecoration: "none", padding: "10px 20px", borderRadius: "5px", fontWeight: "bold" }}>
                                ⚙️ Kelola Materi
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}