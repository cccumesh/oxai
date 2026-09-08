const SESSION_KEY = "sa-session-v1";

export function normalizeUsername(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9._]/g, "")
    .replace(/\.+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

export function usernameSuggestions(raw, takenSet = new Set()) {
  const base = normalizeUsername(raw) || "aqua";
  const extras = [base, `${base}2`, `${base}3`, `${base}.aqua`, `${base}.plant`, `${base}1`];
  const out = [];
  for (const u of extras) {
    if (u.length < 3) continue;
    if (takenSet.has(u) && u === base) continue;
    if (!takenSet.has(u) && !out.includes(u)) out.push(u);
    if (out.length >= 4) break;
  }
  return out;
}

export function makeDriverKey() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `${s.slice(0, 4)}-${s.slice(4)}`;
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s?.orgId || !s?.role || !s?.deviceId || !s?.token) return null;
    return s;
  } catch {
    return null;
  }
}

export function setSession(s) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
