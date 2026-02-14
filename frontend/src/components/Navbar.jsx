import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Rocket, ChevronDown, LogOut, LayoutDashboard, User, LogIn, GraduationCap, Building2, ShoppingCart } from "lucide-react";
import { getBackendUrl } from "../utils/url";
import api from "../api";
import "./Navbar.css"; // Import the new CSS file

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("all"); // all, event, org
  const [searchResults, setSearchResults] = useState({ events: [], organizations: [] });
  const [showResults, setShowResults] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [events, setEvents] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const searchRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [eventsRes, orgsRes] = await Promise.all([
          api.get("/events"),
          api.get("/organizations/public").catch(() => ({ data: { organizations: [] } }))
        ]);
        setEvents(eventsRes.data.events || []);
        setOrganizations(orgsRes.data.organizations || []);
      } catch (error) {
        console.error("Failed to load search data:", error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length >= 2) {
      const filteredEvents = events.filter(evt =>
        evt.title.toLowerCase().includes(query.toLowerCase()) ||
        (evt.description || "").toLowerCase().includes(query.toLowerCase()) ||
        (evt.category || "").toLowerCase().includes(query.toLowerCase())
      );

      const filteredOrgs = organizations.filter(org =>
        org.name.toLowerCase().includes(query.toLowerCase()) ||
        (org.category || "").toLowerCase().includes(query.toLowerCase())
      );

      if (searchType === "event") {
        setSearchResults({ events: filteredEvents, organizations: [] });
      } else if (searchType === "org") {
        setSearchResults({ events: [], organizations: filteredOrgs });
      } else {
        setSearchResults({ events: filteredEvents, organizations: filteredOrgs });
      }
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const getThumbnailUrl = (url) => {
    if (!url) return null;
    return getBackendUrl(url);
  };

  const getSearchTypeLabel = () => {
    if (searchType === "event") return "Event";
    if (searchType === "org") return "Organisasi";
    return "Semua";
  };

  const totalResults = searchResults.events.length + searchResults.organizations.length;

  return (
    <nav className="navbar-container animate-slide-down">
      {/* Logo */}
      <Link to="/" className="navbar-logo">
        <div className="logo-icon-bg">
          <Rocket size={22} strokeWidth={2.5} />
        </div>
        <span>WEBBINAR</span>
      </Link>

      {/* Search Bar */}
      <div ref={searchRef} className="search-container">
        <div className="search-wrapper">
          {/* Dropdown Button */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="dropdown-btn"
            >
              <span style={{ color: "var(--primary-600)" }}>
                {searchType === "event" ? <GraduationCap size={18} /> :
                  searchType === "org" ? <Building2 size={18} /> :
                    <Search size={18} />}
              </span>
              {getSearchTypeLabel()}
              <ChevronDown size={14} style={{ opacity: 0.5 }} />
            </button>

            {showDropdown && (
              <div className="animate-scale-in" style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                background: "white",
                borderRadius: "16px",
                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                overflow: "hidden",
                zIndex: 200,
                minWidth: "180px",
                border: "1px solid #f1f5f9",
                padding: "6px"
              }}>
                {[
                  { id: 'all', label: 'Semua', icon: <Search size={16} /> },
                  { id: 'event', label: 'Event', icon: <GraduationCap size={16} /> },
                  { id: 'org', label: 'Organisasi', icon: <Building2 size={16} /> }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { setSearchType(opt.id); setShowDropdown(false); handleSearch({ target: { value: searchQuery } }); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      width: "100%",
                      padding: "10px 12px",
                      border: "none",
                      background: searchType === opt.id ? "#eff6ff" : "transparent",
                      color: searchType === opt.id ? "#2563eb" : "#64748b",
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      fontWeight: searchType === opt.id ? "600" : "500",
                      borderRadius: "8px",
                      transition: "all 0.2s"
                    }}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Input */}
          <div className="search-input-group">
            <Search size={18} style={{ position: "absolute", left: "14px", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Cari event atau organisasi..."
              value={searchQuery}
              onChange={handleSearch}
              onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
              className="search-input"
            />
          </div>
        </div>

        {/* Search Results */}
        {showResults && totalResults > 0 && (
          <div className="search-results-dropdown animate-slide-up">
            {/* Events Section */}
            {searchResults.events.length > 0 && (
              <>
                <div style={{
                  padding: "8px 12px",
                  color: "#94a3b8",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                }}>
                  Event Ditemukan
                </div>
                {searchResults.events.slice(0, 5).map((item) => (
                  <Link
                    key={`event-${item.id}`}
                    to={`/event/${item.id}`}
                    onClick={() => { setShowResults(false); setSearchQuery(""); }}
                    style={resultItemStyle}
                  >
                    <div style={resultThumbStyle}>
                      {item.thumbnail_url ? (
                        <img
                          src={getThumbnailUrl(item.thumbnail_url)}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <GraduationCap size={20} color="#3b82f6" />
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: "600", color: "#1e293b", fontSize: "0.95rem" }}>{item.title}</div>
                      <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{item.category || "Umum"}</div>
                    </div>
                  </Link>
                ))}
              </>
            )}

            {/* Organizations Section */}
            {searchResults.organizations.length > 0 && (
              <>
                <div style={{
                  padding: "12px 12px 8px",
                  color: "#94a3b8",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderTop: searchResults.events.length > 0 ? "1px solid #f1f5f9" : "none"
                }}>
                  Organisasi
                </div>
                {searchResults.organizations.slice(0, 5).map((item) => (
                  <Link
                    key={`org-${item.id}`}
                    to={`/organization/${item.id}`}
                    onClick={() => { setShowResults(false); setSearchQuery(""); }}
                    style={resultItemStyle}
                  >
                    <div style={resultThumbStyle}>
                      {item.logo_url ? (
                        <img
                          src={getThumbnailUrl(item.logo_url)}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <Building2 size={20} color="#3b82f6" />
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: "600", color: "#1e293b", fontSize: "0.95rem" }}>{item.name}</div>
                      <div style={{ fontSize: "0.8rem", color: "#3b82f6" }}>Organisasi</div>
                    </div>
                  </Link>
                ))}
              </>
            )}
          </div>
        )}

        {/* No Results */}
        {showResults && searchQuery.length >= 2 && totalResults === 0 && (
          <div className="search-results-dropdown animate-scale-in" style={{ padding: "40px 20px", textAlign: "center" }}>
            <div style={{ width: "60px", height: "60px", background: "#f1f5f9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Search size={24} color="#94a3b8" />
            </div>
            <p style={{ margin: 0, color: "#64748b" }}>Tidak ditemukan hasil untuk <br /><strong style={{ color: "#1e293b" }}>"{searchQuery}"</strong></p>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <div className="nav-links">
        <Link to="/" className="nav-item">Home</Link>
        <Link to="/about" className="nav-item">About</Link>

        {user ? (
          <>
            <Link to="/dashboard/cart" className="btn-cart" title="Keranjang" style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "rgba(59, 130, 246, 0.1)",
              color: "#3b82f6",
              transition: "all 0.2s ease"
            }}>
              <ShoppingCart size={20} strokeWidth={2} />
            </Link>
            <Link to="/dashboard" className="btn-dashboard">
              <LayoutDashboard size={18} strokeWidth={2.5} />
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="btn-logout"
              title="Logout"
            >
              <LogOut size={20} strokeWidth={2.5} style={{ marginLeft: "2px" }} />
            </button>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", borderLeft: "1px solid #8f9296ff", paddingLeft: "12px" }}>
            <Link to="/login" className="btn-login">
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <LogIn size={18} /> Masuk
              </span>
            </Link>
            <Link to="/register" className="btn-register">
              Daftar
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

const resultItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "10px 12px",
  textDecoration: "none",
  transition: "all 0.2s ease",
  borderRadius: "12px",
  margin: "2px 0",
};

const resultThumbStyle = {
  width: "42px",
  height: "42px",
  borderRadius: "10px",
  background: "#f1f5f9",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  flexShrink: 0,
  border: "1px solid #e2e8f0"
};