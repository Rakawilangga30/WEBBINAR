import { useState, useEffect } from 'react';
import api from '../api';

export default function EventProgress({ eventId, onTakeQuiz, onViewCertificate }) {
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProgress();
    }, [eventId]);

    const fetchProgress = async () => {
        try {
            const res = await api.get(`/user/events/${eventId}/progress`);
            setProgress(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Memuat progress...</div>;
    }

    if (!progress?.has_quizzes) {
        return null; // No quizzes, don't show progress
    }

    const allCompleted = progress.progress?.every(p => p.completed);
    const totalPercent = Math.min(100, progress.total_percent || 0);
    const passed = totalPercent >= (progress.min_score_required || 80);

    return (
        <div style={{
            padding: '20px',
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
            borderRadius: '12px',
            color: 'white',
            marginBottom: '24px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                    <h3 style={{ margin: '0 0 4px 0' }}>📊 Progress Sertifikat</h3>
                    <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem' }}>
                        Selesaikan semua kuis untuk mendapatkan sertifikat
                    </p>
                </div>
                {passed && (
                    <button
                        onClick={() => onViewCertificate && onViewCertificate()}
                        style={{
                            padding: '10px 20px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        🎓 Lihat Sertifikat
                    </button>
                )}
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                    <span>Skor Total</span>
                    <span style={{ fontWeight: 'bold' }}>{totalPercent.toFixed(1)}%</span>
                </div>
                <div style={{ height: '12px', background: 'rgba(255,255,255,0.2)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{
                        width: `${totalPercent}%`,
                        height: '100%',
                        background: passed ? '#10b981' : totalPercent > 50 ? '#f59e0b' : '#ef4444',
                        transition: 'width 0.5s, background 0.3s'
                    }} />
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '4px' }}>
                    Minimal {progress.min_score_required || 80}% untuk mendapatkan sertifikat
                </div>
            </div>

            {/* Quiz List */}
            <div style={{ display: 'grid', gap: '8px' }}>
                {progress.progress?.map((item, idx) => (
                    <div
                        key={item.quiz_id}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 16px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '8px'
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: '500' }}>{item.session_name}</div>
                            <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                                Bobot: {item.weight?.toFixed(1)}%
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {item.completed ? (
                                <>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        background: item.passed ? '#10b981' : '#f59e0b',
                                        fontSize: '0.85rem',
                                        fontWeight: '500'
                                    }}>
                                        {item.score?.toFixed(0)}%
                                    </span>
                                    <button
                                        onClick={() => onTakeQuiz && onTakeQuiz(item.session_id)}
                                        style={{
                                            padding: '6px 12px',
                                            background: 'rgba(255,255,255,0.2)',
                                            color: 'white',
                                            border: '1px solid rgba(255,255,255,0.3)',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: '500',
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        🔄 Ulang
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => onTakeQuiz && onTakeQuiz(item.session_id)}
                                    style={{
                                        padding: '6px 16px',
                                        background: 'white',
                                        color: '#3b82f6',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: '500',
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    📝 Mulai Kuis
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Status Message */}
            <div style={{
                marginTop: '16px',
                padding: '12px',
                background: passed ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)',
                borderRadius: '8px',
                textAlign: 'center'
            }}>
                {passed ? (
                    <span>🎉 Selamat! Anda telah lulus dan mendapatkan sertifikat!</span>
                ) : allCompleted ? (
                    <span>📚 Skor Anda belum mencukupi. Coba kuis lagi untuk meningkatkan skor.</span>
                ) : (
                    <span>📝 Selesaikan semua kuis untuk melihat skor total Anda.</span>
                )}
            </div>
        </div>
    );
}
