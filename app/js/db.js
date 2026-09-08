import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { getSupabaseUrl, getSupabaseAnonKey, hasSupabaseConfig } from "./config.js";
import { getSession } from "./auth.js";
import { t, serverMsg } from "./i18n.js";

let client = null;
let authToken = "";

export function isConfigured() {
  return hasSupabaseConfig();
}

function activeToken() {
  return authToken || getSession()?.token || "";
}

function authHeaders() {
  const token = activeToken();
  return token ? { "X-Client-Info": `sa-session ${token}` } : {};
}

export function useAuthToken(token) {
  authToken = String(token || "");
  resetClient();
}

export function getClient() {
  if (!hasSupabaseConfig()) return null;
  if (!client) {
    client = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      global: {
        headers: authHeaders(),
        fetch: (input, init = {}) => {
          const headers = new Headers(init.headers || {});
          const tok = activeToken();
          if (tok) headers.set("X-Client-Info", `sa-session ${tok}`);
          return fetch(input, { ...init, headers });
        },
      },
    });
  }
  return client;
}

let liveChannel = null;

export function resetClient() {
  stopOwnerLive();
  client = null;
}

export function stopOwnerLive() {
  if (liveChannel && client) {
    try { client.removeChannel(liveChannel); } catch {}
  }
  liveChannel = null;
}

export function subscribeOwnerLive(onChange) {
  stopOwnerLive();
  const c = getClient();
  if (!c) return;
  liveChannel = c
    .channel("sa-owner-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "sa_deliveries" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "sa_day_trips" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "sa_customers" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "sa_devices" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "sa_payments" }, onChange)
    .subscribe();
}

function denyMsg(err) {
  const m = String(err?.message || err || "");
  if (/row-level security|permission denied|JWT/i.test(m)) {
    return t("err_sess");
  }
  return serverMsg(m);
}

function ok(res) {
  if (res.error) throw new Error(denyMsg(res.error));
  return res.data;
}

function rpcErr(err) {
  const m = String(err?.message || err || "");
  if (/Could not find the function|schema cache/i.test(m)) {
    return new Error(t("err_fn"));
  }
  return new Error(denyMsg(err));
}

async function rpc(name, args) {
  const res = await getClient().rpc(name, args);
  if (res.error) throw rpcErr(res.error);
  let data = res.data;
  if (typeof data === "string") {
    try { data = JSON.parse(data); } catch {}
  }
  return data;
}

export async function usernameTaken(username) {
  return Boolean(await rpc("sa_username_taken", { p_username: username }));
}

export async function signupOrg(username, firmName, password) {
  const row = await rpc("sa_signup_org", {
    p_username: username,
    p_firm: firmName,
    p_password: password,
  });
  if (!row?.session_token) {
    throw new Error(t("err_sql"));
  }
  return row;
}

export async function loginOrg(username, password) {
  const row = await rpc("sa_login_org", { p_username: username, p_password: password });
  if (!row?.session_token) {
    throw new Error(t("err_sql"));
  }
  return row;
}

export async function loginDriver(username, key) {
  const row = await rpc("sa_login_driver", { p_username: username, p_key: key });
  if (!row?.session_token) {
    throw new Error(t("err_sql"));
  }
  return row;
}

export async function logoutSession() {
  try {
    await rpc("sa_logout", {});
  } catch {}
  useAuthToken("");
}

export async function whoami() {
  try {
    return await rpc("sa_whoami", {});
  } catch (err) {
    const m = String(err.message || "");
    if (/Could not find the function|schema cache/i.test(m)) return { missing: true };
    if (/Session khatam/i.test(m)) return null;
    throw err;
  }
}

export async function bindDevice(deviceId) {
  try {
    await rpc("sa_bind_device", { p_device: deviceId });
  } catch {}
}

export async function fetchDevice(id) {
  const { data, error } = await getClient().from("sa_devices").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(denyMsg(error));
  return data;
}

export async function insertDevice(row) {
  const payload = { ...row };
  for (let i = 0; i < 6; i++) {
    const res = await getClient().from("sa_devices").insert(payload).select().single();
    if (!res.error) return res.data;
    const missing = String(res.error.message || "").match(/Could not find the '([^']+)' column/);
    if (missing && missing[1] in payload) {
      delete payload[missing[1]];
      continue;
    }
    throw new Error(serverMsg(res.error.message));
  }
  throw new Error(t("err_dev"));
}

export async function updateDevice(id, patch) {
  return ok(await getClient().from("sa_devices").update(patch).eq("id", id).select().single());
}

export async function listDrivers(orgId) {
  let q = getClient().from("sa_devices").select("*").eq("role", "driver").order("name");
  if (orgId) q = q.eq("org_id", orgId);
  return ok(await q);
}

export async function listOwnerDevice(orgId) {
  let q = getClient().from("sa_devices").select("*").eq("role", "owner").limit(1);
  if (orgId) q = q.eq("org_id", orgId);
  const rows = ok(await q);
  return (rows && rows[0]) || null;
}

export async function listCustomers(deviceId, opts = {}) {
  let q = getClient().from("sa_customers").select("*").order("sequence");
  if (!opts.all) q = q.eq("active", true);
  if (deviceId) q = q.eq("device_id", deviceId);
  if (opts.orgId) q = q.eq("org_id", opts.orgId);
  return ok(await q);
}

export async function insertCustomer(row) {
  const payload = { ...row };
  for (let i = 0; i < 6; i++) {
    const res = await getClient().from("sa_customers").insert(payload).select().single();
    if (!res.error) return res.data;
    const missing = String(res.error.message || "").match(/Could not find the '([^']+)' column/);
    if (missing && missing[1] in payload) {
      delete payload[missing[1]];
      continue;
    }
    throw new Error(serverMsg(res.error.message));
  }
  throw new Error(t("err_csave"));
}

export async function updateCustomerRow(id, patch) {
  const payload = { ...patch };
  const wantRate = Object.prototype.hasOwnProperty.call(payload, "jar_rate");
  for (let i = 0; i < 6; i++) {
    const res = await getClient().from("sa_customers").update(payload).eq("id", id).select().single();
    if (!res.error) return res.data;
    const missing = String(res.error.message || "").match(/Could not find the '([^']+)' column/);
    if (missing?.[1] === "jar_rate" && wantRate) {
      throw new Error(t("err_rsave"));
    }
    if (missing && missing[1] in payload) {
      delete payload[missing[1]];
      continue;
    }
    throw new Error(serverMsg(res.error.message));
  }
  throw new Error(t("err_cupd"));
}

export async function listDeliveries(deviceId, date, orgId) {
  let q = getClient().from("sa_deliveries").select("*");
  if (deviceId) q = q.eq("device_id", deviceId);
  if (date) q = q.eq("work_date", date);
  if (orgId) q = q.eq("org_id", orgId);
  return ok(await q);
}

export async function listDeliveriesRange(fromDate, toDate, extra = {}) {
  let q = getClient()
    .from("sa_deliveries")
    .select("*")
    .gte("work_date", fromDate)
    .lte("work_date", toDate)
    .order("work_date", { ascending: true })
    .limit(5000);
  if (extra.deviceId) q = q.eq("device_id", extra.deviceId);
  if (extra.customerId) q = q.eq("customer_id", extra.customerId);
  if (extra.orgId) q = q.eq("org_id", extra.orgId);
  return ok(await q);
}

export async function listTripsRange(fromDate, toDate, deviceId, orgId) {
  let q = getClient()
    .from("sa_day_trips")
    .select("*")
    .gte("work_date", fromDate)
    .lte("work_date", toDate)
    .order("work_date", { ascending: true })
    .limit(5000);
  if (deviceId) q = q.eq("device_id", deviceId);
  if (orgId) q = q.eq("org_id", orgId);
  return ok(await q);
}

export async function listDeliveryJarRows(orgId) {
  let q = getClient()
    .from("sa_deliveries")
    .select("customer_id, jars_given")
    .eq("status", "complete")
    .limit(20000);
  if (orgId) q = q.eq("org_id", orgId);
  return ok(await q);
}

function missingPaymentsTable(err) {
  return /sa_payments/i.test(String(err?.message || err || ""));
}

export async function listPayments(orgId) {
  let q = getClient()
    .from("sa_payments")
    .select("*")
    .order("paid_on", { ascending: false })
    .limit(5000);
  if (orgId) q = q.eq("org_id", orgId);
  const res = await q;
  if (res.error) {
    if (missingPaymentsTable(res.error)) return [];
    throw new Error(serverMsg(res.error.message));
  }
  return res.data || [];
}

export async function insertPayment(row) {
  const res = await getClient().from("sa_payments").insert(row).select().single();
  if (res.error) {
    if (missingPaymentsTable(res.error)) {
      throw new Error(t("err_psave"));
    }
    throw new Error(serverMsg(res.error.message));
  }
  return res.data;
}

export async function deletePayment(id) {
  const res = await getClient().from("sa_payments").delete().eq("id", id);
  if (res.error) throw new Error(serverMsg(res.error.message));
  return true;
}

export async function upsertDelivery(row) {
  return ok(
    await getClient()
      .from("sa_deliveries")
      .upsert(row, { onConflict: "device_id,customer_id,work_date" })
      .select()
      .single()
  );
}

export async function deliveryDates(deviceId) {
  let q = getClient().from("sa_deliveries").select("work_date");
  if (deviceId) q = q.eq("device_id", deviceId);
  const rows = ok(await q);
  return [...new Set((rows || []).map((r) => r.work_date))].sort().reverse();
}

export async function recomputePending(customerId) {
  const rows = ok(
    await getClient()
      .from("sa_deliveries")
      .select("jars_given, empty_collected")
      .eq("customer_id", customerId)
      .eq("status", "complete")
  );
  const pending = (rows || []).reduce((s, r) => s + (r.jars_given || 0) - (r.empty_collected || 0), 0);
  await updateCustomerRow(customerId, { pending_jars: pending });
  return pending;
}

export async function fetchTrip(deviceId, date) {
  const { data, error } = await getClient()
    .from("sa_day_trips")
    .select("*")
    .eq("device_id", deviceId)
    .eq("work_date", date)
    .maybeSingle();
  if (error) throw new Error(denyMsg(error));
  return data;
}

export async function listTrips(date) {
  return ok(await getClient().from("sa_day_trips").select("*").eq("work_date", date));
}

export async function listTripsMonth(fromDate, toDate) {
  return ok(
    await getClient()
      .from("sa_day_trips")
      .select("*")
      .gte("work_date", fromDate)
      .lte("work_date", toDate)
  );
}

export async function upsertTrip(row) {
  const payload = { ...row };
  for (let i = 0; i < 8; i++) {
    const res = await getClient()
      .from("sa_day_trips")
      .upsert(payload, { onConflict: "device_id,work_date" })
      .select()
      .single();
    if (!res.error) return res.data;
    const missing = String(res.error.message || "").match(/Could not find the '([^']+)' column/);
    if (missing && missing[1] in payload) {
      delete payload[missing[1]];
      continue;
    }
    throw new Error(serverMsg(res.error.message));
  }
  throw new Error(t("err_tsave"));
}
