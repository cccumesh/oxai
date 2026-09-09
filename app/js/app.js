import { saveSupabaseConfig } from "./config.js";
import { resetClient, subscribeOwnerLive, stopOwnerLive, usernameTaken } from "./db.js?v=66";
import { getSession, normalizeUsername, usernameSuggestions } from "./auth.js?v=66";
import { t, langPicker, setLang, speakLocale, dateLocale } from "./i18n.js?v=66";
import {
  load, getState, businessDate, displayDate, remainingMs,
  getDriver, renameDriver, getCustomer, pendingIds, completeIds,
  bump, fillUsual, markComplete, markPending, moveRoute, addCustomer,
  updateCustomer, deactivateCustomer, dayStats, getDay, setCount,
  routeIds, setRouteOrder, moveSequence, ownerStats, refreshDate,
  getTrip, bumpTrip, setTripCount, isLoadConfirmed, confirmLoad, lastWorkDates, canEditWorkDate, periodRange, loadOwnerRange,
  ownerPeriodStats, ownerDriverDetail, ownerCustomerLedger, vehicleStock, tripLoss, returnExpect,
  rupee, inrWords, billDate, ownerLossByDriver, ownerBalanceSheet,
  ownerCustomerPeriodJars, ownerCustomerMoney, monthLabel, addPayment, removePayment,
  isMonthRegister, ownerDriverRegister, getFirmName,
  signupOwner, loginOwner, loginDriverAccount, addDriverAccount, ensureDriverKey, logout,
} from "./store.js?v=66";
import { maybeStartTour, openTour } from "./help.js?v=66";

const app = document.getElementById("app");
let tick = null;
let keepScroll = false;
let busy = false;
let ownerCustQuery = "";
let userCheckTimer = null;
let loginWaitUntil = 0;
let copiedFlashKey = "";
let copiedFlashTimer = 0;

function copyKeyLabel(key) {
  return copiedFlashKey && key && copiedFlashKey === key ? `✓ ${t("copied")}` : t("copy");
}

function copyKeyClass(key) {
  return copiedFlashKey && key && copiedFlashKey === key ? "ghost rate-btn copied" : "ghost rate-btn";
}

async function copySilent(text) {
  const val = String(text || "");
  if (!val) return false;
  try {
    await navigator.clipboard.writeText(val);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = val;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      return true;
    } catch {
      return false;
    }
  }
}

function flashCopied(key, btn) {
  copiedFlashKey = key;
  const target = btn || document.querySelector(`[data-act=copy-key][data-key="${CSS.escape(key)}"]`);
  if (target) {
    target.classList.add("copied");
    target.textContent = `✓ ${t("copied")}`;
  }
  clearTimeout(copiedFlashTimer);
  copiedFlashTimer = setTimeout(() => {
    copiedFlashKey = "";
    document.querySelectorAll("[data-act=copy-key].copied").forEach((b) => {
      b.classList.remove("copied");
      b.textContent = t("copy");
    });
  }, 3000);
}

function loginWaitLeft() {
  return Math.max(0, Math.ceil((loginWaitUntil - Date.now()) / 1000));
}

function noteLoginWait(err) {
  const m = String(err?.message || err || "");
  const hit = m.match(/(\d+)\s*second/i);
  if (hit) loginWaitUntil = Date.now() + Number(hit[1]) * 1000;
}

function pad(n) {
  return String(Math.max(0, Math.floor(n))).padStart(2, "0");
}

function formatRemain(ms) {
  if (ms <= 0) return t("day_closed");
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

function parseHash() {
  const h = (location.hash || "#/").replace(/^#/, "");
  const parts = h.split("/").filter(Boolean);
  if (parts[0] === "start") return { view: "start" };
  if (parts[0] === "login") {
    return { view: "login", mode: parts[1] === "driver" ? "driver" : "owner" };
  }
  if (parts[0] === "signup") return { view: "signup" };
  if (parts[0] === "owner") {
    if (parts[1] === "driver") {
      return { view: "owner-driver", driverId: parts[2], period: parts[3] || "today", month: parts[4] || "" };
    }
    if (parts[1] === "bill") {
      return { view: "owner-bill", customerId: parts[2], period: parts[3] || "month", month: parts[4] || "" };
    }
    if (parts[1] === "sheet") {
      if (parts[2] === "m") return { view: "owner-sheet", period: "m", month: parts[3] || "" };
      return { view: "owner-sheet", period: parts[2] || "today", month: "" };
    }
    if (parts[1] === "udhari" || parts[1] === "pending") {
      return { view: "owner-pending", period: parts[2] || "today", month: parts[3] || "" };
    }
    if (parts[1] === "loss") {
      const kind = parts[2] === "cap" || parts[2] === "toot" ? parts[2] : "all";
      const rest = kind === "all" ? parts.slice(2) : parts.slice(3);
      if (rest[0] === "m") return { view: "owner-loss", kind, period: "m", month: rest[1] || "" };
      return { view: "owner-loss", kind, period: rest[0] || "today", month: "" };
    }
    if (parts[1] === "m") return { view: "owner", period: "m", month: parts[2] || "" };
    return { view: "owner", period: parts[1] || "today", month: "" };
  }
  if (parts[0] === "day") return { view: "home", date: parts[1] || businessDate() };
  if (parts[0] === "sequence") return { view: "sequence", date: parts[1] || businessDate() };
  if (parts[0] === "customers") return { view: "customers" };
  return { view: "home", date: businessDate() };
}

function isOwnerRoute() {
  return (location.hash || "").startsWith("#/owner");
}

function header({ subtitle, date, showTimer }) {
  const today = businessDate();
  const remain = date ? remainingMs(date) : remainingMs(today);
  const isPast = date && date !== today;
  const me = getDriver();
  const firm = getFirmName();
  const session = getSession();
  return `
    <header class="app-top">
      <div class="brand-row">
        <div class="logo" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
            <path d="M24 4C24 4 10 20.2 10 30a14 14 0 0028 0C38 20.2 24 4 24 4z" fill="#67e8f9"/>
            <path d="M24 16c0 0-7 8.8-7 14a7 7 0 0014 0c0-5.2-7-14-7-14z" fill="#ecfeff"/>
          </svg>
        </div>
        <div class="brand-text">
          <h1>${firm}</h1>
          <p>${subtitle || me?.name || t("delivery_man")}${session?.role === "owner" && session.username ? " · " + session.username : ""}</p>
        </div>
        <div class="day-chip">
          ${langPicker("mini")}
          ${session ? `<div class="head-acts">
            <button type="button" class="logout-btn help-btn" data-act="help-open">${t("help")}</button>
            <button type="button" class="logout-btn" data-act="logout">${t("logout")}</button>
          </div>` : ""}
          <div>${displayDate(date || today)}${isPast ? " · " + t("first_day") : ""}</div>
          ${isOwnerRoute() ? `<div class="live-dot">${t("live")}</div>` : showTimer !== false ? `<div class="timer" data-timer="${date || today}">${isPast ? t("edit_allowed") : formatRemain(remain)}</div>` : ""}
        </div>
      </div>
    </header>
  `;
}

function dayHref(d) {
  return d === businessDate() ? "#/" : `#/day/${d}`;
}

function dayStrip(activeDate) {
  const today = businessDate();
  const dates = lastWorkDates();
  const labels = [t("today"), t("yesterday"), t("days_ago_2")];
  return `
    <div class="day-tabs">
      ${dates.map((d, i) => `
        <a href="${dayHref(d)}" class="${d === activeDate ? "on" : ""}">
          <strong>${labels[i]}</strong>
          <span>${d === today ? "" : displayDate(d).replace(/,.*/, "")}</span>
        </a>
      `).join("")}
    </div>
  `;
}

function bottomNav(active, range) {
  if (isOwnerRoute()) {
    const p = range ? periodPath(range) : "today";
    return `
      <nav class="nav">
        <a href="#/owner/${p === "today" ? "today" : p}" class="${active === "owner" ? "on" : ""}">${t("dashboard")}</a>
        <a href="#/owner/month" class="${active === "owner-month" ? "on" : ""}">${t("month")}</a>
        <a href="#/owner/pending" class="${active === "owner-pending" ? "on" : ""}">${t("pending")}</a>
        <a href="#/owner/sheet/${p}" class="${active === "owner-sheet" ? "on" : ""}">${t("sheet")}</a>
      </nav>
    `;
  }
  return `
    <nav class="nav nav-3">
      <a href="#/" class="${active === "home" ? "on" : ""}">${t("route")}</a>
      <a href="#/customers" class="${active === "customers" ? "on" : ""}">${t("customers")}</a>
      <button type="button" data-act="add-open">${t("new_plus")}</button>
    </nav>
  `;
}

function renderConfig() {
  app.innerHTML = `
    ${header({ subtitle: t("config_sub"), showTimer: false })}
    <main class="wrap">
      <div class="card">
        <h3 style="margin-bottom:8px;color:var(--deep)">${t("config_h")}</h3>
        <p class="muted" style="margin-bottom:12px">${t("config_p")}</p>
        <form data-form="config">
          <div class="field"><label>Project URL</label><input name="url" required placeholder="https://xxxx.supabase.co" /></div>
          <div class="field"><label>anon public key</label><input name="key" required placeholder="eyJ..." /></div>
          <button class="primary" type="submit" style="width:100%;border:0;border-radius:12px;padding:12px">${t("config_save")}</button>
        </form>
        <p class="muted" style="margin-top:14px">Login: <b>#/login</b></p>
      </div>
    </main>
  `;
}

function authShell(inner) {
  return `
    <main class="auth-wrap">
      ${langPicker()}
      <div class="auth-brand">
        <div class="logo auth-logo" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
            <path d="M24 4C24 4 10 20.2 10 30a14 14 0 0028 0C38 20.2 24 4 24 4z" fill="#67e8f9"/>
            <path d="M24 16c0 0-7 8.8-7 14a7 7 0 0014 0c0-5.2-7-14-7-14z" fill="#ecfeff"/>
          </svg>
        </div>
        <h1>Aqua Jar</h1>
        <p>${t("brand_tag")}</p>
      </div>
      ${inner}
    </main>
  `;
}

function renderWelcome() {
  app.innerHTML = authShell(`
    <div class="auth-card">
      <h2>${t("start_title")}</h2>
      <p class="muted" style="margin-bottom:14px">${t("start_hint")}</p>
      <a class="auth-choice" href="#/signup">
        <strong>${t("new_account")}</strong>
        <span>${t("new_account_sub")}</span>
      </a>
      <a class="auth-choice alt" href="#/login">
        <strong>${t("have_account")}</strong>
        <span>${t("have_account_sub")}</span>
      </a>
    </div>
  `);
}

function renderLogin(mode = "owner") {
  const driver = mode === "driver";
  const wait = loginWaitLeft();
  app.innerHTML = authShell(`
    <div class="auth-card">
      <a class="auth-back" href="#/start">${t("back")}</a>
      <div class="auth-tabs">
        <a href="#/login" class="${driver ? "" : "on"}">${t("plant")}</a>
        <a href="#/login/driver" class="${driver ? "on" : ""}">${t("delivery_man")}</a>
      </div>
      ${driver ? `
        <h2>${t("dm_login")}</h2>
        <p class="muted">${t("dm_login_hint")}</p>
        ${wait ? `<div class="banner" data-login-wait>${t("wait_prefix")} <b data-wait-sec>${wait}</b> ${t("wait_suffix")}</div>` : ""}
        <form data-form="login-driver">
          <div class="field"><label>${t("company_user")}</label><input name="username" required autocomplete="username" placeholder="${t("user_ph")}" ${wait ? "disabled" : ""} /></div>
          <div class="field"><label>${t("login_key")}</label><input name="key" required autocomplete="off" placeholder="ABCD-EFGH" style="text-transform:uppercase;letter-spacing:0.08em" ${wait ? "disabled" : ""} /></div>
          <button class="primary" type="submit" style="width:100%;border:0;border-radius:12px;padding:12px" ${wait ? "disabled" : ""}>${wait ? t("wait_btn") : t("login")}</button>
        </form>
      ` : `
        <h2>${t("plant_login")}</h2>
        <p class="muted">${t("plant_login_hint")}</p>
        ${wait ? `<div class="banner" data-login-wait>${t("wait_prefix")} <b data-wait-sec>${wait}</b> ${t("wait_suffix")}</div>` : ""}
        <form data-form="login-owner">
          <div class="field"><label>${t("username")}</label><input name="username" required autocomplete="username" placeholder="${t("user_ph")}" ${wait ? "disabled" : ""} /></div>
          <div class="field"><label>${t("password")}</label><input name="password" type="password" required autocomplete="current-password" minlength="6" ${wait ? "disabled" : ""} /></div>
          <button class="primary" type="submit" style="width:100%;border:0;border-radius:12px;padding:12px" ${wait ? "disabled" : ""}>${wait ? t("wait_btn") : t("login")}</button>
        </form>
      `}
      <p class="auth-foot">${t("new_company_q")} <a href="#/signup">${t("create_account")}</a></p>
    </div>
  `);
}

function renderSignup() {
  app.innerHTML = authShell(`
    <div class="auth-card">
      <a class="auth-back" href="#/start">${t("back")}</a>
      <h2>${t("new_company")}</h2>
      <p class="muted">${t("signup_hint")}</p>
      <form data-form="signup">
        <div class="field">
          <label>${t("invite_key")}</label>
          <input name="invite" required minlength="6" autocomplete="off" placeholder="AJ-7K2M-9P4Q" style="text-transform:uppercase;letter-spacing:0.06em" />
        </div>
        <div class="field">
          <label>${t("username")}</label>
          <input name="username" required minlength="3" autocomplete="off" placeholder="sanjayaqua" data-act="user-check" />
          <div class="user-status" id="user-status"></div>
          <div class="user-ideas" id="user-ideas"></div>
        </div>
        <div class="field"><label>${t("firm_name")}</label><input name="firm" required minlength="2" placeholder="Sanjay Aqua" /></div>
        <div class="field"><label>${t("password")}</label><input name="password" type="password" required minlength="6" autocomplete="new-password" /></div>
        <div class="field"><label>${t("password_again")}</label><input name="confirm" type="password" required minlength="6" autocomplete="new-password" /></div>
        <button class="primary" type="submit" style="width:100%;border:0;border-radius:12px;padding:12px">${t("create_account")}</button>
      </form>
      <p class="auth-foot">${t("have_account_q")} <a href="#/login">${t("login")}</a></p>
    </div>
  `);
}

function afterPreview(c, e) {
  return (c.pendingJars || 0) + (e.jarsGiven || 0) - (e.emptyCollected || 0);
}

function guideNote(key, vars) {
  return `
    <div class="guide-note">
      <div class="guide-top">
        <strong>${t("guide_title")}</strong>
        <button type="button" class="speak-btn" data-act="speak-text" data-key="${key}" aria-label="${t("speak")}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/>
            <path d="M16.5 8.5a5 5 0 010 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M18.7 6.3a8 8 0 010 11.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <p>${t(key, vars)}</p>
    </div>
  `;
}

function ownerSetupCard() {
  return `
    <div class="setup-card">
      <div class="guide-top">
        <strong>${t("guide_title")}</strong>
        <button type="button" class="speak-btn" data-act="speak-text" data-key="owner_welcome" aria-label="${t("speak")}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/>
            <path d="M16.5 8.5a5 5 0 010 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M18.7 6.3a8 8 0 010 11.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <p class="setup-lead">${t("setup_lead")}</p>
      <div class="row-btns">
        <button type="button" class="primary" data-act="help-open">${t("guide_open")}</button>
        <button type="button" class="ghost" data-act="add-driver">${t("add")}</button>
      </div>
    </div>
  `;
}

function ownerHasLoginKey() {
  return (getState().owner?.drivers || []).some((d) => d.login_key);
}

function speakBtn(id) {
  return `
    <button type="button" class="speak-btn" data-act="speak" data-id="${id}" aria-label="${t("speak")}">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/>
        <path d="M16.5 8.5a5 5 0 010 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M18.7 6.3a8 8 0 010 11.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
  `;
}

function speakName(text) {
  const name = String(text || "").trim();
  if (!name) return;
  const synth = window.speechSynthesis;
  if (!synth) {
    alert(t("no_speak"));
    return;
  }
  synth.cancel();
  const u = new SpeechSynthesisUtterance(name);
  u.lang = speakLocale();
  u.rate = 0.92;
  u.pitch = 1;
  synth.speak(u);
}

function customerCard(date, id, complete) {
  const c = getCustomer(id);
  const e = getDay(date).entries[id];
  if (!c || !e) return "";
  const next = afterPreview(c, e);
  if (complete) {
    const when = e.completedAt ? new Date(e.completedAt).toLocaleTimeString(dateLocale(), { hour: "2-digit", minute: "2-digit" }) : "";
    return `
      <article class="card done">
        <div class="cust-name-row">
          <div class="cust-name">${c.name}</div>
          ${speakBtn(id)}
        </div>
        <div class="done-stats">
          <div class="done-stat">
            <span>${t("given")}</span>
            <b>${e.jarsGiven}</b>
          </div>
          <div class="done-stat">
            <span>${t("picked")}</span>
            <b>${e.emptyCollected}</b>
          </div>
        </div>
        <div class="done-left ${c.pendingJars > 0 ? "hot" : ""}">${c.pendingJars > 0 ? t("done_left", { n: c.pendingJars }) : t("done_left_zero")}</div>
        ${when ? `<div class="done-meta"><span>${when}</span></div>` : ""}
        <button class="undo" data-act="undo" data-id="${id}">${t("back_pending")}</button>
      </article>
    `;
  }
  return `
    <article class="card" data-cust="${id}">
      <div class="cust-top">
        <div class="ord">
          <button type="button" data-act="up" data-id="${id}">▲</button>
          <button type="button" data-act="down" data-id="${id}">▼</button>
        </div>
        <div style="flex:1;min-width:0">
          <div class="cust-name-row">
            <div class="cust-name">${c.name}</div>
            ${speakBtn(id)}
          </div>
          ${c.place ? `<div class="muted">${c.place}</div>` : ""}
        </div>
      </div>
      <div class="pending-box ${c.pendingJars > 0 ? "hot" : ""}">
        <b>${c.pendingJars}</b>
        <span>${t("pending_here")}</span>
      </div>
      <div class="counters">
        <div class="counter">
          <label>${t("jars_given")}</label>
          <div class="stepper">
            <button class="minus" data-act="bump" data-id="${id}" data-field="jarsGiven" data-delta="-1">−</button>
            <input class="val" type="text" inputmode="numeric" pattern="[0-9]*" data-act="set" data-id="${id}" data-field="jarsGiven" value="${e.jarsGiven}" />
            <button class="plus" data-act="bump" data-id="${id}" data-field="jarsGiven" data-delta="1">+</button>
          </div>
        </div>
        <div class="counter">
          <label>${t("empty_picked")}</label>
          <div class="stepper">
            <button class="minus" data-act="bump" data-id="${id}" data-field="emptyCollected" data-delta="-1">−</button>
            <input class="val" type="text" inputmode="numeric" pattern="[0-9]*" data-act="set" data-id="${id}" data-field="emptyCollected" value="${e.emptyCollected}" />
            <button class="plus" data-act="bump" data-id="${id}" data-field="emptyCollected" data-delta="1">+</button>
          </div>
        </div>
      </div>
      <p class="preview">${t("after_market")}: <b>${next}</b> ${t("jar")}</p>
      <button class="done-btn" data-act="done" data-id="${id}">${t("del_done")}</button>
    </article>
  `;
}

function rokdaHtml(date) {
  const trip = getTrip(date);
  return `
    <div class="extra-box extra-rokda" style="margin-top:8px">
      <label>${t("cash_sold")}</label>
      <div class="stepper mini">
        <button class="minus" data-act="trip-bump" data-field="rokdaJars" data-delta="-1">−</button>
        <input class="val" type="text" inputmode="numeric" pattern="[0-9]*" data-act="trip-set" data-field="rokdaJars" value="${trip.rokdaJars || 0}" />
        <button class="plus" data-act="trip-bump" data-field="rokdaJars" data-delta="1">+</button>
      </div>
    </div>
  `;
}

function returnPanelHtml(date) {
  const x = returnExpect(date);
  const mismatch = Number(x.returned) > 0 && Number(x.returned) !== Number(x.totalShould);
  return `
    <div class="plant-box return-box">
      <h3>${t("plant_return")}</h3>
      <div class="return-calc">
        <div class="return-row"><span>${t("filled_from_plant")}</span><b>${x.filledOut}</b></div>
        <div class="return-row"><span>${t("route_plus_cash")}</span><b>${x.sold}</b></div>
        <div class="return-row"><span>${t("broken_gone")}</span><b>− ${x.broke}</b></div>
        <div class="return-row"><span>${t("leak_now_empty")}</span><b>${x.leak}</b></div>
        <div class="return-row"><span>${t("shop_empty")}</span><b>${x.shopEmpty}</b></div>
        <div class="return-row hi"><span>${t("filled_back")}</span><b>${x.filledShould}</b></div>
        <div class="return-row hi"><span>${t("empty_back")}</span><b>${x.emptyShould}</b></div>
        <div class="return-row tot"><span>${t("total_vehicle")}</span><b>${x.totalShould}</b></div>
      </div>
      <div class="work-extras">
        <div class="extra-box">
          <label>${t("leak_empty")}</label>
          <div class="stepper mini">
            <button class="minus" data-act="trip-bump" data-field="leakJars" data-delta="-1">−</button>
            <input class="val" type="text" inputmode="numeric" pattern="[0-9]*" data-act="trip-set" data-field="leakJars" value="${getTrip(date).leakJars}" />
            <button class="plus" data-act="trip-bump" data-field="leakJars" data-delta="1">+</button>
          </div>
        </div>
        <div class="extra-box">
          <label>${t("jar_broke")}</label>
          <div class="stepper mini">
            <button class="minus" data-act="trip-bump" data-field="brokeJars" data-delta="-1">−</button>
            <input class="val" type="text" inputmode="numeric" pattern="[0-9]*" data-act="trip-set" data-field="brokeJars" value="${getTrip(date).brokeJars}" />
            <button class="plus" data-act="trip-bump" data-field="brokeJars" data-delta="1">+</button>
          </div>
        </div>
      </div>
      <div class="counter" style="margin-top:10px">
        <label>${t("count_return")}</label>
        <div class="stepper">
          <button class="minus" data-act="trip-bump" data-field="returnedJars" data-delta="-1">−</button>
          <input class="val" type="text" inputmode="numeric" pattern="[0-9]*" data-act="trip-set" data-field="returnedJars" value="${x.returned}" />
          <button class="plus" data-act="trip-bump" data-field="returnedJars" data-delta="1">+</button>
        </div>
      </div>
      ${mismatch ? `<p class="stock-warn">${t("count_bad", { a: x.returned, b: x.totalShould })}</p>` : ""}
      ${x.returned > 0 && x.returned === x.totalShould ? `<p class="return-ok">${t("count_ok", { n: x.returned })}</p>` : ""}
    </div>
  `;
}

function dayFootHtml(date, stats) {
  return `
    <div class="foot-stats">
      ${dayStrip(date)}
      <div class="kpis">
        <div class="kpi"><b>${stats.pending}</b><span>${t("remaining")}</span></div>
        <div class="kpi"><b>${stats.done}</b><span>${t("complete")}</span></div>
        <div class="kpi"><b>${stats.jars + (getTrip(date).rokdaJars || 0)}</b><span>${t("jars_out")}</span></div>
        <div class="kpi"><b>${stats.empty}</b><span>${t("empty_short")}</span></div>
      </div>
    </div>
  `;
}

function plantBoxHtml(date, stock, { confirmed } = {}) {
  const n = getTrip(date).filledOut || 0;
  return `
      <div class="plant-box ${confirmed ? "plant-settled" : "plant-start"}">
        <h3>${t("vehicle_filled")}</h3>
        <div class="stock-row">
          <div class="counter">
            <label>${t("took_filled")}</label>
            <div class="stepper">
              <button class="minus" data-act="trip-bump" data-field="filledOut" data-delta="-1">−</button>
              <input class="val" type="text" inputmode="numeric" pattern="[0-9]*" data-act="trip-set" data-field="filledOut" value="${n}" />
              <button class="plus" data-act="trip-bump" data-field="filledOut" data-delta="1">+</button>
            </div>
          </div>
          <div class="stock-read ${stock.remaining < 0 ? "stock-bad" : ""}">
            <div class="stock-pair">
              <span>${t("sold")}</span>
              <b>${stock.sold}</b>
            </div>
            <div class="stock-pair">
              <span>${t("now_vehicle")}</span>
              <b>${stock.remaining}</b>
            </div>
            ${stock.leakEmpty ? `<div class="stock-pair"><span>${t("leak_eq")}</span><b>${stock.leakEmpty}</b></div>` : ""}
          </div>
        </div>
        ${rokdaHtml(date)}
        ${stock.remaining < 0 ? `<p class="stock-warn">${t("stock_over")}</p>` : ""}
        ${confirmed
          ? `<p class="load-ok-note">${t("load_ok_note", { n })}</p>`
          : `<button type="button" class="done-btn load-ok-btn" data-act="load-ok" ${n < 1 ? "disabled" : ""}>${t("load_confirm")}</button>`}
      </div>
  `;
}

function dayCloseHtml(date, pending, stats, stock) {
  const trip = getTrip(date);
  const allDone = pending.length === 0 && stats.total > 0;
  if (!allDone) return "";
  const loss = tripLoss(trip);
  const rokda = trip.rokdaJars || 0;
  return `
    <section class="done-hero">
      <div class="done-check">✓</div>
      <div>
        <h2>${t("all_done")}</h2>
        <p>${t("route_done_hint")}</p>
      </div>
    </section>
    <section class="close-box">
      <h3>${t("today_hisab")}</h3>
      <div class="close-grid close-grid-3">
        <div class="close-tile">
          <b>${trip.filledOut}</b>
          <span>${t("took_short")}</span>
        </div>
        <div class="close-tile">
          <b>${stats.empty + loss.leak}</b>
          <span>${t("empty_plus_leak")}</span>
        </div>
        <div class="close-tile">
          <b>${stock.delivered}</b>
          <span>${t("route_gave")}</span>
        </div>
        <div class="close-tile">
          <b>${rokda}</b>
          <span>${t("cash_sold")}</span>
        </div>
        <div class="close-tile">
          <b>${stock.sold}</b>
          <span>${t("total_sold")}</span>
        </div>
        <div class="close-tile">
          <b>${trip.filledBack}</b>
          <span>${t("filled_back")}</span>
        </div>
        <div class="close-tile">
          <b>${loss.broke}</b>
          <span>${t("jar_broke_s")}</span>
        </div>
      </div>
    </section>
  `;
}

function renderHome(dateUse) {
  const me = getDriver();
  const date = dateUse || businessDate();
  const pending = pendingIds(date);
  const done = completeIds(date);
  const stats = dayStats(date);
  const stock = vehicleStock(date);
  const isPast = date !== businessDate();
  const titles = { 0: t("today_route"), 1: t("yesterday_route"), 2: t("days_ago_2") };
  const idx = lastWorkDates().indexOf(date);
  const when = titles[idx] || displayDate(date);
  const allDone = pending.length === 0 && stats.total > 0;
  const loadOk = isLoadConfirmed(date);
  const plantBox = plantBoxHtml(date, stock, { confirmed: loadOk });
  const customers = `
      ${allDone ? "" : `
      <div class="section-h">
        <h2>${t("left_cust")}</h2>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="count">${pending.length}</span>
          <a class="seq-link" href="#/sequence/${date}">${t("sequence")}</a>
        </div>
      </div>
      ${pending.length
        ? pending.map((id) => customerCard(date, id, false)).join("")
        : `<div class="empty">${t("no_cust_add")}</div>`}
      `}
      <div class="section-h" style="margin-top:18px">
        <h2>${t("complete")}</h2>
        <span class="count">${done.length}</span>
      </div>
      ${done.length ? done.map((id) => customerCard(date, id, true)).join("") : `<div class="empty">${t("after_done")}</div>`}
  `;
  const routeKpi = allDone ? "" : `<div class="kpi accent-kpi"><b>${stats.marketPending}</b><span>${t("route_pending")}</span></div>`;
  const closeBlock = allDone ? dayCloseHtml(date, pending, stats, stock) : "";
  const returns = `${returnPanelHtml(date)}${dayFootHtml(date, stats)}`;
  let mainBody = "";
  if (allDone) {
    mainBody = `${closeBlock}${plantBox}${returns}${customers}`;
  } else if (loadOk) {
    mainBody = `${customers}${routeKpi}${plantBox}${returns}`;
  } else {
    mainBody = `${plantBox}${routeKpi}${customers}${returns}`;
  }
  app.innerHTML = `
    ${header({ subtitle: (me?.name || t("delivery_man")) + " · " + when, date, showTimer: !isPast })}
    <main class="wrap">
      ${isPast ? `<div class="banner">${t("past_page", { when })}</div>` : ""}
      ${mainBody}
    </main>
    <button class="fab" data-act="add-open">${t("new_cust")}</button>
    ${bottomNav("home")}
  `;
  app.dataset.date = date;
}

function renderSequence(date) {
  const dateUse = date || businessDate();
  const ids = routeIds(dateUse);
  const day = getDay(dateUse);
  const me = getDriver();
  app.innerHTML = `
    ${header({ subtitle: (me?.name || t("delivery_man")) + " · " + t("sequence"), date: dateUse, showTimer: false })}
    <main class="wrap">
      <a class="back-link" href="${dayHref(dateUse)}">${t("back_route")}</a>
      <div class="section-h"><h2>${t("seq_title")}</h2><span class="count">${ids.length}</span></div>
      ${ids.length ? `
        <div class="seq-wrap" id="seq-body">
          ${ids.map((id, i) => {
            const c = getCustomer(id);
            if (!c) return "";
            const done = day.entries[id]?.status === "complete";
            return `
              <div class="seq-row${done ? " seq-done" : ""}" data-seq-id="${id}" draggable="true">
                <span class="seq-num">${i + 1}</span>
                <span class="seq-name-row">
                  <span class="seq-name">${c.name}${done ? ` <em>${t("complete")}</em>` : ""}</span>
                  ${speakBtn(id)}
                </span>
                <div class="seq-arrows">
                  <button type="button" data-act="seq-up" data-id="${id}">▲</button>
                  <button type="button" data-act="seq-down" data-id="${id}">▼</button>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      ` : `<div class="empty">${t("add_first")}</div>`}
    </main>
    ${bottomNav("home")}
  `;
  app.dataset.date = dateUse;
  bindSeqSort();
}

function renderCustomers() {
  const { customers } = getState();
  app.innerHTML = `
    ${header({ subtitle: t("my_cust"), showTimer: false })}
    <main class="wrap">
      <p class="muted" style="margin-bottom:10px">${t("cust_n", { n: customers.length })}</p>
      ${customers.length ? customers.map((c) => `
        <div class="list-item">
          <div style="flex:1;min-width:0">
            <div class="cust-name-row">
              <strong>${c.name}</strong>
              ${speakBtn(c.id)}
            </div>
            <div class="muted">${c.place ? c.place + " · " : ""}${t("pending_word")} ${c.pendingJars}</div>
          </div>
          <button class="ghost" style="padding:8px 10px;border-radius:10px;border:0;font-weight:800" data-act="edit-cust" data-id="${c.id}">${t("edit")}</button>
        </div>
      `).join("") : `<div class="empty">${t("empty_list")}</div>`}
    </main>
    <button class="fab" data-act="add-open">${t("new_cust")}</button>
    ${bottomNav("customers")}
  `;
}

function periodPath(range) {
  if (range.period === "m") return `m/${range.month}`;
  return range.period || "today";
}

function ownerPeriodTabs(base, range) {
  const today = businessDate();
  const monthVal = range.month || today.slice(0, 7);
  const items = [
    ["today", t("today")],
    ["month", t("month")],
    ["year", t("year")],
    ["all", t("all")],
  ];
  return `
    <div class="day-tabs">
      ${items.map(([p, label]) => `<a href="${base}/${p}" class="${range.period === p ? "on" : ""}"><strong>${label}</strong></a>`).join("")}
    </div>
    <div class="field" style="margin-bottom:12px">
      <label>${t("pick_month")}</label>
      <input type="month" value="${monthVal}" data-act="owner-month" data-base="${base}" />
    </div>
  `;
}

function renderOwner(range) {
  const s = ownerPeriodStats();
  const path = periodPath(range);
  const gineBad = s.returnMismatch || ((s.counted || 0) > 0 && s.counted !== s.expectTotal);
  const hasKey = ownerHasLoginKey();
  const setupFirst = !hasKey;
  const kpis = `
      <div class="kpis kpis-3">
        <div class="kpi"><b>${s.filledOut}</b><span>${t("filled_from_plant")}</span></div>
        <div class="kpi"><b>${s.jarsToCustomers + (s.rokda || 0)}</b><span>${t("sold")}</span></div>
        <div class="kpi"><b>${s.remaining}</b><span>${t("on_vehicle")}</span></div>
      </div>
      <div class="kpis kpis-3">
        <div class="kpi"><b>${s.rokda || 0}</b><span>${t("cash_sold")}</span></div>
        <div class="kpi"><b>${s.filledBack}</b><span>${t("filled_in")}</span></div>
        <div class="kpi"><b>${s.empty}</b><span>${t("shop_empty_in")}</span></div>
      </div>
      <div class="kpis kpis-3">
        <a class="kpi ${s.leak ? "kpi-warn" : ""} kpi-link" href="#/owner/loss/cap/${path}" data-act="hash" data-go="#/owner/loss/cap/${path}">
          <b>${s.leak || 0}</b><span>${t("cap_leak")}</span>
        </a>
        <a class="kpi ${s.broke ? "kpi-warn" : ""} kpi-link" href="#/owner/loss/toot/${path}" data-act="hash" data-go="#/owner/loss/toot/${path}">
          <b>${s.broke || 0}</b><span>${t("jars_broke")}</span>
        </a>
        <a class="kpi ${gineBad ? "kpi-warn" : ""} kpi-link" href="#/owner/loss/${path}">
          <b>${s.counted || 0}<small> / ${s.expectTotal || 0}</small></b><span>${t("counted_need")}</span>
        </a>
      </div>
      ${gineBad ? `<p class="stock-warn" style="margin-bottom:12px">${t("dm_count_warn", { a: s.counted, b: s.expectTotal })}</p>` : ""}
      <a class="kpi accent-kpi" href="#/owner/pending/${path}" style="display:block">
        <b>${s.pendingMarket}</b><span>${t("at_shops")}</span>
      </a>
  `;
  app.innerHTML = `
    ${header({ subtitle: t("plant_dash") + " · " + range.label, date: range.to, showTimer: false })}
    <main class="wrap">
      ${setupFirst ? "" : ownerPeriodTabs("#/owner", range)}
      ${setupFirst ? ownerSetupCard() : ""}
      ${setupFirst ? "" : kpis}
      <div class="section-h">
        <h2>${t("delivery_man")}</h2>
        <button type="button" class="ghost rate-btn" data-act="add-driver">${t("add")}</button>
      </div>
      ${setupFirst ? "" : guideNote("owner_key_help")}
      ${s.byDriver.length ? s.byDriver.map((d) => {
        const full = (getState().owner.drivers || []).find((x) => x.id === d.id);
        const key = full?.login_key || "";
        return `
        <div class="driver-card ${d.returnMismatch ? "driver-mismatch" : ""}">
          <a href="#/owner/driver/${d.id}/${path}" style="display:flex;align-items:center;gap:12px;flex:1;min-width:0">
            <div class="avatar" style="background:#0e7490">${(d.name || "?").slice(0, 1)}</div>
            <div style="flex:1">
              <h3>${d.name}</h3>
              <p>${t("took")} ${d.filledOut} · ${t("gave_s")} ${d.jars} · ${t("cap_s")} ${d.leak || 0} · ${t("broke_s")} ${d.broke || 0}</p>
              <p>${t("stuck_m")} ${d.pending || 0} ${t("jar")} · ${t("counted_s")} ${d.counted || 0} / ${d.expectTotal || 0}${d.returnMismatch ? " · " + t("no_match") : ""}</p>
            </div>
            <span class="go">${t("table")}</span>
          </a>
          <p class="driver-key-line">${t("key")}: <b>${key || t("not_yet")}</b>
            ${key ? `<button type="button" class="${copyKeyClass(key)}" data-act="copy-key" data-key="${key}">${copyKeyLabel(key)}</button>` : `<button type="button" class="ghost rate-btn" data-act="make-key" data-id="${d.id}">${t("make_key")}</button>`}
          </p>
        </div>
      `;
      }).join("") : `<div class="empty">${t("add_dm")}</div>`}
      <div class="section-h owner-cust-head">
        <h2>${t("customers")}</h2>
        <div class="search-help">
          <input class="cust-search" data-act="cust-search" type="search" placeholder="${t("search_cust")}" value="${ownerCustQuery.replace(/"/g, "&quot;")}" autocomplete="off" />
          <button type="button" class="ghost help-inline" data-act="help-open">${t("help")}</button>
        </div>
      </div>
      <div id="owner-cust-list">${stateCustomersList(path, range)}</div>
      <a class="bs-cta" href="#/owner/sheet/${path}">
        <strong>${t("balance_sheet")}</strong>
      </a>
    </main>
    ${ownerNav(range)}
  `;
}

function ownerNav(range, view) {
  if (view === "pending") return bottomNav("owner-pending", range);
  if (view === "sheet") return bottomNav("owner-sheet", range);
  if (range.period === "month" || range.period === "m") return bottomNav("owner-month", range);
  return bottomNav("owner", range);
}

function udhariCustRow(path, c) {
  const rate = Number(c.jarRate) || 0;
  const amt = rate * (c.pendingJars || 0);
  return `
    <a class="list-item owner-cust udhari-cust" href="#/owner/bill/${c.id}/${path}">
      <div>
        <strong>${c.name}</strong>
        ${c.place ? `<div class="muted">${c.place}</div>` : ""}
        ${amt ? `<div class="muted">${t("approx")} ₹ ${rupee(amt)}</div>` : ""}
      </div>
      <div class="pending-box hot" style="margin:0"><b>${c.pendingJars}</b><span>${t("left_jars")}</span></div>
    </a>
  `;
}

function udhariByDriverHtml(path, groups, opts = {}) {
  if (!groups.length) return `<div class="empty">${t("no_pending_j")}</div>`;
  const preview = opts.preview;
  return groups.map((g) => {
    const list = preview ? g.customers.slice(0, 4) : g.customers;
    const extra = preview && g.customers.length > list.length
      ? `<a class="muted" href="#/owner/pending/${path}" style="display:block;padding:4px 4px 10px">${t("more_dm", { n: g.customers.length - list.length })}</a>`
      : "";
    return `
      <section class="udhari-group">
        <div class="udhari-driver">
          <div class="avatar" style="background:#0e7490">${(g.name || "?").slice(0, 1)}</div>
          <div style="flex:1">
            <h3>${g.name}</h3>
            <p>${t("on_route", { n: g.customers.length })}</p>
          </div>
          <div class="pending-box hot" style="margin:0"><b>${g.total}</b><span>${t("stuck_jars")}</span></div>
        </div>
        ${list.map((c) => udhariCustRow(path, c)).join("")}
        ${extra}
      </section>
    `;
  }).join("");
}

function renderOwnerUdhari(range) {
  const s = ownerPeriodStats();
  const path = periodPath(range);
  app.innerHTML = `
    ${header({ subtitle: t("market_title") + " · " + range.label, date: range.to, showTimer: false })}
    <main class="wrap">
      <a class="back-link" href="#/owner/${path}">${t("back_dash")}</a>
      ${ownerPeriodTabs("#/owner/pending", range)}
      <div class="kpi accent-kpi"><b>${s.pendingMarket}</b><span>${t("at_shops")}</span></div>
      ${udhariByDriverHtml(path, s.owedByDriver || [])}
    </main>
    ${ownerNav(range, "pending")}
  `;
}

function renderOwnerLoss(range, kind) {
  const s = ownerPeriodStats();
  const path = periodPath(range);
  const focus = kind === "cap" || kind === "toot" ? kind : "all";
  const groups = ownerLossByDriver()
    .filter((g) => (focus === "cap" ? g.leak > 0 : focus === "toot" ? g.broke > 0 : true))
    .sort((a, b) => (focus === "cap" ? b.leak - a.leak : focus === "toot" ? b.broke - a.broke : (b.leak + b.broke) - (a.leak + a.broke)));
  const lossBase = focus === "all" ? "#/owner/loss" : `#/owner/loss/${focus}`;
  const title = focus === "cap" ? t("cap_title") : focus === "toot" ? t("broke_title") : t("both_loss");
  const total = focus === "cap" ? (s.leak || 0) : focus === "toot" ? (s.broke || 0) : (s.leak || 0) + (s.broke || 0);
  app.innerHTML = `
    ${header({ subtitle: title + " · " + range.label, date: range.to, showTimer: false })}
    <main class="wrap">
      <a class="back-link" href="#/owner/${path}">${t("back_dash")}</a>
      ${ownerPeriodTabs(lossBase, range)}
      <div class="day-tabs" style="margin-top:0">
        <a href="#/owner/loss/${path}" class="${focus === "all" ? "on" : ""}"><strong>${t("both")}</strong></a>
        <a href="#/owner/loss/cap/${path}" class="${focus === "cap" ? "on" : ""}"><strong>${t("cap_tab")}</strong></a>
        <a href="#/owner/loss/toot/${path}" class="${focus === "toot" ? "on" : ""}"><strong>${t("broke_tab")}</strong></a>
      </div>
      <div class="kpi accent-kpi ${total ? "kpi-warn" : ""}" style="display:block"><b>${total}</b><span>${title}</span></div>
      ${shownLossHtml(path, groups, focus)}
    </main>
    ${ownerNav(range)}
  `;
}

function shownLossHtml(path, groups, focus) {
  if (!groups.length) {
    return `<div class="empty">${t("no_loss", { x: focus === "toot" ? t("no_broke") : focus === "cap" ? t("no_cap") : t("no_both") })}</div>`;
  }
  return groups.map((g) => {
    const days = g.days.filter((p) => (focus === "cap" ? p.leak > 0 : focus === "toot" ? p.broke > 0 : true));
    return `
      <section class="udhari-group">
        <a class="udhari-driver" href="#/owner/driver/${g.id}/${path}">
          <div class="avatar" style="background:#0e7490">${(g.name || "?").slice(0, 1)}</div>
          <div style="flex:1">
            <h3>${g.name}</h3>
            <p>${focus === "cap" ? t("leak_n", { n: g.leak }) : focus === "toot" ? t("broke_n", { n: g.broke }) : t("cap_broke_n", { a: g.leak, b: g.broke })}</p>
          </div>
          <div class="pending-box hot" style="margin:0">
            <b>${focus === "cap" ? g.leak : focus === "toot" ? g.broke : g.leak + g.broke}</b>
            <span>${focus === "toot" ? t("broke_s") : focus === "cap" ? t("leak_s") : t("total_s")}</span>
          </div>
        </a>
        ${days.map((p) => `
          <div class="list-item owner-cust udhari-cust">
            <div>
              <strong>${billDate(p.date)}</strong>
              <div class="muted">${t("took_gave", { a: p.filledOut, b: p.jars })}</div>
            </div>
            <div class="muted" style="text-align:right;font-weight:800">
              ${focus !== "toot" ? `<div>${t("cap_col")} ${p.leak || 0}</div>` : ""}
              ${focus !== "cap" ? `<div>${t("broke_col")} ${p.broke || 0}</div>` : ""}
            </div>
          </div>
        `).join("")}
      </section>
    `;
  }).join("");
}

function periodJarLabel(range) {
  if (range.period === "today") return t("today_gave");
  if (range.period === "month" || range.period === "m") return t("month_jars");
  if (range.period === "year") return t("year_jars");
  return t("total_jars");
}

function stateCustomersList(path, range, q = ownerCustQuery) {
  const { customers, drivers } = getState().owner;
  if (!customers.length) return `<div class="empty">${t("no_cust")}</div>`;
  const jarWord = periodJarLabel(range);
  const needle = String(q || "").trim().toLowerCase();
  const filtered = needle
    ? customers.filter((c) => {
        const d = drivers.find((x) => x.id === c.device_id);
        return [c.name, c.place, d?.name].some((v) => String(v || "").toLowerCase().includes(needle));
      })
    : customers;
  if (!filtered.length) return `<div class="empty">${t("no_cust_hit")}</div>`;
  return filtered.map((c) => {
    const d = drivers.find((x) => x.id === c.device_id);
    const rate = Number(c.jarRate) || 0;
    const jars = ownerCustomerPeriodJars(c.id);
    const money = ownerCustomerMoney(c.id);
    const due = money.due;
    const dueHot = due > 0;
    const dueText = due < 0 ? `₹ ${rupee(Math.abs(due))}` : `₹ ${rupee(Math.max(0, due))}`;
    const dueLabel = due < 0 ? t("advance") : t("pending_rs");
    return `
      <div class="list-item owner-cust">
        <a href="#/owner/bill/${c.id}/${path}">
          <strong>${c.name}</strong>
          ${c.place ? `<div class="muted">${c.place}</div>` : ""}
          <div class="muted">${jars} jar · ${jarWord} · ${d?.name || t("delivery_man")}</div>
          <div class="muted">${rate ? `₹ ${rupee(rate)} ${t("per_jar")}` : t("rate_none")}</div>
        </a>
        <div class="owner-cust-side">
          <a class="money-chip ${dueHot ? "hot" : ""}" href="#/owner/bill/${c.id}/${path}">
            <b>${dueText}</b>
            <span>${dueLabel}</span>
          </a>
          <button type="button" class="ghost rate-btn" data-act="edit-cust" data-id="${c.id}">${t("rate")}</button>
        </div>
      </div>
    `;
  }).join("");
}

function renderOwnerDriver(driverId, range) {
  const d = ownerDriverDetail(driverId);
  const path = periodPath(range);
  if (!d.driver) {
    app.innerHTML = `${header({ subtitle: t("dm_miss"), showTimer: false })}<main class="wrap"><a class="back-link" href="#/owner/${path}">${t("back_dash")}</a></main>`;
    return;
  }
  app.innerHTML = `
    ${header({ subtitle: d.driver.name + " · " + range.label, date: range.to, showTimer: false })}
    <main class="wrap ${isMonthRegister(range) ? "wrap-wide" : ""}">
      <a class="back-link" href="#/owner/${path}">${t("back_dash")}</a>
      ${ownerPeriodTabs(`#/owner/driver/${driverId}`, range)}
      <div class="kpis kpis-3">
        <div class="kpi"><b>${d.filledOut}</b><span>${t("filled_from_plant")}</span></div>
        <div class="kpi"><b>${d.jars}</b><span>${t("shop_gave")}</span></div>
        <div class="kpi"><b>${d.filledOut - d.jars - (d.rokda || 0) - d.waste}</b><span>${t("on_vehicle")}</span></div>
      </div>
      <div class="kpis kpis-3">
        <div class="kpi"><b>${d.rokda || 0}</b><span>${t("cash_sold")}</span></div>
        <div class="kpi"><b>${d.filledBack}</b><span>${t("filled_in")}</span></div>
        <div class="kpi"><b>${d.empty}</b><span>${t("shop_empty_in")}</span></div>
      </div>
      <div class="kpis kpis-3">
        <a class="kpi ${d.leak ? "kpi-warn" : ""} kpi-link" href="#/owner/loss/cap/${path}" data-act="hash" data-go="#/owner/loss/cap/${path}">
          <b>${d.leak || 0}</b><span>${t("cap_leak")}</span>
        </a>
        <a class="kpi ${d.broke ? "kpi-warn" : ""} kpi-link" href="#/owner/loss/toot/${path}" data-act="hash" data-go="#/owner/loss/toot/${path}">
          <b>${d.broke || 0}</b><span>${t("jars_broke")}</span>
        </a>
        <div class="kpi ${d.returnMismatch ? "kpi-warn" : ""}"><b>${d.counted || 0}<small> / ${d.expectTotal || 0}</small></b><span>${t("counted_need")}</span></div>
      </div>
      ${d.returnMismatch ? `<p class="stock-warn" style="margin-bottom:12px">${t("this_dm_count", { a: d.counted, b: d.expectTotal })}</p>` : ""}
      <div class="ow-scroll">
        <table class="ow-table">
          <thead>
            <tr>
              <th>${t("date")}</th>
              <th>${t("took_col")}</th>
              <th>${t("gave_col")}</th>
              <th>${t("cap_col")}</th>
              <th>${t("broke_col")}</th>
              <th>${t("cash_col")}</th>
              <th>${t("back_col")}</th>
              <th>${t("count_col")}</th>
              <th>${t("need_col")}</th>
            </tr>
          </thead>
          <tbody>
            ${d.dayPlant.length ? d.dayPlant.map((p) => `
              <tr class="${p.mismatch ? "row-bad" : ""}">
                <td>${p.date}</td>
                <td>${p.filledOut}</td>
                <td>${p.jars}</td>
                <td class="${p.leak ? "cell-waste" : ""}">${p.leak || 0}</td>
                <td class="${p.broke ? "cell-waste" : ""}">${p.broke || 0}</td>
                <td>${p.rokda || 0}</td>
                <td>${p.filledBack}</td>
                <td class="${p.mismatch ? "cell-bad" : ""}">${p.counted || 0}</td>
                <td>${p.expectTotal || 0}</td>
              </tr>
            `).join("") : `<tr><td colspan="9">${t("no_trip")}</td></tr>`}
          </tbody>
        </table>
      </div>
      ${isMonthRegister(range) ? driverRegisterHtml(driverId, range, path) : driverLogHtml(d, path)}
    </main>
    ${ownerNav(range)}
  `;
}

function regCell(cell, date, today) {
  const on = date === today ? " is-today" : "";
  if (!cell || (!(cell.jars) && !(cell.empty))) return `<td class="reg-day${on}"></td>`;
  return `<td class="reg-day has${on}"><span class="reg-frac"><b>${cell.jars || 0}</b><em>${cell.empty || 0}</em></span></td>`;
}

function driverRegisterHtml(driverId, range, path) {
  const g = ownerDriverRegister(driverId, range);
  if (!g.rows.length) {
    return `<div class="empty">${t("no_dm_month")}</div>`;
  }
  return `
    <div class="reg-legend">
      <strong>${g.label} ${t("register")}</strong>
      <span>${t("reg_help", { n: g.last })}</span>
    </div>
    <div class="reg-scroll">
      <table class="reg-table">
        <thead>
          <tr>
            <th class="reg-name">${g.label}</th>
            ${g.days.map((date, i) => `<th class="reg-day${date === g.today ? " is-today" : ""}">${i + 1}</th>`).join("")}
            <th class="reg-tot">${t("tot_jar")}</th>
            <th class="reg-tot khali">${t("tot_empty")}</th>
          </tr>
        </thead>
        <tbody>
          ${g.rows.map((r) => `
            <tr>
              <th class="reg-name">
                <a href="#/owner/bill/${r.customer.id}/${path}">${r.customer.name}</a>
                ${r.customer.place ? `<div class="reg-place">${r.customer.place}</div>` : ""}
              </th>
              ${r.cells.map((cell, i) => regCell(cell, g.days[i], g.today)).join("")}
              <td class="reg-tot">${r.totalJar || ""}</td>
              <td class="reg-tot khali">${r.totalEmpty || ""}</td>
            </tr>
          `).join("")}
        </tbody>
        <tfoot>
          <tr>
            <th class="reg-name">${t("total")}</th>
            ${g.foot.map((x, i) => {
              if (!x.jars && !x.empty) return `<td class="reg-day${g.days[i] === g.today ? " is-today" : ""}"></td>`;
              return `<td class="reg-day has${g.days[i] === g.today ? " is-today" : ""}"><span class="reg-frac"><b>${x.jars || 0}</b><em>${x.empty || 0}</em></span></td>`;
            }).join("")}
            <td class="reg-tot">${g.totalJar}</td>
            <td class="reg-tot khali">${g.totalEmpty}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;
}

function driverLogHtml(d, path) {
  return `
      <div class="ow-scroll">
        <table class="ow-table">
          <thead>
            <tr>
              <th>${t("date")}</th>
              <th>${t("time")}</th>
              <th>${t("customer")}</th>
              <th>${t("gave_col")}</th>
              <th>${t("empty_col")}</th>
            </tr>
          </thead>
          <tbody>
            ${d.rows.length ? d.rows.map((r) => `
              <tr>
                <td>${r.work_date}</td>
                <td>${r.time || "—"}</td>
                <td><a href="#/owner/bill/${r.customer_id}/${path}">${r.customerName}${r.place ? `<div class="muted">${r.place}</div>` : ""}</a></td>
                <td>${r.jars_given}</td>
                <td>${r.empty_collected}</td>
              </tr>
            `).join("") : `<tr><td colspan="5">${t("no_done_del")}</td></tr>`}
          </tbody>
        </table>
      </div>
  `;
}

function renderOwnerSheet(range) {
  const bs = ownerBalanceSheet(range);
  const path = periodPath(range);
  const j = bs.jars;
  app.innerHTML = `
    ${header({ subtitle: t("balance_sheet") + " · " + range.label, date: range.to, showTimer: false })}
    <main class="wrap">
      <a class="back-link" href="#/owner/${path}">${t("back_dash")}</a>
      ${ownerPeriodTabs("#/owner/sheet", range)}
      <div class="row-btns no-print" style="margin-bottom:12px">
        <button type="button" class="primary" data-act="bill-print">${t("print")}</button>
        <button type="button" class="ghost" data-act="sheet-save">${t("save_img")}</button>
      </div>
      <section class="bs-sheet" id="bs-sheet">
        <div class="bs-mark" aria-hidden="true">SA</div>
        <div class="bs-copy">STATEMENT OF ACCOUNTS</div>
        <div class="bs-head">
          <div class="bs-brand">${getFirmName()}</div>
          <div class="bs-tag">Packaged Drinking Water · 20 Litre Jar</div>
          <div class="bs-addr">Jalgaon, Maharashtra</div>
        </div>
        <div class="bs-rule"></div>
        <div class="bs-title-row">
          <div>
            <div class="bs-title">Balance Sheet</div>
            <div class="bs-sub">As on ${billDate(bs.asOn)} · ${range.label}</div>
          </div>
          <div class="bs-hero">
            <span>${t("net_udhari")}</span>
            <b>₹ ${rupee(bs.equity)}</b>
          </div>
        </div>
        <div class="bs-meter">
          <div class="bs-meter-h">
            <span>${t("collected_pct")}</span>
            <strong>${bs.collectedPct}%</strong>
          </div>
          <div class="bs-bar"><i style="width:${bs.collectedPct}%"></i></div>
          <div class="bs-meter-f">${t("got_billed", { a: rupee(bs.paidAll), b: rupee(bs.billedAll) })}</div>
        </div>
        <div class="bs-cols">
          <div class="bs-col">
            <div class="bs-col-h">${t("assets_h")}</div>
            <div class="bs-line"><span>${t("cust_udhari")}</span><b>₹ ${rupee(bs.receivable)}</b></div>
            <div class="bs-line mute"><span>${t("cash_out")}</span><b>—</b></div>
            <div class="bs-line total"><span>${t("tot_assets")}</span><b>₹ ${rupee(bs.assets)}</b></div>
          </div>
          <div class="bs-col">
            <div class="bs-col-h">${t("liab_h")}</div>
            <div class="bs-line"><span>${t("cust_adv")}</span><b>₹ ${rupee(bs.advance)}</b></div>
            <div class="bs-line"><span>${t("cap_udhari")}</span><b>₹ ${rupee(bs.equity)}</b></div>
            <div class="bs-line total"><span>Total</span><b>₹ ${rupee(bs.liabEquity)}</b></div>
          </div>
        </div>
        <p class="bs-balance ${Math.abs(bs.assets - bs.liabEquity) < 0.05 ? "ok" : ""}">
          ${Math.abs(bs.assets - bs.liabEquity) < 0.05 ? t("books_ok") : t("check_n")}
        </p>
        <div class="bs-sec-h">${t("period_acc")} · ${range.label}</div>
        <div class="bs-lines">
          <div class="bs-line"><span>${t("credit_sale")}</span><b>${bs.periodJars} jar · ₹ ${rupee(bs.periodSales)}</b></div>
          <div class="bs-line"><span>${t("period_pay")}</span><b>₹ ${rupee(bs.periodCollected)}</b></div>
          <div class="bs-line gold"><span>${t("all_pending_m")}</span><b>₹ ${rupee(bs.receivable)}</b></div>
        </div>
        <div class="bs-sec-h">${t("jar_stmt")} · ${range.label}</div>
        <div class="bs-jar">
          <div><em>${j.filledOut}</em><span>${t("plant_went")}</span></div>
          <div><em>${j.credit}</em><span>${t("shop_gave")}</span></div>
          <div><em>${j.rokda}</em><span>${t("cash_sold")}</span></div>
          <div><em>${j.leak}</em><span>${t("cap_title")}</span></div>
          <div><em>${j.broke}</em><span>${t("jar_broke_s")}</span></div>
          <div><em>${j.empty}</em><span>${t("shop_empty_s")}</span></div>
          <div><em>${j.filledBack}</em><span>${t("filled_in")}</span></div>
          <div class="hot"><em>${j.pendingMarket}</em><span>${t("at_shops")}</span></div>
        </div>
        ${bs.periodPays.length ? `
          <div class="bs-sec-h">${t("period_pays")}</div>
          <table class="bs-table">
            <thead><tr><th>${t("date")}</th><th>${t("customer")}</th><th>${t("month")}</th><th class="num">₹</th></tr></thead>
            <tbody>
              ${bs.periodPays.map((p) => `
                <tr>
                  <td>${billDate(p.paid_on)}</td>
                  <td>${p.customerName}</td>
                  <td>${monthLabel(p.for_month)}</td>
                  <td class="num">₹ ${rupee(p.amount)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        ` : ""}
        ${bs.debtors.length ? `
          <div class="bs-sec-h">${t("udhari_list")} · ${bs.debtorCount}</div>
          <table class="bs-table">
            <thead><tr><th>${t("customer")}</th><th>${t("delivery_man")}</th><th class="num">${t("pending_rupee")}</th></tr></thead>
            <tbody>
              ${bs.debtors.map((c) => `
                <tr>
                  <td><a href="#/owner/bill/${c.id}/${path}">${c.name}${c.place ? `<div class="bs-mini">${c.place}</div>` : ""}</a></td>
                  <td>${c.driver}</td>
                  <td class="num">₹ ${rupee(c.due)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        ` : `<p class="bs-note">${t("no_dues")}</p>`}
        ${bs.byDriver.length ? `
          <div class="bs-sec-h">${t("dm_wise")}</div>
          <table class="bs-table">
            <thead><tr><th>${t("delivery_man")}</th><th class="num">${t("gave_col")}</th><th class="num">${t("market_jar")}</th><th class="num">${t("udhari_rupee")}</th></tr></thead>
            <tbody>
              ${bs.byDriver.map((d) => `
                <tr>
                  <td>${d.name}</td>
                  <td class="num">${d.periodJars}</td>
                  <td class="num">${d.pendingJars}</td>
                  <td class="num">₹ ${rupee(d.due)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        ` : ""}
        <div class="bs-foot">
          <div>${t("eoe")}</div>
          <div>${t("prepared")} ${billDate(businessDate())}</div>
        </div>
      </section>
    </main>
    ${ownerNav(range, "sheet")}
  `;
}

function invoiceNo(customer, range) {
  const ym = String(range.to || "").replace(/-/g, "").slice(0, 6);
  const tag = String(customer.id || "XXXX").replace(/-/g, "").slice(0, 4).toUpperCase();
  return `SA/${ym}/${tag}`;
}

function renderOwnerBill(customerId, range) {
  const led = ownerCustomerLedger(customerId);
  const path = periodPath(range);
  const c = led.customer;
  if (!c) {
    app.innerHTML = `${header({ subtitle: t("cust_miss"), showTimer: false })}<main class="wrap"><a class="back-link" href="#/owner/${path}">${t("back_dash")}</a></main>`;
    return;
  }
  const inv = invoiceNo(c, range);
  const rateOk = led.rate > 0;
  app.innerHTML = `
    ${header({ subtitle: t("bill") + " · " + c.name, date: range.to, showTimer: false })}
    <main class="wrap">
      <div class="bill-tools no-print">
        <a class="back-link" href="#/owner/${path}">${t("back_dash")}</a>
        <button type="button" class="ghost help-inline" data-act="help-open">${t("help")}</button>
      </div>
      ${ownerPeriodTabs(`#/owner/bill/${customerId}`, range)}
      ${rateOk ? "" : `<div class="banner no-print">${t("no_rate")}</div>`}
      <div class="row-btns no-print" style="margin-bottom:12px">
        <button type="button" class="ghost" data-act="edit-cust" data-id="${c.id}">${t("cust_rate")}</button>
        <button type="button" class="primary" data-act="bill-print">${t("print")}</button>
        <button type="button" class="ghost" data-act="bill-save">${t("save_img")}</button>
      </div>
      <section class="bill-sheet" id="bill-sheet">
        <div class="bill-copy">ORIGINAL FOR RECIPIENT</div>
        <div class="bill-head">
          <div class="bill-brand">${getFirmName()}</div>
          <div class="bill-tag">Packaged Drinking Water · 20 Litre Jar</div>
          <div class="bill-addr">Jalgaon, Maharashtra</div>
        </div>
        <div class="bill-title-row">
          <div class="bill-title">INVOICE</div>
          <div class="bill-inv">
            <div><span>Invoice No.</span><b>${inv}</b></div>
            <div><span>Invoice Date</span><b>${billDate(businessDate())}</b></div>
            <div><span>Bill Period</span><b>${billDate(range.from)} – ${billDate(range.to)}</b></div>
          </div>
        </div>
        <div class="bill-parties">
          <div>
            <div class="bill-k">Bill To</div>
            <div class="bill-name">${c.name}</div>
            ${c.place ? `<div>${c.place}</div>` : ""}
            <div class="muted">${t("route_l")}: ${led.driver?.name || "—"}</div>
          </div>
          <div>
            <div class="bill-k">From</div>
            <div class="bill-name">${getFirmName()}</div>
            <div>20 Ltr mineral water jar supply</div>
            <div class="muted">Jalgaon</div>
          </div>
        </div>
        <div class="bill-table-wrap">
        <table class="bill-table">
          <thead>
            <tr>
              <th class="num">#</th>
              <th>${t("date")}</th>
              <th>Particulars</th>
              <th class="num">Qty</th>
              <th class="num">Rate (₹)</th>
              <th class="num">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${led.lines.length ? led.lines.map((l, i) => `
              <tr>
                <td class="num">${i + 1}</td>
                <td>${billDate(l.date)}</td>
                <td>20 Ltr Packaged Drinking Water Jar</td>
                <td class="num">${l.jars}</td>
                <td class="num">${rupee(led.rate)}</td>
                <td class="num">${rupee(l.jars * led.rate)}</td>
              </tr>
            `).join("") : `<tr><td colspan="6" class="bill-empty">${t("no_del")}</td></tr>`}
          </tbody>
        </table>
        </div>
        <div class="bill-sum">
          <div class="bill-words">
            <div class="bill-k">Amount in words</div>
            <div>${inrWords(led.amount)}</div>
          </div>
          <table class="bill-totals">
            <tr><td>Total jars</td><td>${led.jars}</td></tr>
            <tr><td>Rate / jar</td><td>₹ ${rupee(led.rate)}</td></tr>
            <tr class="grand"><td>Total amount</td><td>₹ ${rupee(led.amount)}</td></tr>
          </table>
        </div>
        <div class="bill-note">
          Empty jars pending at customer: <b>${led.pending}</b>
          · E. &amp; O.E.
        </div>
        <div class="bill-sign">
          <div>
            <span>Receiver's signature</span>
            <i></i>
          </div>
          <div>
            <span>For ${getFirmName()}</span>
            <i>Authorised signatory</i>
          </div>
        </div>
      </section>
      <section class="pay-box no-print">
        <h3>${t("pay_h")}</h3>
        <div class="kpis kpis-3">
          <div class="kpi"><b>₹ ${rupee(led.billed)}</b><span>${t("tot_bill")}</span></div>
          <div class="kpi"><b>₹ ${rupee(led.paid)}</b><span>${t("tot_got")}</span></div>
          <div class="kpi ${led.due > 0 ? "kpi-warn" : ""}"><b>₹ ${rupee(led.due)}</b><span>${led.due < 0 ? t("advance") : t("old_pending")}</span></div>
        </div>
        <p class="muted">${t("period_line", { j: led.jars, r: rupee(led.rate), a: rupee(led.amount) })}</p>
        <form data-form="pay" data-id="${c.id}">
          <div class="pay-grid">
            <div class="field"><label>${t("amt_in")}</label><input name="amount" type="number" inputmode="decimal" step="1" min="1" required placeholder="${t("amt_ph")}" /></div>
            <div class="field"><label>${t("for_month")}</label><input name="month" type="month" value="${range.month || String(range.to || "").slice(0, 7)}" required /></div>
          </div>
          <button class="primary" type="submit" style="width:100%;margin-top:8px">${t("pay_save")}</button>
        </form>
        ${led.payments?.length ? `
          <div class="ow-scroll" style="margin-top:14px">
            <table class="ow-table">
              <thead><tr><th>${t("date")}</th><th>${t("month")}</th><th>${t("paise")}</th><th></th></tr></thead>
              <tbody>
                ${led.payments.map((p) => `
                  <tr>
                    <td>${billDate(p.paid_on)}</td>
                    <td>${monthLabel(p.for_month)}</td>
                    <td>₹ ${rupee(p.amount)}</td>
                    <td><button type="button" class="ghost rate-btn" data-act="pay-del" data-id="${p.id}">${t("remove")}</button></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        ` : `<p class="muted" style="margin-top:10px">${t("no_pay")}</p>`}
      </section>
    </main>
    ${ownerNav(range)}
  `;
}

function modalHtml({ title, name = "", place = "", rate = "", id = "", mode = "add", showRate = false }) {
  return `
    <div class="modal-bg" data-act="add-close">
      <form class="modal" data-form="${mode}" data-id="${id}">
        <h3>${title}</h3>
        <div class="field"><label>${t("cust_name")}</label><input name="name" required value="${name}" /></div>
        <div class="field"><label>${t("place_opt")}</label><input name="place" value="${place}" placeholder="${t("place_ph")}" /></div>
        ${showRate ? `<div class="field"><label>${t("jar_rate")}</label><input name="rate" type="number" inputmode="decimal" step="0.5" min="0" value="${rate === 0 || rate ? rate : ""}" placeholder="${t("rate_ph")}" /></div>` : ""}
        <div class="row-btns">
          <button type="button" class="ghost" data-act="add-close">${t("close")}</button>
          ${mode === "edit" ? `<button type="button" class="ghost" data-act="deactivate" data-id="${id}">${t("remove")}</button>` : ""}
          <button type="submit" class="primary">${t("save")}</button>
        </div>
      </form>
    </div>
  `;
}

function openAdd(prefill) {
  closeModal();
  const showRate = isOwnerRoute();
  document.body.insertAdjacentHTML("beforeend", prefill
    ? modalHtml({ title: showRate ? t("cust_rate") : t("cust_edit"), ...prefill, mode: "edit", showRate })
    : modalHtml({ title: t("new_cust_t"), mode: "add", showRate: false }));
  document.querySelector(showRate ? ".modal input[name=rate]" : ".modal input[name=name]")?.focus();
}

function closeModal() {
  document.querySelector(".modal-bg")?.remove();
}

function openDriverModal() {
  closeModal();
  document.body.insertAdjacentHTML("beforeend", `
    <div class="modal-bg" data-act="add-close">
      <form class="modal" data-form="add-driver">
        <h3>${t("new_dm")}</h3>
        <div class="field"><label>${t("name")}</label><input name="name" required placeholder="Chetan" /></div>
        <p class="muted">${t("key_hint")}</p>
        <div class="row-btns">
          <button type="button" class="ghost" data-act="add-close">${t("close")}</button>
          <button type="submit" class="primary">${t("make_key")}</button>
        </div>
      </form>
    </div>
  `);
  document.querySelector(".modal input[name=name]")?.focus();
}

function renumberSeq() {
  document.querySelectorAll("#seq-body .seq-row").forEach((row, i) => {
    const num = row.querySelector(".seq-num");
    if (num) num.textContent = String(i + 1);
  });
}

async function saveSeqFromDom() {
  const list = document.getElementById("seq-body");
  if (!list) return;
  const ids = [...list.querySelectorAll(".seq-row")].map((row) => row.dataset.seqId).filter(Boolean);
  await setRouteOrder(app.dataset.date || businessDate(), null, ids);
}

function bindSeqSort() {
  const list = document.getElementById("seq-body");
  if (!list) return;
  let dragEl = null;
  list.querySelectorAll(".seq-row").forEach((row) => {
    row.addEventListener("dragstart", (e) => {
      if (e.target.closest("button")) { e.preventDefault(); return; }
      dragEl = row;
      row.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      try { e.dataTransfer.setData("text/plain", row.dataset.seqId); } catch {}
    });
    row.addEventListener("dragend", async () => {
      row.classList.remove("dragging");
      dragEl = null;
      await saveSeqFromDom();
    });
  });
  list.addEventListener("dragover", (e) => {
    e.preventDefault();
    const over = e.target.closest(".seq-row");
    if (!dragEl || !over || over === dragEl) return;
    const rect = over.getBoundingClientRect();
    list.insertBefore(dragEl, e.clientY > rect.top + rect.height / 2 ? over.nextSibling : over);
    renumberSeq();
  });
}

let livePoll = null;
let liveDebounce = null;
let liveOn = false;
let liveBusy = false;

function ownerTyping() {
  if (document.querySelector(".modal-bg")) return true;
  const el = document.activeElement;
  if (!el) return false;
  const tag = (el.tagName || "").toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select";
}

function queueOwnerLive() {
  clearTimeout(liveDebounce);
  liveDebounce = setTimeout(() => { refreshOwnerLive(); }, 600);
}

function snapshotOwner() {
  const o = getState().owner;
  return JSON.stringify({
    t: o.rangeTrips,
    d: o.rangeDeliveries,
    c: (o.customers || []).map((x) => [x.id, x.pendingJars, x.jarRate, x.name, x.place]),
    n: (o.drivers || []).map((x) => [x.id, x.name]),
    p: (o.payments || []).map((x) => [x.id, x.customer_id, x.amount, x.for_month]),
    j: (o.allJarRows || []).length,
  });
}

async function refreshOwnerLive() {
  if (!isOwnerRoute() || busy || liveBusy || ownerTyping()) return;
  liveBusy = true;
  try {
    const r = parseHash();
    const range = periodRange(r.period, r.month);
    const before = snapshotOwner();
    await loadOwnerRange(range.from, range.to);
    if (snapshotOwner() === before) return;
    keepScroll = true;
    await render({ skipLoad: true, skipOwnerFetch: true });
  } catch (err) {
    console.error(err);
  } finally {
    liveBusy = false;
  }
}

function startOwnerLive() {
  if (liveOn) return;
  liveOn = true;
  subscribeOwnerLive(() => queueOwnerLive());
  livePoll = setInterval(() => queueOwnerLive(), 15000);
}

function haltOwnerLive() {
  liveOn = false;
  stopOwnerLive();
  if (livePoll) {
    clearInterval(livePoll);
    livePoll = null;
  }
  clearTimeout(liveDebounce);
}

async function render(opts = {}) {
  const y = keepScroll ? window.scrollY : 0;
  keepScroll = false;
  const r0 = parseHash();
  const authView = r0.view === "login" || r0.view === "signup" || r0.view === "start";
  const owner = isOwnerRoute();
  if (!opts.skipLoad) await load({ roleWanted: authView ? "driver" : owner ? "owner" : "driver" });
  const st = getState();
  if (st.needsConfig) {
    haltOwnerLive();
    document.body.classList.remove("auth-body");
    renderConfig();
    return;
  }
  const session = getSession();
  if (authView) {
    haltOwnerLive();
    if (session) {
      location.hash = session.role === "owner" ? "#/owner" : "#/";
      return;
    }
    document.body.classList.add("auth-body");
    if (r0.view === "signup") renderSignup();
    else if (r0.view === "login") renderLogin(r0.mode);
    else renderWelcome();
    window.scrollTo(0, 0);
    return;
  }
  document.body.classList.remove("auth-body");
  if (st.needsAuth) {
    haltOwnerLive();
    location.hash = "#/start";
    return;
  }
  if (st.error && !st.device) {
    haltOwnerLive();
    app.innerHTML = `${header({ subtitle: t("error"), showTimer: false })}<main class="wrap"><div class="banner">${st.error}</div></main>`;
    return;
  }
  if (session?.role === "owner" && !owner) {
    location.hash = "#/owner";
    return;
  }
  if (st.error) {
    app.innerHTML = `${header({ subtitle: t("error"), showTimer: false })}<main class="wrap"><div class="banner">${st.error}</div></main>`;
    return;
  }
  const r = parseHash();
  if (owner) {
    const range = periodRange(r.period, r.month);
    if (!opts.skipOwnerFetch) await loadOwnerRange(range.from, range.to);
    if (r.view === "owner-driver") renderOwnerDriver(r.driverId, range);
    else if (r.view === "owner-bill") renderOwnerBill(r.customerId, range);
    else if (r.view === "owner-pending") renderOwnerUdhari(range);
    else if (r.view === "owner-loss") renderOwnerLoss(range, r.kind);
    else if (r.view === "owner-sheet") renderOwnerSheet(range);
    else renderOwner(range);
    startOwnerLive();
  } else {
    haltOwnerLive();
    if (r.date && !canEditWorkDate(r.date)) {
      location.hash = "#/";
      return;
    }
    if (r.view === "sequence") {
      if (!opts.skipLoad && r.date) await refreshDate(r.date);
      renderSequence(r.date);
    } else if (r.view === "customers") renderCustomers();
    else {
      if (!opts.skipLoad && r.date) await refreshDate(r.date);
      renderHome(r.date || businessDate());
    }
  }
  window.scrollTo(0, y);
  if (!opts.skipLoad) maybeStartTour();
}

function startTimer() {
  if (tick) clearInterval(tick);
  tick = setInterval(() => {
    document.querySelectorAll("[data-timer]").forEach((el) => {
      const date = el.getAttribute("data-timer");
      if (date !== businessDate()) return;
      el.textContent = formatRemain(remainingMs(date));
    });
    document.querySelectorAll("[data-wait-sec]").forEach((el) => {
      const left = loginWaitLeft();
      if (left <= 0) {
        if (loginWaitUntil) {
          loginWaitUntil = 0;
          const r = parseHash();
          if (r.view === "login") renderLogin(r.mode);
        }
        return;
      }
      el.textContent = String(left);
    });
  }, 1000);
}

function paintFast() {
  keepScroll = true;
  render({ skipLoad: true });
}

function setBusyUI(on, label) {
  const layer = document.getElementById("busy-layer");
  if (!layer) return;
  const text = layer.querySelector("[data-busy-text]");
  if (text) text.textContent = label || t("wait_now");
  layer.hidden = !on;
  document.body.classList.toggle("is-busy", on);
}

function markFormWait(form) {
  if (!form) return;
  const btn = form.querySelector("button[type=submit]");
  if (!btn) return;
  btn.disabled = true;
  btn.dataset.label = btn.textContent;
  btn.innerHTML = `<span class="busy-spin mini"></span> ${t("wait_now")}`;
}

async function run(fn) {
  if (busy) return;
  busy = true;
  setBusyUI(true);
  try { await fn(); }
  catch (err) { alert(err.message || err); }
  finally {
    busy = false;
    setBusyUI(false);
  }
}

document.addEventListener("dblclick", (ev) => {
  if (ev.target.closest("button, .stepper, a, .card, .plant-box, .wrap")) ev.preventDefault();
});

document.addEventListener("click", (ev) => {
  if (ev.target.closest("#tour-layer")) return;
  const el = ev.target.closest("[data-act]");
  if (!el) return;
  const act = el.dataset.act;
  const id = el.dataset.id;
  const date = app.dataset.date || parseHash().date || businessDate();

  if (act === "help-open") {
    ev.preventDefault();
    openTour(getSession()?.role === "owner" || isOwnerRoute() ? "owner" : "driver");
    return;
  }
  if (act === "add-open") openAdd();
  if (act === "logout") {
    ev.preventDefault();
    run(async () => {
      await logout();
      location.hash = "#/start";
      await render();
    });
    return;
  }
  if (act === "add-driver") {
    ev.preventDefault();
    ev.stopPropagation();
    openDriverModal();
    return;
  }
  if (act === "copy-key") {
    ev.preventDefault();
    ev.stopPropagation();
    const key = el.dataset.key || "";
    if (!key) return;
    copySilent(key).then((ok) => { if (ok) flashCopied(key, el); });
    return;
  }
  if (act === "make-key") {
    ev.preventDefault();
    ev.stopPropagation();
    run(async () => {
      const key = await ensureDriverKey(id);
      await copySilent(key);
      keepScroll = true;
      await render();
      flashCopied(key);
    });
    return;
  }
  if (act === "pick-user") {
    ev.preventDefault();
    const input = document.querySelector("form[data-form=signup] input[name=username]");
    if (input) {
      input.value = el.dataset.user || "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
    return;
  }
  if (act === "add-close") {
    if (el.classList.contains("modal-bg") && ev.target !== el) return;
    closeModal();
  }
  if (act === "rename") {
    const d = getDriver();
    const name = prompt(t("name"), d?.name || "");
    if (name) run(async () => { await renameDriver(name); await render(); });
  }
  if (act === "load-ok") {
    if ((getTrip(date).filledOut || 0) < 1) return;
    confirmLoad(date);
    window.scrollTo(0, 0);
    paintFast();
    return;
  }
  if (act === "trip-bump") {
    bumpTrip(date, el.dataset.field, Number(el.dataset.delta));
    paintFast();
  }
  if (act === "bump") {
    bump(date, id, el.dataset.field, Number(el.dataset.delta));
    paintFast();
  }
  if (act === "usual") {
    fillUsual(date, id);
    paintFast();
  }
  if (act === "done") {
    markComplete(date, id);
    if (pendingIds(date).length === 0) window.scrollTo(0, 0);
    paintFast();
  }
  if (act === "undo") {
    markPending(date, id);
    paintFast();
  }
  if (act === "up") run(async () => { await moveRoute(date, null, id, -1); keepScroll = true; await render(); });
  if (act === "down") run(async () => { await moveRoute(date, null, id, 1); keepScroll = true; await render(); });
  if (act === "seq-up") run(async () => { await moveSequence(date, null, id, -1); keepScroll = true; await render(); });
  if (act === "seq-down") run(async () => { await moveSequence(date, null, id, 1); keepScroll = true; await render(); });
  if (act === "hash") {
    ev.preventDefault();
    const go = el.dataset.go || "";
    if (go && location.hash !== go) location.hash = go;
    else if (go) run(render);
    return;
  }
  if (act === "speak") {
    ev.preventDefault();
    ev.stopPropagation();
    const c = getCustomer(id);
    if (c?.name) speakName(c.name);
    return;
  }
  if (act === "speak-text") {
    ev.preventDefault();
    ev.stopPropagation();
    const key = el.dataset.key || "";
    if (key === "owner_welcome") {
      speakName(t("owner_welcome", { u: getState().org?.username || getSession()?.username || "username" }));
      return;
    }
    const note = el.closest(".guide-note, .setup-card")?.querySelector("p")?.textContent;
    speakName(note || t(key));
    return;
  }
  if (act === "edit-cust") {
    ev.preventDefault();
    ev.stopPropagation();
    const c = getCustomer(id);
    if (c) openAdd({ name: c.name, place: c.place || "", rate: c.jarRate || 0, id: c.id });
  }
  if (act === "deactivate") {
    if (confirm(t("del_cust"))) {
      run(async () => { await deactivateCustomer(id); closeModal(); await render(); });
    }
  }
  if (act === "pay-del") {
    if (confirm(t("del_pay"))) {
      run(async () => { await removePayment(id); keepScroll = true; await render(); });
    }
  }
  if (act === "bill-print") window.print();
  if (act === "bill-save") {
    const sheet = document.getElementById("bill-sheet");
    if (!sheet || !window.html2canvas) {
      window.print();
      return;
    }
    run(async () => {
      const canvas = await window.html2canvas(sheet, { scale: 2, backgroundColor: "#ffffff" });
      const a = document.createElement("a");
      const who = (getCustomer(parseHash().customerId)?.name || "Bill").replace(/[^\w]+/g, "-");
      a.download = `Sanjay-Aqua-${who}-Bill.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    });
  }
  if (act === "sheet-save") {
    const sheet = document.getElementById("bs-sheet");
    if (!sheet || !window.html2canvas) {
      window.print();
      return;
    }
    run(async () => {
      const canvas = await window.html2canvas(sheet, { scale: 2, backgroundColor: "#fbf8f1" });
      const a = document.createElement("a");
      a.download = `Sanjay-Aqua-Balance-Sheet.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    });
  }
});

document.addEventListener("input", (ev) => {
  const user = ev.target.closest("[data-act=user-check]");
  if (user) {
    const status = document.getElementById("user-status");
    const ideas = document.getElementById("user-ideas");
    const u = normalizeUsername(user.value);
    clearTimeout(userCheckTimer);
    if (u.length < 3) {
      if (status) status.innerHTML = `<span class="muted">${t("user_min")}</span>`;
      if (ideas) ideas.innerHTML = "";
      return;
    }
    if (status) status.textContent = t("checking");
    userCheckTimer = setTimeout(async () => {
      try {
        const taken = await usernameTaken(u);
        if (normalizeUsername(user.value) !== u) return;
        if (taken) {
          if (status) status.innerHTML = `<span class="bad">${t("taken", { u })}</span>`;
          const opts = usernameSuggestions(u, new Set([u]));
          if (ideas) ideas.innerHTML = opts.map((x) => `<button type="button" class="idea" data-act="pick-user" data-user="${x}">${x}</button>`).join("");
        } else {
          if (status) status.innerHTML = `<span class="ok">${t("free", { u })}</span>`;
          if (ideas) ideas.innerHTML = "";
        }
      } catch (err) {
        if (status) status.textContent = err.message || err;
      }
    }, 350);
    return;
  }
  const search = ev.target.closest("[data-act=cust-search]");
  if (!search) return;
  ownerCustQuery = search.value;
  const list = document.getElementById("owner-cust-list");
  if (!list) return;
  const r = parseHash();
  const range = periodRange(r.period, r.month);
  list.innerHTML = stateCustomersList(periodPath(range), range, ownerCustQuery);
});

document.addEventListener("change", (ev) => {
  const lang = ev.target.closest("[data-act=lang]");
  if (lang) {
    setLang(lang.value);
    keepScroll = true;
    render({ skipLoad: true, skipOwnerFetch: true });
    return;
  }
  const month = ev.target.closest("[data-act=owner-month]");
  if (month && month.value) {
    const base = month.dataset.base || "#/owner";
    location.hash = `${base}/m/${month.value}`;
  }
});

document.addEventListener("focusout", (ev) => {
  const trip = ev.target.closest("[data-act=trip-set]");
  const date = app.dataset.date || businessDate();
  if (trip) {
    setTripCount(date, trip.dataset.field, trip.value);
    paintFast();
    return;
  }
  const inp = ev.target.closest("[data-act=set]");
  if (!inp) return;
  setCount(date, inp.dataset.id, inp.dataset.field, inp.value);
  paintFast();
});

document.addEventListener("submit", (ev) => {
  const form = ev.target.closest("[data-form]");
  if (!form) return;
  ev.preventDefault();
  const fd = new FormData(form);
  if (form.dataset.form === "config") {
    saveSupabaseConfig(String(fd.get("url") || ""), String(fd.get("key") || ""));
    resetClient();
    run(render);
    return;
  }
  if (form.dataset.form === "login-owner") {
    markFormWait(form);
    run(async () => {
      try {
        await loginOwner({ username: fd.get("username"), password: fd.get("password") });
        loginWaitUntil = 0;
        location.hash = "#/owner";
        await render();
      } catch (err) {
        noteLoginWait(err);
        renderLogin("owner");
        throw err;
      }
    });
    return;
  }
  if (form.dataset.form === "login-driver") {
    markFormWait(form);
    run(async () => {
      try {
        await loginDriverAccount({ username: fd.get("username"), key: fd.get("key") });
        loginWaitUntil = 0;
        location.hash = "#/";
        await render();
      } catch (err) {
        noteLoginWait(err);
        renderLogin("driver");
        throw err;
      }
    });
    return;
  }
  if (form.dataset.form === "signup") {
    markFormWait(form);
    run(async () => {
      const pass = String(fd.get("password") || "");
      const confirm = String(fd.get("confirm") || "");
      if (pass !== confirm) throw new Error(t("pass_bad"));
      await signupOwner({
        username: fd.get("username"),
        firmName: fd.get("firm"),
        password: pass,
        inviteKey: fd.get("invite"),
      });
      location.hash = "#/owner";
      await render();
    });
    return;
  }
  if (form.dataset.form === "add-driver") {
    run(async () => {
      const row = await addDriverAccount(String(fd.get("name") || ""));
      closeModal();
      await copySilent(row.login_key);
      keepScroll = true;
      await render();
      flashCopied(row.login_key);
    });
    return;
  }
  if (form.dataset.form === "pay") {
    run(async () => {
      await addPayment(form.dataset.id, {
        amount: fd.get("amount"),
        forMonth: String(fd.get("month") || ""),
        paidOn: businessDate(),
      });
      keepScroll = true;
      await render();
    });
    return;
  }
  run(async () => {
    const payload = {
      name: String(fd.get("name") || ""),
      place: String(fd.get("place") || ""),
    };
    if (fd.has("rate")) payload.rate = fd.get("rate");
    if (form.dataset.form === "edit") await updateCustomer(form.dataset.id, payload);
    else await addCustomer(payload);
    closeModal();
    await render();
  });
});

function fitPhoneFrame() {
  const scale = window.visualViewport?.scale || 1;
  if (scale <= 1.02) return;
  const meta = document.querySelector('meta[name="viewport"]');
  if (!meta) return;
  const allow = "width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover, shrink-to-fit=no";
  meta.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, shrink-to-fit=no");
  setTimeout(() => meta.setAttribute("content", allow), 80);
}

window.addEventListener("hashchange", () => { run(render); });
window.addEventListener("pageshow", fitPhoneFrame);
run(async () => {
  await render();
  fitPhoneFrame();
});
startTimer();
