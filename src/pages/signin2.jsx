import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Loader2, KeyRound, ArrowLeft } from "lucide-react";
import logo from "../assets/mist-icon.png";
import "../styles/SignIn.css";
import { toast } from "react-hot-toast";
import { BaseApi } from "../components/apiEndpoint";

function SignIn2() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP State Management
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpType, setOtpType] = useState("2FA");

  const navigate = useNavigate();
  const location = useLocation();

  const navigateToRoleDashboard = (role) => {
    const normalized = (role || "").toUpperCase();

    switch (normalized) {
      case "IT ADMIN":
        navigate("/iTdashboard", { replace: true });
        break;
      case "STAFF":
        navigate("/staffDashboard", { replace: true });
        break;
      case "DOCTOR":
        navigate("/doctorDashboard", { replace: true });
        break;
      case "NURSE":
        navigate("/nurseDashboard", { replace: true });
        break;
      case "MANAGER":
        navigate("/managerDashboard", { replace: true });
        break;
      default:
        navigate("/otherDashboard", { replace: true });
        break;
    }
  };

  useEffect(() => {
    const fromLanding = location.state?.fromLanding === true;
    const isAuthenticated = localStorage.getItem("authenticated") === "true";

    if (isAuthenticated && !fromLanding) {
      const role = localStorage.getItem("role") || "";

      if (role) {
        navigateToRoleDashboard(role);
      } else {
        toast.error("Session invalid. Please sign in again.");
        localStorage.removeItem("authToken");
        localStorage.removeItem("authenticated");
        localStorage.removeItem("username");
        localStorage.removeItem("role");
        navigate("/signinStaff");
      }
    }
  }, [navigate, location.state]);

  const completeLoginSession = (data, userRole) => {
    toast.success(`Welcome back! Signing in as ${userRole}...`);

    if (data.token) localStorage.setItem("authToken", data.token);
    localStorage.setItem("authenticated", "true");
    localStorage.setItem(
      "username",
      data.staff?.name || data.person?.name || "",
    );
    localStorage.setItem("role", userRole);

    setTimeout(() => {
      navigateToRoleDashboard(userRole);
    }, 800);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${BaseApi}/accountStaff/login-it-Admin/staffMember`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          credentials: "include",
        },
      );

      const data = await response.json();

      if (response.ok && data.require2FA) {
        toast(data.message, { icon: "ℹ️" });
        setOtpType("2FA");
        setIsOtpStep(true);
        return;
      }

      if (response.status === 403 && data.requireVerification) {
        toast(data.message, { icon: "ℹ️" });
        setOtpType("VERIFY_ACCOUNT");
        setIsOtpStep(true);
        return;
      }

      if (!response.ok) {
        toast.error(data.message || "Invalid email or password.");
        return;
      }

      const staffData = data.staff || data.person || data;
      const userRole = staffData.role || "";

      if (userRole) {
        completeLoginSession(data, userRole);
      } else {
        toast.error("Access denied. Invalid or unassigned user role.");
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Connection failed. Server could be sleeping.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otpCode || otpCode.trim().length < 6) {
      toast.error("Please enter a valid 6-digit passcode");
      return;
    }

    setLoading(true);

    const endpoint =
      otpType === "2FA"
        ? `${BaseApi}/accountStaff/verify-2fa`
        : `${BaseApi}/accountStaff/verify-staff-account`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otpCode }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Invalid or expired passcode.");
        return;
      }

      const staffData = data.staff || data.person || data;
      const userRole = staffData.role || "";

      if (userRole) {
        completeLoginSession(data, userRole);
      } else {
        toast.error("Verification successful, but no valid role was assigned.");
      }
    } catch (err) {
      console.error("OTP Verification Error:", err);
      toast.error("Verification failed. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-card">
        {/* LOGO HEADER */}
        <div className="logo-wrapper">
          <div className="logo-top">
            <img src={logo} alt="MIST logo" className="logo-img" />
            <span className="logo-text">MIST</span>
          </div>
          <span className="logo-texts">
            MEDICAL INFORMATION STORAGE
            <br />
            TECHNOLOGY
          </span>
        </div>

        {/* STEP 1: LOGIN FORM */}
        {!isOtpStep ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Enter your email"
                value={email}
                disabled={loading}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  disabled={loading}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="eye-btn"
                  disabled={loading}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <p className="forgot-password">Forgot password?</p>

            <button type="submit" className="signin-btn" disabled={loading}>
              {loading ? (
                <div className="btn-loader-content">
                  <Loader2 size={18} className="spinner" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        ) : (
          /* STEP 2: OTP / 2FA VERIFICATION FORM */
          <form onSubmit={handleVerifyOtp}>
            <div className="otp-header">
              <KeyRound size={32} className="otp-icon" />
              <h3 className="otp-title">
                {otpType === "2FA"
                  ? "Two-Factor Verification"
                  : "Verify Account Email"}
              </h3>
              <p className="otp-subtitle">
                Enter the 6-digit code sent to:
                <br />
                <strong className="otp-email">{email}</strong>
              </p>
            </div>

            <div className="form-group">
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit code"
                value={otpCode}
                disabled={loading}
                className="otp-input"
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <button type="submit" className="signin-btn" disabled={loading}>
              {loading ? (
                <div className="btn-loader-content">
                  <Loader2 size={18} className="spinner" />
                  <span>Verifying Code...</span>
                </div>
              ) : (
                "Verify & Proceed"
              )}
            </button>

            <button
              type="button"
              className="back-btn"
              disabled={loading}
              onClick={() => {
                setIsOtpStep(false);
                setOtpCode("");
              }}
            >
              <ArrowLeft size={16} /> Back to Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default SignIn2;
