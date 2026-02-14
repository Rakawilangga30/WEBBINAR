import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL } from '../utils/url';

const API_BASE_URL = `${BACKEND_URL}/api`;

export default function AffiliateRegisterForm() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    event_title: '',
    event_description: '',
    event_price: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_holder: '',
  });
  const [poster, setPoster] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePosterChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPoster(file);
      setPosterPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      if (poster) {
        data.append('poster', poster);
      }

      await axios.post(`${API_BASE_URL}/public/partner/submit`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="affiliate-success-page">
        <div className="success-container">
          <div className="success-icon">🎉</div>
          <h1>Pengajuan Berhasil!</h1>
          <p>
            Terima kasih telah mengajukan event Anda. Tim kami akan meninjau pengajuan
            dalam 1-3 hari kerja. Anda akan menerima notifikasi setelah pengajuan diproses.
          </p>
          <div className="success-actions">
            <Link to="/" className="btn-home">Kembali ke Beranda</Link>
            <button onClick={() => {
              setSuccess(false); setFormData({
                full_name: '',
                email: '',
                phone: '',
                event_title: '',
                event_description: '',
                event_price: '',
                bank_name: '',
                bank_account_number: '',
                bank_account_holder: '',
              }); setPoster(null); setPosterPreview(null);
            }} className="btn-new">
              Ajukan Event Lain
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="affiliate-register-page">
      <div className="affiliate-container">
        <div className="affiliate-header">
          <Link to="/" className="back-link">← Kembali</Link>
          <h1>🤝 Jadi Partner Affiliate</h1>
          <p>Ajukan event Anda dan dapatkan 90% dari setiap penjualan!</p>
        </div>

        <form onSubmit={handleSubmit} className="affiliate-form">
          {error && <div className="error-message">{error}</div>}

          {/* Personal Info Section */}
          <div className="form-section">
            <h3>📋 Informasi Pribadi</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="full_name">Nama Lengkap *</label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">No. Telepon</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
            </div>
          </div>

          {/* Event Info Section */}
          <div className="form-section">
            <h3>🎯 Informasi Event</h3>
            <div className="form-group">
              <label htmlFor="event_title">Judul Event *</label>
              <input
                type="text"
                id="event_title"
                name="event_title"
                value={formData.event_title}
                onChange={handleChange}
                placeholder="Contoh: Masterclass Digital Marketing 2024"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="event_description">Deskripsi Event</label>
              <textarea
                id="event_description"
                name="event_description"
                value={formData.event_description}
                onChange={handleChange}
                placeholder="Jelaskan tentang event Anda, apa yang akan peserta pelajari, dll."
                rows={5}
              />
            </div>
            <div className="form-group">
              <label htmlFor="event_price">Harga (Rp) *</label>
              <input
                type="number"
                id="event_price"
                name="event_price"
                value={formData.event_price}
                onChange={handleChange}
                placeholder="100000"
                min="0"
                required
              />
              <small className="price-note">
                💡 Anda akan menerima 90% dari harga ini untuk setiap penjualan
              </small>
            </div>
            <div className="form-group">
              <label htmlFor="poster">Poster/Thumbnail Event</label>
              <div className="poster-upload">
                {posterPreview ? (
                  <div className="poster-preview">
                    <img src={posterPreview} alt="Preview" />
                    <button type="button" onClick={() => { setPoster(null); setPosterPreview(null); }}>
                      ✕ Hapus
                    </button>
                  </div>
                ) : (
                  <label className="upload-area">
                    <input
                      type="file"
                      id="poster"
                      accept="image/*"
                      onChange={handlePosterChange}
                    />
                    <div className="upload-placeholder">
                      <span>📷</span>
                      <p>Klik untuk upload poster</p>
                      <small>Format: JPG, PNG (Max 5MB)</small>
                    </div>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Bank Info Section */}
          <div className="form-section">
            <h3>🏦 Informasi Rekening (untuk pembayaran)</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="bank_name">Nama Bank</label>
                <select
                  id="bank_name"
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleChange}
                >
                  <option value="">Pilih Bank</option>
                  <option value="BCA">BCA</option>
                  <option value="BNI">BNI</option>
                  <option value="BRI">BRI</option>
                  <option value="Mandiri">Mandiri</option>
                  <option value="CIMB Niaga">CIMB Niaga</option>
                  <option value="Danamon">Danamon</option>
                  <option value="Permata">Permata</option>
                  <option value="OCBC NISP">OCBC NISP</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="bank_account_number">Nomor Rekening</label>
                <input
                  type="text"
                  id="bank_account_number"
                  name="bank_account_number"
                  value={formData.bank_account_number}
                  onChange={handleChange}
                  placeholder="1234567890"
                />
              </div>
              <div className="form-group">
                <label htmlFor="bank_account_holder">Nama Pemilik Rekening</label>
                <input
                  type="text"
                  id="bank_account_holder"
                  name="bank_account_holder"
                  value={formData.bank_account_holder}
                  onChange={handleChange}
                  placeholder="Sesuai buku tabungan"
                />
              </div>
            </div>
          </div>

          {/* Terms & Submit */}
          <div className="form-section terms-section">
            <div className="terms-box">
              <h4>📌 Ketentuan Partner Affiliate</h4>
              <ul>
                <li>Anda akan menerima <strong>90%</strong> dari setiap penjualan</li>
                <li>Platform mengambil <strong>10%</strong> sebagai biaya layanan</li>
                <li>Pembayaran dilakukan setiap akhir bulan</li>
                <li>Event akan ditinjau sebelum dipublikasikan</li>
                <li>Konten harus original dan tidak melanggar hak cipta</li>
              </ul>
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Mengirim...' : '🚀 Ajukan Event Saya'}
          </button>
        </form>
      </div>

      <style>{`
        .affiliate-register-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          padding: 2rem;
        }

        .affiliate-container {
          max-width: 800px;
          margin: 0 auto;
        }

        .affiliate-header {
          text-align: center;
          margin-bottom: 2rem;
          color: white;
        }

        .back-link {
          color: #f0c040;
          text-decoration: none;
          display: inline-block;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }

        .back-link:hover {
          text-decoration: underline;
        }

        .affiliate-header h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #f0c040, #e6a700);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .affiliate-header p {
          color: rgba(255,255,255,0.8);
          font-size: 1.1rem;
        }

        .affiliate-form {
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 2rem;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .error-message {
          background: rgba(220, 53, 69, 0.2);
          border: 1px solid rgba(220, 53, 69, 0.5);
          color: #ff6b6b;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .form-section {
          margin-bottom: 2rem;
        }

        .form-section h3 {
          color: #f0c040;
          margin-bottom: 1rem;
          font-size: 1.2rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(240, 192, 64, 0.3);
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          color: rgba(255,255,255,0.9);
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem 1rem;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 8px;
          color: white;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #f0c040;
          box-shadow: 0 0 0 3px rgba(240, 192, 64, 0.2);
        }

        .form-group input::placeholder,
        .form-group textarea::placeholder {
          color: rgba(255,255,255,0.4);
        }

        .form-group select option {
          background: #1a1a2e;
          color: white;
        }

        .price-note {
          display: block;
          margin-top: 0.5rem;
          color: #4ade80;
          font-size: 0.85rem;
        }

        .poster-upload {
          margin-top: 0.5rem;
        }

        .upload-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: rgba(255,255,255,0.05);
          border: 2px dashed rgba(255,255,255,0.3);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .upload-area:hover {
          border-color: #f0c040;
          background: rgba(240, 192, 64, 0.1);
        }

        .upload-area input {
          display: none;
        }

        .upload-placeholder {
          text-align: center;
          color: rgba(255,255,255,0.7);
        }

        .upload-placeholder span {
          font-size: 2rem;
          display: block;
          margin-bottom: 0.5rem;
        }

        .upload-placeholder small {
          color: rgba(255,255,255,0.5);
        }

        .poster-preview {
          position: relative;
          max-width: 300px;
        }

        .poster-preview img {
          width: 100%;
          border-radius: 12px;
        }

        .poster-preview button {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: rgba(220, 53, 69, 0.9);
          color: white;
          border: none;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          cursor: pointer;
        }

        .terms-box {
          background: rgba(240, 192, 64, 0.1);
          border: 1px solid rgba(240, 192, 64, 0.3);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .terms-box h4 {
          color: #f0c040;
          margin-bottom: 1rem;
        }

        .terms-box ul {
          color: rgba(255,255,255,0.8);
          padding-left: 1.5rem;
          margin: 0;
        }

        .terms-box li {
          margin-bottom: 0.5rem;
        }

        .terms-box strong {
          color: #4ade80;
        }

        .submit-btn {
          width: 100%;
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #f0c040, #e6a700);
          color: #1a1a2e;
          border: none;
          border-radius: 12px;
          font-size: 1.2rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(240, 192, 64, 0.4);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Success Page Styles */
        .affiliate-success-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .success-container {
          text-align: center;
          color: white;
          max-width: 500px;
        }

        .success-icon {
          font-size: 5rem;
          margin-bottom: 1rem;
        }

        .success-container h1 {
          color: #4ade80;
          margin-bottom: 1rem;
        }

        .success-container p {
          color: rgba(255,255,255,0.8);
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .success-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-home, .btn-new {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .btn-home {
          background: #f0c040;
          color: #1a1a2e;
        }

        .btn-new {
          background: transparent;
          border: 2px solid #f0c040;
          color: #f0c040;
        }

        .btn-home:hover, .btn-new:hover {
          transform: translateY(-2px);
        }

        @media (max-width: 600px) {
          .affiliate-header h1 {
            font-size: 1.8rem;
          }

          .affiliate-form {
            padding: 1.5rem;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
