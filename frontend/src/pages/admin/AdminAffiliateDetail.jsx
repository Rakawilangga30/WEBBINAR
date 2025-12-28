import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api';

export default function AdminAffiliateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchSubmission();
  }, [id]);

  const fetchSubmission = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/affiliate/submissions/${id}`);
      setSubmission(response.data.submission);
    } catch (err) {
      setError('Gagal memuat detail pengajuan');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleReview = async (action) => {
    if (processing) return;

    const confirmMsg = action === 'APPROVE'
      ? 'Yakin ingin MENYETUJUI pengajuan ini? Event akan langsung dipublikasikan.'
      : 'Yakin ingin MENOLAK pengajuan ini?';

    if (!window.confirm(confirmMsg)) return;

    setProcessing(true);
    try {
      const response = await api.post(`/admin/affiliate/submissions/${id}/review`, {
        action,
        note: reviewNote
      });

      alert(action === 'APPROVE'
        ? `Event berhasil dipublikasikan! Event ID: ${response.data.event_id}`
        : 'Pengajuan telah ditolak.');

      navigate('/dashboard/admin/affiliates');
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal memproses review');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: { bg: '#fef3cd', color: '#856404', text: '⏳ Menunggu Review' },
      APPROVED: { bg: '#d4edda', color: '#155724', text: '✅ Disetujui' },
      REJECTED: { bg: '#f8d7da', color: '#721c24', text: '❌ Ditolak' }
    };
    const style = styles[status] || styles.PENDING;
    return (
      <span style={{
        padding: '0.5rem 1rem',
        borderRadius: '20px',
        fontSize: '1rem',
        fontWeight: '600',
        backgroundColor: style.bg,
        color: style.color
      }}>
        {style.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="loading-page">
        <p>Memuat detail pengajuan...</p>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="error-page">
        <p>{error || 'Pengajuan tidak ditemukan'}</p>
        <Link to="/dashboard/admin/affiliates">← Kembali</Link>
      </div>
    );
  }

  return (
    <div className="affiliate-detail-page">
      <div className="page-header">
        <Link to="/dashboard/admin/affiliates" className="back-link">← Kembali ke Daftar</Link>
        <div className="header-content">
          <h1>{submission.event_title}</h1>
          {getStatusBadge(submission.status)}
        </div>
      </div>

      <div className="detail-grid">
        {/* Left Column - Event Details */}
        <div className="detail-card">
          <h3>📋 Informasi Event</h3>

          {submission.poster_url && (
            <div className="poster-section">
              <img
                src={`http://localhost:8080/${submission.poster_url}`}
                alt="Poster"
                className="poster-image"
              />
            </div>
          )}

          <div className="detail-row">
            <span className="label">Judul Event</span>
            <span className="value">{submission.event_title}</span>
          </div>
          <div className="detail-row">
            <span className="label">Deskripsi</span>
            <span className="value description">{submission.event_description || '-'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Harga</span>
            <span className="value price">{formatPrice(submission.event_price)}</span>
          </div>
          <div className="detail-row highlight">
            <span className="label">💰 Platform Fee (10%)</span>
            <span className="value">{formatPrice(submission.event_price * 0.1)}</span>
          </div>
          <div className="detail-row highlight">
            <span className="label">💵 Affiliate (90%)</span>
            <span className="value affiliate">{formatPrice(submission.event_price * 0.9)}</span>
          </div>
        </div>

        {/* Right Column - Affiliate Details */}
        <div className="detail-card">
          <h3>👤 Informasi Pengaju</h3>
          <div className="detail-row">
            <span className="label">Nama Lengkap</span>
            <span className="value">{submission.full_name}</span>
          </div>
          <div className="detail-row">
            <span className="label">Email</span>
            <span className="value">{submission.email}</span>
          </div>
          <div className="detail-row">
            <span className="label">No. Telepon</span>
            <span className="value">{submission.phone || '-'}</span>
          </div>

          <h3 style={{ marginTop: '2rem' }}>🏦 Informasi Rekening</h3>
          <div className="detail-row">
            <span className="label">Nama Bank</span>
            <span className="value">{submission.bank_name || '-'}</span>
          </div>
          <div className="detail-row">
            <span className="label">No. Rekening</span>
            <span className="value">{submission.bank_account_number || '-'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Nama Pemilik</span>
            <span className="value">{submission.bank_account_holder || '-'}</span>
          </div>

          <h3 style={{ marginTop: '2rem' }}>📅 Informasi Pengajuan</h3>
          <div className="detail-row">
            <span className="label">Diajukan pada</span>
            <span className="value">{formatDateTime(submission.created_at)}</span>
          </div>
          {submission.reviewed_at && (
            <>
              <div className="detail-row">
                <span className="label">Direview pada</span>
                <span className="value">{formatDateTime(submission.reviewed_at)}</span>
              </div>
              <div className="detail-row">
                <span className="label">Direview oleh</span>
                <span className="value">{submission.reviewer_name || '-'}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Review Section */}
      {submission.status === 'PENDING' && (
        <div className="review-section">
          <h3>📝 Review Pengajuan</h3>
          <div className="review-form">
            <div className="form-group">
              <label>Catatan (opsional)</label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Tambahkan catatan untuk affiliate..."
                rows={3}
              />
            </div>
            <div className="review-actions">
              <button
                className="btn-reject"
                onClick={() => handleReview('REJECT')}
                disabled={processing}
              >
                ❌ Tolak
              </button>
              <button
                className="btn-approve"
                onClick={() => handleReview('APPROVE')}
                disabled={processing}
              >
                ✅ Setujui & Publikasikan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Result */}
      {submission.status !== 'PENDING' && submission.review_note && (
        <div className="review-result">
          <h3>📋 Catatan Review</h3>
          <p>{submission.review_note}</p>
        </div>
      )}

      <style>{`
        .affiliate-detail-page {
          padding: 0;
        }

        .loading-page, .error-page {
          padding: 3rem;
          text-align: center;
          color: #64748b;
        }

        .error-page a {
          color: #3b82f6;
          text-decoration: none;
          margin-top: 1rem;
          display: inline-block;
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

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-content h1 {
          color: #1e293b;
          margin: 0;
          font-size: 1.5rem;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .detail-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .detail-card h3 {
          color: #1e40af;
          margin-bottom: 1.5rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #e2e8f0;
          font-size: 1.1rem;
        }

        .poster-section {
          margin-bottom: 1.5rem;
        }

        .poster-image {
          width: 100%;
          max-height: 300px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-row.highlight {
          background: #fef3c7;
          margin: 0.5rem -0.75rem;
          padding: 0.75rem;
          border-radius: 8px;
          border: none;
        }

        .label {
          color: #64748b;
        }

        .value {
          color: #1e293b;
          text-align: right;
          font-weight: 500;
          max-width: 60%;
        }

        .value.description {
          text-align: left;
          max-width: 100%;
          display: block;
          margin-top: 0.5rem;
          color: #475569;
          font-weight: 400;
        }

        .value.price {
          color: #f59e0b;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .value.affiliate {
          color: #10b981;
          font-weight: 700;
        }

        .review-section {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .review-section h3 {
          color: #1e40af;
          margin-bottom: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          color: #475569;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .form-group textarea {
          width: 100%;
          padding: 1rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          color: #1e293b;
          font-size: 1rem;
          resize: vertical;
        }

        .form-group textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .review-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .btn-approve, .btn-reject {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
          font-size: 0.95rem;
        }

        .btn-approve {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        }

        .btn-reject {
          background: white;
          border: 2px solid #ef4444;
          color: #ef4444;
        }

        .btn-approve:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
        }

        .btn-reject:hover:not(:disabled) {
          background: #fef2f2;
        }

        .btn-approve:disabled, .btn-reject:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .review-result {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .review-result h3 {
          color: #1e40af;
          margin-bottom: 1rem;
        }

        .review-result p {
          color: #475569;
        }

        @media (max-width: 768px) {
          .detail-grid {
            grid-template-columns: 1fr;
          }

          .header-content {
            flex-direction: column;
            align-items: flex-start;
          }

          .review-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
