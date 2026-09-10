import { dateLocale } from "./i18n.js?v=80";

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

export function monthLabel(ym) {
  if (!ym || String(ym).length < 7) return ym || "—";
  const [y, m] = String(ym).split("-").map(Number);
  if (!y || !m) return ym;
  return new Date(y, m - 1, 1).toLocaleDateString(dateLocale(), { month: "short", year: "numeric" });
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

export { pad };
