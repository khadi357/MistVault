import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar.jsx";
import {
  FiUserX,
  FiCheckCircle,
  FiKey,
  FiLock,
  FiX,
  FiLoader,
} from "react-icons/fi";
import "./Control.css";
import { BaseApi } from "../components/apiEndpoint.jsx";

const ROLE_ICONS = {
  Doctor: "🩺",
  Nurse: "💉",
  Pharmacist: "💊",
  LabScientist: "🧪",
  "Lab Attendant": "🧪",
  Radiologist: "🩻",
  Receptionist: "💼",
  "IT Staff": "👥",
  "IT Admin": "👥",
};

function levelClass(level) {
  if (level === "Full Access") return "level-full";
  if (level === "Restricted Access") return "level-restricted";
  return "level-limited";
}

export default function Control() {
  const [permissions, setPermissions] = useState([]);
  const [settings, setSettings] = useState({
    twoFA: false,
    passwordPolicy: false,
    sessionTimeout: "30 minutes",
    lockoutAttempts: "5 attempts",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal & Action Loading State
  const [activeAction, setActiveAction] = useState(null);
  const [targetStaffId, setTargetStaffId] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken");
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  };

  useEffect(() => {
    const fetchControlData = async () => {
      try {
        setLoading(true);
        const headers = getAuthHeaders();

        const [permRes, settingsRes] = await Promise.all([
          fetch(`${BaseApi}/accountStaff/accountControl/permissions`, {
            headers,
          }),
          fetch(`${BaseApi}/accountStaff/accountControl/settings`, { headers }),
        ]);

        if (!permRes.ok || !settingsRes.ok) {
          throw new Error("Failed to load control settings");
        }

        const permissionsData = await permRes.json();
        const settingsData = await settingsRes.json();

        setPermissions(permissionsData);
        setSettings({
          twoFA: settingsData.twoFA ?? false,
          passwordPolicy: settingsData.passwordPolicy ?? false,
          sessionTimeout: settingsData.sessionTimeout || "30 minutes",
          lockoutAttempts: settingsData.lockoutAttempts || "5 attempts",
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchControlData();
  }, []);

  const updateSetting = async (key, value) => {
    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);

    try {
      const res = await fetch(
        `${BaseApi}/accountStaff/accountControl/settings`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({ [key]: value }),
        },
      );

      if (!res.ok) throw new Error("Failed to persist setting update");
    } catch (err) {
      console.error(err);
      setSettings(settings);
    }
  };

  const openActionModal = (actionType) => {
    setActiveAction(actionType);
    setTargetStaffId("");
    setTempPassword("");
  };

  const submitSystemAction = async () => {
    if (!targetStaffId.trim()) {
      alert("Please enter a valid Staff ID");
      return;
    }

    if (activeAction === "RESET_PASSWORD" && !tempPassword.trim()) {
      alert("Please enter a new temporary password");
      return;
    }

    try {
      setActionLoading(true);

      const payload = {
        action: activeAction,
        staffId: targetStaffId.trim(),
      };

      if (activeAction === "RESET_PASSWORD") {
        payload.password = tempPassword.trim();
      }

      const res = await fetch(
        `${BaseApi}/accountStaff/accountControl/actions`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();

      if (res.ok) {
        alert(data.message || `${activeAction} executed successfully`);
        setActiveAction(null);
        setTargetStaffId("");
        setTempPassword("");
      } else {
        alert(`Error: ${data.message || "Action failed"}`);
      }
    } catch (err) {
      console.error(`Failed to execute ${activeAction}:`, err);
      alert("Failed to submit system action.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading)
    return (
      <div className="control-layout">
        <p>Loading control panel...</p>
      </div>
    );
  if (error)
    return (
      <div className="control-layout">
        <p>Error: {error}</p>
      </div>
    );

  return (
    <div className="control-layout">
      <main className="control-main">
        <div className="control-topbar">
          <div className="control-topbar-title">
            <span className="control-topbar-icon">🪪</span>
            <h2>Control</h2>
          </div>
          <button className="backup-btn">Last Backup: Today</button>
        </div>

        <div className="control-grid">
          {/* ACCESS PERMISSIONS */}
          <section className="control-card">
            <h3 className="card-title">Access Permissions</h3>
            <p className="card-subtitle">Manage permission for system users.</p>

            <table className="permissions-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Access Level</th>
                  <th>Users</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((p) => (
                  <tr key={p.role}>
                    <td className="role-cell">
                      <span className="role-icon">
                        {ROLE_ICONS[p.role] || "👤"}
                      </span>{" "}
                      {p.role}
                    </td>
                    <td>
                      <span className={`level-badge ${levelClass(p.level)}`}>
                        {p.level}
                      </span>
                    </td>
                    <td className="users-cell">{p.users}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button className="view-all-btn">View all permissions.</button>
          </section>

          {/* SECURITY SETTINGS */}
          <section className="control-card">
            <h3 className="card-title">Security Settings</h3>
            <p className="card-subtitle">
              Configure system security preferences.
            </p>

            <div className="setting-row">
              <div className="setting-icon">🛡️</div>
              <div className="setting-text">
                <h4>Two-Factor Authentication [2FA]</h4>
                <p>Require 2FA every month and after 1 month of inactivity</p>
              </div>
              <button
                className={`toggle ${settings.twoFA ? "toggle-on" : ""}`}
                onClick={() => updateSetting("twoFA", !settings.twoFA)}
              >
                <span className="toggle-knob" />
              </button>
            </div>

            <div className="setting-row">
              <div className="setting-icon">🔒</div>
              <div className="setting-text">
                <h4>Password Policy</h4>
                <p>Require strong passwords</p>
              </div>
              <button
                className={`toggle ${settings.passwordPolicy ? "toggle-on" : ""}`}
                onClick={() =>
                  updateSetting("passwordPolicy", !settings.passwordPolicy)
                }
              >
                <span className="toggle-knob" />
              </button>
            </div>

            <div className="setting-row">
              <div className="setting-icon">🕒</div>
              <div className="setting-text">
                <h4>Session Timeout</h4>
                <p>Automatically log out inactive users</p>
              </div>
              <select
                className="setting-select"
                value={settings.sessionTimeout}
                onChange={(e) =>
                  updateSetting("sessionTimeout", e.target.value)
                }
              >
                <option>15 minutes</option>
                <option>30 minutes</option>
                <option>60 minutes</option>
              </select>
            </div>

            <div className="setting-row">
              <div className="setting-icon">🚫</div>
              <div className="setting-text">
                <h4>Account Lockout</h4>
                <p>Lock account after failed login attempts</p>
              </div>
              <select
                className="setting-select"
                value={settings.lockoutAttempts}
                onChange={(e) =>
                  updateSetting("lockoutAttempts", e.target.value)
                }
              >
                <option>3 attempts</option>
                <option>5 attempts</option>
                <option>10 attempts</option>
              </select>
            </div>
          </section>
        </div>

        {/* SYSTEM CONTROLS */}
        <section className="control-card system-controls-card">
          <h3 className="card-title">System Controls</h3>
          <p className="card-subtitle">Perform system management actions.</p>

          <div className="system-actions">
            <button
              className="system-action"
              onClick={() => openActionModal("SUSPEND_ACCOUNT")}
            >
              <span className="action-icon icon-red">
                <FiUserX />
              </span>
              <strong>Suspend Account</strong>
              <p>Temporarily suspend a user account</p>
            </button>

            <button
              className="system-action"
              onClick={() => openActionModal("REACTIVATE_ACCOUNT")}
            >
              <span className="action-icon icon-green">
                <FiCheckCircle />
              </span>
              <strong>Reactivate Account</strong>
              <p>Reactivate a suspended user account</p>
            </button>

            <button
              className="system-action"
              onClick={() => openActionModal("RESET_PASSWORD")}
            >
              <span className="action-icon icon-orange">
                <FiKey />
              </span>
              <strong>Reset Password</strong>
              <p>Reset password for staff member</p>
            </button>

            <button
              className="system-action"
              onClick={() => openActionModal("LOCK_ACCOUNT")}
            >
              <span className="action-icon icon-purple">
                <FiLock />
              </span>
              <strong>Lock Account</strong>
              <p>Lock accounts that have been inactive</p>
            </button>
          </div>
        </section>

        {/* ACTION TARGET MODAL */}
        {activeAction && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="modal-header">
                <h3>{activeAction.replace("_", " ")}</h3>
                <button
                  onClick={() => !actionLoading && setActiveAction(null)}
                  disabled={actionLoading}
                >
                  <FiX />
                </button>
              </div>

              <div className="modal-body">
                <div className="modal-field">
                  <label className="modal-label">Staff ID</label>
                  <input
                    type="text"
                    placeholder="e.g. STF-10294"
                    value={targetStaffId}
                    onChange={(e) => setTargetStaffId(e.target.value)}
                    className="modal-input"
                    disabled={actionLoading}
                  />
                </div>

                {activeAction === "RESET_PASSWORD" && (
                  <div className="modal-field">
                    <label className="modal-label">
                      New Temporary Password
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TempPass#2026"
                      value={tempPassword}
                      onChange={(e) => setTempPassword(e.target.value)}
                      className="modal-input"
                      disabled={actionLoading}
                    />
                  </div>
                )}
              </div>

              <div className="modal-buttons">
                <button
                  onClick={() => setActiveAction(null)}
                  className="btn-cancel"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={submitSystemAction}
                  className="btn-confirm"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <span className="btn-loading">
                      <FiLoader className="spinner-icon" /> Executing...
                    </span>
                  ) : (
                    "Confirm Action"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
