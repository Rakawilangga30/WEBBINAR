import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import CertificateViewer from "../../components/CertificateViewer";

export default function MyCertificates() {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedEventId, setSelectedEventId] = useState(null);

    useEffect(() => {
        fetchCertificates();
    }, []);

    const fetchCertificates = async () => {
        try {
            const res = await api.get("/user/certificates");
            setCertificates(res.data.certificates || []);
        } catch (error) {
            console.error("Failed to fetch certificates:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <div style={{
                    width: "40px",
                    height: "40px",
                    border: "3px solid #e2e8f0",
                    borderTopColor: "#3b82f6",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 16px"
                }}></div>
                Memuat sertifikat...
            </div>
        );
    }

    return (
        <div>
            {selectedEventId && (
                <CertificateViewer
                    eventId={selectedEventId}
                    onClose={() => setSelectedEventId(null)}
                />
            )}

            <div style={{ marginBottom: "24px" }}>
                <h2 style={{ margin: "0 0 8px 0", color: "#1e293b", fontSize: "1.5rem" }}>
                    🎓 Sertifikat Saya
                </h2>
                <p style={{ margin: 0, color: "#64748b" }}>
                    Lihat dan unduh sertifikat kursus yang telah Anda selesaikan
                </p>
            </div>

            {certificates.length === 0 ? (
                <div style={{
                    background: "white",
                    borderRadius: "12px",
                    padding: "60px 20px",
                    textAlign: "center",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                }}>
                    <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🎓</div>
                    <h3 style={{ margin: "0 0 12px 0", color: "#1e293b" }}>Belum Ada Sertifikat</h3>
                    <p style={{ margin: "0 0 24px 0", color: "#64748b", maxWidth: "400px", marginLeft: "auto", marginRight: "auto" }}>
                        Selesaikan kursus dan quiz untuk mendapatkan sertifikat. Sertifikat akan muncul di sini.
                    </p>
                    <Link to="/" style={{
                        display: "inline-block",
                        padding: "12px 24px",
                        background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                        color: "white",
                        borderRadius: "8px",
                        textDecoration: "none",
                        fontWeight: "600"
                    }}>
                        🔍 Jelajahi Kursus
                    </Link>
                </div>
            ) : (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: "20px"
                }}>
                    {certificates.map(cert => (
                        <div key={cert.id} style={{
                            background: "white",
                            borderRadius: "12px",
                            overflow: "hidden",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            border: "1px solid #e2e8f0"
                        }}>
                            <div style={{
                                background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
                                padding: "20px",
                                color: "white",
                                textAlign: "center"
                            }}>
                                <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🏆</div>
                                <h4 style={{ margin: 0, fontSize: "1.1rem" }}>{cert.event_title}</h4>
                            </div>
                            <div style={{ padding: "20px" }}>
                                <div style={{ marginBottom: "12px" }}>
                                    <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "4px" }}>
                                        Kode Sertifikat
                                    </div>
                                    <div style={{
                                        fontSize: "0.9rem",
                                        fontWeight: "600",
                                        color: "#1e293b",
                                        fontFamily: "monospace",
                                        background: "#f1f5f9",
                                        padding: "6px 10px",
                                        borderRadius: "6px"
                                    }}>
                                        {cert.certificate_code}
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                                    <div>
                                        <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "4px" }}>
                                            Skor Final
                                        </div>
                                        <div style={{ fontSize: "1.25rem", fontWeight: "700", color: "#10b981" }}>
                                            {cert.score?.toFixed(1)}%
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "4px" }}>
                                            Tanggal
                                        </div>
                                        <div style={{ fontWeight: "500", color: "#1e293b", fontSize: "0.9rem" }}>
                                            {new Date(cert.earned_at).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedEventId(cert.event_id)}
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        textAlign: "center",
                                        padding: "10px",
                                        background: "linear-gradient(135deg, #10b981, #059669)",
                                        color: "white",
                                        borderRadius: "8px",
                                        border: "none",
                                        cursor: "pointer",
                                        fontWeight: "600",
                                        fontSize: "0.9rem"
                                    }}
                                >
                                    📜 Lihat Sertifikat
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
