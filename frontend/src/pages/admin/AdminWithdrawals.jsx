import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
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
            toast.success('Penarikan disetujui!');
            setSelectedRequest(null);
            setAdminNotes('');
            fetchRequests();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Gagal approve');
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async () => {
        if (!adminNotes.trim()) {
            toast.error('Berikan alasan penolakan');
            return;
        }
        setProcessing(selectedRequest.id);
        try {
            await api.put(`/admin/withdrawal-requests/${selectedRequest.id}/reject`, { admin_notes: adminNotes });
            toast.success('Penarikan ditolak');
            setSelectedRequest(null);
            setAdminNotes('');
            fetchRequests();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Gagal reject');
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
                .admin-withdrawals h2 { margin-bottom: 24px; color: #1e293b; }
                
                .filter-bar { display: flex; gap: 10px; margin-bottom: 20px; }
                .filter-bar button { padding: 8px 16px; border: 1px solid #e2e8f0; background: white; color: #64748b; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; }
                .filter-bar button:hover { background: #eff6ff; color: #3b82f6; border-color: #bfdbfe; }
                .filter-bar button.active { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border-color: transparent; }
                
                .empty-state { text-align: center; padding: 60px; background: white; border-radius: 12px; color: #64748b; border: 1px solid #e2e8f0; }
                
                .requests-table { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
                .requests-table table { width: 100%; border-collapse: collapse; }
                .requests-table th, .requests-table td { padding: 14px 16px; text-align: left; border-bottom: 1px solid #f1f5f9; }
                .requests-table th { background: #f8fafc; font-weight: 600; font-size: 13px; color: #64748b; text-transform: uppercase; }
                .requests-table td { font-size: 14px; color: #1e293b; }
                .requests-table tr:hover { background: #f8fafc; }
                
                .type-badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
                .type-badge.organization { background: #eff6ff; color: #3b82f6; }
                .type-badge.affiliate { background: #f3e8ff; color: #8b5cf6; }
                
                .amount { color: #16a34a; font-weight: 600; }
                
                .btn-review { background: linear-gradient(135deg, #3b82f6, #2563eb); border: none; color: white; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; }
                .btn-review:hover { opacity: 0.9; }
                .processed-text { font-size: 12px; color: #64748b; max-width: 150px; display: block; overflow: hidden; text-overflow: ellipsis; }
                
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .modal-content { background: white; border-radius: 16px; padding: 28px; width: 100%; max-width: 500px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
                .modal-content h3 { margin: 0 0 20px 0; color: #1e293b; }
                
                .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
                .detail-grid > div { font-size: 14px; color: #1e293b; }
                .detail-grid span { color: #64748b; }
                
                .notes-section { background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #e2e8f0; }
                .notes-section label { font-size: 12px; color: #64748b; display: block; margin-bottom: 4px; }
                .notes-section p { margin: 0; font-size: 14px; color: #1e293b; }
                
                .form-group { margin-bottom: 20px; }
                .form-group label { display: block; margin-bottom: 8px; font-size: 14px; color: #1e293b; }
                .form-group textarea { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; color: #1e293b; min-height: 80px; resize: vertical; }
                .form-group textarea:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
                
                .modal-actions { display: flex; gap: 12px; justify-content: flex-end; }
                .btn-cancel { padding: 10px 20px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; color: #64748b; cursor: pointer; font-weight: 500; }
                .btn-cancel:hover { background: #f8fafc; }
                .btn-reject { padding: 10px 20px; border-radius: 8px; border: none; background: #fef2f2; color: #dc2626; cursor: pointer; font-weight: 500; }
                .btn-reject:hover { background: #fee2e2; }
                .btn-approve { padding: 10px 20px; border-radius: 8px; border: none; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; cursor: pointer; font-weight: 600; }
                .btn-approve:hover { opacity: 0.9; }
            `}</style>
        </div>
    );
}

export default AdminWithdrawals;
