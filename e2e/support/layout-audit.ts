import { expect, type Page } from "@playwright/test";

// Shared layout audit: horizontal overflow, clipped text/controls and
// overlapping interactive elements.

type LayoutAudit = {
  bodyOverflow: number;
  offenders: string[];
  clipped: string[];
  overlaps: string[];
};

export async function auditLayout(page: Page, rootSelector?: string): Promise<LayoutAudit> {
  return page.evaluate((selector) => {
    const root = selector ? document.querySelector(selector) ?? document.body : document.body;
    const label = (element: Element) => {
      const html = element as HTMLElement;
      const id = html.id ? `#${html.id}` : "";
      const classes = [...html.classList].slice(0, 2).map((name) => `.${name}`).join("");
      const text = (html.innerText || html.getAttribute("aria-label") || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 70);
      return `${html.tagName.toLowerCase()}${id}${classes}${text ? ` “${text}”` : ""}`;
    };

    const visible = (element: Element) => {
      const html = element as HTMLElement;
      const rect = html.getBoundingClientRect();
      const style = getComputedStyle(html);
      // Screen-reader-only content (.sr-only) is clipped on purpose.
      const screenReaderOnly = html.closest(".sr-only") !== null;
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        !screenReaderOnly
      );
    };

    const viewportWidth = document.documentElement.clientWidth;
    const all = [...root.querySelectorAll<HTMLElement>("*")].filter(visible);
    const offenders = all
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const intentionallyScrollable = ["auto", "scroll"].includes(style.overflowX);
        const containedByOverflow = (() => {
          let parent = element.parentElement;
          while (parent && parent !== document.body) {
            const parentStyle = getComputedStyle(parent);
            const parentRect = parent.getBoundingClientRect();
            if (
              ["hidden", "clip", "auto", "scroll"].includes(parentStyle.overflowX) &&
              parentRect.left >= -2 &&
              parentRect.right <= viewportWidth + 2
            ) {
              return true;
            }
            parent = parent.parentElement;
          }
          return false;
        })();
        return !intentionallyScrollable && !containedByOverflow && (rect.left < -2 || rect.right > viewportWidth + 2);
      })
      .slice(0, 12)
      .map(label);

    const textControls = [
      ...root.querySelectorAll<HTMLElement>(
        "button, label, input, select, textarea, h1, h2, h3, h4, nav, [role='button'], [role='combobox']",
      ),
    ].filter(visible);
    const clipped = textControls
      .filter((element) => {
        const style = getComputedStyle(element);
        const clipsX = ["hidden", "clip"].includes(style.overflowX);
        const clipsY = ["hidden", "clip"].includes(style.overflowY);
        return (
          (clipsX && element.scrollWidth > element.clientWidth + 2) ||
          (clipsY && element.scrollHeight > element.clientHeight + 2)
        );
      })
      .slice(0, 12)
      .map(label);

    const interactiveSelector = "a[href], button, input, select, textarea, [role='button'], [role='combobox']";
    const clippedRect = (element: HTMLElement) => {
      const source = element.getBoundingClientRect();
      const rect = {
        left: Math.max(0, source.left),
        right: Math.min(innerWidth, source.right),
        top: Math.max(0, source.top),
        bottom: Math.min(innerHeight, source.bottom),
      };
      let parent = element.parentElement;
      while (parent && parent !== document.body) {
        const style = getComputedStyle(parent);
        if (["hidden", "clip", "auto", "scroll"].includes(style.overflowX)) {
          const bounds = parent.getBoundingClientRect();
          rect.left = Math.max(rect.left, bounds.left);
          rect.right = Math.min(rect.right, bounds.right);
        }
        if (["hidden", "clip", "auto", "scroll"].includes(style.overflowY)) {
          const bounds = parent.getBoundingClientRect();
          rect.top = Math.max(rect.top, bounds.top);
          rect.bottom = Math.min(rect.bottom, bounds.bottom);
        }
        parent = parent.parentElement;
      }
      return rect.right - rect.left > 1 && rect.bottom - rect.top > 1 ? rect : null;
    };
    const controls = [...root.querySelectorAll<HTMLElement>(interactiveSelector)]
      .filter(visible)
      .filter((element) => !element.parentElement?.closest(interactiveSelector))
      .map((element) => ({ element, rect: clippedRect(element) }))
      .filter((item): item is { element: HTMLElement; rect: NonNullable<typeof item.rect> } => Boolean(item.rect));
    const overlaps: string[] = [];
    for (let i = 0; i < controls.length; i += 1) {
      const a = controls[i].rect;
      for (let j = i + 1; j < controls.length; j += 1) {
        const b = controls[j].rect;
        const overlapWidth = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const overlapHeight = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (overlapWidth > 3 && overlapHeight > 3) {
          overlaps.push(`${label(controls[i].element)} <> ${label(controls[j].element)}`);
          if (overlaps.length >= 8) break;
        }
      }
      if (overlaps.length >= 8) break;
    }

    return {
      bodyOverflow: document.documentElement.scrollWidth - viewportWidth,
      offenders,
      clipped,
      overlaps,
    };
  }, rootSelector);
}

export async function expectCleanLayout(page: Page, context: string, rootSelector?: string) {
  const audit = await auditLayout(page, rootSelector);
  expect(audit.bodyOverflow, `${context}: horizontal document overflow\n${audit.offenders.join("\n")}`).toBeLessThanOrEqual(2);
  expect(audit.offenders, `${context}: elements outside viewport`).toEqual([]);
  expect(audit.clipped, `${context}: clipped controls or headings`).toEqual([]);
  expect(audit.overlaps, `${context}: overlapping interactive controls`).toEqual([]);
}
