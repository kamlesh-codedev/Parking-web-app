import "./Dashboard.css";
import logo from "../../../assets/kk-logo.png";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const API_BASE = "http://localhost:5000";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/dashboard/`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const fmt = (n) => Number(n ?? 0).toLocaleString("en-IN");
  const fmtRev = (n) => {
    const v = Number(n ?? 0);
    return v >= 100000
      ? `₹${(v / 100000).toFixed(2)} Lakh`
      : `₹${fmt(v)}`;
  };

  const weeklyData = stats?.weekly ?? [];
  const maxVal = Math.max(...weeklyData.map((d) => Math.max(d.park_in, d.park_out)), 1);
  const barHeight = (val) => `${Math.max((val / maxVal) * 95, 4)}%`;

  return (
    <div className="db-container">

      {/* ── Sidebar ── */}
      <aside className="db-sidebar">
        <div className="db-sidebar-logo">
          <img src={logo} alt="KK Parking Logo" className="db-logo" />
        </div>

        <nav className="db-nav">
          <Link to="/dashboard" className="db-nav-item db-nav-active">
            <span className="db-icon">dashboard</span>
            <span>Dashboard</span>
          </Link>
          <Link to="/parkin" className="db-nav-item">
            <span className="db-icon">login</span>
            <span>Park-In</span>
          </Link>
          <Link to="/parkout" className="db-nav-item">
            <span className="db-icon">logout</span>
            <span>Park-Out</span>
          </Link>
          <Link to="#" className="db-nav-item">
            <span className="db-icon">analytics</span>
            <span>Reports</span>
          </Link>
          <Link to="/invoice" className="db-nav-item">
            <span className="db-icon">receipt_long</span>
            <span>Invoices</span>
          </Link>
        </nav>

        <div className="db-sidebar-footer">
          <button className="db-emergency-btn">
            <span className="db-icon">notifications_active</span>
            Emergency Support
          </button>
          <div className="db-footer-links">
            <Link to="/help" className="db-footer-link">
              <span className="db-icon">help_outline</span>
              <span>Help</span>
            </Link>
            <Link to="/" className="db-footer-link">
              <span className="db-icon">power_settings_new</span>
              <span>Logout</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="db-main">

        {/* Top Bar */}
        <div className="db-top-bar">
          <div>
            <h1 className="db-page-title">Operations Dashboard</h1>
            <p className="db-page-subtitle">Real-time parking ecosystem monitoring</p>
          </div>
          <div className="db-search-box">
            <span className="db-icon db-search-icon">search</span>
            <input type="text" placeholder="Search vehicles, receipts..." />
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            background: "rgba(192,57,43,0.15)",
            border: "1px solid rgba(192,57,43,0.4)",
            borderRadius: "var(--db-radius-sm)",
            color: "#e74c3c",
            padding: "0.75rem 1rem",
            marginBottom: "1.5rem",
            fontSize: "0.88rem",
          }}>
            ⚠ Could not load dashboard data — {error}
          </div>
        )}

        {/* KPI Cards */}
        <div className="db-stats-grid">
          <div className="db-card">
            <div className="db-card-icon-wrap">
              <span className="db-icon">directions_car</span>
            </div>
            <h4 className="db-card-label">Total Vehicles Today</h4>
            <h2 className="db-card-value">{loading ? "—" : fmt(stats?.today_parked)}</h2>
            <p className="db-card-sub">Parked in so far today</p>
          </div>
          <div className="db-card">
            <div className="db-card-icon-wrap">
              <span className="db-icon">local_parking</span>
            </div>
            <h4 className="db-card-label">Active Vehicles</h4>
            <h2 className="db-card-value">{loading ? "—" : fmt(stats?.currently_parked)}</h2>
            <p className="db-card-sub">Currently in lot</p>
          </div>
          <div className="db-card">
            <div className="db-card-icon-wrap">
              <span className="db-icon">payments</span>
            </div>
            <h4 className="db-card-label">Today's Revenue</h4>
            <h2 className="db-card-value">{loading ? "—" : `₹${fmt(stats?.today_revenue)}`}</h2>
            <p className="db-card-sub">From completed checkouts</p>
          </div>
          <div className="db-card">
            <div className="db-card-icon-wrap">
              <span className="db-icon">trending_up</span>
            </div>
            <h4 className="db-card-label">Monthly Revenue</h4>
            <h2 className="db-card-value">{loading ? "—" : fmtRev(stats?.month_revenue)}</h2>
            <p className="db-card-sub">Current month total</p>
          </div>
        </div>

        {/* Weekly Trends + Quick Actions */}
        <div className="db-dashboard-row">
          <div className="db-chart-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 className="db-section-title" style={{ marginBottom: 0 }}>Weekly Park-In &amp; Park-Out Trends</h3>
              {/* Legend */}
              <div style={{ display: "flex", gap: "1.25rem", fontSize: "0.75rem", color: "var(--db-muted)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--db-cyan)", display: "inline-block" }} />
                  Park-In
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: "rgba(0,212,255,0.35)", display: "inline-block" }} />
                  Park-Out
                </span>
              </div>
            </div>

           <div style={{
  height: "200px",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-around",
  gap: "0.5rem",
  paddingBottom: "0",
  paddingTop: "1rem",
}}>
  {loading
    ? ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
        <div key={d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
          <div style={{ width: "100%", display: "flex", alignItems: "flex-end", gap: "3px", flex: 1 }}>
            <div style={{ flex: 1, height: "30%", background: "var(--db-cyan)", borderRadius: "4px 4px 0 0", opacity: 0.2 }} />
            <div style={{ flex: 1, height: "20%", background: "rgba(0,212,255,0.35)", borderRadius: "4px 4px 0 0", opacity: 0.2 }} />
          </div>
          <span style={{ fontSize: "0.72rem", color: "var(--db-muted)", marginTop: "6px", textAlign: "center" }}>{d}</span>
        </div>
      ))
    : weeklyData.map((d) => (
        <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
          <div style={{ width: "100%", display: "flex", alignItems: "flex-end", gap: "3px", flex: 1 }}>
            {/* Park-In */}
            <div
              style={{
                flex: 1,
                height: barHeight(d.park_in),
                background: "linear-gradient(to top, #00d4ff, rgba(0,212,255,0.55))",
                borderRadius: "4px 4px 0 0",
                minHeight: "4px",
              }}
              title={`${d.day} Park-In: ${d.park_in}`}
            />
            {/* Park-Out */}
            <div
              style={{
                flex: 1,
                height: barHeight(d.park_out),
                background: "linear-gradient(to top, rgba(0,180,220,0.6), rgba(0,140,180,0.35))",
                borderRadius: "4px 4px 0 0",
                minHeight: "4px",
              }}
              title={`${d.day} Park-Out: ${d.park_out}`}
            />
          </div>
          <span style={{ fontSize: "0.72rem", color: "var(--db-muted)", marginTop: "6px", textAlign: "center", flexShrink: 0 }}>
            {d.day.slice(0, 3)}
          </span>
        </div>
      ))
  }
</div>
          </div>

          <div className="db-quick-actions">
  <h3 className="db-section-title">Quick Actions</h3>
  <Link to="/parkin" className="db-action-btn" style={{ textDecoration: "none" }}>
    <span className="db-icon">add_circle</span> New Park-In
  </Link>
  <Link to="/parkout" className="db-action-btn" style={{ textDecoration: "none" }}>
    <span className="db-icon">directions_car</span> Release Vehicle
  </Link>
  <Link to="/reports" className="db-action-btn" style={{ textDecoration: "none" }}>
    <span className="db-icon">summarize</span> Generate Report
  </Link>
  <div className="db-status-card">
    <div className="db-status-dot"></div>
    <div>
      <h4 className="db-status-title">System Status</h4>
      <p className="db-status-sub">
        {loading ? "Checking…" : error ? "Connection Error" : "All Nodes Operational"}
      </p>
    </div>
  </div>
</div>
        </div>

      </main>
    </div>
  );
}

export default Dashboard;