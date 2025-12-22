import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  // Cek apakah ada user di localstorage
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.clear(); // Hapus semua data
    navigate("/login");
  };

  return (
    <nav style={{ padding: "15px 30px", background: "#1a202c", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Link to="/" style={{ fontSize: "1.5rem", fontWeight: "bold", color: "white", textDecoration: "none" }}>
        🚀 Proyek3
      </Link>

      <div style={{ display: "flex", gap: "15px" }}>
        <Link to="/" style={{ color: "white", textDecoration: "none" }}>Home</Link>
        
        {/* LOGIC TOMBOL */}
        {user ? (
          // Jika SUDAH Login
          <>
            <Link to="/dashboard" style={{ color: "#63b3ed", fontWeight: "bold", textDecoration: "none" }}>
              Dashboard
            </Link>
            <button onClick={handleLogout} style={{ background: "red", color: "white", border: "none", borderRadius: "5px", padding: "5px 10px", cursor: "pointer" }}>
              Logout
            </button>
          </>
        ) : (
          // Jika BELUM Login
          <>
            <Link to="/login" style={{ color: "white", textDecoration: "none" }}>Login</Link>
            <Link to="/register" style={{ background: "#3182ce", padding: "8px 15px", borderRadius: "5px", color: "white", textDecoration: "none" }}>
              Daftar
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

// Style Helper biar rapi
const linkStyle = {
    color: "#e2e8f0",
    textDecoration: "none",
    fontWeight: "500",
    fontSize: "1em",
    transition: "color 0.2s"
};

const buttonLinkStyle = {
    color: "white",
    textDecoration: "none",
    padding: "8px 15px",
    borderRadius: "5px",
    fontWeight: "bold",
    fontSize: "0.9em"
};