import { useState, useEffect } from 'react';

const AFFILIATE_TOUR_STEPS = [
    {
        icon: '🌟',
        title: 'Selamat! Anda Kini Seorang Affiliate',
        desc: 'Akun affiliate Anda sudah aktif. Kini Anda bisa mendapatkan komisi dengan mempromosikan event dari organisasi yang bermitra dengan Anda.',
        color: '#8b5cf6',
    },
    {
        icon: '🤝',
        title: 'Cara Kerja Affiliate',
        desc: 'Anda mendaftar partnership ke event organisasi. Saat organisasi menyetujui, Anda mendapat kode promo unik. Setiap pembelian menggunakan kode Anda = komisi masuk ke saldo Anda.',
        color: '#3b82f6',
        tips: [
            'Daftar ke event yang ingin Anda promosikan',
            'Tunggu persetujuan dari organisasi penyelenggara',
            'Gunakan kode promo untuk promosi di media sosial Anda',
        ],
    },
    {
        icon: '🎫',
        title: 'Daftar ke Event',
        desc: 'Di menu "Event Tersedia", Anda bisa melihat semua event yang membuka program affiliate. Ajukan partnership dan tunggu persetujuan dari organisasi.',
        color: '#f59e0b',
        tips: [
            'Pilih event yang relevan dengan audiens Anda',
            'Isi form pengajuan partnership dengan lengkap',
            'Notifikasi akan dikirim saat partnership disetujui',
        ],
    },
    {
        icon: '🏷️',
        title: 'Kode Promo Anda',
        desc: 'Setelah partnership disetujui, Anda akan mendapatkan kode promo unik. Bagikan kode ini ke calon pembeli agar komisi masuk ke saldo Anda.',
        color: '#14b8a6',
        tips: [
            'Cek menu "Kode Promo Saya" untuk lihat semua kode aktif',
            'Setiap kode memiliki persentase komisi yang berbeda',
            'Pantau berapa kali kode Anda digunakan',
        ],
    },
    {
        icon: '📊',
        title: 'Dashboard & Statistik',
        desc: 'Di Dashboard Affiliate, Anda bisa memantau total komisi, jumlah transaksi, dan performa setiap kode promo secara real-time.',
        color: '#ec4899',
        tips: [
            'Total komisi = akumulasi dari semua kode promo Anda',
            'Saldo bisa ditarik kapan saja minimal Rp 50.000',
            'Lihat riwayat transaksi per event',
        ],
    },
    {
        icon: '💸',
        title: 'Tarik Dana (Payout)',
        desc: 'Saldo komisi yang terkumpul bisa Anda tarik ke rekening bank kapan saja. Pengajuan perlu dikonfirmasi organisasi lalu diproses admin.',
        color: '#22c55e',
        tips: [
            'Menu "Tarik Dana" → isi jumlah & data rekening',
            'Organisasi akan mengkonfirmasi bahwa Anda masih aktif bermitra',
            'Setelah admin menyetujui, dana dikirim via sistem payout',
        ],
    },
];

export default function AffiliateWelcomeTour() {
    const [visible, setVisible] = useState(false);
    const [step, setStep] = useState(0);

    useEffect(() => {
        const seen = localStorage.getItem('affiliate_tour_done');
        if (!seen) setVisible(true);
    }, []);

    const handleClose = () => {
        localStorage.setItem('affiliate_tour_done', '1');
        setVisible(false);
    };

    if (!visible) return null;

    const current = AFFILIATE_TOUR_STEPS[step];
    const isLast = step === AFFILIATE_TOUR_STEPS.length - 1;

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000, padding: '20px', backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: 'white', borderRadius: '20px', maxWidth: '520px', width: '100%',
                boxShadow: '0 25px 50px rgba(0,0,0,0.25)', overflow: 'hidden'
            }}>
                {/* Progress bar */}
                <div style={{ height: '5px', background: '#f1f5f9' }}>
                    <div style={{
                        height: '100%', background: current.color,
                        width: `${((step + 1) / AFFILIATE_TOUR_STEPS.length) * 100}%`,
                        transition: 'width 0.4s ease'
                    }} />
                </div>

                <div style={{ padding: '32px' }}>
                    {/* Icon */}
                    <div style={{
                        width: '72px', height: '72px', borderRadius: '20px',
                        background: `${current.color}18`, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: '2.2rem', marginBottom: '20px'
                    }}>
                        {current.icon}
                    </div>

                    {/* Step indicator */}
                    <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Langkah {step + 1} dari {AFFILIATE_TOUR_STEPS.length}
                    </div>

                    <h2 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '1.35rem', lineHeight: 1.3 }}>
                        {current.title}
                    </h2>
                    <p style={{ margin: '0 0 20px 0', color: '#64748b', lineHeight: 1.7, fontSize: '0.95rem' }}>
                        {current.desc}
                    </p>

                    {/* Tips */}
                    {current.tips && (
                        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                            {current.tips.map((tip, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                                    fontSize: '0.87rem', color: '#475569',
                                    marginBottom: i < current.tips.length - 1 ? '10px' : 0
                                }}>
                                    <span style={{
                                        width: '22px', height: '22px', background: current.color,
                                        borderRadius: '50%', color: 'white', fontSize: '11px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: '700', flexShrink: 0, marginTop: '1px'
                                    }}>{i + 1}</span>
                                    {tip}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Dot indicators */}
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '24px' }}>
                        {AFFILIATE_TOUR_STEPS.map((_, i) => (
                            <div key={i} onClick={() => setStep(i)} style={{
                                width: i === step ? '24px' : '8px', height: '8px',
                                borderRadius: '4px', background: i === step ? current.color : '#e2e8f0',
                                cursor: 'pointer', transition: 'all 0.3s ease'
                            }} />
                        ))}
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={handleClose}
                            style={{
                                padding: '10px 20px', borderRadius: '10px',
                                border: '1px solid #e2e8f0', background: 'white',
                                color: '#64748b', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem'
                            }}
                        >
                            Lewati
                        </button>
                        {step > 0 && (
                            <button
                                onClick={() => setStep(s => s - 1)}
                                style={{
                                    padding: '10px 20px', borderRadius: '10px',
                                    border: '1px solid #e2e8f0', background: 'white',
                                    color: '#1e293b', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem'
                                }}
                            >
                                ← Kembali
                            </button>
                        )}
                        <button
                            onClick={isLast ? handleClose : () => setStep(s => s + 1)}
                            style={{
                                flex: 1, padding: '10px 20px', borderRadius: '10px', border: 'none',
                                background: `linear-gradient(135deg, ${current.color}, ${current.color}cc)`,
                                color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem',
                                boxShadow: `0 4px 12px ${current.color}44`
                            }}
                        >
                            {isLast ? '🚀 Mulai Promosikan!' : 'Selanjutnya →'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
