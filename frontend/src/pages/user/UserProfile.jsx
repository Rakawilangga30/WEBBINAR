import { useState, useEffect } from "react";
import api from "../../api"; // Pastikan path benar

export default function UserProfile() {
    const [user, setUser] = useState({ name: "", email: "", bio: "", phone: "" });
    const [previewImg, setPreviewImg] = useState(null);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    // Helper untuk URL gambar (handle path relatif dari backend)
    const getImgUrl = (path) => {
        if (!path) return null;
        if (path.startsWith("http")) return path;
        return `http://localhost:8080/${path}`; // Sesuaikan port backend
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            // FIX 1: Path harus /user/profile
            const res = await api.get("/user/profile"); 
            setUser(res.data.user);
            setPreviewImg(getImgUrl(res.data.user.profile_img));
        } catch (err) {
            console.error(err);
        }
    };

    const handleChange = (e) => setUser({ ...user, [e.target.name]: e.target.value });
    
    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreviewImg(URL.createObjectURL(selected));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Update Text Data
            // FIX 2: Path harus /user/profile
            await api.put("/user/profile", {
                name: user.name,
                phone: user.phone,
                bio: user.bio,
                profile_img: user.profile_img // Kirim path lama jika tidak update foto
            });

            // 2. Update Foto (Jika ada file baru dipilih)
            if (file) {
                const formData = new FormData();
                formData.append("profile_img", file); // Key harus sesuai backend (profile_img)
                
                // FIX 3: Path harus /user/profile/upload-image (bukan upload-photo)
                await api.post("/user/profile/upload-image", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
            }

            alert("Profil berhasil diperbarui!");
            
            // Update nama di localStorage agar sidebar berubah
            const localUser = JSON.parse(localStorage.getItem("user") || "{}");
            localStorage.setItem("user", JSON.stringify({ ...localUser, name: user.name }));
            
            window.location.reload(); 
        } catch (error) {
            console.error(error);
            alert("Gagal update profil: " + (error.response?.data?.error || "Error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ background: "white", padding: 30, borderRadius: 10, boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
            <h2 style={{marginTop:0}}>👤 Profil Saya</h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                
                {/* Bagian Foto */}
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <div style={{ width: 100, height: 100, borderRadius: "50%", background: "#edf2f7", overflow: "hidden", border:"2px solid #e2e8f0" }}>
                        {previewImg ? (
                            <img src={previewImg} alt="Profil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            <div style={{textAlign:"center", lineHeight:"100px", color:"#a0aec0"}}>No IMG</div>
                        )}
                    </div>
                    <div>
                        <input type="file" accept="image/*" onChange={handleFileChange} />
                        <p style={{fontSize:12, color:"#718096", marginTop:5}}>Format: JPG, PNG, WEBP. Max 2MB.</p>
                    </div>
                </div>

                <div>
                    <label style={{fontWeight:"bold", display:"block", marginBottom:5}}>Nama Lengkap</label>
                    <input type="text" name="name" value={user.name || ""} onChange={handleChange} style={{ width: "100%", padding: "10px", border:"1px solid #cbd5e0", borderRadius:6 }} required />
                </div>
                
                <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:20}}>
                    <div>
                        <label style={{fontWeight:"bold", display:"block", marginBottom:5}}>Email</label>
                        <input type="email" value={user.email || ""} disabled style={{ width: "100%", padding: "10px", border:"1px solid #e2e8f0", borderRadius:6, background: "#f7fafc", color:"#718096" }} />
                    </div>
                    <div>
                        <label style={{fontWeight:"bold", display:"block", marginBottom:5}}>No. Telepon</label>
                        <input type="text" name="phone" value={user.phone || ""} onChange={handleChange} style={{ width: "100%", padding: "10px", border:"1px solid #cbd5e0", borderRadius:6 }} />
                    </div>
                </div>

                <div>
                    <label style={{fontWeight:"bold", display:"block", marginBottom:5}}>Biodata</label>
                    <textarea name="bio" value={user.bio || ""} onChange={handleChange} rows="4" style={{ width: "100%", padding: "10px", border:"1px solid #cbd5e0", borderRadius:6 }} placeholder="Ceritakan sedikit tentang dirimu..." />
                </div>

                <button type="submit" disabled={loading} style={{ padding: "12px", background: loading ? "#718096" : "#3182ce", color: "white", border: "none", borderRadius: 6, cursor: loading ? "default" : "pointer", fontWeight: "bold", fontSize:16 }}>
                    {loading ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
            </form>
        </div>
    );
}