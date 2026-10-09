// Shared helpers for every protected page: token handling, nav bar, expiry countdown.
const Session = {
  get token() { return localStorage.getItem("token"); },
  save(token) { localStorage.setItem("token", token); },
  clear() { localStorage.removeItem("token"); },
  // A JWT is header.payload.signature; the payload is just base64url JSON (readable, NOT secret)
  get payload() {
    try {
      const b64 = this.token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(atob(b64));
    } catch { return null; }
  },
  get secondsLeft() { return this.payload ? this.payload.exp - Math.floor(Date.now() / 1000) : 0; },
};

function logout(reason) {
  Session.clear();
  window.location.href = "/index.html" + (reason ? `?reason=${encodeURIComponent(reason)}` : "");
}

// Call at the top of every protected page
function requireLogin() {
  if (!Session.token || Session.secondsLeft <= 0) logout(Session.token ? "Your session expired" : "");
}

// fetch() wrapper that attaches the token and handles 401s in one place
async function api(url) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${Session.token}` } });
  if (res.status === 401) { logout("Your session expired"); throw new Error("unauthorized"); }
  if (!res.ok) throw new Error((await res.json()).error || "Request failed");
  return res.json();
}

const initial = (name) => (name || "?").trim().charAt(0).toUpperCase();

function renderNav(active) {
  const links = [["dashboard", "Dashboard"], ["about", "About Me"], ["users", "Users"]];
  document.getElementById("nav").innerHTML = `
    <nav class="nav">
      <span class="brand">JWT&middot;AUTH</span>
      ${links.map(([id, label]) => `<a href="/${id}.html" class="${id === active ? "active" : ""}">${label}</a>`).join("")}
      <span class="pill" id="countdown"></span>
      <a href="#" id="logout">Log out</a>
    </nav>`;
  document.getElementById("logout").addEventListener("click", (e) => { e.preventDefault(); logout(); });

  // Live "session expires in" timer, driven by the token's exp claim
  const pill = document.getElementById("countdown");
  const tick = () => {
    const s = Session.secondsLeft;
    if (s <= 0) return logout("Your session expired");
    pill.textContent = `session ${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    pill.className = "pill" + (s < 30 ? " bad" : s < 120 ? " warn" : "");
  };
  tick();
  setInterval(tick, 1000);
}