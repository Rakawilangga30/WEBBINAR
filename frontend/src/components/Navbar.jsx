import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <nav style={{
      padding: "12px 32px",
      background: "linear-gradient(135deg, #1e40af, #3b82f6)",
      color: "white",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      position: "sticky",
      top: 0,
      zIndex: 100
    }}>
      {/* Logo */}
      <Link to="/" style={{
        fontSize: "1.5rem",
        fontWeight: "700",
        color: "white",
        textDecoration: "none",
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}>
        🚀 Proyek3
      </Link>

      {/* Navigation Links */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <Link to="/" style={linkStyle}>Home</Link>
        <Link to="/about" style={linkStyle}>About</Link>

        {user ? (
          <>
            <Link to="/dashboard" style={{
              ...linkStyle,
              background: "rgba(255,255,255,0.2)",
              padding: "8px 16px",
              borderRadius: "8px",
              fontWeight: "600"
            }}>
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              style={{
                background: "rgba(239, 68, 68, 0.9)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "0.9rem",
                transition: "all 0.2s ease"
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={linkStyle}>Login</Link>
            <Link to="/register" style={{
              background: "white",
              color: "#2563eb",
              padding: "10px 20px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "600",
              fontSize: "0.9rem",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}>
              Daftar
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

const linkStyle = {
  color: "rgba(255,255,255,0.9)",
  textDecoration: "none",
  fontWeight: "500",
  fontSize: "0.95rem",
  padding: "6px 12px",
  borderRadius: "6px",
  transition: "all 0.2s ease"
};