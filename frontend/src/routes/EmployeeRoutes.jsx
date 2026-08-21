import { Routes, Route, Navigate } from "react-router-dom";

import EmployeeLayout from "../layouts/EmployeeLayout";

import Dashboard from "../pages/employee/Dashboard";
import MyLeads from "../pages/employee/MyLeads";
import LeadDetails from "../pages/employee/LeadDetails";
import MyFollowups from "../pages/employee/MyFollowups";
import MyAdmissions from "../pages/employee/MyAdmissions";

import Profile from "../pages/employee/Profile";
import Settings from "../pages/employee/Settings";

const EmployeeRoutes = () => {
  return (
    <Routes>
      <Route element={<EmployeeLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route
          path="dashboard"
          element={<Dashboard />}
        />

        <Route
          path="leads"
          element={<MyLeads />}
        />

        <Route
          path="leads/:id"
          element={<LeadDetails />}
        />

        <Route
          path="followups"
          element={<MyFollowups />}
        />

        <Route
          path="admissions"
          element={<MyAdmissions />}
        />


        <Route
          path="profile"
          element={<Profile />}
        />

        <Route
          path="settings"
          element={<Settings />}
        />
      </Route>
    </Routes>
  );
};

export default EmployeeRoutes;