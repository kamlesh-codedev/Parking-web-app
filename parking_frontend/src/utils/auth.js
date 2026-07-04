const AUTH_KEY = "kk_isLoggedIn";

export function setLoggedIn() {
  localStorage.setItem(AUTH_KEY, "true");
}

export function isLoggedIn() {
  return localStorage.getItem(AUTH_KEY) === "true";
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
}