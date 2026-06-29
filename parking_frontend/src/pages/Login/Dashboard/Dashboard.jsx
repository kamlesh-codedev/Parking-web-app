import "./Dashboard.css";
import logo from "../../../assets/kk-logo.png";
import { Link } from "react-router-dom";

function Dashboard() {
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
          {/* Navigation disabled for Reports */}
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

        {/* KPI Cards */}
        <div className="db-stats-grid">
          <div className="db-card">
            <div className="db-card-icon-wrap">
              <span className="db-icon">directions_car</span>
            </div>
            <h4 className="db-card-label">Total Vehicles Today</h4>
            <h2 className="db-card-value">1,248</h2>
            <p className="db-card-sub">+12% from yesterday</p>
          </div>
          <div className="db-card">
            <div className="db-card-icon-wrap">
              <span className="db-icon">local_parking</span>
            </div>
            <h4 className="db-card-label">Active Vehicles</h4>
            <h2 className="db-card-value">342</h2>
            <p className="db-card-sub">82% Capacity utilized</p>
          </div>
          <div className="db-card">
            <div className="db-card-icon-wrap">
              <span className="db-icon">payments</span>
            </div>
            <h4 className="db-card-label">Today's Revenue</h4>
            <h2 className="db-card-value">₹12,450</h2>
            <p className="db-card-sub">Peak hours active</p>
          </div>
          <div className="db-card">
            <div className="db-card-icon-wrap">
              <span className="db-icon">trending_up</span>
            </div>
            <h4 className="db-card-label">Monthly Revenue</h4>
            <h2 className="db-card-value">₹3.42 Lakh</h2>
            <p className="db-card-sub">Projected ₹4.10 Lakh</p>
          </div>
        </div>

        {/* Revenue Trends + Quick Actions */}
        <div className="db-dashboard-row">
          <div className="db-chart-card">
            <h3 className="db-section-title">Revenue Trends</h3>
            <div className="db-chart-bars">
              <div className="db-bar" style={{ height: "40%" }}><span className="db-bar-label">Mon</span></div>
              <div className="db-bar" style={{ height: "65%" }}><span className="db-bar-label">Tue</span></div>
              <div className="db-bar" style={{ height: "55%" }}><span className="db-bar-label">Wed</span></div>
              <div className="db-bar" style={{ height: "85%" }}><span className="db-bar-label">Thu</span></div>
              <div className="db-bar" style={{ height: "95%" }}><span className="db-bar-label">Fri</span></div>
              <div className="db-bar" style={{ height: "45%" }}><span className="db-bar-label">Sat</span></div>
              <div className="db-bar" style={{ height: "30%" }}><span className="db-bar-label">Sun</span></div>
            </div>
          </div>

          <div className="db-quick-actions">
            <h3 className="db-section-title">Quick Actions</h3>
            <button className="db-action-btn">
              <span className="db-icon">add_circle</span> New Park-In
            </button>
            <button className="db-action-btn">
              <span className="db-icon">directions_car</span> Release Vehicle
            </button>
            <button className="db-action-btn">
              <span className="db-icon">summarize</span> Generate Report
            </button>
            <div className="db-status-card">
              <div className="db-status-dot"></div>
              <div>
                <h4 className="db-status-title">System Status</h4>
                <p className="db-status-sub">All Nodes Operational</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="db-activity-table">
          <div className="db-table-header">
            <h3 className="db-section-title">Recent Activity</h3>
            <button className="db-view-all-btn">View All Activity</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>License Plate</th>
                <th>Vehicle Type</th>
                <th>Time</th>
                <th>Status</th>
                <th>Charge</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>NY 8921</td>
                <td>Tesla Model 3</td>
                <td>12:45 PM</td>
                <td><span className="db-badge db-badge-active">Active</span></td>
                <td>₹12.50</td>
              </tr>
              <tr>
                <td>CA 2201</td>
                <td>Ford F-150</td>
                <td>11:30 AM</td>
                <td><span className="db-badge db-badge-exited">Exited</span></td>
                <td>₹45.00</td>
              </tr>
              <tr>
                <td>TX 9982</td>
                <td>Honda Civic</td>
                <td>10:15 AM</td>
                <td><span className="db-badge db-badge-reserved">Reserved</span></td>
                <td>₹0.00</td>
              </tr>
              <tr>
                <td>FL 4410</td>
                <td>Toyota RAV4</td>
                <td>09:50 AM</td>
                <td><span className="db-badge db-badge-active">Active</span></td>
                <td>₹22.00</td>
              </tr>
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}

export default Dashboard;