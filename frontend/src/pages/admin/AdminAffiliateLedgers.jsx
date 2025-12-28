import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

export default function AdminAffiliateLedgers() {
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [totals, setTotals] = useState({ pending: 0, paid_out: 0 });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchLedgers();
    fetchStats();
  }, [filter]);

  const fetchLedgers = async () => {
    try {
      setLoading(true);
      const params = filter ? `?is_paid_out=${filter}` : '';
      const response = await api.get(`/admin/affiliate/ledgers${params}`);
      setLedgers(response.data.ledgers || []);
      setTotals({
        pending: response.data.total_pending || 0,
        paid_out: response.data.total_paid_out || 0
      });
    } catch (err) {
      setError('Gagal memuat data ledger');
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
      console.error('Failed to fetch stats:', err);
    }
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handlePayout = async (ledgerId) => {
    if (!window.confirm('Tandai pembayaran ini sebagai sudah dibayar?')) return;

    try {
      await api.post(`/admin/affiliate/ledgers/${ledgerId}/payout`);
      alert('Berhasil ditandai sebagai sudah dibayar');
      fetchLedgers();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal memproses payout');
    }
  };

  return (
    <div className="ledgers-page">
      <div className="page-header">
        <Link to="/dashboard/admin/affiliates" className="back-link">← Kembali ke Pengajuan</Link>
        <h1>💰 Buku Besar Affiliate</h1>
        <p>Kelola pembayaran ke partner affiliate</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card revenue">
            <div className="stat-number">{formatPrice(stats.total_revenue)}</div>
            <div className="stat-label">Total Pendapatan</div>
          </div>
          <div className="stat-card platform">
            <div className="stat-number">{formatPrice(stats.total_platform_fee)}</div>
            <div className="stat-label">Platform Fee (10%)</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-number">{formatPrice(stats.pending_payout)}</div>
            <div className="stat-label">Menunggu Pembayaran</div>
          </div>
          <div className="stat-card paid">
            <div className="stat-number">{formatPrice(stats.completed_payout)}</div>
            <div className="stat-label">Sudah Dibayar</div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`tab ${filter === '' ? 'active' : ''}`}
          onClick={() => setFilter('')}
        >
          Semua
        </button>
        <button
          className={`tab ${filter === 'false' ? 'active' : ''}`}
          onClick={() => setFilter('false')}
        >
          Belum Dibayar
        </button>
        <button
          className={`tab ${filter === 'true' ? 'active' : ''}`}
          onClick={() => setFilter('true')}
        >
          Sudah Dibayar
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-state">Memuat data...</div>
      ) : ledgers.length === 0 ? (
        <div className="empty-state">
          <span>📊</span>
          <p>Belum ada transaksi affiliate</p>
        </div>
      ) : (
        <div className="ledgers-table-container">
          <table className="ledgers-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Affiliate</th>
                <th>Event</th>
                <th>Total</th>
                <th>Platform (10%)</th>
                <th>Affiliate (90%)</th>
                <th>Status</th>
                <th>Tanggal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {ledgers.map(ledger => (
                <tr key={ledger.id}>
                  <td className="order-id">{ledger.order_id}</td>
                  <td>
                    <div className="affiliate-info">
                      <span className="name">{ledger.affiliate_full_name}</span>
                      <span className="email">{ledger.affiliate_email}</span>
                    </div>
                  </td>
                  <td className="event-title">{ledger.event_title}</td>
                  <td>{formatPrice(ledger.transaction_amount)}</td>
                  <td className="platform-fee">{formatPrice(ledger.platform_fee)}</td>
                  <td className="affiliate-amount">{formatPrice(ledger.affiliate_amount)}</td>
                  <td>
                    {ledger.is_paid_out ? (
                      <span className="badge paid">✅ Dibayar</span>
                    ) : (
                      <span className="badge pending">⏳ Pending</span>
                    )}
                  </td>
                  <td>{formatDate(ledger.created_at)}</td>
                  <td>
                    {!ledger.is_paid_out && (
                      <button
                        className="payout-btn"
                        onClick={() => handlePayout(ledger.id)}
                      >
                        💳 Bayar
                      </button>
                    )}
                    {ledger.is_paid_out && ledger.paid_out_at && (
                      <span className="paid-date">{formatDate(ledger.paid_out_at)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .ledgers-page {
          padding: 0;
        }

        .page-header {
          margin-bottom: 2rem;
        }

        .back-link {
          color: #3b82f6;
          text-decoration: none;
          font-size: 0.9rem;
          display: inline-block;
          margin-bottom: 1rem;
        }

        .back-link:hover {
          text-decoration: underline;
        }

        .page-header h1 {
          color: #1e40af;
          margin-bottom: 0.5rem;
          font-size: 1.75rem;
        }

        .page-header p {
          color: #64748b;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .stat-card.revenue { border-left: 4px solid #3b82f6; }
        .stat-card.platform { border-left: 4px solid #f59e0b; }
        .stat-card.pending { border-left: 4px solid #f97316; }
        .stat-card.paid { border-left: 4px solid #10b981; }

        .stat-number {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
        }

        .stat-label {
          color: #64748b;
          font-size: 0.85rem;
          margin-top: 0.5rem;
        }

        .filter-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .tab {
          padding: 0.5rem 1rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          color: #64748b;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.9rem;
        }

        .tab:hover {
          background: #f1f5f9;
        }

        .tab.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .loading-state, .empty-state {
          text-align: center;
          padding: 3rem;
          color: #64748b;
        }

        .empty-state span {
          font-size: 3rem;
          display: block;
          margin-bottom: 1rem;
        }

        .ledgers-table-container {
          overflow-x: auto;
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .ledgers-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 900px;
        }

        .ledgers-table th,
        .ledgers-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }

        .ledgers-table th {
          background: #f8fafc;
          color: #64748b;
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
        }

        .ledgers-table td {
          color: #1e293b;
        }

        .ledgers-table tbody tr:hover {
          background: #f8fafc;
        }

        .order-id {
          font-family: monospace;
          font-size: 0.85rem;
          color: #64748b;
        }

        .affiliate-info {
          display: flex;
          flex-direction: column;
        }

        .affiliate-info .name {
          font-weight: 500;
          color: #1e293b;
        }

        .affiliate-info .email {
          font-size: 0.85rem;
          color: #64748b;
        }

        .event-title {
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .platform-fee {
          color: #f59e0b;
          font-weight: 500;
        }

        .affiliate-amount {
          color: #10b981;
          font-weight: 600;
        }

        .badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .badge.paid {
          background: #d1fae5;
          color: #065f46;
        }

        .badge.pending {
          background: #fef3c7;
          color: #92400e;
        }

        .payout-btn {
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.85rem;
        }

        .payout-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .paid-date {
          font-size: 0.85rem;
          color: #64748b;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
