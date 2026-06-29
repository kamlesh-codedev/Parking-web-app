import { useState, useEffect, useCallback } from "react";
import {
  Search,
  QrCode,
  VideoOff,
  Timer,
  CreditCard,
  Receipt,
  MessageSquare,
  Save,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { Link } from "react-router-dom"; // Requirement 1
import "./ParkOut.css";
import logo from '../../assets/kk-logo.png';

/* ─────────────────────────────────────────────────────────────
   API CONFIGURATION — change BASE_URL only
───────────────────────────────────────────────────────────── */
const API = {
  BASE_URL:      "http://127.0.0.1:5000/park-out",
  VEHICLE_LIST:  "/",
  GENERATE_BILL: "/generate-bill",
  SEND_MSG:      "/send-msg",
  SAVE_MSG:      "/save-msg",
};

const post = async (path, body = {}) => {
  const res = await fetch(`${API.BASE_URL}${path}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
};

/* ─────────────────────────────────────────────────────────────
   STATIC DATA
───────────────────────────────────────────────────────────── */
const MOCK_RECENT_EXITS = [
  { billNo: "#KK-99821", vehicleNo: "KA-01-HG-8822", name: "Mercedes C-Class", exitTime: "Today, 14:22", amount: "₹145.00", status: "Paid" },
  { billNo: "#KK-99820", vehicleNo: "KA-04-PJ-1109", name: "Toyota Fortuner",  exitTime: "Today, 13:45", amount: "₹80.00",  status: "Paid" },
];

/* ═════════════════════════════════════════════════════════════
   COMPONENT
═════════════════════════════════════════════════════════════ */
export default function ParkOut() {

  /* ── State ── */
  const [vehicleList,     setVehicleList]     = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [session,         setSession]         = useState(null);
  const [loadingList,     setLoadingList]     = useState(false);
  const [loadingBill,     setLoadingBill]     = useState(false);
  const [loadingMsg,      setLoadingMsg]      = useState(false);
  const [loadingSave,     setLoadingSave]     = useState(false);
  const [loadingExit,     setLoadingExit]     = useState(false);
  const [error,           setError]           = useState(null);
  const [successMsg,      setSuccessMsg]      = useState(null);

  /* ── Helpers ── */
  const showError = useCallback((msg) => {
    setError(msg);
    setTimeout(() => setError(null), 4000);
  }, []);

  const showSuccess = useCallback((msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }, []);

  /* ── Fetch vehicle list on mount ── */
  const fetchVehicleList = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await post(API.VEHICLE_LIST);
      if (data.status === "success") {
        setVehicleList(data.vehicle_list || []);
      } else {
        showError("Failed to load vehicle list.");
      }
    } catch (err) {
      showError(`Vehicle list error: ${err.message}`);
    } finally {
      setLoadingList(false);
    }
  }, [showError]);

  useEffect(() => { fetchVehicleList(); }, [fetchVehicleList]);

  /* ── Generate bill ── */
  const handleGenerateBill = async () => {
    if (!selectedVehicle) { showError("Please select a vehicle first."); return; }
    setLoadingBill(true);
    setSession(null);
    try {
      const data = await post(API.GENERATE_BILL, { vehicle_id: selectedVehicle });
      if (data.status === "success") {
        setSession(data);
      } else {
        showError(data.message || "Failed to generate bill.");
      }
    } catch (err) {
      showError(`Generate bill error: ${err.message}`);
    } finally {
      setLoadingBill(false);
    }
  };

  /* ── Send message ── */
  const handleSendMsg = async () => {
    if (!session) { showError("No active session. Generate a bill first."); return; }
    setLoadingMsg(true);
    try {
      await post(API.SEND_MSG, { bill_no: session.bill_no, vehicle_no: session.vehicle_no });
      showSuccess("Message sent successfully.");
    } catch (err) {
      showError(`Send message error: ${err.message}`);
    } finally {
      setLoadingMsg(false);
    }
  };

  /* ── Save message log ── */
  const handleSaveMsg = async () => {
    if (!session) { showError("No active session. Generate a bill first."); return; }
    setLoadingSave(true);
    try {
      await post(API.SAVE_MSG, { bill_no: session.bill_no, vehicle_no: session.vehicle_no });
      showSuccess("Message log saved.");
    } catch (err) {
      showError(`Save message error: ${err.message}`);
    } finally {
      setLoadingSave(false);
    }
  };

  /* ── Complete exit ── */
  const handleCompleteExit = async () => {
    if (!selectedVehicle) { showError("Please select a vehicle first."); return; }
    setLoadingExit(true);
    try {
      const data = await post(API.GENERATE_BILL, { vehicle_id: selectedVehicle });
      if (data.status === "success") {
        setSession(data);
        await post(API.SAVE_MSG, { bill_no: data.bill_no, vehicle_no: data.vehicle_no });
        showSuccess("Exit completed and bill generated!");
      } else {
        showError(data.message || "Failed to complete exit.");
      }
    } catch (err) {
      showError(`Complete exit error: ${err.message}`);
    } finally {
      setLoadingExit(false);
    }
  };

  /* ── Derived display values ── */
  const d = {
    vehicleNo:   session?.vehicle_no    ?? "---",
    vehicleName: session?.vehicle_name  ?? "---",
    billNo:      session?.bill_no       ?? "---",
    phone:       session?.phone         ?? "---",
    entryTime:   session?.entry_time    ?? "--/--/-- --:--",
    exitTime:    session?.exit_time     ?? "--/--/-- --:--",
    duration:    session?.duration      ?? "00h 00m",
    days:        session?.no_of_days    ?? "0",
    dailyAmt:    session?.daily_amount  ?? "₹0.00",
    prepaid:     session?.prepaid       ?? "₹0.00",
    parkingFee:  session?.parking_fee   ?? "₹0.00",
    total:       session?.total_amount  ?? "₹0.00",
  };

  /* ═══════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════ */
  return (
    <div className="po-root">

      {/* ── Sidebar — Requirement 2, 3 & 4 ─────────────────── */}
      <aside className="pi-sidebar">
        <div className="pi-sidebar-logo">
          <img src={logo} alt="KK Parking" className="pi-logo" />
        </div>

        <nav className="pi-nav">
          <Link to="/dashboard" className="pi-nav-item">
            <span className="pi-icon">dashboard</span>
            <span>Dashboard</span>
          </Link>
          <Link to="/parkin" className="pi-nav-item">
            <span className="pi-icon">login</span>
            <span>Park-In</span>
          </Link>
          <Link to="/parkout" className="pi-nav-item pi-nav-active">
            <span className="pi-icon">logout</span>
            <span>Park-Out</span>
          </Link>
          <Link to="#" className="pi-nav-item">
            <span className="pi-icon">analytics</span>
            <span>Reports</span>
          </Link>
          <Link to="/invoice" className="pi-nav-item">
            <span className="pi-icon">receipt_long</span>
            <span>Invoices</span>
          </Link>
        </nav>

        <div className="pi-sidebar-footer">
          <button className="pi-emergency-btn">
            <span className="pi-icon">emergency</span>
            Emergency Support
          </button>
          <div className="pi-footer-links">
            <Link to="/help" className="pi-footer-link">
              <span className="pi-icon">help</span>
              <span>Help</span>
            </Link>
            <Link to="/" className="pi-footer-link">
              <span className="pi-icon">power_settings_new</span>
              <span>Logout</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────── */}
      <main className="po-main">

        {/* Header */}
        <header className="po-header">
          <div className="po-header-title">
            <span className="pi-icon" style={{ color: "#6ffbbe", fontSize: "1.4rem" }}>logout</span>
            <h1 className="po-header-h1">Park-Out / Exit</h1>
          </div>
          <p className="po-header-sub">
            Finalize parked vehicles, calculate parking charges and complete exit process.
          </p>
        </header>

        {/* Canvas */}
        <div className="po-canvas">
          <div className="po-grid">

            {/* ── Left column ─────────────────────────────── */}
            <div className="po-col-left">

              {/* Vehicle Lookup */}
              <div className="po-card">
                <div className="po-card-title" style={{ color: "#bec6e0" }}>
                  <Search size={20} />
                  <h3>Vehicle Lookup</h3>
                </div>

                <div className="po-lookup-row">
                  <div className="po-lookup-select-wrap">
                    <label className="po-label">Vehicle Number</label>
                    <div style={{ position: "relative" }}>
                      <select
                        className="po-select"
                        value={selectedVehicle}
                        onChange={(e) => { setSelectedVehicle(e.target.value); setSession(null); }}
                        disabled={loadingList}
                      >
                        <option value="">
                          {loadingList ? "Loading vehicles…" : "Select Parked Vehicle"}
                        </option>
                        {vehicleList.map((v) => {
                          const key = v.vehicle_id ?? v.id ?? v.vehicle_no;
                          return (
                            <option key={key} value={key}>
                              {v.vehicle_no}{v.vehicle_name ? ` (${v.vehicle_name})` : ""}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown size={18} className="po-select-icon" />
                    </div>
                  </div>

                  <div className="po-lookup-btn-wrap">
                    <button
                      onClick={handleGenerateBill}
                      disabled={loadingBill || !selectedVehicle}
                      className="po-search-btn"
                    >
                      {loadingBill ? <span className="po-spinner" /> : <Search size={18} />}
                      Search Vehicle
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="po-divider">
                  <div className="po-divider-line" />
                  <span className="po-divider-text">OR</span>
                  <div className="po-divider-line" />
                </div>

                {/* Optical Scanner */}
                <div className="po-scanner-outer">
                  <div className="po-scanner-glow" />
                  <div className="po-card po-scanner-inner">
                    <div className="po-scanner-header">
                      <div className="po-scanner-title">
                        <QrCode size={20} color="#4edea3" />
                        <h3>Optical Scanner</h3>
                      </div>
                      <div className="po-live-chip">
                        <span className="po-live-dot" />
                        <span>LIVE FEED</span>
                      </div>
                    </div>

                    <div className="po-viewport">
                      <div className="po-scanner-line" />
                      <div className="po-bracket po-bracket-tl" />
                      <div className="po-bracket po-bracket-tr" />
                      <div className="po-bracket po-bracket-bl" />
                      <div className="po-bracket po-bracket-br" />
                      <div className="po-viewport-center">
                        <VideoOff size={64} color="rgba(78,222,163,0.3)" />
                        <p className="po-viewport-text">Position vehicle license plate within frame</p>
                        <button className="po-init-cam-btn">Initialize Camera</button>
                      </div>
                      <div className="po-status-chips">
                        <div className="po-chip">
                          <span className="po-chip-label">DETECTED:</span>
                          <span className="po-chip-value">---</span>
                        </div>
                        <div className="po-chip">
                          <span className="po-chip-label">CONFIDENCE:</span>
                          <span className="po-chip-value">0%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Exits Table */}
              <div className="po-card">
                <div className="po-table-header">
                  <h3 className="po-table-title">Recent Exits</h3>
                  <button className="po-view-all-btn">View All Records</button>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table className="po-table">
                    <thead>
                      <tr className="po-table-head-row">
                        {["Bill No", "Vehicle Number", "Vehicle Name", "Exit Time", "Amount", "Status"].map((h) => (
                          <th key={h} className="po-th">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_RECENT_EXITS.map((row) => (
                        <tr key={row.billNo} className="po-table-row">
                          <td className="po-td po-td-mono">{row.billNo}</td>
                          <td className="po-td po-td-bold">{row.vehicleNo}</td>
                          <td className="po-td po-td-muted">{row.name}</td>
                          <td className="po-td po-td-muted">{row.exitTime}</td>
                          <td className="po-td po-td-amount">{row.amount}</td>
                          <td className="po-td">
                            <span className="po-status-badge">{row.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ── Right column ─────────────────────────────── */}
            <div className="po-col-right">

              {/* Parking Session */}
              <div className="po-card">
                <div className="po-section-head">
                  <Timer size={20} color="#bec6e0" />
                  <h3>Parking Session</h3>
                </div>
                <div className="po-info-list">
                  {[
                    { label: "Vehicle No",   value: d.vehicleNo,   bold: true },
                    { label: "Vehicle Name", value: d.vehicleName },
                    { label: "Bill No",      value: d.billNo },
                    { label: "Phone Number", value: d.phone },
                    { label: "Entry Time",   value: d.entryTime },
                    { label: "Exit Time",    value: d.exitTime },
                  ].map(({ label, value, bold }) => (
                    <div key={label} className="po-info-row">
                      <span className="po-info-label">{label}</span>
                      <span className={bold ? "po-info-value po-info-bold" : "po-info-value po-info-muted"}>{value}</span>
                    </div>
                  ))}
                  <div className="po-info-row po-info-row-top-border">
                    <span className="po-info-label">Duration</span>
                    <span className="po-info-value po-info-green">{d.duration}</span>
                  </div>
                </div>
              </div>

              {/* Bill Summary */}
              <div className="po-card">
                <div className="po-section-head">
                  <CreditCard size={20} color="#bec6e0" />
                  <h3>Bill Summary</h3>
                </div>
                <div className="po-info-list" style={{ marginBottom: "16px" }}>
                  {[
                    { label: "No of Days",   value: d.days },
                    { label: "Daily Amount", value: d.dailyAmt },
                    { label: "Prepaid",      value: `-${d.prepaid}`, red: true },
                  ].map(({ label, value, red }) => (
                    <div key={label} className="po-info-row">
                      <span className="po-info-label">{label}</span>
                      <span className={red ? "po-info-value po-info-red" : "po-info-value po-info-muted"}>{value}</span>
                    </div>
                  ))}
                  <div className="po-info-row po-info-row-top-border">
                    <span className="po-info-label">Parking Fee</span>
                    <span className="po-info-value po-info-muted">{d.parkingFee}</span>
                  </div>
                </div>
                <div className="po-total-box">
                  <p className="po-total-label">Total Payable Amount</p>
                  <h2 className="po-total-amount">{d.total}</h2>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="po-actions-grid">
                <button
                  onClick={handleGenerateBill}
                  disabled={loadingBill || !selectedVehicle}
                  className="po-action-btn"
                >
                  {loadingBill ? <span className="po-spinner" /> : <Receipt size={18} color="#bec6e0" />}
                  Generate Bill
                </button>

                <button
                  onClick={handleSendMsg}
                  disabled={loadingMsg || !session}
                  className="po-action-btn"
                >
                  {loadingMsg ? <span className="po-spinner" /> : <MessageSquare size={18} color="#bec6e0" />}
                  Send Message
                </button>

                <button
                  onClick={handleSaveMsg}
                  disabled={loadingSave || !session}
                  className="po-action-btn po-action-btn-full"
                >
                  {loadingSave ? <span className="po-spinner" /> : <Save size={18} color="#bec6e0" />}
                  Save Message Log
                </button>

                <button
                  onClick={handleCompleteExit}
                  disabled={loadingExit || !selectedVehicle}
                  className="po-exit-btn"
                >
                  {loadingExit ? <span className="po-spinner po-spinner-dark" /> : <CheckCircle2 size={22} />}
                  Generate Bill &amp; Complete Exit
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Toasts */}
      {error      && <div className="po-toast po-toast-error">{error}</div>}
      {successMsg && <div className="po-toast po-toast-success">{successMsg}</div>}

    </div>
  );
}