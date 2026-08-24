import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import logo from "../assets/mist-icon.png";
import "../styles/SignIn.css";
import { toast } from "react-hot-toast";
import { BaseApi } from "../components/apiEndpoint";

function SignIn2() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Helper function to handle routing based on user role
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
        // Fallback route for unknown/other roles
        navigate("/otherDashboard", { replace: true });
        break;
    }
  };

  // Guard Clause: Prevent authenticated users from staying on Sign In page
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

      if (!response.ok) {
        toast.error(data.message || "Invalid email or password.");
        return;
      }

      // Extract user object safely
      const staffData = data.staff || data.person || data;
      const userRole = staffData.role || "";

      if (userRole) {
        toast.success(`Welcome back! Signing in as ${userRole}...`);

        if (data.token) localStorage.setItem("authToken", data.token);
        localStorage.setItem("authenticated", "true");
        localStorage.setItem("username", staffData.name || "");
        localStorage.setItem("role", userRole);

        setTimeout(() => {
          navigateToRoleDashboard(userRole);
        }, 800);
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

  return (
    <div className="signin-container">
      <div className="signin-card">
        <form onSubmit={handleSubmit}>
          <div className="logo-wrapper">
            <div className="logo-top">
                <img src={logo} alt="MIST logo" className="logo-img" />
          
                  <span className="logo-text">
                    MIST
                  </span>
            </div>
          
                  <span className="logo-texts">
                    MEDICAL INFORMATION STORAGE
                    <br />
                    TECHNOLOGY
                  </span>
          </div>

          {/* EMAIL INPUT */}
          <div className="form-group">
            <input
              type="text"
              placeholder="Enter your email"
              value={email}
              disabled={loading}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* PASSWORD INPUT */}
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

          {/* SUBMIT BUTTON */}
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
      </div>
    </div>
  );
}

export default SignIn2;
