import React, { useEffect, useMemo, useState } from 'react';
import './Invoice.css';
import logo from '../../assets/kk-logo.png';
import { Link } from 'react-router-dom';

const API_BASE = '/api/saved-msg';

const Invoice = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [savedMessages, setSavedMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sendResult, setSendResult] = useState('');
  const [sendEnabled, setSendEnabled] = useState(false);

  useEffect(() => {
    loadSavedMessages();
  }, []);

  const loadSavedMessages = async () => {
    setLoadingMessages(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();

      if (!res.ok || json.status === 'error') {
        setError(json.message || 'Unable to load saved vehicles.');
        setSavedMessages([]);
        return;
      }

      setSavedMessages(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      setError('Unable to load saved vehicles.');
      setSavedMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const filteredMessages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return savedMessages;

    return savedMessages.filter((item) =>
      item.vehicle_no?.toLowerCase().includes(query)
    );
  }, [savedMessages, searchQuery]);

  const handleSearchQueryChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const parseParkOutStatus = (message) => {
    if (message == null) return false;
    if (typeof message.park_out_status === 'boolean') return message.park_out_status;
    return String(message.park_out_status).toLowerCase() === 'true';
  };

  const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const formatMoney = (value) => {
    if (value == null || value === '') return '—';
    return typeof value === 'number' ? `₹${value.toFixed(2)}` : `₹${value}`;
  };

  const handleSelectVehicle = async (message) => {
    setSelectedMessage(message);
    setInvoice(null);
    setSendEnabled(false);
    setError('');
    setSendResult('');
    setLoadingDetails(true);

    try {
      const res = await fetch(`${API_BASE}/get-message-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle_no: message.vehicle_no }),
      });
      const json = await res.json();

      if (!res.ok || json.status === 'error') {
        setError(json.message || 'Vehicle details not found.');
        setInvoice(null);
        setSendEnabled(false);
        return;
      }

      setInvoice(json.data);
      setSendEnabled(true);
    } catch (err) {
      setError('Something went wrong while fetching vehicle details.');
      setInvoice(null);
      setSendEnabled(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedMessage) {
      setError('Please select a vehicle before sending.');
      return;
    }

    setError('');
    setSendResult('');
    setSending(true);

    try {
      const body = { vehicle_no: selectedMessage.vehicle_no };
      if (parseParkOutStatus(selectedMessage)) {
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
      setSendEnabled(false);
    } catch (err) {
      setError('Something went wrong while sending the message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="iv-container">
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
        <div className="iv-content-grid">
          <section className="iv-details-panel">
            <div className="iv-card">
              <div className="iv-card-header">
                <span className="iv-card-header-icon-wrap">
                  <span className="pi-icon iv-card-icon">receipt</span>
                </span>
                <div>
                  <h2 className="iv-card-title">Selected Vehicle</h2>
                  <p className="iv-card-bill-no">
                    {selectedMessage?.vehicle_no || 'No vehicle selected'}
                  </p>
                </div>
              </div>
              {loadingDetails ? (
                <div className="iv-empty">
                  <span className="pi-icon iv-empty-icon">hourglass_empty</span>
                  <p className="iv-empty-text">Loading vehicle details…</p>
                </div>
              ) : invoice ? (
                <div className="iv-details-grid">
                  <div className="iv-details-col">
                    <div className="iv-detail-row">
                      <div className="iv-detail-key">
                        <span className="pi-icon iv-detail-icon">directions_car</span>
                        <span className="iv-detail-label">Vehicle Name</span>
                      </div>
                      <span className="iv-detail-value">
                        {invoice.vehicle_name || '—'}
                      </span>
                    </div>
                    <div className="iv-detail-row">
                      <div className="iv-detail-key">
                        <span className="pi-icon iv-detail-icon">tag</span>
                        <span className="iv-detail-label">Vehicle Number</span>
                      </div>
                      <span className="iv-detail-value iv-detail-mono iv-detail-bold">
                        {invoice.vehicle_no || '—'}
                      </span>
                    </div>
                    <div className="iv-detail-row">
                      <div className="iv-detail-key">
                        <span className="pi-icon iv-detail-icon">call</span>
                        <span className="iv-detail-label">Phone Number</span>
                      </div>
                      <span className="iv-detail-value">
                        {invoice.phone_number || '—'}
                      </span>
                    </div>
                    <div className="iv-detail-row">
                      <div className="iv-detail-key">
                        <span className="pi-icon iv-detail-icon">schedule</span>
                        <span className="iv-detail-label">Park-In Date</span>
                      </div>
                      <span className="iv-detail-value">
                        {formatDate(invoice.park_in_date)}
                      </span>
                    </div>
                    <div className="iv-detail-row iv-detail-row-last">
                      <div className="iv-detail-key">
                        <span className="pi-icon iv-detail-icon">logout</span>
                        <span className="iv-detail-label">Park-Out Date</span>
                      </div>
                      <span className="iv-detail-value">
                        {formatDate(invoice.park_out)}
                      </span>
                    </div>
                  </div>
                  <div className="iv-details-col">
                    <div className="iv-detail-row">
                      <div className="iv-detail-key">
                        <span className="pi-icon iv-detail-icon">calendar_month</span>
                        <span className="iv-detail-label">Number of Days</span>
                      </div>
                      <span className="iv-detail-value">
                        {invoice.no_of_days ?? '—'}
                      </span>
                    </div>
                    <div className="iv-detail-row">
                      <div className="iv-detail-key">
                        <span className="pi-icon iv-detail-icon">payments</span>
                        <span className="iv-detail-label">Prepaid Amount</span>
                      </div>
                      <span className="iv-detail-value iv-detail-bold iv-detail-accent">
                        {formatMoney(invoice.prepaid)}
                      </span>
                    </div>
                    <div className="iv-detail-row">
                      <div className="iv-detail-key">
                        <span className="pi-icon iv-detail-icon">account_balance_wallet</span>
                        <span className="iv-detail-label">Park Fee</span>
                      </div>
                      <span className="iv-detail-value">
                        {formatMoney(invoice.park_fee)}
                      </span>
                    </div>
                    <div className="iv-detail-row">
                      <div className="iv-detail-key">
                        <span className="pi-icon iv-detail-icon">receipt_long</span>
                        <span className="iv-detail-label">Bill Number</span>
                      </div>
                      <span className="iv-detail-value iv-detail-mono">
                        {invoice.bill_no || '—'}
                      </span>
                    </div>
                    <div className="iv-detail-row iv-detail-row-last">
                      <div className="iv-detail-key">
                        <span className="pi-icon iv-detail-icon">paid</span>
                        <span className="iv-detail-label">Amount Due</span>
                      </div>
                      <span className="iv-detail-value iv-detail-bold iv-detail-accent">
                        {formatMoney(invoice.amount_due)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="iv-empty">
                  <span className="pi-icon iv-empty-icon">info</span>
                  <p className="iv-empty-text">
                    Select a vehicle from the right-hand list to load message details.
                  </p>
                </div>
              )}
            </div>
            <div className="iv-send-footer">
              <button
                type="button"
                className="iv-btn-send"
                onClick={handleSendMessage}
                disabled={!sendEnabled || sending}
              >
                <span className="pi-icon iv-btn-icon">send</span>
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
            {error && (
              <div className="iv-empty iv-empty-bottom">
                <span className="pi-icon iv-empty-icon">error_outline</span>
                <p className="iv-empty-text">{error}</p>
              </div>
            )}
            {sendResult && (
              <div className="iv-empty iv-empty-bottom">
                <span className="pi-icon iv-empty-icon">check_circle</span>
                <p className="iv-empty-text">{sendResult}</p>
              </div>
            )}
          </section>
          <aside className="iv-list-panel">
            <div className="iv-list-panel-header">
              <div className="iv-list-search iv-list-search-full">
                <input
                  className="iv-phone-input"
                  type="text"
                  placeholder="Search vehicle number or messages"
                  value={searchQuery}
                  onChange={handleSearchQueryChange}
                />
              </div>
            </div>
            <div className="iv-list-items">
              {loadingMessages ? (
                <div className="iv-list-empty">
                  <span className="pi-icon iv-empty-icon">hourglass_empty</span>
                  <p className="iv-empty-text">Loading saved vehicles…</p>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="iv-list-empty">
                  <span className="pi-icon iv-empty-icon">search_off</span>
                  <p className="iv-empty-text">No saved vehicles match your search.</p>
                </div>
              ) : (
                filteredMessages.map((message) => {
                  const isActive = selectedMessage?.vehicle_no === message.vehicle_no &&
                    parseParkOutStatus(selectedMessage) === parseParkOutStatus(message);
                  const isParkOutMessage = parseParkOutStatus(message);
                  return (
                    <button
                      key={`${message.vehicle_no}-${String(message.park_out_status)}`}
                      type="button"
                      className={`iv-list-item ${isActive ? 'iv-list-item-active' : ''}`}
                      onClick={() => handleSelectVehicle(message)}
                    >
                      <div className="iv-list-item-label">
                        <span className="iv-list-item-number">{message.vehicle_no}</span>
                        <span className="iv-list-item-meta">
                          {isParkOutMessage ? 'Park-Out Message' : 'Park-In Message'}
                        </span>
                      </div>
                      <span className="iv-badge">
                        {isParkOutMessage ? 'OUT' : 'IN'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Invoice;
