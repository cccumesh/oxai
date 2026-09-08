const SESSION_KEY = "sa-session-v1";
const PHONE_KEY = "sa-phone-id";
const COOKIE_DAYS = 400;

function cookieOpts() {
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  return `; Max-Age=${COOKIE_DAYS * 86400}; Path=/; SameSite=Lax${secure}`;
}

function writeCookie(name, value) {
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}${cookieOpts()}`;
  } catch {}
}

function readCookie(name) {
  try {
    const parts = String(document.cookie || "").split("; ");
    for (const p of parts) {
      if (p.startsWith(`${name}=`)) return decodeURIComponent(p.slice(name.length + 1));
    }
  } catch {}
  return "";
}

function wipeCookie(name) {
  try {
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
  } catch {}
}

function readStore(key) {
  try {
    return localStorage.getItem(key) || readCookie(key) || "";
  } catch {
    return readCookie(key) || "";
  }
}

function writeStore(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
  writeCookie(key, value);
}

function wipeStore(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
  wipeCookie(key);
}

export function getPhoneId() {
  let id = readStore(PHONE_KEY);
  if (!id || id.length < 8) {
    id = (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : `ph-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
  writeStore(PHONE_KEY, id);
  return id;
}

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
    const raw = readStore(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s?.orgId || !s?.role || !s?.deviceId || !s?.token) return null;
    try {
      localStorage.setItem(SESSION_KEY, raw);
    } catch {}
    return s;
  } catch {
    return null;
  }
}

export function setSession(s) {
  const next = { ...s, phoneId: s.phoneId || getPhoneId() };
  writeStore(SESSION_KEY, JSON.stringify(next));
}

export function clearSession() {
  wipeStore(SESSION_KEY);
}
