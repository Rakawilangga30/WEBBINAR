import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api";

export default function ManageEvent() {
    const { eventID } = useParams();
    const [event, setEvent] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [uploadingSesiId, setUploadingSesiId] = useState(null);

    // State untuk Form Tambah Sesi
    const [newSession, setNewSession] = useState({ title: "", description: "", price: 0 });
    const [isCreatingSession, setIsCreatingSession] = useState(false);

    useEffect(() => {
        loadData();
    }, [eventID]);

    const loadData = async () => {
        try {
            const resEvent = await api.get(`/events/${eventID}`);
            setEvent(resEvent.data.event);
            setSessions(resEvent.data.sessions);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreateSession = async (e) => {
        e.preventDefault();
        setIsCreatingSession(true);
        try {
            await api.post(`/organization/events/${eventID}/sessions`, newSession);
            alert("✅ Sesi Berhasil Ditambahkan!");
            setNewSession({ title: "", description: "", price: 0 }); // Reset form
            loadData(); // Refresh list sesi
        } catch (error) {
            alert("Gagal buat sesi: " + (error.response?.data?.error || "Error"));
        } finally {
            setIsCreatingSession(false);
        }
    };

    const handleUploadVideo = async (sessionID, fileInput) => {
        const file = fileInput.files[0];
        if (!file) return alert("Pilih file video dulu!");

        const formData = new FormData();
        formData.append("video", file);
        formData.append("title", file.name);

        setUploadingSesiId(sessionID);
        try {
            await api.post(`/organization/sessions/${sessionID}/videos`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            alert("✅ Upload Video Berhasil!");
            fileInput.value = ""; 
        } catch (error) {
            console.error(error);
            alert("❌ Gagal Upload: " + (error.response?.data?.error || "Error"));
        } finally {
            setUploadingSesiId(null);
        }
    };

    if (!event) return <div style={{padding: 20}}>Loading...</div>;

    return (
        <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto", fontFamily: "sans-serif" }}>
            
            {/* Header Event */}
            <div style={{ marginBottom: "30px", borderBottom: "1px solid #ccc", paddingBottom: "20px" }}>
                <h1 style={{ margin: "0 0 10px 0" }}>⚙️ Kelola: {event.title}</h1>
                <p style={{ color: "#666" }}>{event.description}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "40px" }}>
                
                {/* KIRI: Form Tambah Sesi */}
                <div style={{ background: "#f0fff4", padding: "20px", borderRadius: "8px", height: "fit-content", border: "1px solid #c6f6d5" }}>
                    <h3 style={{ marginTop: 0, color: "#276749" }}>➕ Tambah Sesi Baru</h3>
                    <form onSubmit={handleCreateSession} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <input 
                            type="text" placeholder="Judul Sesi (misal: Intro)" required
                            value={newSession.title}
                            onChange={e => setNewSession({...newSession, title: e.target.value})}
                            style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                        />
                        <textarea 
                            placeholder="Deskripsi singkat..."
                            value={newSession.description}
                            onChange={e => setNewSession({...newSession, description: e.target.value})}
                            style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                        />
                        <input 
                            type="number" placeholder="Harga (0 = Gratis)"
                            value={newSession.price}
                            onChange={e => setNewSession({...newSession, price: parseInt(e.target.value)})}
                            style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                        />
                        <button 
                            type="submit" 
                            disabled={isCreatingSession}
                            style={{ background: "#38a169", color: "white", padding: "10px", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
                        >
                            {isCreatingSession ? "Menyimpan..." : "Simpan Sesi"}
                        </button>
                    </form>
                </div>

                {/* KANAN: Daftar Sesi & Upload */}
                <div>
                    <h2 style={{ marginTop: 0 }}>Daftar Sesi</h2>
                    {sessions.length === 0 && <p style={{color:"#888"}}>Belum ada sesi. Silakan tambah sesi di sebelah kiri.</p>}
                    
                    {sessions.map(s => (
                        <div key={s.id} style={{ 
                            border: "1px solid #cbd5e0", borderRadius: "8px", padding: "20px", marginBottom: "20px",
                            background: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                                <div>
                                    <h3 style={{ margin: 0 }}>📂 {s.title}</h3>
                                    <small style={{ color: "#718096" }}>Harga: Rp {s.price}</small>
                                </div>
                                <span style={{ background: "#edf2f7", padding: "5px 10px", borderRadius: "10px", fontSize: "0.8em" }}>ID: {s.id}</span>
                            </div>
                            
                            {/* Area Upload */}
                            <div style={{ background: "#f7fafc", padding: "15px", borderRadius: "6px", border: "1px dashed #a0aec0" }}>
                                <h4 style={{ marginTop: 0, marginBottom: "10px", fontSize: "0.9em", color: "#4a5568" }}>📤 Upload Video Materi</h4>
                                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                    <input type="file" accept="video/mp4,video/mkv" id={`file-${s.id}`} style={{ flex: 1 }} />
                                    <button 
                                        onClick={() => handleUploadVideo(s.id, document.getElementById(`file-${s.id}`))}
                                        disabled={uploadingSesiId === s.id}
                                        style={{ 
                                            background: uploadingSesiId === s.id ? "#cbd5e0" : "#2b6cb0", 
                                            color: "white", padding: "8px 20px", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold"
                                        }}
                                    >
                                        {uploadingSesiId === s.id ? "⏳ Uploading..." : "Upload"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}