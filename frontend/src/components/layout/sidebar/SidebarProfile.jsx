import { useAuth } from "../../../context/AuthContext";

const SidebarProfile = () => {
  const { user } = useAuth();
  const profileImg = user?.profile_image;
  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <div className="profile-card">
      <div className="profile-avatar" style={{ overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {profileImg ? (
          <img
            src={profileImg}
            alt={user?.full_name || "Profile"}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          initials
        )}
      </div>

      <div className="profile-content">
        <h3>{user?.full_name || "User"}</h3>
        <p>{user?.role || "Employee"}</p>
        <span className="profile-status">
          <span className="status-dot"></span>
          Online
        </span>
      </div>
    </div>
  );
};

export default SidebarProfile;