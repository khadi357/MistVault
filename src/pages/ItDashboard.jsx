import React, { useState } from "react";
import "./ItDashboard.css";
import Sidebar from "../components/Sidebar.jsx";
import dashboardIcon from "../assets/four-squares-with-frame-shape.png";
import AddStaff from "../pages/AddStaff.jsx";



export default function ITDashboard() {
  const [showStaff, setShowStaff] = useState(false);
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
          <h3>100 Staff</h3>
          <hr className="it-divider" />

          <div className="it-stats">
            <div className="it-stat">
              <div className="it-ring it-ring-green">
                <span>45</span>
              </div>
              <p>Active</p>
            </div>

            <div className="it-stat">
              <div className="it-ring it-ring-red">
                <span>30</span>
              </div>
              <p>Inactive </p>
            </div>

            <div className="it-stat">
              <div className="it-ring it-ring-orange">
                <span>25</span>
              </div>
              <p>Suspended</p>
            </div>
          </div>
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
        {/* closes it-card for Recent Activity */}
      </main >

      {showStaff && <AddStaff onClose={() => setShowStaff(false)} />

      }
    </div >
  );
}