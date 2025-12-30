import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import QuizBuilder from '../../components/QuizBuilder';

export default function AdminOfficialOrgEventDetail() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState({ title: '', description: '', category: '' });
    const [editingSession, setEditingSession] = useState(null);
    const [editingVideo, setEditingVideo] = useState(null);
    const [editingFile, setEditingFile] = useState(null);
    const [expandedSession, setExpandedSession] = useState(null);
    const [sessionMedia, setSessionMedia] = useState({});
    const [playingVideo, setPlayingVideo] = useState(null);

    // Create Session Modal
    const [showCreateSession, setShowCreateSession] = useState(false);
    const [sessionForm, setSessionForm] = useState({ title: '', description: '', price: 0 });
    const [creating, setCreating] = useState(false);

    // Schedule Modal
    const [showScheduleModal, setShowScheduleModal] = useState(null); // 'event' or session id
    const [scheduleDate, setScheduleDate] = useState('');

    // Quiz Modal
    const [quizSessionId, setQuizSessionId] = useState(null);

    const categories = ['Teknologi', 'Bisnis', 'Pendidikan', 'Desain', 'Marketing', 'Musik', 'Gaming', 'Lifestyle', 'Lainnya'];

    useEffect(() => {
        fetchData();
    }, [eventId]);

    const fetchData = async () => {
        try {
            const response = await api.get(`/admin/official-org/events/${eventId}`);
            setEvent(response.data.event);
            setSessions(response.data.sessions || []);
            setEditForm({
                title: response.data.event.title,
                description: response.data.event.description || '',
                category: response.data.event.category || 'Teknologi'
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSessionMedia = async (sessionId) => {
        try {
            const response = await api.get(`/admin/organizations/0/sessions/${sessionId}/media`);
            setSessionMedia(prev => ({ ...prev, [sessionId]: response.data }));
        } catch (err) {
            console.error(err);
        }
    };

    const toggleSession = (sessionId) => {
        if (expandedSession === sessionId) {
            setExpandedSession(null);
        } else {
            setExpandedSession(sessionId);
            if (!sessionMedia[sessionId]) {
                fetchSessionMedia(sessionId);
            }
        }
    };

    // Event Handlers
    const handleUpdateEvent = async () => {
        try {
            await api.put(`/admin/official-org/events/${eventId}`, editForm);
            setEditMode(false);
            fetchData();
            alert('✅ Event berhasil diupdate');
        } catch (err) {
            alert('❌ Gagal update event');
        }
    };

    const handleUploadThumbnail = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('thumbnail', file);
        try {
            await api.post(`/admin/official-org/events/${eventId}/thumbnail`, formData);
            fetchData();
            alert('✅ Thumbnail berhasil diupdate');
        } catch (err) {
            alert('❌ Gagal upload thumbnail');
        }
    };

    const handlePublishEvent = async () => {
        try {
            await api.put(`/admin/official-org/events/${eventId}/publish`);
            fetchData();
        } catch (err) { alert('❌ Gagal publish'); }
    };

    const handleUnpublishEvent = async () => {
        try {
            await api.put(`/admin/official-org/events/${eventId}/unpublish`);
            fetchData();
        } catch (err) { alert('❌ Gagal unpublish'); }
    };

    const handleScheduleEvent = async () => {
        if (!scheduleDate) { alert('Pilih tanggal'); return; }
        try {
            await api.put(`/admin/official-org/events/${eventId}/schedule`, { publish_at: scheduleDate });
            setShowScheduleModal(null);
            setScheduleDate('');
            fetchData();
            alert('✅ Event dijadwalkan');
        } catch (err) { alert('❌ Gagal schedule'); }
    };

    const handleDeleteEvent = async () => {
        if (!confirm('Hapus event ini beserta semua sesi dan materinya?')) return;
        try {
            await api.delete(`/admin/official-org/events/${eventId}`);
            navigate('/dashboard/admin/official-org');
        } catch (err) { alert('❌ Gagal hapus'); }
    };

    // Session Handlers
    const handleCreateSession = async (e) => {
        e.preventDefault();
        if (!sessionForm.title.trim()) { alert('Judul wajib diisi'); return; }
        setCreating(true);
        try {
            await api.post(`/admin/official-org/events/${eventId}/sessions`, sessionForm);
            setShowCreateSession(false);
            setSessionForm({ title: '', description: '', price: 0 });
            fetchData();
            alert('✅ Session berhasil dibuat');
        } catch (err) { alert('❌ Gagal buat session'); }
        finally { setCreating(false); }
    };

    const handleUpdateSession = async (sessionId, data) => {
        try {
            await api.put(`/admin/official-org/sessions/${sessionId}`, data);
            setEditingSession(null);
            fetchData();
        } catch (err) { alert('❌ Gagal update session'); }
    };

    const handleDeleteSession = async (sessionId) => {
        if (!confirm('Hapus session ini?')) return;
        try {
            await api.delete(`/admin/official-org/sessions/${sessionId}`);
            fetchData();
        } catch (err) { alert('❌ Gagal hapus session'); }
    };

    const handlePublishSession = async (sessionId) => {
        try {
            await api.put(`/admin/official-org/sessions/${sessionId}/publish`);
            fetchData();
        } catch (err) { alert('❌ Gagal'); }
    };

    const handleUnpublishSession = async (sessionId) => {
        try {
            await api.put(`/admin/official-org/sessions/${sessionId}/unpublish`);
            fetchData();
        } catch (err) { alert('❌ Gagal'); }
    };

    const handleScheduleSession = async (sessionId) => {
        if (!scheduleDate) { alert('Pilih tanggal'); return; }
        try {
            await api.put(`/admin/official-org/sessions/${sessionId}/schedule`, { publish_at: scheduleDate });
            setShowScheduleModal(null);
            setScheduleDate('');
            fetchData();
        } catch (err) { alert('❌ Gagal schedule'); }
    };

    // Upload Handlers
    const handleUploadVideo = async (sessionId, e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('video', file);
        formData.append('title', file.name);
        try {
            await api.post(`/admin/official-org/sessions/${sessionId}/videos`, formData);
            fetchSessionMedia(sessionId);
            fetchData();
            alert('✅ Video berhasil diupload');
        } catch (err) { alert('❌ Gagal upload video'); }
    };

    const handleUploadFile = async (sessionId, e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name);
        try {
            await api.post(`/admin/official-org/sessions/${sessionId}/files`, formData);
            fetchSessionMedia(sessionId);
            fetchData();
            alert('✅ File berhasil diupload');
        } catch (err) { alert('❌ Gagal upload file'); }
    };

    const handleUpdateVideo = async (videoId, data) => {
        try {
            await api.put(`/admin/official-org/videos/${videoId}`, data);
            setEditingVideo(null);
            fetchSessionMedia(expandedSession);
        } catch (err) { alert('❌ Gagal update'); }
    };

    const handleDeleteVideo = async (videoId) => {
        if (!confirm('Hapus video?')) return;
        try {
            await api.delete(`/admin/official-org/videos/${videoId}`);
            fetchSessionMedia(expandedSession);
            fetchData();
        } catch (err) { alert('❌ Gagal hapus'); }
    };

    const handleUpdateFile = async (fileId, data) => {
        try {
            await api.put(`/admin/official-org/files/${fileId}`, data);
            setEditingFile(null);
            fetchSessionMedia(expandedSession);
        } catch (err) { alert('❌ Gagal update'); }
    };

    const handleDeleteFile = async (fileId) => {
        if (!confirm('Hapus file?')) return;
        try {
            await api.delete(`/admin/official-org/files/${fileId}`);
            fetchSessionMedia(expandedSession);
            fetchData();
        } catch (err) { alert('❌ Gagal hapus'); }
    };

    const formatPrice = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);
    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Memuat data...</div>;
    if (!event) return <div style={{ padding: "40px", textAlign: "center" }}><h2>⚠️ Event tidak ditemukan</h2><Link to="/dashboard/admin/official-org" style={{ color: "#3b82f6" }}>← Kembali</Link></div>;

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: "24px" }}>
                <Link to="/dashboard/admin/official-org" style={{ color: "#3b82f6", textDecoration: "none", fontSize: "0.9rem", display: "inline-block", marginBottom: "12px" }}>← Kembali ke Official Organization</Link>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                    <div>
                        <h1 style={{ margin: "0 0 8px 0", color: "#1e40af", fontSize: "1.5rem" }}>📦 {event.title}</h1>
                        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                            <span style={{ padding: "4px 12px", borderRadius: "20px", background: event.publish_status === 'PUBLISHED' ? '#d1fae5' : event.publish_status === 'SCHEDULED' ? '#dbeafe' : '#fef3c7', color: event.publish_status === 'PUBLISHED' ? '#047857' : event.publish_status === 'SCHEDULED' ? '#1e40af' : '#b45309', fontWeight: "500" }}>{event.publish_status}</span>
                            <span style={{ color: "#64748b" }}>📅 {formatDate(event.created_at)}</span>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {event.publish_status !== 'PUBLISHED' && <button onClick={handlePublishEvent} style={btnSuccess}>✅ Publish</button>}
                        {event.publish_status === 'PUBLISHED' && <button onClick={handleUnpublishEvent} style={btnWarning}>📝 Unpublish</button>}
                        <button onClick={() => setShowScheduleModal('event')} style={btnSecondary}>📅 Schedule</button>
                        <button onClick={() => setEditMode(!editMode)} style={editMode ? btnDanger : btnPrimary}>{editMode ? '✖ Batal' : '✏️ Edit'}</button>
                        <button onClick={handleDeleteEvent} style={btnDanger}>🗑️</button>
                    </div>
                </div>
            </div>

            {/* Thumbnail */}
            <div style={cardStyle}>
                <h3 style={{ margin: "0 0 16px 0", color: "#1e293b" }}>🖼️ Thumbnail</h3>
                <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", flexWrap: "wrap" }}>
                    {event.thumbnail_url && <img src={`http://localhost:8080/${event.thumbnail_url}`} alt="Thumbnail" style={{ width: "200px", borderRadius: "8px", objectFit: "cover" }} />}
                    <div>
                        <input type="file" accept="image/*" id="thumb-upload" style={{ display: "none" }} onChange={handleUploadThumbnail} />
                        <label htmlFor="thumb-upload" style={{ ...btnSecondary, cursor: "pointer", display: "inline-block" }}>📤 Upload Thumbnail</label>
                    </div>
                </div>
            </div>

            {/* Event Info Edit */}
            <div style={{ ...cardStyle, marginTop: "16px" }}>
                <h3 style={{ margin: "0 0 16px 0", color: "#1e293b" }}>📋 Informasi Event</h3>
                {editMode ? (
                    <div style={{ display: "grid", gap: "16px" }}>
                        <div><label style={labelStyle}>Judul</label><input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} style={inputStyle} /></div>
                        <div><label style={labelStyle}>Kategori</label><select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} style={inputStyle}>{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                        <div><label style={labelStyle}>Deskripsi</label><textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} style={{ ...inputStyle, minHeight: "100px" }} /></div>
                        <button onClick={handleUpdateEvent} style={btnPrimary}>💾 Simpan Perubahan</button>
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: "12px" }}>
                        <div style={infoRow}><span style={{ color: "#64748b" }}>Judul:</span><span style={{ fontWeight: "600" }}>{event.title}</span></div>
                        <div style={infoRow}><span style={{ color: "#64748b" }}>Kategori:</span><span>{event.category || '-'}</span></div>
                        <div style={infoRow}><span style={{ color: "#64748b" }}>Deskripsi:</span><span>{event.description || '-'}</span></div>
                    </div>
                )}
            </div>

            {/* Sessions List */}
            <div style={{ marginTop: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ margin: 0, color: "#1e293b" }}>📚 Sesi & Materi ({sessions.length})</h3>
                    <button onClick={() => setShowCreateSession(true)} style={btnPrimary}>➕ Tambah Session</button>
                </div>

                {sessions.length === 0 ? (
                    <div style={{ ...cardStyle, textAlign: "center", padding: "40px" }}>
                        <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📭</div>
                        <p style={{ color: "#64748b" }}>Belum ada sesi</p>
                        <button onClick={() => setShowCreateSession(true)} style={{ ...btnPrimary, marginTop: "12px" }}>➕ Buat Session Pertama</button>
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: "16px" }}>
                        {sessions.map(session => (
                            <div key={session.id} style={cardStyle}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div style={{ cursor: "pointer", flex: 1 }} onClick={() => toggleSession(session.id)}>
                                        <h4 style={{ margin: "0 0 8px 0", color: "#1e293b" }}>{expandedSession === session.id ? '🔽' : '▶️'} {session.title}</h4>
                                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", fontSize: "0.85rem", color: "#64748b" }}>
                                            <span style={{ padding: "2px 8px", borderRadius: "12px", background: session.publish_status === 'PUBLISHED' ? '#d1fae5' : '#fef3c7', color: session.publish_status === 'PUBLISHED' ? '#047857' : '#b45309' }}>{session.publish_status}</span>
                                            <span>💰 {formatPrice(session.price)}</span>
                                            <span>🎬 {session.videos_count || 0} video</span>
                                            <span>📄 {session.files_count || 0} file</span>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                        {session.publish_status !== 'PUBLISHED' && <button onClick={() => handlePublishSession(session.id)} style={btnSuccessSmall}>✅</button>}
                                        {session.publish_status === 'PUBLISHED' && <button onClick={() => handleUnpublishSession(session.id)} style={btnWarningSmall}>📝</button>}
                                        <button onClick={() => setShowScheduleModal(session.id)} style={btnSecondarySmall}>📅</button>
                                        <button onClick={() => setQuizSessionId(session.id)} style={{ ...btnSecondarySmall, background: '#f0fdf4', border: '1px solid #86efac' }}>📝 Quiz</button>
                                        <button onClick={() => setEditingSession(session.id)} style={btnSecondarySmall}>✏️</button>
                                        <button onClick={() => handleDeleteSession(session.id)} style={btnDangerSmall}>🗑️</button>
                                    </div>
                                </div>

                                {/* Edit Session Form */}
                                {editingSession === session.id && (
                                    <div style={{ marginTop: "16px", padding: "16px", background: "#f8fafc", borderRadius: "8px" }}>
                                        <div style={{ display: "grid", gap: "12px" }}>
                                            <input type="text" defaultValue={session.title} id={`sess-title-${session.id}`} style={inputStyle} placeholder="Judul" />
                                            <textarea defaultValue={session.description || ''} id={`sess-desc-${session.id}`} style={{ ...inputStyle, minHeight: "60px" }} placeholder="Deskripsi" />
                                            <input type="number" defaultValue={session.price} id={`sess-price-${session.id}`} style={inputStyle} placeholder="Harga" />
                                            <div style={{ display: "flex", gap: "8px" }}>
                                                <button onClick={() => handleUpdateSession(session.id, { title: document.getElementById(`sess-title-${session.id}`).value, description: document.getElementById(`sess-desc-${session.id}`).value, price: parseInt(document.getElementById(`sess-price-${session.id}`).value) || 0 })} style={btnPrimary}>💾 Simpan</button>
                                                <button onClick={() => setEditingSession(null)} style={btnSecondary}>Batal</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Expanded Session - Show Media */}
                                {expandedSession === session.id && sessionMedia[session.id] && (
                                    <div style={{ marginTop: "20px", borderTop: "1px solid #e2e8f0", paddingTop: "20px" }}>
                                        {/* Upload Buttons */}
                                        <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                                            <label style={{ ...btnSecondary, cursor: "pointer" }}>
                                                🎬 Upload Video
                                                <input type="file" accept="video/*" style={{ display: "none" }} onChange={(e) => handleUploadVideo(session.id, e)} />
                                            </label>
                                            <label style={{ ...btnSecondary, cursor: "pointer" }}>
                                                📄 Upload File
                                                <input type="file" style={{ display: "none" }} onChange={(e) => handleUploadFile(session.id, e)} />
                                            </label>
                                        </div>

                                        {/* Videos */}
                                        <h5 style={{ margin: "0 0 12px 0" }}>🎬 Video ({sessionMedia[session.id].videos?.length || 0})</h5>
                                        {sessionMedia[session.id].videos?.map(video => (
                                            <div key={video.id} style={{ background: "#f8fafc", borderRadius: "8px", padding: "16px", marginBottom: "12px" }}>
                                                {editingVideo === video.id ? (
                                                    <div style={{ display: "grid", gap: "8px" }}>
                                                        <input type="text" defaultValue={video.title} id={`vid-title-${video.id}`} style={inputStyle} placeholder="Judul" />
                                                        <textarea defaultValue={video.description || ''} id={`vid-desc-${video.id}`} style={{ ...inputStyle, minHeight: "60px" }} placeholder="Deskripsi" />
                                                        <div style={{ display: "flex", gap: "8px" }}>
                                                            <button onClick={() => handleUpdateVideo(video.id, { title: document.getElementById(`vid-title-${video.id}`).value, description: document.getElementById(`vid-desc-${video.id}`).value })} style={btnPrimary}>💾</button>
                                                            <button onClick={() => setEditingVideo(null)} style={btnSecondary}>Batal</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                                            <strong>{video.title}</strong>
                                                            <div style={{ display: "flex", gap: "8px" }}>
                                                                <button onClick={() => setPlayingVideo(playingVideo === video.id ? null : video.id)} style={btnSecondarySmall}>{playingVideo === video.id ? '⏹️' : '▶️'}</button>
                                                                <button onClick={() => setEditingVideo(video.id)} style={btnSecondarySmall}>✏️</button>
                                                                <button onClick={() => handleDeleteVideo(video.id)} style={btnDangerSmall}>🗑️</button>
                                                            </div>
                                                        </div>
                                                        {playingVideo === video.id && (
                                                            <video controls autoPlay style={{ width: "100%", maxHeight: "400px", borderRadius: "8px", marginTop: "8px" }}>
                                                                <source src={`http://localhost:8080/${video.video_url}`} type="video/mp4" />
                                                            </video>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        ))}

                                        {/* Files */}
                                        <h5 style={{ margin: "16px 0 12px 0" }}>📄 File ({sessionMedia[session.id].files?.length || 0})</h5>
                                        {sessionMedia[session.id].files?.map(file => (
                                            <div key={file.id} style={{ background: "#f8fafc", borderRadius: "8px", padding: "16px", marginBottom: "12px" }}>
                                                {editingFile === file.id ? (
                                                    <div style={{ display: "grid", gap: "8px" }}>
                                                        <input type="text" defaultValue={file.title} id={`file-title-${file.id}`} style={inputStyle} placeholder="Judul" />
                                                        <div style={{ display: "flex", gap: "8px" }}>
                                                            <button onClick={() => handleUpdateFile(file.id, { title: document.getElementById(`file-title-${file.id}`).value })} style={btnPrimary}>💾</button>
                                                            <button onClick={() => setEditingFile(null)} style={btnSecondary}>Batal</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <strong>{file.title}</strong>
                                                        <div style={{ display: "flex", gap: "8px" }}>
                                                            <a href={`http://localhost:8080/${file.file_url}`} target="_blank" style={btnSecondarySmall}>📥</a>
                                                            <button onClick={() => setEditingFile(file.id)} style={btnSecondarySmall}>✏️</button>
                                                            <button onClick={() => handleDeleteFile(file.id)} style={btnDangerSmall}>🗑️</button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Session Modal */}
            {showCreateSession && (
                <div style={modalOverlay}>
                    <div style={modalContent}>
                        <h3 style={{ margin: "0 0 20px 0" }}>➕ Buat Session Baru</h3>
                        <form onSubmit={handleCreateSession}>
                            <div style={{ display: "grid", gap: "16px" }}>
                                <div><label style={labelStyle}>Judul *</label><input type="text" value={sessionForm.title} onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })} style={inputStyle} required /></div>
                                <div><label style={labelStyle}>Deskripsi</label><textarea value={sessionForm.description} onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })} style={{ ...inputStyle, minHeight: "80px" }} /></div>
                                <div><label style={labelStyle}>Harga (Rp)</label><input type="number" value={sessionForm.price} onChange={(e) => setSessionForm({ ...sessionForm, price: parseInt(e.target.value) || 0 })} style={inputStyle} /></div>
                                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                                    <button type="button" onClick={() => setShowCreateSession(false)} style={btnSecondary}>Batal</button>
                                    <button type="submit" disabled={creating} style={btnPrimary}>{creating ? 'Menyimpan...' : '💾 Simpan'}</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Schedule Modal */}
            {showScheduleModal && (
                <div style={modalOverlay}>
                    <div style={modalContent}>
                        <h3 style={{ margin: "0 0 20px 0" }}>📅 Jadwal Publish</h3>
                        <div style={{ display: "grid", gap: "16px" }}>
                            <input type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} style={inputStyle} />
                            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                                <button onClick={() => { setShowScheduleModal(null); setScheduleDate(''); }} style={btnSecondary}>Batal</button>
                                <button onClick={() => showScheduleModal === 'event' ? handleScheduleEvent() : handleScheduleSession(showScheduleModal)} style={btnPrimary}>📅 Jadwalkan</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quiz Builder Modal */}
            {quizSessionId && (
                <QuizBuilder
                    sessionId={quizSessionId}
                    apiBase="/admin/official-org"
                    onClose={() => setQuizSessionId(null)}
                    onSave={() => fetchData()}
                />
            )}
        </div>
    );
}

const cardStyle = { background: "white", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" };
const infoRow = { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" };
const inputStyle = { width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "1rem", boxSizing: "border-box" };
const labelStyle = { display: "block", marginBottom: "6px", fontWeight: "500", color: "#374151" };
const btnPrimary = { padding: "10px 20px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500" };
const btnSecondary = { padding: "8px 16px", background: "#f1f5f9", color: "#374151", border: "1px solid #d1d5db", borderRadius: "8px", cursor: "pointer", textDecoration: "none", fontSize: "0.9rem" };
const btnSuccess = { padding: "10px 20px", background: "#10b981", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500" };
const btnWarning = { padding: "10px 20px", background: "#f59e0b", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500" };
const btnDanger = { padding: "10px 20px", background: "#ef4444", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500" };
const btnSecondarySmall = { padding: "6px 10px", background: "#f1f5f9", color: "#374151", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" };
const btnSuccessSmall = { padding: "6px 10px", background: "#10b981", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" };
const btnWarningSmall = { padding: "6px 10px", background: "#f59e0b", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" };
const btnDangerSmall = { padding: "6px 10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" };
const modalOverlay = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalContent = { background: "white", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "500px", maxHeight: "90vh", overflow: "auto" };
