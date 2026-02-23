import { useState, useEffect } from 'react';
import api from '../../api';

function BarChart({ data, labelKey, valueKey, color = '#8b5cf6', formatValue }) {
    if (!data || data.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📊</div>
                <p style={{ margin: 0 }}>Belum ada data penjualan</p>
            </div>
        );
    }
    const max = Math.max(...data.map(d => d[valueKey] || 0)) || 1;
    const fmt = formatValue || (v => v.toLocaleString('id-ID'));
    return (
        <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', minHeight: '200px', padding: '0 8px 40px', minWidth: data.length * 80 }}>
                {data.map((item, i) => {
                    const pct = Math.max(4, Math.round((item[valueKey] / max) * 180));
                    const barColor = item.is_active === false ? '#94a3b8' : color;
                    return (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '68px', maxWidth: '88px' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: barColor, textAlign: 'center' }}>{fmt(item[valueKey] || 0)}</div>
                            <div style={{ width: '44px', height: `${pct}px`, background: `linear-gradient(180deg, ${barColor} 0%, ${barColor}99 100%)`, borderRadius: '6px 6px 0 0', boxShadow: `0 4px 12px ${barColor}40` }} />
                            <div style={{ fontSize: '0.65rem', color: '#64748b', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '76px' }} title={item[labelKey]}>
                                {item[labelKey]}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function KpiCard({ icon, label, value, color = '#3b82f6', sub }) {
    return (
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>{icon}</div>
            <div>
                <p style={{ margin: '0 0 4px', fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>{label}</p>
                <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#1e293b', lineHeight: 1 }}>{value}</p>
                {sub && <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>{sub}</p>}
            </div>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '1.05rem', color: '#1e293b', fontWeight: '700' }}>{title}</h3>
            {children}
        </div>
    );
}

const statusStyle = (s) => {
    if (s === 'APPROVED' || s === 'approved') return { background: '#dcfce7', color: '#166534' };
    if (s === 'PENDING' || s === 'pending') return { background: '#fef3c7', color: '#92400e' };
    if (s === 'REJECTED' || s === 'rejected') return { background: '#fee2e2', color: '#dc2626' };
    return { background: '#f1f5f9', color: '#475569' };
};

const fmt = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const fmtNum = (n) => Number(n || 0).toLocaleString('id-ID');
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

export default function AffiliateAnalytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeChart, setActiveChart] = useState('usage');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/affiliate/analytics');
            setData(res.data);
        } catch (e) {
            console.error('Gagal memuat analitik:', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '80px', color: '#64748b' }}>
            <div style={{ width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTopColor: '#8b5cf6', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
            <p style={{ margin: 0 }}>Memuat data statistik...</p>
        </div>
    );

    if (!data) return (
        <div style={{ textAlign: 'center', padding: '80px', color: '#64748b' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⚠️</div>
            <p>Gagal memuat data</p>
            <button onClick={fetchData} style={{ padding: '8px 20px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Coba Lagi</button>
        </div>
    );

    const { kpi, code_stats = [], recent_sales = [], withdrawals = [] } = data;

    return (
        <div style={{ maxWidth: '1200px' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ margin: '0 0 6px', fontSize: '1.75rem', fontWeight: '800', color: '#1e293b' }}>📊 Statistik Affiliate</h1>
                    <p style={{ margin: 0, color: '#64748b' }}>Performa kode promo dan riwayat komisi Anda</p>
                </div>
                <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>🔄 Refresh</button>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                <KpiCard icon="💰" label="Total Komisi" value={fmt(kpi?.total_commission)} color="#10b981" />
                <KpiCard icon="👥" label="Total Pembeli" value={fmtNum(kpi?.total_buyers)} color="#3b82f6" sub="via kode Anda" />
                <KpiCard icon="🏷️" label="Kode Aktif" value={fmtNum(kpi?.active_codes)} color="#8b5cf6" />
            </div>

            {/* Chart Tabs */}
            <Section title={
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                        { key: 'usage', label: '📈 Penggunaan Kode' },
                        { key: 'commission', label: '💰 Komisi per Kode' },
                    ].map(tab => (
                        <button key={tab.key} onClick={() => setActiveChart(tab.key)} style={{
                            padding: '6px 14px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                            fontWeight: '600', fontSize: '0.85rem',
                            background: activeChart === tab.key ? '#8b5cf6' : '#f1f5f9',
                            color: activeChart === tab.key ? 'white' : '#64748b'
                        }}>{tab.label}</button>
                    ))}
                </div>
            }>
                {activeChart === 'usage' && (
                    <>
                        <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '0.9rem' }}>Jumlah transaksi per kode promo (bar abu-abu = nonaktif)</p>
                        <BarChart data={code_stats} labelKey="code" valueKey="total_use" color="#8b5cf6" formatValue={fmtNum} />
                    </>
                )}
                {activeChart === 'commission' && (
                    <>
                        <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '0.9rem' }}>Total komisi per kode promo</p>
                        <BarChart data={code_stats} labelKey="code" valueKey="commission" color="#10b981" formatValue={fmt} />
                    </>
                )}
            </Section>

            {/* Kode Stats Table */}
            <Section title="🏷️ Detail Kode Promo">
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                {['Kode', 'Event', 'Organisasi', 'Status', 'Komisi %', 'Transaksi', 'Total Sales', 'Komisi'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: '600', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {code_stats.length === 0 ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Belum ada kode affiliate</td></tr>
                            ) : code_stats.map((cs, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', opacity: cs.is_active === false ? 0.55 : 1 }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                                    <td style={{ padding: '14px 16px' }}><code style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', fontWeight: '700', color: '#7c3aed' }}>{cs.code}</code></td>
                                    <td style={{ padding: '14px 16px', color: '#475569', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cs.event_title}</td>
                                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.85rem' }}>{cs.org_name}</td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span style={{ ...statusStyle(cs.status), padding: '2px 8px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700' }}>
                                            {cs.status === 'APPROVED' ? (cs.is_active ? '✅ Aktif' : '⏸ Nonaktif') : cs.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 16px', color: '#f59e0b', fontWeight: '700' }}>{cs.comm_pct}%</td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '3px 10px', borderRadius: '20px', fontWeight: '700', fontSize: '0.85rem' }}>{fmtNum(cs.total_use)}x</span>
                                    </td>
                                    <td style={{ padding: '14px 16px', color: '#64748b' }}>{fmt(cs.total_sales)}</td>
                                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#10b981' }}>{fmt(cs.commission)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Section>

            {/* Recent Sales */}
            <Section title="🛒 Transaksi Terbaru via Kode Anda">
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                {['Pembeli', 'Event', 'Sesi', 'Kode', 'Jumlah', 'Komisi', 'Tanggal'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: '600', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {recent_sales.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Belum ada transaksi via kode Anda</td></tr>
                            ) : recent_sales.map((s) => (
                                <tr key={s.purchase_id} style={{ borderBottom: '1px solid #f1f5f9' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#1e293b' }}>{s.buyer_name}</td>
                                    <td style={{ padding: '14px 16px', color: '#475569', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.event_title}</td>
                                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.85rem', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.session_title}</td>
                                    <td style={{ padding: '14px 16px' }}><code style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', fontWeight: '700', color: '#7c3aed', fontSize: '0.8rem' }}>{s.code}</code></td>
                                    <td style={{ padding: '14px 16px', color: '#0f172a', fontWeight: '600' }}>{fmt(s.amount)}</td>
                                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#10b981' }}>{fmt(s.commission)}</td>
                                    <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '0.85rem' }}>{fmtDate(s.purchased_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Section>

            {/* Withdrawal History */}
            <Section title="💸 Riwayat Penarikan Dana">
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                {['Jumlah', 'Bank', 'No. Rekening', 'Status', 'Tanggal'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: '600', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {withdrawals.length === 0 ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Belum ada riwayat penarikan</td></tr>
                            ) : withdrawals.map((w) => (
                                <tr key={w.id} style={{ borderBottom: '1px solid #f1f5f9' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#0f172a' }}>{fmt(w.amount)}</td>
                                    <td style={{ padding: '14px 16px', color: '#64748b' }}>{w.bank_name}</td>
                                    <td style={{ padding: '14px 16px', color: '#64748b' }}>{w.bank_account}</td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span style={{ ...statusStyle(w.status), padding: '3px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700' }}>{w.status}</span>
                                    </td>
                                    <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '0.85rem' }}>{fmtDate(w.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Section>
        </div>
    );
}
