const LS_URL = "sa-supabase-url";
const LS_KEY = "sa-supabase-anon";

export const FILE_SUPABASE_URL = "https://hdhqircgfluximypmdpu.supabase.co";
export const FILE_SUPABASE_ANON_KEY = "sb_publishable_w_ZKcPRhh-NhOj35RjwUhA_seC0-xbF";

export function getSupabaseUrl() {
  return (FILE_SUPABASE_URL || localStorage.getItem(LS_URL) || "").trim();
}

export function getSupabaseAnonKey() {
  return (FILE_SUPABASE_ANON_KEY || localStorage.getItem(LS_KEY) || "").trim();
}

export function saveSupabaseConfig(url, key) {
  localStorage.setItem(LS_URL, url.trim());
  localStorage.setItem(LS_KEY, key.trim());
}

export function hasSupabaseConfig() {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}
