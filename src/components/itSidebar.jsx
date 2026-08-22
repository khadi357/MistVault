import { NavLink, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiGrid,
  FiBarChart2,
  FiClipboard,
  FiSettings,
  FiLogOut,
  FiX,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import "../styles/Sidebar.css";
import logo from "../assets/logo.png";

// Renamed from itSidebar -> ItSidebar
export default function ItSidebar({
  isOpen,
  toggleSidebar,
  closeSidebar,
  collapsed,
  toggleCollapse,
  isMobile,
}) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.setItem("authenticated", "false");
    localStorage.clear()
    navigate("/signinStaff");
  };

  const isCollapsed = isMobile ? false : collapsed;

  return (
    <div
      className={`sidebar ${isMobile ? (isOpen ? "open" : "closed") : collapsed ? "collapsed" : ""
        }`}
    >
      {/* ================= HEADER ================= */}
      <div className="sidebar-header">
        {/* LOGO */}
        <div className="logo">
          <img src={logo} alt="logo" className="logo-img" />
          {!isCollapsed && <span className="logo-text">MIST</span>}
        </div>

        {/* BUTTONS */}
        <div className="sidebar-buttons">
          {!isMobile && (
            <button className="collapse-btn" onClick={toggleCollapse}>
              {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
            </button>
          )}

          {isMobile && (
            <button className="close-btn" onClick={toggleSidebar}>
              <FiX />
            </button>
          )}
        </div>
      </div>

      {/* ================= NAV ================= */}
      <nav className="sidebar-nav" onClick={closeSidebar}>
        <NavLink to="/ITDashboard" className="nav-item">
          <FiGrid />
          {!isCollapsed && <span>IT Dashboard</span>}
        </NavLink>

        <NavLink to="/ITStaff" className="nav-item">
          <FiHome />
          {!isCollapsed && <span>IT Staff</span>}
        </NavLink>

        <NavLink to="/Activity" className="nav-item">
          <FiBarChart2 />
          {!isCollapsed && <span>Activity</span>}
        </NavLink>

        <NavLink to="/Control" className="nav-item">
          <FiClipboard />
          {!isCollapsed && <span>Control</span>}
        </NavLink>

        {/* <NavLink to="/settings" className="nav-item">
          <FiSettings />
          {!isCollapsed && <span>Settings</span>}
        </NavLink> */}

        {/* LOGOUT */}
        <button onClick={handleLogout} className="nav-item logout">
          <FiLogOut />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </nav>
    </div>
  );
}
