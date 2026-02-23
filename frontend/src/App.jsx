import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'react-hot-toast';

// COMPONENTS
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import DashboardLayout from "./components/DashboardLayout";

// PUBLIC PAGES
import LandingPage from "./pages/Dashboard";
import EventDetail from "./pages/EventDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import AboutUs from "./pages/AboutUs";
import Report from "./pages/Report";
import OrganizationPublic from "./pages/OrganizationPublic";

// PROTECTED PAGES - User
import DashboardHome from "./pages/DashboardHome";
import UserProfile from "./pages/user/UserProfile";
import MyCourses from "./pages/user/MyCourses";
import MyCertificates from "./pages/user/MyCertificates";
import MyPayments from "./pages/user/MyPayments";
import Notifications from "./pages/user/Notifications";
import MyCart from "./pages/user/MyCart";

// PROTECTED PAGES - Affiliate
import AffiliateDashboard from "./pages/affiliate/AffiliateDashboard";
import AffiliateEvents from "./pages/affiliate/AffiliateEvents";
import AffiliateSubmitEvent from "./pages/affiliate/AffiliateSubmitEvent";
import AffiliateWithdrawal from "./pages/affiliate/AffiliateWithdrawal";
import AffiliatePartnerships from "./pages/affiliate/AffiliatePartnerships";
import AffiliateAnalytics from "./pages/affiliate/AffiliateAnalytics";

// PROTECTED PAGES - Organization
import MyOrganization from "./pages/org/MyOrganization";
import ManageEvent from "./pages/org/ManageEvent";
import CreateEvent from "./pages/org/CreateEvent";
import OrgEventList from "./pages/org/OrgEventList";
import EventBuyers from "./pages/org/EventBuyers";
import OrgWithdrawal from "./pages/org/OrgWithdrawal";
import OrgAffiliateRequests from "./pages/org/OrgAffiliateRequests";
import OrgAffiliateStats from "./pages/org/OrgAffiliateStats";
import OrgWithdraw from "./pages/org/OrgWithdraw";
import OrgAffiliateWithdrawals from "./pages/org/OrgAffiliateWithdrawals";
import OrgAnalytics from "./pages/org/OrgAnalytics";

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
import AdminOfficialOrgEventDetail from "./pages/admin/AdminOfficialOrgEventDetail";
import AdminReports from "./pages/admin/AdminReports";
import AdminFeaturedEvents from "./pages/admin/AdminFeaturedEvents";
import AdminAds from "./pages/admin/AdminAds";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals";
import AdminAnalytics from "./pages/admin/AdminAnalytics";

function App() {
  return (
    <Router>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        {/* === PUBLIC ROUTES === */}
        <Route path="/" element={<><Navbar /><LandingPage /><Footer /></>} />
        <Route path="/event/:id" element={<><Navbar /><EventDetail /><Footer /></>} />
        <Route path="/about" element={<><Navbar /><AboutUs /><Footer /></>} />
        <Route path="/report" element={<><Navbar /><Report /><Footer /></>} />
        <Route path="/organization/:id" element={<><Navbar /><OrganizationPublic /><Footer /></>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* === DASHBOARD (Protected) === */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* User Routes */}
          <Route index element={<DashboardHome />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="my-courses" element={<MyCourses />} />
          <Route path="certificates" element={<MyCertificates />} />
          <Route path="payments" element={<MyPayments />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="cart" element={<MyCart />} />

          {/* Affiliate Routes */}
          <Route path="affiliate" element={<AffiliateDashboard />} />
          <Route path="affiliate/events" element={<AffiliateEvents />} />
          <Route path="affiliate/submit" element={<AffiliateSubmitEvent />} />
          <Route path="affiliate/withdraw" element={<AffiliateWithdrawal />} />
          <Route path="affiliate/partnerships" element={<AffiliatePartnerships />} />
          <Route path="affiliate/analytics" element={<AffiliateAnalytics />} />

          {/* Organization Routes */}
          <Route path="org" element={<MyOrganization />} />
          <Route path="org/events" element={<OrgEventList />} />
          <Route path="org/report" element={<OrgEventList />} />
          <Route path="org/report/event/:eventId/buyers" element={<EventBuyers />} />
          <Route path="org/create-event" element={<CreateEvent />} />
          <Route path="org/event/:eventID/manage" element={<ManageEvent />} />
          <Route path="org/withdraw" element={<OrgWithdraw />} />
          <Route path="org/affiliate-withdrawals" element={<OrgAffiliateWithdrawals />} />
          <Route path="org/affiliate-requests" element={<OrgAffiliateRequests />} />
          <Route path="org/affiliate-stats" element={<OrgAffiliateStats />} />
          <Route path="org/analytics" element={<OrgAnalytics />} />

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
          <Route path="admin/official-org/events/:eventId" element={<AdminOfficialOrgEventDetail />} />
          <Route path="admin/reports" element={<AdminReports />} />
          <Route path="admin/featured" element={<AdminFeaturedEvents />} />
          <Route path="admin/ads" element={<AdminAds />} />
          <Route path="admin/withdrawals" element={<AdminWithdrawals />} />
          <Route path="admin/analytics" element={<AdminAnalytics />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<div style={{ textAlign: "center", padding: 50 }}><h2>404 Not Found</h2></div>} />
      </Routes>
    </Router>
  );
}

export default App;