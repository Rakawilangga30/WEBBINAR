import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home, User, BookOpen, Award, CreditCard, Bell,
  Rocket, BarChart2, PlusCircle, Package, DollarSign,
  LayoutDashboard, Building, FileText, CheckSquare,
  Users, Star, Megaphone, LogOut, Handshake, Wallet,
  UserCheck
} from "lucide-react";

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

  const MenuItem = ({ to, label, icon: Icon }) => {
    const active = isActive(to);
    return (
      <Link to={to} style={{ textDecoration: "none", display: "block" }}>
        <div style={{
          padding: "12px 16px",
          margin: "4px 16px",
          borderRadius: "12px",
          background: active
            ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
            : "transparent",
          color: active ? "white" : "#94a3b8",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          fontWeight: active ? "600" : "500",
          fontSize: "0.95rem",
          boxShadow: active ? "0 4px 12px rgba(37, 99, 235, 0.3)" : "none",
          position: "relative",
          overflow: "hidden"
        }}
          onMouseEnter={(e) => {
            if (!active) {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              e.currentTarget.style.color = "#f8fafc";
            }
          }}
          onMouseLeave={(e) => {
            if (!active) {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#94a3b8";
            }
          }}
        >
          <Icon size={20} strokeWidth={active ? 2.5 : 2} />
          <span>{label}</span>
          {active && (
            <div style={{
              position: "absolute",
              right: "0",
              top: "50%",
              transform: "translateY(-50%)",
              width: "4px",
              height: "20px",
              background: "white",
              borderTopLeftRadius: "4px",
              borderBottomLeftRadius: "4px",
              opacity: 0.5
            }} />
          )}
        </div>
      </Link>
    );
  };

  const SectionTitle = ({ children }) => (
    <p style={{
      padding: "24px 24px 12px",
      fontSize: "0.75rem",
      fontWeight: "700",
      color: "#475569",
      textTransform: "uppercase",
      letterSpacing: "1.2px",
      margin: 0
    }}>
      {children}
    </p>
  );

  return (
    <div style={{
      width: "280px",
      height: "100vh",
      background: "#0f172a", // Slate 900
      borderRight: "1px solid #1e293b",
      position: "fixed",
      left: 0,
      top: 0,
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      boxShadow: "4px 0 24px rgba(0,0,0,0.2)",
      zIndex: 50
    }}>
      {/* Header */}
      <div style={{
        padding: "32px 24px",
        background: "linear-gradient(to bottom, #0f172a, #1e293b)",
        marginBottom: "10px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            boxShadow: "0 0 15px rgba(59, 130, 246, 0.5)"
          }}>
            <Rocket size={22} fill="white" />
          </div>
          <h2 style={{
            margin: 0,
            fontSize: "1.5rem",
            color: "white",
            fontWeight: "800",
            letterSpacing: "-0.5px",
            background: "linear-gradient(to right, white, #94a3b8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            WEBBINAR
          </h2>
        </div>
        <div style={{
          background: "rgba(255,255,255,0.05)",
          padding: "12px",
          borderRadius: "12px",
          marginTop: "16px",
          border: "1px solid rgba(255,255,255,0.1)"
        }}>
          <p style={{
            fontSize: "0.9rem",
            color: "#e2e8f0",
            margin: "0 0 4px 0",
            fontWeight: "600"
          }}>
            {user.name || "User"}
          </p>
          <p style={{
            fontSize: "0.75rem",
            color: "#94a3b8",
            margin: 0
          }}>
            {roles.join(" • ") || "Member"}
          </p>
        </div>
      </div>

      {/* Menu Items */}
      <div className="custom-scrollbar" style={{ flex: 1, paddingBottom: "20px" }}>
        <SectionTitle>Menu Utama</SectionTitle>

        <MenuItem to="/dashboard" label="Dashboard" icon={LayoutDashboard} />
        <MenuItem to="/dashboard/profile" label="Profil Saya" icon={User} />
        <MenuItem to="/dashboard/my-courses" label="Kursus Saya" icon={BookOpen} />
        <MenuItem to="/dashboard/certificates" label="Sertifikat" icon={Award} />
        <MenuItem to="/dashboard/payments" label="Pembayaran" icon={CreditCard} />
        <MenuItem to="/dashboard/cart" label="Keranjang" icon={Package} />
        <MenuItem to="/dashboard/notifications" label="Notifikasi" icon={Bell} />


        {/* AFFILIATE Menu */}
        {roles.includes("AFFILIATE") && (
          <>
            <SectionTitle>Affiliate Area</SectionTitle>
            <MenuItem to="/dashboard/affiliate" label="Dashboard" icon={BarChart2} />
            <MenuItem to="/dashboard/affiliate/partnerships" label="Kode Promo Saya" icon={Handshake} />
            <MenuItem to="/dashboard/affiliate/withdraw" label="Tarik Dana" icon={DollarSign} />
          </>
        )}

        {/* ORGANIZER Menu */}
        {roles.includes("ORGANIZER") && (
          <>
            <SectionTitle>Creator Area</SectionTitle>
            <MenuItem to="/dashboard/org" label="Dashboard Org" icon={Building} />
            <MenuItem to="/dashboard/org/events" label="Manajemen Event" icon={FileText} />
            <MenuItem to="/dashboard/org/affiliate-requests" label="Kelola Affiliate" icon={UserCheck} />
            <MenuItem to="/dashboard/org/affiliate-stats" label="Statistik Affiliate" icon={BarChart2} />
            <MenuItem to="/dashboard/org/withdraw" label="Tarik Dana" icon={DollarSign} />
          </>
        )}

        {/* ADMIN Menu */}
        {roles.includes("ADMIN") && (
          <>
            <SectionTitle>Admin Area</SectionTitle>
            <MenuItem to="/dashboard/admin/official-org" label="Official Org" icon={Building} />
            <MenuItem to="/dashboard/admin/organizations" label="Kelola Organisasi" icon={Building} />
            <MenuItem to="/dashboard/admin/approvals" label="Persetujuan Org" icon={CheckSquare} />
            <MenuItem to="/dashboard/admin/withdrawals" label="Kelola Penarikan" icon={Wallet} />
            <MenuItem to="/dashboard/admin/users" label="Kelola User" icon={Users} />
            <MenuItem to="/dashboard/admin/featured" label="Featured Banner" icon={Star} />
            <MenuItem to="/dashboard/admin/reports" label="Kelola Laporan" icon={Megaphone} />
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: "20px 16px",
        borderTop: "1px solid #1e293b",
        background: "#0f172a"
      }}>
        <Link
          to="/"
          style={{
            width: "100%",
            padding: "12px",
            background: "transparent",
            color: "#94a3b8",
            border: "1px solid #334155",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "12px",
            textDecoration: "none",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#64748b";
            e.currentTarget.style.color = "white";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#334155";
            e.currentTarget.style.color = "#94a3b8";
          }}
        >
          <Home size={18} /> Kembali ke Home
        </Link>
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "12px",
            background: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#dc2626"}
          onMouseLeave={(e) => e.currentTarget.style.background = "#ef4444"}
        >
          <LogOut size={18} /> Keluar
        </button>
      </div>
    </div>
  );
}