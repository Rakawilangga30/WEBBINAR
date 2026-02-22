import { useState, useEffect } from 'react';

const ORG_TOUR_STEPS = [
    {
        icon: '🎉',
        title: 'Selamat! Organisasi Anda Telah Disetujui',
        desc: 'Akun organisasi Anda sudah aktif. Yuk kenali fitur-fitur yang tersedia untuk membantu Anda mengelola event dan pendapatan.',
        color: '#22c55e',
    },
    {
        icon: '📅',
        title: 'Buat & Kelola Event',
        desc: 'Dari menu "Manajemen Event", Anda bisa membuat event baru, mengatur sesi (jadwal, harga, materi), serta mempublish event ke halaman publik.',
        color: '#3b82f6',
        tips: ['Klik "+ Buat Event Baru" di Dashboard untuk mulai', 'Upload thumbnail agar event lebih menarik', 'Atur sesi dengan tanggal, harga, dan materi pembelajaran'],
    },
    {
        icon: '🤝',
        title: 'Program Affiliate',
        desc: 'Anda bisa mengundang affiliate untuk mempromosikan event Anda. Setiap penjualan dari kode affiliate akan memberi mereka komisi.',
        color: '#8b5cf6',
        tips: ['Menu "Kelola Affiliate" untuk lihat daftar pendaftar', 'Setujui atau tolak permintaan partnership affiliate', 'Lihat statistik penjualan per affiliate di "Statistik Affiliate"'],
    },
    {
        icon: '💸',
        title: 'Tarik Dana (Payout)',
        desc: 'Pendapatan dari penjualan tiket masuk ke saldo organisasi Anda. Anda bisa ajukan payout kapan saja melalui menu "Tarik Dana".',
        color: '#f59e0b',
        tips: ['Pastikan data rekening bank sudah benar', 'Payout akan diproses admin dan dikirim via Iris', 'Status payout bisa dipantau langsung di halaman Tarik Dana'],
    },
    {
        icon: '✅',
        title: 'Konfirmasi Payout Affiliate',
        desc: 'Saat affiliate mengajukan payout, Anda perlu mengkonfirmasi bahwa mereka masih aktif bermitra dengan Anda sebelum admin memproses pembayaran.',
        color: '#14b8a6',
        tips: ['Notifikasi akan muncul saat ada payout affiliate yang perlu dikonfirmasi', 'Menu "Konfirmasi Payout Affiliate" di sidebar', 'Berikan alasan jika menolak permintaan payout'],
    },
    {
        icon: '📊',
        title: 'Laporan Keuangan',
        desc: 'Pantau semua transaksi penjualan event Anda, lihat siapa saja yang membeli tiket, dan hitung pendapatan bersih setelah komisi affiliate.',
        color: '#ec4899',
        tips: ['Menu "Manajemen Event" → klik event → lihat daftar pembeli', 'Data termasuk: nama pembeli, sesi yang dibeli, kode affiliate yang digunakan'],
    },
];

export default function OrgWelcomeTour({ open: forceOpen, onClose: externalClose }) {
    const [visible, setVisible] = useState(false);
    const [step, setStep] = useState(0);

    useEffect(() => {
        if (forceOpen) {
            setStep(0);
            setVisible(true);
        }
    }, [forceOpen]);

    useEffect(() => {
        const seen = localStorage.getItem('org_tour_done');
        if (!seen) setVisible(true);
    }, []);

    const handleClose = () => {
        localStorage.setItem('org_tour_done', '1');
        setVisible(false);
        if (externalClose) externalClose();
    };

    if (!visible) return null;

    const current = ORG_TOUR_STEPS[step];
    const isLast = step === ORG_TOUR_STEPS.length - 1;

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
                        width: `${((step + 1) / ORG_TOUR_STEPS.length) * 100}%`,
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
                        Langkah {step + 1} dari {ORG_TOUR_STEPS.length}
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
                        {ORG_TOUR_STEPS.map((_, i) => (
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
                                background: `linear-gradient(135deg, ${current.color}, ${current.color}dd)`,
                                color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem',
                                boxShadow: `0 4px 12px ${current.color}44`
                            }}
                        >
                            {isLast ? '🚀 Mulai Gunakan!' : 'Selanjutnya →'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
