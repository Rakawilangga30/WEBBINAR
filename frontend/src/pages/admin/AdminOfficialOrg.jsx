import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api';
import { getBackendUrl } from '../../utils/url';

export default function AdminOfficialOrg() {
    const [org, setOrg] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', description: '', category: '', email: '' });

    // Create Event Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({ title: '', description: '', category: 'Teknologi' });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const orgRes = await api.get('/admin/official-org');
            setOrg(orgRes.data.organization);
            setEditForm({
                name: orgRes.data.organization.name || '',
                description: orgRes.data.organization.description || '',
                category: orgRes.data.organization.category || '',
                email: orgRes.data.organization.email || ''
            });

            const eventsRes = await api.get('/admin/official-org/events');
            setEvents(eventsRes.data.events || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateOrg = async (e) => {
        e.preventDefault();
        try {
            await api.put('/admin/official-org', editForm);
            toast.success('Berhasil diupdate!');
            setEditing(false);
            fetchData();
        } catch (err) {
            toast.error('Gagal: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        if (!createForm.title.trim()) {
            toast.error('Judul event wajib diisi');
            return;
        }
        setCreating(true);
        try {
            await api.post('/admin/official-org/events', createForm);
            toast.success('Event berhasil dibuat!');
            setShowCreateModal(false);
            setCreateForm({ title: '', description: '', category: 'Teknologi' });
            fetchData();
        } catch (err) {
            toast.error('Gagal: ' + (err.response?.data?.error || err.message));
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteEvent = async (eventId, eventTitle) => {
        if (!window.confirm(`Yakin ingin menghapus event "${eventTitle}"? Semua data session dan materi akan ikut terhapus.`)) {
            return;
        }
        try {
            await api.delete(`/admin/official-org/events/${eventId}`);
            toast.success('Event berhasil dihapus!');
            fetchData();
        } catch (err) {
            toast.error('Gagal: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleTogglePublish = async (eventId, currentStatus) => {
        try {
            if (currentStatus === 'PUBLISHED') {
                await api.put(`/admin/official-org/events/${eventId}/unpublish`);
            } else {
                await api.put(`/admin/official-org/events/${eventId}/publish`);
            }
            fetchData();
        } catch (err) {
            toast.error('Gagal: ' + (err.response?.data?.error || err.message));
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    if (loading) {
        return <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Memuat data...</div>;
    }

    if (!org) {
        return (
            <div style={{ padding: "40px", textAlign: "center" }}>
                <h2>⚠️ Official Organization Belum Dibuat</h2>
                <p style={{ color: "#64748b" }}>Jalankan SQL migration untuk membuat Official organization.</p>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: "32px" }}>
                <h1 style={{ margin: "0 0 8px 0", color: "#1e40af", fontSize: "1.75rem" }}>🏛️ Official Organization</h1>
                <p style={{ margin: 0, color: "#64748b" }}>Kelola organisasi official dan event</p>
            </div>

            {/* Org Info Card */}
            <div style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                    <h3 style={{ margin: 0, color: "#1e293b" }}>📋 Informasi Organisasi</h3>
                    <button onClick={() => setEditing(!editing)} style={editing ? buttonSecondary : buttonPrimary}>
                        {editing ? "Batal" : "✏️ Edit"}
                    </button>
                </div>

                {/* Logo Display & Upload */}
                <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px", padding: "16px", background: "#f8fafc", borderRadius: "10px" }}>
                    {org.logo_url ? (
                        <img
                            src={getBackendUrl(org.logo_url)}
                            alt="Logo"
                            style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "12px", border: "2px solid #e2e8f0" }}
                        />
                    ) : (
                        <div style={{ width: "80px", height: "80px", background: "#e2e8f0", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", color: "#94a3b8" }}>
                            🏛️
                        </div>
                    )}
                    <div>
                        <div style={{ fontWeight: "600", marginBottom: "8px" }}>Logo Organisasi</div>
                        <label style={{
                            display: "inline-block",
                            padding: "6px 14px",
                            background: "#3b82f6",
                            color: "white",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.85rem"
                        }}>
                            📷 Upload Logo
                            <input
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    const formData = new FormData();
                                    formData.append('logo', file);
                                    try {
                                        await api.post('/admin/official-org/logo', formData, {
                                            headers: { 'Content-Type': 'multipart/form-data' }
                                        });
                                        toast.success('Logo berhasil diupload!');
                                        fetchData();
                                    } catch (err) {
                                        toast.error('Gagal upload: ' + (err.response?.data?.error || err.message));
                                    }
                                }}
                            />
                        </label>
                    </div>
                </div>

                {editing ? (
                    <form onSubmit={handleUpdateOrg}>
                        <div style={{ display: "grid", gap: "16px" }}>
                            <div>
                                <label style={labelStyle}>Nama Organisasi</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    style={inputStyle}
                                    placeholder="Nama organisasi"
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Deskripsi</label>
                                <textarea
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    style={{ ...inputStyle, minHeight: "100px" }}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Kategori</label>
                                <input
                                    type="text"
                                    value={editForm.category}
                                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Email</label>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <button type="submit" style={buttonPrimary}>💾 Simpan</button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div style={{ display: "grid", gap: "12px" }}>
                        <div style={infoRow}>
                            <span style={{ color: "#64748b" }}>Nama:</span>
                            <span style={{ fontWeight: "600" }}>{org.name}</span>
                        </div>
                        <div style={infoRow}>
                            <span style={{ color: "#64748b" }}>Deskripsi:</span>
                            <span>{org.description || '-'}</span>
                        </div>
                        <div style={infoRow}>
                            <span style={{ color: "#64748b" }}>Kategori:</span>
                            <span>{org.category || '-'}</span>
                        </div>
                        <div style={infoRow}>
                            <span style={{ color: "#64748b" }}>Email:</span>
                            <span>{org.email || '-'}</span>
                        </div>
                        <div style={infoRow}>
                            <span style={{ color: "#64748b" }}>Total Event:</span>
                            <span style={{ fontWeight: "600", color: "#10b981" }}>{org.total_events}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Events List */}
            <div style={{ marginTop: "32px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h3 style={{ margin: 0, color: "#1e293b" }}>📦 Event ({events.length})</h3>
                    <button onClick={() => setShowCreateModal(true)} style={buttonPrimary}>
                        ➕ Buat Event Baru
                    </button>
                </div>

                {events.length === 0 ? (
                    <div style={{ ...cardStyle, textAlign: "center", padding: "40px" }}>
                        <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📭</div>
                        <p style={{ color: "#64748b" }}>Belum ada event</p>
                        <button onClick={() => setShowCreateModal(true)} style={{ ...buttonPrimary, marginTop: "12px" }}>
                            ➕ Buat Event Pertama
                        </button>
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: "16px" }}>
                        {events.map(event => (
                            <div key={event.id} style={cardStyle}>
                                <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                                    {event.thumbnail_url ? (
                                        <img
                                            src={getBackendUrl(event.thumbnail_url)}
                                            alt="Thumbnail"
                                            style={{ width: "100px", height: "70px", objectFit: "cover", borderRadius: "8px" }}
                                        />
                                    ) : (
                                        <div style={{ width: "100px", height: "70px", background: "#e2e8f0", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                                            📷
                                        </div>
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: "0 0 8px 0", color: "#1e293b" }}>{event.title}</h4>
                                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", fontSize: "0.85rem", color: "#64748b", alignItems: "center" }}>
                                            <span>📅 {formatDate(event.created_at)}</span>
                                            <span style={{ padding: "2px 8px", borderRadius: "4px", background: event.category ? '#dbeafe' : '#f1f5f9', color: '#1e40af', fontSize: "0.8rem" }}>
                                                {event.category || 'Tanpa Kategori'}
                                            </span>
                                            <span>📚 {event.sessions_count || 0} sesi</span>
                                            <span>🛒 {event.total_sales || 0} penjualan</span>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                                        {/* Publish Toggle */}
                                        <button
                                            onClick={() => handleTogglePublish(event.id, event.publish_status)}
                                            style={{
                                                padding: "6px 12px",
                                                background: event.publish_status === 'PUBLISHED' ? '#10b981' : '#f59e0b',
                                                color: "white",
                                                border: "none",
                                                borderRadius: "6px",
                                                cursor: "pointer",
                                                fontSize: "0.85rem"
                                            }}
                                        >
                                            {event.publish_status === 'PUBLISHED' ? '✅ Published' : '📝 Draft'}
                                        </button>
                                        <Link
                                            to={`/dashboard/admin/official-org/events/${event.id}`}
                                            style={{
                                                padding: "6px 12px",
                                                background: "#3b82f6",
                                                color: "white",
                                                textDecoration: "none",
                                                borderRadius: "6px",
                                                fontSize: "0.85rem"
                                            }}
                                        >
                                            👁️ Detail
                                        </Link>
                                        <button
                                            onClick={() => handleDeleteEvent(event.id, event.title)}
                                            style={{
                                                padding: "6px 12px",
                                                background: "#ef4444",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "6px",
                                                cursor: "pointer",
                                                fontSize: "0.85rem"
                                            }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Links */}
            <div style={{ marginTop: "32px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <Link to="/dashboard/admin/affiliates" style={linkCard}>
                    🤝 Kelola Pengajuan Affiliate
                </Link>
                <Link to="/dashboard/admin/affiliate-ledgers" style={linkCard}>
                    💰 Buku Besar Affiliate
                </Link>
            </div>

            {/* Create Event Modal */}
            {showCreateModal && (
                <div style={modalOverlay}>
                    <div style={modalContent}>
                        <h3 style={{ margin: "0 0 20px 0" }}>➕ Buat Event Baru</h3>
                        <form onSubmit={handleCreateEvent}>
                            <div style={{ display: "grid", gap: "16px" }}>
                                <div>
                                    <label style={labelStyle}>Judul Event *</label>
                                    <input
                                        type="text"
                                        value={createForm.title}
                                        onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                                        style={inputStyle}
                                        placeholder="Masukkan judul event"
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Deskripsi</label>
                                    <textarea
                                        value={createForm.description}
                                        onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                                        style={{ ...inputStyle, minHeight: "80px" }}
                                        placeholder="Deskripsi event (opsional)"
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Kategori</label>
                                    <select
                                        value={createForm.category}
                                        onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                                        style={inputStyle}
                                    >
                                        <option value="Teknologi">Teknologi</option>
                                        <option value="Bisnis">Bisnis</option>
                                        <option value="Desain">Desain</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Pendidikan">Pendidikan</option>
                                        <option value="Lainnya">Lainnya</option>
                                    </select>
                                </div>
                                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" }}>
                                    <button type="button" onClick={() => setShowCreateModal(false)} style={buttonSecondary}>
                                        Batal
                                    </button>
                                    <button type="submit" disabled={creating} style={buttonPrimary}>
                                        {creating ? 'Menyimpan...' : '💾 Simpan'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const cardStyle = {
    background: "white",
    borderRadius: "12px",
    padding: "24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
};

const infoRow = {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid #f1f5f9"
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
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "0.95rem",
    boxSizing: "border-box"
};

const buttonPrimary = {
    padding: "8px 16px",
    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500"
};

const buttonSecondary = {
    padding: "8px 16px",
    background: "white",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    cursor: "pointer"
};

const linkCard = {
    display: "inline-block",
    padding: "12px 20px",
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    color: "#374151",
    textDecoration: "none",
    fontWeight: "500"
};

const modalOverlay = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000
};

const modalContent = {
    background: "white",
    padding: "24px",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "500px",
    maxHeight: "90vh",
    overflow: "auto"
};
