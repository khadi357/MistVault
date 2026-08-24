import React, { useState, useEffect } from "react";
import "./ItDashboard.css";
import Sidebar from "../components/Sidebar.jsx";
import dashboardIcon from "../assets/four-squares-with-frame-shape.png";
import AddStaff from "../pages/AddStaff.jsx";
import { BaseApi } from "../components/apiEndpoint";

// Safely convert status values (strings, booleans, objects) to lowercase string
function getStatusString(s) {
  if (!s) return "";

  let statusVal = s.status;

  // Handle case where status is an object
  if (typeof statusVal === "object" && statusVal !== null) {
    statusVal = statusVal.name || statusVal.label || statusVal.title || "";
  }

  // Handle case where status is a boolean
  if (typeof statusVal === "boolean") {
    return statusVal ? "active" : "inactive";
  }

  // Convert string or number safely
  if (statusVal !== undefined && statusVal !== null) {
    return String(statusVal).toLowerCase();
  }

  // Fallback to s.isActive boolean
  if (typeof s.isActive === "boolean") {
    return s.isActive ? "active" : "inactive";
  }

  return "";
}

export default function ITDashboard() {
  const [showStaff, setShowStaff] = useState(false);

  // Dynamic State for backend staff data
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch staff data from Express backend
  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");

      const response = await fetch(`${BaseApi}/accountStaff/get-staffs`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch staff records from server.");
      }

      const responseData = await response.json();

      // Extract array safely from API response format
      const actualStaffList = Array.isArray(responseData)
        ? responseData
        : responseData.staffs || responseData.data || responseData.staff || [];

      setStaffList(actualStaffList);
      setError(null);
    } catch (err) {
      console.error("Error fetching staff records:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  // Compute live statistics safely
  const totalStaff = staffList.length;

  const activeCount = staffList.filter(
    (s) => getStatusString(s) === "active",
  ).length;

  const inactiveCount = staffList.filter(
    (s) => getStatusString(s) === "inactive",
  ).length;

  const suspendedCount = staffList.filter(
    (s) => getStatusString(s) === "suspended",
  ).length;

  return (
    <div className="it-layout">
      <main className="it-main">
        {/* TOPBAR */}
        <div className="it-topbar">
          <div className="it-topbar-title">
            <span className="it-topbar-icon">
              <img src={dashboardIcon} alt="Dashboard" />
            </span>
            <h2>Dashboard</h2>
          </div>

          <input
            className="it-search"
            placeholder="Search by name, role or department"
          />
        </div>

        {/* BUTTON */}
        <button className="it-add-btn" onClick={() => setShowStaff(true)}>
          + Add New Staff
        </button>

        {/* STATS */}
        <div className="it-card">
          {loading ? (
            <p style={{ padding: "10px 0", color: "#666" }}>
              Loading staff counts...
            </p>
          ) : error ? (
            <p style={{ color: "#d9534f", padding: "10px 0" }}>{error}</p>
          ) : (
            <>
              <h3>{totalStaff} Staff</h3>
              <hr className="it-divider" />

              <div className="it-stats">
                <div className="it-stat">
                  <div className="it-ring it-ring-green">
                    <span>{activeCount}</span>
                  </div>
                  <p>Active</p>
                </div>

                <div className="it-stat">
                  <div className="it-ring it-ring-red">
                    <span>{inactiveCount}</span>
                  </div>
                  <p>Inactive</p>
                </div>

                <div className="it-stat">
                  <div className="it-ring it-ring-orange">
                    <span>{suspendedCount}</span>
                  </div>
                  <p>Suspended</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* RECENT ACTIVITY */}
        <div className="it-card">
          <h3>Recent Activity</h3>
          <hr className="it-divider" />
          <p className="it-sub">Last 5 Activities</p>

          <ul className="it-activity">
            <li className="it-activity-item it-activity-latest">
              <span className="it-dot" />
              <div>
                <strong>5/05/2026 10:32am</strong>
                <p>RAD Simi uploaded patient chest xray </p>
              </div>
            </li>
            <li className="it-activity-item">
              <span className="it-dot" />
              <div>
                <strong>5/05/2026 9:45am</strong>
                <p>PHARM Bibi administered patient modification </p>
              </div>
            </li>
            <li className="it-activity-item">
              <span className="it-dot" />
              <div>
                <strong>5/05/2026 9:40am</strong>
                <p>System automated daily backup</p>
              </div>
            </li>
            <li className="it-activity-item">
              <span className="it-dot" />
              <div>
                <strong>5/05/2026 8:40am</strong>
                <p>WellNest Hospital was deactivated due to inactivity.</p>
              </div>
            </li>
            <li className="it-activity-item">
              <span className="it-dot" />
              <div>
                <strong>5/05/2026 8:00am</strong>
                <p>Tolu at Promise Land Hospital forgot password</p>
              </div>
            </li>
          </ul>
        </div>
      </main>

      {showStaff && (
        <AddStaff
          onClose={() => setShowStaff(false)}
          onRegister={() => {
            setShowStaff(false);
            fetchStaffData();
          }}
        />
      )}
    </div>
  );
}
