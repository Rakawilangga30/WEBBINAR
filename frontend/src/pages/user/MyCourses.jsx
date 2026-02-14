import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import { getBackendUrl } from "../../utils/url";

export default function MyCourses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyCourses();
    }, []);

    const fetchMyCourses = async () => {
        try {
            const res = await api.get("/user/purchases");
            const purchases = res.data.purchases || [];

            // Group purchases by event
            const byEvent = {};
            purchases.forEach(p => {
                const eid = p.event_id || p.EventID || 0;
                if (!byEvent[eid]) {
                    byEvent[eid] = {
                        event_id: eid,
                        event_title: p.event_title || p.EventTitle || "Untitled Event",
                        thumbnail: p.thumbnail_url || p.EventThumb || null,
                        sessions: []
                    };
                }
                byEvent[eid].sessions.push({
                    id: p.session_id || p.SessionID,
                    title: p.session_title || p.Title || "Sesi",
                    purchase_id: p.id || p.PurchaseID,
                    price: p.price_paid
                });
            });

            const grouped = Object.values(byEvent);
            setCourses(grouped);
        } catch (error) {
            console.error("Gagal ambil kursus:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <div style={{
                    width: "32px",
                    height: "32px",
                    border: "3px solid #e2e8f0",
                    borderTopColor: "#3b82f6",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 12px"
                }}></div>
                Memuat kursus...
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: "24px" }}>
                <h2 style={{ margin: "0 0 4px 0", color: "#1e293b", fontSize: "1.5rem" }}>
                    📚 Kursus Saya
                </h2>
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                    Lihat semua kursus yang telah Anda beli
                </p>
            </div>

            {courses.length === 0 ? (
                <div style={{
                    background: "white",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    padding: "48px 20px",
                    textAlign: "center"
                }}>
                    <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📭</div>
                    <p style={{ margin: "0 0 8px 0", fontWeight: "500", color: "#1e293b" }}>
                        Belum ada kursus yang diikuti
                    </p>
                    <p style={{ margin: "0 0 20px 0", color: "#64748b", fontSize: "0.9rem" }}>
                        Jelajahi kursus menarik untuk mulai belajar
                    </p>
                    <Link
                        to="/"
                        style={{
                            display: "inline-block",
                            padding: "12px 24px",
                            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                            color: "white",
                            textDecoration: "none",
                            borderRadius: "8px",
                            fontWeight: "600",
                            fontSize: "0.9rem"
                        }}
                    >
                        🔍 Jelajahi Kursus
                    </Link>
                </div>
            ) : (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "24px"
                }}>
                    {courses.map(eventGroup => (
                        <div key={eventGroup.event_id} style={{
                            background: "white",
                            borderRadius: "12px",
                            overflow: "hidden",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            transition: "transform 0.2s ease, box-shadow 0.2s ease",
                            cursor: "pointer"
                        }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = "translateY(-4px)";
                                e.currentTarget.style.boxShadow = "0 12px 25px -5px rgba(0, 0, 0, 0.15)";
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
                            }}
                        >
                            {/* Thumbnail */}
                            <div style={{
                                width: "100%",
                                height: "160px",
                                background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
                                overflow: "hidden",
                                position: "relative"
                            }}>
                                {eventGroup.thumbnail ? (
                                    <img
                                        src={getBackendUrl(eventGroup.thumbnail)}
                                        alt={eventGroup.event_title}
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                ) : (
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        height: "100%",
                                        fontSize: "3rem"
                                    }}>
                                        🎓
                                    </div>
                                )}
                                {/* Session count badge */}
                                <div style={{
                                    position: "absolute",
                                    top: "12px",
                                    right: "12px",
                                    background: "rgba(0,0,0,0.7)",
                                    color: "white",
                                    padding: "4px 10px",
                                    borderRadius: "20px",
                                    fontSize: "0.75rem",
                                    fontWeight: "600"
                                }}>
                                    {eventGroup.sessions.length} Sesi
                                </div>
                            </div>

                            {/* Card Content */}
                            <div style={{ padding: "16px" }}>
                                <h3 style={{
                                    margin: "0 0 12px 0",
                                    color: "#1e293b",
                                    fontSize: "1rem",
                                    fontWeight: "600",
                                    lineHeight: 1.4,
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden"
                                }}>
                                    {eventGroup.event_title}
                                </h3>

                                {/* Sessions Info */}
                                <div style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "6px",
                                    marginBottom: "16px"
                                }}>
                                    {eventGroup.sessions.slice(0, 3).map(s => (
                                        <span key={s.id} style={{
                                            background: "#f1f5f9",
                                            color: "#475569",
                                            padding: "4px 8px",
                                            borderRadius: "4px",
                                            fontSize: "0.7rem"
                                        }}>
                                            {s.title.length > 20 ? s.title.substring(0, 20) + "..." : s.title}
                                        </span>
                                    ))}
                                    {eventGroup.sessions.length > 3 && (
                                        <span style={{
                                            background: "#dbeafe",
                                            color: "#3b82f6",
                                            padding: "4px 8px",
                                            borderRadius: "4px",
                                            fontSize: "0.7rem",
                                            fontWeight: "500"
                                        }}>
                                            +{eventGroup.sessions.length - 3} lainnya
                                        </span>
                                    )}
                                </div>

                                {/* Action Button */}
                                <Link
                                    to={`/event/${eventGroup.event_id}`}
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        padding: "12px",
                                        background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                                        color: "white",
                                        textDecoration: "none",
                                        borderRadius: "8px",
                                        fontWeight: "600",
                                        fontSize: "0.9rem",
                                        textAlign: "center",
                                        boxSizing: "border-box"
                                    }}
                                >
                                    ▶️ Lanjut Belajar
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}