import { useState, useEffect } from 'react';
import api from '../api';

export default function QuizBuilder({ sessionId, onClose, onSave, apiBase = '/organization' }) {
    const [quiz, setQuiz] = useState(null);
    const [title, setTitle] = useState('');
    const [isEnabled, setIsEnabled] = useState(true);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchQuiz();
    }, [sessionId]);

    const fetchQuiz = async () => {
        try {
            const res = await api.get(`${apiBase}/sessions/${sessionId}/quiz`);
            if (res.data.quiz) {
                setQuiz(res.data.quiz);
                setTitle(res.data.quiz.title || '');
                setIsEnabled(res.data.quiz.is_enabled);
                setQuestions(res.data.questions || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const addQuestion = () => {
        if (questions.length >= 10) {
            alert('Maksimal 10 pertanyaan');
            return;
        }
        setQuestions([...questions, {
            question_text: '',
            option_a: '',
            option_b: '',
            option_c: '',
            option_d: '',
            correct_option: 'A'
        }]);
    };

    const updateQuestion = (index, field, value) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };

    const removeQuestion = (index) => {
        if (confirm('Hapus pertanyaan ini?')) {
            setQuestions(questions.filter((_, i) => i !== index));
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            alert('Judul kuis wajib diisi');
            return;
        }
        if (questions.length === 0) {
            alert('Tambahkan minimal 1 pertanyaan');
            return;
        }
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.question_text.trim() || !q.option_a.trim() || !q.option_b.trim()) {
                alert(`Pertanyaan ${i + 1}: Teks pertanyaan dan opsi A, B wajib diisi`);
                return;
            }
        }

        setSaving(true);
        try {
            await api.post(`${apiBase}/sessions/${sessionId}/quiz`, {
                title,
                is_enabled: isEnabled,
                questions
            });
            alert('✅ Kuis berhasil disimpan!');
            if (onSave) onSave();
            if (onClose) onClose();
        } catch (err) {
            alert('Gagal: ' + (err.response?.data?.error || err.message));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Hapus kuis ini?')) return;
        try {
            await api.delete(`${apiBase}/sessions/${sessionId}/quiz`);
            alert('✅ Kuis berhasil dihapus');
            if (onSave) onSave();
            if (onClose) onClose();
        } catch (err) {
            alert('Gagal: ' + (err.response?.data?.error || err.message));
        }
    };

    if (loading) {
        return <div style={modalOverlay}><div style={modalContent}><p>Memuat...</p></div></div>;
    }

    return (
        <div style={modalOverlay}>
            <div style={{ ...modalContent, maxWidth: '700px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0 }}>📝 Quiz Builder</h2>
                    <button onClick={onClose} style={btnSecondary}>✖</button>
                </div>

                {/* Quiz Settings */}
                <div style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ marginBottom: '12px' }}>
                        <label style={labelStyle}>Judul Kuis</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            style={inputStyle}
                            placeholder="Contoh: Quiz Modul 1"
                        />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={(e) => setIsEnabled(e.target.checked)}
                        />
                        <span>Aktifkan Kuis</span>
                    </label>
                </div>

                {/* Questions */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0 }}>Pertanyaan ({questions.length}/10)</h4>
                        <button onClick={addQuestion} style={btnPrimary} disabled={questions.length >= 10}>
                            ➕ Tambah Pertanyaan
                        </button>
                    </div>

                    {questions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', background: '#f1f5f9', borderRadius: '8px' }}>
                            <p style={{ color: '#64748b' }}>Belum ada pertanyaan</p>
                            <button onClick={addQuestion} style={btnPrimary}>➕ Tambah Pertanyaan Pertama</button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '16px', maxHeight: '400px', overflowY: 'auto' }}>
                            {questions.map((q, idx) => (
                                <div key={idx} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <strong>Pertanyaan {idx + 1}</strong>
                                        <button onClick={() => removeQuestion(idx)} style={btnDangerSmall}>🗑️</button>
                                    </div>

                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>Teks Pertanyaan</label>
                                        <textarea
                                            value={q.question_text}
                                            onChange={(e) => updateQuestion(idx, 'question_text', e.target.value)}
                                            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', minHeight: '60px', boxSizing: 'border-box', fontSize: '0.95rem' }}
                                            placeholder="Tulis pertanyaan..."
                                        />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {['A', 'B', 'C', 'D'].map(opt => (
                                            <div key={opt} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <input
                                                    type="radio"
                                                    name={`correct-${idx}`}
                                                    checked={q.correct_option === opt}
                                                    onChange={() => updateQuestion(idx, 'correct_option', opt)}
                                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                />
                                                <span style={{ fontWeight: '600', minWidth: '24px', color: '#374151' }}>{opt}.</span>
                                                <input
                                                    type="text"
                                                    value={q[`option_${opt.toLowerCase()}`] || ''}
                                                    onChange={(e) => updateQuestion(idx, `option_${opt.toLowerCase()}`, e.target.value)}
                                                    style={{ flex: 1, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.95rem' }}
                                                    placeholder={`Jawaban opsi ${opt}${opt === 'A' || opt === 'B' ? ' (wajib)' : ' (opsional)'}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: '#10b981', margin: '12px 0 0 0', background: '#f0fdf4', padding: '8px 12px', borderRadius: '6px' }}>
                                        ✓ Klik radio button di kiri untuk menandai jawaban yang benar
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
                    <div>
                        {quiz && (
                            <button onClick={handleDelete} style={btnDanger}>🗑️ Hapus Kuis</button>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={onClose} style={btnSecondary}>Batal</button>
                        <button onClick={handleSave} disabled={saving} style={btnPrimary}>
                            {saving ? 'Menyimpan...' : '💾 Simpan Kuis'}
                        </button>
                    </div>
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
    width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto'
};

const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' };
const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box' };
const btnPrimary = { padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' };
const btnSecondary = { padding: '8px 16px', background: '#f1f5f9', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer' };
const btnDanger = { padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' };
const btnDangerSmall = { padding: '6px 10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' };
