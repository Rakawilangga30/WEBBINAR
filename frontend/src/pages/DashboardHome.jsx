import { useEffect, useState } from "react";
import api from "../api";

export default function DashboardHome() {
    const [user, setUser] = useState({});
    const [courseCount, setCourseCount] = useState(0);
    const [eventCount, setEventCount] = useState(0);
    const [publishedEventCount, setPublishedEventCount] = useState(0);
    const [totalBuyers, setTotalBuyers] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const data = JSON.parse(localStorage.getItem("user") || "{}");
        setUser(data);
        fetchDashboardStats(data);
    }, []);

    const fetchDashboardStats = async (userData) => {
        try {
            // Fetch jumlah kursus yang dibeli (untuk semua user)
            const purchaseRes = await api.get("/user/purchases");
            const purchases = purchaseRes.data.purchases || [];
            // Hitung jumlah event unik yang dibeli
            const uniqueEvents = new Set(purchases.map(p => p.event_id));
            setCourseCount(uniqueEvents.size);

            // Jika user adalah Organizer, fetch data event dan pembeli
            if (userData.roles?.includes("ORGANIZER")) {
                try {
                    // Fetch events untuk menghitung published vs total
                    const eventsRes = await api.get("/organization/events");
                    const events = eventsRes.data.events || [];
                    setEventCount(events.length);
                    const published = events.filter(ev => ev.publish_status === "PUBLISHED").length;
                    setPublishedEventCount(published);

                    // Fetch report untuk total buyers
                    const reportRes = await api.get("/organization/report");
                    const reportEvents = reportRes.data.events || [];
                    const buyers = reportEvents.reduce((sum, ev) => sum + (ev.buyers || 0), 0);
                    setTotalBuyers(buyers);
                } catch (orgError) {
                    console.log("Not an organization yet or error:", orgError);
                }
            }
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {/* Welcome Section */}
            <div style={{
                background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)",
                padding: "32px",
                borderRadius: "16px",
                color: "white",
                marginBottom: "32px",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3)"
            }}>
                <div style={{
                    position: "absolute",
                    top: "-50%",
                    right: "-5%",
                    width: "200px",
                    height: "200px",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "50%"
                }}></div>
                <div style={{ position: "relative", zIndex: 1 }}>
                    <h1 style={{ margin: "0 0 8px 0", fontSize: "1.75rem", fontWeight: "700" }}>
                        👋 Halo, {user.name || "User"}!
                    </h1>
                    <p style={{ margin: 0, opacity: 0.9 }}>
                        Selamat datang kembali di Dashboard Proyek3.
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "20px"
            }}>
                {/* Kursus Saya Card */}
                <StatCard
                    title="Kursus Saya"
                    value={loading ? "..." : courseCount.toString()}
                    icon="📚"
                    color="#3b82f6"
                    bgColor="#eff6ff"
                />

                {/* Event Aktif Card - Only for Organizer */}
                {user.roles?.includes("ORGANIZER") && (
                    <StatCard
                        title="Event Aktif"
                        value={loading ? "..." : `${publishedEventCount}/${eventCount}`}
                        subtitle="Published / Total"
                        icon="🎯"
                        color="#22c55e"
                        bgColor="#f0fdf4"
                    />
                )}

                {/* Total Peserta - Only for Organizer */}
                {user.roles?.includes("ORGANIZER") && (
                    <StatCard
                        title="Total Peserta"
                        value={loading ? "..." : totalBuyers.toString()}
                        icon="👥"
                        color="#f59e0b"
                        bgColor="#fffbeb"
                    />
                )}

                {/* Pending Approval - Only for Admin */}
                {user.roles?.includes("ADMIN") && (
                    <StatCard
                        title="Pending Approval"
                        value="0"
                        icon="📋"
                        color="#ef4444"
                        bgColor="#fef2f2"
                    />
                )}
            </div>

            {/* Quick Actions */}
            <div style={{ marginTop: "32px" }}>
                <h3 style={{
                    margin: "0 0 16px 0",
                    color: "#1e293b",
                    fontSize: "1.1rem"
                }}>
                    ⚡ Aksi Cepat
                </h3>
                <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "12px"
                }}>
                    <QuickActionButton
                        label="Lihat Kursus"
                        href="/dashboard/my-courses"
                        icon="📚"
                    />
                    <QuickActionButton
                        label="Edit Profil"
                        href="/dashboard/profile"
                        icon="👤"
                    />
                    {user.roles?.includes("ORGANIZER") && (
                        <QuickActionButton
                            label="Buat Event"
                            href="/dashboard/org/create-event"
                            icon="➕"
                            primary
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({ title, value, subtitle, icon, color, bgColor }) {
    return (
        <div style={{
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column"
        }}>
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "12px"
            }}>
                <span style={{
                    fontSize: "0.9rem",
                    fontWeight: "500",
                    color: "#64748b"
                }}>
                    {title}
                </span>
                <span style={{
                    width: "40px",
                    height: "40px",
                    background: bgColor,
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.2rem"
                }}>
                    {icon}
                </span>
            </div>
            <span style={{
                fontSize: "2rem",
                fontWeight: "700",
                color: color
            }}>
                {value}
            </span>
            {subtitle && (
                <span style={{
                    fontSize: "0.75rem",
                    color: "#94a3b8",
                    marginTop: "4px"
                }}>
                    {subtitle}
                </span>
            )}
        </div>
    );
}

// Quick Action Button Component
function QuickActionButton({ label, href, icon, primary }) {
    return (
        <a
            href={href}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                background: primary ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "white",
                color: primary ? "white" : "#374151",
                border: primary ? "none" : "1px solid #d1d5db",
                borderRadius: "8px",
                fontWeight: "500",
                fontSize: "0.9rem",
                textDecoration: "none",
                transition: "all 0.2s ease",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
            }}
        >
            <span>{icon}</span>
            {label}
        </a>
    );
}