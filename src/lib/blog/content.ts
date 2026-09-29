import { slugify } from "./slug.js";
import type { BlogAuthor, RichTextDoc, RichTextNode } from "./types.js";

// Pure helpers for the Tiptap JSON article body. Shared by the public
// renderer, the admin checklist and the server-side metadata function.

const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

/**
 * Returns a safe href or null. Relative site paths ("/book", "#faq") are kept;
 * absolute URLs must use http(s), mailto or tel. Anything else (javascript:,
 * data:, protocol-relative //evil.com) is rejected.
 */
export function safeHref(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const href = raw.trim();
  if (!href) return null;
  if (href.startsWith("//")) return null;
  if (href.startsWith("/") || href.startsWith("#")) return href;
  try {
    const url = new URL(href);
    return SAFE_PROTOCOLS.has(url.protocol) ? href : null;
  } catch {
    return null;
  }
}

/** A complete http(s) address, as required for article sources. */
export function isHttpUrl(url: string): boolean {
  return /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(url.trim());
}

const SITE_HOSTS = new Set(["rentwithheldy.com", "www.rentwithheldy.com"]);

/**
 * Internal links render as client-side router links. Absolute links to our
 * own domain are treated as internal too, so editors can paste full URLs.
 * Returns the in-app path, or null for external links.
 */
export function internalPath(href: string): string | null {
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  try {
    const url = new URL(href);
    if ((url.protocol === "https:" || url.protocol === "http:") && SITE_HOSTS.has(url.hostname)) {
      return `${url.pathname}${url.search}${url.hash}` || "/";
    }
  } catch {
    /* not a URL */
  }
  return null;
}

/** Only http(s) images, or site-relative paths, are rendered. */
export function safeImageSrc(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const src = raw.trim();
  if (src.startsWith("/") && !src.startsWith("//")) return src;
  try {
    const url = new URL(src);
    return url.protocol === "https:" || url.protocol === "http:" ? src : null;
  } catch {
    return null;
  }
}

const BLOCK_TYPES = new Set([
  "paragraph",
  "heading",
  "blockquote",
  "listItem",
  "tableCell",
  "tableHeader",
]);

/** Plain text of a document, with block boundaries as spaces. */
export function docToPlainText(doc: RichTextNode | null | undefined): string {
  if (!doc) return "";
  const parts: string[] = [];
  const walk = (node: RichTextNode) => {
    if (node.type === "text" && typeof node.text === "string") parts.push(node.text);
    if (node.type === "hardBreak") parts.push(" ");
    node.content?.forEach(walk);
    if (BLOCK_TYPES.has(node.type)) parts.push(" ");
  };
  walk(doc);
  return parts.join("").replace(/\s+/g, " ").trim();
}

export function wordCount(doc: RichTextNode | null | undefined): number {
  const text = docToPlainText(doc);
  return text ? text.split(" ").length : 0;
}

/** Minutes to read at ~225 words per minute, minimum 1. */
export function readingMinutes(doc: RichTextNode | null | undefined): number {
  return Math.max(1, Math.round(wordCount(doc) / 225));
}

export function hasContent(doc: RichTextNode | null | undefined): boolean {
  if (!doc) return false;
  if (docToPlainText(doc).length > 0) return true;
  // An article with only images still counts as content.
  let found = false;
  const walk = (node: RichTextNode) => {
    if (node.type === "image" || (node.type === "gallery" && galleryImages(node.attrs?.images).length > 0)) found = true;
    node.content?.forEach(walk);
  };
  walk(doc);
  return found;
}

/** Every link href in the document (for editor QA and tests). */
export function collectLinks(doc: RichTextNode | null | undefined): string[] {
  const hrefs: string[] = [];
  const walk = (node: RichTextNode) => {
    node.marks?.forEach((mark) => {
      if (mark.type === "link" && typeof mark.attrs?.href === "string") hrefs.push(mark.attrs.href);
    });
    node.content?.forEach(walk);
  };
  if (doc) walk(doc);
  return hrefs;
}

/** Tolerant parse of the jsonb column; anything malformed becomes empty. */
export function normalizeDoc(value: unknown): RichTextDoc {
  if (
    value &&
    typeof value === "object" &&
    (value as RichTextNode).type === "doc" &&
    (Array.isArray((value as RichTextNode).content) || (value as RichTextNode).content === undefined)
  ) {
    return { type: "doc", content: (value as RichTextNode).content ?? [] };
  }
  return { type: "doc", content: [] };
}

// ---------------------------------------------------------------------------
// Block attributes. Stored JSON is untrusted: every attribute is checked
// against an allow-list before it reaches the page.
// ---------------------------------------------------------------------------

/** default: column width · wide: wider than the text on large screens · left/right: beside the text. */
export const IMAGE_LAYOUTS = ["default", "wide", "left", "right"] as const;
export type ImageLayout = (typeof IMAGE_LAYOUTS)[number];

export function imageLayout(raw: unknown): ImageLayout {
  return IMAGE_LAYOUTS.includes(raw as ImageLayout) ? (raw as ImageLayout) : "default";
}

export const CALLOUT_TONES = ["tip", "note", "warning"] as const;
export type CalloutTone = (typeof CALLOUT_TONES)[number];

export function calloutTone(raw: unknown): CalloutTone {
  return CALLOUT_TONES.includes(raw as CalloutTone) ? (raw as CalloutTone) : "note";
}

export interface GalleryImage {
  src: string;
  alt: string;
  width: number | null;
  height: number | null;
}

export const GALLERY_MAX_IMAGES = 12;

function positiveInt(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

/** The gallery's images that are safe to show, in order. */
export function galleryImages(raw: unknown): GalleryImage[] {
  if (!Array.isArray(raw)) return [];
  const images: GalleryImage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const src = safeImageSrc(record.src);
    if (!src) continue;
    images.push({
      src,
      alt: typeof record.alt === "string" ? record.alt.slice(0, 300) : "",
      width: positiveInt(record.width),
      height: positiveInt(record.height),
    });
    if (images.length === GALLERY_MAX_IMAGES) break;
  }
  return images;
}

/**
 * A button inside the article. The link must be a page on this site or an
 * https:// address (the same rule as the end-of-article call to action).
 */
export function ctaButton(attrs: Record<string, unknown> | undefined): { label: string; href: string } | null {
  const label = typeof attrs?.label === "string" ? attrs.label.trim().slice(0, 80) : "";
  const raw = typeof attrs?.href === "string" ? attrs.href.trim() : "";
  if (!label || !/^(\/(?!\/)|https:\/\/)/.test(raw)) return null;
  const href = safeHref(raw);
  return href ? { label, href } : null;
}

export interface HeadingAnchor {
  id: string;
  text: string;
  level: 2 | 3;
}

/**
 * Every section heading in document order, with a unique id for in-page
 * links. The renderer assigns ids in the same order, so a table of contents
 * built from this list always points at the right heading.
 */
export function headingAnchors(doc: RichTextNode | null | undefined, reserved: Iterable<string> = []): HeadingAnchor[] {
  const used = new Set(reserved);
  const anchors: HeadingAnchor[] = [];
  const walk = (node: RichTextNode) => {
    if (node.type === "heading") {
      const text = docToPlainText(node);
      const base = slugify(text, 60) || "section";
      let id = base;
      for (let n = 2; used.has(id); n += 1) id = `${base}-${n}`;
      used.add(id);
      anchors.push({ id, text, level: Number(node.attrs?.level) >= 3 ? 3 : 2 });
      return;
    }
    node.content?.forEach(walk);
  };
  if (doc) walk(doc);
  return anchors;
}

/** True when an author profile has something to say beyond the byline. */
export function hasAuthorDetails(author: BlogAuthor | null | undefined): author is BlogAuthor {
  return Boolean(author && (author.bio?.trim() || author.role?.trim() || safeImageSrc(author.photo_url)));
}
