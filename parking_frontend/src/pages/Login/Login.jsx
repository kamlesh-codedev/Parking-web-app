import "./Login.css";
import RecoverKey from "./RecoveryKey.jsx";
import logo from "../../assets/kk-logo.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setLoggedIn } from "../../utils/auth";

const API_BASE_URL = "/api";

function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok && data.status === "success") {
        setLoggedIn();
        navigate("/dashboard");
      } else {
        setError(data.message || "Invalid username or password.");
      }
    } catch (err) {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="login-container">
      <div className="background-overlay"></div>
      <div className="login-card">
        <img src={logo} alt="KK Parking Logo" className="logo" />
        <div className="header">
          <h2>System Access</h2>
          <p>Secure terminal for fleet and infrastructure controllers</p>
        </div>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />

        <div className="password-box">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Access Key"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <span
            className="eye-icon material-symbols-outlined"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "visibility_off" : "visibility"}
          </span>
        </div>

        {error && (
          <div style={{ color: "#ff6b6b", fontSize: "13px", marginBottom: "12px" }}>
            {error}
          </div>
        )}
        <div className="options">
          <Route path="/recover-key" element = {<RecoverKey/>} />
        </div>

        <button onClick={handleLogin} disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login →"}
        </button>

        <div className="footer-text">AES-256 ENCRYPTED • SYSTEMS NOMINAL</div>
      </div>
    </div>
  );
}

export default Login;