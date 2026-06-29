import "./Login.css";
import logo from "../../assets/kk-logo.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="login-container">
      <div className="background-overlay"></div>

      <div className="login-card">
        <img src={logo} alt="KK Parking Logo" className="logo" />

        <div className="header">
          <h2>System Access</h2>
          <p>Secure terminal for fleet and infrastructure controllers</p>
        </div>

        <input type="text" placeholder="Username" />

        <div className="password-box">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Access Key"
          />
          <span
            className="eye-icon material-symbols-outlined"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "visibility_off" : "visibility"}
          </span>
        </div>

        <div className="options">
          <a href="/">Recover Key</a>
        </div>

        <button onClick={() => navigate("/dashboard")}>Login →</button>

        <div className="footer-text">AES-256 ENCRYPTED • SYSTEMS NOMINAL</div>
      </div>
    </div>
  );
}

export default Login;