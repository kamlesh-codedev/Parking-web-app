import React, { useState } from 'react';
import './ParkIn.css';
import logo from '../../assets/kk-logo.png';
import { Link } from "react-router-dom";

const ParkIn = () => {
  const [vehicleData, setVehicleData] = useState({
    vehicleNumber: '',
    vehicleName: '',
    phoneNumber: '',
    parkingAmount: '',
    isPrepaid: false,
  });

  const [registeredVehicle, setRegisteredVehicle] = useState(null);
  const [loading, setLoading] = useState(false);

  // API Base URL (adjust if your port is different)
  const API_BASE = "http://localhost:5000/park-in";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVehicleData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggle = () => {
    setVehicleData((prev) => ({ ...prev, isPrepaid: !prev.isPrepaid }));
  };

  // ── SEARCH: GET DETAILS ──
  const handleSearchDetails = async () => {
    if (!vehicleData.vehicleNumber) {
      alert("Enter Vehicle Number");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/get-details?vehicle_no=${encodeURIComponent(vehicleData.vehicleNumber)}`,
        {
          credentials: "include"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Vehicle details not found");
        return;
      }
      setVehicleData({
        bill_no: data.message.bill_no
      })
      if (data.status === "success") {
        setVehicleData({
          vehicleNumber: data.message.vehicle_number,
          vehicleName: data.message.vehicle_name,
          phoneNumber: data.message.phone_number,
          parkingAmount: data.message.amount,
          isPrepaid: false,
        });
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error fetching details:", error);
      alert("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  // ── GENERATE BILL ──
  const handleGenerateBill = async () => {
    if (!vehicleData.vehicleNumber) return alert("Please enter a vehicle number.");
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/generate-bill`, {
        method: 'POST',
        credentials: "include",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_no: vehicleData.vehicleNumber,
          vehicle_name: vehicleData.vehicleName,
          amount: vehicleData.parkingAmount,
          prepaid: vehicleData.isPrepaid,
          phone_number: vehicleData.phoneNumber
        })
      });

      const data = await response.json();

      if (response.ok) {
        setRegisteredVehicle({
          vehicleNumber: data.vehicle_no || vehicleData.vehicleNumber,
          vehicleName: data.vehicle_name || vehicleData.vehicleName,
          billNumber: data.bill_no || vehicleData.bill_no,
          phoneNumber: data.ph_no || vehicleData.phoneNumber,
          parkingAmount: data.amount || vehicleData.parkingAmount,
          isPrepaid: vehicleData.isPrepaid,
          parkInTime: new Date().toLocaleString(),
          status: data.status === "reserved" ? "Reserved" : "Parked",
        });
        alert("Bill Generated Successfully!");
      } else {
        alert(data.message || "Failed to generate bill");
      }
    } catch (error) {
      console.error("Error generating bill:", error);
    } finally {
      setLoading(false);
    }
  };

  // ── SEND MESSAGE ──
  const handleSendMessage = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/send-msg`, { method: 'POST', credentials: "include" });
      const data = await response.json();
      alert(data.message);
    } catch (error) {
      alert("Error sending message");
    } finally {
      setLoading(false);
    }
  };

  // ── SAVE MESSAGE ──
  const handleSaveMessage = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/save-msg`, { method: 'POST' , credentials: "include" });
      const data = await response.json();
      alert(data.message);
    } catch (error) {
      alert("Error saving message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pi-container">
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
          <Link to="/parkin" className="pi-nav-item pi-nav-active">
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
          <Link to="/invoice" className="pi-nav-item">
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
      <main className="pi-main">
        <header className="pi-page-header">
          <h1 className="pi-page-title">Park-In Entry</h1>
          <p className="pi-page-subtitle">Register incoming vehicles and generate parking bills</p>
        </header>

        <div className="pi-content-grid">
          {/* ── Registration Card ── */}
          <section className="pi-card pi-registration-card">
            <div className="pi-card-header">
              <span className="pi-icon pi-header-icon">apps</span>
              <h2 className="pi-card-title">Vehicle Registration</h2>
            </div>

            {/* Vehicle Number */}
            <div className="pi-form-group">
              <label className="pi-label">VEHICLE NUMBER</label>
              <div className="pi-search-row">
                <input
                  className="pi-input pi-search-input"
                  type="text"
                  name="vehicleNumber"
                  value={vehicleData.vehicleNumber}
                  onChange={handleInputChange}
                  placeholder="Enter vehicle number"
                />
                <button 
                  className="pi-btn-search" 
                  onClick={handleSearchDetails}
                  disabled={loading}
                >
                  <span className="pi-icon">{loading ? 'sync' : 'search'}</span>
                  Search
                </button>
              </div>
            </div>

            {/* Name + Phone */}
            <div className="pi-form-row">
              <div className="pi-form-group">
                <label className="pi-label">VEHICLE NAME</label>
                <input
                  className="pi-input"
                  type="text"
                  name="vehicleName"
                  value={vehicleData.vehicleName}
                  onChange={handleInputChange}
                  placeholder="e.g. Toyota Camry"
                />
              </div>
              <div className="pi-form-group">
                <label className="pi-label">PHONE NUMBER</label>
                <input
                  className="pi-input"
                  type="text"
                  name="phoneNumber"
                  value={vehicleData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="+91 00000 00000"
                />
              </div>
            </div>

            {/* Amount + Toggle */}
            <div className="pi-form-row">
              <div className="pi-form-group">
                <label className="pi-label">PARKING AMOUNT (₹)</label>
                <div className="pi-input-wrap">
                  <span className="pi-currency-symbol">₹</span>
                  <input
                    className="pi-input pi-input-currency"
                    type="number"
                    name="parkingAmount"
                    value={vehicleData.parkingAmount}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="pi-form-group">
                <label className="pi-label">PREPAID STATUS</label>
                <div className="pi-toggle-row">
                  <span className={`pi-toggle-label ${!vehicleData.isPrepaid ? 'pi-toggle-active' : ''}`}>No</span>
                  <button
                    type="button"
                    className={`pi-toggle-switch ${vehicleData.isPrepaid ? 'pi-toggle-on' : ''}`}
                    onClick={handleToggle}
                  >
                    <span className="pi-toggle-thumb" />
                  </button>
                  <span className={`pi-toggle-label ${vehicleData.isPrepaid ? 'pi-toggle-active' : ''}`}>Yes</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pi-action-buttons">
              <button className="pi-btn-primary" onClick={handleGenerateBill} disabled={loading}>
                <span className="pi-icon">receipt</span>
                {loading ? 'GENERATING...' : 'GENERATE BILL'}
              </button>
              <button className="pi-btn-secondary" onClick={handleSaveMessage} disabled={loading}>
                <span className="pi-icon">save</span>
                SAVE MESSAGE
              </button>
              <button className="pi-btn-secondary" onClick={handleSendMessage} disabled={loading}>
                <span className="pi-icon">send</span>
                SEND MESSAGE
              </button>
            </div>
          </section>

          {/* ── Vehicle Details Card ── */}
          <section className="pi-card pi-details-card">
            <div className="pi-card-header">
              <span className="pi-icon pi-header-icon">info</span>
              <h2 className="pi-card-title">Vehicle Details</h2>
            </div>

            <ul className="pi-details-list">
              <li className="pi-detail-item">
                <span className="pi-detail-icon-wrap"><span className="pi-icon pi-detail-icon">tag</span></span>
                <div className="pi-detail-body">
                  <span className="pi-detail-label">VEHICLE NUMBER</span>
                  <span className="pi-detail-value">{registeredVehicle?.vehicleNumber || '—'}</span>
                </div>
              </li>
              <li className="pi-detail-item">
                <span className="pi-detail-icon-wrap"><span className="pi-icon pi-detail-icon">directions_car</span></span>
                <div className="pi-detail-body">
                  <span className="pi-detail-label">VEHICLE NAME</span>
                  <span className="pi-detail-value">{registeredVehicle?.vehicleName || '—'}</span>
                </div>
              </li>
              <li className="pi-detail-item">
                <span className="pi-detail-icon-wrap"><span className="pi-icon pi-detail-icon">receipt_long</span></span>
                <div className="pi-detail-body">
                  <span className="pi-detail-label">BILL NUMBER</span>
                  <span className="pi-detail-value pi-value-muted">{registeredVehicle?.billNumber || 'Auto Generated'}</span>
                </div>
              </li>
              <li className="pi-detail-item">
                <span className="pi-detail-icon-wrap"><span className="pi-icon pi-detail-icon">call</span></span>
                <div className="pi-detail-body">
                  <span className="pi-detail-label">PHONE NUMBER</span>
                  <span className="pi-detail-value">{registeredVehicle?.phoneNumber || '—'}</span>
                </div>
              </li>
              <li className="pi-detail-item">
                <span className="pi-detail-icon-wrap"><span className="pi-icon pi-detail-icon">payments</span></span>
                <div className="pi-detail-body">
                  <span className="pi-detail-label">PARKING AMOUNT</span>
                  <span className="pi-detail-value">
                    {registeredVehicle?.parkingAmount ? `₹ ${registeredVehicle.parkingAmount}` : '—'}
                  </span>
                </div>
              </li>
              <li className="pi-detail-item">
                <span className="pi-detail-icon-wrap"><span className="pi-icon pi-detail-icon">toggle_on</span></span>
                <div className="pi-detail-body">
                  <span className="pi-detail-label">PREPAID STATUS</span>
                  <span className="pi-detail-value">
                    {registeredVehicle ? (registeredVehicle.isPrepaid ? 'Yes' : 'No') : '—'}
                  </span>
                </div>
              </li>
              <li className="pi-detail-item">
                <span className="pi-detail-icon-wrap"><span className="pi-icon pi-detail-icon">schedule</span></span>
                <div className="pi-detail-body">
                  <span className="pi-detail-label">PARK-IN TIME</span>
                  <span className="pi-detail-value pi-value-accent">{registeredVehicle?.parkInTime || '—'}</span>
                </div>
              </li>
              <li className="pi-detail-item pi-detail-item-last">
                <span className="pi-detail-icon-wrap"><span className="pi-icon pi-detail-icon">hdr_strong</span></span>
                <div className="pi-detail-body">
                  <span className="pi-detail-label">PARKING STATUS</span>
                  <span className={`pi-status-badge ${registeredVehicle ? 'pi-status-parked' : 'pi-status-waiting'}`}>
                    {registeredVehicle?.status || 'Awaiting Check-In'}
                  </span>
                </div>
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ParkIn;