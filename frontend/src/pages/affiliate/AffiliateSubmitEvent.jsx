import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';

export default function AffiliateSubmitEvent() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [form, setForm] = useState({
        event_title: '',
        event_description: '',
        event_price: '',
        event_category: 'Teknologi',
        phone: '',
        bank_name: '',
        bank_account_number: '',
        bank_account_holder: ''
    });
    const [poster, setPoster] = useState(null);
    const [videos, setVideos] = useState([{ file: null, title: '', description: '' }]);
    const [files, setFiles] = useState([{ file: null, title: '', description: '' }]);
    const [uploadProgress, setUploadProgress] = useState(0);

    const MAX_VIDEOS = 3;
    const MAX_FILES = 3;

    // Check if user has AFFILIATE role
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const roles = user.roles || [];
        if (!roles.includes("AFFILIATE")) {
            toast.error("Akses ditolak. Anda bukan affiliate.");
            navigate("/dashboard");
        }
    }, [navigate]);

    // Check profile completeness on load
    useEffect(() => {
        checkProfile();
    }, []);

    const checkProfile = async () => {
        try {
            const response = await api.get('/user/profile');
            const user = response.data.user;

            // Check required fields
            const isComplete = user.name && user.phone && user.address && user.gender && user.birthdate;

            if (!isComplete) {
                alert('⚠️ Silakan lengkapi profil Anda terlebih dahulu (nama, telepon, alamat, jenis kelamin, tanggal lahir) sebelum mengajukan event.');
                navigate('/dashboard/profile');
                return;
            }

            // Pre-fill phone from profile if exists
            if (user.phone) {
                setForm(prev => ({ ...prev, phone: user.phone }));
            }
        } catch (error) {
            console.error('Error checking profile:', error);
        } finally {
            setChecking(false);
        }
    };

    const handleAddVideo = () => {
        if (videos.length < MAX_VIDEOS) {
            setVideos([...videos, { file: null, title: '', description: '' }]);
        }
    };

    const handleRemoveVideo = (index) => {
        const newVideos = videos.filter((_, i) => i !== index);
        setVideos(newVideos.length > 0 ? newVideos : [{ file: null, title: '', description: '' }]);
    };

    const handleVideoChange = (index, field, value) => {
        const newVideos = [...videos];
        newVideos[index][field] = value;
        setVideos(newVideos);
    };

    const handleAddFile = () => {
        if (files.length < MAX_FILES) {
            setFiles([...files, { file: null, title: '', description: '' }]);
        }
    };

    const handleRemoveFile = (index) => {
        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles.length > 0 ? newFiles : [{ file: null, title: '', description: '' }]);
    };

    const handleFileChange = (index, field, value) => {
        const newFiles = [...files];
        newFiles[index][field] = value;
        setFiles(newFiles);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.event_title) {
            alert('Judul event wajib diisi!');
            return;
        }

        const price = parseInt(form.event_price) || 0;

        // If price is 0 (free), ask for confirmation
        if (price === 0) {
            const confirmFree = window.confirm(
                '⚠️ PERINGATAN HARGA GRATIS\n\n' +
                'Anda akan membuat event GRATIS (Rp 0).\n' +
                'Anda tidak akan menerima komisi dari event ini.\n\n' +
                'Apakah Anda yakin ingin melanjutkan dengan harga gratis?'
            );
            if (!confirmFree) {
                return;
            }
        } else if (price < 0) {
            alert('Harga event tidak boleh negatif!');
            return;
        }

        // Validate contact info
        if (!form.phone || form.phone.trim() === '') {
            alert('No. Telepon/WhatsApp wajib diisi untuk komunikasi!');
            return;
        }

        // Validate bank info
        if (!form.bank_name || form.bank_name.trim() === '') {
            alert('Nama Bank wajib diisi untuk pembayaran komisi!');
            return;
        }

        if (!form.bank_account_number || form.bank_account_number.trim() === '') {
            alert('No. Rekening wajib diisi untuk pembayaran komisi!');
            return;
        }

        if (!form.bank_account_holder || form.bank_account_holder.trim() === '') {
            alert('Nama Pemilik Rekening wajib diisi untuk pembayaran komisi!');
            return;
        }

        const hasVideos = videos.some(v => v.file !== null);
        const hasFiles = files.some(f => f.file !== null);

        if (!hasVideos && !hasFiles) {
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
            data.append('event_category', form.event_category);
            data.append('phone', form.phone);
            data.append('bank_name', form.bank_name);
            data.append('bank_account_number', form.bank_account_number);
            data.append('bank_account_holder', form.bank_account_holder);

            if (poster) data.append('poster', poster);

            // Append videos array
            videos.forEach((v) => {
                if (v.file) {
                    data.append('videos', v.file);
                    data.append('video_titles', v.title || '');
                    data.append('video_descriptions', v.description || '');
                }
            });

            // Append files array
            files.forEach((f) => {
                if (f.file) {
                    data.append('files', f.file);
                    data.append('file_titles', f.title || '');
                    data.append('file_descriptions', f.description || '');
                }
            });

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

    // Show loading while checking profile
    if (checking) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                Memeriksa kelengkapan profil...
            </div>
        );
    }

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
                    💡 <strong>Tips:</strong> Upload maksimal 3 video dan 3 file/modul. Materi akan direview admin sebelum dipublikasikan.
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
                            <label style={labelStyle}>Kategori *</label>
                            <select
                                value={form.event_category}
                                onChange={(e) => setForm({ ...form, event_category: e.target.value })}
                                style={inputStyle}
                                required
                            >
                                <option value="Teknologi">Teknologi</option>
                                <option value="Bisnis">Bisnis</option>
                                <option value="Pendidikan">Pendidikan</option>
                                <option value="Kesehatan">Kesehatan</option>
                                <option value="Seni & Kreativitas">Seni & Kreativitas</option>
                                <option value="Olahraga">Olahraga</option>
                                <option value="Musik">Musik</option>
                                <option value="Gaming">Gaming</option>
                                <option value="Lifestyle">Lifestyle</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
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
                            <label style={labelStyle}>Harga (Rp) - Kosongkan atau 0 untuk GRATIS</label>
                            <input
                                type="number"
                                value={form.event_price}
                                onChange={(e) => setForm({ ...form, event_price: e.target.value })}
                                placeholder="0 untuk gratis, atau masukkan harga"
                                style={inputStyle}
                                min="0"
                            />
                            {(parseInt(form.event_price) || 0) === 0 ? (
                                <p style={{ margin: "8px 0 0 0", color: "#f59e0b", fontSize: "0.85rem" }}>
                                    🎁 Event GRATIS - Anda tidak akan menerima komisi
                                </p>
                            ) : (
                                <p style={{ margin: "8px 0 0 0", color: "#10b981", fontSize: "0.85rem" }}>
                                    💰 Anda akan menerima 90% = Rp {Math.floor((parseInt(form.event_price) || 0) * 0.9).toLocaleString('id-ID')} per penjualan
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div style={sectionCard}>
                    <h3 style={sectionTitle}>📞 Informasi Kontak</h3>
                    <div>
                        <label style={labelStyle}>No. Telepon / WhatsApp *</label>
                        <input
                            type="tel"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            placeholder="08123456789"
                            style={inputStyle}
                        />
                    </div>
                </div>

                {/* Bank Info */}
                <div style={sectionCard}>
                    <h3 style={sectionTitle}>🏦 Informasi Rekening (untuk pembayaran)</h3>
                    <div style={{ display: "grid", gap: "16px" }}>
                        <div>
                            <label style={labelStyle}>Nama Bank *</label>
                            <input
                                type="text"
                                value={form.bank_name}
                                onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                                placeholder="BCA, Mandiri, BNI, dll"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>No. Rekening *</label>
                            <input
                                type="text"
                                value={form.bank_account_number}
                                onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })}
                                placeholder="1234567890"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Nama Pemilik Rekening *</label>
                            <input
                                type="text"
                                value={form.bank_account_holder}
                                onChange={(e) => setForm({ ...form, bank_account_holder: e.target.value })}
                                placeholder="Nama sesuai buku tabungan"
                                style={inputStyle}
                            />
                        </div>
                    </div>
                    <p style={{ margin: "12px 0 0 0", color: "#64748b", fontSize: "0.85rem" }}>
                        ℹ️ Informasi ini digunakan untuk pembayaran komisi affiliate Anda
                    </p>
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

                {/* Videos Upload */}
                <div style={sectionCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <h3 style={{ ...sectionTitle, marginBottom: 0 }}>🎬 Video Materi ({videos.filter(v => v.file).length}/{MAX_VIDEOS})</h3>
                        {videos.length < MAX_VIDEOS && (
                            <button type="button" onClick={handleAddVideo} style={addButton}>
                                + Tambah Video
                            </button>
                        )}
                    </div>

                    {videos.map((video, index) => (
                        <div key={index} style={{ marginBottom: "16px", padding: "16px", background: "#f8fafc", borderRadius: "8px", position: "relative" }}>
                            {videos.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveVideo(index)}
                                    style={removeButton}
                                >
                                    ✕
                                </button>
                            )}
                            <div style={{ marginBottom: "12px" }}>
                                <input
                                    type="text"
                                    value={video.title}
                                    onChange={(e) => handleVideoChange(index, 'title', e.target.value)}
                                    placeholder={`Judul video ${index + 1}`}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ marginBottom: "12px" }}>
                                <textarea
                                    value={video.description}
                                    onChange={(e) => handleVideoChange(index, 'description', e.target.value)}
                                    placeholder="Deskripsi video (opsional)"
                                    style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }}
                                />
                            </div>
                            <div style={{ ...uploadArea, padding: "20px" }}>
                                <input
                                    type="file"
                                    accept="video/*"
                                    onChange={(e) => handleVideoChange(index, 'file', e.target.files[0])}
                                    style={{ display: "none" }}
                                    id={`video-upload-${index}`}
                                />
                                <label htmlFor={`video-upload-${index}`} style={{ cursor: "pointer", textAlign: "center", display: "block" }}>
                                    {video.file ? (
                                        <div>
                                            <div style={{ color: "#10b981", marginBottom: "4px" }}>✅ {video.file.name}</div>
                                            <div style={{ color: "#64748b", fontSize: "0.85rem" }}>{formatFileSize(video.file.size)}</div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div style={{ fontSize: "1.5rem", marginBottom: "4px" }}>🎬</div>
                                            <div style={{ color: "#64748b", fontSize: "0.9rem" }}>Klik untuk upload video</div>
                                            <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>MP4, WebM, MOV</div>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Files Upload */}
                <div style={sectionCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <h3 style={{ ...sectionTitle, marginBottom: 0 }}>📄 File/Modul Materi ({files.filter(f => f.file).length}/{MAX_FILES})</h3>
                        {files.length < MAX_FILES && (
                            <button type="button" onClick={handleAddFile} style={addButton}>
                                + Tambah File
                            </button>
                        )}
                    </div>

                    {files.map((file, index) => (
                        <div key={index} style={{ marginBottom: "16px", padding: "16px", background: "#f8fafc", borderRadius: "8px", position: "relative" }}>
                            {files.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveFile(index)}
                                    style={removeButton}
                                >
                                    ✕
                                </button>
                            )}
                            <div style={{ marginBottom: "12px" }}>
                                <input
                                    type="text"
                                    value={file.title}
                                    onChange={(e) => handleFileChange(index, 'title', e.target.value)}
                                    placeholder={`Judul file ${index + 1}`}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ marginBottom: "12px" }}>
                                <textarea
                                    value={file.description}
                                    onChange={(e) => handleFileChange(index, 'description', e.target.value)}
                                    placeholder="Deskripsi file (opsional)"
                                    style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }}
                                />
                            </div>
                            <div style={{ ...uploadArea, padding: "20px" }}>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
                                    onChange={(e) => handleFileChange(index, 'file', e.target.files[0])}
                                    style={{ display: "none" }}
                                    id={`file-upload-${index}`}
                                />
                                <label htmlFor={`file-upload-${index}`} style={{ cursor: "pointer", textAlign: "center", display: "block" }}>
                                    {file.file ? (
                                        <div>
                                            <div style={{ color: "#10b981", marginBottom: "4px" }}>✅ {file.file.name}</div>
                                            <div style={{ color: "#64748b", fontSize: "0.85rem" }}>{formatFileSize(file.file.size)}</div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div style={{ fontSize: "1.5rem", marginBottom: "4px" }}>📄</div>
                                            <div style={{ color: "#64748b", fontSize: "0.9rem" }}>Klik untuk upload file</div>
                                            <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>PDF, DOC, PPT, ZIP</div>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>
                    ))}
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

const addButton = {
    padding: "8px 16px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: "500"
};

const removeButton = {
    position: "absolute",
    top: "8px",
    right: "8px",
    width: "24px",
    height: "24px",
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: "0.8rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
};
