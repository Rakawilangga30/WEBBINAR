import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import EventDetail from "./pages/EventDetail";
import OrgDashboard from "./pages/org/OrgDashboard"; // Import Baru
import ManageEvent from "./pages/org/ManageEvent";   // Import Baru
import CreateEvent from "./pages/org/CreateEvent";

function App() {
  return (
    <BrowserRouter>
      {/* Navbar Sedikit Dipercantik */}
      <nav style={{ padding: "15px 30px", background: "#1a202c", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", color: "white" }}>
        <div style={{ display: "flex", gap: "20px" }}>
            <Link to="/" style={{ color: "white", textDecoration: "none", fontWeight: "bold", fontSize: "1.2em" }}>🏠 E-Learning</Link>
            <Link to="/org" style={{ color: "#63b3ed", textDecoration: "none", fontWeight: "bold" }}>🎓 Dashboard Creator</Link>
        </div>
        <div style={{ display: "flex", gap: "15px" }}>
            <Link to="/login" style={{ color: "#e2e8f0", textDecoration: "none" }}>Login</Link>
            <Link to="/register" style={{ color: "#e2e8f0", textDecoration: "none" }}>Daftar</Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/event/:id" element={<EventDetail />} />
        
        {/* Route Khusus Organisasi */}
        <Route path="/org" element={<OrgDashboard />} />
        <Route path="/org/create-event" element={<CreateEvent />} /> {/* <--- Tambah ini */}
        <Route path="/org/event/:eventID/manage" element={<ManageEvent />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;