import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api';
import { getBackendUrl } from '../../utils/url';

function AdminAds() {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        target_url: '',
        placement: 'HOME_SLIDER',
        start_date: '',
        end_date: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchAds();
    }, []);

    const fetchAds = async () => {
        try {
            const res = await api.get('/admin/ads');
            setAds(res.data);
        } catch (err) {
            console.error('Error fetching ads:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || (!imageFile && !editingId)) {
            toast.error('Title dan gambar wajib diisi');
            return;
        }

        setSaving(true);
        const fd = new FormData();
        fd.append('title', formData.title);
        fd.append('target_url', formData.target_url);
        fd.append('placement', formData.placement);
        if (formData.start_date) fd.append('start_date', formData.start_date);
        if (formData.end_date) fd.append('end_date', formData.end_date);
        if (imageFile) fd.append('image', imageFile);

        try {
            if (editingId) {
                await api.put(`/admin/ads/${editingId}`, fd, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/admin/ads', fd, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            setShowForm(false);
            resetForm();
            fetchAds();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Gagal menyimpan');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (ad) => {
        setEditingId(ad.id);
        setFormData({
            title: ad.title,
            target_url: ad.target_url || '',
            placement: ad.placement,
            start_date: ad.start_date ? ad.start_date.split('T')[0] : '',
            end_date: ad.end_date ? ad.end_date.split('T')[0] : ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus banner ini?')) return;
        try {
            await api.delete(`/admin/ads/${id}`);
            fetchAds();
        } catch (err) {
            toast.error('Gagal menghapus');
        }
    };

    const handleToggleActive = async (ad) => {
        const fd = new FormData();
        fd.append('is_active', ad.is_active ? 'false' : 'true');
        try {
            await api.put(`/admin/ads/${ad.id}`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchAds();
        } catch (err) {
            toast.error('Gagal update status');
        }
    };

    const handleChangePlacement = async (ad, newPlacement) => {
        const fd = new FormData();
        fd.append('placement', newPlacement);
        try {
            await api.put(`/admin/ads/${ad.id}`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchAds();
            toast.success(`Placement berhasil diubah ke ${newPlacement}`);
        } catch (err) {
            toast.error('Gagal update placement');
        }
    };

    const resetForm = () => {
        setFormData({ title: '', target_url: '', placement: 'SIDEBAR_RIGHT', start_date: '', end_date: '' });
        setImageFile(null);
        setEditingId(null);
    };

    const placements = [
        { value: 'BANNER_SLIDER', label: '🎠 Banner Slider (di slide utama)' },
        { value: 'SIDEBAR_LEFT', label: '⬅️ Sidebar Kiri' },
        { value: 'SIDEBAR_RIGHT', label: '➡️ Sidebar Kanan' }
    ];


    if (loading) return <div className="loading-spinner">Loading...</div>;

    return (
        <div className="admin-ads-page">
            <div className="page-header">
                <h2>📺 Manajemen Iklan</h2>
                <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">
                    + Tambah Banner
                </button>
            </div>

            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{editingId ? 'Edit Banner' : 'Tambah Banner Baru'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Judul *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Gambar {!editingId && '*'}</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setImageFile(e.target.files[0])}
                                />
                            </div>
                            <div className="form-group">
                                <label>Target URL (klik banner)</label>
                                <input
                                    type="url"
                                    value={formData.target_url}
                                    onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="form-group">
                                <label>Placement</label>
                                <select
                                    value={formData.placement}
                                    onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                                >
                                    {placements.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                </select>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Tanggal Mulai</label>
                                    <input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Tanggal Berakhir</label>
                                    <input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                                    Batal
                                </button>
                                <button type="submit" disabled={saving} className="btn-primary">
                                    {saving ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="ads-list">
                {ads.length === 0 ? (
                    <div className="empty-state">Belum ada banner iklan</div>
                ) : (
                    ads.map((ad) => (
                        <div key={ad.id} className={`ad-card ${!ad.is_active ? 'inactive' : ''}`}>
                            <img src={getBackendUrl(ad.image_url)} alt={ad.title} className="ad-image" />
                            <div className="ad-info">
                                <h4>{ad.title}</h4>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                    <span className={`placement-badge ${ad.placement.toLowerCase().replace('_', '-')}`}>
                                        {ad.placement}
                                    </span>
                                    {ad.is_active && <span className="status-badge active">🟢 Sedang Aktif</span>}
                                    {!ad.is_active && <span className="status-badge inactive">🔴 Tidak Aktif</span>}
                                </div>
                                <p className="dates">
                                    {ad.start_date && `Mulai: ${new Date(ad.start_date).toLocaleDateString('id-ID')}`}
                                    {ad.end_date && ` - Berakhir: ${new Date(ad.end_date).toLocaleDateString('id-ID')}`}
                                </p>
                            </div>
                            <div className="ad-actions">
                                <select
                                    value={ad.placement}
                                    onChange={(e) => handleChangePlacement(ad, e.target.value)}
                                    className="placement-select"
                                >
                                    {placements.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                </select>
                                <button onClick={() => handleToggleActive(ad)} className={ad.is_active ? 'btn-active' : 'btn-inactive'}>
                                    {ad.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                </button>
                                <button onClick={() => handleEdit(ad)} className="btn-edit">✏️</button>
                                <button onClick={() => handleDelete(ad.id)} className="btn-delete">🗑️</button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <style>{`
                .admin-ads-page { max-width: 1200px; margin: 0 auto; padding: 20px; }
                .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                .page-header h2 { margin: 0; color: #1e293b; }
                .btn-primary { background: linear-gradient(135deg, #3b82f6, #2563eb); border: none; color: white; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; }
                .btn-primary:hover { opacity: 0.9; }
                .btn-secondary { background: white; border: 1px solid #e2e8f0; color: #64748b; padding: 12px 24px; border-radius: 8px; cursor: pointer; }
                .btn-secondary:hover { background: #f8fafc; }
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .modal-content { background: white; padding: 32px; border-radius: 16px; width: 100%; max-width: 500px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
                .modal-content h3 { color: #1e293b; margin-bottom: 20px; }
                .form-group { margin-bottom: 16px; }
                .form-group label { display: block; margin-bottom: 6px; font-weight: 500; color: #1e293b; }
                .form-group input, .form-group select { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; color: #1e293b; }
                .form-group input:focus, .form-group select:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
                .ads-list { display: flex; flex-direction: column; gap: 16px; }
                .ad-card { display: flex; gap: 16px; padding: 16px; background: white; border-radius: 12px; align-items: center; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
                .ad-card:hover { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
                .ad-card.inactive { opacity: 0.6; }
                .ad-image { width: 200px; height: 100px; object-fit: cover; border-radius: 8px; }
                .ad-info { flex: 1; }
                .ad-info h4 { margin: 0 0 8px 0; color: #1e293b; }
                .placement-badge { font-size: 11px; padding: 4px 8px; border-radius: 12px; font-weight: 600; text-transform: uppercase; }
                .placement-badge.banner-slider { background: #eff6ff; color: #3b82f6; }
                .placement-badge.sidebar-left { background: #ecfeff; color: #06b6d4; }
                .placement-badge.sidebar-right { background: #f0fdfa; color: #14b8a6; }
                .placement-badge.hero-section { background: #fffbeb; color: #f59e0b; }
                .status-badge { font-size: 11px; padding: 4px 8px; border-radius: 12px; font-weight: 500; }
                .status-badge.active { background: #f0fdf4; color: #16a34a; }
                .status-badge.inactive { background: #fef2f2; color: #dc2626; }
                .dates { color: #64748b; font-size: 12px; margin: 8px 0 0 0; }
                .ad-actions { display: flex; gap: 8px; align-items: center; }
                .ad-actions button { padding: 8px 12px; border-radius: 6px; border: none; cursor: pointer; font-size: 12px; font-weight: 500; }
                .placement-select { padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0; background: white; color: #1e293b; font-size: 11px; cursor: pointer; }
                .placement-select:focus { outline: none; border-color: #3b82f6; }
                .btn-active { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
                .btn-active:hover { background: #fee2e2; }
                .btn-inactive { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
                .btn-inactive:hover { background: #dcfce7; }
                .btn-edit { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
                .btn-edit:hover { background: #fef3c7; }
                .btn-delete { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
                .btn-delete:hover { background: #fee2e2; }
                .empty-state { text-align: center; padding: 60px; background: white; border-radius: 12px; color: #64748b; border: 1px solid #e2e8f0; }
            `}</style>
        </div>
    );
}

export default AdminAds;
