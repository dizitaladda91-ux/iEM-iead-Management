import { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import { directResetPassword } from "../../services/authService";
import "./auth.css";

const LoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    mode: "onTouched",
  });

  const onSubmit = async (formData) => {
    try {
      setLoading(true);
      const response = await login(formData);

      if (response.success) {
        toast.success("Welcome Back 👋");
        const role = response?.data?.user?.role || response?.user?.role;

        switch (role) {
          case "ADMIN":
            navigate("/dashboard", { replace: true });
            break;
          case "COUNSELLOR":
            navigate("/employee/dashboard", { replace: true });
            break;
          default:
            toast.error("Unauthorized Role");
            navigate("/", { replace: true });
        }
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
        "Login Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError("");

    if (!forgotEmail || !forgotEmail.trim()) {
      setForgotError("Please enter your registered email.");
      return;
    }

    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setForgotError("New password must be at least 6 characters long.");
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError("New passwords do not match.");
      return;
    }

    try {
      setForgotLoading(true);
      const res = await directResetPassword({
        email: forgotEmail.trim(),
        newPassword: forgotNewPassword,
      });

      if (res.success || res.statusCode === 200) {
        toast.success(res.message || "Password updated successfully!");
        // Set email into login form
        setValue("email", forgotEmail.trim());
        // Switch back to login
        setIsForgotPassword(false);
        setForgotNewPassword("");
        setForgotConfirmPassword("");
        setForgotError("");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to update password. Please check your email.";
      setForgotError(msg);
      toast.error(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  if (isForgotPassword) {
    return (
      <form onSubmit={handleForgotSubmit} className="auth-form">
        <div className="auth-forgot-header">
          <button
            type="button"
            className="auth-back-btn"
            onClick={() => {
              setIsForgotPassword(false);
              setForgotError("");
            }}
          >
            <ArrowLeft size={16} /> Back to Sign In
          </button>
          <h2 className="auth-forgot-title">
            <KeyRound size={20} className="text-blue-600 inline mr-2" />
            Reset Password
          </h2>
          <p className="auth-forgot-desc">
            Enter your registered email and new password to directly update your account.
          </p>
        </div>

        {forgotError && (
          <div className="auth-error-banner">
            <span>{forgotError}</span>
          </div>
        )}

        <div className="auth-input-wrap">
          <Mail size={18} className="auth-input-icon" />
          <input
            type="email"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            placeholder="Registered Email (e.g. admin@iemlms.com)"
            required
          />
        </div>

        <div className="auth-input-wrap">
          <Lock size={18} className="auth-input-icon" />
          <input
            type={showForgotNewPassword ? "text" : "password"}
            value={forgotNewPassword}
            onChange={(e) => setForgotNewPassword(e.target.value)}
            placeholder="New Password (min 6 characters)"
            required
          />
          <button
            type="button"
            onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
            className="auth-toggle-btn"
          >
            {showForgotNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="auth-input-wrap">
          <Lock size={18} className="auth-input-icon" />
          <input
            type={showForgotConfirmPassword ? "text" : "password"}
            value={forgotConfirmPassword}
            onChange={(e) => setForgotConfirmPassword(e.target.value)}
            placeholder="Confirm New Password"
            required
          />
          <button
            type="button"
            onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
            className="auth-toggle-btn"
          >
            {showForgotConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button type="submit" disabled={forgotLoading} className="auth-button">
          {forgotLoading ? "Updating Password..." : "Update Password"}
        </button>

        <div className="auth-footer">
          <p>© 2026 IEM LMS</p>
          <p>Direct Secure Password Reset</p>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
      <div className="auth-input-wrap">
        <Mail size={18} className="auth-input-icon" />
        <input
          type="email"
          placeholder="admin@iemlms.com"
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Please enter a valid email",
            },
          })}
        />
        {errors.email && <p className="auth-error">{errors.email.message}</p>}
      </div>

      <div className="auth-input-wrap">
        <Lock size={18} className="auth-input-icon" />
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          {...register("password", {
            required: "Password is required",
            minLength: {
              value: 6,
              message: "Password must be at least 6 characters",
            },
          })}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="auth-toggle-btn"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
        {errors.password && <p className="auth-error">{errors.password.message}</p>}
      </div>

      <div className="auth-form__row">
        <label className="auth-form__remember">
          <input type="checkbox" />
          Remember me
        </label>
        <button
          type="button"
          className="auth-form__link"
          onClick={() => {
            setIsForgotPassword(true);
            setForgotError("");
          }}
        >
          Forgot password?
        </button>
      </div>

      <button type="submit" disabled={loading} className="auth-button">
        {loading ? "Signing in..." : "Sign In"}
      </button>

      <div className="auth-divider">Secure access</div>

      <div className="auth-footer">
        <p>© 2026 IEM LMS</p>
        <p>Education CRM & Learning Management Platform</p>
      </div>
    </form>
  );
};

export default LoginForm;