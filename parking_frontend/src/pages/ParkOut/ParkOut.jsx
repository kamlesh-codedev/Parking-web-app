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
const BASE_URL = "http://localhost:5000/park-out";

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

const MOCK_RECENT_EXITS = [
  { billNo: "#KK-99821", vehicleNo: "KA-01-HG-8822", name: "Mercedes C-Class", exitTime: "Today, 14:22", amount: "₹145.00", status: "Paid" },
  { billNo: "#KK-99820", vehicleNo: "KA-04-PJ-1109", name: "Toyota Fortuner",  exitTime: "Today, 13:45", amount: "₹80.00",  status: "Paid" },
];

/* ═════════════════════════════════════════════════════════════
   MODAL COMPONENTS (Logic kept for potential background use)
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
        <div className="po-modal-header"><h2 className="po-modal-title"><Receipt size={20} /> Invoice</h2><button className="po-modal-close" onClick={onClose}><X size={20} /></button></div>
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
          <button className="po-action-btn" onClick={handlePrint}><Printer size={18} /> Print</button>
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
  const [vehicleList,     setVehicleList]     = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [session,         setSession]         = useState(null);
  const [isSearched,      setIsSearched]      = useState(false);
  const [now,             setNow]             = useState(new Date());

  const [loadingList,     setLoadingList]     = useState(false);
  const [loadingBill,     setLoadingBill]     = useState(false);
  const [loadingMsg,      setLoadingMsg]      = useState(false);
  const [loadingSave,     setLoadingSave]     = useState(false);
  const [error,           setError]           = useState(null);
  const [successMsg,      setSuccessMsg]      = useState(null);
  const [showInvoice,     setShowInvoice]     = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount,   setPaymentAmount]   = useState("0");
  const [messageSent,     setMessageSent]     = useState(false);
  const [messageSaved,    setMessageSaved]    = useState(false);

  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scanResult,      setScanResult]      = useState(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const showError = useCallback((msg) => { setError(msg); setTimeout(() => setError(null), 4500); }, []);
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
    if (!session?.vehicle_no) {
      showError("Please generate a bill first.");
      return;
    }

    setPaymentAmount("0");
    setShowPaymentModal(true);
  };

  const submitPayment = async () => {
    if (!session?.vehicle_no) {
      showError("Please generate a bill first.");
      return;
    }

    const amountPaid = Number(paymentAmount);
    if (!Number.isFinite(amountPaid) || amountPaid < 0) {
      showError("Please enter a valid amount paid.");
      return;
    }

    setLoadingBill(true);
    try {
      const data = await post("/payment", {
        vehicle_no: session.vehicle_no,
        amount_paid: amountPaid,
      });
      if (data.status === "success") {
        setPaymentCompleted(true);
        setShowPaymentModal(false);
        setMessageSent(false);
        setMessageSaved(false);
        showSuccess("Payment completed successfully.");
      } else {
        showError(data.message || "Failed to complete payment.");
      }
    } catch (err) {
      showError(`Payment error: ${err.message}`);
    } finally {
      setLoadingBill(false);
    }
  };

  const startScanner = async () => {
    setIsScannerActive(true);
    setScanResult(null);
    const html5QrCode = new Html5Qrcode("reader");
    html5QrCodeRef.current = html5QrCode;
    try {
      await html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (decodedText) => {
        setScanResult(decodedText);
        stopScanner();
        handleSearchVehicle(decodedText);
      }, () => {});
    } catch (err) { showError("Camera error: " + err); setIsScannerActive(false); }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      await html5QrCodeRef.current.stop();
      setIsScannerActive(false);
      html5QrCodeRef.current = null;
    }
  };

  const handleSendMsg = async () => {
    setLoadingMsg(true);
    try {
      const data = await post("/send-msg");
      if (data.status === "success") {
        setMessageSent(true);
        showSuccess("Message sent successfully.");
      } else {
        showError(data.message || "Failed to send message.");
      }
    } catch (err) { showError(`Send error: ${err.message}`); }
    finally { setLoadingMsg(false); }
  };

  const handleSaveMsg = async () => {
    setLoadingSave(true);
    try {
      const data = await post("/save-msg");
      if (data.status === "success") {
        setMessageSaved(true);
        showSuccess("Log saved.");
      } else {
        showError(data.message || "Failed to save.");
      }
    } catch (err) { showError(`Save error: ${err.message}`); }
    finally { setLoadingSave(false); }
  };

  const inDate  = parseDate(session?.entry_time ?? session?.park_in ?? null);
  const { text: liveDuration, days: billingDays } = calcDuration(inDate, now);
  const backendParkingFee = parseFloat(String(session?.parking_fee ?? "0").replace(/[^0-9.]/g, "")) || 0;
  const backendDailyAmt   = parseFloat(String(session?.daily_amount ?? "0").replace(/[^0-9.]/g, "")) || 0;
  const backendDays       = session?.no_of_days ?? billingDays;
  const grossFee          = backendDailyAmt * backendDays;
  const statusColor       = session ? "#f59e0b" : "var(--c-on-surface-var)";

  const canSearch   = !isSearched && !loadingBill && !!selectedVehicle;
  const canGenBill  = !!session && !paymentCompleted && !loadingBill;
  const canMsg      = !!session && paymentCompleted && !messageSent && !loadingMsg;
  const canSave     = !!session && paymentCompleted && !messageSaved && !loadingSave;

  return (
    <div className="po-root">
      <aside className="pi-sidebar">
        <div className="pi-sidebar-logo"><img src={logo} alt="KK Parking" className="pi-logo" /></div>
        <nav className="pi-nav">
          <Link to="/dashboard" className="pi-nav-item"><span className="pi-icon">dashboard</span><span>Dashboard</span></Link>
          <Link to="/parkin" className="pi-nav-item"><span className="pi-icon">login</span><span>Park-In</span></Link>
          <Link to="/parkout" className="pi-nav-item pi-nav-active"><span className="pi-icon">logout</span><span>Park-Out</span></Link>
          <Link to="#" className="pi-nav-item"><span className="pi-icon">analytics</span><span>Reports</span></Link>
          <Link to="/invoice" className="pi-nav-item"><span className="pi-icon">receipt_long</span><span>Invoices</span></Link>
        </nav>
        <div className="pi-sidebar-footer">
          <button className="pi-emergency-btn"><span className="pi-icon">emergency</span>Emergency Support</button>
          <div className="pi-footer-links">
            <Link to="/help" className="pi-footer-link"><span className="pi-icon">help</span><span>Help</span></Link>
            <Link to="/" className="pi-footer-link"><span className="pi-icon">power_settings_new</span><span>Logout</span></Link>
          </div>
        </div>
      </aside>

      <main className="po-main">
        <header className="po-header">
          <div className="po-header-title">
            <span className="pi-icon" style={{ color: "#6ffbbe", fontSize: "1.4rem" }}>logout</span>
            <h1 className="po-header-h1">Park-Out / Exit</h1>
          </div>
          <p className="po-header-sub">Finalize parked vehicles, calculate parking charges and complete exit process.</p>
        </header>

        <div className="po-canvas">
          <div className="po-grid">
            <div className="po-col-left">
              <div className="po-card">
                <div className="po-section-head"><CreditCard size={20} color="#bec6e0" /><h3>Bill Summary</h3></div>
                <div className="po-info-list" style={{ marginBottom: "16px" }}>
                  <div className="po-info-row"><span className="po-info-label">Billing Days</span><span className="po-info-value po-info-muted">{session ? `${backendDays} day(s)` : "---"}</span></div>
                  <div className="po-info-row"><span className="po-info-label">Daily Rate</span><span className="po-info-value po-info-muted">{session ? `₹${session.daily_amount ?? "0"}` : "---"}</span></div>
                  <div className="po-info-row"><span className="po-info-label"><IndianRupee size={13} style={{ marginRight: 4 }} />Parking Amount</span><span className="po-info-value po-info-muted">{session ? `₹${grossFee.toFixed(2)}` : "---"}</span></div>
                  <div className="po-info-row"><span className="po-info-label">Prepaid Amount</span><span className="pi-info-red">{session ? `-₹${session.prepaid ?? "0"}` : "---"}</span></div>
                  <div className="po-info-row po-info-row-top-border"><span className="po-info-label">Remaining to Pay</span><span className="po-info-value po-info-muted">{session ? `₹${backendParkingFee.toFixed(2)}` : "---"}</span></div>
                </div>
                <div className="po-total-box"><p className="po-total-label">Final Amount To Collect</p><h2 className="po-total-amount">{session ? `₹${backendParkingFee.toFixed(2)}` : "₹0.00"}</h2></div>
                <div className="po-inline-actions">
                  <button onClick={handleCompletePayment} disabled={!canGenBill} className="po-inline-action-btn po-inline-action-btn-primary">
                    {loadingBill ? <span className="po-spinner" /> : <Receipt size={16} />} Pay
                  </button>
                  <button onClick={handleSendMsg} disabled={!canMsg} className="po-inline-action-btn">
                    {loadingMsg ? <span className="po-spinner" /> : <MessageSquare size={16} />} Msg
                  </button>
                  <button onClick={handleSaveMsg} disabled={!canSave} className="po-inline-action-btn">
                    {loadingSave ? <span className="po-spinner" /> : <Save size={16} />} Save
                  </button>
                </div>
              </div>

              <div className="po-card">
                <div className="po-section-head"><Timer size={20} color="#bec6e0" /><h3>Parking Session</h3></div>
                <div className="po-info-list">
                  <div className="po-info-row"><span className="po-info-label"><Car size={13} style={{ marginRight: 4 }} />Vehicle No</span><span className="po-info-value po-info-bold">{session?.vehicle_no ?? (isSearched ? selectedVehicle : "---")}</span></div>
                  <div className="po-info-row"><span className="po-info-label">Vehicle Name</span><span className="po-info-value po-info-muted">{session?.vehicle_name ?? "---"}</span></div>
                  <div className="po-info-row"><span className="po-info-label"><Phone size={13} style={{ marginRight: 4 }} />Phone</span><span className="po-info-value po-info-muted">{session?.phone ?? session?.phone_number ?? "---"}</span></div>
                  <div className="po-info-row"><span className="po-info-label"><Hash size={13} style={{ marginRight: 4 }} />Bill No</span><span className="po-info-value po-info-muted">{session?.bill_no ?? "---"}</span></div>
                  <div className="po-info-row"><span className="po-info-label"><Clock size={13} style={{ marginRight: 4 }} />Park-In</span><span className="po-info-value po-info-muted">{fmtDateTime(inDate)}</span></div>
                  <div className="po-info-row"><span className="po-info-label"><CalendarClock size={13} style={{ marginRight: 4 }} />Current Time</span><span className="po-info-value po-info-muted">{fmtDateTime(now)}</span></div>
                  <div className="po-info-row po-info-row-top-border"><span className="po-info-label">Duration</span><span className="po-info-value po-info-green">{session ? liveDuration : "0h 0m"}</span></div>
                  <div className="po-info-row"><span className="po-info-label"><BadgeCheck size={13} style={{ marginRight: 4 }} />Status</span><span className="po-info-value" style={{ color: statusColor, fontWeight: 600 }}>{session?.parking_status ?? (session ? "Parked" : (isSearched ? "Ready" : "---"))}</span></div>
                </div>
              </div>
            </div>

            <div className="po-col-right">
              <div className="po-card">
                <div className="po-card-title" style={{ color: "#bec6e0" }}><Search size={20} /><h3>Vehicle Lookup</h3></div>
                <div className="po-lookup-row">
                  <div className="po-lookup-select-wrap">
                    <label className="po-label">Vehicle Number</label>
                    <div style={{ position: "relative" }}>
                      <select className="po-select" value={selectedVehicle} onChange={(e) => { setSelectedVehicle(e.target.value); setIsSearched(false); setSession(null); }} disabled={loadingList || isSearched}>
                        <option value="">{loadingList ? "Loading..." : "Select Vehicle"}</option>
                        {vehicleList.map((v) => (<option key={v} value={v}>{v}</option>))}
                      </select>
                      <ChevronDown size={18} className="po-select-icon" />
                    </div>
                  </div>
                  <div className="po-lookup-btn-wrap">
                    <button onClick={() => handleSearchVehicle()} disabled={!canSearch} className="po-search-btn">
                      <Search size={18} />Search
                    </button>
                  </div>
                </div>

                <div className="po-divider">
                  <div className="po-divider-line" /><span className="po-divider-text">OR</span><div className="po-divider-line" />
                </div>

                <div className="po-scanner-outer">
                  <div className="po-scanner-glow" />
                  <div className="po-card po-scanner-inner">
                    <div className="po-scanner-header">
                      <div className="po-scanner-title"><QrCode size={20} color="#4edea3" /><h3>Scanner</h3></div>
                      <div className="po-live-chip"><span className="po-live-dot" /><span>LIVE</span></div>
                    </div>
                    <div className="po-viewport">
                      <div id="reader" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}></div>
                      {!isScannerActive && (
                        <div className="po-viewport-center">
                          <VideoOff size={48} color="rgba(78,222,163,0.3)" />
                          <button className="po-init-cam-btn" onClick={startScanner} disabled={isSearched}>Initialize Camera</button>
                        </div>
                      )}
                    </div>
                    {isScannerActive && <button className="po-init-cam-btn" style={{ width: '100%', marginTop: '10px' }} onClick={stopScanner}>Stop Camera</button>}
                    <div className="po-status-chips" style={{ position: 'static', marginTop: '15px' }}>
                        <div className="po-chip"><span className="po-chip-label">ID:</span><span className="po-chip-value">{scanResult || (selectedVehicle && isSearched ? selectedVehicle : "---")}</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="po-card">
                <div className="po-table-header"><h3 className="po-table-title" style={{ fontSize: '18px' }}>Recent Exits</h3></div>
                <div style={{ overflowX: "auto" }}>
                  <table className="po-table">
                    <thead>
                      <tr className="po-table-head-row">{["Vehicle", "Time", "Amount"].map((h) => (<th key={h} className="po-th">{h}</th>))}</tr>
                    </thead>
                    <tbody>
                      {MOCK_RECENT_EXITS.map((row) => (
                        <tr key={row.billNo} className="po-table-row">
                          <td className="po-td po-td-bold">{row.vehicleNo}</td>
                          <td className="po-td po-td-muted">{row.exitTime}</td>
                          <td className="po-td po-td-amount">{row.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showInvoice && session && <InvoiceModal session={session} onClose={() => setShowInvoice(false)} />}
      {showPaymentModal && session && (
        <div className="po-modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="po-modal po-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="po-modal-header">
              <h2 className="po-modal-title"><CreditCard size={20} /> Payment</h2>
              <button className="po-modal-close" onClick={() => setShowPaymentModal(false)}><X size={20} /></button>
            </div>
            <div className="po-modal-body">
              <div className="po-payment-summary">
                <div className="po-info-row"><span className="po-info-label">Final Amount To Collect</span><span className="po-info-value po-info-green">₹{backendParkingFee.toFixed(2)}</span></div>
                <div className="po-info-row"><span className="po-info-label">Vehicle No</span><span className="po-info-value po-info-bold">{session.vehicle_no}</span></div>
              </div>
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
            <div className="po-modal-footer">
              <button className="po-action-btn" onClick={() => setShowPaymentModal(false)}>Cancel</button>
              <button className="po-exit-btn po-exit-btn-sm" onClick={submitPayment} disabled={loadingBill}>
                {loadingBill ? <span className="po-spinner po-spinner-dark" /> : <CheckCircle2 size={18} />} Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
      {error && <div className="po-toast po-toast-error">{error}</div>}
      {successMsg && <div className="po-toast po-toast-success">{successMsg}</div>}
    </div>
  );
}
