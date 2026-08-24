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

  // Fetch Activity Logs from Backend
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

  // Format Date-Time
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

  // Generate and Download Readable CSV / Text Document
  const handleDownloadReport = () => {
    if (logs.length === 0) {
      alert("No logs available to export.");
      return;
    }

    const headers = ["ID,Date & Time,Status,Action Type,Audit Message\n"];
    const rows = logs.map((log, index) => {
      const cleanMessage = `"${(log.message || "").replace(/"/g, '""')}"`;
      return `${index + 1},"${formatDateTime(log.createdAt)}",${log.status || "Successful"},${log.action || "N/A"},${cleanMessage}`;
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

            {/* Export Modal Trigger */}
            <button
              className="export-btn"
              onClick={() => setExportModalOpen(true)}
            >
              📥 Export
            </button>
          </div>
        </div>

        {/* Logs Feed */}
        <div className="activity-list">
          {loading ? (
            <p className="activity-loading">Loading activity records...</p>
          ) : error ? (
            <p className="activity-error">{error}</p>
          ) : logs.length > 0 ? (
            logs.map((log) => (
              <div
                className="activity-log-item"
                key={log._id}
                onClick={() => setSelectedLog(log)}
              >
                <div>
                  <p
                    className={`log-status ${
                      log.status === "Error" ? "log-error" : "log-success"
                    }`}
                  >
                    {log.status || "Successful"}
                  </p>
                  <p className="log-text">{log.message}</p>
                </div>
                <span className="log-time">
                  {formatDateTime(log.createdAt)}
                </span>
              </div>
            ))
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
              This file contains full timestamps, actor IDs, execution statuses,
              and descriptive audit messages for your hospital.
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

      {/* --- SINGLE LOG DETAIL MODAL --- */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Log Entry Details</h3>
              <button
                className="modal-close-icon"
                onClick={() => setSelectedLog(null)}
              >
                ✕
              </button>
            </div>

            <div className="detail-field">
              <strong>Audit Message:</strong>
              <p>{selectedLog.message}</p>
            </div>
            <div className="detail-field">
              <strong>Action Type:</strong>
              <p>{selectedLog.action}</p>
            </div>
            <div className="detail-field">
              <strong>Timestamp:</strong>
              <p>{formatDateTime(selectedLog.createdAt)}</p>
            </div>
            <div className="detail-field">
              <strong>Status:</strong>
              <p>{selectedLog.status || "Successful"}</p>
            </div>
            <div className="detail-field">
              <strong>Entity ID:</strong>
              <p>{selectedLog.entityId || "N/A"}</p>
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
      )}
    </div>
  );
}
