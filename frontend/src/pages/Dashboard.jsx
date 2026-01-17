import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Crown, Radio, Calendar, Inbox, Image as ImageIcon, Clock, ChevronLeft, ChevronRight, PlayCircle } from "lucide-react";
import api from "../api";
import axios from "axios";
import "./Dashboard.css"; // Import the CSS file

export default function Dashboard() {
    const [events, setEvents] = useState([]);
    const [upcoming, setUpcoming] = useState([]);
    const [featuredEvents, setFeaturedEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);

    // Ads state
    const [sidebarLeftAds, setSidebarLeftAds] = useState([]);
    const [sidebarRightAds, setSidebarRightAds] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch events, featured events, and ads in parallel
                const [eventsRes, featuredRes, leftRes, rightRes, bannerRes] = await Promise.all([
                    api.get("/events"),
                    api.get("/featured-events").catch(() => ({ data: { featured: [] } })),
                    axios.get("http://localhost:8080/api/ads?placement=SIDEBAR_LEFT").catch(() => ({ data: [] })),
                    axios.get("http://localhost:8080/api/ads?placement=SIDEBAR_RIGHT").catch(() => ({ data: [] })),
                    axios.get("http://localhost:8080/api/ads?placement=BANNER_SLIDER").catch(() => ({ data: [] }))
                ]);

                setEvents(eventsRes.data.events || []);
                setUpcoming(eventsRes.data.upcoming || []);

                // Set ads
                setSidebarLeftAds(leftRes.data || []);
                setSidebarRightAds(rightRes.data || []);

                // Banner slider ads - displayed in the main slider
                const bannerAds = bannerRes.data || [];

                // Use featured from admin selection, fallback to first 5 events
                const featured = featuredRes.data.featured || [];

                // Create slider items: banner ads first, then featured events
                const bannerSlides = bannerAds.map(ad => ({
                    id: `ad-${ad.id}`,
                    title: ad.title,
                    description: '',
                    category: 'Iklan',
                    thumbnail_url: ad.image_url,
                    target_url: ad.target_url,
                    isAd: true
                }));

                if (featured.length > 0) {
                    const mappedFeatured = featured.map(f => ({
                        id: f.event_id,
                        title: f.title,
                        description: f.description,
                        category: f.category,
                        thumbnail_url: f.thumbnail_url,
                        organization_id: f.organization_id,
                        org_name: f.org_name,
                        isAd: false
                    }));
                    // Banner ads at the beginning, then featured events
                    setFeaturedEvents([...bannerSlides, ...mappedFeatured]);
                } else {
                    // Fallback to first 5 regular events + banner ads
                    const regularEvents = (eventsRes.data.events || []).slice(0, 5).map(e => ({ ...e, isAd: false }));
                    setFeaturedEvents([...bannerSlides, ...regularEvents]);
                }
            } catch (error) {
                console.error("Gagal load events:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
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

    // Helper to properly format thumbnail URLs
    const getThumbnailUrl = (url) => {
        if (!url) return null;
        // Clean up the URL - remove any leading slashes and ensure proper format
        let cleanUrl = url.replace(/^\/+/, '').replace(/\\/g, '/');
        // Ensure there's a slash between base and path
        return `http://localhost:8080/${cleanUrl}`;
    };

    // Helper to get ad image URL
    const getAdImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith("http")) return url;
        return `http://localhost:8080/${url.replace(/^\/+/, '').replace(/\\/g, '/')}`;
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
        <div className="dashboard-wrapper">
            {/* LEFT SIDEBAR ADS */}
            {sidebarLeftAds.length > 0 && (
                <div className="sidebar-ad sidebar-ad-left">
                    {sidebarLeftAds.map(ad => (
                        <a
                            key={ad.id}
                            href={ad.target_url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="sidebar-ad-item"
                        >
                            <img src={getAdImageUrl(ad.image_url)} alt={ad.title} />
                            <div className="sidebar-ad-info">
                                <div className="sidebar-ad-title">{ad.title}</div>
                                <div className="sidebar-ad-label">Iklan</div>
                            </div>
                        </a>
                    ))}
                </div>
            )}

            <div className="dashboard-container">

                {/* FEATURED BANNER SLIDER */}
                {featuredEvents.length > 0 && (
                    <div style={{ marginBottom: "32px" }}>
                        <div className="section-title">
                            <Radio size={28} color="#eb0707ff" fill="#f7f2f2ff" />
                            <h2>Featured Events</h2>
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
                                {featuredEvents.map((evt, idx) => {
                                    const slideContent = (
                                        <div
                                            key={evt.id}
                                            style={{
                                                minWidth: "100%",
                                                height: "280px",
                                                background: evt.thumbnail_url
                                                    ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url(${getThumbnailUrl(evt.thumbnail_url)})`
                                                    : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                                backgroundSize: "cover",
                                                backgroundPosition: "center",
                                                display: "flex",
                                                alignItems: "flex-end",
                                                padding: "32px",
                                                textDecoration: "none",
                                                color: "white",
                                                cursor: "pointer"
                                            }}
                                        >
                                            <div>
                                                {evt.category && (
                                                    <span style={{
                                                        background: evt.isAd ? "rgba(255,193,7,0.9)" : "rgba(255,255,255,0.2)",
                                                        padding: "6px 14px",
                                                        borderRadius: "20px",
                                                        fontSize: "0.8rem",
                                                        marginBottom: "12px",
                                                        display: "inline-block",
                                                        color: evt.isAd ? "#000" : "#fff"
                                                    }}>
                                                        {evt.isAd ? "📢 Iklan" : evt.category}
                                                    </span>
                                                )}
                                                <h3 style={{ margin: "0 0 8px 0", fontSize: "1.75rem", fontWeight: "700" }}>
                                                    {evt.title}
                                                </h3>
                                                <p style={{ margin: 0, opacity: 0.9, maxWidth: "500px" }}>
                                                    {evt.isAd ? "Klik untuk info lebih lanjut" : (evt.description || "").substring(0, 120) + "..."}
                                                </p>
                                            </div>
                                        </div>
                                    );

                                    // For ads, use external link. For events, use React Router Link
                                    return evt.isAd ? (
                                        <a
                                            key={evt.id}
                                            href={evt.target_url || "#"}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ minWidth: "100%", display: "block", textDecoration: "none" }}
                                        >
                                            {slideContent}
                                        </a>
                                    ) : (
                                        <Link
                                            key={evt.id}
                                            to={`/event/${evt.id}`}
                                            style={{ minWidth: "100%", display: "block", textDecoration: "none" }}
                                        >
                                            {slideContent}
                                        </Link>
                                    );
                                })}
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
                                    ><ChevronLeft size={24} color="#1e293b" /></button>
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
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
                                        }}
                                    ><ChevronRight size={24} color="#1e293b" /></button>
                                </>
                            )}
                        </div>
                    </div >
                )
                }



                {/* SEKSI 1: UPCOMING EVENTS */}
                {
                    upcoming.length > 0 && (
                        <div style={{ marginBottom: "48px" }}>
                            <div className="section-title">
                                <div style={{
                                    width: "4px",
                                    height: "32px",
                                    background: "linear-gradient(180deg, #f59e0b, #d97706)",
                                    borderRadius: "2px"
                                }}></div>
                                <Calendar size={24} color="#d97706" />
                                <h2>Coming Soon</h2>
                                <span style={{
                                    fontSize: "0.8rem",
                                    color: "#64748b",
                                    background: "#f1f5f9",
                                    padding: "4px 12px",
                                    borderRadius: "20px",
                                    fontWeight: 500
                                }}>
                                    Segera Hadir
                                </span>
                            </div>

                            <div className="event-grid">
                                {upcoming.map(evt => (
                                    <EventCard key={evt.id} event={evt} isUpcoming={true} formatDate={formatDate} getThumbnailUrl={getThumbnailUrl} />
                                ))}
                            </div>
                        </div>
                    )
                }

                {/* SEKSI 2: AVAILABLE NOW */}
                <div>
                    <div className="section-title">
                        <div style={{
                            width: "4px",
                            height: "32px",
                            background: "linear-gradient(180deg, #22c55e, #16a34a)",
                            borderRadius: "2px"
                        }}></div>
                        <Crown size={24} color="#e5ff00ff" fill="#f0c504ff" />
                        <h2>Available Now</h2>
                    </div>

                    {events.length === 0 ? (
                        <div className="empty-state">
                            <div style={{ marginBottom: "16px", display: "flex", justifyContent: "center" }}>
                                <Inbox size={64} color="#cbd5e1" />
                            </div>
                            <p style={{ margin: 0 }}>Belum ada event yang aktif saat ini.</p>
                        </div>
                    ) : (
                        <div className="event-grid">
                            {events.map(evt => (
                                <EventCard key={evt.id} event={evt} isUpcoming={false} formatDate={formatDate} getThumbnailUrl={getThumbnailUrl} />
                            ))}
                        </div>
                    )}
                </div>
            </div >

            {/* RIGHT SIDEBAR ADS */}
            {
                sidebarRightAds.length > 0 && (
                    <div className="sidebar-ad sidebar-ad-right">
                        {sidebarRightAds.map(ad => (
                            <a
                                key={ad.id}
                                href={ad.target_url || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="sidebar-ad-item"
                            >
                                <img src={getAdImageUrl(ad.image_url)} alt={ad.title} />
                                <div className="sidebar-ad-info">
                                    <div className="sidebar-ad-title">{ad.title}</div>
                                    <div className="sidebar-ad-label">Iklan</div>
                                </div>
                            </a>
                        ))}
                    </div>
                )
            }
        </div >
    );
}

// Event Card Component
function EventCard({ event, isUpcoming, formatDate, getThumbnailUrl }) {
    const evt = event;

    return (
        <div className={`event-card ${isUpcoming ? 'upcoming' : ''}`}>
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

                    <Clock size={14} color="white" /> Upcoming
                </div>
            )}

            {/* Thumbnail */}
            <div className="event-card-thumb">
                {evt.thumbnail_url ? (
                    <img
                        src={getThumbnailUrl(evt.thumbnail_url)}
                        alt={evt.title}
                    />
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                        <ImageIcon size={64} color="#94a3b8" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}>
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
                    lineHeight: "1.5",
                    flex: 1
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
                        <Clock size={16} color="#b45309" /> Tayang: {formatDate(evt.publish_at)}
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
                    transition: "all 0.2s ease",
                    marginTop: "auto"
                }}>
                    {isUpcoming ? "Lihat Detail" : "Mulai Belajar"}
                </Link>
            </div>
        </div>
    );
}