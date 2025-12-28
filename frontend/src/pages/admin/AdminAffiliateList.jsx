import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

export default function AdminAffiliateList() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchSubmissions();
    fetchStats();
  }, [statusFilter]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const response = await api.get(`/admin/affiliate/submissions${params}`);
      setSubmissions(response.data.submissions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/affiliate/stats');
      setStats(response.data.stats);
    } catch (err) {
      console.error(err);
    }
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: { bg: '#fef3cd', color: '#856404', text: '⏳ Pending' },
      APPROVED: { bg: '#d4edda', color: '#155724', text: '✅ Disetujui' },
      REJECTED: { bg: '#f8d7da', color: '#721c24', text: '❌ Ditolak' }
    };
    const style = styles[status] || styles.PENDING;
    return (
      <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '500', backgroundColor: style.bg, color: style.color }}>
        {style.text}
      </span>
    );
  };

  return (
    <div className="admin-affiliate-page">
      <div className="page-header">
        <h1>🤝 Pengajuan Event Affiliate</h1>
        <p>Review dan approve event yang diajukan oleh user</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-number">{stats.total_submissions || 0}</div>
            <div className="stat-label">Total Pengajuan</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-number">{stats.pending_submissions || 0}</div>
            <div className="stat-label">Menunggu Review</div>
          </div>
          <div className="stat-card approved">
            <div className="stat-number">{stats.approved_submissions || 0}</div>
            <div className="stat-label">Disetujui</div>
          </div>
          <div className="stat-card revenue">
            <div className="stat-number">{formatPrice(stats.total_revenue || 0)}</div>
            <div className="stat-label">Total Pendapatan</div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button className={`tab ${statusFilter === '' ? 'active' : ''}`} onClick={() => setStatusFilter('')}>Semua</button>
        <button className={`tab ${statusFilter === 'PENDING' ? 'active' : ''}`} onClick={() => setStatusFilter('PENDING')}>Pending</button>
        <button className={`tab ${statusFilter === 'APPROVED' ? 'active' : ''}`} onClick={() => setStatusFilter('APPROVED')}>Disetujui</button>
        <button className={`tab ${statusFilter === 'REJECTED' ? 'active' : ''}`} onClick={() => setStatusFilter('REJECTED')}>Ditolak</button>
      </div>

      {/* Quick Links */}
      <div className="quick-links">
        <Link to="/dashboard/admin/affiliate-ledgers" className="link-card">💰 Lihat Buku Besar Affiliate</Link>
      </div>

      {loading ? (
        <div className="loading-state">Memuat data...</div>
      ) : submissions.length === 0 ? (
        <div className="empty-state"><span>📭</span><p>Belum ada pengajuan event</p></div>
      ) : (
        <div className="list">
          {submissions.map(submission => (
            <div key={submission.id} className="card">
              <div className="card-header">
                <h3>{submission.event_title}</h3>
                {getStatusBadge(submission.status)}
              </div>
              <div className="card-body">
                <div className="info-row">
                  <span className="label">👤 Pengaju:</span>
                  <span className="value">{submission.full_name}</span>
                </div>
                <div className="info-row">
                  <span className="label">📧 Email:</span>
                  <span className="value">{submission.email}</span>
                </div>
                <div className="info-row">
                  <span className="label">💰 Harga:</span>
                  <span className="value price">{formatPrice(submission.event_price)}</span>
                </div>
                <div className="info-row">
                  <span className="label">📎 Materi:</span>
                  <span className="value">
                    {submission.has_video && '🎬 Video '}
                    {submission.has_file && '📄 File'}
                    {!submission.has_video && !submission.has_file && '-'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">📅 Diajukan:</span>
                  <span className="value">{formatDate(submission.created_at)}</span>
                </div>
              </div>
              <div className="card-footer">
                <Link to={`/dashboard/admin/affiliates/${submission.id}`} className="view-btn">Lihat Detail & Review →</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .admin-affiliate-page { padding: 0; }
        .page-header { margin-bottom: 2rem; }
        .page-header h1 { color: #1e40af; margin-bottom: 0.5rem; font-size: 1.75rem; }
        .page-header p { color: #64748b; }

        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .stat-card { background: white; border-radius: 12px; padding: 1.5rem; text-align: center; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .stat-card.total { border-left: 4px solid #3b82f6; }
        .stat-card.pending { border-left: 4px solid #f59e0b; }
        .stat-card.approved { border-left: 4px solid #10b981; }
        .stat-card.revenue { border-left: 4px solid #8b5cf6; }
        .stat-number { font-size: 1.5rem; font-weight: 700; color: #1e293b; }
        .stat-label { color: #64748b; font-size: 0.85rem; margin-top: 0.5rem; }

        .filter-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .tab { padding: 0.5rem 1rem; background: white; border: 1px solid #e2e8f0; border-radius: 8px; color: #64748b; cursor: pointer; transition: all 0.3s ease; font-size: 0.9rem; }
        .tab:hover { background: #f1f5f9; border-color: #cbd5e1; }
        .tab.active { background: #3b82f6; color: white; border-color: #3b82f6; }

        .quick-links { margin-bottom: 1.5rem; }
        .link-card { display: inline-block; padding: 0.75rem 1.5rem; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; color: #92400e; text-decoration: none; font-weight: 500; transition: all 0.3s ease; }
        .link-card:hover { background: #fde68a; }

        .loading-state, .empty-state { text-align: center; padding: 3rem; color: #64748b; }
        .empty-state span { font-size: 3rem; display: block; margin-bottom: 1rem; }

        .list { display: grid; gap: 1rem; }
        .card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .card-header { padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
        .card-header h3 { color: #1e293b; margin: 0; font-size: 1.1rem; }
        .card-body { padding: 1rem 1.5rem; }
        .info-row { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #f1f5f9; }
        .info-row:last-child { border-bottom: none; }
        .label { color: #64748b; }
        .value { color: #1e293b; font-weight: 500; }
        .value.price { color: #10b981; font-weight: 600; }

        .card-footer { padding: 1rem 1.5rem; background: #f8fafc; border-top: 1px solid #e2e8f0; }
        .view-btn { color: #3b82f6; text-decoration: none; font-weight: 600; }
        .view-btn:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}
