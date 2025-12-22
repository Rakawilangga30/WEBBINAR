import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post("/login", { email, password });
            
            // 1. Simpan Token
            localStorage.setItem("token", res.data.token);

            // 2. Simpan Data User + Roles (PENTING untuk Sidebar)
            const userData = {
                ...res.data.user,
                roles: res.data.roles || [] 
            };
            localStorage.setItem("user", JSON.stringify(userData));

            alert("Login Berhasil!");

            // 3. LOGIC REDIRECT (Perbaikan disini)
            if (userData.roles.includes("ADMIN")) {
            navigate("/dashboard/admin/users");
            } else if (userData.roles.includes("ORGANIZER")) {
                navigate("/dashboard/org"); // Atau ke /dashboard saja jika mau home
            } else {
                navigate("/dashboard"); // <--- Ubah ini dari "/dashboard/profile" menjadi "/dashboard"
            }

            // Reload agar Sidebar merender ulang data user
            // window.location.reload(); (Opsional, navigate biasanya cukup jika state dikelola dengan baik, tapi reload aman)
            setTimeout(() => { window.location.reload() }, 100); 

        } catch (error) {
            console.error(error);
            alert("Login Gagal: " + (error.response?.data?.error || "Cek Email/Password"));
        }
    };

    return (
        <div style={{ maxWidth: "400px", margin: "100px auto", padding: "30px", background:"white", border: "1px solid #ddd", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
            <h2 style={{ textAlign: "center", marginBottom: "20px", color:"#2d3748" }}>🔐 Masuk Akun</h2>
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <input 
                    type="email" placeholder="Email" required 
                    value={email} onChange={e => setEmail(e.target.value)}
                    style={{ padding: "12px", borderRadius: "6px", border: "1px solid #cbd5e0" }}
                />
                <input 
                    type="password" placeholder="Password" required 
                    value={password} onChange={e => setPassword(e.target.value)}
                    style={{ padding: "12px", borderRadius: "6px", border: "1px solid #cbd5e0" }}
                />
                <button type="submit" style={{ padding: "12px", background: "#3182ce", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize:"16px" }}>
                    Masuk
                </button>
            </form>
            <p style={{ textAlign: "center", marginTop: "20px", fontSize: "0.9em", color:"#718096" }}>
                Belum punya akun? <Link to="/register" style={{ color: "#3182ce", fontWeight:"bold" }}>Daftar disini</Link>
            </p>
        </div>
    );
}