import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import AuthLayout from "../layouts/AuthLayout";
import MainLayout from "../layouts/MainLayout";

import ProtectedRoute from "./ProtectedRoute";
import RoleProtectedRoute from "./RoleProtectedRoute";

// Lazy-loaded route components for lightning-fast initial load & 0 TBT
const Login = lazy(() => import("../pages/auth/Login"));
const ChangePassword = lazy(() => import("../pages/auth/ChangePassword/ChangePassword"));
const Dashboard = lazy(() => import("../pages/dashboard/Dashboard"));
const LeadManagement = lazy(() => import("../pages/Lead/LeadManagement"));
const CampaignManagement = lazy(() => import("../pages/campaign/CampaignManagement"));
const CampaignForm = lazy(() => import("../pages/campaign/CampaignForm"));
const LeadSources = lazy(() => import("../pages/leadSources/LeadSources"));
const EmployeeManagement = lazy(() => import("../pages/admin/EmployeeManagement"));
const AdmissionManagement = lazy(() => import("../pages/admission/AdmissionManagement"));
const EmployeeRoutes = lazy(() => import("./EmployeeRoutes"));

const PageLoader = () => (
  <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ width: "36px", height: "36px", border: "3px solid #E2E8F0", borderTopColor: "#2563EB", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* Public */}
        <Route element={<AuthLayout />}>
          <Route path="/" element={<Login />} />
        </Route>

        {/* ================= ADMIN ================= */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleProtectedRoute roles={["ADMIN"]} />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/leads" element={<LeadManagement />} />
              <Route path="/campaigns" element={<CampaignManagement />} />
              <Route path="/lead-sources" element={<LeadSources />} />
              <Route path="/employees" element={<EmployeeManagement />} />
              <Route path="/admissions" element={<AdmissionManagement />} />
              <Route path="/campaigns/new" element={<CampaignForm />} />
              <Route path="/campaigns/edit/:id" element={<CampaignForm />} />
              <Route path="/change-password" element={<ChangePassword />} />
            </Route>
          </Route>
        </Route>

        {/* ================= COUNSELLOR ================= */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleProtectedRoute roles={["COUNSELLOR", "ADMIN"]} />}>
            <Route
              path="/employee/*"
              element={<EmployeeRoutes />}
            />
          </Route>
        </Route>

      </Routes>
    </Suspense>
  );
};

export default AppRoutes;