import React, { useState } from 'react';
import './Invoice.css';
import logo from '../../assets/kk-logo.png';
import { Link } from "react-router-dom";

const API_BASE = "/api/saved-msg"; // adjust to match your blueprint's registered url_prefix

const Invoice = () => {
  const [vehicleNo, setVehicleNo]     = useState('');
  const [invoice, setInvoice]         = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [sending, setSending]         = useState(false);
  const [sendResult, setSendResult]   = useState('');
  // Backend distinguishes park-in vs park-out message by presence of park_out_status.
  // Since there's no endpoint telling us the vehicle's current status, expose it as a
  // manual toggle until the backend adds that info.
  const [isParkOut, setIsParkOut]     = useState(false);

  const handleInputChange = (e) => {
    setVehicleNo(e.target.value);
  };

  const handleSearch = async () => {
    setError('');
    setInvoice(null);
    setSendResult('');

    if (!vehicleNo.trim()) {
      setError('Vehicle number is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/get-message-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle_no: vehicleNo }),
      });
      const json = await res.json();

      if (!res.ok || json.status === 'error') {
        setError(json.message || 'Vehicle not found.');
        setInvoice(null);
        return;
      }

      setInvoice(json.data);
    } catch (err) {
      setError('Something went wrong while fetching invoice details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    setSendResult('');
    setError('');

    if (!vehicleNo.trim()) {
      setError('Vehicle number is required.');
      return;
    }

    setSending(true);
    try {
      const body = { vehicle_no: vehicleNo };
      if (isParkOut) {
        // Backend only checks truthiness of park_out_status to branch logic.
        body.park_out_status = true;
      }

      const res = await fetch(`${API_BASE}/send-saved-msg`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok || json.status === 'error') {
        setError(json.message || 'Failed to send message.');
        return;
      }

      setSendResult(json.message || 'Message sent successfully.');
    } catch (err) {
      setError('Something went wrong while sending the message.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="iv-container">

      {/* ── Sidebar ── */}
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
          <Link to="/parkout" className="pi-nav-item">
            <span className="pi-icon">logout</span>
            <span>Park-Out</span>
          </Link>
          <Link to="#" className="pi-nav-item">
            <span className="pi-icon">analytics</span>
            <span>Reports</span>
          </Link>
          <Link to="/invoice" className="pi-nav-item pi-nav-active">
            <span className="pi-icon">receipt_long</span>
            <span>Invoices</span>
          </Link>
        </nav>

        <div className="pi-sidebar-footer">
          <button className="pi-emergency-btn">
            <span className="pi-icon">notifications_active</span>
            Emergency Support
          </button>
          <div className="pi-footer-links">
            <Link to="/help" className="pi-footer-link">
              <span className="pi-icon">help_outline</span>
              <span>Help</span>
            </Link>
            <Link to="/" className="pi-footer-link">
              <span className="pi-icon">power_settings_new</span>
              <span>Logout</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="iv-main">

        <header className="iv-page-header">
          <div className="iv-header-title">
            <span className="pi-icon iv-header-icon">receipt_long</span>
            <h1 className="iv-page-title">Invoice</h1>
          </div>
          <p className="iv-page-subtitle">View invoice details and send invoice messages.</p>
        </header>

        <Link to="/dashboard" className="iv-back-link">
          <span className="pi-icon iv-back-icon">arrow_back</span>
          Back to Dashboard
        </Link>

        {/* Search row — now searches by Vehicle Number, matching backend */}
        <div className="iv-search-row">

          <div className="iv-phone-wrap">
            <span className="pi-icon iv-phone-icon">directions_car</span>
            <input
              className="iv-phone-input"
              type="text"
              placeholder="Enter Vehicle Number..."
              value={vehicleNo}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
          </div>

          <button className="iv-btn-search" onClick={handleSearch} disabled={loading}>
            <span className="pi-icon iv-btn-icon">search</span>
            {loading ? 'Searching...' : 'Search'}
          </button>

          <button className="iv-btn-send" onClick={handleSendMessage} disabled={sending || !invoice}>
            <span className="pi-icon iv-btn-icon">send</span>
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </div>

        {/* Park-out toggle — needed because backend branches on park_out_status,
            and there's currently no endpoint indicating vehicle status automatically. */}
        {invoice && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--iv-muted)' }}>
            <input
              type="checkbox"
              checked={isParkOut}
              onChange={(e) => setIsParkOut(e.target.checked)}
            />
            Send as Park-Out message
          </label>
        )}

        {error && (
          <div className="iv-empty">
            <span className="pi-icon iv-empty-icon">error_outline</span>
            <p className="iv-empty-text">{error}</p>
          </div>
        )}

        {sendResult && (
          <div className="iv-empty">
            <span className="pi-icon iv-empty-icon">check_circle</span>
            <p className="iv-empty-text">{sendResult}</p>
          </div>
        )}

        {/* Invoice details card — field names are best-guess from parking_record_to_dict.
            Confirm/adjust keys against actual backend dict output. */}
        {invoice && (
          <div className="iv-card">

            <div className="iv-card-header">
              <span className="iv-card-header-icon-wrap">
                <span className="pi-icon iv-card-icon">receipt</span>
              </span>
              <div>
                <h2 className="iv-card-title">Invoice Details</h2>
                <p className="iv-card-bill-no">Bill #{invoice.bill_number || invoice.billNumber || '—'}</p>
              </div>
            </div>

            <div className="iv-details-grid">

              <div className="iv-details-col">
                <div className="iv-detail-row">
                  <div className="iv-detail-key">
                    <span className="pi-icon iv-detail-icon">directions_car</span>
                    <span className="iv-detail-label">Vehicle Name</span>
                  </div>
                  <span className="iv-detail-value">
                    {invoice.vehicle_name || invoice.vehicleName || '—'}
                  </span>
                </div>

                <div className="iv-detail-row">
                  <div className="iv-detail-key">
                    <span className="pi-icon iv-detail-icon">tag</span>
                    <span className="iv-detail-label">Vehicle Number</span>
                  </div>
                  <span className="iv-detail-value iv-detail-mono iv-detail-bold">
                    {invoice.vehicle_number || invoice.vehicleNumber || vehicleNo}
                  </span>
                </div>

                <div className="iv-detail-row iv-detail-row-last">
                  <div className="iv-detail-key">
                    <span className="pi-icon iv-detail-icon">schedule</span>
                    <span className="iv-detail-label">Park-In Time</span>
                  </div>
                  <span className="iv-detail-value">
                    {invoice.park_in_time || invoice.parkInTime || '—'}
                  </span>
                </div>
              </div>

              <div className="iv-details-col">
                <div className="iv-detail-row">
                  <div className="iv-detail-key">
                    <span className="pi-icon iv-detail-icon">payments</span>
                    <span className="iv-detail-label">Prepaid Amount</span>
                  </div>
                  <span className="iv-detail-value iv-detail-bold iv-detail-accent">
                    {invoice.prepaid_amount || invoice.prepaidAmount || '—'}
                  </span>
                </div>

                <div className="iv-detail-row">
                  <div className="iv-detail-key">
                    <span className="pi-icon iv-detail-icon">receipt_long</span>
                    <span className="iv-detail-label">Bill Number</span>
                  </div>
                  <span className="iv-detail-value iv-detail-mono">
                    {invoice.bill_number || invoice.billNumber || '—'}
                  </span>
                </div>

                <div className="iv-detail-row iv-detail-row-last">
                  <div className="iv-detail-key">
                    <span className="pi-icon iv-detail-icon">call</span>
                    <span className="iv-detail-label">Driver Phone Number</span>
                  </div>
                  <span className="iv-detail-value">
                    {invoice.driver_phone || invoice.phone || invoice.driverPhone || '—'}
                  </span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Empty state — no invoice, not loading, searched already, no error shown separately */}
        {!invoice && !loading && !error && vehicleNo && (
          <div className="iv-empty">
            <span className="pi-icon iv-empty-icon">search_off</span>
            <p className="iv-empty-text">No invoice found for this vehicle number.</p>
          </div>
        )}

      </main>
    </div>
  );
};

export default Invoice;