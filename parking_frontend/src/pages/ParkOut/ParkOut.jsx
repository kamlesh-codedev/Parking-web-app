import { useState, useEffect, useCallback, useRef } from "react";
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
  X,
  Printer,
  Car,
  Phone,
  Hash,
  Clock,
  IndianRupee,
  CalendarClock,
  BadgeCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import "./ParkOut.css";
import logo from "../../assets/kk-logo.png";

/* ─────────────────────────────────────────────────────────────
   API CONFIGURATION
───────────────────────────────────────────────────────────── */
const BASE_URL = "http://127.0.0.1:5000/park-out";

const post = async (path, body = {}) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",           // needed so Flask session cookie is sent
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); msg = j.message || msg; } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
};

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */
/** Parse "DD-MM-YYYY HH:MM AM/PM" or ISO string into a Date */
const parseDate = (str) => {
  if (!str) return null;
  // ISO
  if (str.includes("T") || str.match(/^\d{4}-\d{2}-\d{2}/)) return new Date(str);
  // "DD-MM-YYYY HH:MM AM/PM"
  const m = str.match(/(\d{2})-(\d{2})-(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (m) {
    let [, dd, mm, yyyy, hh, min, ampm] = m;
    hh = parseInt(hh, 10);
    if (ampm) {
      if (ampm.toUpperCase() === "PM" && hh !== 12) hh += 12;
      if (ampm.toUpperCase() === "AM" && hh === 12) hh = 0;
    }
    return new Date(+yyyy, +mm - 1, +dd, hh, +min);
  }
  return new Date(str);
};

const fmtDateTime = (date) => {
  if (!date) return "--/--/---- --:--";
  return date.toLocaleString("en-IN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
};

const calcDuration = (inDate, outDate) => {
  if (!inDate || !outDate) return { text: "0h 0m", days: 1 };
  const diffMs = Math.max(0, outDate - inDate);
  const totalMins = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMins / 1440);
  const hrs  = Math.floor((totalMins % 1440) / 60);
  const mins = totalMins % 60;
  const durationDays = Math.floor(diffMs / 86400000) + 1;   // billing days (same as backend)
  let text = "";
  if (days > 0) text += `${days}d `;
  text += `${hrs}h ${mins}m`;
  return { text, days: durationDays };
};

/* ─────────────────────────────────────────────────────────────
   STATIC DATA
───────────────────────────────────────────────────────────── */
const MOCK_RECENT_EXITS = [
  { billNo: "#KK-99821", vehicleNo: "KA-01-HG-8822", name: "Mercedes C-Class", exitTime: "Today, 14:22", amount: "₹145.00", status: "Paid" },
  { billNo: "#KK-99820", vehicleNo: "KA-04-PJ-1109", name: "Toyota Fortuner",  exitTime: "Today, 13:45", amount: "₹80.00",  status: "Paid" },
];

/* ═════════════════════════════════════════════════════════════
   INVOICE MODAL
═════════════════════════════════════════════════════════════ */
function InvoiceModal({ session, onClose }) {
  const printRef = useRef();

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open("", "_blank", "width=480,height=700");
    win.document.write(`
      <html><head><title>Invoice - ${session.bill_no}</title>
      <style>
        body { font-family: 'Courier New', monospace; padding: 20px; background: #fff; color: #000; }
        .inv-title { text-align:center; font-size:20px; font-weight:bold; margin:8px 0; }
        .inv-divider { border-top:1px dashed #333; margin:8px 0; }
        .inv-row { display:flex; justify-content:space-between; margin:5px 0; font-size:13px; }
        .inv-label { color:#555; }
        .inv-value { font-weight:600; }
        .inv-footer { text-align:center; margin-top:12px; font-size:12px; color:#555; }
        .inv-paid { text-align:center; font-size:16px; font-weight:bold; color:green; margin:10px 0; }
      </style></head><body>${content}</body></html>
    `);
    win.document.close();
    win.print();
  };

  const s = session;
  const inDate  = parseDate(s.entry_time  ?? s.park_in);
  const outDate = parseDate(s.exit_time   ?? s.park_out ?? new Date().toISOString());
  const { text: dur } = calcDuration(inDate, outDate);

  return (
    <div className="po-modal-overlay" onClick={onClose}>
      <div className="po-modal" onClick={(e) => e.stopPropagation()}>
        <div className="po-modal-header">
          <h2 className="po-modal-title">
            <Receipt size={20} /> Invoice
          </h2>
          <button className="po-modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="po-modal-body" ref={printRef}>
          <p className="inv-title">K&amp;K PARKING, ARANI</p>
          <div className="inv-divider" />
          <p className="inv-title">INVOICE</p>
          <div className="inv-divider" />

          {[
            ["Bill Number",      s.bill_no ?? "---"],
            ["Vehicle Number",   s.vehicle_no ?? "---"],
            ["Vehicle Name",     s.vehicle_name ?? "---"],
            ["Phone Number",     s.phone ?? s.phone_number ?? "---"],
            ["Park-In Time",     fmtDateTime(inDate)],
            ["Check-Out Time",   fmtDateTime(outDate)],
            ["Parking Duration", dur],
            ["Billing Days",     `${s.no_of_days ?? 1} day(s)`],
            ["Parking Amount",   `₹${s.parking_fee ?? s.daily_amount ?? 0}/-`],
            ["Prepaid Amount",   `₹${s.prepaid ?? 0}/-`],
            ["Final Amount Paid",`₹${s.total_amount ?? s.final_amount ?? 0}/-`],
          ].map(([label, value]) => (
            <div className="inv-row" key={label}>
              <span className="inv-label">{label}</span>
              <span className="inv-value">{value}</span>
            </div>
          ))}

          <div className="inv-divider" />
          <p className="inv-paid">✓ CHECKED OUT</p>
          <div className="inv-divider" />
          <p className="inv-footer">Whatsapp &amp; GPay: 9444718580</p>
          <p className="inv-footer">Thank you! Visit again.</p>
        </div>

        <div className="po-modal-footer">
          <button className="po-action-btn" onClick={handlePrint}>
            <Printer size={18} /> Print Invoice
          </button>
          <button className="po-exit-btn po-exit-btn-sm" onClick={onClose}>
            <CheckCircle2 size={18} /> Done
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   PAYMENT MODAL
═════════════════════════════════════════════════════════════ */
function PaymentModal({ session, onConfirm, onClose, loading }) {
  const remaining = parseFloat(
    String(session?.remaining_amount ?? session?.total_amount ?? "0").replace(/[^0-9.]/g, "")
  ) || 0;
  const [amountPaid, setAmountPaid] = useState(remaining.toFixed(2));

  return (
    <div className="po-modal-overlay" onClick={onClose}>
      <div className="po-modal po-modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="po-modal-header">
          <h2 className="po-modal-title"><CreditCard size={20} /> Complete Payment</h2>
          <button className="po-modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="po-modal-body">
          <div className="po-payment-summary">
            <div className="po-info-row">
              <span className="po-info-label">Vehicle No</span>
              <span className="po-info-value po-info-bold">{session?.vehicle_no ?? "---"}</span>
            </div>
            <div className="po-info-row">
              <span className="po-info-label">Parking Fee</span>
              <span className="po-info-value po-info-muted">
                ₹{session?.parking_fee_gross ?? session?.parking_fee ?? "0"}
              </span>
            </div>
            <div className="po-info-row">
              <span className="po-info-label">Prepaid</span>
              <span className="po-info-value po-info-red">-₹{session?.prepaid ?? "0"}</span>
            </div>
            <div className="po-info-row po-info-row-top-border">
              <span className="po-info-label">Remaining Due</span>
              <span className="po-info-value po-info-green">₹{remaining.toFixed(2)}</span>
            </div>
          </div>

          <label className="po-label" style={{ marginTop: "16px", display: "block" }}>
            Amount Collected (₹)
          </label>
          <input
            type="number"
            className="po-amount-input"
            value={amountPaid}
            min={0}
            step={0.01}
            onChange={(e) => setAmountPaid(e.target.value)}
          />
        </div>

        <div className="po-modal-footer">
          <button className="po-action-btn" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="po-exit-btn po-exit-btn-sm"
            onClick={() => onConfirm(parseFloat(amountPaid) || 0)}
            disabled={loading}
          >
            {loading ? <span className="po-spinner po-spinner-dark" /> : <CheckCircle2 size={18} />}
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   MAIN COMPONENT
═════════════════════════════════════════════════════════════ */
export default function ParkOut() {

  /* ── State ── */
  const [vehicleList,     setVehicleList]     = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [session,         setSession]         = useState(null);
  const [now,             setNow]             = useState(new Date());
  const [loadingList,     setLoadingList]     = useState(false);
  const [loadingBill,     setLoadingBill]     = useState(false);
  const [loadingMsg,      setLoadingMsg]      = useState(false);
  const [loadingSave,     setLoadingSave]     = useState(false);
  const [loadingPayment,  setLoadingPayment]  = useState(false);
  const [error,           setError]           = useState(null);
  const [successMsg,      setSuccessMsg]      = useState(null);
  const [showPayModal,    setShowPayModal]    = useState(false);
  const [showInvoice,     setShowInvoice]     = useState(false);
  const [completedSession,setCompletedSession]= useState(null);

  /* ── Live clock ── */
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  /* ── Toast helpers ── */
  const showError = useCallback((msg) => {
    setError(msg);
    setTimeout(() => setError(null), 4500);
  }, []);

  const showSuccess = useCallback((msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }, []);

  /* ── Fetch vehicle list ── */
  const fetchVehicleList = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await post("/");
      if (data.status === "success") setVehicleList(data.vehicle_list || []);
      else showError(data.message || "Failed to load vehicle list.");
    } catch (err) {
      showError(`Vehicle list error: ${err.message}`);
    } finally {
      setLoadingList(false);
    }
  }, [showError]);

  useEffect(() => { fetchVehicleList(); }, [fetchVehicleList]);

  /* ── Generate bill / search ── */
  const handleGenerateBill = async () => {
    if (!selectedVehicle) { showError("Please select a vehicle first."); return; }
    setLoadingBill(true);
    setSession(null);
    try {
      // backend expects "vehicle_number"
      const data = await post("/generate-bill", { vehicle_number: selectedVehicle });
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

  /* ── Send WhatsApp message ── */
  const handleSendMsg = async () => {
    if (!session) { showError("Generate a bill first."); return; }
    setLoadingMsg(true);
    try {
      // backend reads vehicle_no from Flask session
      const data = await post("/send-msg");
      if (data.status === "success") showSuccess("Message sent successfully.");
      else showError(data.message || "Failed to send message.");
    } catch (err) {
      showError(`Send message error: ${err.message}`);
    } finally {
      setLoadingMsg(false);
    }
  };

  /* ── Save message log ── */
  const handleSaveMsg = async () => {
    if (!session) { showError("Generate a bill first."); return; }
    setLoadingSave(true);
    try {
      const data = await post("/save-msg");
      if (data.status === "success") showSuccess("Message log saved.");
      else showError(data.message || "Failed to save log.");
    } catch (err) {
      showError(`Save message error: ${err.message}`);
    } finally {
      setLoadingSave(false);
    }
  };

  /* ── Complete payment ── */
  const handleCompletePayment = async (amountPaid) => {
    setLoadingPayment(true);
    try {
      const data = await post("/payment", {
        vehicle_no:   session.vehicle_no,
        amount_paid:  amountPaid,
      });
      if (data.status === "success") {
        setShowPayModal(false);
        // Build completed session for invoice
        const inDate  = parseDate(session.entry_time ?? session.park_in);
        const outDate = new Date();
        const { days } = calcDuration(inDate, outDate);
        const completed = {
          ...session,
          exit_time:    outDate.toISOString(),
          final_amount: amountPaid,
          total_amount: amountPaid,
          no_of_days:   days,
          parking_status: "Checked Out",
        };
        setCompletedSession(completed);
        setShowInvoice(true);
        setSession(null);
        setSelectedVehicle("");
        fetchVehicleList();
        showSuccess("Payment completed! Vehicle checked out.");
      } else {
        showError(data.message || "Payment failed.");
      }
    } catch (err) {
      showError(`Payment error: ${err.message}`);
    } finally {
      setLoadingPayment(false);
    }
  };

  /* ── Derived display values ── */
  const inDate  = parseDate(session?.entry_time ?? session?.park_in ?? null);
  const { text: liveDuration, days: billingDays } = calcDuration(inDate, now);

  const rawParkingFee = parseFloat(
    String(session?.parking_amount ?? session?.daily_amount ?? "0").replace(/[^0-9.]/g, "")
  ) || 0;
  const rawPrepaid    = parseFloat(
    String(session?.prepaid ?? "0").replace(/[^0-9.]/g, "")
  ) || 0;
  const dailyRate     = parseFloat(
    String(session?.daily_rate ?? session?.daily_amount ?? "0").replace(/[^0-9.]/g, "")
  ) || 0;

  // Re-derive parking fee live using daily rate × billing days
  const liveParking   = dailyRate > 0 ? dailyRate * billingDays : rawParkingFee;
  const remaining     = Math.max(0, liveParking - rawPrepaid);

  // What backend returns in generate-bill:
  // parking_fee = fee_to_pay (already minus prepaid)
  // daily_amount = daily rate
  // So: gross = daily_amount * no_of_days, remaining = parking_fee
  const backendParkingFee = parseFloat(
    String(session?.parking_fee ?? "0").replace(/[^0-9.]/g, "")
  ) || 0;
  const backendDailyAmt   = parseFloat(
    String(session?.daily_amount ?? "0").replace(/[^0-9.]/g, "")
  ) || 0;
  const backendDays       = session?.no_of_days ?? billingDays;
  const grossFee          = backendDailyAmt * backendDays;
  const displayRemaining  = session ? backendParkingFee : 0;

  /* Session-enriched object for payment modal */
  const sessionForModal = session ? {
    ...session,
    parking_fee_gross: grossFee.toFixed(2),
    remaining_amount:  displayRemaining.toFixed(2),
    total_amount:      displayRemaining.toFixed(2),
  } : null;

  const statusColor = session?.parking_status === "Checked Out"
    ? "var(--c-secondary)"
    : session
      ? "#f59e0b"
      : "var(--c-on-surface-var)";

  /* ═══════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════ */
  return (
    <div className="po-root">

      {/* ── Sidebar ───────────────────────────────────────── */}
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
        <header className="po-header">
          <div className="po-header-title">
            <span className="pi-icon" style={{ color: "#6ffbbe", fontSize: "1.4rem" }}>logout</span>
            <h1 className="po-header-h1">Park-Out / Exit</h1>
          </div>
          <p className="po-header-sub">
            Finalize parked vehicles, calculate parking charges and complete exit process.
          </p>
        </header>

        <div className="po-canvas">
          <div className="po-grid">

            {/* ── Left Column ─────────────────────────────── */}
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
                        {vehicleList.map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                        ))}
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

            {/* ── Right Column ─────────────────────────────── */}
            <div className="po-col-right">

              {/* Parking Session */}
              <div className="po-card">
                <div className="po-section-head">
                  <Timer size={20} color="#bec6e0" />
                  <h3>Parking Session</h3>
                </div>
                <div className="po-info-list">
                  {/* Vehicle No */}
                  <div className="po-info-row">
                    <span className="po-info-label">
                      <Car size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />
                      Vehicle No
                    </span>
                    <span className="po-info-value po-info-bold">
                      {session?.vehicle_no ?? "---"}
                    </span>
                  </div>

                  {/* Vehicle Name */}
                  <div className="po-info-row">
                    <span className="po-info-label">Vehicle Name</span>
                    <span className="po-info-value po-info-muted">
                      {session?.vehicle_name ?? "---"}
                    </span>
                  </div>

                  {/* Phone */}
                  <div className="po-info-row">
                    <span className="po-info-label">
                      <Phone size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />
                      Phone
                    </span>
                    <span className="po-info-value po-info-muted">
                      {session?.phone ?? session?.phone_number ?? "---"}
                    </span>
                  </div>

                  {/* Bill No */}
                  <div className="po-info-row">
                    <span className="po-info-label">
                      <Hash size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />
                      Bill No
                    </span>
                    <span className="po-info-value po-info-muted">
                      {session?.bill_no ?? "---"}
                    </span>
                  </div>

                  {/* Park-In Time */}
                  <div className="po-info-row">
                    <span className="po-info-label">
                      <Clock size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />
                      Park-In
                    </span>
                    <span className="po-info-value po-info-muted">
                      {fmtDateTime(inDate)}
                    </span>
                  </div>

                  {/* Current Time (live) */}
                  <div className="po-info-row">
                    <span className="po-info-label">
                      <CalendarClock size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />
                      Current Time
                    </span>
                    <span className="po-info-value po-info-muted">
                      {fmtDateTime(now)}
                    </span>
                  </div>

                  {/* Duration (live) */}
                  <div className="po-info-row po-info-row-top-border">
                    <span className="po-info-label">Duration</span>
                    <span className="po-info-value po-info-green">
                      {session ? liveDuration : "0h 0m"}
                    </span>
                  </div>

                  {/* Parking Status */}
                  <div className="po-info-row">
                    <span className="po-info-label">
                      <BadgeCheck size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />
                      Status
                    </span>
                    <span className="po-info-value" style={{ color: statusColor, fontWeight: 600 }}>
                      {session?.parking_status ?? (session ? "Parked" : "---")}
                    </span>
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
                  <div className="po-info-row">
                    <span className="po-info-label">Billing Days</span>
                    <span className="po-info-value po-info-muted">
                      {session ? `${billingDays} day(s)` : "---"}
                    </span>
                  </div>
                  <div className="po-info-row">
                    <span className="po-info-label">Daily Rate</span>
                    <span className="po-info-value po-info-muted">
                      {session
                        ? `₹${session.daily_amount ?? "0"}`
                        : "---"}
                    </span>
                  </div>
                  <div className="po-info-row">
                    <span className="po-info-label">
                      <IndianRupee size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />
                      Parking Amount
                    </span>
                    <span className="po-info-value po-info-muted">
                      {session ? `₹${grossFee.toFixed(2)}` : "---"}
                    </span>
                  </div>
                  <div className="po-info-row">
                    <span className="po-info-label">Prepaid Amount</span>
                    <span className="po-info-value po-info-red">
                      {session ? `-₹${session.prepaid ?? "0"}` : "---"}
                    </span>
                  </div>
                  <div className="po-info-row po-info-row-top-border">
                    <span className="po-info-label">Remaining to Pay</span>
                    <span className="po-info-value po-info-muted">
                      {session ? `₹${displayRemaining.toFixed(2)}` : "---"}
                    </span>
                  </div>
                </div>

                <div className="po-total-box">
                  <p className="po-total-label">Final Amount To Collect</p>
                  <h2 className="po-total-amount">
                    {session ? `₹${displayRemaining.toFixed(2)}` : "₹0.00"}
                  </h2>
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
                  onClick={() => session && setShowPayModal(true)}
                  disabled={loadingPayment || !session}
                  className="po-exit-btn"
                >
                  {loadingPayment
                    ? <span className="po-spinner po-spinner-dark" />
                    : <CheckCircle2 size={22} />}
                  Complete Payment &amp; Check-Out
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ── Payment Modal ── */}
      {showPayModal && sessionForModal && (
        <PaymentModal
          session={sessionForModal}
          onConfirm={handleCompletePayment}
          onClose={() => setShowPayModal(false)}
          loading={loadingPayment}
        />
      )}

      {/* ── Invoice Modal ── */}
      {showInvoice && completedSession && (
        <InvoiceModal
          session={completedSession}
          onClose={() => { setShowInvoice(false); setCompletedSession(null); }}
        />
      )}

      {/* ── Toasts ── */}
      {error      && <div className="po-toast po-toast-error">{error}</div>}
      {successMsg && <div className="po-toast po-toast-success">{successMsg}</div>}
    </div>
  );
}