const DRAFT_TTL_MS = 72 * 60 * 60 * 1000;

type StoredDraft<T> = {
  expiresAt: number;
  step: number;
  data: T;
};

export function loadFunnelDraft<T>(
  key: string,
  fallback: T,
): { data: T; step: number } {
  if (typeof window === "undefined") return { data: fallback, step: 0 };
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return { data: fallback, step: 0 };
    const stored = JSON.parse(raw) as StoredDraft<Partial<T>>;
    if (!stored.expiresAt || stored.expiresAt < Date.now()) {
      window.localStorage.removeItem(key);
      return { data: fallback, step: 0 };
    }
    return {
      data: { ...fallback, ...stored.data },
      step: Number.isInteger(stored.step) ? Math.max(0, stored.step) : 0,
    };
  } catch {
    return { data: fallback, step: 0 };
  }
}

export function saveFunnelDraft<T>(key: string, data: T, step: number) {
  if (typeof window === "undefined") return;
  try {
    const value: StoredDraft<T> = {
      expiresAt: Date.now() + DRAFT_TTL_MS,
      step,
      data,
    };
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be unavailable in private browsing; the form remains usable.
  }
}

export function clearFunnelDraft(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // No action needed when storage is unavailable.
  }
}

export function getLeadAttribution(path: string) {
  if (typeof window === "undefined") {
    return { source: "direct", campaign: null, referrer: null, landingPage: path };
  }
  const params = new URLSearchParams(window.location.search);
  let referrer: string | null = null;
  if (document.referrer) {
    try {
      const parsed = new URL(document.referrer);
      referrer = `${parsed.origin}${parsed.pathname}`;
    } catch {
      referrer = null;
    }
  }
  return {
    source: params.get("utm_source") || "direct",
    campaign: params.get("utm_campaign"),
    referrer,
    landingPage: path,
  };
}
