import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import EmployeeLayout from "../layouts/EmployeeLayout";

const Dashboard = lazy(() => import("../pages/employee/Dashboard"));
const MyLeads = lazy(() => import("../pages/employee/MyLeads"));
const LeadDetails = lazy(() => import("../pages/employee/LeadDetails"));
const MyFollowups = lazy(() => import("../pages/employee/MyFollowups"));
const MyAdmissions = lazy(() => import("../pages/employee/MyAdmissions"));
const MyPerformance = lazy(() => import("../pages/employee/MyPerformance"));
const Profile = lazy(() => import("../pages/employee/Profile"));
const Settings = lazy(() => import("../pages/employee/Settings"));

const PageLoader = () => (
  <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ width: "36px", height: "36px", border: "3px solid #E2E8F0", borderTopColor: "#2563EB", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
  </div>
);

const EmployeeRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<EmployeeLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="leads" element={<MyLeads />} />
          <Route path="my-leads" element={<MyLeads />} />
          <Route path="leads/:id" element={<LeadDetails />} />
          <Route path="followups" element={<MyFollowups />} />
          <Route path="admissions" element={<MyAdmissions />} />
          <Route path="performance" element={<MyPerformance />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default EmployeeRoutes;