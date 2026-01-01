import { useState, useEffect } from 'react';
import api from '../../api';

export default function AdminReports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

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
            alert('Gagal update status');
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const statusColors = {
        'PENDING': { bg: '#fef3c7', color: '#b45309' },
        'IN_PROGRESS': { bg: '#dbeafe', color: '#1d4ed8' },
        'RESOLVED': { bg: '#dcfce7', color: '#166534' },
        'CLOSED': { bg: '#f3f4f6', color: '#6b7280' }
    };

    const categoryLabels = {
        'BUG': '🐛 Bug',
        'CONTENT': '📝 Konten',
        'FRAUD': '⚠️ Fraud',
        'SUGGESTION': '💡 Saran',
        'OTHER': '📌 Lainnya'
    };

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
                {['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(status => (
                    <div key={status} style={{
                        background: statusColors[status].bg,
                        padding: "16px",
                        borderRadius: "12px",
                        textAlign: "center",
                        cursor: "pointer",
                        border: filter === status ? `2px solid ${statusColors[status].color}` : "2px solid transparent"
                    }} onClick={() => setFilter(filter === status ? 'ALL' : status)}>
                        <div style={{ fontSize: "1.5rem", fontWeight: "700", color: statusColors[status].color }}>
                            {reports.filter(r => r.status === status).length}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: statusColors[status].color }}>{status}</div>
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
                                        background: statusColors[report.status].bg,
                                        color: statusColors[report.status].color,
                                        padding: "4px 12px",
                                        borderRadius: "20px",
                                        fontSize: "0.8rem",
                                        fontWeight: "600"
                                    }}>
                                        {report.status}
                                    </span>
                                    <span style={{ background: "#f1f5f9", padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem" }}>
                                        {categoryLabels[report.category] || report.category}
                                    </span>
                                </div>
                                <h3 style={{ margin: "0 0 4px 0", color: "#1e293b" }}>{report.subject}</h3>
                                <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem" }}>
                                    {report.user_name || 'Anonim'} • {formatDate(report.created_at)}
                                </p>
                            </div>
                            {report.photo_url && (
                                <img
                                    src={`http://localhost:8080/${report.photo_url}`}
                                    alt="Screenshot"
                                    style={{ width: "80px", height: "60px", objectFit: "cover", borderRadius: "8px" }}
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
                            {report.status === 'PENDING' && (
                                <button onClick={() => updateStatus(report.id, 'IN_PROGRESS', 'Sedang ditangani')}
                                    style={actionBtn('#3b82f6')}>🔄 Proses</button>
                            )}
                            {(report.status === 'PENDING' || report.status === 'IN_PROGRESS') && (
                                <button onClick={() => updateStatus(report.id, 'RESOLVED', 'Masalah sudah diselesaikan')}
                                    style={actionBtn('#10b981')}>✅ Selesai</button>
                            )}
                            {report.status !== 'CLOSED' && (
                                <button onClick={() => updateStatus(report.id, 'CLOSED', 'Ditutup oleh admin')}
                                    style={actionBtn('#6b7280')}>❌ Tutup</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
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
