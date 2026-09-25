import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ArticleContent } from "./ArticleContent";
import type { RichTextDoc } from "@/lib/blog/types";

const renderDoc = (doc: RichTextDoc) =>
  render(
    <MemoryRouter>
      <ArticleContent doc={doc} />
    </MemoryRouter>,
  );

const text = (value: string, marks?: RichTextDoc["marks"]) => ({ type: "text", text: value, marks });

describe("ArticleContent", () => {
  it("renders the supported formatting", () => {
    const { container } = renderDoc({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [text("Promoted to H2")] },
        { type: "heading", attrs: { level: 3 }, content: [text("Sub")] },
        { type: "paragraph", content: [text("bold", [{ type: "bold" }]), text(" and "), text("italic", [{ type: "italic" }])] },
        { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [text("one")] }] }] },
        { type: "orderedList", attrs: { start: 3 }, content: [{ type: "listItem", content: [{ type: "paragraph", content: [text("three")] }] }] },
        { type: "blockquote", content: [{ type: "paragraph", content: [text("quote")] }] },
        { type: "horizontalRule" },
        { type: "image", attrs: { src: "https://cdn.example.com/a.jpg", alt: "Car at FLL", title: "Arrivals", width: 800, height: 600 } },
        {
          type: "table",
          content: [
            { type: "tableRow", content: [{ type: "tableHeader", content: [{ type: "paragraph", content: [text("Option")] }] }] },
            { type: "tableRow", content: [{ type: "tableCell", content: [{ type: "paragraph", content: [text("Delivery")] }] }] },
          ],
        },
      ],
    });
    // The page owns the only H1.
    expect(container.querySelector("h1")).toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: "Promoted to H2" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Sub" })).toBeInTheDocument();
    expect(container.querySelector("strong")?.textContent).toBe("bold");
    expect(container.querySelector("em")?.textContent).toBe("italic");
    expect(container.querySelector("ol")?.getAttribute("start")).toBe("3");
    expect(container.querySelector("blockquote")).not.toBeNull();
    expect(container.querySelector("hr")).not.toBeNull();
    const img = screen.getByRole("img", { name: "Car at FLL" });
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("width", "800");
    expect(screen.getByText("Arrivals").tagName).toBe("FIGCAPTION");
    expect(screen.getByRole("columnheader", { name: "Option" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Delivery" })).toBeInTheDocument();
  });

  it("renders internal links in-app and external links safely in a new tab", () => {
    renderDoc({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            text("book", [{ type: "link", attrs: { href: "/book" } }]),
            text(" source", [{ type: "link", attrs: { href: "https://www.broward.org" } }]),
          ],
        },
      ],
    });
    const internal = screen.getByRole("link", { name: "book" });
    expect(internal).toHaveAttribute("href", "/book");
    expect(internal).not.toHaveAttribute("target");
    const external = screen.getByRole("link", { name: "source" });
    expect(external).toHaveAttribute("target", "_blank");
    expect(external).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("never renders script URLs, raw HTML or unknown node types as markup", () => {
    const { container } = renderDoc({
      type: "doc",
      content: [
        { type: "paragraph", content: [text("click", [{ type: "link", attrs: { href: "javascript:alert(1)" } }])] },
        { type: "image", attrs: { src: "javascript:alert(1)", alt: "x" } },
        { type: "html", attrs: { html: "<img src=x onerror=alert(1)>" }, content: [text("<b>kept as text</b>")] },
      ],
    });
    expect(container.querySelector("a")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("b")).toBeNull();
    expect(container.textContent).toContain("click");
    expect(container.textContent).toContain("<b>kept as text</b>");
  });
});
