import { useState } from "react";
import api, { uploadEventThumbnail } from "../../api";
import { useNavigate } from "react-router-dom";

export default function CreateEvent() {
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Programming");
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await api.post("/organization/events", {
                title,
                description,
                category
            });
            if (thumbnailFile) {
                try {
                    await uploadEventThumbnail(res.data.event_id, thumbnailFile);
                } catch (err) {
                    console.error("Gagal upload thumbnail saat membuat event:", err);
                    alert("Event dibuat, tetapi gagal upload thumbnail.");
                }
            }
            alert("✅ Event Berhasil Dibuat!");
            navigate(`/org/event/${res.data.event_id}/manage`);
        } catch (error) {
            alert("Gagal: " + (error.response?.data?.error || "Error"));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
            <div style={{ width: "600px", maxWidth: "95%", background: "white", borderRadius: 8, padding: 20, boxShadow: "0 8px 40px rgba(0,0,0,0.4)", position: "relative" }}>
                <button onClick={() => navigate(-1)} style={{ position: "absolute", right: 12, top: 12, border: "none", background: "transparent", cursor: "pointer", fontSize: 18 }}>✖</button>
                <h2 style={{ marginTop: 0 }}>Buat Event Baru</h2>
                <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                        <label>Judul Event</label>
                        <input 
                            type="text" required 
                            value={title} onChange={e => setTitle(e.target.value)}
                            style={{ width: "100%", padding: "8px", marginTop: "6px" }}
                        />
                    </div>

                    <div>
                        <label>Kategori</label>
                        <select 
                            value={category} onChange={e => setCategory(e.target.value)}
                            style={{ width: "100%", padding: "8px", marginTop: "6px" }}
                        >
                            <option value="Programming">Programming</option>
                            <option value="Desain">Desain</option>
                            <option value="Bisnis">Bisnis</option>
                            <option value="Marketing">Marketing</option>
                        </select>
                    </div>

                    <div>
                        <label>Deskripsi</label>
                        <textarea 
                            rows="4" required
                            value={description} onChange={e => setDescription(e.target.value)}
                            style={{ width: "100%", padding: "8px", marginTop: "6px" }}
                        />
                    </div>

                    <div>
                        <label>Thumbnail (opsional)</label>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                            <input
                                id="create-thumb-input"
                                type="file"
                                accept="image/*"
                                style={{ display: "block" }}
                                onChange={e => setThumbnailFile(e.target.files?.[0] || null)}
                            />
                            <button type="button" onClick={() => document.getElementById('create-thumb-input').click()} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", background: "#f7fafc", cursor: "pointer" }}>Pilih Thumbnail</button>
                            <span style={{ color: "#444", fontSize: "0.9em" }}>{thumbnailFile ? thumbnailFile.name : "Belum memilih file"}</span>
                        </div>
                        {thumbnailFile && (
                            <div style={{ marginTop: 8 }}>
                                <img src={URL.createObjectURL(thumbnailFile)} alt="preview" style={{ maxWidth: 160, maxHeight: 120, borderRadius: 6, display: 'block' }} />
                            </div>
                        )}
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
                        <button type="button" onClick={() => navigate(-1)} style={{ padding: "10px 14px", borderRadius: 6, border: "1px solid #cbd5e0", background: "white", cursor: "pointer" }}>Batal</button>
                        <button type="submit" disabled={submitting} style={{ padding: "10px 14px", borderRadius: 6, border: "none", background: "#3182ce", color: "white", cursor: "pointer", fontWeight: "bold" }}>{submitting ? 'Menyimpan...' : 'Simpan & Lanjut'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}