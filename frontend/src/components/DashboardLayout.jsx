import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function DashboardLayout() {
  // 1. Cek apakah user punya tiket (token)
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  // 2. Jika tidak ada token, tendang ke Login
  if (!token || !user) {
    alert("Silakan login terlebih dahulu untuk mengakses Dashboard.");
    return <Navigate to="/login" replace />;
  }

  // 3. Jika aman, tampilkan Dashboard dengan Sidebar
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ marginLeft: "260px", width: "100%", padding: "30px", backgroundColor: "#f7fafc", minHeight: "100vh" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            <Outlet />
        </div>
      </div>
    </div>
  );
}
