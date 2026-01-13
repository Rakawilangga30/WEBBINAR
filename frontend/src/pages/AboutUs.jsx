import { Link } from "react-router-dom";
import { Mail, BookOpen, Users, Rocket } from "lucide-react";

// Import FOTO (FRONTEND ONLY - AMAN)
import galuhPhoto from "../assets/galuh.jpg";
import rakaPhoto from "../assets/raka.jpg";
import cahyoPhoto from "../assets/cahyo.jpg";

export default function AboutUs() {
    const team = [
        {
            name: "Galuh Sanjaya Putra",
            role: "Developer",
            photo: galuhPhoto
        },
        {
            name: "Ananda Raka Aditya Wilangga",
            role: "Developer",
            photo: rakaPhoto
        },
        {
            name: "Pak Cahyo",
            role: "Pembimbing",
            photo: cahyoPhoto
        }
    ];

    return (
        <div
            style={{
                padding: "40px 24px",
                maxWidth: "1200px",
                margin: "0 auto",
                minHeight: "100vh"
            }}
        >
            {/* ================= HERO ================= */}
            <div
                className="animate-fade-in"
                style={{
                    background:
                        "linear-gradient(135deg, var(--primary-800), var(--primary-600))",
                    color: "#fff",
                    padding: "80px 40px",
                    borderRadius: "32px",
                    textAlign: "center",
                    marginBottom: "64px",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.25)"
                }}
            >
                <div
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "rgba(255,255,255,0.2)",
                        padding: "6px 16px",
                        borderRadius: "50px",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        marginBottom: "24px"
                    }}
                >
                    <Rocket size={16} /> Welcome to Our Journey
                </div>

                <h1
                    style={{
                        fontSize: "3.5rem",
                        fontWeight: "800",
                        marginBottom: "24px",
                        letterSpacing: "-0.03em"
                    }}
                >
                    Tentang Kami
                </h1>

                <p
                    style={{
                        fontSize: "1.25rem",
                        color: "#ffffff",
                        opacity: 0.95,
                        maxWidth: "700px",
                        margin: "0 auto",
                        lineHeight: "1.7",
                        textShadow: "0 2px 6px rgba(0,0,0,0.35)"
                    }}
                >
                    <strong>Learning Platform</strong> adalah platform edukasi
                    masa depan yang menyediakan materi pembelajaran berkualitas
                    dari para ahli dan creator terpilih.
                </p>
            </div>

            {/* ================= TEAM ================= */}
            <div className="animate-slide-up" style={{ marginBottom: "80px" }}>
                <div style={{ textAlign: "center", marginBottom: "48px" }}>
                    <h2 style={{ fontSize: "2.5rem" }}>Tim Kami</h2>
                    <p style={{ maxWidth: "600px", margin: "0 auto" }}>
                        Orang-orang hebat di balik platform ini.
                    </p>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "32px"
                    }}
                >
                    {team.map((member, idx) => (
                        <div
                            key={idx}
                            className="card"
                            style={{
                                textAlign: "center",
                                padding: "24px",
                                transition: "0.3s"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform =
                                    "translateY(-6px)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "none";
                            }}
                        >
                            <img
                                src={member.photo}
                                alt={member.name}
                                style={{
                                    width: "140px",        // ✅ FOTO DIKECILKAN
                                    height: "140px",
                                    objectFit: "cover",
                                    borderRadius: "50%",
                                    marginBottom: "16px",
                                    border: "4px solid var(--primary-100)"
                                }}
                            />

                            <h3 style={{ marginBottom: "4px" }}>
                                {member.name}
                            </h3>
                            <p
                                style={{
                                    color: "var(--primary-600)",
                                    fontWeight: "600",
                                    margin: 0
                                }}
                            >
                                {member.role}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ================= CONTACT ================= */}
            <div
                className="animate-scale-in"
                style={{
                    background: "var(--gray-50)",
                    borderRadius: "32px",
                    padding: "60px 40px",
                    textAlign: "center",
                    border: "1px solid var(--gray-200)"
                }}
            >
                <h2 style={{ marginBottom: "16px" }}>Hubungi Kami</h2>
                <p style={{ marginBottom: "32px" }}>
                    Punya pertanyaan atau saran? Kami siap membantu!
                </p>
                <Link
                    to="/report"
                    className="btn btn-primary btn-lg"
                    style={{
                        padding: "16px 40px",
                        borderRadius: "50px",
                        fontSize: "1.1rem"
                    }}
                >
                    <Mail size={20} /> Kirim Pesan
                </Link>
            </div>
        </div>
    );
}
