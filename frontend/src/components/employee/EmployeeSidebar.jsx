import {
  LayoutDashboard,
  Users,
  PhoneCall,
  GraduationCap,
  TrendingUp,
  User,
  Settings,
  LogOut,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";
import "./EmployeeSidebar.css";
import { useAuth } from "../../context/AuthContext";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/employee/dashboard",
  },
  {
    title: "My Leads",
    icon: Users,
    path: "/employee/leads",
  },
  {
    title: "My Follow-ups",
    icon: PhoneCall,
    path: "/employee/followups",
  },
  {
    title: "My Admissions",
    icon: GraduationCap,
    path: "/employee/admissions",
  },
  {
    title: "My Performance",
    icon: TrendingUp,
    path: "/employee/performance",
  },
  {
    title: "Profile",
    icon: User,
    path: "/employee/profile",
  },
  {
    title: "Settings",
    icon: Settings,
    path: "/employee/settings",
  },
];

const EmployeeSidebar = ({ isOpen = false, onToggle = () => {} }) => {

  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {

    logout();

    navigate("/login", {
      replace: true,
    });

  };

  return (
    <>
      <div className={`employee-sidebar-overlay ${isOpen ? "show" : ""}`} onClick={onToggle} />
      <aside className={`employee-sidebar ${isOpen ? "open" : ""}`}>
        <div className="employee-sidebar-logo">
          <h2>IEM CRM</h2>
          <span>Employee Portal</span>
        </div>

        <nav className="employee-sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  isActive ? "sidebar-link active" : "sidebar-link"
                }
                onClick={onToggle}
              >
                <Icon size={20} />
                <span>{item.title}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="employee-sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default EmployeeSidebar;