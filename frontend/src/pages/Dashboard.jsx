import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

export default function Dashboard() {
    const [events, setEvents] = useState([]);
    const [upcoming, setUpcoming] = useState([]);
    const [featuredEvents, setFeaturedEvents] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchType, setSearchType] = useState("event"); // event or org
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const [eventsRes, orgsRes] = await Promise.all([
                    api.get("/events"),
                    api.get("/organizations/public").catch(() => ({ data: { organizations: [] } }))
                ]);
                setEvents(eventsRes.data.events || []);
                setUpcoming(eventsRes.data.upcoming || []);
                setFeaturedEvents(eventsRes.data.featured || eventsRes.data.events?.slice(0, 5) || []);
                setOrganizations(orgsRes.data.organizations || []);
            } catch (error) {
                console.error("Gagal load events:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    // Auto-slide for banner
    useEffect(() => {
        if (featuredEvents.length > 1) {
            const timer = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % featuredEvents.length);
            }, 5000);
            return () => clearInterval(timer);
        }
    }, [featuredEvents.length]);

    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.length >= 2) {
            if (searchType === "event") {
                const filtered = events.filter(evt =>
                    evt.title.toLowerCase().includes(query.toLowerCase()) ||
                    (evt.description || "").toLowerCase().includes(query.toLowerCase()) ||
                    (evt.category || "").toLowerCase().includes(query.toLowerCase())
                );
                setSearchResults(filtered);
            } else {
                const filtered = organizations.filter(org =>
                    org.name.toLowerCase().includes(query.toLowerCase()) ||
                    (org.category || "").toLowerCase().includes(query.toLowerCase())
                );
                setSearchResults(filtered);
            }
            setShowResults(true);
        } else {
            setShowResults(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Coming Soon";
        return new Date(dateString).toLocaleDateString("id-ID", {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div style={{
                padding: "60px",
                textAlign: "center",
                color: "#64748b"
            }}>
                <div style={{
                    width: "40px",
                    height: "40px",
                    border: "3px solid #e2e8f0",
                    borderTopColor: "#3b82f6",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 16px"
                }}></div>
                Memuat Event...
            </div>
        );
    }

    return (
        <div style={{
            padding: "24px",
            maxWidth: "1200px",
            margin: "0 auto",
            minHeight: "100vh"
        }}>

            {/* HERO BANNER WITH SEARCH */}
            <div style={{
                background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)",
                color: "white",
                padding: "48px 40px",
                borderRadius: "16px",
                marginBottom: "32px",
                boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3)",
                position: "relative",
                overflow: "hidden"
            }}>
                <div style={{
                    position: "absolute",
                    top: "-50%",
                    right: "-10%",
                    width: "300px",
                    height: "300px",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "50%"
                }}></div>
                <div style={{
                    position: "absolute",
                    bottom: "-30%",
                    left: "20%",
                    width: "200px",
                    height: "200px",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "50%"
                }}></div>
                <div style={{ position: "relative", zIndex: 1 }}>
                    <h1 style={{ margin: "0 0 12px 0", fontSize: "2.25rem", fontWeight: "700" }}>
                        Selamat Datang di Learning Platform
                    </h1>
                    <p style={{ fontSize: "1.1rem", opacity: 0.9, margin: "0 0 24px 0", maxWidth: "600px" }}>
                        Tingkatkan skillmu dengan materi terbaik dari para ahli.
                    </p>

                    {/* SEARCH BAR */}
                    <div style={{ position: "relative", maxWidth: "600px" }}>
                        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                            <button
                                onClick={() => { setSearchType("event"); setSearchResults([]); setSearchQuery(""); }}
                                style={{
                                    padding: "8px 16px",
                                    background: searchType === "event" ? "white" : "rgba(255,255,255,0.2)",
                                    color: searchType === "event" ? "#3b82f6" : "white",
                                    border: "none",
                                    borderRadius: "20px",
                                    cursor: "pointer",
                                    fontWeight: "600",
                                    fontSize: "0.85rem"
                                }}
                            >
                                🎓 Cari Event
                            </button>
                            <button
                                onClick={() => { setSearchType("org"); setSearchResults([]); setSearchQuery(""); }}
                                style={{
                                    padding: "8px 16px",
                                    background: searchType === "org" ? "white" : "rgba(255,255,255,0.2)",
                                    color: searchType === "org" ? "#3b82f6" : "white",
                                    border: "none",
                                    borderRadius: "20px",
                                    cursor: "pointer",
                                    fontWeight: "600",
                                    fontSize: "0.85rem"
                                }}
                            >
                                🏢 Cari Organisasi
                            </button>
                        </div>
                        <div style={{ position: "relative" }}>
                            <input
                                type="text"
                                placeholder={searchType === "event" ? "Cari event atau materi..." : "Cari organisasi..."}
                                value={searchQuery}
                                onChange={handleSearch}
                                onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                                style={{
                                    width: "100%",
                                    padding: "14px 20px",
                                    paddingLeft: "48px",
                                    borderRadius: "12px",
                                    border: "none",
                                    fontSize: "1rem",
                                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                                }}
                            />
                            <span style={{
                                position: "absolute",
                                left: "16px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                fontSize: "1.2rem"
                            }}>🔍</span>
                        </div>

                        {/* Search Results Dropdown */}
                        {showResults && searchResults.length > 0 && (
                            <div style={{
                                position: "absolute",
                                top: "100%",
                                left: 0,
                                right: 0,
                                background: "white",
                                borderRadius: "12px",
                                boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                                marginTop: "8px",
                                maxHeight: "300px",
                                overflowY: "auto",
                                zIndex: 100
                            }}>
                                {searchResults.map((item, idx) => (
                                    <Link
                                        key={idx}
                                        to={searchType === "event" ? `/event/${item.id}` : `/organization/${item.id}`}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "12px",
                                            padding: "12px 16px",
                                            borderBottom: "1px solid #e2e8f0",
                                            color: "#1e293b",
                                            textDecoration: "none"
                                        }}
                                    >
                                        <div style={{
                                            width: "48px",
                                            height: "48px",
                                            borderRadius: "8px",
                                            background: "#f1f5f9",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            overflow: "hidden"
                                        }}>
                                            {(item.thumbnail_url || item.logo_url) ? (
                                                <img
                                                    src={`http://localhost:8080/${(item.thumbnail_url || item.logo_url || "").replace(/^\/+/, "")}`}
                                                    alt=""
                                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                />
                                            ) : (
                                                <span style={{ fontSize: "1.5rem" }}>{searchType === "event" ? "🎓" : "🏢"}</span>
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: "600" }}>{item.title || item.name}</div>
                                            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                                {item.category || "Umum"}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* FEATURED BANNER SLIDER */}
            {featuredEvents.length > 0 && (
                <div style={{ marginBottom: "48px" }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "16px"
                    }}>
                        <span style={{ fontSize: "1.5rem" }}>⭐</span>
                        <h2 style={{ margin: 0, color: "#1e293b", fontSize: "1.25rem" }}>Featured Events</h2>
                    </div>

                    <div style={{
                        position: "relative",
                        borderRadius: "16px",
                        overflow: "hidden",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
                    }}>
                        {/* Slides */}
                        <div style={{
                            display: "flex",
                            transition: "transform 0.5s ease",
                            transform: `translateX(-${currentSlide * 100}%)`
                        }}>
                            {featuredEvents.map((evt, idx) => (
                                <Link
                                    key={evt.id}
                                    to={`/event/${evt.id}`}
                                    style={{
                                        minWidth: "100%",
                                        height: "280px",
                                        background: evt.thumbnail_url
                                            ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url(http://localhost:8080/${(evt.thumbnail_url || "").replace(/^\/+/, "")})`
                                            : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                        display: "flex",
                                        alignItems: "flex-end",
                                        padding: "32px",
                                        textDecoration: "none",
                                        color: "white"
                                    }}
                                >
                                    <div>
                                        {evt.category && (
                                            <span style={{
                                                background: "rgba(255,255,255,0.2)",
                                                padding: "6px 14px",
                                                borderRadius: "20px",
                                                fontSize: "0.8rem",
                                                marginBottom: "12px",
                                                display: "inline-block"
                                            }}>
                                                {evt.category}
                                            </span>
                                        )}
                                        <h3 style={{ margin: "0 0 8px 0", fontSize: "1.75rem", fontWeight: "700" }}>
                                            {evt.title}
                                        </h3>
                                        <p style={{ margin: 0, opacity: 0.9, maxWidth: "500px" }}>
                                            {(evt.description || "").substring(0, 120)}...
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Dots */}
                        <div style={{
                            position: "absolute",
                            bottom: "16px",
                            right: "32px",
                            display: "flex",
                            gap: "8px"
                        }}>
                            {featuredEvents.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentSlide(idx)}
                                    style={{
                                        width: currentSlide === idx ? "24px" : "8px",
                                        height: "8px",
                                        borderRadius: "4px",
                                        background: currentSlide === idx ? "white" : "rgba(255,255,255,0.5)",
                                        border: "none",
                                        cursor: "pointer",
                                        transition: "all 0.3s ease"
                                    }}
                                />
                            ))}
                        </div>

                        {/* Nav Arrows */}
                        {featuredEvents.length > 1 && (
                            <>
                                <button
                                    onClick={() => setCurrentSlide((prev) => (prev - 1 + featuredEvents.length) % featuredEvents.length)}
                                    style={{
                                        position: "absolute",
                                        left: "16px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        width: "40px",
                                        height: "40px",
                                        borderRadius: "50%",
                                        background: "rgba(255,255,255,0.9)",
                                        border: "none",
                                        cursor: "pointer",
                                        fontSize: "1.2rem",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                    }}
                                >←</button>
                                <button
                                    onClick={() => setCurrentSlide((prev) => (prev + 1) % featuredEvents.length)}
                                    style={{
                                        position: "absolute",
                                        right: "16px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        width: "40px",
                                        height: "40px",
                                        borderRadius: "50%",
                                        background: "rgba(255,255,255,0.9)",
                                        border: "none",
                                        cursor: "pointer",
                                        fontSize: "1.2rem",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                    }}
                                >→</button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* SEKSI 1: UPCOMING EVENTS */}
            {upcoming.length > 0 && (
                <div style={{ marginBottom: "48px" }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "24px"
                    }}>
                        <div style={{
                            width: "4px",
                            height: "32px",
                            background: "linear-gradient(180deg, #f59e0b, #d97706)",
                            borderRadius: "2px"
                        }}></div>
                        <h2 style={{ margin: 0, color: "#1e293b", fontSize: "1.5rem" }}>
                            📅 Coming Soon
                        </h2>
                        <span style={{
                            fontSize: "0.8rem",
                            color: "#64748b",
                            background: "#f1f5f9",
                            padding: "4px 12px",
                            borderRadius: "20px"
                        }}>
                            Segera Hadir
                        </span>
                    </div>

                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                        gap: "24px"
                    }}>
                        {upcoming.map(evt => (
                            <EventCard key={evt.id} event={evt} isUpcoming={true} formatDate={formatDate} />
                        ))}
                    </div>
                </div>
            )}

            {/* SEKSI 2: AVAILABLE NOW */}
            <div>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "24px"
                }}>
                    <div style={{
                        width: "4px",
                        height: "32px",
                        background: "linear-gradient(180deg, #22c55e, #16a34a)",
                        borderRadius: "2px"
                    }}></div>
                    <h2 style={{ margin: 0, color: "#1e293b", fontSize: "1.5rem" }}>
                        🔥 Available Now
                    </h2>
                </div>

                {events.length === 0 ? (
                    <div style={{
                        textAlign: "center",
                        padding: "60px 20px",
                        background: "#f8fafc",
                        borderRadius: "12px",
                        color: "#64748b"
                    }}>
                        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📭</div>
                        <p style={{ margin: 0 }}>Belum ada event yang aktif saat ini.</p>
                    </div>
                ) : (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                        gap: "24px"
                    }}>
                        {events.map(evt => (
                            <EventCard key={evt.id} event={evt} isUpcoming={false} formatDate={formatDate} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// Event Card Component
function EventCard({ event, isUpcoming, formatDate }) {
    const evt = event;

    return (
        <div style={{
            background: "white",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            transition: "all 0.3s ease",
            position: "relative",
            border: isUpcoming ? "2px solid #fef3c7" : "1px solid #e2e8f0"
        }}>
            {/* Badge Upcoming */}
            {isUpcoming && (
                <div style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    color: "white",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    zIndex: 1
                }}>
                    🔜 Upcoming
                </div>
            )}

            {/* Thumbnail */}
            <div style={{
                height: "180px",
                background: "linear-gradient(135deg, #e2e8f0, #cbd5e1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748b",
                overflow: "hidden"
            }}>
                {evt.thumbnail_url ? (
                    <img
                        src={(evt.thumbnail_url || "").startsWith("http") ? evt.thumbnail_url : `http://localhost:8080/${(evt.thumbnail_url || "").replace(/^\/+/, "")}`}
                        alt={evt.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                ) : (
                    <span style={{ fontSize: "3rem" }}>🖼️</span>
                )}
            </div>

            {/* Content */}
            <div style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                    <h3 style={{
                        margin: 0,
                        color: "#1e293b",
                        fontSize: "1.1rem",
                        fontWeight: "600",
                        flex: 1,
                        paddingRight: "8px"
                    }}>
                        {evt.title}
                    </h3>
                    {evt.category && (
                        <span style={{
                            background: "#eff6ff",
                            color: "#3b82f6",
                            fontSize: "0.7rem",
                            padding: "4px 10px",
                            borderRadius: "20px",
                            fontWeight: "500",
                            whiteSpace: "nowrap"
                        }}>
                            {evt.category}
                        </span>
                    )}
                </div>

                <p style={{
                    color: "#64748b",
                    fontSize: "0.9rem",
                    margin: "0 0 16px 0",
                    lineHeight: "1.5"
                }}>
                    {evt.description?.substring(0, 100)}...
                </p>

                {/* Tanggal untuk Upcoming */}
                {isUpcoming && (
                    <div style={{
                        background: "#fffbeb",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px dashed #fbbf24",
                        fontSize: "0.85rem",
                        color: "#b45309",
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}>
                        ⏰ Tayang: {formatDate(evt.publish_at)}
                    </div>
                )}

                {/* Button */}
                <Link to={`/event/${evt.id}`} style={{
                    display: "block",
                    textAlign: "center",
                    background: isUpcoming
                        ? "white"
                        : "linear-gradient(135deg, #3b82f6, #2563eb)",
                    color: isUpcoming ? "#f59e0b" : "white",
                    border: isUpcoming ? "2px solid #f59e0b" : "none",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontWeight: "600",
                    fontSize: "0.9rem",
                    transition: "all 0.2s ease"
                }}>
                    {isUpcoming ? "Lihat Detail" : "Mulai Belajar"}
                </Link>
            </div>
        </div>
    );
}