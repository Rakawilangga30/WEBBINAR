import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Import Halaman
import Dashboard from "./pages/Dashboard";         // Halaman Public Home
import EventDetail from "./pages/EventDetail";     // Halaman Public Detail
import MyOrganization from "./pages/org/MyOrganization"; // <--- IMPORT BARU (List Event)
import ManageEvent from "./pages/org/ManageEvent"; // Halaman Manage (Upload/Publish)
// Import Login/Register nanti disini...

function App() {
  return (
    <Router>
      <Routes>
        {/* 1. Rute Dashboard Public */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* 2. Rute Detail Event Public */}
        <Route path="/event/:id" element={<EventDetail />} />

        {/* 3. Rute Organization / Creator */}
        {/* Halaman List Event milik Creator */}
        <Route path="/org" element={<MyOrganization />} /> 
        
        {/* Halaman Kelola Event (Upload Video, Publish, dll) */}
        <Route path="/org/event/:eventID/manage" element={<ManageEvent />} />

        {/* 4. Fallback 404 */}
        <Route path="*" element={<div style={{padding:40, textAlign:"center"}}><h2>404 Page Not Found</h2><p>Halaman tidak ditemukan.</p></div>} />
      </Routes>
    </Router>
  );
}

export default App;