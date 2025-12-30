import { useState, useEffect } from 'react';
import api from '../api';

export default function QuizTaker({ sessionId, onClose, onComplete }) {
    const [quiz, setQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        fetchQuiz();
    }, [sessionId]);

    const fetchQuiz = async () => {
        try {
            const res = await api.get(`/user/sessions/${sessionId}/quiz`);
            setQuiz(res.data.quiz);
            setQuestions(res.data.questions || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (questionId, option) => {
        setAnswers({ ...answers, [questionId]: option });
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length < questions.length) {
            alert('Jawab semua pertanyaan terlebih dahulu');
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.post(`/user/sessions/${sessionId}/quiz/submit`, { answers });
            setResult(res.data);
            if (onComplete) onComplete(res.data);
        } catch (err) {
            alert('Gagal: ' + (err.response?.data?.error || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div style={modalOverlay}><div style={modalContent}><p>Memuat kuis...</p></div></div>;
    }

    if (!quiz || questions.length === 0) {
        return (
            <div style={modalOverlay}>
                <div style={modalContent}>
                    <h3>Tidak ada kuis</h3>
                    <p style={{ color: '#64748b' }}>Session ini tidak memiliki kuis.</p>
                    <button onClick={onClose} style={btnPrimary}>Tutup</button>
                </div>
            </div>
        );
    }

    // Show result
    if (result) {
        return (
            <div style={modalOverlay}>
                <div style={{ ...modalContent, textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '16px' }}>
                        {result.passed ? '🎉' : '📚'}
                    </div>
                    <h2 style={{ margin: '0 0 12px 0', color: result.passed ? '#10b981' : '#f59e0b' }}>
                        {result.passed ? 'Selamat! Kamu Lulus!' : 'Belum Lulus - Coba Lagi!'}
                    </h2>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>
                        {result.score_percent.toFixed(0)}%
                    </div>
                    <p style={{ color: '#64748b', marginBottom: '16px' }}>
                        {result.correct_answers} dari {result.total_questions} jawaban benar
                    </p>
                    {result.passed ? (
                        <p style={{ color: '#10b981', fontSize: '0.9rem', marginBottom: '24px' }}>
                            ✅ Skor kamu akan dihitung untuk sertifikat!
                        </p>
                    ) : (
                        <p style={{ color: '#f59e0b', fontSize: '0.9rem', marginBottom: '24px' }}>
                            ⚠️ Skor minimal 80% untuk lulus. Kamu bisa coba lagi!
                        </p>
                    )}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <button onClick={() => { setResult(null); setAnswers({}); }} style={btnSecondary}>
                            🔄 Kerjakan Ulang
                        </button>
                        <button onClick={onClose} style={btnPrimary}>Tutup</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={modalOverlay}>
            <div style={{ ...modalContent, maxWidth: '700px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0 }}>📝 {quiz.title}</h2>
                    <button onClick={onClose} style={btnSecondary}>✖</button>
                </div>

                <div style={{ marginBottom: '16px', padding: '12px', background: '#dbeafe', borderRadius: '8px', color: '#1e40af' }}>
                    <strong>📌 Petunjuk:</strong> Pilih jawaban yang benar untuk setiap pertanyaan. Skor minimal 80% untuk lulus.
                </div>

                {/* Questions */}
                <div style={{ display: 'grid', gap: '20px', maxHeight: '50vh', overflowY: 'auto', marginBottom: '20px' }}>
                    {questions.map((q, idx) => (
                        <div key={q.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                            <div style={{ fontWeight: '600', marginBottom: '12px' }}>
                                {idx + 1}. {q.question_text}
                            </div>
                            <div style={{ display: 'grid', gap: '8px' }}>
                                {['A', 'B', 'C', 'D'].map(opt => {
                                    const optValue = q[`option_${opt.toLowerCase()}`];
                                    if (!optValue) return null;
                                    const isSelected = answers[q.id] === opt;
                                    return (
                                        <label
                                            key={opt}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '10px',
                                                padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                                                border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                                background: isSelected ? '#eff6ff' : 'white'
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                name={`q-${q.id}`}
                                                checked={isSelected}
                                                onChange={() => handleAnswer(q.id, opt)}
                                            />
                                            <span><strong>{opt}.</strong> {optValue}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Progress */}
                <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem', color: '#64748b' }}>
                        <span>Progress</span>
                        <span>{Object.keys(answers).length}/{questions.length}</span>
                    </div>
                    <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                            width: `${(Object.keys(answers).length / questions.length) * 100}%`,
                            height: '100%', background: '#3b82f6', transition: 'width 0.3s'
                        }} />
                    </div>
                </div>

                {/* Submit */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={btnSecondary}>Batal</button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || Object.keys(answers).length < questions.length}
                        style={{
                            ...btnPrimary,
                            opacity: Object.keys(answers).length < questions.length ? 0.5 : 1
                        }}
                    >
                        {submitting ? 'Mengirim...' : '📤 Submit Jawaban'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const modalOverlay = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000
};

const modalContent = {
    background: 'white', padding: '24px', borderRadius: '12px',
    width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto'
};

const btnPrimary = { padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' };
const btnSecondary = { padding: '8px 16px', background: '#f1f5f9', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer' };
