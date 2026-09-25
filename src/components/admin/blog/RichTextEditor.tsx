import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { Placeholder } from "@tiptap/extensions";
import {
  Bold,
  Columns3,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Rows3,
  Table as TableIcon,
  Trash2,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { safeHref, safeImageSrc } from "@/lib/blog/content";
import { ACCEPTED_IMAGE_TYPES, uploadBlogImage } from "@/lib/blog/images";
import { INTERNAL_LINKS } from "@/lib/blog/presets";
import type { RichTextDoc } from "@/lib/blog/types";

/*
 * Article body editor. Tiptap (ProseMirror) stores the document as JSON; the
 * public site renders that JSON through an allow-list renderer
 * (components/blog/ArticleContent). The editing surface uses the same
 * `.blog-prose` styles as the live article so what you see is what readers get.
 */

interface RichTextEditorProps {
  value: RichTextDoc;
  onChange: (doc: RichTextDoc) => void;
  labelledBy?: string;
}

function ToolButton({
  label,
  onClick,
  active,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-pressed={active}
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()} // keep editor selection
          onClick={onClick}
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-foreground/80 transition-colors hover:bg-secondary hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-40 ${
            active ? "bg-ink text-white hover:bg-ink hover:text-white" : ""
          }`}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

const Divider = () => <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-border" />;

function LinkDialog({ editor, open, onOpenChange }: { editor: Editor; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [href, setHref] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setHref((editor.getAttributes("link").href as string | undefined) ?? "");
      setError("");
    }
  }, [open, editor]);

  const apply = () => {
    const trimmed = href.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      onOpenChange(false);
      return;
    }
    // Bare domains become https:// links; site paths stay relative.
    const candidate = /^(\/|#|https?:|mailto:|tel:)/i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const safe = safeHref(candidate);
    if (!safe) {
      setError("Enter a page on this site (like /book) or a full web address (https://…).");
      return;
    }
    const chain = editor.chain().focus().extendMarkRange("link");
    if (editor.state.selection.empty && !editor.isActive("link")) {
      // Nothing selected: insert the link text itself.
      const label = INTERNAL_LINKS.find((l) => l.path === safe)?.label ?? safe;
      chain.insertContent({ type: "text", text: label, marks: [{ type: "link", attrs: { href: safe } }] }).run();
    } else {
      chain.setLink({ href: safe }).run();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a link</DialogTitle>
          <DialogDescription>
            Link to one of our pages, or paste any web address. Links to other websites open in a new tab automatically.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            apply();
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="link-href">Link address</Label>
            <Input
              id="link-href"
              autoFocus
              value={href}
              placeholder="/book or https://example.com"
              onChange={(event) => {
                setHref(event.target.value);
                setError("");
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "link-href-error" : undefined}
            />
            {error && (
              <p id="link-href-error" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Our pages</p>
            <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto">
              {INTERNAL_LINKS.map((link) => (
                <button
                  key={link.path}
                  type="button"
                  onClick={() => setHref(link.path)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    href === link.path ? "border-ink bg-ink text-white" : "border-border hover:border-ink/40"
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            {editor.isActive("link") && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  editor.chain().focus().extendMarkRange("link").unsetLink().run();
                  onOpenChange(false);
                }}
              >
                Remove link
              </Button>
            )}
            <Button type="submit">Apply link</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ImageDialog({ editor, open, onOpenChange }: { editor: Editor; open: boolean; onOpenChange: (open: boolean) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState("");
  const [size, setSize] = useState<{ width: number | null; height: number | null }>({ width: null, height: null });
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setSrc("");
      setAlt("");
      setCaption("");
      setError("");
      setSize({ width: null, height: null });
    }
  }, [open]);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const uploaded = await uploadBlogImage(file);
      setSrc(uploaded.url);
      setSize({ width: uploaded.width, height: uploaded.height });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const insert = () => {
    const safe = safeImageSrc(src);
    if (!safe) {
      setError("Upload an image or paste an https:// image address.");
      return;
    }
    if (!alt.trim()) {
      setError("Describe the image in the alt text — it's read aloud to visitors using screen readers.");
      return;
    }
    editor
      .chain()
      .focus()
      .setImage({
        src: safe,
        alt: alt.trim(),
        title: caption.trim() || undefined,
        width: size.width ?? undefined,
        height: size.height ?? undefined,
      })
      .run();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add an image</DialogTitle>
          <DialogDescription>Photos are resized automatically for fast loading.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {src ? (
            <img src={src} alt="" className="max-h-56 w-full rounded-control border object-contain" />
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-control border-2 border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
              {uploading ? "Uploading…" : "Choose an image to upload"}
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(event) => upload(event.target.files?.[0])}
          />
          <div className="space-y-1.5">
            <Label htmlFor="image-src">…or image address</Label>
            <Input id="image-src" value={src} placeholder="https://" onChange={(event) => setSrc(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="image-alt">Alt text (required)</Label>
            <Input
              id="image-alt"
              value={alt}
              placeholder="e.g. Silver SUV parked at FLL arrivals"
              onChange={(event) => setAlt(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="image-caption">Caption (optional)</Label>
            <Input id="image-caption" value={caption} onChange={(event) => setCaption(event.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="button" onClick={insert} disabled={uploading}>
            Insert image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RichTextEditor({ value, onChange, labelledBy }: RichTextEditorProps) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  // Tiptap re-applies options whenever they change identity, so everything
  // passed to useEditor is kept referentially stable across renders. The
  // document is only read on mount (remount with a new `key` to reset it).
  // An empty doc ({content: []}) would start ProseMirror with an AllSelection,
  // so the first keystroke would replace everything (e.g. undo a heading the
  // editor just chose). Start from one empty paragraph instead.
  const initialContent = useRef<RichTextDoc>(
    value.content?.length ? value : { type: "doc", content: [{ type: "paragraph" }] },
  );
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          isAllowedUri: (url, ctx) => Boolean(safeHref(url)) && ctx.defaultValidate(url),
        },
      }),
      Image.configure({ allowBase64: false }),
      TableKit.configure({ table: { resizable: false } }),
      Placeholder.configure({ placeholder: "Start writing your article…" }),
    ],
    [],
  );

  const editorProps = useMemo(
    () => ({
      attributes: {
        class: "blog-prose min-h-[24rem] px-5 py-6 focus:outline-none sm:px-8",
        ...(labelledBy ? { "aria-labelledby": labelledBy } : {}),
        "aria-multiline": "true",
        role: "textbox",
      },
      // Pasted/dropped image files would otherwise become base64 blobs.
      handlePaste: (_view: unknown, event: ClipboardEvent) => {
        const file = [...(event.clipboardData?.files ?? [])].find((f) => f.type.startsWith("image/"));
        if (!file) return false;
        event.preventDefault();
        toast({ title: "Use the image button", description: "Pasted images aren't uploaded. Use “Add image” so the photo is optimized and gets alt text." });
        return true;
      },
      handleDrop: (_view: unknown, event: DragEvent) => {
        const file = [...(event.dataTransfer?.files ?? [])].find((f) => f.type.startsWith("image/"));
        if (!file) return false;
        event.preventDefault();
        toast({ title: "Use the image button", description: "Dropped images aren't uploaded. Use “Add image” so the photo is optimized and gets alt text." });
        return true;
      },
    }),
    [labelledBy],
  );

  const editor = useEditor({
    extensions,
    content: initialContent.current,
    shouldRerenderOnTransaction: true,
    editorProps,
    onUpdate: ({ editor: e }) => onChangeRef.current(e.getJSON() as RichTextDoc),
  });

  if (!editor) return <div className="min-h-[28rem] rounded-card border border-border bg-card" />;

  const inTable = editor.isActive("table");

  return (
    <div className="overflow-hidden rounded-card border border-input bg-card focus-within:ring-2 focus-within:ring-primary">
      <div
        role="toolbar"
        aria-label="Formatting"
        className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-border bg-card/95 px-2 py-1.5 backdrop-blur"
      >
        <ToolButton label="Paragraph" active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()}>
          <Pilcrow className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Heading (H2)" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Subheading (H3)" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="h-4 w-4" />
        </ToolButton>
        <Divider />
        <ToolButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Add or edit link" active={editor.isActive("link")} onClick={() => setLinkOpen(true)}>
          <Link2 className="h-4 w-4" />
        </ToolButton>
        {editor.isActive("link") && (
          <ToolButton label="Remove link" onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}>
            <Link2Off className="h-4 w-4" />
          </ToolButton>
        )}
        <Divider />
        <ToolButton label="Bulleted list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-4 w-4" />
        </ToolButton>
        <Divider />
        <ToolButton label="Add image" onClick={() => setImageOpen(true)}>
          <ImagePlus className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          label="Insert table"
          disabled={inTable}
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        >
          <TableIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Separator line" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="h-4 w-4" />
        </ToolButton>
        <Divider />
        <ToolButton label="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="h-4 w-4" />
        </ToolButton>

        {inTable && (
          <div className="flex w-full flex-wrap items-center gap-1 border-t border-border pt-1.5 text-xs">
            <span className="px-1 font-medium text-muted-foreground">Table:</span>
            <Button type="button" variant="ghost" size="sm" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().addRowAfter().run()}>
              <Rows3 className="me-1 h-3.5 w-3.5" /> Add row
            </Button>
            <Button type="button" variant="ghost" size="sm" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().addColumnAfter().run()}>
              <Columns3 className="me-1 h-3.5 w-3.5" /> Add column
            </Button>
            <Button type="button" variant="ghost" size="sm" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().deleteRow().run()}>
              Delete row
            </Button>
            <Button type="button" variant="ghost" size="sm" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().deleteColumn().run()}>
              Delete column
            </Button>
            <Button type="button" variant="ghost" size="sm" className="text-destructive" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().deleteTable().run()}>
              <Trash2 className="me-1 h-3.5 w-3.5" /> Delete table
            </Button>
          </div>
        )}
      </div>

      <div lang="en" dir="ltr">
        <EditorContent editor={editor} />
      </div>

      <LinkDialog editor={editor} open={linkOpen} onOpenChange={setLinkOpen} />
      <ImageDialog editor={editor} open={imageOpen} onOpenChange={setImageOpen} />
    </div>
  );
}

export default RichTextEditor;
