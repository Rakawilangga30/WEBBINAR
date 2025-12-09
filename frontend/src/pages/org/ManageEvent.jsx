import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api";

export default function ManageEvent() {
    const { eventID } = useParams();
    const [event, setEvent] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [uploadingSesiId, setUploadingSesiId] = useState(null); // ID sesi yang sedang upload

    useEffect(() => {
        loadData();
    }, [eventID]);

    const loadData = async () => {
        try {
            // Ambil detail event
            const resEvent = await api.get(`/events/${eventID}`);
            setEvent(resEvent.data.event);
            setSessions(resEvent.data.sessions);
        } catch (error) {
            alert("Gagal load data event");
        }
    };

    const handleUploadVideo = async (sessionID, fileInput) => {
        const file = fileInput.files[0];
        if (!file) return alert("Pilih file video dulu!");

        const formData = new FormData();
        formData.append("video", file);
        formData.append("title", file.name);

        setUploadingSesiId(sessionID); // Set loading state
        try {
            await api.post(`/organization/sessions/${sessionID}/videos`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            alert("✅ Upload Berhasil!");
            fileInput.value = ""; // Reset input
        } catch (error) {
            console.error(error);
            alert("❌ Gagal Upload: " + (error.response?.data?.error || "Error"));
        } finally {
            setUploadingSesiId(null); // Matikan loading state
        }
    };

    if (!event) return <div style={{padding: 20}}>Loading Event Data...</div>;

    return (
        <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto", fontFamily: "sans-serif" }}>
            <div style={{ marginBottom: "30px", borderBottom: "1px solid #ccc", paddingBottom: "20px" }}>
                <h1 style={{ margin: "0 0 10px 0" }}>⚙️ Kelola: {event.title}</h1>
                <p style={{ color: "#666" }}>Upload materi video dan PDF untuk sesi event ini.</p>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {sessions.map(s => (
                    <div key={s.id} style={{ 
                        border: "1px solid #cbd5e0", borderRadius: "8px", padding: "20px",
                        background: "#f7fafc"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                            <h3 style={{ margin: 0 }}>📂 {s.title}</h3>
                            <span style={{ fontSize: "0.9em", color: "#718096" }}>ID: {s.id}</span>
                        </div>
                        
                        <div style={{ background: "white", padding: "15px", borderRadius: "6px", border: "1px dashed #a0aec0" }}>
                            <h4 style={{ marginTop: 0, marginBottom: "10px" }}>📤 Upload Video</h4>
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
                                    {uploadingSesiId === s.id ? "⏳ Sedang Upload..." : "Start Upload"}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}