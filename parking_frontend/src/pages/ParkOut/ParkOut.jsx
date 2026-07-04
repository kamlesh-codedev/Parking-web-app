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
import { Html5Qrcode } from "html5-qrcode";
import "./ParkOut.css";
import logo from "../../assets/kk-logo.png";

/* ─────────────────────────────────────────────────────────────
   API CONFIGURATION
───────────────────────────────────────────────────────────── */
const BASE_URL = "/api/park-out";

const post = async (path, body = {}) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
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
const parseDate = (str) => {
  if (!str) return null;
  if (str.includes("T") || str.match(/^\d{4}-\d{2}-\d{2}/)) return new Date(str);
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
  const durationDays = Math.floor(diffMs / 86400000) + 1;
  let text = "";
  if (days > 0) text += `${days}d `;
  text += `${hrs}h ${mins}m`;
  return { text, days: durationDays };
};

/* ═════════════════════════════════════════════════════════════
   INVOICE MODAL
═════════════════════════════════════════════════════════════ */
function InvoiceModal({ session, onClose }) {
  const printRef = useRef();
  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open("", "_blank", "width=480,height=700");
    win.document.write(`<html><head><title>Invoice</title></head><body>${content}</body></html>`);
    win.document.close(); win.print();
  };
  const inDate  = parseDate(session.entry_time ?? session.park_in);
  const outDate = parseDate(session.exit_time ?? new Date().toISOString());
  const { text: dur } = calcDuration(inDate, outDate);
  return (
    <div className="po-modal-overlay" onClick={onClose}>
      <div className="po-modal" onClick={(e) => e.stopPropagation()}>
        <div className="po-modal-header">
          <h2 className="po-modal-title"><Receipt size={18} /> Invoice</h2>
          <button className="po-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="po-modal-body" ref={printRef}>
          <p className="inv-title">K&amp;K PARKING, ARANI</p>
          <div className="inv-divider" />
          <div className="inv-row"><span className="inv-label">Bill No</span><span className="inv-value">{session.bill_no}</span></div>
          <div className="inv-row"><span className="inv-label">Vehicle</span><span className="inv-value">{session.vehicle_no}</span></div>
          <div className="inv-row"><span className="inv-label">Duration</span><span className="inv-value">{dur}</span></div>
          <div className="inv-row"><span className="inv-label">Amount</span><span className="inv-value">₹{session.total_amount}/-</span></div>
          <p className="inv-paid">✓ CHECKED OUT</p>
        </div>
        <div className="po-modal-footer">
          <button className="po-action-btn" onClick={handlePrint}><Printer size={16} /> Print</button>
          <button className="po-exit-btn po-exit-btn-sm" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   MAIN COMPONENT
═════════════════════════════════════════════════════════════ */
export default function ParkOut() {
  const [vehicleList,      setVehicleList]      = useState([]);
  const [selectedVehicle,  setSelectedVehicle]  = useState("");
  const [session,          setSession]          = useState(null);
  const [isSearched,       setIsSearched]       = useState(false);
  const [now,              setNow]              = useState(new Date());

  const [loadingList,      setLoadingList]      = useState(false);
  const [loadingBill,      setLoadingBill]      = useState(false);
  const [loadingMsg,       setLoadingMsg]       = useState(false);
  const [loadingSave,      setLoadingSave]      = useState(false);
  const [error,            setError]            = useState(null);
  const [successMsg,       setSuccessMsg]       = useState(null);
  const [showInvoice,      setShowInvoice]      = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount,    setPaymentAmount]    = useState("0");
  const [messageSent,      setMessageSent]      = useState(false);
  const [messageSaved,     setMessageSaved]     = useState(false);

  const [isScannerActive,  setIsScannerActive]  = useState(false);
  const [scanResult,       setScanResult]       = useState(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const showError   = useCallback((msg) => { setError(msg);      setTimeout(() => setError(null),      4500); }, []);
  const showSuccess = useCallback((msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 3000); }, []);

  const fetchVehicleList = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await post("/");
      if (data.status === "success") setVehicleList(data.vehicle_list || []);
    } catch (err) { showError(`List error: ${err.message}`); }
    finally { setLoadingList(false); }
  }, [showError]);

  useEffect(() => { fetchVehicleList(); }, [fetchVehicleList]);

  const handleSearchVehicle = async (manualVehicleNo) => {
    const target = manualVehicleNo || selectedVehicle;
    if (!target) { showError("Please select a vehicle."); return; }
    if (manualVehicleNo) setSelectedVehicle(manualVehicleNo);

    setLoadingBill(true);
    try {
      const data = await post("/generate-bill", { vehicle_number: target });
      if (data.status === "success") {
        setSession(data);
        setIsSearched(true);
        setPaymentCompleted(false);
        setMessageSent(false);
        setMessageSaved(false);
        showSuccess("Bill generated successfully.");
      } else {
        setSession(null);
        setIsSearched(false);
        showError(data.message || "Failed to generate bill.");
      }
    } catch (err) {
      setSession(null);
      setIsSearched(false);
      showError(`Generate bill error: ${err.message}`);
    } finally {
      setLoadingBill(false);
    }
  };

  const handleCompletePayment = () => {
    if (!session?.vehicle_no) { showError("Please generate a bill first."); return; }
    setPaymentAmount("0");
    setShowPaymentModal(true);
  };

  const submitPayment = async () => {
    if (!session?.vehicle_no) { showError("Please generate a bill first."); return; }
    const amountPaid = Number(paymentAmount);
    if (!Number.isFinite(amountPaid) || amountPaid < 0) { showError("Please enter a valid amount paid."); return; }

    setLoadingBill(true);
    try {
      const data = await post("/payment", { vehicle_no: session.vehicle_no, amount_paid: amountPaid });
      if (data.status === "success") {
        setPaymentCompleted(true);
        setShowPaymentModal(false);
        setMessageSent(false);
        setMessageSaved(false);
        showSuccess("Payment completed successfully.");
      } else {
        showError(data.message || "Failed to complete payment.");
      }
    } catch (err) { showError(`Payment error: ${err.message}`); }
    finally { setLoadingBill(false); }
  };

  const startScanner = async () => {
    setIsScannerActive(true);
    setScanResult(null);
    const html5QrCode = new Html5Qrcode("reader");
    html5QrCodeRef.current = html5QrCode;
    try {
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        showError("No camera found on this device.");
        setIsScannerActive(false);
        return;
      }
      const backCam  = cameras.find(c => /back|rear|environment/i.test(c.label));
      const cameraId = backCam ? backCam.id : cameras[0].id;
      await html5QrCode.start(cameraId, { fps: 10, qrbox: 220 }, (decodedText) => {
        setScanResult(decodedText);
        stopScanner();
        handleSearchVehicle(decodedText);
      }, () => {});
    } catch (err) {
      showError("Camera error: " + err);
      setIsScannerActive(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try { await html5QrCodeRef.current.stop(); }  catch (err) { console.warn("Stop warning:", err); }
      try { await html5QrCodeRef.current.clear(); } catch (err) { console.warn("Clear warning:", err); }
    }
    setIsScannerActive(false);
    html5QrCodeRef.current = null;
  };

  const handleSendMsg = async () => {
    setLoadingMsg(true);
    try {
      const data = await post("/send-msg");
      if (data.status === "success") { setMessageSent(true); showSuccess("Message sent successfully."); }
      else showError(data.message || "Failed to send message.");
    } catch (err) { showError(`Send error: ${err.message}`); }
    finally { setLoadingMsg(false); }
  };

  const handleSaveMsg = async () => {
    setLoadingSave(true);
    try {
      const data = await post("/save-msg");
      if (data.status === "success") { setMessageSaved(true); showSuccess("Log saved."); }
      else showError(data.message || "Failed to save.");
    } catch (err) { showError(`Save error: ${err.message}`); }
    finally { setLoadingSave(false); }
  };

  /* ── Derived values ── */
  const inDate = parseDate(session?.entry_time ?? session?.park_in ?? null);
  const { text: liveDuration, days: billingDays } = calcDuration(inDate, now);
  const backendParkingFee = parseFloat(String(session?.parking_fee  ?? "0").replace(/[^0-9.]/g, "")) || 0;
  const backendDailyAmt   = parseFloat(String(session?.daily_amount ?? "0").replace(/[^0-9.]/g, "")) || 0;
  const backendDays       = session?.no_of_days ?? billingDays;
  const grossFee          = backendDailyAmt * backendDays;
  const statusColor       = session ? "#f59e0b" : "var(--c-on-surface-var)";

  const canSearch  = !isSearched && !loadingBill && !!selectedVehicle;
  const canGenBill = !!session && !paymentCompleted && !loadingBill;
  const canMsg     = !!session && paymentCompleted && !messageSent  && !loadingMsg;
  const canSave    = !!session && paymentCompleted && !messageSaved && !loadingSave;

  /* ═══════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════ */
  return (
    <div className="po-root">

      {/* ── Sidebar ── */}
      <aside className="pi-sidebar">
        <div className="pi-sidebar-logo">
          <img src={logo} alt="KK Parking" className="pi-logo" />
        </div>
        <nav className="pi-nav">
          <Link to="/dashboard" className="pi-nav-item"><span className="pi-icon">dashboard</span><span>Dashboard</span></Link>
          <Link to="/parkin"    className="pi-nav-item"><span className="pi-icon">login</span><span>Park-In</span></Link>
          <Link to="/parkout"   className="pi-nav-item pi-nav-active"><span className="pi-icon">logout</span><span>Park-Out</span></Link>
          <Link to="#"          className="pi-nav-item"><span className="pi-icon">analytics</span><span>Reports</span></Link>
          <Link to="/invoice"   className="pi-nav-item"><span className="pi-icon">receipt_long</span><span>Invoices</span></Link>
        </nav>
        <div className="pi-sidebar-footer">
          <button className="pi-emergency-btn">
            <span className="pi-icon">emergency</span>Emergency Support
          </button>
          <div className="pi-footer-links">
            <Link to="/help" className="pi-footer-link"><span className="pi-icon">help</span><span>Help</span></Link>
            <Link to="/"     className="pi-footer-link"><span className="pi-icon">power_settings_new</span><span>Logout</span></Link>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="po-main">

        {/* Header */}
        <header className="po-header">
          <div className="po-header-title">
            <span className="pi-icon" style={{ color: "#4edea3", fontSize: "1.2rem" }}>logout</span>
            <h1 className="po-header-h1">Park-Out / Exit</h1>
          </div>
          <p className="po-header-sub">
            Finalize parked vehicles, calculate charges, and complete the exit process.
          </p>
        </header>

        {/* Canvas */}
        <div className="po-canvas">
          <div className="po-grid">

            {/* ── Left column ── */}
            <div className="po-col-left">

              {/* Bill Summary card */}
              <div className="po-card">
                <div className="po-section-head">
                  <CreditCard size={16} color="var(--c-on-surface-var)" />
                  <h3>Bill Summary</h3>
                </div>

                {/* Two-column billing details */}
                <div className="po-bill-details-grid">
                  <div className="po-bill-detail-item">
                    <span className="po-bill-detail-label">Billing Days</span>
                    <span className="po-bill-detail-value is-muted">
                      {session ? `${backendDays} day(s)` : "---"}
                    </span>
                  </div>
                  <div className="po-bill-detail-item">
                    <span className="po-bill-detail-label">Daily Rate</span>
                    <span className="po-bill-detail-value is-muted">
                      {session ? `₹${session.daily_amount ?? "0"}` : "---"}
                    </span>
                  </div>
                  <div className="po-bill-detail-item">
                    <span className="po-bill-detail-label">
                      <IndianRupee size={10} style={{ display: "inline" }} /> Parking Amount
                    </span>
                    <span className="po-bill-detail-value is-muted">
                      {session ? `₹${grossFee.toFixed(2)}` : "---"}
                    </span>
                  </div>
                  <div className="po-bill-detail-item">
                    <span className="po-bill-detail-label">Prepaid Amount</span>
                    <span className="po-bill-detail-value is-red">
                      {session ? `-₹${session.prepaid ?? "0"}` : "---"}
                    </span>
                  </div>
                </div>

                {/* Final amount highlighted */}
                <div className="po-total-box">
                  <p className="po-total-label">Final Amount<br />To Collect</p>
                  <h2 className="po-total-amount">
                    {session ? `₹${backendParkingFee.toFixed(2)}` : "₹0.00"}
                  </h2>
                </div>

                {/* Equal-width action buttons */}
                <div className="po-inline-actions">
                  <button
                    onClick={handleCompletePayment}
                    disabled={!canGenBill}
                    className="po-inline-action-btn po-inline-action-btn-primary"
                  >
                    {loadingBill ? <span className="po-spinner" /> : <Receipt size={14} />}
                    Pay
                  </button>
                  <button
                    onClick={handleSendMsg}
                    disabled={!canMsg}
                    className="po-inline-action-btn"
                  >
                    {loadingMsg ? <span className="po-spinner" /> : <MessageSquare size={14} />}
                    Message
                  </button>
                  <button
                    onClick={handleSaveMsg}
                    disabled={!canSave}
                    className="po-inline-action-btn"
                  >
                    {loadingSave ? <span className="po-spinner" /> : <Save size={14} />}
                    Save
                  </button>
                </div>
              </div>

              {/* Parking Session card */}
              <div className="po-card">
                <div className="po-section-head">
                  <Timer size={16} color="var(--c-on-surface-var)" />
                  <h3>Parking Session</h3>
                </div>

                <div className="po-session-grid">
                  <div className="po-session-item">
                    <span className="po-session-label"><Car size={10} /> Vehicle No</span>
                    <span className="po-session-value" style={{ color: "var(--c-on-surface)", fontWeight: 700 }}>
                      {session?.vehicle_no ?? (isSearched ? selectedVehicle : "---")}
                    </span>
                  </div>
                  <div className="po-session-item">
                    <span className="po-session-label">Vehicle Name</span>
                    <span className="po-session-value" style={{ color: "var(--c-on-surface-var)", fontWeight: 500 }}>
                      {session?.vehicle_name ?? "---"}
                    </span>
                  </div>
                  <div className="po-session-item">
                    <span className="po-session-label"><Phone size={10} /> Phone</span>
                    <span className="po-session-value" style={{ color: "var(--c-on-surface-var)", fontWeight: 500 }}>
                      {session?.phone ?? session?.phone_number ?? "---"}
                    </span>
                  </div>
                  <div className="po-session-item">
                    <span className="po-session-label"><Hash size={10} /> Bill No</span>
                    <span className="po-session-value" style={{ color: "var(--c-on-surface-var)", fontWeight: 500 }}>
                      {session?.bill_no ?? "---"}
                    </span>
                  </div>
                  <div className="po-session-item">
                    <span className="po-session-label"><Clock size={10} /> Park-In</span>
                    <span className="po-session-value" style={{ color: "var(--c-on-surface-var)", fontWeight: 500, fontSize: "12.5px" }}>
                      {fmtDateTime(inDate)}
                    </span>
                  </div>
                  <div className="po-session-item">
                    <span className="po-session-label"><CalendarClock size={10} /> Current Time</span>
                    <span className="po-session-value" style={{ color: "var(--c-on-surface-var)", fontWeight: 500, fontSize: "12.5px" }}>
                      {fmtDateTime(now)}
                    </span>
                  </div>
                  <div className="po-session-item">
                    <span className="po-session-label">Duration</span>
                    <span className="po-session-value is-green">
                      {session ? liveDuration : "0h 0m"}
                    </span>
                  </div>
                  <div className="po-session-item">
                    <span className="po-session-label"><BadgeCheck size={10} /> Status</span>
                    <span className="po-session-value" style={{ color: statusColor }}>
                      {session?.parking_status ?? (session ? "Parked" : (isSearched ? "Ready" : "---"))}
                    </span>
                  </div>
                </div>
              </div>

            </div>{/* /col-left */}

            {/* ── Right column — unified card ── */}
            <div className="po-col-right">
              <div className="po-card">

                {/* Card title */}
                <div className="po-card-title">
                  <Search size={16} color="var(--c-on-surface-var)" />
                  <h3>Vehicle Lookup</h3>
                </div>

                {/* Dropdown + Search */}
                <div className="po-lookup-row">
                  <div>
                    <label className="po-label" htmlFor="vehicle-select">Vehicle Number</label>
                    <div className="po-select-wrapper">
                      <select
                        id="vehicle-select"
                        className="po-select"
                        value={selectedVehicle}
                        onChange={(e) => {
                          setSelectedVehicle(e.target.value);
                          setIsSearched(false);
                          setSession(null);
                        }}
                        disabled={loadingList || isSearched}
                      >
                        <option value="">{loadingList ? "Loading..." : "Select Vehicle"}</option>
                        {vehicleList.map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="po-select-icon" />
                    </div>
                  </div>

                  <button
                    onClick={() => handleSearchVehicle()}
                    disabled={!canSearch}
                    className="po-search-btn"
                  >
                    {loadingBill ? <span className="po-spinner po-spinner-dark" /> : <Search size={14} />}
                    Search Vehicle
                  </button>
                </div>

                {/* OR divider */}
                <div className="po-divider">
                  <div className="po-divider-line" />
                  <span className="po-divider-text">OR SCAN QR</span>
                  <div className="po-divider-line" />
                </div>

                {/* Scanner section */}
                <div className="po-scanner-section">
                  <div className="po-scanner-header">
                    <div className="po-scanner-title">
                      <QrCode size={15} />
                      <span>QR Scanner</span>
                    </div>
                    <div className="po-live-chip">
                      <span className="po-live-dot" />
                      <span>LIVE</span>
                    </div>
                  </div>

                  {/* Viewport — fixed height */}
                  <div className="po-viewport">
                    <div
                      id="reader"
                      style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
                    />
                    {isScannerActive && (
                      <>
                        <div className="po-scanner-line" />
                        <div className="po-bracket po-bracket-tl" />
                        <div className="po-bracket po-bracket-tr" />
                        <div className="po-bracket po-bracket-bl" />
                        <div className="po-bracket po-bracket-br" />
                      </>
                    )}
                    {!isScannerActive && (
                      <div className="po-viewport-center">
                        <VideoOff size={32} color="rgba(78,222,163,0.22)" />
                        <p className="po-viewport-text">Camera inactive</p>
                        <button
                          className="po-init-cam-btn"
                          onClick={startScanner}
                          disabled={isSearched}
                        >
                          Initialize Camera
                        </button>
                      </div>
                    )}
                  </div>

                  {isScannerActive && (
                    <button
                      className="po-init-cam-btn"
                      style={{ width: "100%" }}
                      onClick={stopScanner}
                    >
                      Stop Camera
                    </button>
                  )}

                  <div className="po-status-chips">
                    <div className="po-chip">
                      <span className="po-chip-label">ID:</span>
                      <span className="po-chip-value">
                        {scanResult || (selectedVehicle && isSearched ? selectedVehicle : "---")}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>{/* /col-right */}

          </div>{/* /po-grid */}
        </div>{/* /po-canvas */}
      </main>

      {/* ── Invoice modal ── */}
      {showInvoice && session && (
        <InvoiceModal session={session} onClose={() => setShowInvoice(false)} />
      )}

      {/* ── Payment modal ── */}
      {showPaymentModal && session && (
        <div className="po-modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="po-modal po-modal-sm" onClick={(e) => e.stopPropagation()}>

            <div className="po-modal-header">
              <h2 className="po-modal-title"><CreditCard size={18} /> Payment</h2>
              <button className="po-modal-close" onClick={() => setShowPaymentModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="po-modal-body">
              <div className="po-payment-summary">
                <div className="po-info-row">
                  <span className="po-info-label">Final Amount To Collect</span>
                  <span className="po-info-value po-info-green">₹{backendParkingFee.toFixed(2)}</span>
                </div>
                <div className="po-info-row">
                  <span className="po-info-label">Vehicle No</span>
                  <span className="po-info-value po-info-bold">{session.vehicle_no}</span>
                </div>
              </div>

              <div>
                <label className="po-label" htmlFor="amount-paid">Amount Paid</label>
                <input
                  id="amount-paid"
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="po-amount-input"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="po-modal-footer">
              <button className="po-action-btn" onClick={() => setShowPaymentModal(false)}>Cancel</button>
              <button
                className="po-exit-btn po-exit-btn-sm"
                onClick={submitPayment}
                disabled={loadingBill}
              >
                {loadingBill ? <span className="po-spinner po-spinner-dark" /> : <CheckCircle2 size={16} />}
                Confirm Payment
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Toasts ── */}
      {error      && <div className="po-toast po-toast-error">{error}</div>}
      {successMsg && <div className="po-toast po-toast-success">{successMsg}</div>}

    </div>
  );
}