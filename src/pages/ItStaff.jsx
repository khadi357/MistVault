import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Dashboardicon from "../assets/employee.png";
import "./ItStaff.css";
import AddStaff from "./AddStaff.jsx";
import { BaseApi } from "../components/apiEndpoint.jsx";

const PAGE_SIZE = 15;

function StatusBadge({ status }) {
  return (
    <span
      className={`status-badge status-${status ? status.toLowerCase() : ""}`}
    >
      {status}
    </span>
  );
}

export default function Staff() {
  const token = localStorage.getItem("authToken");
  const navigate = useNavigate();

  // State for backend data and UI status
  const [staffData, setStaffData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [showStaff, setShowStaff] = useState(false);

  // Function to fetch staff data from backend API
  const fetchStaffData = async () => {
    try {
     
      setLoading(true);

      const response = await fetch(`${BaseApi}/accountStaff/get-staffs`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch staff data from backend.");
      }

      const responseData = await response.json();

      // Extract array properly whether response is [...] or { staffs: [...] } or { data: [...] }
      const actualStaffList = Array.isArray(responseData)
        ? responseData
        : responseData.staffs || responseData.data || responseData.staff || [];

      setStaffData(actualStaffList);
      setError(null);
    } catch (err) {
      setError(err.message);
      setStaffData([]); // Fallback to empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch on initial render
  useEffect(() => {
    fetchStaffData();
  }, []);

  // Safeguard: Ensure staffData is an array before filtering
  const safeStaffList = Array.isArray(staffData) ? staffData : [];

  const filtered = safeStaffList.filter((s) => {
    const matchesSearch =
      (s.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (s.role?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (s.department?.toLowerCase() || "").includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="staff-layout">
      <main className="staff-main">
        <div className="staff-topbar">
          <div className="staff-topbar-title">
            <span className="staff-topbar-icon">
              <img src={Dashboardicon} alt="Staff" />
            </span>
            <h2>Staff</h2>
          </div>

          <input
            className="staff-search"
            placeholder="Search by name, role or department"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <section className="staff-card">
          <div className="staff-controls">
            <button
              className="add-staff-btn"
              onClick={() => setShowStaff(true)}
            >
              + Add New Staff
            </button>

            <div className="staff-filters">
              <select
                className="status-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>

              <button
                className={`filter-btn filter-${statusFilter.toLowerCase()}`}
              >
                {statusFilter === "All" ? "Filter ☰" : statusFilter}
              </button>
            </div>
          </div>

          {/* Handle Loading & Error States */}
          {loading ? (
            <div
              className="staff-loading"
              style={{ padding: "20px", textAlign: "center" }}
            >
              Loading staff records...
            </div>
          ) : error ? (
            <div
              className="staff-error"
              style={{ padding: "20px", color: "red", textAlign: "center" }}
            >
              {error}
            </div>
          ) : (
            <table className="staff-table">
              <thead>
                <tr>
                  <th>Staff Name</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Last Login</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((s) => (
                  <tr
                    key={s._id || s.id}
                    className="staff-row"
                    onClick={() => navigate(`/staff/${s._id || s.id}`)}
                  >
                    <td className="staff-name">{s.name}</td>
                    <td>{s.role}</td>
                    <td>{s.department}</td>
                    <td>{s.lastLoginDate || "N/A"}</td>
                    <td>
                      <StatusBadge status={s.status ? "Active" : "Inactive"} />
                    </td>
                  </tr>
                ))}
                {pageData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="staff-empty">
                      No staff match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          <div className="staff-pagination">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹ Previous
            </button>
            <span className="page-indicator">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next ›
            </button>
          </div>
        </section>
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
