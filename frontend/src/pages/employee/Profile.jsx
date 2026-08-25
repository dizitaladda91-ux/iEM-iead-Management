import { useState, useRef } from "react";
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
  Edit3,
  Camera,
  Trash2,
  Upload,
  RefreshCw,
  MapPin,
  HeartHandshake
} from "lucide-react";
import { updateUserProfile } from "../../services/authService";
import "./Profile.css";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.mobile || "");
  const [address, setAddress] = useState(user?.address || "");
  const [emergencyContact, setEmergencyContact] = useState(user?.emergency_contact || "");
  const [emergencyName, setEmergencyName] = useState(user?.emergency_contact_name || "");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Helper to resize and compress image to base64 DataURL (max 400x400)
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const maxDim = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.85);
          resolve(compressedBase64);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // Handle Photo File Selection
  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (JPG, PNG, WebP).");
      return;
    }

    setUploading(true);
    setErrorMessage("");
    setSavedMessage("");

    try {
      const base64Photo = await compressImage(file);
      const res = await updateUserProfile({ profile_image: base64Photo });

      if (res?.data) {
        updateUser(res.data);
      } else {
        updateUser({ profile_image: base64Photo });
      }

      setSavedMessage("Profile photo uploaded successfully!");
      setTimeout(() => setSavedMessage(""), 4000);
    } catch (err) {
      console.error("Photo upload failed:", err);
      setErrorMessage(err.response?.data?.message || "Failed to upload profile photo.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle Photo Removal
  const handleRemovePhoto = async () => {
    if (!window.confirm("Are you sure you want to remove your profile photo?")) return;

    setUploading(true);
    setErrorMessage("");
    try {
      const res = await updateUserProfile({ profile_image: null });
      if (res?.data) {
        updateUser(res.data);
      } else {
        updateUser({ profile_image: null });
      }
      setSavedMessage("Profile photo removed.");
      setTimeout(() => setSavedMessage(""), 3000);
    } catch (err) {
      setErrorMessage("Failed to remove photo.");
    } finally {
      setUploading(false);
    }
  };

  // Handle Profile Details Save
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage("");
    setSavedMessage("");

    try {
      const payload = {
        full_name: fullName,
        mobile: phone,
        address,
        emergency_contact: emergencyContact,
        emergency_contact_name: emergencyName,
      };

      const res = await updateUserProfile(payload);
      if (res?.data) {
        updateUser(res.data);
      } else {
        updateUser(payload);
      }

      setSavedMessage("Profile details updated successfully!");
      setEditing(false);
      setTimeout(() => setSavedMessage(""), 4000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to update profile details.");
    } finally {
      setSaving(false);
    }
  };

  const profileImg = user?.profile_image;

  return (
    <div className="profile-container">
      {/* Header Banner with Profile Avatar & Photo Upload */}
      <div className="profile-banner">
        <div className="profile-header-content">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-box">
              {profileImg ? (
                <img src={profileImg} alt={user?.full_name} className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-initials">
                  {user?.full_name?.charAt(0).toUpperCase() || "U"}
                </div>
              )}

              {/* Uploading Overlay */}
              {uploading && (
                <div className="avatar-loading-overlay">
                  <RefreshCw size={24} className="spin text-white" />
                </div>
              )}
            </div>

            {/* Camera Trigger Badge Button */}
            <button
              type="button"
              className="btn-camera-upload"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Upload / Change Profile Photo"
            >
              <Camera size={16} />
            </button>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
              accept="image/*"
              style={{ display: "none" }}
            />
          </div>

          <div className="profile-title-group">
            <h1>{user?.full_name || "User Profile"}</h1>
            <div className="banner-badges">
              <span className="role-pill">{user?.role || "COUNSELLOR"}</span>
              {user?.employee_code && (
                <span className="code-pill">{user.employee_code}</span>
              )}
              {user?.designation && (
                <span className="desig-pill">{user.designation}</span>
              )}
            </div>

            {/* Photo Action Links */}
            <div className="photo-actions-row">
              <button
                type="button"
                className="photo-action-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload size={13} /> {profileImg ? "Change Photo" : "Upload Photo"}
              </button>
              {profileImg && (
                <button
                  type="button"
                  className="photo-action-btn delete"
                  onClick={handleRemovePhoto}
                  disabled={uploading}
                >
                  <Trash2 size={13} /> Remove Photo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {savedMessage && (
        <div className="profile-alert-success">
          <CheckCircle2 size={18} />
          <span>{savedMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="profile-alert-error">
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Details Grid */}
      <div className="profile-grid">
        {/* Personal & Account Information */}
        <div className="profile-card">
          <div className="card-header">
            <h3>Personal & Contact Information</h3>
            {!editing ? (
              <button className="btn-edit" onClick={() => setEditing(true)}>
                <Edit3 size={15} /> Edit Details
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
              {editing ? (
                <input
                  type="text"
                  className="edit-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              ) : (
                <span className="value font-semibold">{user?.full_name || "N/A"}</span>
              )}
            </div>

            <div className="info-row">
              <span className="label"><Mail size={16} /> Email Address</span>
              <span className="value font-mono">{user?.email || "N/A"}</span>
            </div>

            <div className="info-row">
              <span className="label"><Phone size={16} /> Mobile Phone</span>
              {editing ? (
                <input
                  type="text"
                  className="edit-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                />
              ) : (
                <span className="value">{user?.mobile || phone || "Not Provided"}</span>
              )}
            </div>

            <div className="info-row">
              <span className="label"><MapPin size={16} /> Address / Location</span>
              {editing ? (
                <input
                  type="text"
                  className="edit-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="City, State, Country"
                />
              ) : (
                <span className="value">{user?.address || address || "Not Provided"}</span>
              )}
            </div>

            <div className="info-row">
              <span className="label"><HeartHandshake size={16} /> Emergency Contact</span>
              {editing ? (
                <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                  <input
                    type="text"
                    className="edit-input"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder="Contact Name"
                    style={{ flex: 1 }}
                  />
                  <input
                    type="text"
                    className="edit-input"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="Phone Number"
                    style={{ flex: 1 }}
                  />
                </div>
              ) : (
                <span className="value">
                  {user?.emergency_contact
                    ? `${user.emergency_contact_name ? user.emergency_contact_name + " - " : ""}${user.emergency_contact}`
                    : "Not Provided"}
                </span>
              )}
            </div>

            <div className="info-row">
              <span className="label"><Shield size={16} /> Access Role</span>
              <span className="value badge">{user?.role || "COUNSELLOR"}</span>
            </div>

            {editing && (
              <div className="form-actions mt-4">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Saving Changes..." : "Save Changes"}
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
              <span className="label"><Briefcase size={16} /> Employee Code</span>
              <span className="value font-mono font-semibold text-blue-600">
                {user?.employee_code || "EMP" + (user?.id || "1001")}
              </span>
            </div>

            <div className="info-row">
              <span className="label"><Briefcase size={16} /> Designation</span>
              <span className="value">{user?.designation || "Admissions Counsellor"}</span>
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
              <span className="label"><Lock size={16} /> Security Password</span>
              <a href="/change-password" className="text-blue-600 hover:underline text-sm font-semibold">
                Change Account Password ?
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
