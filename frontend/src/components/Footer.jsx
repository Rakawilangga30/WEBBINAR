import { Link } from 'react-router-dom';
import { Rocket, Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
    return (
        <footer style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            color: "#94a3b8",
            padding: "48px 24px 24px",
            marginTop: "auto"
        }}>
            <div style={{
                maxWidth: "1200px",
                margin: "0 auto"
            }}>
                {/* Main Footer Content */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "40px",
                    marginBottom: "40px"
                }}>
                    {/* Brand */}
                    <div>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            marginBottom: "16px"
                        }}>
                            <div style={{
                                width: "40px",
                                height: "40px",
                                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                                borderRadius: "10px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}>
                                <Rocket size={20} color="white" />
                            </div>
                            <span style={{
                                fontSize: "1.25rem",
                                fontWeight: "700",
                                color: "white"
                            }}>
                                WEBBINAR
                            </span>
                        </div>
                        <p style={{ fontSize: "0.9rem", lineHeight: "1.6", marginBottom: "16px" }}>
                            Platform edukasi digital terdepan untuk belajar skill baru dari para ahli dan creator terpilih.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 style={{ color: "white", marginBottom: "16px", fontSize: "1rem" }}>
                            Menu
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <Link to="/" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.9rem", transition: "color 0.2s" }}>
                                Home
                            </Link>
                            <Link to="/about" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.9rem", transition: "color 0.2s" }}>
                                Tentang Kami
                            </Link>
                            <Link to="/report" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.9rem", transition: "color 0.2s" }}>
                                Hubungi Kami
                            </Link>
                        </div>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 style={{ color: "white", marginBottom: "16px", fontSize: "1rem" }}>
                            Bantuan
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <Link to="/report" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.9rem" }}>
                                Laporkan Masalah
                            </Link>
                            <Link to="/dashboard" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.9rem" }}>
                                Dashboard
                            </Link>
                        </div>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 style={{ color: "white", marginBottom: "16px", fontSize: "1rem" }}>
                            Kontak
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem" }}>
                                <Mail size={16} />
                                <span>support@webbinar.com</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem" }}>
                                <MapPin size={16} />
                                <span>Bandung, Indonesia</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div style={{
                    height: "1px",
                    background: "rgba(148, 163, 184, 0.2)",
                    marginBottom: "24px"
                }}></div>

                {/* Copyright */}
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "16px"
                }}>
                    <p style={{ margin: 0, fontSize: "0.85rem" }}>
                        © 2025 WEBBINAR. All rights reserved.
                    </p>
                    <p style={{ margin: 0, fontSize: "0.85rem" }}>
                        Made with ❤️ by Tim WEBBINAR
                    </p>
                </div>
            </div>
        </footer>
    );
}
