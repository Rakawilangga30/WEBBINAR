import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

export default function AdminOfficialOrg() {
    const [org, setOrg] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({ description: '', category: '', email: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Get Official org info
            const orgRes = await api.get('/admin/official-org');
            setOrg(orgRes.data.organization);
            setEditForm({
                description: orgRes.data.organization.description || '',
                category: orgRes.data.organization.category || '',
                email: orgRes.data.organization.email || ''
            });

            // Get events under Official org
            const eventsRes = await api.get(`/admin/organizations/${orgRes.data.organization.id}`);
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
            alert('✅ Berhasil diupdate!');
            setEditing(false);
            fetchData();
        } catch (err) {
            alert('Gagal: ' + (err.response?.data?.error || err.message));
        }
    };

    const formatPrice = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);
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
                <p style={{ margin: 0, color: "#64748b" }}>Kelola organisasi official dan event affiliate</p>
            </div>

            {/* Org Info Card */}
            <div style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                    <h3 style={{ margin: 0, color: "#1e293b" }}>📋 Informasi Organisasi</h3>
                    <button onClick={() => setEditing(!editing)} style={editing ? buttonSecondary : buttonPrimary}>
                        {editing ? "Batal" : "✏️ Edit"}
                    </button>
                </div>

                {editing ? (
                    <form onSubmit={handleUpdateOrg}>
                        <div style={{ display: "grid", gap: "16px" }}>
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
                <h3 style={{ margin: "0 0 20px 0", color: "#1e293b" }}>📦 Event Affiliate ({events.length})</h3>

                {events.length === 0 ? (
                    <div style={{ ...cardStyle, textAlign: "center", padding: "40px" }}>
                        <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📭</div>
                        <p style={{ color: "#64748b" }}>Belum ada event affiliate yang disetujui</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: "16px" }}>
                        {events.map(event => (
                            <div key={event.id} style={cardStyle}>
                                <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                                    {event.thumbnail_url ? (
                                        <img
                                            src={`http://localhost:8080/${event.thumbnail_url}`}
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
                                        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "0.9rem", color: "#64748b" }}>
                                            <span>📅 {formatDate(event.created_at)}</span>
                                            <span>📊 {event.publish_status}</span>
                                            {event.sessions_count && <span>📚 {event.sessions_count} session</span>}
                                        </div>
                                    </div>
                                    <Link
                                        to={`/dashboard/admin/organizations/${org.id}`}
                                        style={{ color: "#3b82f6", textDecoration: "none", fontWeight: "500" }}
                                    >
                                        Detail →
                                    </Link>
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
