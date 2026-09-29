import { Node, mergeAttributes } from "@tiptap/react";
import Image from "@tiptap/extension-image";
import { buttonVariants } from "@/components/ui/button";
import { calloutTone, ctaButton, galleryImages, imageLayout } from "@/lib/blog/content";

/*
 * Custom article blocks for the Tiptap editor. Each one stores plain JSON
 * attributes; the public renderer (components/blog/ArticleContent) re-checks
 * every attribute against the same allow-lists, so the editor's HTML here is
 * only what editors see while writing.
 */

/** Images gain a layout: column width, wide, or beside the text (left/right). */
export const BlogImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      layout: {
        default: "default",
        parseHTML: (element) => imageLayout(element.getAttribute("data-layout")),
        renderHTML: (attributes) => {
          const layout = imageLayout(attributes.layout);
          return layout === "default" ? {} : { "data-layout": layout };
        },
      },
    };
  },
});

/** A highlighted box of paragraphs: tip, note or warning. */
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "paragraph+",
  defining: true,
  addAttributes() {
    return {
      tone: {
        default: "note",
        parseHTML: (element) => calloutTone(element.getAttribute("data-tone")),
        renderHTML: (attributes) => ({ "data-tone": calloutTone(attributes.tone) }),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'aside[data-type="callout"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["aside", mergeAttributes(HTMLAttributes, { "data-type": "callout", class: "blog-callout" }), 0];
  },
});

function parseJsonAttribute(element: HTMLElement, name: string): unknown {
  try {
    return JSON.parse(element.getAttribute(name) ?? "null");
  } catch {
    return null;
  }
}

/** A grid of photos (each with alt text) and one shared caption. */
export const Gallery = Node.create({
  name: "gallery",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return {
      images: {
        default: [],
        parseHTML: (element) => galleryImages(parseJsonAttribute(element, "data-images")),
        renderHTML: (attributes) => ({ "data-images": JSON.stringify(galleryImages(attributes.images)) }),
      },
      caption: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-caption") ?? "",
        renderHTML: (attributes) => (attributes.caption ? { "data-caption": attributes.caption } : {}),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'figure[data-type="gallery"]' }];
  },
  renderHTML({ node, HTMLAttributes }) {
    const images = galleryImages(node.attrs.images);
    const caption = typeof node.attrs.caption === "string" ? node.attrs.caption.trim() : "";
    return [
      "figure",
      mergeAttributes(HTMLAttributes, { "data-type": "gallery", class: "blog-gallery", "data-count": String(Math.min(Math.max(images.length, 1), 3)) }),
      ["ul", {}, ...images.map((image) => ["li", {}, ["img", { src: image.src, alt: image.alt }]])],
      ...(caption ? [["figcaption", {}, caption]] : []),
    ];
  },
});

/** A button inside the article, linking to one of our pages or an https:// address. */
export const CtaButton = Node.create({
  name: "ctaButton",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return {
      label: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-label") ?? "",
        renderHTML: (attributes) => ({ "data-label": attributes.label }),
      },
      href: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-href") ?? "",
        renderHTML: (attributes) => ({ "data-href": attributes.href }),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'p[data-type="cta-button"]' }];
  },
  renderHTML({ node, HTMLAttributes }) {
    const cta = ctaButton(node.attrs);
    return [
      "p",
      mergeAttributes(HTMLAttributes, { "data-type": "cta-button", class: "blog-inline-cta" }),
      ["span", { class: `${buttonVariants({ size: "lg" })} blog-cta-button` }, cta ? `${cta.label} →` : "Button"],
    ];
  },
});
