import { useState } from "react";
import {
  Lock,
  Bell,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import "./Settings.css";

const Settings = () => {
  // Change Password State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");

  // Preference Toggles
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [dailyDigest, setDailyDigest] = useState(true);
  const [compactTable, setCompactTable] = useState(false);
  const [prefSuccess, setPrefSuccess] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");

    if (newPassword !== confirmPassword) {
      setPassError("New password and confirm password do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setPassError("Password must be at least 6 characters long.");
      return;
    }

    setPassLoading(true);
    try {
      await axiosInstance.post("/auth/change-password", {
        oldPassword,
        newPassword,
      });
      setPassSuccess("Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPassError(err.response?.data?.message || "Failed to change password. Please check your old password.");
    } finally {
      setPassLoading(false);
    }
  };

  const handleSavePreferences = (e) => {
    e.preventDefault();
    setPrefSuccess(true);
    setTimeout(() => setPrefSuccess(false), 3000);
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1 className="header-title">Account & Application Settings</h1>
        <p className="header-subtitle">Manage password security, notifications, and interface preferences</p>
      </div>

      <div className="settings-grid">
        {/* Change Password Card */}
        <div className="settings-card">
          <div className="card-header">
            <h3><Lock size={18} /> Change Password</h3>
          </div>

          {passError && (
            <div className="settings-alert error mb-4">
              <AlertCircle size={18} />
              <span>{passError}</span>
            </div>
          )}

          {passSuccess && (
            <div className="settings-alert success mb-4">
              <CheckCircle2 size={18} />
              <span>{passSuccess}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="settings-form">
            <div className="form-field">
              <label>Current Password *</label>
              <div className="pass-input-wrapper">
                <input
                  type={showOldPass ? "text" : "password"}
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  className="pass-toggle"
                  onClick={() => setShowOldPass(!showOldPass)}
                >
                  {showOldPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-field">
              <label>New Password *</label>
              <div className="pass-input-wrapper">
                <input
                  type={showNewPass ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  className="pass-toggle"
                  onClick={() => setShowNewPass(!showNewPass)}
                >
                  {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-field">
              <label>Confirm New Password *</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>

            <button type="submit" className="btn-primary mt-2" disabled={passLoading}>
              {passLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>

        {/* Notifications & Display Preferences */}
        <div className="settings-card">
          <div className="card-header">
            <h3><Bell size={18} /> Notifications & Preferences</h3>
          </div>

          {prefSuccess && (
            <div className="settings-alert success mb-4">
              <CheckCircle2 size={18} />
              <span>Preferences saved!</span>
            </div>
          )}

          <form onSubmit={handleSavePreferences} className="preferences-form">
            <div className="toggle-row">
              <div>
                <div className="toggle-label font-semibold">Email Notifications</div>
                <div className="toggle-desc">Receive email alerts for new assigned leads and follow-ups.</div>
              </div>
              <input
                type="checkbox"
                className="toggle-checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
              />
            </div>

            <div className="toggle-row">
              <div>
                <div className="toggle-label font-semibold">SMS / Instant Alerts</div>
                <div className="toggle-desc">Send mobile SMS notifications for urgent follow-up reminders.</div>
              </div>
              <input
                type="checkbox"
                className="toggle-checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
              />
            </div>

            <div className="toggle-row">
              <div>
                <div className="toggle-label font-semibold">Daily Summary Digest</div>
                <div className="toggle-desc">Receive a morning email summary of daily lead statistics.</div>
              </div>
              <input
                type="checkbox"
                className="toggle-checkbox"
                checked={dailyDigest}
                onChange={(e) => setDailyDigest(e.target.checked)}
              />
            </div>

            <div className="toggle-row">
              <div>
                <div className="toggle-label font-semibold"><Sliders size={15} inline /> Compact Table Density</div>
                <div className="toggle-desc">Display data tables in compact spacing mode.</div>
              </div>
              <input
                type="checkbox"
                className="toggle-checkbox"
                checked={compactTable}
                onChange={(e) => setCompactTable(e.target.checked)}
              />
            </div>

            <button type="submit" className="btn-secondary mt-4">
              Save Preferences
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;