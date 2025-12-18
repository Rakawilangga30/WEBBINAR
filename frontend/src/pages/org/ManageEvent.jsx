import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api";

// --- KOMPONEN MODAL VISIBILITAS (Mirip YouTube) ---
const VisibilityModal = ({ isOpen, onClose, onSave, initialStatus, initialDate, type, title }) => {
    if (!isOpen) return null;

    const [status, setStatus] = useState(initialStatus || 'DRAFT');
    const [scheduleDate, setScheduleDate] = useState(initialDate || '');
    const [loading, setLoading] = useState(false);

    // Reset state saat modal dibuka
    useEffect(() => {
        setStatus(initialStatus || 'DRAFT');
        // Format tanggal jika ada (contoh: 2023-12-31T10:00)
        setScheduleDate(initialDate ? new Date(initialDate).toISOString().slice(0, 16) : '');
    }, [isOpen, initialStatus, initialDate]);

    const handleSave = async () => {
        setLoading(true);
        // Validasi jadwal
        if (status === 'SCHEDULED' && !scheduleDate) {
            alert("Silakan pilih tanggal dan jam penayangan!");
            setLoading(false);
            return;
        }
        await onSave(status, scheduleDate);
        setLoading(false);
        onClose();
    };

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
        }}>
            <div style={{ background: "white", padding: "25px", borderRadius: "8px", width: "400px", maxWidth: "90%", boxShadow: "0 4px 15px rgba(0,0,0,0.2)" }}>
                <h3 style={{ marginTop: 0, marginBottom: "15px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
                    👁️ Visibilitas: {type}
                </h3>
                <p style={{marginBottom: "20px", color: "#666", fontSize: "0.9em"}}>
                    Mengatur status tayang untuk <strong>"{title}"</strong>.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                    
                    {/* OPSI 1: DRAFT */}
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", border: "1px solid #ddd", borderRadius: "5px", cursor: "pointer", background: status === 'DRAFT' ? "#f7fafc" : "white" }}>
                        <input type="radio" name="visibility" value="DRAFT" checked={status === 'DRAFT'} onChange={() => setStatus('DRAFT')} />
                        <div>
                            <div style={{ fontWeight: "bold" }}>🔒 Private (Draft)</div>
                            <small style={{ color: "#777" }}>Hanya Anda yang bisa melihat.</small>
                        </div>
                    </label>

                    {/* OPSI 2: PUBLIC */}
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", border: "1px solid #ddd", borderRadius: "5px", cursor: "pointer", background: status === 'PUBLISHED' ? "#f0fff4" : "white" }}>
                        <input type="radio" name="visibility" value="PUBLISHED" checked={status === 'PUBLISHED'} onChange={() => setStatus('PUBLISHED')} />
                        <div>
                            <div style={{ fontWeight: "bold" }}>🌍 Public (Tayang)</div>
                            <small style={{ color: "#777" }}>Dapat dilihat oleh semua orang sekarang.</small>
                        </div>
                    </label>

                    {/* OPSI 3: SCHEDULED */}
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", border: "1px solid #ddd", borderRadius: "5px", cursor: "pointer", background: status === 'SCHEDULED' ? "#fffaf0" : "white" }}>
                        <input type="radio" name="visibility" value="SCHEDULED" checked={status === 'SCHEDULED'} onChange={() => setStatus('SCHEDULED')} />
                        <div>
                            <div style={{ fontWeight: "bold" }}>📅 Jadwalkan</div>
                            <small style={{ color: "#777" }}>Tayang otomatis pada tanggal tertentu.</small>
                        </div>
                    </label>

                    {/* INPUT TANGGAL (Muncul jika Scheduled dipilih) */}
                    {status === 'SCHEDULED' && (
                        <div style={{ marginLeft: "30px", marginTop: "-5px" }}>
                            <input 
                                type="datetime-local" 
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                                style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc", width: "100%", boxSizing: "border-box" }}
                            />
                        </div>
                    )}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <button onClick={onClose} style={{ padding: "8px 15px", border: "none", background: "#edf2f7", borderRadius: "4px", cursor: "pointer" }}>Batal</button>
                    <button 
                        onClick={handleSave} 
                        disabled={loading}
                        style={{ padding: "8px 20px", border: "none", background: "#3182ce", color: "white", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
                    >
                        {loading ? "Menyimpan..." : "Simpan"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
export default function ManageEvent() {
    const { eventID } = useParams();
    const [event, setEvent] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // State Modal Visibilitas
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: '', id: null, title: '', currentStatus: '', currentDate: null });

    // State Form Tambah Sesi
    const [newSession, setNewSession] = useState({ title: "", description: "", price: 0 });
    const [isCreatingSession, setIsCreatingSession] = useState(false);

    // State Upload
    const [uploadingId, setUploadingId] = useState(null); 
    const [videoTitles, setVideoTitles] = useState({});
    const [fileTitles, setFileTitles] = useState({});

    useEffect(() => {
        loadData();
    }, [eventID]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/organization/events/${eventID}`);
            console.log("Data Event:", res.data);
            setEvent(res.data.event);
            setSessions(res.data.sessions || []);
        } catch (err) {
            console.error("Gagal load event:", err);
            setError("Gagal memuat event. Pastikan Anda pemilik event ini.");
        } finally {
            setLoading(false);
        }
    };

    // --- BUKA MODAL VISIBILITAS ---
    const openVisibilityModal = (type, item) => {
        setModalConfig({
            isOpen: true,
            type: type, // 'Event' atau 'Sesi'
            id: item.id,
            title: item.title,
            currentStatus: item.publish_status,
            currentDate: item.publish_at
        });
    };

    // --- SIMPAN VISIBILITAS (Dipanggil dari Modal) ---
    const handleSaveVisibility = async (status, date) => {
        const { type, id } = modalConfig;
        
        try {
            let endpoint = "";
            let method = "PUT";
            let payload = {};

            // Tentukan Endpoint berdasarkan Tipe & Status
            if (type === 'Event') {
                if (status === 'PUBLISHED') endpoint = `/organization/events/${id}/publish`;
                else if (status === 'DRAFT') endpoint = `/organization/events/${id}/unpublish`;
                else {
                    endpoint = `/organization/events/${id}/schedule`;
                    payload = { publish_at: new Date(date).toISOString() }; // Format ISO untuk Go
                }
            } else { // Session
                if (status === 'PUBLISHED') endpoint = `/organization/sessions/${id}/publish`;
                else if (status === 'DRAFT') endpoint = `/organization/sessions/${id}/unpublish`;
                else {
                    endpoint = `/organization/sessions/${id}/schedule`;
                    payload = { publish_at: new Date(date).toISOString() };
                }
            }

            // Eksekusi API
            // Jika payload kosong (publish/unpublish), axios otomatis kirim body kosong
            const res = await api.put(endpoint, payload);

            // Update State Lokal agar UI berubah tanpa refresh
            if (type === 'Event') {
                setEvent(prev => ({ ...prev, publish_status: res.data.status, publish_at: res.data.publish_at }));
            } else {
                setSessions(prevSessions => prevSessions.map(s => 
                    s.id === id ? { ...s, publish_status: res.data.status, publish_at: res.data.publish_at } : s
                ));
            }

            alert("Status berhasil diperbarui!");

        } catch (error) {
            console.error(error);
            alert("Gagal update status: " + (error.response?.data?.error || error.message));
        }
    };

    // --- FUNGSI CREATE SESSION ---
    const handleCreateSession = async (e) => {
        e.preventDefault();
        setIsCreatingSession(true);
        try {
            await api.post(`/organization/events/${eventID}/sessions`, newSession);
            alert("✅ Sesi Berhasil Ditambahkan!");
            setNewSession({ title: "", description: "", price: 0 });
            loadData();
        } catch (error) {
            alert("Gagal buat sesi: " + (error.response?.data?.error || "Error"));
        } finally {
            setIsCreatingSession(false);
        }
    };

    // --- FUNGSI UPLOAD ---
    const handleUpload = async (type, sessionID, fileInput) => {
        const file = fileInput.files[0];
        if (!file) return alert(`Pilih file ${type} dulu!`);

        const titles = type === 'video' ? videoTitles : fileTitles;
        const setTitles = type === 'video' ? setVideoTitles : setFileTitles;
        const endpointType = type === 'video' ? 'videos' : 'files';

        const meta = titles[sessionID] || {};
        const customTitle = meta.title || file.name;
        const customDesc = meta.description || "";

        const formData = new FormData();
        formData.append(type === 'video' ? 'video' : 'file', file);
        formData.append("title", customTitle);
        formData.append("description", customDesc);

        setUploadingId(`${type}-${sessionID}`);
        try {
            await api.post(`/organization/sessions/${sessionID}/${endpointType}`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            alert(`✅ ${type === 'video' ? 'Video' : 'File'} Berhasil Diupload!`);
            fileInput.value = "";
            setTitles(prev => ({...prev, [sessionID]: {title: "", description: ""}}));
        } catch (error) {
            console.error(error);
            alert("❌ Gagal Upload: " + (error.response?.data?.error || "Error"));
        } finally {
            setUploadingId(null);
        }
    };

    if (loading) return <div style={{padding: 40, textAlign: "center"}}>⏳ Memuat Data Event...</div>;
    if (error) return <div style={{padding: 40, textAlign: "center", color: "red"}}><h3>⚠️ Error</h3><p>{error}</p><Link to="/org">Kembali</Link></div>;
    if (!event) return <div style={{padding: 40}}>Data Event tidak ditemukan.</div>;

    // Helper untuk Warna Status
    const getStatusColor = (status) => {
        if (status === 'PUBLISHED') return { bg: "#c6f6d5", text: "#22543d" }; // Hijau
        if (status === 'SCHEDULED') return { bg: "#feebc8", text: "#744210" }; // Oranye
        return { bg: "#e2e8f0", text: "#4a5568" }; // Abu (Draft)
    };

    return (
        <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto", fontFamily: "sans-serif" }}>
            
            {/* --- MODAL VISIBILITAS --- */}
            <VisibilityModal 
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onSave={handleSaveVisibility}
                initialStatus={modalConfig.currentStatus}
                initialDate={modalConfig.currentDate}
                type={modalConfig.type}
                title={modalConfig.title}
            />

            {/* HEADER EVENT */}
            <div style={{ marginBottom: "30px", borderBottom: "1px solid #ccc", paddingBottom: "20px" }}>
                <div style={{marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                    <Link to="/org" style={{textDecoration: "none", color: "#4a5568"}}>⬅️ Kembali</Link>
                    
                    {/* TOMBOL VISIBILITAS EVENT */}
                    <button 
                        onClick={() => openVisibilityModal('Event', event)}
                        style={{
                            background: "white", border: "1px solid #ccc", padding: "8px 15px", borderRadius: "5px", cursor: "pointer",
                            display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
                        }}
                    >
                        👁️ Atur Visibilitas
                        <span style={{ 
                            fontSize: "0.8em", padding: "2px 8px", borderRadius: "10px",
                            background: getStatusColor(event.publish_status).bg, color: getStatusColor(event.publish_status).text
                        }}>
                            {event.publish_status || "DRAFT"}
                        </span>
                    </button>
                </div>

                <h1 style={{ margin: "0 0 10px 0" }}>⚙️ Kelola: {event.title}</h1>
                <p style={{ color: "#666" }}>{event.description}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "40px" }}>
                
                {/* KOLOM KIRI: FORM TAMBAH SESI */}
                <div style={{ background: "#f0fff4", padding: "20px", borderRadius: "8px", height: "fit-content", border: "1px solid #c6f6d5" }}>
                    <h3 style={{ marginTop: 0, color: "#276749" }}>➕ Tambah Sesi</h3>
                    <form onSubmit={handleCreateSession} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <input 
                            type="text" placeholder="Judul Sesi" required
                            value={newSession.title}
                            onChange={e => setNewSession({...newSession, title: e.target.value})}
                            style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                        />
                        <textarea 
                            placeholder="Deskripsi..."
                            value={newSession.description}
                            onChange={e => setNewSession({...newSession, description: e.target.value})}
                            style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                        />
                        <input 
                            type="number" placeholder="Harga (Rp)"
                            value={newSession.price}
                            onChange={e => setNewSession({...newSession, price: parseInt(e.target.value)})}
                            style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                        />
                        <button 
                            type="submit" disabled={isCreatingSession}
                            style={{ background: "#38a169", color: "white", padding: "10px", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
                        >
                            {isCreatingSession ? "Menyimpan..." : "Simpan Sesi"}
                        </button>
                    </form>
                </div>

                {/* KOLOM KANAN: DAFTAR SESI */}
                <div>
                    <h2 style={{ marginTop: 0 }}>Daftar Sesi</h2>
                    {Array.isArray(sessions) && sessions.length === 0 && (
                        <p style={{color:"#888"}}>Belum ada sesi. Silakan tambah di sebelah kiri.</p>
                    )}
                    
                    {Array.isArray(sessions) && sessions.map(s => (
                        <div key={s.id} style={{ 
                            border: "1px solid #cbd5e0", borderRadius: "8px", padding: "20px", marginBottom: "20px",
                            background: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
                                <div>
                                    <h3 style={{ margin: 0 }}>📂 {s.title}</h3>
                                    <small style={{ color: "#718096" }}>Harga: Rp {s.price}</small>
                                </div>
                                
                                {/* TOMBOL VISIBILITAS SESI */}
                                <button 
                                    onClick={() => openVisibilityModal('Sesi', s)}
                                    style={{ 
                                        background: "white", border: "1px solid #ccc", padding: "5px 10px", borderRadius: "4px", cursor: "pointer",
                                        display: "flex", alignItems: "center", gap: "5px", fontSize: "0.9em"
                                    }}
                                >
                                    Status: 
                                    <span style={{ 
                                        fontWeight: "bold",
                                        color: getStatusColor(s.publish_status).text 
                                    }}>
                                        {s.publish_status || "DRAFT"}
                                    </span>
                                    ✏️
                                </button>
                            </div>
                            
                            {/* AREA UPLOAD VIDEO */}
                            <div style={{ background: "#ebf8ff", padding: "15px", borderRadius: "6px", border: "1px dashed #4299e1", marginBottom: "10px" }}>
                                <h4 style={{ marginTop: 0, marginBottom: "10px", fontSize: "0.9em", color: "#2b6cb0" }}>📹 Upload Video</h4>
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "10px" }}>
                                    <input 
                                        type="text" placeholder="Judul Video (Opsional)"
                                        value={videoTitles[s.id]?.title || ""}
                                        onChange={(e) => setVideoTitles({...videoTitles, [s.id]: { ...videoTitles[s.id], title: e.target.value }})}
                                        style={{ padding: "6px", border: "1px solid #ccc", borderRadius: "4px" }}
                                    />
                                    <textarea 
                                        placeholder="Deskripsi Video (Opsional)" rows="2"
                                        value={videoTitles[s.id]?.description || ""}
                                        onChange={(e) => setVideoTitles({...videoTitles, [s.id]: { ...videoTitles[s.id], description: e.target.value }})}
                                        style={{ padding: "6px", border: "1px solid #ccc", borderRadius: "4px" }}
                                    />
                                </div>
                                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                    <input type="file" accept="video/mp4,video/mkv" id={`vid-${s.id}`} style={{ flex: 1 }} />
                                    <button 
                                        onClick={() => handleUpload('video', s.id, document.getElementById(`vid-${s.id}`))}
                                        disabled={uploadingId === `video-${s.id}`}
                                        style={{ background: "#2b6cb0", color: "white", padding: "6px 15px", border: "none", borderRadius: "4px", cursor: "pointer" }}
                                    >
                                        {uploadingId === `video-${s.id}` ? "Wait..." : "Upload Video"}
                                    </button>
                                </div>
                            </div>

                            {/* AREA UPLOAD FILE */}
                            <div style={{ background: "#fffaf0", padding: "15px", borderRadius: "6px", border: "1px dashed #dd6b20" }}>
                                <h4 style={{ marginTop: 0, marginBottom: "10px", fontSize: "0.9em", color: "#c05621" }}>📄 Upload Modul</h4>
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "10px" }}>
                                    <input 
                                        type="text" placeholder="Judul Modul (Opsional)"
                                        value={fileTitles[s.id]?.title || ""}
                                        onChange={(e) => setFileTitles({...fileTitles, [s.id]: { ...fileTitles[s.id], title: e.target.value }})}
                                        style={{ padding: "6px", border: "1px solid #ccc", borderRadius: "4px" }}
                                    />
                                    <textarea 
                                        placeholder="Deskripsi Modul (Opsional)" rows="2"
                                        value={fileTitles[s.id]?.description || ""}
                                        onChange={(e) => setFileTitles({...fileTitles, [s.id]: { ...fileTitles[s.id], description: e.target.value }})}
                                        style={{ padding: "6px", border: "1px solid #ccc", borderRadius: "4px" }}
                                    />
                                </div>
                                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                    <input type="file" accept="application/pdf" id={`file-${s.id}`} style={{ flex: 1 }} />
                                    <button 
                                        onClick={() => handleUpload('file', s.id, document.getElementById(`file-${s.id}`))}
                                        disabled={uploadingId === `file-${s.id}`}
                                        style={{ background: "#c05621", color: "white", padding: "6px 15px", border: "none", borderRadius: "4px", cursor: "pointer" }}
                                    >
                                        {uploadingId === `file-${s.id}` ? "Wait..." : "Upload File"}
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