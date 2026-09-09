import { t, speakLocale } from "./i18n.js?v=67";
import { getSession } from "./auth.js?v=67";

let state = { open: false, kind: "owner", i: 0, who: null, first: false, needPick: false };

function isMainWorkScreen() {
  const s = getSession();
  const parts = (location.hash || "#/").replace(/^#/, "").split("/").filter(Boolean);
  if (s?.role === "owner") {
    if (parts[0] !== "owner") return false;
    const p = parts[1];
    return !p || ["today", "week", "month", "m", "year", "all"].includes(p);
  }
  return !parts[0] || parts[0] === "day";
}

function storageKey() {
  const s = getSession();
  return `sa-tour-v2:${s?.orgId || "x"}:${s?.role === "owner" ? "owner" : "driver"}`;
}

function whoKey() {
  const s = getSession();
  return `sa-who-v1:${s?.orgId || "x"}`;
}

function plantUsername() {
  return getSession()?.username || "username";
}

export function hasFinishedTour() {
  try { return localStorage.getItem(storageKey()) === "1"; } catch { return false; }
}

function readWho() {
  try {
    const v = localStorage.getItem(whoKey());
    if (v === "self" || v === "hired") return v;
  } catch { /* ignore */ }
  return null;
}

function writeWho(who) {
  try { localStorage.setItem(whoKey(), who); } catch { /* ignore */ }
}

export function finishTour() {
  try { localStorage.setItem(storageKey(), "1"); } catch { /* ignore */ }
  closeTour();
}

export function closeTour() {
  state.open = false;
  try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
  document.documentElement.classList.remove("tour-open");
  const el = document.getElementById("tour-layer");
  if (el) {
    el.hidden = true;
    el.innerHTML = "";
  }
}

export function openTour(kind, opts = {}) {
  state = {
    open: true,
    kind: kind === "owner" ? "owner" : "driver",
    i: 0,
    who: readWho(),
    first: !!opts.first,
    needPick: false,
  };
  paintTour();
}

export function maybeStartTour() {
  if (state.open) return;
  const s = getSession();
  if (!s) return;
  if (hasFinishedTour()) return;
  if (!isMainWorkScreen()) return;
  openTour(s.role === "owner" ? "owner" : "driver", { first: true });
}

function speak(text) {
  const name = String(text || "").trim();
  if (!name) return;
  const synth = window.speechSynthesis;
  if (!synth) return;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(name);
  u.lang = speakLocale();
  u.rate = 0.92;
  synth.speak(u);
}

function speakBtn() {
  return `
    <button type="button" class="speak-btn" data-act="tour-speak" aria-label="${t("tour_listen")}">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/>
        <path d="M16.5 8.5a5 5 0 010 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M18.7 6.3a8 8 0 010 11.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
  `;
}

function shot(inner) {
  return `<div class="shot" aria-hidden="true"><div class="shot-phone">${inner}</div></div>`;
}

function ownerSteps() {
  const u = plantUsername();
  const hired = state.who === "hired";
  const self = state.who === "self";
  return [
    {
      title: t("tour_o1_t"),
      body: t("tour_o1_b"),
      extra: `
        <ul class="tour-list">
          <li>${t("tour_o1_l1")}</li>
          <li>${t("tour_o1_l2")}</li>
          <li>${t("tour_o1_l3")}</li>
        </ul>
        ${shot(`
          <div class="shot-top">Aqua Jar</div>
          <div class="shot-ok shot-wide">${t("tour_o1_cap")}</div>
        `)}
      `,
    },
    {
      title: t("tour_ben_t"),
      body: t("tour_ben_b"),
      extra: `
        <div class="tour-ps">
          <div><b>${t("tour_ben_p1")}</b><span>${t("tour_ben_s1")}</span></div>
          <div><b>${t("tour_ben_p2")}</b><span>${t("tour_ben_s2")}</span></div>
          <div><b>${t("tour_ben_p3")}</b><span>${t("tour_ben_s3")}</span></div>
          <div><b>${t("tour_ben_p4")}</b><span>${t("tour_ben_s4")}</span></div>
        </div>
      `,
    },
    {
      title: t("tour_o2_t"),
      body: t("tour_o2_b"),
      needWho: true,
      extra: `
        <div class="who-grid">
          <button type="button" class="who-card ${self ? "on" : ""}" data-act="tour-who" data-who="self">
            <strong>${self ? "✓ " : ""}${t("tour_who_self")}</strong>
            <span>${t("tour_who_self_s")}</span>
          </button>
          <button type="button" class="who-card ${hired ? "on" : ""}" data-act="tour-who" data-who="hired">
            <strong>${hired ? "✓ " : ""}${t("tour_who_hire")}</strong>
            <span>${t("tour_who_hire_s")}</span>
          </button>
        </div>
        ${state.needPick && !state.who ? `<p class="tour-note">${t("tour_who_need")}</p>` : ""}
      `,
    },
    {
      title: t("tour_o3_t"),
      body: t("tour_o3_b"),
      extra: `
        ${shot(`
          <div class="shot-top">Delivery man</div>
          <div class="shot-row"><span>${t("tour_o3_name")}</span><b class="shot-pulse">${t("add")}</b></div>
          <div class="shot-arrow"><span>↓</span> ${t("tour_click_here")}</div>
          <div class="shot-row"><span>Mayur</span><b class="shot-pulse">${t("make_key")}</b></div>
          <div class="shot-row"><span>ABCD-EFGH</span><b class="shot-ok">✓ ${t("copied")}</b></div>
        `)}
        <ul class="tour-list">
          <li>${t("tour_o3_l1")}</li>
          <li>${t("tour_o3_l2")}</li>
          <li>${t("tour_o3_l3")}</li>
        </ul>
      `,
    },
    {
      title: hired ? t("tour_o4h_t") : t("tour_o4s_t"),
      body: hired ? t("tour_o4h_b", { u }) : t("tour_o4s_b", { u }),
      extra: `
        ${shot(`
          <div class="shot-top">${t("plant")}</div>
          <div class="shot-row"><span>${t("company_user")}</span><b>${u}</b></div>
          <div class="shot-row"><span>${t("login_key")}</span><b>ABCD-EFGH</b></div>
          <div class="shot-ok shot-wide">${hired ? t("tour_o4h_cap") : t("tour_o4s_cap")}</div>
        `)}
        <p class="tour-note">${hired ? t("tour_o4h_n", { u }) : t("tour_o4s_n", { u })}</p>
      `,
    },
    {
      title: t("tour_o5_t"),
      body: t("tour_o5_b"),
      extra: `
        ${shot(`
          <div class="shot-top">${t("login")}</div>
          <div class="shot-tabs"><i>${t("plant")}</i><b>${t("delivery_man")}</b></div>
          <div class="shot-field">${t("company_user")} · ${u}</div>
          <div class="shot-field">${t("login_key")}</div>
          <div class="shot-ok shot-wide">✓ ${t("login")}</div>
        `)}
        <p class="tour-note">${t("tour_o5_n")}</p>
      `,
    },
    {
      title: t("tour_o6_t"),
      body: t("tour_o6_b"),
      extra: `
        ${shot(`
          <div class="shot-top">${t("customers")}</div>
          <div class="shot-row"><span>${t("search_cust")}</span><b class="shot-pulse">${t("help")}</b></div>
          <div class="shot-arrow"><span>→</span> ${t("tour_click_here")}</div>
          <div class="shot-row"><span>${t("bill")}</span><b class="shot-pulse">${t("help")}</b></div>
        `)}
        <ul class="tour-list">
          <li>${t("tour_o6_l1")}</li>
          <li>${t("tour_o6_l2")}</li>
          <li>${t("tour_o6_l3")}</li>
        </ul>
      `,
    },
  ];
}

function driverSteps() {
  return [
    {
      title: t("tour_d1_t"),
      body: t("tour_d1_b"),
      extra: `
        <ul class="tour-list">
          <li>${t("tour_d1_l1")}</li>
          <li>${t("tour_d1_l2")}</li>
        </ul>
        ${shot(`
          <div class="shot-top">${t("delivery_man")}</div>
          <div class="shot-row"><span>${t("given")}</span><b>2</b></div>
          <div class="shot-row"><span>${t("picked")}</span><b>2</b></div>
          <div class="shot-ok shot-wide">✓ ${t("del_done")}</div>
        `)}
      `,
    },
    {
      title: t("tour_d2_t"),
      body: t("tour_d2_b"),
      extra: `
        ${shot(`
          <div class="shot-top">${t("customers")}</div>
          <div class="shot-row"><span>Akash gym</span></div>
          <div class="shot-arrow"><span>↓</span> ${t("tour_click_here")}</div>
          <div class="shot-fab">+ ${t("new_cust")}</div>
        `)}
      `,
    },
    {
      title: t("tour_d3_t"),
      body: t("tour_d3_b"),
      extra: `
        ${shot(`
          <div class="shot-top">${t("vehicle_filled")}</div>
          <div class="shot-row"><span>${t("took_filled")}</span><b>20</b></div>
          <div class="shot-ok shot-wide">✓ ${t("load_confirm")}</div>
          <div class="shot-arrow"><span>↓</span> ${t("tour_d3_cap")}</div>
        `)}
      `,
    },
    {
      title: t("tour_d4_t"),
      body: t("tour_d4_b"),
      extra: `
        ${shot(`
          <div class="shot-top">Akash gym</div>
          <div class="shot-row"><span>${t("given")}</span><b>2</b></div>
          <div class="shot-row"><span>${t("picked")}</span><b>1</b></div>
          <div class="shot-ok shot-wide">✓ ${t("del_done")}</div>
        `)}
      `,
    },
    {
      title: t("tour_d5_t"),
      body: t("tour_d5_b"),
      extra: `
        ${shot(`
          <div class="shot-top">${t("plant_return")}</div>
          <div class="shot-row"><span>${t("empty_short")}</span><b>16</b></div>
          <div class="shot-row"><span>${t("jar_broke_s")}</span><b>0</b></div>
        `)}
        <p class="tour-note">${t("tour_d5_n")}</p>
      `,
    },
  ];
}

function paintTour() {
  const el = document.getElementById("tour-layer");
  if (!el) return;
  const list = state.kind === "owner" ? ownerSteps() : driverSteps();
  const n = list.length;
  state.i = Math.max(0, Math.min(state.i, n - 1));
  const step = list[state.i];
  const last = state.i === n - 1;
  document.documentElement.classList.add("tour-open");
  el.hidden = false;
  el.innerHTML = `
    <div class="tour-card" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <div class="tour-head">
        <div>
          <p class="tour-kicker">${state.first ? t("tour_first") : t("help")}</p>
          <h2 id="tour-title">${step.title}</h2>
        </div>
        ${speakBtn()}
      </div>
      <div class="tour-dots">${list.map((_, i) => `<i class="${i === state.i ? "on" : ""}"></i>`).join("")}</div>
      <p class="tour-body">${step.body}</p>
      ${step.extra || ""}
      <div class="tour-nav">
        ${state.i > 0 ? `<button type="button" class="ghost" data-act="tour-prev">${t("tour_back")}</button>` : `<button type="button" class="ghost" data-act="tour-skip">${t("tour_skip")}</button>`}
        <button type="button" class="primary" data-act="${last ? "tour-done" : "tour-next"}">${last ? t("tour_done") : t("tour_next")}</button>
      </div>
    </div>
  `;
}

function speakCurrent() {
  const list = state.kind === "owner" ? ownerSteps() : driverSteps();
  const step = list[state.i];
  if (!step) return;
  const bits = [step.title, step.body];
  document.querySelectorAll("#tour-layer .tour-list li, #tour-layer .tour-note, #tour-layer .tour-ps span, #tour-layer .who-card strong").forEach((n) => bits.push(n.textContent));
  speak(bits.filter(Boolean).join(". "));
}

document.addEventListener("click", (ev) => {
  const layer = document.getElementById("tour-layer");
  if (!layer || layer.hidden) return;
  if (!layer.contains(ev.target)) return;
  const el = ev.target.closest("[data-act]");
  if (!el || !layer.contains(el)) return;
  ev.preventDefault();
  ev.stopPropagation();
  const act = el.dataset.act;
  if (act === "tour-next") {
    const list = state.kind === "owner" ? ownerSteps() : driverSteps();
    const step = list[state.i];
    if (step?.needWho && !state.who) {
      state.needPick = true;
      paintTour();
      return;
    }
    state.needPick = false;
    state.i += 1;
    paintTour();
  }
  if (act === "tour-prev") {
    state.needPick = false;
    state.i -= 1;
    paintTour();
  }
  if (act === "tour-skip" || act === "tour-done") finishTour();
  if (act === "tour-who") {
    state.who = el.dataset.who === "self" ? "self" : "hired";
    state.needPick = false;
    writeWho(state.who);
    paintTour();
  }
  if (act === "tour-speak") speakCurrent();
});
