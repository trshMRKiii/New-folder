import React from "react";
import { useTicket, statusColor, formatTime } from "../../../lib/useTicket";
import { SHIFTS } from "../../../lib/constants";
import "../../../styles/Ticket.css";

function Ticket() {
  const {
    filteredTickets,
    searchTerm,
    setSearchTerm,
    loading,
    error,
    vehicles,
    selectedVehicle,
    selectedDriver,
    showDriverModal,
    setShowDriverModal,
    issuingTicket,
    successMessage,
    issueError,
    missedBatchWarning,
    overrideMissedBatch,
    setOverrideMissedBatch,
    availableVehicles,
    activeDrivers,
    handleVehicleChange,
    handleDriverChange,
    handleIssueTicket,
    lateDate,
    setLateDate,
    lateBatch,
    setLateBatch,
  } = useTicket();

  return (
    <div className="ticket-page">

      {/* Header */}
      <div className="ticket-header">
        <div className="ticket-header-left">
          <div className="ticket-header-accent" />
          <div>
            <h1 className="ticket-title">Ticket Issuance</h1>
            <p className="ticket-subtitle">Issue and monitor trip dispatch tickets</p>
          </div>
        </div>
      </div>

      <div className="ticket-grid">

        {/* ── Issue Ticket Card ── */}
        <div className="ticket-card">
          <div className="ticket-card-header ticket-card-header--navy">
            <span className="ticket-card-title">Issue New Ticket</span>
            <p className="ticket-card-desc">Only available vehicles and active drivers may be selected.</p>
          </div>

          <div className="ticket-card-body">

            {/* Vehicle select */}
            <div className="ticket-field">
              <label className="ticket-label">Vehicle (Plate Number)</label>
              <select
                className="ticket-select"
                value={selectedVehicle?.id || ""}
                onChange={handleVehicleChange}
              >
                <option value="">— Select a vehicle —</option>
                {availableVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate_number}{v.route_detail ? ` — ${v.route_detail.full_name}` : ""}
                  </option>
                ))}
              </select>
              {vehicles.length > availableVehicles.length && (
                <p className="ticket-field-hint">
                  {vehicles.length - availableVehicles.length} vehicle(s) excluded (On Trip / Maintenance / Has Active Ticket).
                </p>
              )}
            </div>

            {/* Driver panel */}
            {selectedVehicle && (
              <div className="ticket-driver-panel">
                <div className="ticket-driver-panel-top">
                  <span className="ticket-label">Assigned Driver</span>
                  <button
                    type="button"
                    className="ticket-change-btn"
                    onClick={() => setShowDriverModal(!showDriverModal)}
                  >
                    {showDriverModal ? "Close" : "Change Driver"}
                  </button>
                </div>

                {selectedDriver ? (
                  <div className="ticket-driver-info">
                    <div className="ticket-driver-avatar">
                      {selectedDriver.name.charAt(0)}
                    </div>
                    <div className="ticket-driver-meta">
                      <span className="ticket-driver-name">{selectedDriver.name}</span>
                      <span className="ticket-driver-id">ID: {selectedDriver.id}</span>
                    </div>
                  </div>
                ) : (
                  <p className="ticket-driver-empty">No driver assigned to this vehicle</p>
                )}

                {selectedDriver && (
                  <div className="ticket-route-pill">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    {selectedVehicle.route_detail?.full_name || "N/A"}
                  </div>
                )}

                {showDriverModal && (
                  <div className="ticket-driver-modal">
                    <label className="ticket-label">Select Active Driver</label>
                    <select
                      className="ticket-select"
                      value={selectedDriver?.id || ""}
                      onChange={(e) => handleDriverChange(parseInt(e.target.value))}
                    >
                      <option value="">— Choose a driver —</option>
                      {activeDrivers.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Missed batch warning */}
            {missedBatchWarning && (
              <div className="ticket-warning">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ticket-warning-icon">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <path d="M12 9v4"/><path d="M12 17h.01"/>
                </svg>
                <div className="ticket-warning-body">
                  <span className="ticket-warning-msg">{missedBatchWarning}</span>
                  <label className="ticket-warning-check">
                    <input
                      type="checkbox"
                      checked={overrideMissedBatch}
                      onChange={(e) => setOverrideMissedBatch(e.target.checked)}
                    />
                    <span>Mark as late issuance — record under Batch 1 <em>(optional)</em></span>
                  </label>
                  <p className="ticket-warning-note">
                    If unchecked, this ticket will count as a regular Batch 2 issuance.
                  </p>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="ticket-alert ticket-alert--success">{successMessage}</div>
            )}
            {issueError && (
              <div className="ticket-alert ticket-alert--error">{issueError}</div>
            )}

            <button
              type="button"
              className="ticket-issue-btn"
              onClick={handleIssueTicket}
              disabled={issuingTicket || !selectedVehicle || !selectedDriver}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                <path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>
              </svg>
              {issuingTicket ? "Issuing…" : "Issue Ticket"}
            </button>
          </div>
         {/* ── Late Issue Ticket Card ── */}
          <div className="ticket-card ticket-card--full">
            <div className="ticket-card-header ticket-card-header--navy">
              <span className="ticket-card-title">Late Issue Ticket</span>
              <p className="ticket-card-desc">Issue tickets for past dates with batch selection</p>
            </div>

            <div className="ticket-card-body">
              <div className="ticket-field">
                <label className="ticket-label">Issuance Date</label>
                <input 
                  type="date" 
                  className="ticket-select" 
                  value={lateDate}
                  onChange={(e) => setLateDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]} // Prevent future dates
                />
              </div>

              <div className="ticket-field">
                <label className="ticket-label">Batch</label>
                <select 
                  className="ticket-select"
                  value={lateBatch}
                  onChange={(e) => setLateBatch(e.target.value)}
                >
                  <option value={SHIFTS.BATCH_1.name}>Batch 1 (6am–3pm)</option>
                  <option value={SHIFTS.BATCH_2.name}>Batch 2 (3pm–9pm)</option>
                </select>
              </div>

              <div className="ticket-field">
                <label className="ticket-label">Vehicle (Plate Number)</label>
                <select 
                  className="ticket-select"
                  value={selectedVehicle?.id || ""}
                  onChange={handleVehicleChange}
                >
                  <option value="">— Select a vehicle —</option>
                  {availableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.plate_number}</option>
                  ))}
                </select>
                {selectedDriver ? (
                  <div className="ticket-driver-info">
                    <div className="ticket-driver-avatar">
                      {selectedDriver.name.charAt(0)}
                    </div>
                    <div className="ticket-driver-meta">
                      <span className="ticket-driver-name">{selectedDriver.name}</span>
                      <span className="ticket-driver-id">ID: {selectedDriver.id}</span>
                    </div>
                  </div>
                ) : (
                  <p className="ticket-driver-empty">No driver assigned to this vehicle</p>
                )}

                {selectedDriver && (
                  <div className="ticket-route-pill">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    {selectedVehicle.route_detail?.full_name || "N/A"}
                  </div>
                )}

                {showDriverModal && (
                  <div className="ticket-driver-modal">
                    <label className="ticket-label">Select Active Driver</label>
                    <select
                      className="ticket-select"
                      value={selectedDriver?.id || ""}
                      onChange={(e) => handleDriverChange(parseInt(e.target.value))}
                    >
                      <option value="">— Choose a driver —</option>
                      {activeDrivers.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <button 
                type="button" 
                className="ticket-issue-btn"
                onClick={() => handleIssueTicket(true, lateDate, lateBatch)}
                disabled={issuingTicket || !selectedVehicle || !selectedDriver || !lateDate}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                  <path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>
                </svg>
                {issuingTicket ? "Issuing…" : "Issue Late Ticket"}
              </button>
            </div>
          </div>

        </div>

        

        {/* ── Recent Tickets Card ── */}
        <div className="ticket-card">
          <div className="ticket-card-header ticket-card-header--navy">
            <div>
              <span className="ticket-card-title">Recent Tickets</span>
              <p className="ticket-card-desc">Last 10 issued tickets</p>
            </div>
            <div className="ticket-search-wrap">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ticket-search-icon">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <input
                className="ticket-search"
                placeholder="Search tickets…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="ticket-table-wrap">
            <table className="ticket-table">
              <thead>
                <tr>
                  {["Ticket ID", "Vehicle", "Driver", "Time", "Status"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="ticket-table-state">
                      <div className="ticket-loading-dots"><div /><div /><div /></div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="5" className="ticket-table-state ticket-table-state--error">
                      Error: {error}
                    </td>
                  </tr>
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="ticket-table-state">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                      </svg>
                      <span>No tickets found</span>
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((t) => (
                    <tr key={t.id} className="ticket-table-row">
                      <td><span className="ticket-id-badge">#{t.id}</span></td>
                      <td>
                        {t.vehicle?.plate_number
                          ? <span className="ticket-plate">{t.vehicle.plate_number}</span>
                          : <span className="ticket-na">N/A</span>}
                      </td>
                      <td className="ticket-td-name">{t.driver?.name || <span className="ticket-na">N/A</span>}</td>
                      <td className="ticket-td-time">{formatTime(t.issued_at)}</td>
                      <td>
                        <span className={`ticket-status ${statusColor[t.status] || "ticket-status--default"}`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="ticket-card-footer">
            <a href="/dashboard/Reports" className="ticket-history-link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              View Full History
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Ticket;
