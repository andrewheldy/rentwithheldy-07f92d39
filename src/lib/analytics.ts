/**
 * Minimal typed event hook — see docs/REDESIGN_BLUEPRINT.md §8 ("Analytics
 * Readiness"). No provider is wired up yet, so this no-ops beyond a dev-only
 * console log; instrumenting call sites now means turning on GA4 later is a
 * one-file change.
 */
type AnalyticsProps = Record<string, string | number | boolean | undefined>;

export function track(event: string, props?: AnalyticsProps): void {
  if (import.meta.env.DEV) {
    console.debug(`[analytics] ${event}`, props ?? {});
  }
}
