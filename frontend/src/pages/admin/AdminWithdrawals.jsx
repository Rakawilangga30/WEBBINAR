import { useState, useEffect } from 'react';
import api from '../../api';

function AdminWithdrawals() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [processing, setProcessing] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');

    useEffect(() => {
        fetchRequests();
    }, [filter]);

    const fetchRequests = async () => {
        try {
            const res = await api.get(`/admin/withdrawal-requests${filter ? `?status=${filter}` : ''}`);
            setRequests(res.data);
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        setProcessing(selectedRequest.id);
        try {
            await api.put(`/admin/withdrawal-requests/${selectedRequest.id}/approve`, { admin_notes: adminNotes });
            alert('Penarikan disetujui!');
            setSelectedRequest(null);
            setAdminNotes('');
            fetchRequests();
        } catch (err) {
            alert(err.response?.data?.error || 'Gagal approve');
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async () => {
        if (!adminNotes.trim()) {
            alert('Berikan alasan penolakan');
            return;
        }
        setProcessing(selectedRequest.id);
        try {
            await api.put(`/admin/withdrawal-requests/${selectedRequest.id}/reject`, { admin_notes: adminNotes });
            alert('Penarikan ditolak');
            setSelectedRequest(null);
            setAdminNotes('');
            fetchRequests();
        } catch (err) {
            alert(err.response?.data?.error || 'Gagal reject');
        } finally {
            setProcessing(null);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            PENDING: { bg: '#f39c12', text: 'Menunggu' },
            APPROVED: { bg: '#27ae60', text: 'Disetujui' },
            REJECTED: { bg: '#e74c3c', text: 'Ditolak' }
        };
        const s = styles[status] || { bg: '#888', text: status };
        return <span style={{ background: s.bg, padding: '4px 12px', borderRadius: '4px', fontSize: '12px', color: 'white', fontWeight: '600' }}>{s.text}</span>;
    };

    const formatCurrency = (amount) => `Rp ${amount?.toLocaleString('id-ID') || 0}`;

    if (loading) return <div className="loading-spinner">Loading...</div>;

    return (
        <div className="admin-withdrawals">
            <h2>💰 Kelola Permintaan Penarikan</h2>

            <div className="filter-bar">
                <button onClick={() => setFilter('')} className={filter === '' ? 'active' : ''}>Semua</button>
                <button onClick={() => setFilter('PENDING')} className={filter === 'PENDING' ? 'active' : ''}>Menunggu</button>
                <button onClick={() => setFilter('APPROVED')} className={filter === 'APPROVED' ? 'active' : ''}>Disetujui</button>
                <button onClick={() => setFilter('REJECTED')} className={filter === 'REJECTED' ? 'active' : ''}>Ditolak</button>
            </div>

            {requests.length === 0 ? (
                <div className="empty-state">Tidak ada data</div>
            ) : (
                <div className="requests-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Tipe</th>
                                <th>Nama</th>
                                <th>Jumlah</th>
                                <th>Bank</th>
                                <th>No Rekening</th>
                                <th>Tanggal</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((req) => (
                                <tr key={req.id}>
                                    <td><span className={`type-badge ${req.requester_type.toLowerCase()}`}>{req.requester_type}</span></td>
                                    <td>{req.requester_name}</td>
                                    <td className="amount">{formatCurrency(req.amount)}</td>
                                    <td>{req.bank_name}</td>
                                    <td>{req.bank_account}<br /><small>{req.bank_account_name}</small></td>
                                    <td>{new Date(req.created_at).toLocaleDateString('id-ID')}</td>
                                    <td>{getStatusBadge(req.status)}</td>
                                    <td>
                                        {req.status === 'PENDING' ? (
                                            <button onClick={() => { setSelectedRequest(req); setAdminNotes(''); }} className="btn-review">
                                                Review
                                            </button>
                                        ) : (
                                            <span className="processed-text">{req.admin_notes || '-'}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Review Modal */}
            {selectedRequest && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Review Penarikan</h3>
                        <div className="detail-grid">
                            <div><span>Tipe:</span> <strong>{selectedRequest.requester_type}</strong></div>
                            <div><span>Nama:</span> <strong>{selectedRequest.requester_name}</strong></div>
                            <div><span>Jumlah:</span> <strong className="amount">{formatCurrency(selectedRequest.amount)}</strong></div>
                            <div><span>Bank:</span> <strong>{selectedRequest.bank_name}</strong></div>
                            <div><span>No Rek:</span> <strong>{selectedRequest.bank_account}</strong></div>
                            <div><span>Atas Nama:</span> <strong>{selectedRequest.bank_account_name}</strong></div>
                        </div>
                        {selectedRequest.notes && (
                            <div className="notes-section">
                                <label>Catatan dari Pemohon:</label>
                                <p>{selectedRequest.notes}</p>
                            </div>
                        )}
                        <div className="form-group">
                            <label>Catatan Admin (wajib untuk penolakan):</label>
                            <textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Contoh: Transfer berhasil tanggal XX / Alasan ditolak..."
                            />
                        </div>
                        <div className="modal-actions">
                            <button onClick={() => setSelectedRequest(null)} className="btn-cancel">Batal</button>
                            <button onClick={handleReject} disabled={processing} className="btn-reject">
                                {processing ? '...' : '❌ Tolak'}
                            </button>
                            <button onClick={handleApprove} disabled={processing} className="btn-approve">
                                {processing ? '...' : '✅ Setujui'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .admin-withdrawals { max-width: 1200px; margin: 0 auto; padding: 20px; }
                .admin-withdrawals h2 { margin-bottom: 24px; }
                
                .filter-bar { display: flex; gap: 10px; margin-bottom: 20px; }
                .filter-bar button { padding: 8px 16px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: var(--text-muted, #888); border-radius: 8px; cursor: pointer; transition: all 0.2s ease; }
                .filter-bar button:hover { background: rgba(59, 130, 246, 0.1); color: #60a5fa; }
                .filter-bar button.active { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border-color: transparent; }
                
                .empty-state { text-align: center; padding: 60px; background: var(--card-bg, #1a1a2e); border-radius: 12px; color: var(--text-muted, #888); }
                
                .requests-table { background: var(--card-bg, #1a1a2e); border-radius: 12px; overflow: hidden; }
                .requests-table table { width: 100%; border-collapse: collapse; }
                .requests-table th, .requests-table td { padding: 14px 16px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .requests-table th { background: rgba(0,0,0,0.2); font-weight: 600; font-size: 13px; color: var(--text-muted, #888); text-transform: uppercase; }
                .requests-table td { font-size: 14px; }
                .requests-table tr:hover { background: rgba(255,255,255,0.02); }
                
                .type-badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
                .type-badge.organization { background: #3b82f6; color: white; }
                .type-badge.affiliate { background: #8b5cf6; color: white; }
                
                .amount { color: #2ed573; font-weight: 600; }
                
                .btn-review { background: #3b82f6; border: none; color: white; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; }
                .processed-text { font-size: 12px; color: var(--text-muted, #888); max-width: 150px; display: block; overflow: hidden; text-overflow: ellipsis; }
                
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .modal-content { background: var(--card-bg, #1a1a2e); border-radius: 16px; padding: 28px; width: 100%; max-width: 500px; }
                .modal-content h3 { margin: 0 0 20px 0; }
                
                .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
                .detail-grid > div { font-size: 14px; }
                .detail-grid span { color: var(--text-muted, #888); }
                
                .notes-section { background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; margin-bottom: 16px; }
                .notes-section label { font-size: 12px; color: var(--text-muted, #888); display: block; margin-bottom: 4px; }
                .notes-section p { margin: 0; font-size: 14px; }
                
                .form-group { margin-bottom: 20px; }
                .form-group label { display: block; margin-bottom: 8px; font-size: 14px; }
                .form-group textarea { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color, #333); background: var(--bg-color, #0f0f23); color: white; min-height: 80px; resize: vertical; }
                
                .modal-actions { display: flex; gap: 12px; justify-content: flex-end; }
                .btn-cancel { padding: 10px 20px; border-radius: 8px; border: 1px solid var(--border-color, #333); background: transparent; color: white; cursor: pointer; }
                .btn-reject { padding: 10px 20px; border-radius: 8px; border: none; background: #e74c3c; color: white; cursor: pointer; }
                .btn-approve { padding: 10px 20px; border-radius: 8px; border: none; background: #27ae60; color: white; cursor: pointer; font-weight: 600; }
            `}</style>
        </div>
    );
}

export default AdminWithdrawals;
