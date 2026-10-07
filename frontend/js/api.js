const API_URL = "https://clothing-store-8b1m.onrender.com";

function getToken() {
  return localStorage.getItem("token");
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "index.html";
}

async function login(email, password) {
  // backend OAuth2 formasini kutadi (JSON emas)
  const body = new URLSearchParams();
  body.append("username", email);
  body.append("password", password);

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Kirishda xatolik");
  }
  localStorage.setItem("token", data.access_token);
}

// Token bilan so'rov yuborish uchun umumiy funksiya
async function apiFetch(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    logout(); // token yaroqsiz bo'lsa, login sahifasiga qaytaramiz
    return;
  }
  if (res.status === 204) return null;

  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Xatolik yuz berdi");
  return data;
}