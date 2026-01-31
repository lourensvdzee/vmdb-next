// Geo detection and country preference utilities

const STORAGE_KEY = 'vmdb.country';
const COOKIE_KEY = 'vmdb_country';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export type CountryPref = {
  code: string; // ISO-2 e.g. DE, NL
  ts: number; // timestamp ms
  source: 'override' | 'locale' | 'ip' | 'default';
};

// Minimal ISO-2 to DB country name mapping
// ONLY SUPPORTED COUNTRIES: Germany and Netherlands
// All other countries default to World (null)
const ISO_TO_NAME: Record<string, string | null> = {
  DE: 'Germany',
  NL: 'Netherlands',
  WORLD: null, // World = no filter
  EU: null,
};

export function mapIsoToDbName(code?: string | null): string | null {
  if (!code) return null;
  const up = code.toUpperCase();
  return ISO_TO_NAME[up] !== undefined ? ISO_TO_NAME[up] : null;
}

function setCookie(code: string) {
  try {
    document.cookie = `${COOKIE_KEY}=${encodeURIComponent(code)}; Max-Age=86400; Path=/; SameSite=Lax`;
  } catch {}
}

export function getStoredPref(): CountryPref | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CountryPref;
    if (!parsed || !parsed.code || !parsed.ts) return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS && parsed.source !== 'override') {
      return null; // expired cache, ignore unless override
    }
    return parsed;
  } catch { return null; }
}

export function setOverrideCountry(code: string) {
  const pref: CountryPref = { code: code.toUpperCase(), ts: Date.now(), source: 'override' };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pref)); } catch {}
  setCookie(pref.code);
}

export function clearOverrideCountry() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  try { document.cookie = `${COOKIE_KEY}=; Max-Age=0; Path=/; SameSite=Lax`; } catch {}
}

function parseLocaleCountry(l: string): string | null {
  // Expect patterns like de-DE, nl_NL; try to extract region part
  const m = l.replace('_', '-').split('-');
  if (m.length >= 2) {
    const cc = m[m.length - 1];
    if (cc.length === 2) return cc.toUpperCase();
  }
  return null;
}

export function detectFromBrowserLocale(): string | null {
  try {
    const langs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language]).filter(Boolean) as string[];
    for (const lang of langs) {
      const cc = parseLocaleCountry(lang);
      if (cc) return cc;
    }
    // Language-only locales: try a heuristic mapping
    const primary = (langs[0] || '').slice(0,2).toLowerCase();
    const map: Record<string, string> = { de: 'DE', nl: 'NL', fr: 'FR', es: 'ES', it: 'IT', en: 'GB' };
    return map[primary] || null;
  } catch { return null; }
}

export async function detectFromIP(): Promise<string | null> {
  try {
    // Primary: ipapi.co (plain text ISO-2)
    const r = await fetch('https://ipapi.co/country/');
    if (r.ok) {
      const t = (await r.text()).trim();
      if (t && t.length === 2) return t.toUpperCase();
    }
  } catch {}
  try {
    // Fallback: api.country.is
    const r2 = await fetch('https://api.country.is');
    if (r2.ok) {
      const j = await r2.json();
      if (j && j.country && typeof j.country === 'string' && j.country.length === 2) {
        return j.country.toUpperCase();
      }
    }
  } catch {}
  return null;
}

export type ActiveCountry = {
  code: string; // ISO-2
  name: string | null; // DB country label or null if unknown
  source: CountryPref['source'];
  justDetected: boolean; // true only on first resolve in this session
};

let sessionResolved = false;

export async function resolveActiveCountry(uiLangFallback?: 'NL' | 'DE' | 'EU'): Promise<ActiveCountry> {
  // 1) Override takes priority
  const override = getStoredPref();
  if (override && override.source === 'override') {
    return { code: override.code, name: mapIsoToDbName(override.code), source: 'override', justDetected: false };
  }

  // 2) Cached detection (IP or locale) if still fresh
  const cached = getStoredPref();
  if (cached && cached.source !== 'override') {
    return { code: cached.code, name: mapIsoToDbName(cached.code), source: cached.source, justDetected: false };
  }

  // Always attempt IP first for physical location
  const ipPromise = detectFromIP();
  const ipResult = await Promise.race([
    ipPromise,
    new Promise<string | null>(resolve => setTimeout(() => resolve(null), 800)) // fail-fast after 800ms
  ]);

  if (ipResult) {
    // If IP detection returns an unsupported country, default to World (EU)
    const isSupported = ipResult === 'DE' || ipResult === 'NL';
    const finalCode = isSupported ? ipResult : 'EU';
    const pref: CountryPref = { code: finalCode, ts: Date.now(), source: isSupported ? 'ip' : 'default' };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pref)); } catch {}
    setCookie(pref.code);
    const res: ActiveCountry = { code: finalCode, name: mapIsoToDbName(finalCode), source: pref.source, justDetected: !sessionResolved };
    sessionResolved = true;
    return res;
  }

  // If IP was slow or failed, fall back to browser locale
  const localeCode = detectFromBrowserLocale();
  if (localeCode) {
    // If locale detection returns an unsupported country, default to World (EU)
    const isSupported = localeCode === 'DE' || localeCode === 'NL';
    const finalCode = isSupported ? localeCode : 'EU';
    const pref: CountryPref = { code: finalCode, ts: Date.now(), source: isSupported ? 'locale' : 'default' };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pref)); } catch {}
    setCookie(pref.code);
    const res: ActiveCountry = { code: finalCode, name: mapIsoToDbName(finalCode), source: pref.source, justDetected: !sessionResolved };
    sessionResolved = true;
    return res;
  }

  // Final fallback: UI language hint or World (EU) if unknown.
  let fallbackCode: string;
  if (uiLangFallback === 'NL') fallbackCode = 'NL';
  else if (uiLangFallback === 'DE') fallbackCode = 'DE';
  else fallbackCode = 'EU'; // treated as World/no filter

  const pref: CountryPref = { code: fallbackCode, ts: Date.now(), source: 'default' };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pref)); } catch {}
  setCookie(pref.code);
  const res: ActiveCountry = { code: fallbackCode, name: mapIsoToDbName(fallbackCode), source: 'default' as const, justDetected: !sessionResolved };
  sessionResolved = true;
  return res;
}
