import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// COMPONENTS
import Navbar from "./components/Navbar";
import DashboardLayout from "./components/DashboardLayout";

// PUBLIC PAGES (Bisa diakses siapa saja)
import LandingPage from "./pages/Dashboard"; // Asumsi "Dashboard.jsx" yang lama adalah Landing Page kamu
import EventDetail from "./pages/EventDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";

// PROTECTED PAGES (Harus Login)
import DashboardHome from "./pages/DashboardHome"; // Halaman "Halo User" (Buat file ini jika belum ada)
import UserProfile from "./pages/user/UserProfile";
import UserList from "./pages/admin/UserList";
import AdminOrgApprovals from "./pages/admin/AdminOrgApprovals";
import OrgApplicationDetail from "./pages/admin/OrgApplicationDetail";
import AdminOrgList from "./pages/admin/AdminOrgList";
import AdminOrgDetail from "./pages/admin/AdminOrgDetail";
import MyOrganization from "./pages/org/MyOrganization";
import ManageEvent from "./pages/org/ManageEvent";
import CreateEvent from "./pages/org/CreateEvent";
import MyCourses from "./pages/user/MyCourses";
import BecomeCreator from "./pages/user/BecomeCreator";
import Notifications from "./pages/user/Notifications";
import OrgEventList from "./pages/org/OrgEventList";
import EventBuyers from "./pages/org/EventBuyers";
import UserDetail from "./pages/admin/UserDetail";

function App() {
  return (
    <Router>
      <Routes>
        {/* === AREA PUBLIK (Bebas Masuk) === */}
        {/* Navbar dipasang manual di sini agar muncul di halaman depan */}
        <Route path="/" element={<><Navbar /><LandingPage /></>} />
        <Route path="/event/:id" element={<><Navbar /><EventDetail /></>} />

        {/* Halaman Login/Register (Tanpa Navbar) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />


        {/* === AREA PRIVATE (Harus Login) === */}
        {/* DashboardLayout akan mengecek token. Kalau tidak ada, ditendang ke Login */}
        <Route path="/dashboard" element={<DashboardLayout />}>

          {/* Halaman Default Dashboard */}
          <Route index element={<DashboardHome />} />

          {/* User Routes */}
          <Route path="profile" element={<UserProfile />} />
          {/* Tambahkan ini agar menu "Kursus Saya" di sidebar jalan */}
          <Route path="my-courses" element={<MyCourses />} />
          <Route path="become-creator" element={<BecomeCreator />} />
          <Route path="notifications" element={<Notifications />} />

          {/* Admin Routes */}
          <Route path="admin/users" element={<UserList />} />
          <Route path="admin/users/:userId" element={<UserDetail />} />
          <Route path="admin/approvals" element={<AdminOrgApprovals />} />
          <Route path="admin/approvals/:appId" element={<OrgApplicationDetail />} />
          <Route path="admin/organizations" element={<AdminOrgList />} />
          <Route path="admin/organizations/:orgId" element={<AdminOrgDetail />} />

          {/* Organization Routes */}
          <Route path="org" element={<MyOrganization />} />
          <Route path="org/events" element={<OrgEventList />} />
          <Route path="org/report" element={<OrgEventList />} />
          <Route path="org/report/event/:eventId/buyers" element={<EventBuyers />} />
          <Route path="org/create-event" element={<CreateEvent />} />
          <Route path="org/event/:eventID/manage" element={<ManageEvent />} />


        </Route>

        {/* 404 Not Found */}
        <Route path="*" element={<div style={{ textAlign: "center", padding: 50 }}><h2>404 Not Found</h2></div>} />
      </Routes>
    </Router>
  );
}

export default App;