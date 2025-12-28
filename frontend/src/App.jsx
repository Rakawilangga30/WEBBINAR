import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// COMPONENTS
import Navbar from "./components/Navbar";
import DashboardLayout from "./components/DashboardLayout";

// PUBLIC PAGES
import LandingPage from "./pages/Dashboard";
import EventDetail from "./pages/EventDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";

// PROTECTED PAGES - User
import DashboardHome from "./pages/DashboardHome";
import UserProfile from "./pages/user/UserProfile";
import MyCourses from "./pages/user/MyCourses";
import BecomeCreator from "./pages/user/BecomeCreator";
import Notifications from "./pages/user/Notifications";

// PROTECTED PAGES - Affiliate
import AffiliateDashboard from "./pages/affiliate/AffiliateDashboard";
import AffiliateEvents from "./pages/affiliate/AffiliateEvents";
import AffiliateSubmitEvent from "./pages/affiliate/AffiliateSubmitEvent";

// PROTECTED PAGES - Organization
import MyOrganization from "./pages/org/MyOrganization";
import ManageEvent from "./pages/org/ManageEvent";
import CreateEvent from "./pages/org/CreateEvent";
import OrgEventList from "./pages/org/OrgEventList";
import EventBuyers from "./pages/org/EventBuyers";

// PROTECTED PAGES - Admin
import UserList from "./pages/admin/UserList";
import UserDetail from "./pages/admin/UserDetail";
import AdminOrgApprovals from "./pages/admin/AdminOrgApprovals";
import OrgApplicationDetail from "./pages/admin/OrgApplicationDetail";
import AdminOrgList from "./pages/admin/AdminOrgList";
import AdminOrgDetail from "./pages/admin/AdminOrgDetail";
import AdminAffiliateList from "./pages/admin/AdminAffiliateList";
import AdminAffiliateDetail from "./pages/admin/AdminAffiliateDetail";
import AdminAffiliateLedgers from "./pages/admin/AdminAffiliateLedgers";
import AdminOfficialOrg from "./pages/admin/AdminOfficialOrg";

function App() {
  return (
    <Router>
      <Routes>
        {/* === PUBLIC ROUTES === */}
        <Route path="/" element={<><Navbar /><LandingPage /></>} />
        <Route path="/event/:id" element={<><Navbar /><EventDetail /></>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* === DASHBOARD (Protected) === */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* User Routes */}
          <Route index element={<DashboardHome />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="my-courses" element={<MyCourses />} />
          <Route path="become-creator" element={<BecomeCreator />} />
          <Route path="notifications" element={<Notifications />} />

          {/* Affiliate Routes */}
          <Route path="affiliate" element={<AffiliateDashboard />} />
          <Route path="affiliate/events" element={<AffiliateEvents />} />
          <Route path="affiliate/submit" element={<AffiliateSubmitEvent />} />

          {/* Organization Routes */}
          <Route path="org" element={<MyOrganization />} />
          <Route path="org/events" element={<OrgEventList />} />
          <Route path="org/report" element={<OrgEventList />} />
          <Route path="org/report/event/:eventId/buyers" element={<EventBuyers />} />
          <Route path="org/create-event" element={<CreateEvent />} />
          <Route path="org/event/:eventID/manage" element={<ManageEvent />} />

          {/* Admin Routes */}
          <Route path="admin/users" element={<UserList />} />
          <Route path="admin/users/:userId" element={<UserDetail />} />
          <Route path="admin/approvals" element={<AdminOrgApprovals />} />
          <Route path="admin/approvals/:appId" element={<OrgApplicationDetail />} />
          <Route path="admin/organizations" element={<AdminOrgList />} />
          <Route path="admin/organizations/:orgId" element={<AdminOrgDetail />} />
          <Route path="admin/affiliates" element={<AdminAffiliateList />} />
          <Route path="admin/affiliates/:id" element={<AdminAffiliateDetail />} />
          <Route path="admin/affiliate-ledgers" element={<AdminAffiliateLedgers />} />
          <Route path="admin/official-org" element={<AdminOfficialOrg />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<div style={{ textAlign: "center", padding: 50 }}><h2>404 Not Found</h2></div>} />
      </Routes>
    </Router>
  );
}

export default App;