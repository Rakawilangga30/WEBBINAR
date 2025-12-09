import { useState } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";

export default function CreateEvent() {
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Programming");

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post("/organization/events", {
                title,
                description,
                category
            });
            alert("✅ Event Berhasil Dibuat!");
            navigate(`/org/event/${res.data.event_id}/manage`);
        } catch (error) {
            alert("Gagal: " + (error.response?.data?.error || "Error"));
        }
    };

    return (
        <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
            <h1>Buat Event Baru</h1>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div>
                    <label>Judul Event</label>
                    <input 
                        type="text" required 
                        value={title} onChange={e => setTitle(e.target.value)}
                        style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                    />
                </div>
                
                <div>
                    <label>Kategori</label>
                    <select 
                        value={category} onChange={e => setCategory(e.target.value)}
                        style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                    >
                        {/* PERBAIKAN: Gunakan tanda = bukan () */}
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
                        style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                    />
                </div>

                <button type="submit" style={{ background: "#3182ce", color: "white", padding: "12px", border: "none", cursor: "pointer", fontWeight: "bold" }}>
                    Simpan & Lanjut ➡️
                </button>
            </form>
        </div>
    );
}