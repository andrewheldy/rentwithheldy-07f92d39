import { Fragment, useMemo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Info, Lightbulb } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  calloutTone,
  ctaButton,
  galleryImages,
  headingAnchors,
  imageLayout,
  internalPath,
  safeHref,
  safeImageSrc,
  type HeadingAnchor,
} from "@/lib/blog/content";
import type { RichTextMark, RichTextNode } from "@/lib/blog/types";
import { cn } from "@/lib/utils";

/*
 * Renders a Tiptap/ProseMirror JSON article body to React elements.
 *
 * This is an ALLOW-LIST renderer: only the node and mark types the editor can
 * produce are rendered; anything else is dropped (its text children are kept).
 * Nothing is ever injected as raw HTML, every href/src passes through
 * safeHref/safeImageSrc, and block attributes (image layout, callout tone,
 * gallery images, button links) are checked against allow-lists, so stored
 * content cannot run script or inject styles.
 */

interface RenderContext {
  /** Heading ids, handed out in document order. */
  anchors: HeadingAnchor[];
  nextAnchor: number;
  ctaLabel?: (label: string, href: string) => string;
  onCtaClick?: (href: string) => void;
}

function renderMarks(text: ReactNode, marks: RichTextMark[] | undefined, key: string): ReactNode {
  if (!marks?.length) return text;
  return marks.reduce<ReactNode>((child, mark, i) => {
    const k = `${key}-m${i}`;
    switch (mark.type) {
      case "bold":
        return <strong key={k}>{child}</strong>;
      case "italic":
        return <em key={k}>{child}</em>;
      case "underline":
        return <u key={k}>{child}</u>;
      case "strike":
        return <s key={k}>{child}</s>;
      case "code":
        return <code key={k}>{child}</code>;
      case "link": {
        const href = safeHref(mark.attrs?.href);
        if (!href) return child;
        const path = internalPath(href);
        if (path) {
          return (
            <Link key={k} to={path}>
              {child}
            </Link>
          );
        }
        const external = /^https?:/i.test(href);
        return (
          <a
            key={k}
            href={href}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {child}
          </a>
        );
      }
      default:
        return child;
    }
  }, text);
}

function numberAttr(value: unknown): number | undefined {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? Math.round(n) : undefined;
}

function textAttr(value: unknown, max: number): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined;
}

function renderChildren(node: RichTextNode, key: string, ctx: RenderContext): ReactNode {
  return node.content?.map((child, i) => renderNode(child, `${key}-${i}`, ctx));
}

const CALLOUT_ICON = { tip: Lightbulb, note: Info, warning: AlertTriangle } as const;

function renderNode(node: RichTextNode, key: string, ctx: RenderContext): ReactNode {
  switch (node.type) {
    case "doc":
      return <Fragment key={key}>{renderChildren(node, key, ctx)}</Fragment>;
    case "text":
      return <Fragment key={key}>{renderMarks(node.text ?? "", node.marks, key)}</Fragment>;
    case "hardBreak":
      return <br key={key} />;
    case "paragraph":
      return <p key={key}>{renderChildren(node, key, ctx)}</p>;
    case "heading": {
      // The page owns the only H1; article sections are H2/H3.
      const level = Number(node.attrs?.level) >= 3 ? 3 : 2;
      const Tag = level === 3 ? "h3" : "h2";
      const anchor = ctx.anchors[ctx.nextAnchor++];
      return (
        <Tag key={key} id={anchor?.id}>
          {renderChildren(node, key, ctx)}
        </Tag>
      );
    }
    case "bulletList":
      return <ul key={key}>{renderChildren(node, key, ctx)}</ul>;
    case "orderedList":
      return (
        <ol key={key} start={numberAttr(node.attrs?.start)}>
          {renderChildren(node, key, ctx)}
        </ol>
      );
    case "listItem":
      return <li key={key}>{renderChildren(node, key, ctx)}</li>;
    case "blockquote":
      return <blockquote key={key}>{renderChildren(node, key, ctx)}</blockquote>;
    case "horizontalRule":
      return <hr key={key} />;
    case "codeBlock":
      return (
        <pre key={key}>
          <code>{renderChildren(node, key, ctx)}</code>
        </pre>
      );
    case "image": {
      const src = safeImageSrc(node.attrs?.src);
      if (!src) return null;
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
      const caption = textAttr(node.attrs?.title, 300);
      return (
        <figure key={key} data-layout={imageLayout(node.attrs?.layout)}>
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            width={numberAttr(node.attrs?.width)}
            height={numberAttr(node.attrs?.height)}
          />
          {caption && <figcaption>{caption}</figcaption>}
        </figure>
      );
    }
    case "gallery": {
      const images = galleryImages(node.attrs?.images);
      if (images.length === 0) return null;
      const caption = textAttr(node.attrs?.caption, 300);
      return (
        <figure key={key} className="blog-gallery" data-count={Math.min(images.length, 3)}>
          <ul>
            {images.map((image, i) => (
              <li key={`${image.src}-${i}`}>
                <img
                  src={image.src}
                  alt={image.alt}
                  loading="lazy"
                  decoding="async"
                  width={image.width ?? undefined}
                  height={image.height ?? undefined}
                />
              </li>
            ))}
          </ul>
          {caption && <figcaption>{caption}</figcaption>}
        </figure>
      );
    }
    case "callout": {
      const tone = calloutTone(node.attrs?.tone);
      const Icon = CALLOUT_ICON[tone];
      return (
        <aside key={key} role="note" className="blog-callout" data-tone={tone}>
          <Icon className="blog-callout-icon" aria-hidden />
          <div>{renderChildren(node, key, ctx)}</div>
        </aside>
      );
    }
    case "ctaButton": {
      const cta = ctaButton(node.attrs);
      if (!cta) return null;
      const label = ctx.ctaLabel ? ctx.ctaLabel(cta.label, cta.href) : cta.label;
      const path = internalPath(cta.href);
      const className = cn(buttonVariants({ size: "lg" }), "blog-cta-button h-auto min-h-12 whitespace-normal py-3");
      const content = (
        <>
          {label}
          <ArrowRight className="rtl:-scale-x-100" aria-hidden />
        </>
      );
      return (
        <p key={key} className="blog-inline-cta">
          {path ? (
            <Link to={path} className={className} onClick={() => ctx.onCtaClick?.(path)}>
              {content}
            </Link>
          ) : (
            <a href={cta.href} target="_blank" rel="noopener noreferrer" className={className} onClick={() => ctx.onCtaClick?.(cta.href)}>
              {content}
            </a>
          )}
        </p>
      );
    }
    case "table":
      return (
        <div key={key} className="blog-table-scroll" role="region" aria-label="Table" tabIndex={0}>
          <table>
            <tbody>{renderChildren(node, key, ctx)}</tbody>
          </table>
        </div>
      );
    case "tableRow":
      return <tr key={key}>{renderChildren(node, key, ctx)}</tr>;
    case "tableHeader":
    case "tableCell": {
      const Tag = node.type === "tableHeader" ? "th" : "td";
      return (
        <Tag
          key={key}
          colSpan={numberAttr(node.attrs?.colspan)}
          rowSpan={numberAttr(node.attrs?.rowspan)}
          {...(node.type === "tableHeader" ? { scope: "col" } : {})}
        >
          {renderChildren(node, key, ctx)}
        </Tag>
      );
    }
    default:
      // Unknown node: keep any text it contains rather than losing content.
      return node.content ? <Fragment key={key}>{renderChildren(node, key, ctx)}</Fragment> : null;
  }
}

interface ArticleContentProps {
  doc: RichTextNode;
  className?: string;
  /** Heading ids (from headingAnchors); computed from the document when omitted. */
  anchors?: HeadingAnchor[];
  /** Label shown on an in-article button, e.g. a translated preset label. */
  ctaLabel?: (label: string, href: string) => string;
  onCtaClick?: (href: string) => void;
}

export function ArticleContent({ doc, className, anchors, ctaLabel, onCtaClick }: ArticleContentProps) {
  const ids = useMemo(() => anchors ?? headingAnchors(doc), [anchors, doc]);
  return (
    <div className={`blog-prose ${className ?? ""}`}>
      {renderNode(doc, "n", { anchors: ids, nextAnchor: 0, ctaLabel, onCtaClick })}
    </div>
  );
}

export default ArticleContent;
