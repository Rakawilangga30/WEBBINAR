import { useEffect, useState } from "react";

export default function DashboardHome() {
    const [user, setUser] = useState({});

    useEffect(() => {
        const data = JSON.parse(localStorage.getItem("user") || "{}");
        setUser(data);
    }, []);

    return (
        <div style={{ padding: "20px", background: "white", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
            <h1 style={{ color: "#2d3748" }}>👋 Halo, {user.name || "User"}!</h1>
            <p style={{ color: "#718096" }}>Selamat datang kembali di Dashboard Proyek3.</p>
            
            <div style={{ marginTop: "30px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
                {/* Kartu Info Sederhana */}
                <div style={{ padding: "20px", background: "#ebf8ff", borderRadius: "8px", borderLeft: "5px solid #4299e1" }}>
                    <h3 style={{ margin: "0 0 10px 0", color: "#2b6cb0" }}>Kursus Saya</h3>
                    <p style={{ fontSize: "2rem", margin: 0, fontWeight: "bold" }}>0</p>
                </div>
                
                {user.roles?.includes("ORGANIZER") && (
                    <div style={{ padding: "20px", background: "#f0fff4", borderRadius: "8px", borderLeft: "5px solid #48bb78" }}>
                        <h3 style={{ margin: "0 0 10px 0", color: "#2f855a" }}>Event Aktif</h3>
                        <p style={{ fontSize: "2rem", margin: 0, fontWeight: "bold" }}>0</p>
                    </div>
                )}
            </div>
        </div>
    );
}