import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";
import { getBackendUrl } from "../utils/url";

export default function OrganizationPublic() {
    const { id } = useParams();
    const [org, setOrg] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrganization = async () => {
            try {
                const orgsRes = await api.get("/organizations/public");
                const organizations = orgsRes.data.organizations || [];
                const foundOrg = organizations.find(o => o.id === parseInt(id));

                if (!foundOrg) {
                    setError("Organisasi tidak ditemukan");
                    setLoading(false);
                    return;
                }

                setOrg(foundOrg);

                const eventsRes = await api.get("/events");
                const allEvents = eventsRes.data.events || [];
                const orgEvents = allEvents.filter(e => e.organization_id === parseInt(id));
                setEvents(orgEvents);
            } catch (err) {
                console.error("Error fetching organization:", err);
                setError("Gagal memuat data organisasi");
            } finally {
                setLoading(false);
            }
        };
        fetchOrganization();
    }, [id]);

    const getThumbnailUrl = (url) => {
        if (!url) return null;
        return getBackendUrl(url);
    };

    const formatPrice = (price) => {
        if (!price || price === 0) return "Gratis";
        return `Rp ${price.toLocaleString('id-ID')}`;
    };

    if (loading) {
        return (
            <div style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)"
            }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{
                        width: "48px",
                        height: "48px",
                        border: "4px solid #e2e8f0",
                        borderTopColor: "#3b82f6",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                        margin: "0 auto 20px"
                    }}></div>
                    <p style={{ color: "#64748b", fontSize: "0.95rem" }}>Memuat profil organisasi...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)",
                padding: "24px"
            }}>
                <div style={{
                    background: "white",
                    padding: "48px",
                    borderRadius: "24px",
                    textAlign: "center",
                    maxWidth: "400px",
                    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.1)"
                }}>
                    <div style={{ fontSize: "5rem", marginBottom: "16px" }}>🔍</div>
                    <h2 style={{ color: "#1e293b", marginBottom: "12px", fontSize: "1.5rem" }}>{error}</h2>
                    <p style={{ color: "#64748b", marginBottom: "28px", lineHeight: "1.6" }}>
                        Organisasi yang Anda cari tidak tersedia atau telah dihapus.
                    </p>
                    <Link to="/" style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                        color: "white",
                        padding: "14px 28px",
                        borderRadius: "12px",
                        textDecoration: "none",
                        fontWeight: "600",
                        fontSize: "0.95rem",
                        boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)"
                    }}>
                        ← Kembali ke Beranda
                    </Link>
                </div>
            </div>
        );
    }

    const hasContactInfo = org.email || org.phone || org.website || org.social_link || org.address;

    return (
        <div style={{ background: "linear-gradient(180deg, #f8fafc 0%, #fff 50%)", minHeight: "100vh" }}>
            {/* Hero Section with Contact Info */}
            <div style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)",
                padding: "50px 24px 40px",
                position: "relative",
                overflow: "hidden"
            }}>
                {/* Decorative Elements */}
                <div style={{
                    position: "absolute",
                    top: "-100px",
                    right: "-100px",
                    width: "400px",
                    height: "400px",
                    background: "radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)",
                    borderRadius: "50%"
                }}></div>
                <div style={{
                    position: "absolute",
                    bottom: "-150px",
                    left: "-100px",
                    width: "300px",
                    height: "300px",
                    background: "radial-gradient(circle, rgba(147,51,234,0.2) 0%, transparent 70%)",
                    borderRadius: "50%"
                }}></div>

                <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 1 }}>
                    {/* Top Row: Logo + Info + Stats */}
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "28px",
                        flexWrap: "wrap",
                        marginBottom: hasContactInfo ? "28px" : "0"
                    }}>
                        {/* Logo */}
                        <div style={{
                            width: "100px",
                            height: "100px",
                            borderRadius: "20px",
                            background: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            boxShadow: "0 15px 35px rgba(0,0,0,0.3)",
                            flexShrink: 0,
                            border: "3px solid rgba(255,255,255,0.2)"
                        }}>
                            {org.logo_url ? (
                                <img
                                    src={getThumbnailUrl(org.logo_url)}
                                    alt={org.name}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            ) : (
                                <span style={{ fontSize: "3rem" }}>🏢</span>
                            )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: "220px" }}>
                            {org.category && (
                                <span style={{
                                    background: "rgba(255,255,255,0.15)",
                                    padding: "6px 14px",
                                    borderRadius: "20px",
                                    fontSize: "0.8rem",
                                    display: "inline-block",
                                    marginBottom: "10px",
                                    color: "rgba(255,255,255,0.9)",
                                    fontWeight: "500"
                                }}>
                                    {org.category}
                                </span>
                            )}
                            <h1 style={{
                                margin: "0 0 8px 0",
                                fontSize: "1.85rem",
                                fontWeight: "700",
                                color: "white",
                                letterSpacing: "-0.3px"
                            }}>
                                {org.name}
                            </h1>
                            <p style={{
                                margin: 0,
                                color: "rgba(255,255,255,0.75)",
                                fontSize: "0.95rem",
                                lineHeight: "1.6",
                                maxWidth: "500px"
                            }}>
                                {org.description || "Organisasi edukasi dan pelatihan profesional"}
                            </p>
                        </div>

                        {/* Stats Badge */}
                        <div style={{
                            background: "rgba(255,255,255,0.1)",
                            padding: "18px 24px",
                            borderRadius: "14px",
                            textAlign: "center",
                            border: "1px solid rgba(255,255,255,0.1)"
                        }}>
                            <div style={{ fontSize: "2rem", fontWeight: "800", color: "white" }}>
                                {events.length}
                            </div>
                            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.8rem", fontWeight: "500" }}>
                                Event
                            </div>
                        </div>
                    </div>

                    {/* Contact Info Row - Inside Hero */}
                    {hasContactInfo && (
                        <div style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "16px 28px",
                            paddingTop: "20px",
                            borderTop: "1px solid rgba(255,255,255,0.1)"
                        }}>
                            {org.email && (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "1rem" }}>✉️</span>
                                    <span style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.85rem" }}>{org.email}</span>
                                </div>
                            )}
                            {org.phone && (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "1rem" }}>📞</span>
                                    <span style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.85rem" }}>{org.phone}</span>
                                </div>
                            )}
                            {org.website && (
                                <a
                                    href={org.website.startsWith('http') ? org.website : `https://${org.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}
                                >
                                    <span style={{ fontSize: "1rem" }}>🌐</span>
                                    <span style={{ color: "#93c5fd", fontSize: "0.85rem" }}>Website →</span>
                                </a>
                            )}
                            {org.social_link && (
                                <a
                                    href={org.social_link.startsWith('http') ? org.social_link : `https://${org.social_link}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}
                                >
                                    <span style={{ fontSize: "1rem" }}>📲</span>
                                    <span style={{ color: "#93c5fd", fontSize: "0.85rem" }}>Social →</span>
                                </a>
                            )}
                            {org.address && (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "1rem" }}>📍</span>
                                    <span style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.85rem" }}>{org.address}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px" }}>

                {/* Events Section */}
                <div>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "28px",
                        flexWrap: "wrap",
                        gap: "16px"
                    }}>
                        <h2 style={{
                            fontSize: "1.1rem",
                            fontWeight: "700",
                            color: "#64748b",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                            margin: 0
                        }}>
                            Event & Kursus
                        </h2>
                        {events.length > 0 && (
                            <span style={{
                                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                                color: "white",
                                padding: "8px 16px",
                                borderRadius: "30px",
                                fontSize: "0.85rem",
                                fontWeight: "600"
                            }}>
                                {events.length} Tersedia
                            </span>
                        )}
                    </div>

                    {events.length === 0 ? (
                        <div style={{
                            textAlign: "center",
                            padding: "80px 24px",
                            background: "white",
                            borderRadius: "20px",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                            border: "1px solid #e2e8f0"
                        }}>
                            <div style={{ fontSize: "4rem", marginBottom: "20px" }}>📭</div>
                            <h3 style={{ color: "#1e293b", marginBottom: "8px" }}>Belum Ada Event</h3>
                            <p style={{ color: "#64748b", margin: 0 }}>
                                Organisasi ini belum mempublikasikan event. Cek lagi nanti!
                            </p>
                        </div>
                    ) : (
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                            gap: "24px"
                        }}>
                            {events.map(evt => (
                                <EventCard key={evt.id} event={evt} getThumbnailUrl={getThumbnailUrl} formatPrice={formatPrice} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Back Button */}
                <div style={{ textAlign: "center", marginTop: "60px", paddingBottom: "40px" }}>
                    <Link to="/" style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "#64748b",
                        textDecoration: "none",
                        fontWeight: "600",
                        padding: "12px 24px",
                        borderRadius: "12px",
                        border: "2px solid #e2e8f0",
                        background: "white",
                        transition: "all 0.2s"
                    }}>
                        ← Kembali ke Beranda
                    </Link>
                </div>
            </div>
        </div>
    );
}

// Contact Card Component
function ContactCard({ icon, label, value, isLink = false }) {
    return (
        <div style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "14px",
            background: "white",
            padding: "20px",
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
            border: "1px solid #e2e8f0",
            transition: "all 0.2s"
        }}>
            <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.25rem",
                flexShrink: 0
            }}>
                {icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                    {label}
                </div>
                {isLink ? (
                    <a
                        href={value.startsWith('http') ? value : `https://${value}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            color: "#3b82f6",
                            fontWeight: "600",
                            textDecoration: "none",
                            fontSize: "0.9rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                        }}
                    >
                        Kunjungi <span style={{ fontSize: "0.8rem" }}>→</span>
                    </a>
                ) : (
                    <div style={{
                        color: "#1e293b",
                        fontWeight: "600",
                        fontSize: "0.9rem",
                        wordBreak: "break-word"
                    }}>
                        {value}
                    </div>
                )}
            </div>
        </div>
    );
}

// Event Card Component
function EventCard({ event, getThumbnailUrl, formatPrice }) {
    const evt = event;

    return (
        <div style={{
            background: "white",
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            border: "1px solid #e2e8f0",
            transition: "all 0.3s ease"
        }}>
            {/* Thumbnail */}
            <div style={{
                height: "180px",
                background: "linear-gradient(135deg, #1e293b, #334155)",
                position: "relative",
                overflow: "hidden"
            }}>
                {evt.thumbnail_url ? (
                    <img
                        src={getThumbnailUrl(evt.thumbnail_url)}
                        alt={evt.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                ) : (
                    <div style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}>
                        <span style={{ fontSize: "4rem", opacity: 0.3 }}>📚</span>
                    </div>
                )}
                {evt.category && (
                    <div style={{
                        position: "absolute",
                        top: "16px",
                        left: "16px",
                        background: "rgba(0,0,0,0.6)",
                        backdropFilter: "blur(10px)",
                        color: "white",
                        padding: "6px 14px",
                        borderRadius: "20px",
                        fontSize: "0.75rem",
                        fontWeight: "600"
                    }}>
                        {evt.category}
                    </div>
                )}
            </div>

            {/* Content */}
            <div style={{ padding: "24px" }}>
                <h3 style={{
                    margin: "0 0 10px 0",
                    color: "#1e293b",
                    fontSize: "1.1rem",
                    fontWeight: "700",
                    lineHeight: "1.4"
                }}>
                    {evt.title}
                </h3>

                <p style={{
                    color: "#64748b",
                    fontSize: "0.9rem",
                    margin: "0 0 20px 0",
                    lineHeight: "1.6",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden"
                }}>
                    {evt.description || "Pelajari lebih lanjut tentang event ini"}
                </p>

                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px"
                }}>
                    <div style={{
                        color: "#1e293b",
                        fontWeight: "700",
                        fontSize: "1.1rem"
                    }}>
                        {formatPrice(evt.min_price)}
                    </div>
                    <Link to={`/event/${evt.id}`} style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                        color: "white",
                        padding: "12px 20px",
                        borderRadius: "12px",
                        textDecoration: "none",
                        fontWeight: "600",
                        fontSize: "0.9rem",
                        boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)"
                    }}>
                        Lihat Detail →
                    </Link>
                </div>
            </div>
        </div>
    );
}
