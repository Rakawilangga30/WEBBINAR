import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../api';

export default function Report() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        category: 'BUG',
        subject: '',
        description: '',
        photo: null
    });

    const categories = [
        { value: 'BUG', label: '🐛 Bug / Masalah Teknis' },
        { value: 'CONTENT', label: '📝 Konten Tidak Pantas' },
        { value: 'FRAUD', label: '⚠️ Penipuan / Fraud' },
        { value: 'SUGGESTION', label: '💡 Saran & Masukan' },
        { value: 'OTHER', label: '📌 Lainnya' },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.subject || !form.description) {
            toast.error('Mohon lengkapi semua field');
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('category', form.category);
            formData.append('subject', form.subject);
            formData.append('description', form.description);
            if (form.photo) {
                formData.append('photo', form.photo);
            }

            await api.post('/user/reports', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Laporan berhasil dikirim! Tim kami akan segera menindaklanjuti.');
            navigate('/');
        } catch (error) {
            toast.error('❌ ' + (error.response?.data?.error || 'Gagal mengirim laporan'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: "24px", maxWidth: "700px", margin: "0 auto", minHeight: "100vh" }}>
            {/* Header */}
            <div style={{ marginBottom: "32px" }}>
                <Link to="/" style={{ color: "#3b82f6", textDecoration: "none", fontSize: "0.9rem" }}>
                    ← Kembali ke Home
                </Link>
                <h1 style={{ margin: "16px 0 8px 0", color: "#1e293b", fontSize: "1.75rem" }}>
                    📢 Kirim Laporan
                </h1>
                <p style={{ margin: 0, color: "#64748b" }}>
                    Laporkan masalah, bug, atau kirim saran untuk platform kami
                </p>
            </div>

            {/* Form */}
            <div style={{
                background: "white",
                borderRadius: "16px",
                padding: "32px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                border: "1px solid #e2e8f0"
            }}>
                <form onSubmit={handleSubmit}>
                    {/* Category */}
                    <div style={{ marginBottom: "24px" }}>
                        <label style={labelStyle}>Kategori Laporan</label>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                            {categories.map((cat) => (
                                <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => setForm({ ...form, category: cat.value })}
                                    style={{
                                        padding: "14px",
                                        borderRadius: "10px",
                                        border: form.category === cat.value ? "2px solid #3b82f6" : "1px solid #e2e8f0",
                                        background: form.category === cat.value ? "#eff6ff" : "white",
                                        cursor: "pointer",
                                        textAlign: "left",
                                        fontWeight: form.category === cat.value ? "600" : "500",
                                        color: form.category === cat.value ? "#3b82f6" : "#374151"
                                    }}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Subject */}
                    <div style={{ marginBottom: "24px" }}>
                        <label style={labelStyle}>Judul Laporan *</label>
                        <input
                            type="text"
                            value={form.subject}
                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                            placeholder="Jelaskan singkat masalah/saran Anda"
                            style={inputStyle}
                            required
                        />
                    </div>

                    {/* Description */}
                    <div style={{ marginBottom: "24px" }}>
                        <label style={labelStyle}>Deskripsi Lengkap *</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Jelaskan secara detail apa yang terjadi, langkah untuk mereproduksi masalah, atau saran Anda..."
                            style={{ ...inputStyle, minHeight: "150px", resize: "vertical" }}
                            required
                        />
                    </div>

                    {/* Photo Upload */}
                    <div style={{ marginBottom: "32px" }}>
                        <label style={labelStyle}>Screenshot / Bukti (Opsional)</label>
                        <div style={{
                            border: "2px dashed #d1d5db",
                            borderRadius: "12px",
                            padding: "24px",
                            textAlign: "center",
                            background: "#f9fafb"
                        }}>
                            {form.photo ? (
                                <div>
                                    <img
                                        src={URL.createObjectURL(form.photo)}
                                        alt="Preview"
                                        style={{ maxWidth: "200px", maxHeight: "150px", borderRadius: "8px" }}
                                    />
                                    <div style={{ marginTop: "12px" }}>
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, photo: null })}
                                            style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}
                                        >
                                            ❌ Hapus
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📷</div>
                                    <p style={{ margin: "0 0 12px 0", color: "#64748b" }}>
                                        Klik atau drag foto ke sini
                                    </p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setForm({ ...form, photo: e.target.files[0] })}
                                        style={{ display: "none" }}
                                        id="photo-upload"
                                    />
                                    <label htmlFor="photo-upload" style={{
                                        display: "inline-block",
                                        background: "#e2e8f0",
                                        padding: "8px 20px",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        fontWeight: "500",
                                        color: "#475569"
                                    }}>
                                        Pilih Foto
                                    </label>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "16px",
                            background: loading ? "#94a3b8" : "linear-gradient(135deg, #3b82f6, #2563eb)",
                            color: "white",
                            border: "none",
                            borderRadius: "12px",
                            cursor: loading ? "not-allowed" : "pointer",
                            fontWeight: "600",
                            fontSize: "1rem"
                        }}
                    >
                        {loading ? "Mengirim..." : "📤 Kirim Laporan"}
                    </button>
                </form>
            </div>
        </div>
    );
}

const labelStyle = {
    display: "block",
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "8px"
};

const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    fontSize: "0.95rem",
    boxSizing: "border-box"
};
