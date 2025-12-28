import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';

export default function AffiliateSubmitEvent() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        event_title: '',
        event_description: '',
        event_price: '',
        video_title: '',
        file_title: ''
    });
    const [poster, setPoster] = useState(null);
    const [video, setVideo] = useState(null);
    const [file, setFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.event_title) {
            alert('Judul event wajib diisi!');
            return;
        }

        if (!video && !file) {
            alert('Upload minimal 1 materi (video atau file/modul)!');
            return;
        }

        setLoading(true);
        setUploadProgress(0);

        try {
            const data = new FormData();
            data.append('event_title', form.event_title);
            data.append('event_description', form.event_description);
            data.append('event_price', form.event_price);
            data.append('video_title', form.video_title);
            data.append('file_title', form.file_title);

            if (poster) data.append('poster', poster);
            if (video) data.append('video', video);
            if (file) data.append('file', file);

            await api.post('/affiliate/submit-event', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percent);
                }
            });

            alert('✅ Event berhasil diajukan untuk review!');
            navigate('/dashboard/affiliate/events');
        } catch (error) {
            alert('❌ Gagal: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: "32px" }}>
                <Link to="/dashboard/affiliate/events" style={{ color: "#3b82f6", textDecoration: "none", fontSize: "0.9rem", display: "inline-block", marginBottom: "12px" }}>
                    ← Kembali ke Event Saya
                </Link>
                <h1 style={{ margin: "0 0 8px 0", color: "#1e293b", fontSize: "1.75rem" }}>➕ Ajukan Event Baru</h1>
                <p style={{ margin: 0, color: "#64748b" }}>Lengkapi informasi dan upload materi event Anda</p>
            </div>

            {/* Info Box */}
            <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "12px", padding: "16px 20px", marginBottom: "24px" }}>
                <p style={{ margin: 0, color: "#047857", fontSize: "0.9rem" }}>
                    💡 <strong>Tips:</strong> Upload minimal 1 materi (video atau file/modul). Materi akan direview admin sebelum dipublikasikan.
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Event Info */}
                <div style={sectionCard}>
                    <h3 style={sectionTitle}>📋 Informasi Event</h3>
                    <div style={{ display: "grid", gap: "20px" }}>
                        <div>
                            <label style={labelStyle}>Judul Event *</label>
                            <input
                                type="text"
                                value={form.event_title}
                                onChange={(e) => setForm({ ...form, event_title: e.target.value })}
                                placeholder="Contoh: Masterclass Digital Marketing 2024"
                                style={inputStyle}
                                required
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Deskripsi Event</label>
                            <textarea
                                value={form.event_description}
                                onChange={(e) => setForm({ ...form, event_description: e.target.value })}
                                placeholder="Jelaskan tentang event Anda..."
                                style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Harga (Rp) *</label>
                            <input
                                type="number"
                                value={form.event_price}
                                onChange={(e) => setForm({ ...form, event_price: e.target.value })}
                                placeholder="100000"
                                style={inputStyle}
                                min="0"
                                required
                            />
                            <p style={{ margin: "8px 0 0 0", color: "#10b981", fontSize: "0.85rem" }}>
                                💰 Anda akan menerima 90% dari harga ini untuk setiap penjualan
                            </p>
                        </div>
                    </div>
                </div>

                {/* Poster Upload */}
                <div style={sectionCard}>
                    <h3 style={sectionTitle}>🖼️ Poster/Thumbnail</h3>
                    <div style={uploadArea}>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setPoster(e.target.files[0])}
                            style={{ display: "none" }}
                            id="poster-upload"
                        />
                        <label htmlFor="poster-upload" style={{ cursor: "pointer", textAlign: "center" }}>
                            {poster ? (
                                <div>
                                    <div style={{ color: "#10b981", marginBottom: "8px" }}>✅ {poster.name}</div>
                                    <div style={{ color: "#64748b", fontSize: "0.85rem" }}>{formatFileSize(poster.size)}</div>
                                </div>
                            ) : (
                                <div>
                                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📷</div>
                                    <div style={{ color: "#64748b" }}>Klik untuk upload poster</div>
                                    <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>JPG, PNG (Max 5MB)</div>
                                </div>
                            )}
                        </label>
                    </div>
                </div>

                {/* Materials Upload */}
                <div style={sectionCard}>
                    <h3 style={sectionTitle}>📚 Materi Event (Minimal 1)</h3>

                    {/* Video Upload */}
                    <div style={{ marginBottom: "20px" }}>
                        <label style={labelStyle}>Video Materi</label>
                        <div>
                            <input
                                type="text"
                                value={form.video_title}
                                onChange={(e) => setForm({ ...form, video_title: e.target.value })}
                                placeholder="Judul video (opsional)"
                                style={{ ...inputStyle, marginBottom: "12px" }}
                            />
                            <div style={uploadArea}>
                                <input
                                    type="file"
                                    accept="video/*"
                                    onChange={(e) => setVideo(e.target.files[0])}
                                    style={{ display: "none" }}
                                    id="video-upload"
                                />
                                <label htmlFor="video-upload" style={{ cursor: "pointer", textAlign: "center" }}>
                                    {video ? (
                                        <div>
                                            <div style={{ color: "#10b981", marginBottom: "8px" }}>✅ {video.name}</div>
                                            <div style={{ color: "#64748b", fontSize: "0.85rem" }}>{formatFileSize(video.size)}</div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🎬</div>
                                            <div style={{ color: "#64748b" }}>Klik untuk upload video</div>
                                            <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>MP4, WebM, MOV</div>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* File/Module Upload */}
                    <div>
                        <label style={labelStyle}>File/Modul Materi</label>
                        <div>
                            <input
                                type="text"
                                value={form.file_title}
                                onChange={(e) => setForm({ ...form, file_title: e.target.value })}
                                placeholder="Judul file (opsional)"
                                style={{ ...inputStyle, marginBottom: "12px" }}
                            />
                            <div style={uploadArea}>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
                                    onChange={(e) => setFile(e.target.files[0])}
                                    style={{ display: "none" }}
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" style={{ cursor: "pointer", textAlign: "center" }}>
                                    {file ? (
                                        <div>
                                            <div style={{ color: "#10b981", marginBottom: "8px" }}>✅ {file.name}</div>
                                            <div style={{ color: "#64748b", fontSize: "0.85rem" }}>{formatFileSize(file.size)}</div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📄</div>
                                            <div style={{ color: "#64748b" }}>Klik untuk upload file</div>
                                            <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>PDF, DOC, PPT, ZIP</div>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                {loading && uploadProgress > 0 && (
                    <div style={{ marginBottom: "24px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                            <span style={{ color: "#64748b", fontSize: "0.9rem" }}>Mengupload...</span>
                            <span style={{ color: "#3b82f6", fontWeight: "600" }}>{uploadProgress}%</span>
                        </div>
                        <div style={{ height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${uploadProgress}%`, background: "linear-gradient(90deg, #3b82f6, #2563eb)", transition: "width 0.3s ease" }}></div>
                        </div>
                    </div>
                )}

                {/* Submit */}
                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                    <Link to="/dashboard/affiliate/events" style={{ padding: "14px 28px", background: "white", color: "#374151", textDecoration: "none", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                        Batal
                    </Link>
                    <button type="submit" disabled={loading} style={{
                        padding: "14px 32px",
                        background: loading ? "#94a3b8" : "linear-gradient(135deg, #22c55e, #16a34a)",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        cursor: loading ? "not-allowed" : "pointer",
                        fontWeight: "600",
                        fontSize: "1rem"
                    }}>
                        {loading ? "Mengupload..." : "🚀 Kirim Pengajuan"}
                    </button>
                </div>
            </form>
        </div>
    );
}

const sectionCard = {
    background: "white",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    border: "1px solid #e2e8f0"
};

const sectionTitle = {
    margin: "0 0 20px 0",
    color: "#1e293b",
    fontSize: "1.1rem"
};

const labelStyle = {
    display: "block",
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "6px"
};

const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "0.95rem",
    boxSizing: "border-box"
};

const uploadArea = {
    border: "2px dashed #d1d5db",
    borderRadius: "12px",
    padding: "32px",
    textAlign: "center",
    transition: "all 0.3s ease"
};
