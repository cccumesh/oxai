import { saveSupabaseConfig } from "./config.js";
import { resetClient, subscribeOwnerLive, stopOwnerLive, usernameTaken } from "./db.js";
import { getSession, normalizeUsername, usernameSuggestions } from "./auth.js";
import {
  load, getState, businessDate, displayDate, remainingMs,
  getDriver, renameDriver, getCustomer, pendingIds, completeIds,
  bump, fillUsual, markComplete, markPending, moveRoute, addCustomer,
  updateCustomer, deactivateCustomer, dayStats, getDay, setCount,
  routeIds, setRouteOrder, moveSequence, ownerStats, refreshDate,
  getTrip, bumpTrip, setTripCount, lastWorkDates, periodRange, loadOwnerRange,
  ownerPeriodStats, ownerDriverDetail, ownerCustomerLedger, vehicleStock, tripLoss, returnExpect,
  rupee, inrWords, billDate, ownerLossByDriver, ownerBalanceSheet,
  ownerCustomerPeriodJars, ownerCustomerMoney, monthLabel, addPayment, removePayment,
  isMonthRegister, ownerDriverRegister, getFirmName,
  signupOwner, loginOwner, loginDriverAccount, addDriverAccount, ensureDriverKey, logout,
} from "./store.js";

const app = document.getElementById("app");
let tick = null;
let keepScroll = false;
let busy = false;
let ownerCustQuery = "";
let userCheckTimer = null;

function pad(n) {
  return String(Math.max(0, Math.floor(n))).padStart(2, "0");
}

function formatRemain(ms) {
  if (ms <= 0) return "Din band";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

function parseHash() {
  const h = (location.hash || "#/").replace(/^#/, "");
  const parts = h.split("/").filter(Boolean);
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
        <div>
          <h1>${firm}</h1>
          <p>${subtitle || me?.name || "Delivery"}</p>
        </div>
        <div class="day-chip">
          ${session ? `<button type="button" class="logout-btn" data-act="logout">Logout</button>` : ""}
          <div>${displayDate(date || today)}${isPast ? " · pehla din" : ""}</div>
          ${isOwnerRoute() ? `<div class="live-dot">Live</div>` : showTimer !== false ? `<div class="timer" data-timer="${date || today}">${isPast ? "Edit allowed" : formatRemain(remain)}</div>` : ""}
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
  const dates = lastWorkDates(4);
  const labels = ["Aaj", "Kal", "2 din pehle", "3 din pehle"];
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
        <a href="#/owner/${p === "today" ? "today" : p}" class="${active === "owner" ? "on" : ""}">Dashboard</a>
        <a href="#/owner/month" class="${active === "owner-month" ? "on" : ""}">Mahina</a>
        <a href="#/owner/pending" class="${active === "owner-pending" ? "on" : ""}">Pending</a>
        <a href="#/owner/sheet/${p}" class="${active === "owner-sheet" ? "on" : ""}">Sheet</a>
      </nav>
    `;
  }
  return `
    <nav class="nav nav-3">
      <a href="#/" class="${active === "home" ? "on" : ""}">Route</a>
      <a href="#/customers" class="${active === "customers" ? "on" : ""}">Customers</a>
      <button type="button" data-act="add-open">+ Naya</button>
    </nav>
  `;
}

function renderConfig() {
  app.innerHTML = `
    ${header({ subtitle: "Supabase setup", showTimer: false })}
    <main class="wrap">
      <div class="card">
        <h3 style="margin-bottom:8px;color:var(--deep)">Pehle database jodo</h3>
        <p class="muted" style="margin-bottom:12px">Supabase project banao, SQL Editor mein <b>schema.sql</b> chalao, phir Project Settings → API se URL aur anon key yahan paste karo.</p>
        <form data-form="config">
          <div class="field"><label>Project URL</label><input name="url" required placeholder="https://xxxx.supabase.co" /></div>
          <div class="field"><label>anon public key</label><input name="key" required placeholder="eyJ..." /></div>
          <button class="primary" type="submit" style="width:100%;border:0;border-radius:12px;padding:12px">Save & connect</button>
        </form>
        <p class="muted" style="margin-top:14px">Login: <b>#/login</b></p>
      </div>
    </main>
  `;
}

function authShell(inner) {
  return `
    <main class="auth-wrap">
      <div class="auth-brand">
        <div class="logo auth-logo" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
            <path d="M24 4C24 4 10 20.2 10 30a14 14 0 0028 0C38 20.2 24 4 24 4z" fill="#67e8f9"/>
            <path d="M24 16c0 0-7 8.8-7 14a7 7 0 0014 0c0-5.2-7-14-7-14z" fill="#ecfeff"/>
          </svg>
        </div>
        <h1>Aqua Jar</h1>
        <p>20 litre delivery · har plant ka apna hisaab</p>
      </div>
      ${inner}
    </main>
  `;
}

function renderLogin(mode = "owner") {
  const driver = mode === "driver";
  app.innerHTML = authShell(`
    <div class="auth-card">
      <div class="auth-tabs">
        <a href="#/login" class="${driver ? "" : "on"}">Plant</a>
        <a href="#/login/driver" class="${driver ? "on" : ""}">Jar Supply</a>
      </div>
      ${driver ? `
        <h2>Jar Supply login</h2>
        <p class="muted">Company username + jo key plant ne di</p>
        <form data-form="login-driver">
          <div class="field"><label>Company username</label><input name="username" required autocomplete="username" placeholder="jaise sanjayaqua" /></div>
          <div class="field"><label>Supply key</label><input name="key" required autocomplete="off" placeholder="ABCD-EFGH" style="text-transform:uppercase;letter-spacing:0.08em" /></div>
          <button class="primary" type="submit" style="width:100%;border:0;border-radius:12px;padding:12px">Login</button>
        </form>
      ` : `
        <h2>Plant login</h2>
        <p class="muted">Ek baar login, logout tak yahi rahega</p>
        <form data-form="login-owner">
          <div class="field"><label>Username</label><input name="username" required autocomplete="username" placeholder="jaise sanjayaqua" /></div>
          <div class="field"><label>Password</label><input name="password" type="password" required autocomplete="current-password" minlength="6" /></div>
          <button class="primary" type="submit" style="width:100%;border:0;border-radius:12px;padding:12px">Login</button>
        </form>
      `}
      <p class="auth-foot">Nayi company? <a href="#/signup">Account banao</a></p>
    </div>
  `);
}

function renderSignup() {
  app.innerHTML = authShell(`
    <div class="auth-card">
      <h2>Nayi company</h2>
      <p class="muted">Username unique hoga. Firm ka naam baad mein board wala.</p>
      <form data-form="signup">
        <div class="field">
          <label>Username</label>
          <input name="username" required minlength="3" autocomplete="off" placeholder="sanjayaqua" data-act="user-check" />
          <div class="user-status" id="user-status"></div>
          <div class="user-ideas" id="user-ideas"></div>
        </div>
        <div class="field"><label>Firm ka naam</label><input name="firm" required minlength="2" placeholder="Sanjay Aqua" /></div>
        <div class="field"><label>Password</label><input name="password" type="password" required minlength="6" autocomplete="new-password" /></div>
        <div class="field"><label>Password dubara</label><input name="confirm" type="password" required minlength="6" autocomplete="new-password" /></div>
        <button class="primary" type="submit" style="width:100%;border:0;border-radius:12px;padding:12px">Account banao</button>
      </form>
      <p class="auth-foot">Pehle se account hai? <a href="#/login">Login</a></p>
    </div>
  `);
}

function afterPreview(c, e) {
  return (c.pendingJars || 0) + (e.jarsGiven || 0) - (e.emptyCollected || 0);
}

function speakBtn(id) {
  return `
    <button type="button" class="speak-btn" data-act="speak" data-id="${id}" aria-label="Naam bolo">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/>
        <path d="M16.5 8.5a5 5 0 010 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M18.7 6.3a8 8 0 010 11.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
  `;
}

function speakName(text) {
  const t = String(text || "").trim();
  if (!t) return;
  const synth = window.speechSynthesis;
  if (!synth) {
    alert("Is phone pe naam bolne wala speaker nahi chala.");
    return;
  }
  synth.cancel();
  const u = new SpeechSynthesisUtterance(t);
  u.lang = "hi-IN";
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
    const t = e.completedAt ? new Date(e.completedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";
    return `
      <article class="card done">
        <div class="cust-name-row">
          <div class="cust-name">${c.name}</div>
          ${speakBtn(id)}
        </div>
        <div class="pending-box"><b>${c.pendingJars}</b><span>Market mein pending jar</span></div>
        <div class="done-meta">
          <span>Dale: ${e.jarsGiven}</span>
          <span>Utaye: ${e.emptyCollected}</span>
          <span>${t}</span>
        </div>
        <button class="undo" data-act="undo" data-id="${id}">Wapas pending mein</button>
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
        <span>Pending jar — yahan uthana baki</span>
      </div>
      <div class="counters">
        <div class="counter">
          <label>Kitne jar diye</label>
          <div class="stepper">
            <button class="minus" data-act="bump" data-id="${id}" data-field="jarsGiven" data-delta="-1">−</button>
            <input class="val" type="text" inputmode="numeric" pattern="[0-9]*" data-act="set" data-id="${id}" data-field="jarsGiven" value="${e.jarsGiven}" />
            <button class="plus" data-act="bump" data-id="${id}" data-field="jarsGiven" data-delta="1">+</button>
          </div>
        </div>
        <div class="counter">
          <label>Khali jar uthe</label>
          <div class="stepper">
            <button class="minus" data-act="bump" data-id="${id}" data-field="emptyCollected" data-delta="-1">−</button>
            <input class="val" type="text" inputmode="numeric" pattern="[0-9]*" data-act="set" data-id="${id}" data-field="emptyCollected" value="${e.emptyCollected}" />
            <button class="plus" data-act="bump" data-id="${id}" data-field="emptyCollected" data-delta="1">+</button>
          </div>
        </div>
      </div>
      <p class="preview">Iske baad market mein baki: <b>${next}</b> jar</p>
      <button class="done-btn" data-act="done" data-id="${id}">Delivery complete ✓</button>
    </article>
  `;
}

function rokdaHtml(date) {
  const t = getTrip(date);
  return `
    <div class="extra-box extra-rokda" style="margin-top:8px">
      <label>Rokda becha</label>
      <div class="stepper mini">
        <button class="minus" data-act="trip-bump" data-field="rokdaJars" data-delta="-1">−</button>
        <input class="val" type="text" inputmode="numeric" pattern="[0-9]*" data-act="trip-set" data-field="rokdaJars" value="${t.rokdaJars || 0}" />
        <button class="plus" data-act="trip-bump" data-field="rokdaJars" data-delta="1">+</button>
      </div>
    </div>
  `;
}

function returnPanelHtml(date) {
  const x = returnExpect(date);
  const mismatch = x.returned > 0 && x.returned !== x.totalShould;
  const extraNote = x.extraShop > 0
    ? `Shop se ${x.extraShop} extra khali uthe (pehle ka pending). Yeh jar gadi mein extra aaye — plant se leke gaye se zyada ho sakta hai.`
    : x.extraShop < 0
      ? `Shop pe ${Math.abs(x.extraShop)} khali pada / pending. Gadi ke total mein yeh nahi — wahan hi pade hain.`
      : "";
  return `
    <div class="plant-box return-box">
      <h3>Plant wapas</h3>
      <p class="muted">Pani gira = wahi jar ab khali. Tuta = gadi mein nahi aayega. Shop wali khali alag hai.</p>
      <div class="return-calc">
        <div class="return-row"><span>Plant se bhare gaye</span><b>${x.filledOut}</b></div>
        <div class="return-row"><span>Route dale + rokda</span><b>${x.sold}</b></div>
        <div class="return-row"><span>Tuta (wapas nahi)</span><b>− ${x.broke}</b></div>
        <div class="return-row"><span>Pani gira (ab khali, jar hai)</span><b>${x.leak}</b></div>
        <div class="return-row"><span>Shop se khali uthaye</span><b>${x.shopEmpty}</b></div>
        <div class="return-row hi"><span>Bhare wapas</span><b>${x.filledShould}</b></div>
        <div class="return-row hi"><span>Khali wapas (shop + pani gira)</span><b>${x.emptyShould}</b></div>
        <div class="return-row tot"><span>Total gadi mein wapas</span><b>${x.totalShould}</b></div>
      </div>
      ${extraNote ? `<p class="muted" style="margin-bottom:8px">${extraNote}</p>` : ""}
      <div class="work-extras">
        <div class="extra-box">
          <label>Pani gira (ab khali)</label>
          <div class="stepper mini">
            <button class="minus" data-act="trip-bump" data-field="leakJars" data-delta="-1">−</button>
            <input class="val" type="text" inputmode="numeric" pattern="[0-9]*" data-act="trip-set" data-field="leakJars" value="${getTrip(date).leakJars}" />
            <button class="plus" data-act="trip-bump" data-field="leakJars" data-delta="1">+</button>
          </div>
        </div>
        <div class="extra-box">
          <label>Jar toot gaya</label>
          <div class="stepper mini">
            <button class="minus" data-act="trip-bump" data-field="brokeJars" data-delta="-1">−</button>
            <input class="val" type="text" inputmode="numeric" pattern="[0-9]*" data-act="trip-set" data-field="brokeJars" value="${getTrip(date).brokeJars}" />
            <button class="plus" data-act="trip-bump" data-field="brokeJars" data-delta="1">+</button>
          </div>
        </div>
      </div>
      <div class="counter" style="margin-top:10px">
        <label>Total jar wapas laye (aap gino)</label>
        <div class="stepper">
          <button class="minus" data-act="trip-bump" data-field="returnedJars" data-delta="-1">−</button>
          <input class="val" type="text" inputmode="numeric" pattern="[0-9]*" data-act="trip-set" data-field="returnedJars" value="${x.returned}" />
          <button class="plus" data-act="trip-bump" data-field="returnedJars" data-delta="1">+</button>
        </div>
      </div>
      ${mismatch ? `<p class="stock-warn">Aapne ${x.returned} likhe, system kehta hai ${x.totalShould} hone chahiye. Gino phir se.</p>` : ""}
      ${x.returned > 0 && x.returned === x.totalShould ? `<p class="return-ok">Hisaab match — ${x.returned} jar wapas.</p>` : ""}
    </div>
  `;
}

function dayFootHtml(date, stats) {
  return `
    <div class="foot-stats">
      ${dayStrip(date)}
      <div class="kpis">
        <div class="kpi"><b>${stats.pending}</b><span>Baaki</span></div>
        <div class="kpi"><b>${stats.done}</b><span>Complete</span></div>
        <div class="kpi"><b>${stats.jars + (getTrip(date).rokdaJars || 0)}</b><span>Jar diye</span></div>
        <div class="kpi"><b>${stats.empty}</b><span>Khali uthe</span></div>
      </div>
    </div>
  `;
}

function plantBoxHtml(date, stock) {
  return `
      <div class="plant-box">
        <h3>Gadi mein bhare jar</h3>
        <div class="stock-row">
          <div class="counter">
            <label>Bhare leke gaye</label>
            <div class="stepper">
              <button class="minus" data-act="trip-bump" data-field="filledOut" data-delta="-1">−</button>
              <input class="val" type="text" inputmode="numeric" pattern="[0-9]*" data-act="trip-set" data-field="filledOut" value="${getTrip(date).filledOut}" />
              <button class="plus" data-act="trip-bump" data-field="filledOut" data-delta="1">+</button>
            </div>
          </div>
          <div class="stock-read ${stock.remaining < 0 ? "stock-bad" : ""}">
            <div class="stock-pair">
              <span>Bik gaye</span>
              <b>${stock.sold}</b>
            </div>
            <div class="stock-pair">
              <span>Ab gadi mein bhare</span>
              <b>${stock.remaining}</b>
            </div>
            ${stock.leakEmpty ? `<div class="stock-pair"><span>Pani gira = khali</span><b>${stock.leakEmpty}</b></div>` : ""}
          </div>
        </div>
        ${rokdaHtml(date)}
        ${stock.remaining < 0 ? `<p class="stock-warn">Bik gaye + pani/toot plant se leke gaye se zyada. Number check karo.</p>` : ""}
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
        <h2>Sab complete</h2>
        <p>Route complete. Neeche plant wapas hisaab bharo.</p>
      </div>
    </section>
    <section class="close-box">
      <h3>Aaj ka hisaab</h3>
      <div class="close-grid close-grid-3">
        <div class="close-tile">
          <b>${trip.filledOut}</b>
          <span>Bhar ke gaye</span>
        </div>
        <div class="close-tile">
          <b>${stats.empty + loss.leak}</b>
          <span>Khali (uthaye + pani gira)</span>
        </div>
        <div class="close-tile">
          <b>${stock.delivered}</b>
          <span>Route dale</span>
        </div>
        <div class="close-tile">
          <b>${rokda}</b>
          <span>Rokda becha</span>
        </div>
        <div class="close-tile">
          <b>${stock.sold}</b>
          <span>Total bika</span>
        </div>
        <div class="close-tile">
          <b>${trip.filledBack}</b>
          <span>Bhare wapas</span>
        </div>
        <div class="close-tile">
          <b>${loss.broke}</b>
          <span>Jar toot</span>
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
  const titles = { 0: "aaj ka route", 1: "kal ka route", 2: "2 din pehle", 3: "3 din pehle" };
  const idx = lastWorkDates(4).indexOf(date);
  const when = titles[idx] || displayDate(date);
  const allDone = pending.length === 0 && stats.total > 0;
  app.innerHTML = `
    ${header({ subtitle: (me?.name || "Driver") + " · " + when, date, showTimer: !isPast })}
    <main class="wrap">
      ${isPast ? `<div class="banner">Yeh ${when} wala page hai — aaj jaisa hi. Galat number ho to yahin theek karo.</div>` : ""}
      ${allDone ? dayCloseHtml(date, pending, stats, stock) : plantBoxHtml(date, stock)}
      ${allDone ? "" : `<div class="kpi accent-kpi"><b>${stats.marketPending}</b><span>Is route ke pending jar (market)</span></div>`}
      ${allDone ? "" : `
      <div class="section-h">
        <h2>Baaki customers</h2>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="count">${pending.length}</span>
          <a class="seq-link" href="#/sequence/${date}">Sequence</a>
        </div>
      </div>
      ${pending.length
        ? pending.map((id) => customerCard(date, id, false)).join("")
        : `<div class="empty">Abhi koi customer nahi. Neeche + Naya se naam add karo.</div>`}
      `}
      <div class="section-h" style="margin-top:18px">
        <h2>Delivery complete</h2>
        <span class="count">${done.length}</span>
      </div>
      ${done.length ? done.map((id) => customerCard(date, id, true)).join("") : `<div class="empty">Complete ke baad yahan aayega.</div>`}
      ${returnPanelHtml(date)}
      ${dayFootHtml(date, stats)}
    </main>
    <button class="fab" data-act="add-open">+ Naya customer</button>
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
    ${header({ subtitle: (me?.name || "Driver") + " · sequence", date: dateUse, showTimer: false })}
    <main class="wrap">
      <a class="back-link" href="${dayHref(dateUse)}">← Route par wapas</a>
      <div class="section-h"><h2>Delivery sequence</h2><span class="count">${ids.length}</span></div>
      <p class="muted seq-help">Sirf naam. ▲ ▼ ya drag se pehle/baad set karo — Supabase par save hoga.</p>
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
                  <span class="seq-name">${c.name}${done ? " <em>complete</em>" : ""}</span>
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
      ` : `<div class="empty">Pehle customer add karo.</div>`}
    </main>
    ${bottomNav("home")}
  `;
  app.dataset.date = dateUse;
  bindSeqSort();
}

function renderCustomers() {
  const { customers } = getState();
  app.innerHTML = `
    ${header({ subtitle: "Mere customers", showTimer: false })}
    <main class="wrap">
      <p class="muted" style="margin-bottom:10px">${customers.length} customers · pending = market mein baki jar</p>
      ${customers.length ? customers.map((c) => `
        <div class="list-item">
          <div style="flex:1;min-width:0">
            <div class="cust-name-row">
              <strong>${c.name}</strong>
              ${speakBtn(c.id)}
            </div>
            <div class="muted">${c.place ? c.place + " · " : ""}pending ${c.pendingJars}</div>
          </div>
          <button class="ghost" style="padding:8px 10px;border-radius:10px;border:0;font-weight:800" data-act="edit-cust" data-id="${c.id}">Edit</button>
        </div>
      `).join("") : `<div class="empty">List khali hai. Apne route ke naam add karo.</div>`}
    </main>
    <button class="fab" data-act="add-open">+ Naya customer</button>
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
    ["today", "Aaj"],
    ["month", "Mahina"],
    ["year", "Saal"],
    ["all", "Sab"],
  ];
  return `
    <div class="day-tabs">
      ${items.map(([p, label]) => `<a href="${base}/${p}" class="${range.period === p ? "on" : ""}"><strong>${label}</strong></a>`).join("")}
    </div>
    <div class="field" style="margin-bottom:12px">
      <label>Koi mahina chuno (bill / history)</label>
      <input type="month" value="${monthVal}" data-act="owner-month" data-base="${base}" />
    </div>
  `;
}

function renderOwner(range) {
  const s = ownerPeriodStats();
  const path = periodPath(range);
  const gineBad = s.returnMismatch || ((s.counted || 0) > 0 && s.counted !== s.expectTotal);
  app.innerHTML = `
    ${header({ subtitle: "Plant dashboard · " + range.label, date: range.to, showTimer: false })}
    <main class="wrap">
      ${ownerPeriodTabs("#/owner", range)}
      <div class="kpis kpis-3">
        <div class="kpi"><b>${s.filledOut}</b><span>Bhar ke gaye</span></div>
        <div class="kpi"><b>${s.jarsToCustomers + (s.rokda || 0)}</b><span>Total bika</span></div>
        <div class="kpi"><b>${s.remaining}</b><span>Bache hisaab</span></div>
      </div>
      <div class="kpis kpis-3">
        <div class="kpi"><b>${s.rokda || 0}</b><span>Rokda</span></div>
        <div class="kpi"><b>${s.filledBack}</b><span>Bhare wapas</span></div>
        <div class="kpi"><b>${s.empty}</b><span>Khali aaye</span></div>
      </div>
      <div class="kpis kpis-3">
        <a class="kpi ${s.leak ? "kpi-warn" : ""} kpi-link" href="#/owner/loss/cap/${path}" data-act="hash" data-go="#/owner/loss/cap/${path}">
          <b>${s.leak || 0}</b><span>Cap / pani gira</span><em>kis driver · dabao</em>
        </a>
        <a class="kpi ${s.broke ? "kpi-warn" : ""} kpi-link" href="#/owner/loss/toot/${path}" data-act="hash" data-go="#/owner/loss/toot/${path}">
          <b>${s.broke || 0}</b><span>Toot</span><em>kis driver · dabao</em>
        </a>
        <a class="kpi ${gineBad ? "kpi-warn" : ""} kpi-link" href="#/owner/loss/${path}">
          <b>${s.counted || 0}<small> / ${s.expectTotal || 0}</small></b><span>Gine / chahiye</span>
        </a>
      </div>
      ${gineBad ? `<p class="stock-warn" style="margin-bottom:12px">Driver ne ${s.counted} gine, system kehta hai ${s.expectTotal} wapas hone chahiye.</p>` : ""}
      <a class="kpi accent-kpi" href="#/owner/pending/${path}" style="display:block">
        <b>${s.pendingMarket}</b><span>Jar pending in market · list ke liye dabao</span>
      </a>
      <p class="muted" style="margin:-6px 0 14px">Agle din khali uthane par yeh number kam hoga. Paisa udhari alag hai.</p>
      <div class="section-h">
        <h2>Jar Supply — naam dabao</h2>
        <button type="button" class="ghost rate-btn" data-act="add-driver">+ Add</button>
      </div>
      ${s.byDriver.length ? s.byDriver.map((d) => {
        const full = (getState().owner.drivers || []).find((x) => x.id === d.id);
        const key = full?.login_key || "";
        return `
        <div class="driver-card ${d.returnMismatch ? "driver-mismatch" : ""}">
          <a href="#/owner/driver/${d.id}/${path}" style="display:flex;align-items:center;gap:12px;flex:1;min-width:0">
            <div class="avatar" style="background:#0e7490">${(d.name || "?").slice(0, 1)}</div>
            <div style="flex:1">
              <h3>${d.name}</h3>
              <p>Leke ${d.filledOut} · dale ${d.jars} · cap ${d.leak || 0} · toot ${d.broke || 0}</p>
              <p>Market mein atke ${d.pending || 0} jar · gine ${d.counted || 0} / ${d.expectTotal || 0}${d.returnMismatch ? " · match nahi" : ""}</p>
            </div>
            <span class="go">Table</span>
          </a>
          <p class="driver-key-line">Key: <b>${key || "abhi nahi"}</b>
            ${key ? `<button type="button" class="ghost rate-btn" data-act="copy-key" data-key="${key}">Copy</button>` : `<button type="button" class="ghost rate-btn" data-act="make-key" data-id="${d.id}">Key banao</button>`}
          </p>
        </div>
      `;
      }).join("") : `<div class="empty">Jar Supply add karo. Unhe company username + key do.</div>`}
      <div class="section-h owner-cust-head">
        <h2>Customers</h2>
        <input class="cust-search" data-act="cust-search" type="search" placeholder="Naam / place dhoondo" value="${ownerCustQuery.replace(/"/g, "&quot;")}" autocomplete="off" />
      </div>
      <div id="owner-cust-list">${stateCustomersList(path, range)}</div>
      <a class="bs-cta" href="#/owner/sheet/${path}">
        <strong>Balance Sheet</strong>
        <small>Paisa hisaab · jar statement · dekho, pasand aaye to rakhenge</small>
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
        ${amt ? `<div class="muted">Approx ₹ ${rupee(amt)}</div>` : ""}
      </div>
      <div class="pending-box hot" style="margin:0"><b>${c.pendingJars}</b><span>baki jar</span></div>
    </a>
  `;
}

function udhariByDriverHtml(path, groups, opts = {}) {
  if (!groups.length) return `<div class="empty">Kisi ke paas pending jar nahi.</div>`;
  const preview = opts.preview;
  return groups.map((g) => {
    const list = preview ? g.customers.slice(0, 4) : g.customers;
    const extra = preview && g.customers.length > list.length
      ? `<a class="muted" href="#/owner/pending/${path}" style="display:block;padding:4px 4px 10px">+${g.customers.length - list.length} aur is driver ke</a>`
      : "";
    return `
      <section class="udhari-group">
        <div class="udhari-driver">
          <div class="avatar" style="background:#0e7490">${(g.name || "?").slice(0, 1)}</div>
          <div style="flex:1">
            <h3>${g.name}</h3>
            <p>${g.customers.length} customer · inke route pe atke</p>
          </div>
          <div class="pending-box hot" style="margin:0"><b>${g.total}</b><span>atke jar</span></div>
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
    ${header({ subtitle: "Jar pending in market · " + range.label, date: range.to, showTimer: false })}
    <main class="wrap">
      <a class="back-link" href="#/owner/${path}">← Dashboard</a>
      ${ownerPeriodTabs("#/owner/pending", range)}
      <div class="kpi accent-kpi"><b>${s.pendingMarket}</b><span>Jar pending in market — sab drivers</span></div>
      <p class="muted" style="margin-bottom:10px">Yeh abhi market mein pade khali jar hain. Driver kal uthaye to yahan se minus. Customer ka naam dabao. Udhari (paisa) alag cheez hai.</p>
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
  const title = focus === "cap" ? "Cap / pani gira" : focus === "toot" ? "Jar toot" : "Cap + toot";
  const total = focus === "cap" ? (s.leak || 0) : focus === "toot" ? (s.broke || 0) : (s.leak || 0) + (s.broke || 0);
  const hint = focus === "cap"
    ? "Pani gira = jar gadi mein hi hai, ab khali. Kis driver ke kitne."
    : focus === "toot"
      ? "Toot = jar wapas nahi aaya. Kis driver ke kitne."
      : "Cap aur toot dono — kis driver ke, kis din.";
  app.innerHTML = `
    ${header({ subtitle: title + " · " + range.label, date: range.to, showTimer: false })}
    <main class="wrap">
      <a class="back-link" href="#/owner/${path}">← Dashboard</a>
      ${ownerPeriodTabs(lossBase, range)}
      <div class="day-tabs" style="margin-top:0">
        <a href="#/owner/loss/${path}" class="${focus === "all" ? "on" : ""}"><strong>Dono</strong></a>
        <a href="#/owner/loss/cap/${path}" class="${focus === "cap" ? "on" : ""}"><strong>Cap / gira</strong></a>
        <a href="#/owner/loss/toot/${path}" class="${focus === "toot" ? "on" : ""}"><strong>Toot</strong></a>
      </div>
      <div class="kpi accent-kpi ${total ? "kpi-warn" : ""}" style="display:block"><b>${total}</b><span>${title} — sab drivers</span></div>
      <p class="muted" style="margin-bottom:10px">${hint}</p>
      ${shownLossHtml(path, groups, focus)}
    </main>
    ${ownerNav(range)}
  `;
}

function shownLossHtml(path, groups, focus) {
  if (!groups.length) {
    return `<div class="empty">Is period mein ${focus === "toot" ? "koi toot" : focus === "cap" ? "koi pani gira" : "cap/toot"} nahi.</div>`;
  }
  return groups.map((g) => {
    const days = g.days.filter((p) => (focus === "cap" ? p.leak > 0 : focus === "toot" ? p.broke > 0 : true));
    return `
      <section class="udhari-group">
        <a class="udhari-driver" href="#/owner/driver/${g.id}/${path}">
          <div class="avatar" style="background:#0e7490">${(g.name || "?").slice(0, 1)}</div>
          <div style="flex:1">
            <h3>${g.name}</h3>
            <p>${focus === "cap" ? `Pani gira ${g.leak}` : focus === "toot" ? `Toot ${g.broke}` : `Cap ${g.leak} · toot ${g.broke}`}</p>
          </div>
          <div class="pending-box hot" style="margin:0">
            <b>${focus === "cap" ? g.leak : focus === "toot" ? g.broke : g.leak + g.broke}</b>
            <span>${focus === "toot" ? "toot" : focus === "cap" ? "gira" : "total"}</span>
          </div>
        </a>
        ${days.map((p) => `
          <div class="list-item owner-cust udhari-cust">
            <div>
              <strong>${billDate(p.date)}</strong>
              <div class="muted">${p.filledOut} bhar ke gaye · ${p.jars} dale</div>
            </div>
            <div class="muted" style="text-align:right;font-weight:800">
              ${focus !== "toot" ? `<div>Cap ${p.leak || 0}</div>` : ""}
              ${focus !== "cap" ? `<div>Toot ${p.broke || 0}</div>` : ""}
            </div>
          </div>
        `).join("")}
      </section>
    `;
  }).join("");
}

function periodJarLabel(range) {
  if (range.period === "today") return "Aaj dale";
  if (range.period === "month" || range.period === "m") return "Mahine ke jar";
  if (range.period === "year") return "Saal ke jar";
  return "Kul jar";
}

function stateCustomersList(path, range, q = ownerCustQuery) {
  const { customers, drivers } = getState().owner;
  if (!customers.length) return `<div class="empty">Abhi koi customer nahi.</div>`;
  const jarWord = periodJarLabel(range);
  const needle = String(q || "").trim().toLowerCase();
  const filtered = needle
    ? customers.filter((c) => {
        const d = drivers.find((x) => x.id === c.device_id);
        return [c.name, c.place, d?.name].some((v) => String(v || "").toLowerCase().includes(needle));
      })
    : customers;
  if (!filtered.length) return `<div class="empty">Koi customer nahi mila.</div>`;
  return filtered.map((c) => {
    const d = drivers.find((x) => x.id === c.device_id);
    const rate = Number(c.jarRate) || 0;
    const jars = ownerCustomerPeriodJars(c.id);
    const money = ownerCustomerMoney(c.id);
    const due = money.due;
    const dueHot = due > 0;
    const dueText = due < 0 ? `₹ ${rupee(Math.abs(due))}` : `₹ ${rupee(Math.max(0, due))}`;
    const dueLabel = due < 0 ? "advance" : "pending paise";
    return `
      <div class="list-item owner-cust">
        <a href="#/owner/bill/${c.id}/${path}">
          <strong>${c.name}</strong>
          ${c.place ? `<div class="muted">${c.place}</div>` : ""}
          <div class="muted">${jars} jar · ${jarWord} · ${d?.name || "Driver"}</div>
          <div class="muted">${rate ? `₹ ${rupee(rate)} / jar` : "Rate set nahi — pehle Rate dabao"}</div>
        </a>
        <div class="owner-cust-side">
          <a class="money-chip ${dueHot ? "hot" : ""}" href="#/owner/bill/${c.id}/${path}">
            <b>${dueText}</b>
            <span>${dueLabel}</span>
          </a>
          <button type="button" class="ghost rate-btn" data-act="edit-cust" data-id="${c.id}">Rate</button>
        </div>
      </div>
    `;
  }).join("");
}

function renderOwnerDriver(driverId, range) {
  const d = ownerDriverDetail(driverId);
  const path = periodPath(range);
  if (!d.driver) {
    app.innerHTML = `${header({ subtitle: "Driver nahi mila", showTimer: false })}<main class="wrap"><a class="back-link" href="#/owner/${path}">← Dashboard</a></main>`;
    return;
  }
  app.innerHTML = `
    ${header({ subtitle: d.driver.name + " · " + range.label, date: range.to, showTimer: false })}
    <main class="wrap ${isMonthRegister(range) ? "wrap-wide" : ""}">
      <a class="back-link" href="#/owner/${path}">← Dashboard</a>
      ${ownerPeriodTabs(`#/owner/driver/${driverId}`, range)}
      <div class="kpis kpis-3">
        <div class="kpi"><b>${d.filledOut}</b><span>Bhar ke le gaya</span></div>
        <div class="kpi"><b>${d.jars}</b><span>Dale</span></div>
        <div class="kpi"><b>${d.filledOut - d.jars - (d.rokda || 0) - d.waste}</b><span>Bache hisaab</span></div>
      </div>
      <div class="kpis kpis-3">
        <div class="kpi"><b>${d.rokda || 0}</b><span>Rokda</span></div>
        <div class="kpi"><b>${d.filledBack}</b><span>Bhare wapas</span></div>
        <div class="kpi"><b>${d.empty}</b><span>Khali laye</span></div>
      </div>
      <div class="kpis kpis-3">
        <a class="kpi ${d.leak ? "kpi-warn" : ""} kpi-link" href="#/owner/loss/cap/${path}" data-act="hash" data-go="#/owner/loss/cap/${path}">
          <b>${d.leak || 0}</b><span>Cap / pani gira</span><em>kis driver · dabao</em>
        </a>
        <a class="kpi ${d.broke ? "kpi-warn" : ""} kpi-link" href="#/owner/loss/toot/${path}" data-act="hash" data-go="#/owner/loss/toot/${path}">
          <b>${d.broke || 0}</b><span>Toot</span><em>kis driver · dabao</em>
        </a>
        <div class="kpi ${d.returnMismatch ? "kpi-warn" : ""}"><b>${d.counted || 0}<small> / ${d.expectTotal || 0}</small></b><span>Gine / chahiye</span></div>
      </div>
      ${d.returnMismatch ? `<p class="stock-warn" style="margin-bottom:12px">Is driver ne ${d.counted} gine, system ${d.expectTotal} kehta hai.</p>` : ""}
      <div class="ow-scroll">
        <table class="ow-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Leke</th>
              <th>Dale</th>
              <th>Cap</th>
              <th>Toot</th>
              <th>Rokda</th>
              <th>Wapas</th>
              <th>Gine</th>
              <th>Chahiye</th>
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
            `).join("") : `<tr><td colspan="9">Is period mein plant trip nahi.</td></tr>`}
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
    return `<div class="empty">Is mahine is driver ke customers nahi, ya delivery nahi.</div>`;
  }
  return `
    <div class="reg-legend">
      <strong>${g.label} register</strong>
      <span>Upar = kitne jar dale · Neeche = kitne khali uthaye · Side mein 1 se ${g.last} tarikh</span>
    </div>
    <div class="reg-scroll">
      <table class="reg-table">
        <thead>
          <tr>
            <th class="reg-name">${g.label}</th>
            ${g.days.map((date, i) => `<th class="reg-day${date === g.today ? " is-today" : ""}">${i + 1}</th>`).join("")}
            <th class="reg-tot">Total jar</th>
            <th class="reg-tot khali">Total khali</th>
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
            <th class="reg-name">Kul</th>
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
              <th>Date</th>
              <th>Time</th>
              <th>Customer</th>
              <th>Dale</th>
              <th>Khali</th>
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
            `).join("") : `<tr><td colspan="5">Is period mein koi complete delivery nahi.</td></tr>`}
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
    ${header({ subtitle: "Balance Sheet · " + range.label, date: range.to, showTimer: false })}
    <main class="wrap">
      <a class="back-link" href="#/owner/${path}">← Dashboard</a>
      ${ownerPeriodTabs("#/owner/sheet", range)}
      <div class="row-btns no-print" style="margin-bottom:12px">
        <button type="button" class="primary" data-act="bill-print">Print</button>
        <button type="button" class="ghost" data-act="sheet-save">Save image</button>
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
            <span>Net udhari</span>
            <b>₹ ${rupee(bs.equity)}</b>
          </div>
        </div>
        <div class="bs-meter">
          <div class="bs-meter-h">
            <span>Kul bill se kitna aaya</span>
            <strong>${bs.collectedPct}%</strong>
          </div>
          <div class="bs-bar"><i style="width:${bs.collectedPct}%"></i></div>
          <div class="bs-meter-f">Aaya ₹ ${rupee(bs.paidAll)} · Bill ₹ ${rupee(bs.billedAll)}</div>
        </div>
        <div class="bs-cols">
          <div class="bs-col">
            <div class="bs-col-h">Assets · jo hamare hain</div>
            <div class="bs-line"><span>Customer udhari (pending paise)</span><b>₹ ${rupee(bs.receivable)}</b></div>
            <div class="bs-line mute"><span>Cash / bank (app mein nahi)</span><b>—</b></div>
            <div class="bs-line total"><span>Total assets</span><b>₹ ${rupee(bs.assets)}</b></div>
          </div>
          <div class="bs-col">
            <div class="bs-col-h">Liabilities + capital</div>
            <div class="bs-line"><span>Customer advance</span><b>₹ ${rupee(bs.advance)}</b></div>
            <div class="bs-line"><span>Capital / net udhari</span><b>₹ ${rupee(bs.equity)}</b></div>
            <div class="bs-line total"><span>Total</span><b>₹ ${rupee(bs.liabEquity)}</b></div>
          </div>
        </div>
        <p class="bs-balance ${Math.abs(bs.assets - bs.liabEquity) < 0.05 ? "ok" : ""}">
          ${Math.abs(bs.assets - bs.liabEquity) < 0.05 ? "Books tally · Assets = Liabilities + Capital" : "Check numbers"}
        </p>
        <div class="bs-sec-h">Period account · ${range.label}</div>
        <div class="bs-lines">
          <div class="bs-line"><span>Is period mein dale (credit sale)</span><b>${bs.periodJars} jar · ₹ ${rupee(bs.periodSales)}</b></div>
          <div class="bs-line"><span>Is period mein payment aaya</span><b>₹ ${rupee(bs.periodCollected)}</b></div>
          <div class="bs-line gold"><span>Abhi pending paise (sab customers)</span><b>₹ ${rupee(bs.receivable)}</b></div>
        </div>
        <div class="bs-sec-h">Jar statement · ${range.label}</div>
        <div class="bs-jar">
          <div><em>${j.filledOut}</em><span>Plant se gaye</span></div>
          <div><em>${j.credit}</em><span>Customer ko</span></div>
          <div><em>${j.rokda}</em><span>Rokda</span></div>
          <div><em>${j.leak}</em><span>Cap / gira</span></div>
          <div><em>${j.broke}</em><span>Toot</span></div>
          <div><em>${j.empty}</em><span>Khali aaye</span></div>
          <div><em>${j.filledBack}</em><span>Bhare wapas</span></div>
          <div class="hot"><em>${j.pendingMarket}</em><span>Market mein jar</span></div>
        </div>
        <p class="bs-note">Market jar = khali uthana baki. Yeh paisa nahi. Rokda ka paisa yahan nahi, sirf jar count.</p>
        ${bs.periodPays.length ? `
          <div class="bs-sec-h">Is period ke payments</div>
          <table class="bs-table">
            <thead><tr><th>Date</th><th>Customer</th><th>Mahina</th><th class="num">₹</th></tr></thead>
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
          <div class="bs-sec-h">Udhari list · ${bs.debtorCount} customer</div>
          <table class="bs-table">
            <thead><tr><th>Customer</th><th>Driver</th><th class="num">Pending ₹</th></tr></thead>
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
        ` : `<p class="bs-note">Kisi customer ke pending paise nahi — ya rate / payment set nahi.</p>`}
        ${bs.byDriver.length ? `
          <div class="bs-sec-h">Driver wise</div>
          <table class="bs-table">
            <thead><tr><th>Driver</th><th class="num">Dale</th><th class="num">Market jar</th><th class="num">Udhari ₹</th></tr></thead>
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
          <div>E. &amp; O.E. · Rate aaj ka. Purana bill rate change se badal sakta hai.</div>
          <div>Prepared ${billDate(businessDate())}</div>
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
    app.innerHTML = `${header({ subtitle: "Customer nahi mila", showTimer: false })}<main class="wrap"><a class="back-link" href="#/owner/${path}">← Dashboard</a></main>`;
    return;
  }
  const inv = invoiceNo(c, range);
  const rateOk = led.rate > 0;
  app.innerHTML = `
    ${header({ subtitle: "Bill · " + c.name, date: range.to, showTimer: false })}
    <main class="wrap">
      <a class="back-link" href="#/owner/${path}">← Dashboard</a>
      ${ownerPeriodTabs(`#/owner/bill/${customerId}`, range)}
      ${rateOk ? "" : `<div class="banner no-print">Is customer ka rate nahi hai. <b>Customer / rate</b> dabao, ₹ likho, phir bill amount aayega.</div>`}
      <div class="row-btns no-print" style="margin-bottom:12px">
        <button type="button" class="ghost" data-act="edit-cust" data-id="${c.id}">Customer / rate</button>
        <button type="button" class="primary" data-act="bill-print">Print</button>
        <button type="button" class="ghost" data-act="bill-save">Save image</button>
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
            <div class="muted">Route: ${led.driver?.name || "—"}</div>
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
              <th>Date</th>
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
            `).join("") : `<tr><td colspan="6" class="bill-empty">Is period mein koi delivery nahi.</td></tr>`}
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
        <h3>Payment / pichle pending paise</h3>
        <div class="kpis kpis-3">
          <div class="kpi"><b>₹ ${rupee(led.billed)}</b><span>Kul bill (sab jar × rate)</span></div>
          <div class="kpi"><b>₹ ${rupee(led.paid)}</b><span>Kul paise aaye</span></div>
          <div class="kpi ${led.due > 0 ? "kpi-warn" : ""}"><b>₹ ${rupee(led.due)}</b><span>${led.due < 0 ? "Advance" : "Pichle pending paise"}</span></div>
        </div>
        <p class="muted">Is period: ${led.jars} jar × ₹ ${rupee(led.rate)} = ₹ ${rupee(led.amount)}. Malik yahan likhe kitne diye aur konse mahine ke.</p>
        <form data-form="pay" data-id="${c.id}">
          <div class="pay-grid">
            <div class="field"><label>Kitne paise aaye (₹)</label><input name="amount" type="number" inputmode="decimal" step="1" min="1" required placeholder="Jaise 1500" /></div>
            <div class="field"><label>Konse mahine ke</label><input name="month" type="month" value="${range.month || String(range.to || "").slice(0, 7)}" required /></div>
          </div>
          <button class="primary" type="submit" style="width:100%;margin-top:8px">Payment save</button>
        </form>
        ${led.payments?.length ? `
          <div class="ow-scroll" style="margin-top:14px">
            <table class="ow-table">
              <thead><tr><th>Date</th><th>Mahina</th><th>Paise</th><th></th></tr></thead>
              <tbody>
                ${led.payments.map((p) => `
                  <tr>
                    <td>${billDate(p.paid_on)}</td>
                    <td>${monthLabel(p.for_month)}</td>
                    <td>₹ ${rupee(p.amount)}</td>
                    <td><button type="button" class="ghost rate-btn" data-act="pay-del" data-id="${p.id}">Hatao</button></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        ` : `<p class="muted" style="margin-top:10px">Abhi koi payment nahi likha.</p>`}
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
        <div class="field"><label>Customer ka naam</label><input name="name" required value="${name}" /></div>
        <div class="field"><label>Place / area (optional)</label><input name="place" value="${place}" placeholder="Jaise MIDC, Ramanand Nagar — khali chhod sakte ho" /></div>
        ${showRate ? `<div class="field"><label>Jar ka rate (₹)</label><input name="rate" type="number" inputmode="decimal" step="0.5" min="0" value="${rate === 0 || rate ? rate : ""}" placeholder="Jaise 30" /></div>` : ""}
        <div class="row-btns">
          <button type="button" class="ghost" data-act="add-close">Band</button>
          ${mode === "edit" ? `<button type="button" class="ghost" data-act="deactivate" data-id="${id}">Hatao</button>` : ""}
          <button type="submit" class="primary">Save</button>
        </div>
      </form>
    </div>
  `;
}

function openAdd(prefill) {
  closeModal();
  const showRate = isOwnerRoute();
  document.body.insertAdjacentHTML("beforeend", prefill
    ? modalHtml({ title: showRate ? "Customer / rate" : "Customer edit", ...prefill, mode: "edit", showRate })
    : modalHtml({ title: "Naya customer", mode: "add", showRate: false }));
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
        <h3>Naya Jar Supply</h3>
        <div class="field"><label>Naam</label><input name="name" required placeholder="Chetan" /></div>
        <p class="muted">Save ke baad key milegi. WhatsApp pe bhej dena.</p>
        <div class="row-btns">
          <button type="button" class="ghost" data-act="add-close">Band</button>
          <button type="submit" class="primary">Key banao</button>
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
  const authView = r0.view === "login" || r0.view === "signup";
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
    else renderLogin(r0.mode);
    window.scrollTo(0, 0);
    return;
  }
  document.body.classList.remove("auth-body");
  if (st.needsAuth) {
    haltOwnerLive();
    location.hash = owner ? "#/login" : "#/login/driver";
    return;
  }
  if (st.error && !st.device) {
    haltOwnerLive();
    app.innerHTML = `${header({ subtitle: "Error", showTimer: false })}<main class="wrap"><div class="banner">${st.error}</div></main>`;
    return;
  }
  if (session?.role === "owner" && !owner) {
    location.hash = "#/owner";
    return;
  }
  if (st.error) {
    app.innerHTML = `${header({ subtitle: "Error", showTimer: false })}<main class="wrap"><div class="banner">${st.error}</div></main>`;
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
}

function startTimer() {
  if (tick) clearInterval(tick);
  tick = setInterval(() => {
    document.querySelectorAll("[data-timer]").forEach((el) => {
      const date = el.getAttribute("data-timer");
      if (date !== businessDate()) return;
      el.textContent = formatRemain(remainingMs(date));
    });
  }, 1000);
}

function paintFast() {
  keepScroll = true;
  render({ skipLoad: true });
}

async function run(fn) {
  if (busy) return;
  busy = true;
  try { await fn(); }
  catch (err) { alert(err.message || err); }
  finally { busy = false; }
}

document.addEventListener("click", (ev) => {
  const t = ev.target.closest("[data-act]");
  if (!t) return;
  const act = t.dataset.act;
  const id = t.dataset.id;
  const date = app.dataset.date || parseHash().date || businessDate();

  if (act === "add-open") openAdd();
  if (act === "logout") {
    ev.preventDefault();
    run(async () => {
      await logout();
      location.hash = "#/login";
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
    const key = t.dataset.key || "";
    if (key) navigator.clipboard?.writeText(key).then(() => alert("Key copy ho gayi: " + key)).catch(() => alert(key));
    return;
  }
  if (act === "make-key") {
    ev.preventDefault();
    ev.stopPropagation();
    run(async () => {
      const key = await ensureDriverKey(id);
      alert("Supply key: " + key);
      keepScroll = true;
      await render();
    });
    return;
  }
  if (act === "pick-user") {
    ev.preventDefault();
    const input = document.querySelector("form[data-form=signup] input[name=username]");
    if (input) {
      input.value = t.dataset.user || "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
    return;
  }
  if (act === "add-close") {
    if (t.classList.contains("modal-bg") && ev.target !== t) return;
    closeModal();
  }
  if (act === "rename") {
    const d = getDriver();
    const name = prompt("Naam", d?.name || "");
    if (name) run(async () => { await renameDriver(name); await render(); });
  }
  if (act === "trip-bump") {
    bumpTrip(date, t.dataset.field, Number(t.dataset.delta));
    paintFast();
  }
  if (act === "bump") {
    bump(date, id, t.dataset.field, Number(t.dataset.delta));
    paintFast();
  }
  if (act === "usual") {
    fillUsual(date, id);
    paintFast();
  }
  if (act === "done") run(async () => {
    await markComplete(date, id);
    keepScroll = pendingIds(date).length > 0;
    await render();
  });
  if (act === "undo") run(async () => { await markPending(date, id); keepScroll = true; await render(); });
  if (act === "up") run(async () => { await moveRoute(date, null, id, -1); keepScroll = true; await render(); });
  if (act === "down") run(async () => { await moveRoute(date, null, id, 1); keepScroll = true; await render(); });
  if (act === "seq-up") run(async () => { await moveSequence(date, null, id, -1); keepScroll = true; await render(); });
  if (act === "seq-down") run(async () => { await moveSequence(date, null, id, 1); keepScroll = true; await render(); });
  if (act === "hash") {
    ev.preventDefault();
    const go = t.dataset.go || "";
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
  if (act === "edit-cust") {
    ev.preventDefault();
    ev.stopPropagation();
    const c = getCustomer(id);
    if (c) openAdd({ name: c.name, place: c.place || "", rate: c.jarRate || 0, id: c.id });
  }
  if (act === "deactivate") {
    if (confirm("Is customer ko hataayein?")) {
      run(async () => { await deactivateCustomer(id); closeModal(); await render(); });
    }
  }
  if (act === "pay-del") {
    if (confirm("Yeh payment hataayein?")) {
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
      if (status) status.innerHTML = `<span class="muted">Kam se kam 3 letters</span>`;
      if (ideas) ideas.innerHTML = "";
      return;
    }
    if (status) status.textContent = "Check...";
    userCheckTimer = setTimeout(async () => {
      try {
        const taken = await usernameTaken(u);
        if (normalizeUsername(user.value) !== u) return;
        if (taken) {
          if (status) status.innerHTML = `<span class="bad">@${u} le liya gaya</span>`;
          const opts = usernameSuggestions(u, new Set([u]));
          if (ideas) ideas.innerHTML = opts.map((x) => `<button type="button" class="idea" data-act="pick-user" data-user="${x}">${x}</button>`).join("");
        } else {
          if (status) status.innerHTML = `<span class="ok">@${u} available</span>`;
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
  const t = ev.target.closest("[data-act=set]");
  if (!t) return;
  setCount(date, t.dataset.id, t.dataset.field, t.value);
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
    run(async () => {
      await loginOwner({ username: fd.get("username"), password: fd.get("password") });
      location.hash = "#/owner";
      await render();
    });
    return;
  }
  if (form.dataset.form === "login-driver") {
    run(async () => {
      await loginDriverAccount({ username: fd.get("username"), key: fd.get("key") });
      location.hash = "#/";
      await render();
    });
    return;
  }
  if (form.dataset.form === "signup") {
    run(async () => {
      const pass = String(fd.get("password") || "");
      const confirm = String(fd.get("confirm") || "");
      if (pass !== confirm) throw new Error("Password match nahi karta.");
      await signupOwner({ username: fd.get("username"), firmName: fd.get("firm"), password: pass });
      location.hash = "#/owner";
      await render();
    });
    return;
  }
  if (form.dataset.form === "add-driver") {
    run(async () => {
      const row = await addDriverAccount(String(fd.get("name") || ""));
      closeModal();
      alert("Supply key: " + row.login_key + "\nYeh key Jar Supply wale ko do. Company username alag se.");
      keepScroll = true;
      await render();
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

window.addEventListener("hashchange", () => { run(render); });
run(render);
startTimer();
