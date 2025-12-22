import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Ambil data user dari localStorage (asumsi disimpan saat login)
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const roles = user.roles || [];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path ? "#2b6cb0" : "transparent";
  const textCol = (path) => location.pathname === path ? "white" : "#cbd5e0";

  // Style item menu
  const MenuItem = ({ to, label, icon }) => (
    <Link to={to} style={{ textDecoration: "none" }}>
      <div style={{
        padding: "12px 20px", margin: "5px 10px", borderRadius: "8px",
        backgroundColor: isActive(to), color: textCol(to),
        display: "flex", alignItems: "center", gap: "10px", transition: "0.3s"
      }}>
        <span>{icon}</span>
        <span style={{ fontWeight: 500 }}>{label}</span>
      </div>
    </Link>
  );

  return (
    <div style={{ width: "260px", height: "100vh", backgroundColor: "#1a202c", color: "white", position: "fixed", left: 0, top: 0, overflowY: "auto" }}>
      <div style={{ padding: "20px", borderBottom: "1px solid #2d3748" }}>
        <h2 style={{ margin: 0, fontSize: "1.2rem" }}>🚀 Proyek3</h2>
        <p style={{ fontSize: "0.8rem", color: "#718096", margin: 0 }}>Halo, {user.name?.split(" ")[0]}</p>
      </div>

      <div style={{ padding: "20px 0" }}>
        <p style={{ padding: "0 20px", fontSize: "0.75rem", color: "#718096", textTransform: "uppercase", letterSpacing: "1px" }}>Menu Utama</p>
        
        {/* SEMUA USER punya menu ini */}
        <MenuItem to="/dashboard/profile" label="Profil Saya" icon="👤" />
        <MenuItem to="/dashboard/my-courses" label="Kursus Saya" icon="📚" />

        {/* MENU KHUSUS ORGANIZER */}
        {roles.includes("ORGANIZER") && (
          <>
            <p style={{ padding: "20px 20px 5px", fontSize: "0.75rem", color: "#718096", textTransform: "uppercase", letterSpacing: "1px" }}>Creator Area</p>
            <MenuItem to="/dashboard/org" label="Dashboard Org" icon="🏢" />
            <MenuItem to="/dashboard/org/events" label="Kelola Event" icon="📅" />
          </>
        )}

        {/* MENU KHUSUS ADMIN */}
        {roles.includes("ADMIN") && (
          <>
            <p style={{ padding: "20px 20px 5px", fontSize: "0.75rem", color: "#718096", textTransform: "uppercase", letterSpacing: "1px" }}>Admin Area</p>
            <MenuItem to="/dashboard/admin/users" label="Kelola User" icon="👥" />
            <MenuItem to="/dashboard/admin/approvals" label="Persetujuan Org" icon="📝" />
          </>
        )}
      </div>

      <div style={{ padding: "20px", borderTop: "1px solid #2d3748", marginTop: "auto" }}>
        <button onClick={handleLogout} style={{ width: "100%", padding: "10px", backgroundColor: "#c53030", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
          Keluar
        </button>
      </div>
    </div>
  );
}