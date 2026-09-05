import React, { useContext, Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppContext } from "./context/AppContext";

// UI / Utilities
import { Toaster } from "sonner";
import "quill/dist/quill.snow.css";

// Core Components
import ErrorBoundary from "./components/ErrorBoundary";
import Loading from "./components/Loading";
import MainLayout from "./components/layout/MainLayout";

// Public Pages
import Home from "./pages/Home";
import ApplyJob from "./pages/ApplyJob";
import NotFound from "./pages/NotFound";

// User Pages
import Applications from "./pages/Applications";

// Company Pages
import Dashboard from "./pages/Dashboard";
import AddJob from "./pages/AddJob";
import ManageJobs from "./pages/ManageJobs";
import ViewApplications from "./pages/ViewApplications";
import Reports from "./pages/Reports";

// Auth Components
import RecruiterLogin from "./components/RecruiterLogin";
import UserLogin from "./components/UserLogin";

// Lazy-loaded pages
const UserProfilePage = lazy(() => import("./pages/UserProfile"));
const CompanyProfilePage = lazy(() => import("./pages/CompanyProfile"));
const BillingDashboard = lazy(() => import("./pages/BillingDashboard"));
const IncidentDashboard = lazy(() => import("./pages/IncidentDashboard"));
const FinancialAdminPanel = lazy(() => import("./pages/FinancialAdminPanel"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const TeamManagementDashboard = lazy(() => import("./pages/TeamManagementDashboard"));
const AdminFinanceDashboard = lazy(() => import("./pages/AdminFinanceDashboard"));
const PublicStatus = lazy(() => import("./pages/PublicStatus"));
const Reconciliation = lazy(() => import("./pages/Reconciliation"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AnalyticsDashboard = lazy(() => import("./pages/AnalyticsDashboard"));
const LogDashboard = lazy(() => import("./pages/LogDashboard"));
const AdvancedAdminDashboard = lazy(() => import("./pages/AdvancedAdminDashboard"));
const FraudDashboard = lazy(() => import("./pages/FraudDashboard"));
const EmailAnalyticsDashboard = lazy(() => import("./pages/EmailAnalyticsDashboard"));
const PaymentTimelinePage = lazy(() => import("./pages/PaymentTimeline"));
const RefundPage = lazy(() => import("./pages/RefundPage"));
const SubscriptionPage = lazy(() => import("./pages/SubscriptionPage"));
const StripeStyleBilling = lazy(() => import("./pages/StripeStyleBilling"));
const PaymentHistory = lazy(() => import("./pages/PaymentHistory"));
const CompanyDashboard = lazy(() => import("./pages/CompanyDashboard"));
const AuditLogsViewer = lazy(() => import("./pages/AuditLogsViewer"));

/* ─────────────────────────────────────────────
   Route Guards
───────────────────────────────────────────── */

const ProtectedUserRoute = ({ children }) => {
  const { token } = useContext(AppContext);
  return token ? children : <Navigate to="/" replace />;
};

const ProtectedCompanyRoute = ({ children }) => {
  const { companyToken } = useContext(AppContext);
  return companyToken ? children : <Navigate to="/" replace />;
};

/* ─────────────────────────────────────────────
   App Component
───────────────────────────────────────────── */

const App = () => {
  const { showRecruiterLogin, showUserLogin, token } = useContext(AppContext);

  return (
    <ErrorBoundary>
      {/* Auth Modals */}
      {showUserLogin && <UserLogin />}
      {showRecruiterLogin && <RecruiterLogin />}

      {/* Notifications */}
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{ duration: 3000 }}
      />

      {/* Routes */}
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Main Layout Wrap (Navbar + Footer) */}
          <Route element={<MainLayout />}>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/apply-job/:id" element={<ApplyJob />} />
            <Route path="/status" element={<PublicStatus />} />

            {/* User Protected */}
            <Route
              path="/applications"
              element={
                <ProtectedUserRoute>
                  <Applications />
                </ProtectedUserRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedUserRoute>
                  <UserProfilePage />
                </ProtectedUserRoute>
              }
            />

            <Route path="/onboarding" element={<ProtectedCompanyRoute><Onboarding /></ProtectedCompanyRoute>} />
            <Route path="/team" element={<ProtectedUserRoute><TeamManagementDashboard token={token} /></ProtectedUserRoute>} />
            <Route path="/billing" element={<ProtectedUserRoute><BillingDashboard token={token} /></ProtectedUserRoute>} />
            <Route path="/billing/subscription" element={<ProtectedUserRoute><SubscriptionPage token={token} /></ProtectedUserRoute>} />
            <Route path="/billing/history" element={<ProtectedUserRoute><PaymentHistory token={token} /></ProtectedUserRoute>} />
            <Route path="/billing/timeline" element={<ProtectedUserRoute><PaymentTimelinePage token={token} /></ProtectedUserRoute>} />
            <Route path="/billing/stripe" element={<ProtectedUserRoute><StripeStyleBilling token={token} /></ProtectedUserRoute>} />
            <Route path="/billing/refund" element={<ProtectedUserRoute><RefundPage token={token} /></ProtectedUserRoute>} />
            <Route path="/incidents" element={<ProtectedUserRoute><IncidentDashboard token={token} /></ProtectedUserRoute>} />
            <Route path="/logs" element={<ProtectedUserRoute><LogDashboard token={token} /></ProtectedUserRoute>} />
            <Route path="/analytics" element={<ProtectedUserRoute><AnalyticsDashboard token={token} /></ProtectedUserRoute>} />
            <Route path="/company-admin" element={<ProtectedUserRoute><CompanyDashboard token={token} /></ProtectedUserRoute>} />
            <Route path="/admin" element={<ProtectedUserRoute><AdminDashboard token={token} /></ProtectedUserRoute>} />
            <Route path="/admin/finance" element={<ProtectedUserRoute><AdminFinanceDashboard token={token} /></ProtectedUserRoute>} />
            <Route path="/admin/finance/panel" element={<ProtectedUserRoute><FinancialAdminPanel token={token} /></ProtectedUserRoute>} />
            <Route path="/admin/advanced" element={<ProtectedUserRoute><AdvancedAdminDashboard token={token} /></ProtectedUserRoute>} />
            <Route path="/admin/fraud" element={<ProtectedUserRoute><FraudDashboard token={token} /></ProtectedUserRoute>} />
            <Route path="/admin/email-analytics" element={<ProtectedUserRoute><EmailAnalyticsDashboard token={token} /></ProtectedUserRoute>} />
            <Route path="/admin/reconciliation" element={<ProtectedUserRoute><Reconciliation token={token} /></ProtectedUserRoute>} />
            <Route path="/admin/audit-logs" element={<ProtectedUserRoute><AuditLogsViewer token={token} /></ProtectedUserRoute>} />
          </Route>

          <Route
            path="/company-profile"
            element={
              <ProtectedCompanyRoute>
                <CompanyProfilePage />
              </ProtectedCompanyRoute>
            }
          />

          {/* Company Protected (Uses Sidebar Layout instead of MainLayout) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedCompanyRoute>
                <Dashboard />
              </ProtectedCompanyRoute>
            }
          >
            <Route index element={<Navigate to="manage-jobs" replace />} />
            <Route path="add-job" element={<AddJob />} />
            <Route path="manage-jobs" element={<ManageJobs />} />
            <Route path="view-applications" element={<ViewApplications />} />
            <Route path="reports" element={<Reports />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default App;
