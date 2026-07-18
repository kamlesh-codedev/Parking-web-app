import "./Login.css";
import "./RecoverKey.css";
import logo from "../../assets/kk-logo.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "/api";

function RecoverKey() {
  const navigate = useNavigate();

  // step 1 = enter username, step 2 = answer question + set new password
  const [step, setStep] = useState(1);

  const [username, setUsername] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleKeyDown = (e, nextAction) => {
    if (e.key === "Enter") nextAction();
  };

  const handleCheckUser = async () => {
    setError("");
    if (!username) {
      setError("Please enter your username.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login/check-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username }),
      });
      const data = await response.json();
      if (response.ok && data.status === "success") {
        setQuestion(data.question);
        setStep(2);
      } else {
        setError(data.message || "User not found.");
      }
    } catch (err) {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError("");
    if (!answer || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ answer, "new-password": newPassword }),
      });
      const data = await response.json();
      if (response.ok && data.status === "success") {
        setSuccess("Password changed successfully. Redirecting to login…");
        setTimeout(() => navigate("/"), 1800);
      } else {
        setError(data.message || "Wrong or invalid answer.");
      }
    } catch (err) {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="background-overlay"></div>
      <div className="login-card">
        <img src={logo} alt="KK Parking Logo" className="logo" />

        <div className="header">
          <h2>Recover Access Key</h2>
          <p>
            {step === 1
              ? "Verify your identity to begin recovery"
              : "Answer your security question to set a new key"}
          </p>
        </div>

        <div className="step-indicator">
          <span className={step === 1 ? "step active" : "step done"}>1</span>
          <span className="step-line"></span>
          <span className={step === 2 ? "step active" : "step"}>2</span>
        </div>

        {step === 1 && (
          <>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, handleCheckUser)}
              disabled={isLoading}
              autoFocus
            />
            {error && <div className="form-error">{error}</div>}
            <div className="options">
              <a href="/">Back to Login</a>
            </div>
            <button onClick={handleCheckUser} disabled={isLoading}>
              {isLoading ? "Checking…" : "Continue →"}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="security-question">{question}</div>
            <input
              type="text"
              placeholder="Your answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
            <div className="password-box">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New Access Key"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
              />
              <span
                className="eye-icon material-symbols-outlined"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm New Access Key"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, handleResetPassword)}
              disabled={isLoading}
            />
            {error && <div className="form-error">{error}</div>}
            {success && <div className="form-success">{success}</div>}
            <div className="options">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setStep(1);
                  setError("");
                }}
              >
                Use a different username
              </a>
            </div>
            <button onClick={handleResetPassword} disabled={isLoading || success}>
              {isLoading ? "Updating…" : "Reset Key →"}
            </button>
          </>
        )}

        <div className="footer-text">AES-256 ENCRYPTED • SYSTEMS NOMINAL</div>
      </div>
    </div>
  );
}

export default RecoverKey;