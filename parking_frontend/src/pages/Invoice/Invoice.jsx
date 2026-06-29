import React, { useState, useRef, useEffect } from 'react';
import './Invoice.css';
import logo from '../../assets/kk-logo.png';
import { Link } from "react-router-dom"; // Requirement 1

/* ── Sample phone list for dropdown ── */
const PHONE_LIST = [
  { phone: '+91 98765 43210', name: 'Ravi Kumar' },
  { phone: '+91 91234 56789', name: 'Priya Sharma' },
  { phone: '+91 80001 11222', name: 'Arun Mehta' },
  { phone: '+91 77890 00123', name: 'Sneha Iyer' },
];

/* ── Sample invoice data keyed by phone ── */
const INVOICE_MAP = {
  '+91 98765 43210': {
    vehicleName:   'Honda Activa',
    vehicleNumber: 'TN 25 AB 1234',
    parkInTime:    '29 Jun 2026, 10:30 AM',
    prepaidAmount: '₹90',
    billNumber:    'KK-893636',
    driverPhone:   '+91 98765 43210',
  },
  '+91 91234 56789': {
    vehicleName:   'TVS Jupiter',
    vehicleNumber: 'TN 09 CD 5678',
    parkInTime:    '29 Jun 2026, 11:00 AM',
    prepaidAmount: '₹60',
    billNumber:    'KK-893637',
    driverPhone:   '+91 91234 56789',
  },
};

const Invoice = () => {
  const [phoneSearch, setPhoneSearch] = useState('');
  const [invoice, setInvoice]         = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [filteredList, setFilteredList] = useState(PHONE_LIST);
  const wrapRef = useRef(null);

  /* Close dropdown on outside click */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* Filter list as user types */
  const handleInputChange = (e) => {
    const val = e.target.value;
    setPhoneSearch(val);
    setFilteredList(
      PHONE_LIST.filter(
        (p) =>
          p.phone.includes(val) ||
          p.name.toLowerCase().includes(val.toLowerCase())
      )
    );
    setDropdownOpen(true);
  };

  const handleSelectPhone = (phone) => {
    setPhoneSearch(phone);
    setDropdownOpen(false);
    setInvoice(INVOICE_MAP[phone] || null);
  };

  const handleSearch = () => {
    setDropdownOpen(false);
    setInvoice(INVOICE_MAP[phoneSearch] || null);
    console.log('Searching phone:', phoneSearch);
  };

  const handleSendMessage = () => {
    console.log('Sending message to:', phoneSearch);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') setDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setFilteredList(PHONE_LIST);
    setDropdownOpen((prev) => !prev);
  };

  return (
    <div className="iv-container">

      {/* ── Sidebar — Requirement 2, 3 & 4 ── */}
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
          {/* Reports menu item kept, but navigation disabled */}
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

        {/* Page header */}
        <header className="iv-page-header">
          <div className="iv-header-title">
            <span className="pi-icon iv-header-icon">receipt_long</span>
            <h1 className="iv-page-title">Invoice</h1>
          </div>
          <p className="iv-page-subtitle">View invoice details and send invoice messages.</p>
        </header>

        {/* Back link */}
        <Link to="/dashboard" className="iv-back-link">
          <span className="pi-icon iv-back-icon">arrow_back</span>
          Back to Dashboard
        </Link>

        {/* Search row */}
        <div className="iv-search-row">

          {/* Phone input + dropdown */}
          <div className="iv-phone-wrap" ref={wrapRef}>
            <span className="pi-icon iv-phone-icon">call</span>
            <input
              className="iv-phone-input"
              type="text"
              placeholder="Enter Phone Number..."
              value={phoneSearch}
              onChange={handleInputChange}
              onFocus={() => { setFilteredList(PHONE_LIST); setDropdownOpen(true); }}
              onKeyDown={handleKeyDown}
            />
            <span
              className={`pi-icon iv-phone-chevron ${dropdownOpen ? 'iv-chevron-open' : ''}`}
              onClick={toggleDropdown}
            >
              expand_more
            </span>

            {/* Dropdown list */}
            {dropdownOpen && filteredList.length > 0 && (
              <ul className="iv-dropdown">
                {filteredList.map((item) => (
                  <li
                    key={item.phone}
                    className="iv-dropdown-item"
                    onMouseDown={() => handleSelectPhone(item.phone)}
                  >
                    <span className="pi-icon iv-dd-icon">call</span>
                    <div className="iv-dd-text">
                      <span className="iv-dd-phone">{item.phone}</span>
                      <span className="iv-dd-name">{item.name}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button className="iv-btn-search" onClick={handleSearch}>
            <span className="pi-icon iv-btn-icon">search</span>
            Search
          </button>

          <button className="iv-btn-send" onClick={handleSendMessage}>
            <span className="pi-icon iv-btn-icon">send</span>
            Send Message
          </button>
        </div>

        {/* Invoice details card */}
        {invoice && (
          <div className="iv-card">

            {/* Card header */}
            <div className="iv-card-header">
              <span className="iv-card-header-icon-wrap">
                <span className="pi-icon iv-card-icon">receipt</span>
              </span>
              <div>
                <h2 className="iv-card-title">Invoice Details</h2>
                <p className="iv-card-bill-no">Bill #{invoice.billNumber}</p>
              </div>
            </div>

            {/* Details grid */}
            <div className="iv-details-grid">

              {/* Left column */}
              <div className="iv-details-col">
                <div className="iv-detail-row">
                  <div className="iv-detail-key">
                    <span className="pi-icon iv-detail-icon">directions_car</span>
                    <span className="iv-detail-label">Vehicle Name</span>
                  </div>
                  <span className="iv-detail-value">{invoice.vehicleName}</span>
                </div>

                <div className="iv-detail-row">
                  <div className="iv-detail-key">
                    <span className="pi-icon iv-detail-icon">tag</span>
                    <span className="iv-detail-label">Vehicle Number</span>
                  </div>
                  <span className="iv-detail-value iv-detail-mono iv-detail-bold">
                    {invoice.vehicleNumber}
                  </span>
                </div>

                <div className="iv-detail-row iv-detail-row-last">
                  <div className="iv-detail-key">
                    <span className="pi-icon iv-detail-icon">schedule</span>
                    <span className="iv-detail-label">Park-In Time</span>
                  </div>
                  <span className="iv-detail-value">{invoice.parkInTime}</span>
                </div>
              </div>

              {/* Right column */}
              <div className="iv-details-col">
                <div className="iv-detail-row">
                  <div className="iv-detail-key">
                    <span className="pi-icon iv-detail-icon">payments</span>
                    <span className="iv-detail-label">Prepaid Amount</span>
                  </div>
                  <span className="iv-detail-value iv-detail-bold iv-detail-accent">
                    {invoice.prepaidAmount}
                  </span>
                </div>

                <div className="iv-detail-row">
                  <div className="iv-detail-key">
                    <span className="pi-icon iv-detail-icon">receipt_long</span>
                    <span className="iv-detail-label">Bill Number</span>
                  </div>
                  <span className="iv-detail-value iv-detail-mono">{invoice.billNumber}</span>
                </div>

                <div className="iv-detail-row iv-detail-row-last">
                  <div className="iv-detail-key">
                    <span className="pi-icon iv-detail-icon">call</span>
                    <span className="iv-detail-label">Driver Phone Number</span>
                  </div>
                  <span className="iv-detail-value">{invoice.driverPhone}</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Empty state when no invoice found */}
        {!invoice && phoneSearch && (
          <div className="iv-empty">
            <span className="pi-icon iv-empty-icon">search_off</span>
            <p className="iv-empty-text">No invoice found for this number.</p>
          </div>
        )}

      </main>
    </div>
  );
};

export default Invoice;