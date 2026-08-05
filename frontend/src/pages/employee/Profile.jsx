import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  User,
  Mail,
  Phone,
  Shield,
  Briefcase,
  Calendar,
  CheckCircle2,
  Lock,
  Edit3
} from "lucide-react";
import "./Profile.css";

const Profile = () => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(user?.mobile || "+91 9876543210");
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="profile-container">
      {/* Header Banner */}
      <div className="profile-banner">
        <div className="profile-header-content">
          <div className="profile-avatar">
            {user?.full_name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="profile-title-group">
            <h1>{user?.full_name || "User Profile"}</h1>
            <div className="role-pill">{user?.role || "COUNSELLOR"}</div>
          </div>
        </div>
      </div>

      {saved && (
        <div className="profile-alert-success">
          <CheckCircle2 size={18} />
          <span>Profile details updated successfully!</span>
        </div>
      )}

      {/* Main Details Grid */}
      <div className="profile-grid">
        {/* Personal & Account Information */}
        <div className="profile-card">
          <div className="card-header">
            <h3>Personal & Account Information</h3>
            {!editing ? (
              <button className="btn-edit" onClick={() => setEditing(true)}>
                <Edit3 size={15} /> Edit Contact
              </button>
            ) : (
              <button className="btn-cancel" onClick={() => setEditing(false)}>
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="profile-form">
            <div className="info-row">
              <span className="label"><User size={16} /> Full Name</span>
              <span className="value font-semibold">{user?.full_name || "N/A"}</span>
            </div>

            <div className="info-row">
              <span className="label"><Mail size={16} /> Email Address</span>
              <span className="value">{user?.email || "N/A"}</span>
            </div>

            <div className="info-row">
              <span className="label"><Phone size={16} /> Mobile Phone</span>
              {editing ? (
                <input
                  type="text"
                  className="edit-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              ) : (
                <span className="value">{phone}</span>
              )}
            </div>

            <div className="info-row">
              <span className="label"><Shield size={16} /> Access Role</span>
              <span className="value badge">{user?.role || "COUNSELLOR"}</span>
            </div>

            {editing && (
              <div className="form-actions mt-4">
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Work & Organization Details */}
        <div className="profile-card">
          <div className="card-header">
            <h3>Organization & Employment Details</h3>
          </div>

          <div className="profile-details-list">
            <div className="info-row">
              <span className="label"><Briefcase size={16} /> Designation</span>
              <span className="value">Admissions Counsellor</span>
            </div>

            <div className="info-row">
              <span className="label"><Briefcase size={16} /> Department</span>
              <span className="value">Admissions & Outreach</span>
            </div>

            <div className="info-row">
              <span className="label"><Calendar size={16} /> Employment Status</span>
              <span className="value text-green-600 font-semibold">ACTIVE (Full Time)</span>
            </div>

            <div className="info-row">
              <span className="label"><Lock size={16} /> Password</span>
              <a href="/change-password" className="text-blue-600 hover:underline text-sm font-semibold">
                Change Account Password
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;