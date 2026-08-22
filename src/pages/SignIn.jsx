import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import logo from "../assets/mist-icon.png";
import "../styles/SignIn.css";
import { toast } from "react-hot-toast";

function App() {
  return (
    <>
      <AppRoutes />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fromLanding = location.state?.fromLanding === true;

    if (localStorage.getItem("authenticated") === "true" && !fromLanding) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true); // Trigger loading animation immediately

    try {
      const BaseApi = "https://medsec.onrender.com/api";
      const response = await fetch(`${BaseApi}/login-manager`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include", // ensures cookies/JWT are sent
      });

      const data = await response.json();

      if (response.ok) {
        // Save token or flag
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("authenticated", "true");
        localStorage.setItem("username", data.manager?.name || "Manager");

        toast.success("Welcome back! Signing in... 🎉");

        // Brief timeout gives the toast a second to breathe before redirecting
        setTimeout(() => {
          navigate("/dashboard");
        }, 800);
      } else {
        toast.error(data.message || "Invalid email or password.");
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Connection failed. Server could be sleeping.");
    } finally {
      setLoading(false); // Stop loader regardless of success or failure
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

          <div className="form-group">
            {/* <label>Email Address</label> */}
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
      </div>{" "}
    </div>
  );
}

export default SignIn;
