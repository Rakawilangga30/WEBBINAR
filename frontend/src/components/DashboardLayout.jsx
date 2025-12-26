import { Navigate, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import NotificationBell from "./NotificationBell";

export default function DashboardLayout() {
  const token = localStorage.getItem("token");

  // Jika tidak ada token, redirect ke login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "#f8fafc"
    }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div style={{
        flex: 1,
        marginLeft: "260px",
        minHeight: "100vh"
      }}>
        {/* Top Bar with Notification */}
        <div style={{
          padding: "16px 32px",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          borderBottom: "1px solid #e2e8f0",
          background: "white"
        }}>
          <NotificationBell />
        </div>

        {/* Content Area */}
        <div style={{
          padding: "24px 32px",
          maxWidth: "1200px",
          margin: "0 auto"
        }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
