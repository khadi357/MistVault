import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BaseApi } from "../components/apiEndpoint";

import "./StaffDetails.css";

// Helper function to extract initials safely
function initials(name = "") {
  if (!name) return "??";
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Safely extracts display text from objects
function getDisplayString(val, fallback = "N/A") {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "object") {
    return val.name || val.title || val.label || val.text || fallback;
  }
  return String(val);
}

// Cleans ISO strings into formatted date-time strings
function formatDateTime(val, fallback = "N/A") {
  if (!val) return fallback;

  let rawDate = "";
  let rawTime = "";

  if (typeof val === "object" && val !== null) {
    rawDate = val.date || "";
    rawTime = val.time || "";
  } else if (typeof val === "string") {
    rawDate = val;
  }

  if (rawDate && typeof rawDate === "string" && rawDate.includes("T")) {
    try {
      const parsed = new Date(rawDate);
      if (!isNaN(parsed.getTime())) {
        rawDate = parsed.toISOString().split("T")[0];

        if (!rawTime) {
          rawTime = parsed.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
        }
      } else {
        rawDate = rawDate.split("T")[0];
      }
    } catch (e) {
      rawDate = rawDate.split("T")[0];
    }
  }

  const result = `${rawDate} ${rawTime}`.trim();
  return result || fallback;
}

export default function StaffDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Component states
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Loading indicator for asynchronous actions
  const [actionLoading, setActionLoading] = useState(false);

  // --- Password Reset Modal State ---
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // --- Edit Details Modal State ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contact: "",
    role: "",
    department: "",
    accessLevel: "",
  });

  // Fetch initial staff data on load from backend
  useEffect(() => {
    const fetchStaffDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("authToken");

        const response = await fetch(`${BaseApi}/accountStaff/staff/${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch staff details.");
        }

        const staffData = data.staff || data;
        setStaff(staffData);
      } catch (err) {
        console.error("Error loading staff details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchStaffDetails();
    }
  }, [id]);

  // Derived status booleans from backend data
  const isBlocked = Boolean(
    staff?.blocked ||
    staff?.isBlocked ||
    staff?.staffAccounts?.blocked ||
    staff?.staffAccounts?.isAdminDisabled ||
    staff?.status === "Blocked" ||
    staff?.status === "Suspended",
  );

  const isLocked = Boolean(
    staff?.locked ||
    staff?.isLocked ||
    staff?.staffAccounts?.locked ||
    staff?.status === "Locked",
  );

  /**
   * Toggle account Block/Unblock status dynamically
   */
  const handleToggleBlockAccount = async () => {
    const actionLabel = isBlocked ? "Unblock Account" : "Block Account";
    const isConfirmed = window.confirm(
      `Are you sure you want to ${actionLabel.toLowerCase()}?`,
    );
    if (!isConfirmed) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem("authToken");

      const response = await fetch(
        `${BaseApi}/accountStaff/staff/${id}/toggle-block`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            `Failed to ${actionLabel.toLowerCase()}`,
        );
      }

      alert(data.message || `${actionLabel} successful!`);

      // Immediately flip all block flags on success so UI updates on the spot
      const nextBlockedState = !isBlocked;

      setStaff((prev) => ({
        ...prev,
        ...(data.staff || {}),
        blocked: nextBlockedState,
        isBlocked: nextBlockedState,
        status: nextBlockedState ? "Blocked" : "Active",
        staffAccounts: {
          ...prev?.staffAccounts,
          ...(data.staff?.staffAccounts || {}),
          blocked: nextBlockedState,
          isAdminDisabled: nextBlockedState,
          isActive: !nextBlockedState,
        },
      }));
    } catch (err) {
      console.error(`Error toggling block state:`, err);
      alert(`Action Failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Toggle account Lock/Unlock status dynamically
   */
  const handleToggleLockAccount = async () => {
    const actionLabel = isLocked ? "Unlock Account" : "Lock Account";
    const isConfirmed = window.confirm(
      `Are you sure you want to ${actionLabel.toLowerCase()}?`,
    );
    if (!isConfirmed) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem("authToken");

      const response = await fetch(
        `${BaseApi}/accountStaff/staff/${id}/toggle-lock`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            `Failed to ${actionLabel.toLowerCase()}`,
        );
      }

      alert(data.message || `${actionLabel} successful!`);

      // Immediately flip all lock flags on success so UI updates on the spot
      const nextLockedState = !isLocked;

      setStaff((prev) => ({
        ...prev,
        ...(data.staff || {}),
        locked: nextLockedState,
        isLocked: nextLockedState,
        status: nextLockedState ? "Locked" : "Active",
        staffAccounts: {
          ...prev?.staffAccounts,
          ...(data.staff?.staffAccounts || {}),
          locked: nextLockedState,
          blocked: nextLockedState,
        },
      }));
    } catch (err) {
      console.error(`Error toggling lock state:`, err);
      alert(`Action Failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Send Email Request Action
   */
  const handleRequestEmail = async () => {
    if (actionLoading) return;

    const isConfirmed = window.confirm(
      "Are you sure you want to send an email request to this staff member?",
    );
    if (!isConfirmed) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem("authToken");

      const response = await fetch(
        `${BaseApi}/accountStaff/staff/${id}/request-email`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Failed to send email request.",
        );
      }

      alert(data.message || "Email request sent successfully!");

      if (data.staff) {
        setStaff(data.staff);
      }
    } catch (err) {
      console.error("Error requesting email:", err);
      alert(`Action Failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // --- Password Modal Handlers ---
  const handleOpenPasswordModal = () => {
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      alert("Please enter a new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem("authToken");

      const response = await fetch(
        `${BaseApi}/accountStaff/staff/${id}/reset-password`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password: newPassword }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Failed to reset password.",
        );
      }

      alert("Password updated successfully!");
      setShowPasswordModal(false);
    } catch (err) {
      console.error("Password reset error:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // --- Edit Details Modal Handlers ---
  const handleOpenEditModal = () => {
    setEditForm({
      firstName: staff?.firstName || staff?.name?.split(" ")[0] || "",
      lastName:
        staff?.lastName || staff?.name?.split(" ").slice(1).join(" ") || "",
      email: staff?.email || "",
      contact: staff?.contact || staff?.phone || "",
      role: getDisplayString(staff?.role, ""),
      department: getDisplayString(staff?.department, ""),
      accessLevel: getDisplayString(staff?.accessLevel || staff?.role, ""),
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const token = localStorage.getItem("authToken");

      const response = await fetch(
        `${BaseApi}/accountStaff/staff/${id}/update`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editForm),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Failed to update staff details.",
        );
      }

      alert("Staff details updated successfully!");

      const updatedStaff = data.staff || {
        ...staff,
        ...editForm,
        name: `${editForm.firstName} ${editForm.lastName}`.trim(),
      };
      setStaff(updatedStaff);
      setShowEditModal(false);
    } catch (err) {
      console.error("Error updating details:", err);
      alert(`Update Failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="staff-details-layout">
        <main className="staff-details-main">
          <p style={{ padding: "30px", textAlign: "center", color: "#666" }}>
            Loading staff details...
          </p>
        </main>
      </div>
    );
  }

  // Error / Not Found State
  if (error || !staff) {
    return (
      <div className="staff-details-layout">
        <main className="staff-details-main">
          <div style={{ padding: "30px" }}>
            <p
              style={{
                color: "#d9534f",
                fontSize: "16px",
                marginBottom: "16px",
              }}
            >
              {error || "Staff member not found."}
            </p>
            <button className="back-btn" onClick={() => navigate("/staff")}>
              ‹ Back to Staff List
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Extract display values
  const rawName =
    staff.name || `${staff.firstName || ""} ${staff.lastName || ""}`.trim();
  const name = getDisplayString(rawName, "Unknown Staff");
  const staffID = getDisplayString(staff.id || staff.staffID || staff._id);
  const contact = getDisplayString(staff.contact || staff.phone);

  // Dynamic status display priority
  const displayStatus = isBlocked
    ? "Blocked"
    : isLocked
      ? "Locked"
      : staff.status || (staff.isActive ? "Active" : "Inactive");

  const recentActivity = Array.isArray(staff.recentActivity)
    ? staff.recentActivity
    : [];

  return (
    <div className="staff-details-layout">
      <main className="staff-details-main">
        <div className="details-topbar">
          <h2 className="details-title">
            <span className="details-icon">👤</span> Staff / Details
          </h2>
          <button className="back-btn" onClick={() => navigate("/staff")}>
            ‹ Back
          </button>
        </div>

        <section className="details-profile-card">
          <div className="profile-avatar">{initials(name)}</div>

          <div className="profile-info">
            <h3 className="profile-name">
              {name}
              {displayStatus === "Active" && <span className="status-dot" />}
            </h3>

            <p className="profile-line">
              <strong>Staff ID:</strong> {staffID}
            </p>
            <p className="profile-line">
              <strong>Status:</strong>{" "}
              <span
                className={`status-badge status-${displayStatus.toLowerCase()}`}
              >
                {displayStatus}
              </span>
            </p>
            <p className="profile-line">
              <strong>Role:</strong> {getDisplayString(staff.role)}
            </p>
            <p className="profile-line">
              <strong>Department:</strong> {getDisplayString(staff.department)}
            </p>
            <p className="profile-line">
              <strong>Last Login:</strong>{" "}
              {formatDateTime(staff.lastLogin || staff.lastLoginDate)}
            </p>

            <div className="profile-actions">
              {/* Request Email Button */}
              <button
                className="action-btn action-green"
                onClick={handleRequestEmail}
                disabled={actionLoading}
              >
                Request Email
              </button>

              {/* Dynamic Block / Unblock Button */}
              <button
                className={`action-btn ${isBlocked ? "action-green" : "action-red"}`}
                onClick={handleToggleBlockAccount}
                disabled={actionLoading}
              >
                {isBlocked ? "Unblock Account" : "Block Account"}
              </button>

              {/* Reset Password Button */}
              <button
                className="action-btn action-orange"
                onClick={handleOpenPasswordModal}
                disabled={actionLoading}
              >
                Reset Password
              </button>

              {/* Dynamic Lock / Unlock Button */}
              <button
                className={`action-btn ${isLocked ? "action-green" : "action-purple"}`}
                onClick={handleToggleLockAccount}
                disabled={actionLoading}
              >
                {isLocked ? "Unlock Account" : "Lock Account"}
              </button>
            </div>
          </div>

          <button className="edit-btn" onClick={handleOpenEditModal}>
            ✎ Edit
          </button>
        </section>

        <div className="details-lower">
          <section className="details-panel">
            <p>
              <strong>Official E-mail:</strong> {getDisplayString(staff.email)}
            </p>
            <p>
              <strong>Contact:</strong> {contact}
            </p>
            <p>
              <strong>Access Level:</strong>{" "}
              <span className="access-level">
                {getDisplayString(staff.accessLevel || staff.role)}
              </span>
            </p>
            <p>
              <strong>Date Joined:</strong>{" "}
              {formatDateTime(staff.dateJoined || staff.createdAt)}
            </p>
          </section>

          <section className="details-panel">
            <h4 className="activity-heading">
              Recent Activity <span>(Last 3 Actions)</span>
            </h4>
            <div className="activity-feed">
              {recentActivity.length > 0 ? (
                recentActivity.map((a, i) => (
                  <div className="activity-row" key={a._id || i}>
                    <span
                      className={`activity-dot ${i === 0 ? "dot-latest" : ""}`}
                    />
                    <div>
                      <p
                        className={`activity-time ${i === 0 ? "time-latest" : ""}`}
                      >
                        {formatDateTime(a.time || a.date || a.timestamp)}
                      </p>
                      <p className="activity-text">
                        {getDisplayString(a.text || a.action || a.description)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: "#888", fontSize: "14px" }}>
                  No recent activity recorded.
                </p>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* RESET PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h3>Reset Staff Password</h3>
            <p
              style={{ fontSize: "14px", color: "#666", marginBottom: "15px" }}
            >
              Enter a new password for {name}.
            </p>

            <form onSubmit={handlePasswordSubmit}>
              <div className="modal-field">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
              </div>

              <div className="modal-field">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-save-btn"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Saving..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DETAILS MODAL */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-container modal-large">
            <h3>Edit Staff Details</h3>
            <p
              style={{ fontSize: "14px", color: "#666", marginBottom: "15px" }}
            >
              Update demographic and role information for {name}.
            </p>

            <form onSubmit={handleEditSubmit}>
              <div className="modal-grid">
                <div className="modal-field">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={editForm.firstName}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className="modal-field">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={editForm.lastName}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className="modal-field">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className="modal-field">
                  <label>Contact / Phone</label>
                  <input
                    type="text"
                    name="contact"
                    value={editForm.contact}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="modal-field">
                  <label>Role</label>
                  <input
                    type="text"
                    name="role"
                    value={editForm.role}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="modal-field">
                  <label>Department</label>
                  <input
                    type="text"
                    name="department"
                    value={editForm.department}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="modal-field">
                  <label>Access Level</label>
                  <input
                    type="text"
                    name="accessLevel"
                    value={editForm.accessLevel}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-save-btn"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
