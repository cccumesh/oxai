import { SETTINGS } from "./seed.js";
import * as db from "./db.js?v=64";
import { getSession, setSession, clearSession, makeDriverKey, normalizeUsername, getPhoneId } from "./auth.js?v=64";
import { t, dateLocale } from "./i18n.js?v=64";

const DEVICE_KEY = "sa-device-id";
const SETTINGS_KEY = "sanjay-aqua-settings";

function pad(n) {
  return String(n).padStart(2, "0");
}

export function formatDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDate(str) {
  const [y, m, day] = str.split("-").map(Number);
  return new Date(y, m - 1, day);
}

export function displayDate(str) {
  const d = parseDate(str);
  return d.toLocaleDateString(dateLocale(), {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function emptyEntry(customer) {
  return {
    customerId: customer.id,
    driverId: customer.device_id,
    jarsGiven: 0,
    emptyCollected: 0,
    status: "pending",
    completedAt: null,
  };
}

function loadSettings() {
  try {
    return {
      ...SETTINGS,
      ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"),
      dayStartHour: SETTINGS.dayStartHour,
      dayDurationHours: SETTINGS.dayDurationHours,
    };
  } catch {
    return { ...SETTINGS };
  }
}

const state = {
  ready: false,
  error: "",
  needsConfig: false,
  needsAuth: false,
  needsSetup: false,
  setupRole: "driver",
  device: null,
  org: null,
  customers: [],
  days: {},
  settings: loadSettings(),
  owner: {
    drivers: [],
    customers: [],
    today: [],
    month: [],
    tripsToday: [],
    tripsMonth: [],
    rangeDeliveries: [],
    rangeTrips: [],
    allJarRows: [],
    payments: [],
  },
  trips: {},
};

export function getDeviceId() {
  const session = getSession();
  if (session?.deviceId) return session.deviceId;
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function getOrg() {
  return state.org;
}

export function getFirmName() {
  return state.org?.firmName || state.device?.name || "Aqua Jar";
}

function orgId() {
  return state.org?.id || getSession()?.orgId || null;
}

export function getState() {
  return state;
}

export function businessDate(now = new Date()) {
  const start = state.settings.dayStartHour ?? 0;
  const d = new Date(now);
  if (d.getHours() < start) d.setDate(d.getDate() - 1);
  return formatDate(d);
}

export function dayWindow(dateStr) {
  const startHour = state.settings.dayStartHour ?? 0;
  const hours = state.settings.dayDurationHours ?? 24;
  const start = parseDate(dateStr);
  start.setHours(startHour, 0, 0, 0);
  const end = new Date(start.getTime() + hours * 3600 * 1000);
  return { start, end };
}

export function remainingMs(dateStr, now = new Date()) {
  const { end } = dayWindow(dateStr);
  return end.getTime() - now.getTime();
}

function buildDay(dateStr, customers, rows) {
  const entries = {};
  const routeOrder = [];
  const byKey = {};
  for (const r of rows || []) byKey[r.customer_id] = r;
  for (const c of customers) {
    const r = byKey[c.id];
    entries[c.id] = r
      ? {
          customerId: c.id,
          driverId: c.device_id,
          jarsGiven: r.jars_given || 0,
          emptyCollected: r.empty_collected || 0,
          status: r.status || "pending",
          completedAt: r.completed_at ? new Date(r.completed_at).getTime() : null,
        }
      : emptyEntry(c);
    routeOrder.push(c.id);
  }
  return { date: dateStr, entries, routeOrder: { self: routeOrder } };
}

export async function load(opts = {}) {
  state.error = "";
  state.needsAuth = false;
  state.needsSetup = false;
  state.needsConfig = !db.isConfigured();
  if (state.needsConfig) {
    state.ready = true;
    return state;
  }
  const roleWanted = opts.roleWanted || "driver";
  state.setupRole = roleWanted;
  try {
    const session = getSession();
    if (!session) {
      state.needsAuth = true;
      state.device = null;
      state.org = null;
      state.ready = true;
      return state;
    }
    db.useAuthToken(session.token);
    getPhoneId();
    let device = null;
    try {
      device = await db.fetchDevice(session.deviceId);
    } catch {}
    if (!device && session.role === "owner") {
      device = await db.listOwnerDevice(session.orgId);
      if (!device) {
        device = await db.insertDevice({
          id: session.deviceId || crypto.randomUUID(),
          name: session.firmName || "Plant",
          role: "owner",
          org_id: session.orgId,
          login_key: "",
        });
      }
      setSession({ ...session, deviceId: device.id });
    }
    if (!device) {
      const me = await db.whoami();
      if (!me?.missing && !me?.org_id) {
        clearSession();
        db.useAuthToken("");
        state.needsAuth = true;
        state.device = null;
        state.org = null;
        state.ready = true;
        return state;
      }
      device = {
        id: session.deviceId || me.device_id,
        name: session.driverName || session.firmName || me.firm_name,
        role: session.role,
        org_id: session.orgId || me.org_id,
      };
    }
    await db.bindDevice(device.id);
    if (roleWanted === "owner" && session.role !== "owner") {
      state.error = t("err_role");
      state.device = device;
      state.org = { id: session.orgId, username: session.username, firmName: session.firmName };
      state.ready = true;
      return state;
    }
    state.device = device;
    state.org = { id: session.orgId, username: session.username, firmName: session.firmName };
    if (!(session.role === "owner" || roleWanted === "owner")) {
      await loadDriver(businessDate());
    }
    state.ready = true;
  } catch (err) {
    state.error = err.message || t("err_net");
    state.ready = true;
  }
  return state;
}

async function loadDriver(dateStr) {
  const deviceId = state.device.id;
  state.customers = (await db.listCustomers(deviceId)).map(mapCustomer);
  const rows = await db.listDeliveries(deviceId, dateStr);
  state.days[dateStr] = buildDay(dateStr, state.customers, rows);
  const trip = await db.fetchTrip(deviceId, dateStr);
  state.trips[dateStr] = mapTrip(trip);
}

function mapTrip(trip) {
  return {
    filledOut: trip?.filled_out || 0,
    filledBack: trip?.filled_back || 0,
    wasteJars: trip?.waste_jars || 0,
    leakJars: trip?.leak_jars || 0,
    brokeJars: trip?.broke_jars || 0,
    rokdaJars: trip?.rokda_jars || 0,
    returnedJars: trip?.returned_jars || 0,
    loadConfirmed: false,
  };
}

function emptyTrip() {
  return { filledOut: 0, filledBack: 0, wasteJars: 0, leakJars: 0, brokeJars: 0, rokdaJars: 0, returnedJars: 0, loadConfirmed: false };
}

export function tripLoss(trip) {
  const leak = Number(trip?.leakJars) || 0;
  const broke = Number(trip?.brokeJars) || 0;
  return {
    leak,
    broke,
    total: leak + broke,
  };
}

function mapPayment(p) {
  return {
    id: p.id,
    customer_id: p.customer_id,
    amount: Number(p.amount) || 0,
    for_month: p.for_month || "",
    paid_on: p.paid_on,
    note: p.note || "",
    created_at: p.created_at,
  };
}

export async function loadOwnerRange(fromDate, toDate) {
  const oid = orgId();
  const [drivers, customers, deliveries, trips, jarRows, payments] = await Promise.all([
    db.listDrivers(oid),
    db.listCustomers(null, { all: true, orgId: oid }),
    db.listDeliveriesRange(fromDate, toDate, { orgId: oid }),
    db.listTripsRange(fromDate, toDate, null, oid),
    db.listDeliveryJarRows(oid).catch(() => []),
    db.listPayments(oid).catch(() => []),
  ]);
  state.owner.drivers = drivers || [];
  state.owner.customers = (customers || []).map(mapCustomer);
  state.owner.rangeDeliveries = deliveries || [];
  state.owner.rangeTrips = trips || [];
  state.owner.allJarRows = jarRows || [];
  state.owner.payments = (payments || []).map(mapPayment);
}

export async function addPayment(customerId, { amount, forMonth, paidOn, note }) {
  const rupees = Number(amount) || 0;
  if (rupees <= 0) throw new Error(t("err_amt"));
  if (!forMonth) throw new Error(t("err_mon"));
  const row = await db.insertPayment({
    customer_id: customerId,
    org_id: orgId(),
    amount: rupees,
    for_month: forMonth,
    paid_on: paidOn || businessDate(),
    note: note || "",
  });
  state.owner.payments = [mapPayment(row), ...(state.owner.payments || [])];
  return row;
}

export async function removePayment(id) {
  await db.deletePayment(id);
  state.owner.payments = (state.owner.payments || []).filter((p) => p.id !== id);
}

export function ownerCustomerPeriodJars(customerId) {
  return (state.owner.rangeDeliveries || [])
    .filter((r) => r.customer_id === customerId && r.status === "complete")
    .reduce((s, r) => s + (r.jars_given || 0), 0);
}

export function ownerCustomerMoney(customerId) {
  const rate = Number(getCustomer(customerId)?.jarRate) || 0;
  const jarsAll = (state.owner.allJarRows || [])
    .filter((r) => r.customer_id === customerId)
    .reduce((s, r) => s + (Number(r.jars_given) || 0), 0);
  const billed = jarsAll * rate;
  const payments = (state.owner.payments || []).filter((p) => p.customer_id === customerId);
  const paid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  return { jarsAll, billed, paid, due: billed - paid, payments };
}

export function monthLabel(ym) {
  if (!ym || String(ym).length < 7) return ym || "—";
  const [y, m] = String(ym).split("-").map(Number);
  if (!y || !m) return ym;
  return new Date(y, m - 1, 1).toLocaleDateString(dateLocale(), { month: "short", year: "numeric" });
}

function ymd(v) {
  return String(v || "").slice(0, 10);
}

export function ownerBalanceSheet(range) {
  const s = ownerPeriodStats();
  const customers = state.owner.customers || [];
  const drivers = state.owner.drivers || [];
  const from = range?.from || "";
  const to = range?.to || "";

  let periodJars = 0;
  let periodSales = 0;
  for (const r of state.owner.rangeDeliveries || []) {
    if (r.status !== "complete") continue;
    const jars = Number(r.jars_given) || 0;
    const rate = Number(getCustomer(r.customer_id)?.jarRate) || 0;
    periodJars += jars;
    periodSales += jars * rate;
  }

  const periodPays = (state.owner.payments || [])
    .filter((p) => {
      const d = ymd(p.paid_on);
      return d >= from && d <= to;
    })
    .map((p) => ({
      ...p,
      customerName: getCustomer(p.customer_id)?.name || "Customer",
    }));
  const periodCollected = periodPays.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  let billedAll = 0;
  let paidAll = 0;
  let receivable = 0;
  let advance = 0;
  const debtors = [];
  for (const c of customers) {
    const m = ownerCustomerMoney(c.id);
    billedAll += m.billed;
    paidAll += m.paid;
    if (m.due > 0.009) {
      receivable += m.due;
      debtors.push({
        id: c.id,
        name: c.name,
        place: c.place || "",
        due: m.due,
        driver: drivers.find((d) => d.id === c.device_id)?.name || "—",
      });
    } else if (m.due < -0.009) {
      advance += -m.due;
    }
  }
  debtors.sort((a, b) => b.due - a.due);

  const byDriver = drivers.map((d) => {
    const cust = customers.filter((c) => c.device_id === d.id);
    let due = 0;
    for (const c of cust) due += Math.max(0, ownerCustomerMoney(c.id).due);
    const dStat = (s.byDriver || []).find((x) => x.id === d.id);
    return {
      id: d.id,
      name: d.name,
      due,
      periodJars: dStat?.jars || 0,
      pendingJars: dStat?.pending || 0,
      rokda: dStat?.rokda || 0,
      leak: dStat?.leak || 0,
      broke: dStat?.broke || 0,
    };
  }).filter((d) => d.due || d.periodJars || d.pendingJars);

  const collectedPct = billedAll > 0 ? Math.min(100, Math.round((paidAll / billedAll) * 100)) : 0;
  const equity = receivable - advance;

  return {
    asOn: to,
    periodJars,
    periodSales,
    periodCollected,
    periodPays: periodPays.slice(0, 10),
    billedAll,
    paidAll,
    receivable,
    advance,
    equity,
    assets: receivable,
    liabEquity: advance + equity,
    collectedPct,
    debtors: debtors.slice(0, 14),
    debtorCount: debtors.length,
    byDriver,
    jars: {
      filledOut: s.filledOut || 0,
      credit: s.jarsToCustomers || 0,
      rokda: s.rokda || 0,
      sold: (s.jarsToCustomers || 0) + (s.rokda || 0),
      leak: s.leak || 0,
      broke: s.broke || 0,
      empty: s.empty || 0,
      filledBack: s.filledBack || 0,
      pendingMarket: s.pendingMarket || 0,
      remaining: s.remaining || 0,
    },
  };
}

async function loadOwner(dateStr) {
  const d = parseDate(dateStr);
  const from = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
  await loadOwnerRange(from, dateStr);
}

const TRIP_FIELDS = new Set(["filledOut", "filledBack", "wasteJars", "leakJars", "brokeJars", "rokdaJars", "returnedJars"]);

function loadOkKey(dateStr) {
  return `sa-load-ok:${state.device?.id || "x"}:${dateStr}`;
}

function readLoadOk(dateStr) {
  try { return localStorage.getItem(loadOkKey(dateStr)) === "1"; } catch { return false; }
}

function writeLoadOk(dateStr, on) {
  try {
    if (on) localStorage.setItem(loadOkKey(dateStr), "1");
    else localStorage.removeItem(loadOkKey(dateStr));
  } catch { /* ignore */ }
}

function routeAlreadyStarted(dateStr) {
  return Object.values(getDay(dateStr).entries || {}).some(
    (e) => e.status === "complete" || (e.jarsGiven || 0) > 0 || (e.emptyCollected || 0) > 0
  );
}

export function getTrip(dateStr) {
  if (!state.trips[dateStr]) state.trips[dateStr] = emptyTrip();
  if (state.trips[dateStr].loadConfirmed || readLoadOk(dateStr) || routeAlreadyStarted(dateStr)) {
    state.trips[dateStr].loadConfirmed = true;
  }
  return state.trips[dateStr];
}

export function isLoadConfirmed(dateStr) {
  return !!getTrip(dateStr).loadConfirmed;
}

export function confirmLoad(dateStr) {
  if (!canEditWorkDate(dateStr)) return;
  const trip = { ...getTrip(dateStr), loadConfirmed: true };
  state.trips[dateStr] = trip;
  writeLoadOk(dateStr, true);
}

export function vehicleStock(dateStr) {
  const trip = getTrip(dateStr);
  const day = getDay(dateStr);
  const delivered = Object.values(day.entries || {})
    .filter((e) => e.status === "complete")
    .reduce((s, e) => s + (e.jarsGiven || 0), 0);
  const rokda = Number(trip.rokdaJars) || 0;
  const loss = tripLoss(trip);
  const sold = delivered + rokda;
  const remaining = trip.filledOut - sold - loss.leak - loss.broke;
  return {
    filledOut: trip.filledOut,
    delivered,
    rokda,
    sold,
    waste: loss.total,
    leak: loss.leak,
    broke: loss.broke,
    leakEmpty: loss.leak,
    remaining,
    filledBack: trip.filledBack,
    returned: trip.returnedJars || 0,
  };
}

export function returnExpect(dateStr) {
  const stock = vehicleStock(dateStr);
  const stats = dayStats(dateStr);
  const filledShould = Math.max(0, stock.remaining);
  const shopEmpty = stats.empty || 0;
  const leakEmpty = stock.leak || 0;
  const emptyShould = shopEmpty + leakEmpty;
  const extraShop = shopEmpty - stock.sold;
  return {
    ...stock,
    emptyCollected: shopEmpty,
    shopEmpty,
    leakEmpty,
    extraShop,
    filledShould,
    emptyShould,
    totalShould: filledShould + emptyShould,
    returned: stock.returned || 0,
  };
}

const persistTimers = {};
const persistSaving = {};

function queuePersist(key, fn, ms = 280) {
  persistSaving[key] = true;
  clearTimeout(persistTimers[key]);
  persistTimers[key] = setTimeout(async () => {
    try {
      await fn();
    } catch (err) {
      console.error(err);
      alert(err.message || err);
    } finally {
      persistSaving[key] = false;
    }
  }, ms);
}

function queuePersistEntry(dateStr, customerId, afterSave) {
  queuePersist(`e:${dateStr}:${customerId}`, async () => {
    await persistEntry(dateStr, customerId);
    if (afterSave) await afterSave();
  }, afterSave ? 60 : 280);
}

function applyLocalPending(customerId, given, picked, sign) {
  const c = getCustomer(customerId);
  if (!c) return;
  c.pendingJars = Math.max(0, (c.pendingJars || 0) + sign * ((given || 0) - (picked || 0)));
}

async function refreshPendingAndWapas(dateStr, customerId) {
  const pending = await db.recomputePending(customerId);
  const c = getCustomer(customerId);
  if (c) c.pendingJars = pending;
  await syncWapasFromStock(dateStr);
}

function queuePersistTrip(dateStr) {
  queuePersist(`t:${dateStr}`, async () => {
    await persistTrip(dateStr);
  });
}

function syncWapasLocal(dateStr) {
  const day = getDay(dateStr);
  const entries = Object.values(day.entries || {});
  if (!entries.length || entries.some((e) => e.status !== "complete")) return;
  const trip = { ...getTrip(dateStr) };
  const wapas = Math.max(0, vehicleStock(dateStr).remaining);
  if (trip.filledBack === wapas) return;
  trip.filledBack = wapas;
  state.trips[dateStr] = trip;
}

export function bumpTrip(dateStr, field, delta) {
  if (!canEditWorkDate(dateStr)) return;
  if (!TRIP_FIELDS.has(field)) return;
  const trip = { ...getTrip(dateStr) };
  trip[field] = Math.max(0, (Number(trip[field]) || 0) + Number(delta));
  state.trips[dateStr] = trip;
  if (field !== "filledBack" && field !== "returnedJars") syncWapasLocal(dateStr);
  queuePersistTrip(dateStr);
}

export function setTripCount(dateStr, field, value) {
  if (!canEditWorkDate(dateStr)) return;
  if (!TRIP_FIELDS.has(field)) return;
  const trip = { ...getTrip(dateStr) };
  trip[field] = Math.max(0, Math.min(9999, Number(value) || 0));
  state.trips[dateStr] = trip;
  if (field !== "filledBack" && field !== "returnedJars") syncWapasLocal(dateStr);
  queuePersistTrip(dateStr);
}

export async function syncWapasFromStock(dateStr) {
  if (!canEditWorkDate(dateStr)) return;
  const day = getDay(dateStr);
  const entries = Object.values(day.entries || {});
  if (!entries.length || entries.some((e) => e.status !== "complete")) return;
  const trip = { ...getTrip(dateStr) };
  const stock = vehicleStock(dateStr);
  const wapas = Math.max(0, stock.remaining);
  if (trip.filledBack === wapas) return;
  trip.filledBack = wapas;
  state.trips[dateStr] = trip;
  await persistTrip(dateStr);
}

async function persistTrip(dateStr) {
  if (!state.device || !canEditWorkDate(dateStr)) return;
  for (let i = 0; i < 4; i++) {
    const trip = getTrip(dateStr);
    const stamp = JSON.stringify(trip);
    const loss = tripLoss(trip);
    await db.upsertTrip({
      device_id: state.device.id,
      org_id: orgId(),
      work_date: dateStr,
      filled_out: trip.filledOut,
      filled_back: trip.filledBack,
      leak_jars: trip.leakJars || 0,
      broke_jars: trip.brokeJars || 0,
      rokda_jars: trip.rokdaJars || 0,
      returned_jars: trip.returnedJars || 0,
      waste_jars: loss.total,
    });
    if (JSON.stringify(getTrip(dateStr)) === stamp) break;
  }
}

function mapCustomer(c) {
  return {
    id: c.id,
    name: c.name,
    driverId: c.device_id,
    device_id: c.device_id,
    usualJars: c.usual_jars,
    place: c.place || "",
    routeOrder: c.sequence,
    pendingJars: c.pending_jars || 0,
    jarRate: Number(c.jar_rate) || 0,
    active: c.active,
  };
}

export async function signupOwner({ username, firmName, password }) {
  const org = await db.signupOrg(normalizeUsername(username), firmName, password);
  db.useAuthToken(org.session_token);
  let device = await db.listOwnerDevice(org.org_id);
  if (!device) {
    device = await db.insertDevice({
      id: crypto.randomUUID(),
      name: org.firm_name,
      role: "owner",
      org_id: org.org_id,
      login_key: "",
    });
  }
  setSession({
    role: "owner",
    orgId: org.org_id,
    username: org.username,
    firmName: org.firm_name,
    deviceId: device.id,
    token: org.session_token,
    phoneId: getPhoneId(),
  });
  await db.bindDevice(device.id);
  state.needsAuth = false;
  state.device = device;
  state.org = { id: org.org_id, username: org.username, firmName: org.firm_name };
  return getSession();
}

export async function loginOwner({ username, password }) {
  const org = await db.loginOrg(normalizeUsername(username), password);
  db.useAuthToken(org.session_token);
  let device = await db.listOwnerDevice(org.org_id);
  if (!device) {
    device = await db.insertDevice({
      id: crypto.randomUUID(),
      name: org.firm_name,
      role: "owner",
      org_id: org.org_id,
      login_key: "",
    });
  }
  setSession({
    role: "owner",
    orgId: org.org_id,
    username: org.username,
    firmName: org.firm_name,
    deviceId: device.id,
    token: org.session_token,
    phoneId: getPhoneId(),
  });
  await db.bindDevice(device.id);
  state.needsAuth = false;
  state.device = device;
  state.org = { id: org.org_id, username: org.username, firmName: org.firm_name };
  return getSession();
}

export async function loginDriverAccount({ username, key }) {
  const row = await db.loginDriver(normalizeUsername(username), key);
  db.useAuthToken(row.session_token);
  setSession({
    role: "driver",
    orgId: row.org_id,
    username: row.username,
    firmName: row.firm_name,
    deviceId: row.device_id,
    driverName: row.driver_name,
    token: row.session_token,
    phoneId: getPhoneId(),
  });
  await db.bindDevice(row.device_id);
  state.needsAuth = false;
  state.org = { id: row.org_id, username: row.username, firmName: row.firm_name };
  state.device = await db.fetchDevice(row.device_id);
  await loadDriver(businessDate());
  return getSession();
}

export async function addDriverAccount(name) {
  const oid = orgId();
  if (!oid) throw new Error(t("err_own"));
  const key = makeDriverKey();
  const row = await db.insertDevice({
    id: crypto.randomUUID(),
    name: String(name || "").trim(),
    role: "driver",
    org_id: oid,
    login_key: key,
  });
  state.owner.drivers = [...(state.owner.drivers || []), row];
  return { ...row, login_key: key };
}

export async function ensureDriverKey(driverId) {
  const d = (state.owner.drivers || []).find((x) => x.id === driverId);
  if (d?.login_key) return d.login_key;
  const key = makeDriverKey();
  const row = await db.updateDevice(driverId, { login_key: key });
  if (d) d.login_key = key;
  return row.login_key || key;
}

export async function logout() {
  await db.logoutSession();
  clearSession();
  state.device = null;
  state.org = null;
  state.customers = [];
  state.days = {};
  state.trips = {};
  state.owner.drivers = [];
  state.owner.customers = [];
  state.needsAuth = true;
}

export function getDriver() {
  return state.device
    ? { id: state.device.id, name: state.device.name, color: "#0891b2" }
    : null;
}

export async function renameDriver(name) {
  if (!state.device) return;
  state.device = await db.updateDevice(state.device.id, { name: name.trim() });
}

export function getCustomer(id) {
  return state.customers.find((c) => c.id === id) || state.owner.customers.find((c) => c.id === id);
}

export function getDay(dateStr) {
  return state.days[dateStr] || buildDay(dateStr, state.customers, []);
}

export function pendingIds(dateStr) {
  const day = getDay(dateStr);
  return (day.routeOrder.self || []).filter((id) => day.entries[id]?.status !== "complete");
}

export function completeIds(dateStr) {
  const day = getDay(dateStr);
  return Object.values(day.entries)
    .filter((e) => e.status === "complete")
    .sort((a, b) => (a.completedAt || 0) - (b.completedAt || 0))
    .map((e) => e.customerId);
}

export function routeIds(dateStr) {
  return getDay(dateStr).routeOrder.self || state.customers.map((c) => c.id);
}

async function persistEntry(dateStr, customerId) {
  if (!canEditWorkDate(dateStr)) return;
  const c = getCustomer(customerId);
  const e = getDay(dateStr).entries[customerId];
  if (!c || !e || !state.device) return;
  for (let i = 0; i < 4; i++) {
    const stamp = `${e.jarsGiven}|${e.emptyCollected}|${e.status}|${e.completedAt}`;
    await db.upsertDelivery({
      device_id: state.device.id,
      org_id: orgId(),
      customer_id: customerId,
      work_date: dateStr,
      jars_given: e.jarsGiven,
      empty_collected: e.emptyCollected,
      status: e.status,
      completed_at: e.completedAt ? new Date(e.completedAt).toISOString() : null,
      updated_at: new Date().toISOString(),
    });
    const n = getDay(dateStr).entries[customerId];
    if (!n || `${n.jarsGiven}|${n.emptyCollected}|${n.status}|${n.completedAt}` === stamp) break;
  }
}

export function bump(dateStr, customerId, field, delta) {
  if (!canEditWorkDate(dateStr)) return;
  const e = getDay(dateStr).entries[customerId];
  if (!e) return;
  e[field] = Math.max(0, Math.min(999, (e[field] || 0) + delta));
  queuePersistEntry(dateStr, customerId);
}

export function setCount(dateStr, customerId, field, value) {
  if (!canEditWorkDate(dateStr)) return;
  const e = getDay(dateStr).entries[customerId];
  if (!e) return;
  e[field] = Math.max(0, Math.min(999, Number(value) || 0));
  queuePersistEntry(dateStr, customerId);
}

export function fillUsual(dateStr, customerId) {
  if (!canEditWorkDate(dateStr)) return;
  const c = getCustomer(customerId);
  const e = getDay(dateStr).entries[customerId];
  if (!c || !e) return;
  e.jarsGiven = c.usualJars || 1;
  queuePersistEntry(dateStr, customerId);
}

export function markComplete(dateStr, customerId) {
  if (!canEditWorkDate(dateStr)) return;
  const e = getDay(dateStr).entries[customerId];
  if (!e || e.status === "complete") return;
  e.status = "complete";
  e.completedAt = Date.now();
  applyLocalPending(customerId, e.jarsGiven, e.emptyCollected, 1);
  syncWapasLocal(dateStr);
  queuePersistEntry(dateStr, customerId, () => refreshPendingAndWapas(dateStr, customerId));
}

export function markPending(dateStr, customerId) {
  if (!canEditWorkDate(dateStr)) return;
  const e = getDay(dateStr).entries[customerId];
  if (!e || e.status !== "complete") return;
  applyLocalPending(customerId, e.jarsGiven, e.emptyCollected, -1);
  e.status = "pending";
  e.completedAt = null;
  queuePersistEntry(dateStr, customerId, () => refreshPendingAndWapas(dateStr, customerId));
}

export async function setRouteOrder(dateStr, _driverId, orderedIds) {
  const day = getDay(dateStr);
  day.routeOrder.self = orderedIds.slice();
  await Promise.all(
    orderedIds.map((id, i) => {
      const c = getCustomer(id);
      if (c) c.routeOrder = i;
      return db.updateCustomerRow(id, { sequence: i });
    })
  );
}

export async function moveRoute(dateStr, _driverId, customerId, dir) {
  const ids = pendingIds(dateStr);
  const i = ids.indexOf(customerId);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) return;
  const a = ids[i];
  ids[i] = ids[j];
  ids[j] = a;
  const done = completeIds(dateStr);
  await setRouteOrder(dateStr, null, [...ids, ...done]);
}

export async function moveSequence(dateStr, _driverId, customerId, dir) {
  const ids = routeIds(dateStr);
  const i = ids.indexOf(customerId);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) return;
  const swap = ids[i];
  ids[i] = ids[j];
  ids[j] = swap;
  await setRouteOrder(dateStr, null, ids);
}

export async function addCustomer({ name, place }) {
  const deviceId = state.device.id;
  const row = await db.insertCustomer({
    device_id: deviceId,
    org_id: orgId(),
    name: name.trim(),
    place: (place || "").trim(),
    usual_jars: 1,
    sequence: state.customers.length,
    pending_jars: 0,
    jar_rate: 0,
    active: true,
  });
  const mapped = mapCustomer(row);
  state.customers.push(mapped);
  const today = businessDate();
  if (!state.days[today]) state.days[today] = buildDay(today, state.customers, []);
  state.days[today].entries[mapped.id] = emptyEntry(mapped);
  state.days[today].routeOrder.self.push(mapped.id);
  await persistEntry(today, mapped.id);
  return mapped;
}

export async function updateCustomer(id, patch) {
  const c = getCustomer(id);
  if (!c) return;
  const body = {
    name: patch.name ?? c.name,
    place: patch.place ?? c.place ?? "",
  };
  if (patch.rate != null && patch.rate !== "") {
    body.jar_rate = Math.max(0, Number(patch.rate) || 0);
  }
  const row = await db.updateCustomerRow(id, body);
  Object.assign(c, mapCustomer(row));
}

export async function deactivateCustomer(id) {
  await db.updateCustomerRow(id, { active: false });
  state.customers = state.customers.filter((c) => c.id !== id);
  state.owner.customers = state.owner.customers.filter((c) => c.id !== id);
}

export function dayStats(dateStr) {
  const day = getDay(dateStr);
  const entries = Object.values(day.entries || {});
  const complete = entries.filter((e) => e.status === "complete");
  return {
    total: entries.length,
    done: complete.length,
    pending: entries.filter((e) => e.status !== "complete").length,
    jars: complete.reduce((s, e) => s + (e.jarsGiven || 0), 0),
    empty: complete.reduce((s, e) => s + (e.emptyCollected || 0), 0),
    marketPending: state.customers.reduce((s, c) => s + (c.pendingJars || 0), 0),
  };
}

export const DRIVER_EDIT_DAYS = 3;

export function lastWorkDates(count = DRIVER_EDIT_DAYS) {
  const dates = [];
  const base = parseDate(businessDate());
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    dates.push(formatDate(d));
  }
  return dates;
}

export function canEditWorkDate(dateStr) {
  if (!dateStr) return false;
  return lastWorkDates().includes(dateStr);
}

export async function listDays() {
  const dates = await db.deliveryDates(state.device?.id);
  const today = businessDate();
  if (!dates.includes(today)) dates.unshift(today);
  return dates;
}

export function periodRange(period = "today", monthKey = "") {
  const today = businessDate();
  const d = parseDate(today);
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  if (period === "today") return { from: today, to: today, label: t("today"), period: "today" };
  if (period === "month") {
    return {
      from: `${y}-${m}-01`,
      to: today,
      label: d.toLocaleDateString(dateLocale(), { month: "long", year: "numeric" }),
      period: "month",
    };
  }
  if (period === "year") {
    return { from: `${y}-01-01`, to: today, label: t("year_n", { n: y }), period: "year" };
  }
  if (period === "m" && monthKey) {
    const [yy, mm] = monthKey.split("-").map(Number);
    const last = new Date(yy, mm, 0);
    let to = formatDate(last);
    if (to > today) to = today;
    return { from: `${monthKey}-01`, to, label: monthKey, period: "m", month: monthKey };
  }
  return { from: "2020-01-01", to: today, label: t("from_start"), period: "all" };
}

export function isMonthRegister(range) {
  return range?.period === "month" || range?.period === "m";
}

export function monthDayCols(range) {
  const today = businessDate();
  let y;
  let m;
  if (range?.period === "m" && range.month) {
    const parts = String(range.month).split("-").map(Number);
    y = parts[0];
    m = parts[1];
  } else {
    const d = parseDate(range?.from || today);
    y = d.getFullYear();
    m = d.getMonth() + 1;
  }
  const last = new Date(y, m, 0).getDate();
  const days = [];
  for (let i = 1; i <= last; i++) days.push(`${y}-${pad(m)}-${pad(i)}`);
  const label = new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  return { year: y, month: m, last, days, label };
}

export function ownerDriverRegister(driverId, range) {
  const cols = monthDayCols(range);
  const today = businessDate();
  const deliveries = (state.owner.rangeDeliveries || []).filter(
    (r) => r.device_id === driverId && r.status === "complete"
  );
  const byKey = {};
  for (const r of deliveries) {
    const key = `${r.customer_id}|${r.work_date}`;
    if (!byKey[key]) byKey[key] = { jars: 0, empty: 0 };
    byKey[key].jars += r.jars_given || 0;
    byKey[key].empty += r.empty_collected || 0;
  }
  const list = [];
  const seen = new Set();
  for (const c of state.owner.customers || []) {
    if (c.device_id !== driverId) continue;
    if (c.active === false) continue;
    list.push(c);
    seen.add(c.id);
  }
  for (const r of deliveries) {
    if (seen.has(r.customer_id)) continue;
    const c = getCustomer(r.customer_id);
    if (!c) continue;
    list.push(c);
    seen.add(c.id);
  }
  list.sort((a, b) => (a.routeOrder || 0) - (b.routeOrder || 0) || String(a.name).localeCompare(String(b.name)));
  const rows = list.map((c) => {
    const cells = cols.days.map((date) => byKey[`${c.id}|${date}`] || null);
    return {
      customer: c,
      cells,
      totalJar: cells.reduce((s, x) => s + (x?.jars || 0), 0),
      totalEmpty: cells.reduce((s, x) => s + (x?.empty || 0), 0),
    };
  });
  const foot = cols.days.map((_, i) => ({
    jars: rows.reduce((s, r) => s + (r.cells[i]?.jars || 0), 0),
    empty: rows.reduce((s, r) => s + (r.cells[i]?.empty || 0), 0),
  }));
  return {
    ...cols,
    today,
    rows,
    foot,
    totalJar: rows.reduce((s, r) => s + r.totalJar, 0),
    totalEmpty: rows.reduce((s, r) => s + r.totalEmpty, 0),
  };
}

function sumField(rows, field) {
  return (rows || []).reduce((s, r) => s + (r[field] || 0), 0);
}

export function ownerPeriodStats() {
  const deliveries = (state.owner.rangeDeliveries || []).filter((r) => r.status === "complete");
  const trips = state.owner.rangeTrips || [];
  const pendingMarket = state.owner.customers.reduce((s, c) => s + (c.pendingJars || 0), 0);
  const byDriver = state.owner.drivers.map((d) => {
    const rows = deliveries.filter((r) => r.device_id === d.id);
    const dTrips = trips.filter((t) => t.device_id === d.id);
    const cust = state.owner.customers.filter((c) => c.device_id === d.id);
    return {
      id: d.id,
      name: d.name,
      jars: sumField(rows, "jars_given"),
      empty: sumField(rows, "empty_collected"),
      filledOut: sumField(dTrips, "filled_out"),
      filledBack: sumField(dTrips, "filled_back"),
      waste: tripLossTotal(dTrips),
      leak: sumField(dTrips, "leak_jars"),
      broke: sumField(dTrips, "broke_jars"),
      rokda: sumField(dTrips, "rokda_jars"),
      pending: cust.reduce((s, c) => s + (c.pendingJars || 0), 0),
      stops: rows.length,
      ...plantReturnSummary(plantByDate(dTrips, rows)),
    };
  });
  const filledOut = sumField(trips, "filled_out");
  const filledBack = sumField(trips, "filled_back");
  const waste = tripLossTotal(trips);
  const leak = sumField(trips, "leak_jars");
  const broke = sumField(trips, "broke_jars");
  const rokda = sumField(trips, "rokda_jars");
  const jarsToCustomers = sumField(deliveries, "jars_given");
  const returns = plantReturnSummary(plantByDate(trips, deliveries));
  return {
    filledOut,
    filledBack,
    waste,
    leak,
    broke,
    rokda,
    empty: sumField(deliveries, "empty_collected"),
    jarsToCustomers,
    remaining: filledOut - jarsToCustomers - rokda - waste,
    netPlant: filledOut - filledBack,
    pendingMarket,
    byDriver,
    counted: returns.counted,
    expectTotal: returns.expectTotal,
    returnMismatch: returns.returnMismatch,
    owed: state.owner.customers.filter((c) => (c.pendingJars || 0) > 0).sort((a, b) => b.pendingJars - a.pendingJars),
    owedByDriver: ownerUdhariByDriver(),
  };
}

export function ownerUdhariByDriver() {
  const drivers = state.owner.drivers || [];
  const owed = (state.owner.customers || []).filter((c) => (c.pendingJars || 0) > 0);
  const groups = drivers.map((d) => {
    const list = owed.filter((c) => c.device_id === d.id).sort((a, b) => b.pendingJars - a.pendingJars);
    return {
      id: d.id,
      name: d.name,
      total: list.reduce((s, c) => s + (c.pendingJars || 0), 0),
      customers: list,
    };
  }).filter((g) => g.total > 0)
    .sort((a, b) => b.total - a.total);
  const known = new Set(drivers.map((d) => d.id));
  const leftover = owed.filter((c) => !known.has(c.device_id)).sort((a, b) => b.pendingJars - a.pendingJars);
  if (leftover.length) {
    groups.push({
      id: "other",
      name: "Aur customers",
      total: leftover.reduce((s, c) => s + (c.pendingJars || 0), 0),
      customers: leftover,
    });
  }
  return groups;
}

export function ownerLossByDriver() {
  const drivers = state.owner.drivers || [];
  const trips = state.owner.rangeTrips || [];
  const deliveries = (state.owner.rangeDeliveries || []).filter((r) => r.status === "complete");
  return drivers.map((d) => {
    const dTrips = trips.filter((t) => t.device_id === d.id);
    const rows = deliveries.filter((r) => r.device_id === d.id);
    const days = plantByDate(dTrips, rows)
      .filter((p) => (p.leak || 0) > 0 || (p.broke || 0) > 0)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
    return {
      id: d.id,
      name: d.name,
      leak: sumField(dTrips, "leak_jars"),
      broke: sumField(dTrips, "broke_jars"),
      days,
    };
  }).filter((g) => g.leak > 0 || g.broke > 0)
    .sort((a, b) => (b.leak + b.broke) - (a.leak + a.broke));
}

export function ownerDriverDetail(driverId) {
  const driver = state.owner.drivers.find((d) => d.id === driverId);
  const deliveries = (state.owner.rangeDeliveries || [])
    .filter((r) => r.device_id === driverId && r.status === "complete")
    .sort((a, b) => String(a.work_date).localeCompare(String(b.work_date)) || (a.completed_at || "").localeCompare(b.completed_at || ""));
  const trips = (state.owner.rangeTrips || []).filter((t) => t.device_id === driverId);
  const rows = deliveries.map((r) => {
    const c = getCustomer(r.customer_id);
    return {
      ...r,
      customerName: c?.name || "Customer",
      place: c?.place || "",
      time: r.completed_at
        ? new Date(r.completed_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
        : "",
    };
  });
  const dayPlant = plantByDate(trips, deliveries);
  return {
    driver,
    trips,
    rows,
    filledOut: sumField(trips, "filled_out"),
    filledBack: sumField(trips, "filled_back"),
    waste: tripLossTotal(trips),
    leak: sumField(trips, "leak_jars"),
    broke: sumField(trips, "broke_jars"),
    rokda: sumField(trips, "rokda_jars"),
    jars: sumField(deliveries, "jars_given"),
    empty: sumField(deliveries, "empty_collected"),
    dayPlant,
    ...plantReturnSummary(dayPlant),
  };
}

function plantExpect(d) {
  const leak = d.leak || 0;
  const remaining = (d.filledOut || 0) - (d.jars || 0) - (d.rokda || 0) - leak - (d.broke || 0);
  const filledShould = Math.max(0, remaining);
  const emptyShould = (d.empty || 0) + leak;
  return { remaining, filledShould, emptyShould, expectTotal: filledShould + emptyShould };
}

function plantReturnSummary(days) {
  const counted = (days || []).reduce((s, p) => s + (p.counted || 0), 0);
  const expectTotal = (days || []).reduce((s, p) => s + (p.expectTotal || 0), 0);
  return {
    counted,
    expectTotal,
    returnMismatch: (days || []).some((p) => p.mismatch),
  };
}

function tripLossTotal(trips) {
  return (trips || []).reduce((s, t) => s + (t.leak_jars || 0) + (t.broke_jars || 0), 0);
}

function plantByDate(trips, deliveries) {
  const byKey = {};
  for (const t of trips || []) {
    const leak = t.leak_jars || 0;
    const broke = t.broke_jars || 0;
    const key = `${t.device_id}|${t.work_date}`;
    byKey[key] = {
      date: t.work_date,
      deviceId: t.device_id,
      filledOut: t.filled_out || 0,
      filledBack: t.filled_back || 0,
      leak,
      broke,
      rokda: t.rokda_jars || 0,
      waste: leak + broke,
      returned: t.returned_jars || 0,
      jars: 0,
      empty: 0,
    };
  }
  for (const r of deliveries || []) {
    if (r.status && r.status !== "complete") continue;
    const key = `${r.device_id}|${r.work_date}`;
    if (!byKey[key]) {
      byKey[key] = { date: r.work_date, deviceId: r.device_id, filledOut: 0, filledBack: 0, leak: 0, broke: 0, rokda: 0, waste: 0, returned: 0, jars: 0, empty: 0 };
    }
    byKey[key].jars += r.jars_given || 0;
    byKey[key].empty += r.empty_collected || 0;
  }
  return Object.values(byKey)
    .map((d) => {
      const x = plantExpect(d);
      const counted = d.returned || 0;
      return {
        ...d,
        ...x,
        counted,
        mismatch: counted > 0 && counted !== x.expectTotal,
      };
    })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

export function rupee(n) {
  return (Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function threeWords(n) {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const h = Math.floor(n / 100);
  const r = n % 100;
  const parts = [];
  if (h) parts.push(ones[h] + " Hundred");
  if (r) {
    if (r < 10) parts.push(ones[r]);
    else if (r < 20) parts.push(teens[r - 10]);
    else parts.push(tens[Math.floor(r / 10)] + (r % 10 ? " " + ones[r % 10] : ""));
  }
  return parts.join(" ");
}

export function inrWords(amount) {
  const n = Math.round((Number(amount) || 0) * 100) / 100;
  const rupees = Math.floor(n);
  const paise = Math.round((n - rupees) * 100);
  if (!rupees && !paise) return "Rupees Zero Only";
  const crore = Math.floor(rupees / 1e7);
  const lakh = Math.floor((rupees % 1e7) / 1e5);
  const thousand = Math.floor((rupees % 1e5) / 1000);
  const rest = rupees % 1000;
  const parts = [];
  if (crore) parts.push(threeWords(crore) + " Crore");
  if (lakh) parts.push(threeWords(lakh) + " Lakh");
  if (thousand) parts.push(threeWords(thousand) + " Thousand");
  if (rest) parts.push(threeWords(rest));
  let out = "Rupees " + (parts.join(" ") || "Zero");
  if (paise) out += " and Paise " + threeWords(paise);
  return out + " Only";
}

export function billDate(str) {
  if (!str) return "—";
  const d = parseDate(str);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function ownerCustomerLedger(customerId) {
  const customer = getCustomer(customerId);
  const driver = state.owner.drivers.find((d) => d.id === customer?.device_id);
  const rows = (state.owner.rangeDeliveries || [])
    .filter((r) => r.customer_id === customerId && r.status === "complete")
    .sort((a, b) => String(a.work_date).localeCompare(String(b.work_date)));
  const byDate = {};
  for (const r of rows) {
    const key = r.work_date;
    if (!byDate[key]) byDate[key] = { date: key, jars: 0, empty: 0 };
    byDate[key].jars += r.jars_given || 0;
    byDate[key].empty += r.empty_collected || 0;
  }
  const lines = Object.values(byDate).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const jars = lines.reduce((s, l) => s + l.jars, 0);
  const empty = lines.reduce((s, l) => s + l.empty, 0);
  const rate = Number(customer?.jarRate) || 0;
  const money = ownerCustomerMoney(customerId);
  return {
    customer,
    driver,
    rows,
    lines,
    jars,
    empty,
    pending: customer?.pendingJars || 0,
    rate,
    amount: jars * rate,
    ...money,
  };
}

export function ownerStats() {
  return ownerPeriodStats();
}

export async function refreshDate(dateStr) {
  if (!state.device) return;
  if (state.device.role === "owner") await loadOwnerRange(dateStr, dateStr);
  else await loadDriver(dateStr);
}
