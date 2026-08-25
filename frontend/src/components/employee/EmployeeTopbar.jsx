import { useNavigate } from "react-router-dom";
import {
  Menu,
  Search,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import NotificationsPopover from "../common/NotificationsPopover/NotificationsPopover";
import "./EmployeeTopbar.css";

const EmployeeTopbar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const profileImg = user?.profile_image;
  const initials = (user?.full_name || user?.name || "Employee")
    .split(" ")
    .map((name) => name[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="employee-topbar">
      <div className="topbar-left">
        <button className="menu-toggle" onClick={onMenuClick}>
          <Menu size={22} />
        </button>

        <div className="topbar-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search leads, admissions, follow-ups..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.target.value.trim()) {
                navigate(`/employee/my-leads?search=${encodeURIComponent(e.target.value.trim())}`);
              }
            }}
          />
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-date">
          {today}
        </div>

        {/* Real-time Notification Popover */}
        <NotificationsPopover isEmployee={true} />

        {/* Profile Avatar & Dropdown */}
        <div
          className="profile-box clickable"
          onClick={() => navigate("/employee/profile")}
          role="button"
          tabIndex={0}
          title="Click to view & edit profile"
          style={{ cursor: "pointer" }}
        >
          <div className="profile-avatar" style={{ overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {profileImg ? (
              <img
                src={profileImg}
                alt={user?.full_name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              initials
            )}
          </div>

          <div className="profile-info">
            <h4>{user?.full_name || user?.name || "Employee"}</h4>
            <p>{user?.role || "Employee"}</p>
          </div>

          <ChevronDown size={18} />
        </div>
      </div>
    </header>
  );
};

export default EmployeeTopbar;
