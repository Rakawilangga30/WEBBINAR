import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api';
import { getBackendUrl } from '../../utils/url';

export default function AdminReports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await api.get('/admin/reports');
            setReports(res.data.reports || []);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status, notes = '') => {
        try {
            await api.put(`/admin/reports/${id}`, { status, admin_notes: notes });
            fetchReports();
        } catch (error) {
            toast.error('Gagal update status');
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        // MySQL datetime is stored as local time, parse it correctly
        // Format: "2026-01-02T18:30:00Z" or "2026-01-02 18:30:00"
        let date = new Date(dateStr);

        // If the date string doesn't have timezone info, MySQL returns local time
        // but JS might interpret it as UTC. Add 7 hours to correct.
        if (!dateStr.includes('+') && dateStr.includes('T')) {
            // Datetime with T but no timezone - likely being parsed as UTC
            date = new Date(date.getTime() + (7 * 60 * 60 * 1000));
        }

        const options = {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };
        return date.toLocaleDateString('id-ID', options);
    };

    const statusColors = {
        'pending': { bg: '#fef3c7', color: '#b45309' },
        'in_progress': { bg: '#dbeafe', color: '#1d4ed8' },
        'resolved': { bg: '#dcfce7', color: '#166534' },
        'rejected': { bg: '#fee2e2', color: '#dc2626' },
        'closed': { bg: '#f3f4f6', color: '#6b7280' }
    };

    const defaultColor = { bg: '#f3f4f6', color: '#6b7280' };
    const getStatusColor = (status) => statusColors[status] || defaultColor;

    const categoryLabels = {
        'BUG': '🐛 Bug',
        'CONTENT': '📝 Konten',
        'FRAUD': '⚠️ Fraud',
        'SUGGESTION': '💡 Saran',
        'OTHER': '📌 Lainnya',
        'general': '📌 Umum'
    };

    const statusList = ['pending', 'in_progress', 'resolved', 'rejected'];

    const filteredReports = filter === 'ALL'
        ? reports
        : reports.filter(r => r.status === filter);

    if (loading) {
        return <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Memuat laporan...</div>;
    }

    return (
        <div>
            <div style={{ marginBottom: "32px" }}>
                <h1 style={{ margin: "0 0 8px 0", color: "#1e293b", fontSize: "1.75rem" }}>📢 Kelola Laporan</h1>
                <p style={{ margin: 0, color: "#64748b" }}>Tangani laporan dari pengguna</p>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
                {statusList.map(status => (
                    <div key={status} style={{
                        background: getStatusColor(status).bg,
                        padding: "16px",
                        borderRadius: "12px",
                        textAlign: "center",
                        cursor: "pointer",
                        border: filter === status ? `2px solid ${getStatusColor(status).color}` : "2px solid transparent"
                    }} onClick={() => setFilter(filter === status ? 'ALL' : status)}>
                        <div style={{ fontSize: "1.5rem", fontWeight: "700", color: getStatusColor(status).color }}>
                            {reports.filter(r => r.status === status).length}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: getStatusColor(status).color, textTransform: "capitalize" }}>
                            {status.replace('_', ' ')}
                        </div>
                    </div>
                ))}
            </div>

            {/* Reports List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {filteredReports.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px", background: "#f8fafc", borderRadius: "12px" }}>
                        <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📭</div>
                        <div style={{ color: "#64748b" }}>Tidak ada laporan</div>
                    </div>
                ) : filteredReports.map(report => (
                    <div key={report.id} style={{
                        background: "white",
                        borderRadius: "12px",
                        padding: "20px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                        border: "1px solid #e2e8f0"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                                    <span style={{
                                        background: getStatusColor(report.status).bg,
                                        color: getStatusColor(report.status).color,
                                        padding: "4px 12px",
                                        borderRadius: "20px",
                                        fontSize: "0.8rem",
                                        fontWeight: "600",
                                        textTransform: "capitalize"
                                    }}>
                                        {report.status.replace('_', ' ')}
                                    </span>
                                    <span style={{ background: "#f1f5f9", padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem" }}>
                                        {categoryLabels[report.category] || report.category}
                                    </span>
                                </div>
                                <h3 style={{ margin: "0 0 4px 0", color: "#1e293b" }}>{report.subject}</h3>
                                <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem" }}>
                                    <span style={{ fontWeight: "600", color: "#374151" }}>
                                        {report.user_name || 'Pengguna Tidak Diketahui'}
                                    </span>
                                    {report.user_email && (
                                        <span style={{ color: "#94a3b8" }}> ({report.user_email})</span>
                                    )}
                                    <span style={{ margin: "0 8px", color: "#cbd5e1" }}>•</span>
                                    {formatDate(report.created_at)}
                                </p>
                            </div>
                            {report.photo_url && (
                                <img
                                    src={getBackendUrl(report.photo_url)}
                                    alt="Screenshot"
                                    onClick={() => setSelectedImage(getBackendUrl(report.photo_url))}
                                    style={{
                                        width: "80px",
                                        height: "60px",
                                        objectFit: "cover",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        transition: "transform 0.2s ease, box-shadow 0.2s ease",
                                        border: "2px solid #e2e8f0"
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.transform = "scale(1.05)";
                                        e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.transform = "scale(1)";
                                        e.target.style.boxShadow = "none";
                                    }}
                                />
                            )}
                        </div>

                        <p style={{ margin: "0 0 16px 0", color: "#374151", lineHeight: "1.6" }}>{report.description}</p>

                        {report.admin_notes && (
                            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
                                <strong style={{ color: "#64748b", fontSize: "0.85rem" }}>Admin Note:</strong>
                                <p style={{ margin: "4px 0 0 0", color: "#374151" }}>{report.admin_notes}</p>
                            </div>
                        )}

                        <div style={{ display: "flex", gap: "8px" }}>
                            {report.status === 'pending' && (
                                <button onClick={() => updateStatus(report.id, 'in_progress', 'Sedang ditangani')}
                                    style={actionBtn('#3b82f6')}>🔄 Proses</button>
                            )}
                            {(report.status === 'pending' || report.status === 'in_progress') && (
                                <button onClick={() => updateStatus(report.id, 'resolved', 'Masalah sudah diselesaikan')}
                                    style={actionBtn('#10b981')}>✅ Selesai</button>
                            )}
                            {report.status !== 'resolved' && report.status !== 'rejected' && (
                                <button onClick={() => updateStatus(report.id, 'rejected', 'Ditolak oleh admin')}
                                    style={actionBtn('#6b7280')}>❌ Tolak</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Image Preview Modal */}
            {selectedImage && (
                <div
                    onClick={() => setSelectedImage(null)}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0,0,0,0.85)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        cursor: "zoom-out",
                        padding: "40px"
                    }}
                >
                    <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
                        <img
                            src={selectedImage}
                            alt="Preview"
                            style={{
                                maxWidth: "100%",
                                maxHeight: "85vh",
                                objectFit: "contain",
                                borderRadius: "12px",
                                boxShadow: "0 20px 60px rgba(0,0,0,0.5)"
                            }}
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button
                            onClick={() => setSelectedImage(null)}
                            style={{
                                position: "absolute",
                                top: "-15px",
                                right: "-15px",
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                background: "white",
                                border: "none",
                                fontSize: "1.2rem",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
                            }}
                        >
                            ✕
                        </button>
                        <div style={{
                            textAlign: "center",
                            marginTop: "16px",
                            color: "white",
                            fontSize: "0.9rem",
                            opacity: 0.8
                        }}>
                            Klik di luar gambar atau tombol ✕ untuk menutup
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const actionBtn = (color) => ({
    padding: "8px 16px",
    background: color,
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "0.85rem"
});

