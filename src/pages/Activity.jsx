import React, { useState, useEffect, useCallback } from "react";
import { BaseApi } from "../components/apiEndpoint";
import "./Activity.css";

const TIME_RANGES = ["Today", "This Week", "This Month", "All Time"];

export default function Activity() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [search, setSearch] = useState("");
  const [range, setRange] = useState("Today");
  const [rangeOpen, setRangeOpen] = useState(false);

  // Modal States
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  // Fetch Activity Logs
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("authToken");

      const params = new URLSearchParams({
        range,
        search: search.trim(),
      });

      const response = await fetch(
        `${BaseApi}/accountStaff/activity-logs?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load activity logs.");
      }

      setLogs(data.logs || []);
    } catch (err) {
      console.error("Activity Fetch Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [range, search]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchLogs();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [fetchLogs]);

  // Date Formatting Helper
  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Helper: Extract Performer (Actor) Information
  const getActorInfo = (log) => {
    if (!log?.userId)
      return { name: "System / Unknown", email: "N/A", role: "N/A", id: "N/A" };
    if (typeof log.userId === "object") {
      const accounts = log.userId.staffAccounts || {};
      return {
        name: accounts.name || "Unknown Staff",
        email: accounts.email || "N/A",
        role: accounts.role || "IT Staff",
        staffID: accounts.staffID || "N/A",
        id: log.userId._id || "N/A",
      };
    }
    return { name: "Staff Member", email: "N/A", role: "N/A", id: log.userId };
  };

  // Helper: Extract Receiver (Target) Information
  const getTargetInfo = (log) => {
    if (!log?.entityId)
      return {
        name: "None / N/A",
        type: log?.entityType || "N/A",
        details: "N/A",
      };

    const type = log.entityType || "Unknown";

    if (typeof log.entityId === "object") {
      if (type === "Patient") {
        return {
          name: log.entityId.name || "Unknown Patient",
          type: "Patient",
          gender: log.entityId.gender || "N/A",
          phone: log.entityId.phone || "N/A",
          ward: log.entityId.wardAssignment || "N/A",
          id: log.entityId._id,
        };
      } else {
        const staff = log.entityId.staffAccounts || {};
        console.log();
        return {
          name: staff.name || "Unknown Staff Target",
          type: "Hospital IT Staff",
          email: staff.email || "N/A",
          department: staff.department || "N/A",
          role: staff.role || "N/A",
          id: log.entityId._id,
          staffID: staff.staffID,
        };
      }
    }

    return { name: "Target Entity", type, id: log.entityId };
  };

  // CSV Report Generator
  const handleDownloadReport = () => {
    if (logs.length === 0) {
      alert("No logs available to export.");
      return;
    }

    const headers = [
      "ID,Date & Time,Status,Action,Performer,Target Type,Target Name,Audit Message\n",
    ];
    const rows = logs.map((log, index) => {
      const actor = getActorInfo(log);
      const target = getTargetInfo(log);
      const cleanMessage = `"${(log.message || "").replace(/"/g, '""')}"`;
      return `${index + 1},"${formatDateTime(log.createdAt)}",${log.status || "Successful"},${log.action || "N/A"},"${actor.name}",${target.type},"${target.name}",${cleanMessage}`;
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Hospital_Activity_Report_${range.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="activity-layout">
      <main className="activity-main">
        {/* Topbar */}
        <div className="activity-topbar">
          <div className="activity-topbar-title">
            <span className="activity-topbar-icon">📋</span>
            <h2>Activity Logs</h2>
          </div>

          <div className="activity-topbar-controls">
            <input
              className="activity-search"
              placeholder="Search keyword or action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {/* Range Dropdown */}
            <div className="range-dropdown">
              <button
                className="range-btn"
                onClick={() => setRangeOpen((o) => !o)}
              >
                {range} ▾
              </button>
              {rangeOpen && (
                <div className="range-menu">
                  {TIME_RANGES.map((r) => (
                    <div
                      key={r}
                      className={`range-option ${range === r ? "active-range" : ""}`}
                      onClick={() => {
                        setRange(r);
                        setRangeOpen(false);
                      }}
                    >
                      {r}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Export Trigger */}
            <button
              className="export-btn"
              onClick={() => setExportModalOpen(true)}
            >
              📥 Export
            </button>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="activity-list">
          {loading ? (
            <p className="activity-loading">Loading activity records...</p>
          ) : error ? (
            <p className="activity-error">{error}</p>
          ) : logs.length > 0 ? (
            logs.map((log) => {
              const actor = getActorInfo(log);
              return (
                <div
                  className="activity-log-item"
                  key={log._id}
                  onClick={() => setSelectedLog(log)}
                >
                  <div>
                    <span
                      className={`log-status ${
                        log.status === "Failed" || log.status === "Error"
                          ? "log-error"
                          : "log-success"
                      }`}
                    >
                      {log.status || "Successful"}
                    </span>
                    <p className="log-text">{log.message}</p>
                    <small className="log-subtext">
                      Performed by: {actor.name}
                    </small>
                  </div>
                  <span className="log-time">
                    {formatDateTime(log.createdAt)}
                  </span>
                </div>
              );
            })
          ) : (
            <p className="activity-empty">
              No activity logs found for "{range}".
            </p>
          )}
        </div>
      </main>

      {/* --- EXPORT MODAL --- */}
      {exportModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setExportModalOpen(false)}
        >
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Export Activity Log Report</h3>
              <button
                className="modal-close-icon"
                onClick={() => setExportModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="export-summary-box">
              <p>
                <strong>Time Range:</strong> {range}
              </p>
              <p>
                <strong>Total Records:</strong> {logs.length}
              </p>
              <p>
                <strong>Format:</strong> Comma-Separated Values (.CSV)
              </p>
            </div>

            <p className="export-hint">
              This report includes complete performer names, target entity
              details, execution status, and audit messages.
            </p>

            <div className="modal-actions">
              <button
                className="modal-cancel-btn"
                onClick={() => setExportModalOpen(false)}
              >
                Close
              </button>
              <button
                className="modal-save-btn"
                onClick={handleDownloadReport}
                disabled={logs.length === 0}
              >
                ⬇ Download File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EXPANDED LOG ENTRY MODAL --- */}
      {selectedLog &&
        (() => {
          const actor = getActorInfo(selectedLog);
          const target = getTargetInfo(selectedLog);

          return (
            <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
              <div
                className="modal-container log-detail-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h3>Log Detail Inspection</h3>
                  <button
                    className="modal-close-icon"
                    onClick={() => setSelectedLog(null)}
                  >
                    ✕
                  </button>
                </div>

                {/* Message Overview */}
                <div className="detail-field highlight-field">
                  <strong>Audit Message:</strong>
                  <p>{selectedLog.message}</p>
                </div>

                {/* Performer Card */}
                <div className="detail-section-box">
                  <h4>👤 Performer (Actor)</h4>
                  <div className="detail-grid">
                    <div>
                      <strong>Name:</strong> {actor.name}
                    </div>
                    <div>
                      <strong>Email:</strong> {actor.email}
                    </div>
                    <div>
                      <strong>Role:</strong> {actor.role}
                    </div>
                    <div>
                      <strong>Staff ID:</strong> {actor.staffID || "N/A"}
                    </div>
                  </div>
                </div>

                {/* Target / Receiver Card */}
                <div className="detail-section-box">
                  <h4>🎯 Target (Receiver)</h4>
                  <div className="detail-grid">
                    <div>
                      <strong>Entity Type:</strong>{" "}
                      {selectedLog.entityType || target.type}
                    </div>
                    <div>
                      <strong>Name:</strong> {target.name}
                    </div>
                    {target.type === "Patient" ? (
                      <>
                        <div>
                          <strong>Gender:</strong> {target.gender}
                        </div>
                        <div>
                          <strong>Ward:</strong> {target.ward}
                        </div>
                        <div>
                          <strong>Phone:</strong> {target.phone}
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <strong>Department:</strong>{" "}
                          {target.department || "N/A"}
                        </div>
                        <div>
                          <strong>Email:</strong> {target.email || "N/A"}
                        </div>
                      </>
                    )}
                    <div>
                      <strong>Target ID:</strong> {target.staffID || "N/A"}
                    </div>
                  </div>
                </div>

                {/* Execution Metadata */}
                <div className="detail-section-box">
                  <h4>⚙️ Metadata</h4>
                  <div className="detail-grid">
                    <div>
                      <strong>Action Code:</strong> {selectedLog.action}
                    </div>
                    <div>
                      <strong>Execution Status:</strong>{" "}
                      {selectedLog.status || "Successful"}
                    </div>
                    <div>
                      <strong>Timestamp:</strong>{" "}
                      {formatDateTime(selectedLog.createdAt)}
                    </div>
                    <div>
                      <strong>Log ID:</strong> {selectedLog._id}
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    className="modal-cancel-btn"
                    onClick={() => setSelectedLog(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
