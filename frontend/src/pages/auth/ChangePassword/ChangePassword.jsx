import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { changePassword } from "../../../services/authService";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import "./ChangePassword.css";

const ChangePassword = () => {

  const navigate = useNavigate();

  const { logout } = useAuth();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {

      toast.error("Passwords do not match");

      return;

    }

    try {

      setLoading(true);

      const response = await changePassword({
        currentPassword: formData.oldPassword,
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      });

      toast.success(response.message);

      logout();

      navigate("/");

    } catch (error) {

      toast.error(

        error?.response?.data?.message ||

        "Password change failed."

      );

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="change-password-page">

      <form
        className="change-password-card"
        onSubmit={handleSubmit}
      >

        <div className="cp-icon">

          <LockKeyhole size={34} />

        </div>

        <h2>

          Change Password

        </h2>

        <p>

          Update your account password securely.

        </p>

        <input
          type="password"
          name="oldPassword"
          placeholder="Current Password"
          value={formData.oldPassword}
          onChange={handleChange}
        />

        <input
          type="password"
          name="newPassword"
          placeholder="New Password"
          value={formData.newPassword}
          onChange={handleChange}
        />

        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
        />

        <button
          type="submit"
          disabled={loading}
        >

          {

            loading

              ? "Updating..."

              : "Change Password"

          }

        </button>

      </form>

    </div>

  );

};

export default ChangePassword;