import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { internalPath, safeHref, safeImageSrc } from "@/lib/blog/content";
import type { RichTextMark, RichTextNode } from "@/lib/blog/types";

/*
 * Renders a Tiptap/ProseMirror JSON article body to React elements.
 *
 * This is an ALLOW-LIST renderer: only the node and mark types the editor can
 * produce are rendered; anything else is dropped (its text children are kept).
 * Nothing is ever injected as raw HTML, and every href/src passes through
 * safeHref/safeImageSrc, so stored content cannot run script.
 */

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

function renderChildren(node: RichTextNode, key: string): ReactNode {
  return node.content?.map((child, i) => renderNode(child, `${key}-${i}`));
}

function renderNode(node: RichTextNode, key: string): ReactNode {
  switch (node.type) {
    case "doc":
      return <Fragment key={key}>{renderChildren(node, key)}</Fragment>;
    case "text":
      return <Fragment key={key}>{renderMarks(node.text ?? "", node.marks, key)}</Fragment>;
    case "hardBreak":
      return <br key={key} />;
    case "paragraph":
      return <p key={key}>{renderChildren(node, key)}</p>;
    case "heading": {
      // The page owns the only H1; article sections are H2/H3.
      const level = Number(node.attrs?.level) >= 3 ? 3 : 2;
      const Tag = level === 3 ? "h3" : "h2";
      return <Tag key={key}>{renderChildren(node, key)}</Tag>;
    }
    case "bulletList":
      return <ul key={key}>{renderChildren(node, key)}</ul>;
    case "orderedList":
      return (
        <ol key={key} start={numberAttr(node.attrs?.start)}>
          {renderChildren(node, key)}
        </ol>
      );
    case "listItem":
      return <li key={key}>{renderChildren(node, key)}</li>;
    case "blockquote":
      return <blockquote key={key}>{renderChildren(node, key)}</blockquote>;
    case "horizontalRule":
      return <hr key={key} />;
    case "codeBlock":
      return (
        <pre key={key}>
          <code>{renderChildren(node, key)}</code>
        </pre>
      );
    case "image": {
      const src = safeImageSrc(node.attrs?.src);
      if (!src) return null;
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
      const title = typeof node.attrs?.title === "string" && node.attrs.title ? node.attrs.title : undefined;
      return (
        <figure key={key}>
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            width={numberAttr(node.attrs?.width)}
            height={numberAttr(node.attrs?.height)}
          />
          {title && <figcaption>{title}</figcaption>}
        </figure>
      );
    }
    case "table":
      return (
        <div key={key} className="blog-table-scroll" role="region" aria-label="Table" tabIndex={0}>
          <table>
            <tbody>{renderChildren(node, key)}</tbody>
          </table>
        </div>
      );
    case "tableRow":
      return <tr key={key}>{renderChildren(node, key)}</tr>;
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
          {renderChildren(node, key)}
        </Tag>
      );
    }
    default:
      // Unknown node: keep any text it contains rather than losing content.
      return node.content ? <Fragment key={key}>{renderChildren(node, key)}</Fragment> : null;
  }
}

export function ArticleContent({ doc, className }: { doc: RichTextNode; className?: string }) {
  return <div className={`blog-prose ${className ?? ""}`}>{renderNode(doc, "n")}</div>;
}

export default ArticleContent;
