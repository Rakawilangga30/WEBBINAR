import { useState } from "react";
import api, { uploadEventThumbnail } from "../../api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

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

            console.log("Event Created Response:", res.data);
            const newEventId = res.data.event_id;

            if (thumbnailFile && newEventId) {
                try {
                    await uploadEventThumbnail(newEventId, thumbnailFile);
                } catch (err) {
                    console.error("Gagal upload thumbnail:", err);
                    toast.error("Event dibuat, tapi gagal upload thumbnail.");
                }
            } else if (thumbnailFile && !newEventId) {
                toast.error("Warning: Backend tidak mengembalikan event_id");
            }

            toast.success("Event Berhasil Dibuat!");
            navigate(`/dashboard/org/event/${newEventId}/manage`);
        } catch (error) {
            console.error(error);
            toast.error("Gagal: " + (error.response?.data?.error || "Terjadi kesalahan sistem"));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            backdropFilter: "blur(4px)"
        }}>
            <div style={{
                width: "600px",
                maxWidth: "95%",
                background: "white",
                borderRadius: "16px",
                padding: "32px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                position: "relative",
                maxHeight: "90vh",
                overflowY: "auto"
            }}>
                {/* Close Button */}
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        position: "absolute",
                        right: "16px",
                        top: "16px",
                        border: "none",
                        background: "#f1f5f9",
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                >
                    ✕
                </button>

                {/* Header */}
                <h2 style={{ margin: "0 0 24px 0", color: "#1e293b", fontSize: "1.5rem" }}>
                    ✨ Buat Event Baru
                </h2>

                <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {/* Title */}
                    <div>
                        <label style={labelStyle}>Judul Event</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            style={inputStyle}
                            placeholder="Contoh: Kursus Belajar Golang Dasar"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label style={labelStyle}>Kategori</label>
                        <select
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            style={inputStyle}
                        >
                            <option value="Programming">Programming</option>
                            <option value="Desain">Desain</option>
                            <option value="Bisnis">Bisnis</option>
                            <option value="Marketing">Marketing</option>
                            <option value="Lifestyle">Lifestyle</option>
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label style={labelStyle}>Deskripsi</label>
                        <textarea
                            rows="4"
                            required
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            style={{ ...inputStyle, resize: "vertical" }}
                            placeholder="Jelaskan detail event Anda..."
                        />
                    </div>

                    {/* Thumbnail */}
                    <div>
                        <label style={labelStyle}>Thumbnail (opsional)</label>
                        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                            <label style={{
                                padding: "10px 16px",
                                background: "#eff6ff",
                                color: "#3b82f6",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontWeight: "600",
                                fontSize: "0.9rem",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px"
                            }}>
                                📁 Pilih Gambar
                                <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: "none" }}
                                    onChange={e => setThumbnailFile(e.target.files?.[0] || null)}
                                />
                            </label>

                            <span style={{ color: "#64748b", fontSize: "0.9rem" }}>
                                {thumbnailFile ? thumbnailFile.name : "Belum memilih file"}
                            </span>
                        </div>

                        {thumbnailFile && (
                            <div style={{ marginTop: "12px" }}>
                                <img
                                    src={URL.createObjectURL(thumbnailFile)}
                                    alt="preview"
                                    style={{
                                        maxWidth: "100%",
                                        maxHeight: "150px",
                                        borderRadius: "8px",
                                        border: "1px solid #e2e8f0"
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "12px",
                        marginTop: "8px",
                        paddingTop: "20px",
                        borderTop: "1px solid #e2e8f0"
                    }}>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            style={{
                                padding: "12px 24px",
                                borderRadius: "8px",
                                border: "1px solid #e2e8f0",
                                background: "white",
                                cursor: "pointer",
                                fontWeight: "500",
                                fontSize: "0.9rem",
                                color: "#374151"
                            }}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                padding: "12px 24px",
                                borderRadius: "8px",
                                border: "none",
                                background: submitting
                                    ? "#94a3b8"
                                    : "linear-gradient(135deg, #3b82f6, #2563eb)",
                                color: "white",
                                cursor: submitting ? "not-allowed" : "pointer",
                                fontWeight: "600",
                                fontSize: "0.9rem"
                            }}
                        >
                            {submitting ? '⏳ Menyimpan...' : '💾 Simpan & Lanjut'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const labelStyle = {
    display: "block",
    marginBottom: "6px",
    fontWeight: "500",
    color: "#374151",
    fontSize: "0.875rem"
};

const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "0.95rem",
    boxSizing: "border-box"
};