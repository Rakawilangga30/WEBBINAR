import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const roles = user.roles || [];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const MenuItem = ({ to, label, icon }) => (
    <Link to={to} style={{ textDecoration: "none" }}>
      <div style={{
        padding: "12px 16px",
        margin: "4px 12px",
        borderRadius: "8px",
        backgroundColor: isActive(to) ? "#3b82f6" : "transparent",
        color: isActive(to) ? "white" : "#64748b",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        transition: "all 0.2s ease",
        fontWeight: isActive(to) ? "600" : "500",
        fontSize: "0.9rem"
      }}>
        <span style={{ fontSize: "1.1rem" }}>{icon}</span>
        <span>{label}</span>
      </div>
    </Link>
  );

  const SectionTitle = ({ children }) => (
    <p style={{
      padding: "16px 16px 8px",
      fontSize: "0.7rem",
      fontWeight: "600",
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: "1px"
    }}>
      {children}
    </p>
  );

  return (
    <div style={{
      width: "260px",
      height: "100vh",
      backgroundColor: "#ffffff",
      borderRight: "1px solid #e2e8f0",
      position: "fixed",
      left: 0,
      top: 0,
      overflowY: "auto",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Header */}
      <div style={{
        padding: "20px 16px",
        borderBottom: "1px solid #e2e8f0",
        background: "linear-gradient(135deg, #1e40af, #3b82f6)"
      }}>
        <h2 style={{
          margin: 0,
          fontSize: "1.25rem",
          color: "white",
          fontWeight: "700"
        }}>
          🚀 Proyek3
        </h2>
        <p style={{
          fontSize: "0.85rem",
          color: "rgba(255,255,255,0.8)",
          margin: "4px 0 0 0"
        }}>
          Halo, {user.name?.split(" ")[0] || "User"}
        </p>
      </div>

      {/* Menu Items */}
      <div style={{ flex: 1, padding: "8px 0" }}>
        <SectionTitle>Menu Utama</SectionTitle>

        <MenuItem to="/dashboard" label="Dashboard" icon="🏠" />
        <MenuItem to="/dashboard/profile" label="Profil Saya" icon="👤" />
        <MenuItem to="/dashboard/my-courses" label="Kursus Saya" icon="📚" />

        {/* Jadi Creator - Only show for regular users (not ORGANIZER, AFFILIATE, or ADMIN) */}
        {!roles.includes("ORGANIZER") && !roles.includes("AFFILIATE") && !roles.includes("ADMIN") && (
          <MenuItem to="/dashboard/become-creator" label="Jadi Creator" icon="🚀" />
        )}

        {/* AFFILIATE Menu */}
        {roles.includes("AFFILIATE") && (
          <>
            <SectionTitle>Affiliate Area</SectionTitle>
            <MenuItem to="/dashboard/affiliate" label="Dashboard" icon="📊" />
            <MenuItem to="/dashboard/affiliate/submit" label="Ajukan Event" icon="➕" />
            <MenuItem to="/dashboard/affiliate/events" label="Event Saya" icon="📦" />
            <MenuItem to="/dashboard/affiliate/withdraw" label="Tarik Dana" icon="💸" />
          </>
        )}

        {/* ORGANIZER Menu */}
        {roles.includes("ORGANIZER") && (
          <>
            <SectionTitle>Creator Area</SectionTitle>
            <MenuItem to="/dashboard/org" label="Dashboard Org" icon="🏢" />
            <MenuItem to="/dashboard/org/events" label="Report" icon="📊" />
            <MenuItem to="/dashboard/org/withdraw" label="Tarik Dana" icon="💸" />
          </>
        )}

        {/* ADMIN Menu */}
        {roles.includes("ADMIN") && (
          <>
            <SectionTitle>Admin Area</SectionTitle>
            <MenuItem to="/dashboard/admin/users" label="Kelola User" icon="👥" />
            <MenuItem to="/dashboard/admin/organizations" label="Kelola Organisasi" icon="🏢" />
            <MenuItem to="/dashboard/admin/approvals" label="Persetujuan Org" icon="📝" />
            <MenuItem to="/dashboard/admin/affiliates" label="Pengajuan Affiliate" icon="🤝" />
            <MenuItem to="/dashboard/admin/official-org" label="Official Org" icon="🏛️" />
            <MenuItem to="/dashboard/admin/reports" label="Kelola Laporan" icon="📢" />
          </>
        )}
      </div>

      {/* Footer - Home & Logout */}
      <div style={{
        padding: "16px",
        borderTop: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        gap: "10px"
      }}>
        <Link
          to="/"
          style={{
            width: "100%",
            padding: "12px",
            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.2s ease",
            textDecoration: "none"
          }}
        >
          🏠 Kembali ke Home
        </Link>
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "12px",
            background: "linear-gradient(135deg, #ef4444, #dc2626)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.2s ease"
          }}
        >
          🚪 Keluar
        </button>
      </div>
    </div>
  );
}