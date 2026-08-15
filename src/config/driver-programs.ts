/**
 * Public outbound referral links belong in deployment configuration, not copy.
 * Leave unset to show the Empower context without publishing an invented URL.
 */
const configuredEmpowerUrl = import.meta.env.VITE_EMPOWER_REFERRAL_URL?.trim() ?? "";

export const EMPOWER_REFERRAL_URL = (() => {
  if (!configuredEmpowerUrl) return "";
  try {
    const url = new URL(configuredEmpowerUrl);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
})();
