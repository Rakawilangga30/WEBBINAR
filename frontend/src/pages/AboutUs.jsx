import { Link } from 'react-router-dom';

export default function AboutUs() {
    const team = [
        { name: "Nama Anggota 1", role: "Developer", photo: null },
        { name: "Nama Anggota 2", role: "Developer", photo: null },
        { name: "Nama Anggota 3", role: "Developer", photo: null },
    ];

    return (
        <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto", minHeight: "100vh" }}>
            {/* Hero */}
            <div style={{
                background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)",
                color: "white",
                padding: "60px 40px",
                borderRadius: "16px",
                textAlign: "center",
                marginBottom: "48px"
            }}>
                <h1 style={{ margin: "0 0 16px 0", fontSize: "2.5rem", fontWeight: "700" }}>
                    Tentang Kami
                </h1>
                <p style={{ margin: 0, fontSize: "1.1rem", opacity: 0.9, maxWidth: "600px", marginLeft: "auto", marginRight: "auto" }}>
                    Learning Platform adalah platform edukasi yang menyediakan materi pembelajaran berkualitas dari para ahli dan creator terpilih.
                </p>
            </div>

            {/* Mission */}
            <div style={{
                background: "white",
                borderRadius: "16px",
                padding: "40px",
                marginBottom: "48px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                border: "1px solid #e2e8f0"
            }}>
                <h2 style={{ margin: "0 0 24px 0", color: "#1e293b", fontSize: "1.5rem", textAlign: "center" }}>
                    🎯 Misi Kami
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
                    <div style={{ textAlign: "center", padding: "20px" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📚</div>
                        <h3 style={{ margin: "0 0 8px 0", color: "#1e293b" }}>Edukasi Berkualitas</h3>
                        <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                            Menyediakan materi pembelajaran terbaik dari para ahli di bidangnya
                        </p>
                    </div>
                    <div style={{ textAlign: "center", padding: "20px" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🤝</div>
                        <h3 style={{ margin: "0 0 8px 0", color: "#1e293b" }}>Kolaborasi</h3>
                        <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                            Memfasilitasi creator dan organisasi untuk berbagi pengetahuan
                        </p>
                    </div>
                    <div style={{ textAlign: "center", padding: "20px" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🚀</div>
                        <h3 style={{ margin: "0 0 8px 0", color: "#1e293b" }}>Akses Mudah</h3>
                        <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                            Pembelajaran kapan saja, di mana saja dengan platform yang mudah digunakan
                        </p>
                    </div>
                </div>
            </div>

            {/* Team */}
            <div style={{
                background: "white",
                borderRadius: "16px",
                padding: "40px",
                marginBottom: "48px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                border: "1px solid #e2e8f0"
            }}>
                <h2 style={{ margin: "0 0 32px 0", color: "#1e293b", fontSize: "1.5rem", textAlign: "center" }}>
                    👥 Tim Kami
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "32px" }}>
                    {team.map((member, idx) => (
                        <div key={idx} style={{ textAlign: "center" }}>
                            <div style={{
                                width: "120px",
                                height: "120px",
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, #e2e8f0, #cbd5e1)",
                                margin: "0 auto 16px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "3rem",
                                overflow: "hidden"
                            }}>
                                {member.photo ? (
                                    <img src={member.photo} alt={member.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                    "👤"
                                )}
                            </div>
                            <h3 style={{ margin: "0 0 4px 0", color: "#1e293b", fontSize: "1.1rem" }}>
                                {member.name}
                            </h3>
                            <p style={{ margin: 0, color: "#3b82f6", fontSize: "0.9rem", fontWeight: "500" }}>
                                {member.role}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Contact */}
            <div style={{
                background: "#f8fafc",
                borderRadius: "16px",
                padding: "40px",
                textAlign: "center"
            }}>
                <h2 style={{ margin: "0 0 16px 0", color: "#1e293b", fontSize: "1.25rem" }}>
                    📧 Hubungi Kami
                </h2>
                <p style={{ margin: "0 0 24px 0", color: "#64748b" }}>
                    Punya pertanyaan atau saran? Kami siap membantu!
                </p>
                <Link to="/report" style={{
                    display: "inline-block",
                    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                    color: "white",
                    padding: "12px 32px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontWeight: "600"
                }}>
                    Kirim Pesan
                </Link>
            </div>
        </div>
    );
}
