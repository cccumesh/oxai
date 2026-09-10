import { t, speakLocale } from "./i18n.js?v=80";

function micIconSvg() {
  return `<svg class="mic-ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/></svg>`;
}

export function micHoldButton(id, stopNo) {
  return `<button type="button" class="mic-hold" data-act="mic-hold" data-id="${id}" data-stop="${stopNo}" title="${t("mic_hold")}" aria-label="${t("mic_hold")}">${micIconSvg()}</button>`;
}

let holdMicRec = null;
let holdMicInput = null;

export function stopHoldMic() {
  const input = holdMicInput;
  try { holdMicRec?.stop?.(); } catch { /* ignore */ }
  holdMicRec = null;
  holdMicInput = null;
  document.querySelectorAll(".mic-hold.on").forEach((b) => b.classList.remove("on"));
  if (input) input.classList.remove("listening");
}

function startHoldMic(btn) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const stop = btn?.dataset?.stop || "1";
  const input = btn?.closest(".order-side, .card")?.querySelector(`input[data-act=drop-place][data-stop="${stop}"]`)
    || btn?.closest(".drop-place-field")?.querySelector("input");
  if (!SR || !input) {
    alert(t("no_mic"));
    return;
  }
  stopHoldMic();
  try {
    const rec = new SR();
    rec.lang = speakLocale() || "hi-IN";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    holdMicRec = rec;
    holdMicInput = input;
    btn.classList.add("on");
    input.classList.add("listening");
    let finalText = "";
    rec.onresult = (ev) => {
      let interim = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const piece = String(ev.results[i][0]?.transcript || "").trim();
        if (!piece) continue;
        if (ev.results[i].isFinal) {
          finalText = finalText ? `${finalText} ${piece}` : piece;
        } else {
          interim = piece;
        }
      }
      input.value = (finalText + (interim ? ` ${interim}` : "")).trim().slice(0, 120);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    };
    rec.onerror = () => stopHoldMic();
    rec.onend = () => {
      if (holdMicRec === rec) {
        const said = String(input.value || "").trim();
        if (said) input.dispatchEvent(new Event("change", { bubbles: true }));
        stopHoldMic();
      }
    };
    rec.start();
  } catch {
    stopHoldMic();
    alert(t("no_mic"));
  }
}

let installed = false;

export function installMicHold() {
  if (installed) return;
  installed = true;
  document.addEventListener("pointerdown", (ev) => {
    const btn = ev.target.closest("[data-act=mic-hold]");
    if (!btn) return;
    ev.preventDefault();
    try { btn.setPointerCapture?.(ev.pointerId); } catch { /* ignore */ }
    startHoldMic(btn);
  });
  document.addEventListener("pointerup", () => {
    if (holdMicRec) stopHoldMic();
  });
  document.addEventListener("pointercancel", () => {
    if (holdMicRec) stopHoldMic();
  });
  document.addEventListener("lostpointercapture", () => {
    if (holdMicRec) stopHoldMic();
  });
  document.addEventListener("contextmenu", (ev) => {
    if (ev.target.closest("[data-act=mic-hold]")) ev.preventDefault();
  });
}
