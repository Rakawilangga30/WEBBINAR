import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api";
import { getBackendUrl } from "../../utils/url";

export default function AdminOrgDetail() {
    const { orgId } = useParams();
    const [org, setOrg] = useState(null);
    const [events, setEvents] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState(null);
    const [mediaData, setMediaData] = useState({ videos: [], files: [] });
    const [mediaLoading, setMediaLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});

    useEffect(() => {
        fetchOrgDetail();
    }, [orgId]);

    const fetchOrgDetail = async () => {
        try {
            const res = await api.get(`/admin/organizations/${orgId}`);
            setOrg(res.data.organization);
            setEditForm(res.data.organization);
            setEvents(res.data.events || []);
            setSessions(res.data.sessions || []);
        } catch (error) {
            console.error("Error fetching org detail:", error);
        } finally {
            setLoading(false);
        }
    };

    const getImgUrl = (path) => {
        if (!path) return null;
        if (path.startsWith("http")) return path;
        return getBackendUrl(path);
    };

    const fetchSessionMedia = async (sessionId) => {
        if (selectedSession === sessionId) {
            setSelectedSession(null);
            return;
        }

        setSelectedSession(sessionId);
        setMediaLoading(true);

        try {
            const res = await api.get(`/admin/organizations/${orgId}/sessions/${sessionId}/media`);
            setMediaData({
                videos: res.data.videos || [],
                files: res.data.files || []
            });
        } catch (error) {
            console.error("Error fetching media:", error);
            setMediaData({ videos: [], files: [] });
        } finally {
            setMediaLoading(false);
        }
    };

    const handleSaveEdit = async () => {
        // Validate reason is required
        if (!editForm.reason || !editForm.reason.trim()) {
            toast.error("Alasan perubahan wajib diisi!");
            return;
        }

        try {
            await api.put(`/admin/organizations/${orgId}`, editForm);
            toast.success("Organisasi berhasil diperbarui!");
            setIsEditing(false);
            setEditForm({ ...editForm, reason: "" }); // Clear reason after save
            fetchOrgDetail();
        } catch (error) {
            toast.error("Gagal: " + (error.response?.data?.error || error.message));
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            PUBLISHED: { bg: "#f0fdf4", text: "#16a34a" },
            DRAFT: { bg: "#f1f5f9", text: "#64748b" },
            SCHEDULED: { bg: "#fffbeb", text: "#d97706" }
        };
        const s = styles[status] || styles.DRAFT;
        return (
            <span style={{
                background: s.bg, color: s.text,
                padding: "4px 10px", borderRadius: "6px",
                fontSize: "0.75rem", fontWeight: "600"
            }}>
                {status}
            </span>
        );
    };

    if (loading) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <div style={{
                    width: "32px", height: "32px",
                    border: "3px solid #e2e8f0", borderTopColor: "#3b82f6",
                    borderRadius: "50%", animation: "spin 1s linear infinite",
                    margin: "0 auto 12px"
                }}></div>
                Memuat detail organisasi...
            </div>
        );
    }

    if (!org) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#dc2626" }}>
                Organisasi tidak ditemukan
            </div>
        );
    }

    return (
        <div>
            {/* Back Button */}
            <Link to="/dashboard/admin/organizations" style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                color: "#3b82f6", textDecoration: "none", marginBottom: "20px",
                fontWeight: "500"
            }}>
                ← Kembali ke List
            </Link>

            {/* Org Info Card */}
            <div style={{
                background: "white", borderRadius: "12px", padding: "24px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", marginBottom: "24px"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                    <h3 style={{ margin: 0, color: "#1e293b" }}>ℹ️ Informasi Organisasi</h3>
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        style={{
                            padding: "8px 16px",
                            background: isEditing ? "#f1f5f9" : "linear-gradient(135deg, #f59e0b, #d97706)",
                            color: isEditing ? "#64748b" : "white",
                            border: "none", borderRadius: "8px",
                            cursor: "pointer", fontWeight: "500"
                        }}
                    >
                        {isEditing ? "Batal" : "✏️ Edit"}
                    </button>
                </div>

                {isEditing ? (
                    <div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
                            <div>
                                <label style={labelStyle}>Nama Organisasi</label>
                                <input type="text" value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Kategori</label>
                                <input type="text" value={editForm.category || ""} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Email</label>
                                <input type="email" value={editForm.email || ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Phone</label>
                                <input type="text" value={editForm.phone || ""} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Website</label>
                                <input type="url" value={editForm.website || ""} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} style={inputStyle} />
                            </div>
                            <div style={{ gridColumn: "1 / -1" }}>
                                <label style={labelStyle}>Deskripsi</label>
                                <textarea value={editForm.description || ""} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} style={{ ...inputStyle, minHeight: "80px" }} />
                            </div>
                            <div style={{ gridColumn: "1 / -1" }}>
                                <label style={{ ...labelStyle, color: "#dc2626" }}>📝 Alasan Perubahan *</label>
                                <textarea
                                    value={editForm.reason || ""}
                                    onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                                    placeholder="Jelaskan alasan perubahan (akan dikirim ke owner via notifikasi)"
                                    style={{ ...inputStyle, minHeight: "60px", borderColor: "#fecaca" }}
                                />
                            </div>
                        </div>
                        <button onClick={handleSaveEdit} style={{
                            marginTop: "16px", padding: "12px 24px",
                            background: "linear-gradient(135deg, #22c55e, #16a34a)",
                            color: "white", border: "none", borderRadius: "8px",
                            cursor: "pointer", fontWeight: "600"
                        }}>
                            💾 Simpan Perubahan
                        </button>
                    </div>
                ) : (
                    <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
                        <div style={{
                            width: "80px", height: "80px", borderRadius: "12px",
                            background: "#f1f5f9", overflow: "hidden",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                        }}>
                            {org.logo_url ? (
                                <img src={getImgUrl(org.logo_url)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                                <span style={{ fontSize: "2.5rem" }}>🏢</span>
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h2 style={{ margin: "0 0 8px 0", color: "#1e293b" }}>{org.name}</h2>
                            <span style={{
                                background: "#eff6ff", color: "#3b82f6",
                                padding: "4px 12px", borderRadius: "6px",
                                fontSize: "0.85rem", fontWeight: "500"
                            }}>
                                {org.category || "Uncategorized"}
                            </span>
                            <p style={{ color: "#64748b", marginTop: "12px", lineHeight: "1.5" }}>
                                {org.description || "Tidak ada deskripsi"}
                            </p>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginTop: "16px" }}>
                                <div>
                                    <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Email</div>
                                    <div style={{ color: "#1e293b" }}>{org.email || "-"}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Phone</div>
                                    <div style={{ color: "#1e293b" }}>{org.phone || "-"}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Website</div>
                                    <div style={{ color: "#1e293b" }}>{org.website || "-"}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Owner Card */}
            <div style={{
                background: "white", borderRadius: "12px", padding: "20px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", marginBottom: "24px"
            }}>
                <h3 style={{ margin: "0 0 16px 0", color: "#1e293b" }}>👤 Pemilik Organisasi</h3>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontWeight: "600", color: "#1e293b", fontSize: "1.1rem" }}>{org.owner_name}</div>
                        <div style={{ color: "#64748b" }}>{org.owner_email}</div>
                    </div>
                    <Link to={`/dashboard/admin/users/${org.owner_id}`} style={{
                        padding: "10px 20px",
                        background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                        color: "white", textDecoration: "none", borderRadius: "8px",
                        fontWeight: "500", fontSize: "0.9rem"
                    }}>
                        📋 Lihat Detail User
                    </Link>
                </div>
            </div>

            {/* Events & Sessions */}
            <div style={{
                background: "white", borderRadius: "12px", padding: "24px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            }}>
                <h3 style={{ margin: "0 0 20px 0", color: "#1e293b" }}>
                    📅 Events ({events.length})
                </h3>

                {events.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                        Tidak ada event
                    </div>
                ) : (
                    events.map(event => (
                        <div key={event.id} style={{
                            border: "1px solid #e2e8f0", borderRadius: "10px",
                            padding: "16px", marginBottom: "16px"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{
                                        width: "50px", height: "50px", borderRadius: "8px",
                                        background: "#f1f5f9", overflow: "hidden"
                                    }}>
                                        {event.thumbnail_url ? (
                                            <img src={getImgUrl(event.thumbnail_url)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        ) : (
                                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>📅</div>
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: "600", color: "#1e293b" }}>{event.title}</div>
                                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                            {sessions.filter(s => s.event_id === event.id).length} sesi
                                        </div>
                                    </div>
                                </div>
                                {getStatusBadge(event.publish_status)}
                            </div>

                            {/* Sessions */}
                            <div style={{ paddingLeft: "16px", borderLeft: "2px solid #e2e8f0" }}>
                                {sessions.filter(s => s.event_id === event.id).map(session => (
                                    <div key={session.id}>
                                        <div style={{
                                            display: "flex", justifyContent: "space-between", alignItems: "center",
                                            padding: "10px 0", borderBottom: "1px solid #f1f5f9"
                                        }}>
                                            <div>
                                                <span style={{ fontWeight: "500", color: "#1e293b" }}>{session.title}</span>
                                                <span style={{ marginLeft: "8px", color: "#64748b", fontSize: "0.85rem" }}>
                                                    Rp {session.price.toLocaleString("id-ID")}
                                                </span>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                {getStatusBadge(session.publish_status)}
                                                <button
                                                    onClick={() => fetchSessionMedia(session.id)}
                                                    style={{
                                                        padding: "6px 12px",
                                                        background: selectedSession === session.id ? "#dc2626" : "#16a34a",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "6px",
                                                        fontSize: "0.8rem",
                                                        fontWeight: "500",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    {selectedSession === session.id ? "Tutup" : "🔍 Preview"}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Media Preview */}
                                        {selectedSession === session.id && (
                                            <div style={{
                                                background: "#f8fafc", borderRadius: "8px",
                                                padding: "16px", marginTop: "10px", marginBottom: "10px"
                                            }}>
                                                {mediaLoading ? (
                                                    <div style={{ textAlign: "center", color: "#64748b" }}>Loading media...</div>
                                                ) : (
                                                    <>
                                                        <div style={{ marginBottom: "12px" }}>
                                                            <div style={{ fontWeight: "600", color: "#1e293b", marginBottom: "8px" }}>
                                                                🎬 Videos ({mediaData.videos.length})
                                                            </div>
                                                            {mediaData.videos.length === 0 ? (
                                                                <div style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Tidak ada video</div>
                                                            ) : (
                                                                mediaData.videos.map(video => (
                                                                    <div key={video.id} style={{
                                                                        display: "flex", justifyContent: "space-between", alignItems: "center",
                                                                        background: "white", padding: "10px", borderRadius: "6px", marginBottom: "6px"
                                                                    }}>
                                                                        <span>{video.title}</span>
                                                                        <a
                                                                            href={getBackendUrl(video.video_url)}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            style={{ color: "#3b82f6", fontSize: "0.85rem" }}
                                                                        >
                                                                            ▶️ Play
                                                                        </a>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: "600", color: "#1e293b", marginBottom: "8px" }}>
                                                                📄 Files ({mediaData.files.length})
                                                            </div>
                                                            {mediaData.files.length === 0 ? (
                                                                <div style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Tidak ada file</div>
                                                            ) : (
                                                                mediaData.files.map(file => (
                                                                    <div key={file.id} style={{
                                                                        display: "flex", justifyContent: "space-between", alignItems: "center",
                                                                        background: "white", padding: "10px", borderRadius: "6px", marginBottom: "6px"
                                                                    }}>
                                                                        <span>{file.title}</span>
                                                                        <a
                                                                            href={getBackendUrl(file.file_url)}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            style={{ color: "#3b82f6", fontSize: "0.85rem" }}
                                                                        >
                                                                            📥 Download
                                                                        </a>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

const labelStyle = { display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#374151", marginBottom: "4px" };
const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.95rem", boxSizing: "border-box" };
