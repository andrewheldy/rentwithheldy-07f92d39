import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GALLERY_MAX_IMAGES, ctaButton, galleryImages, type GalleryImage } from "@/lib/blog/content";
import { ACCEPTED_IMAGE_TYPES, uploadBlogImage } from "@/lib/blog/images";
import { CTA_PRESETS } from "@/lib/blog/presets";

/* Dialogs for the editor's gallery and button blocks (see editorExtensions.ts). */

interface BlockDialogProps {
  editor: Editor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit the selected block instead of inserting a new one. */
  editing: boolean;
}

export function GalleryDialog({ editor, open, onOpenChange, editing }: BlockDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const attrs = editing ? editor.getAttributes("gallery") : {};
    setImages(galleryImages(attrs.images));
    setCaption(typeof attrs.caption === "string" ? attrs.caption : "");
    setError("");
  }, [open, editing, editor]);

  const room = GALLERY_MAX_IMAGES - images.length;

  const upload = async (files: FileList | null) => {
    const chosen = [...(files ?? [])].slice(0, Math.max(room, 0));
    if (!chosen.length) return;
    setUploading(true);
    setError("");
    try {
      for (const file of chosen) {
        const uploaded = await uploadBlogImage(file);
        setImages((current) => [...current, { src: uploaded.url, alt: "", width: uploaded.width, height: uploaded.height }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const update = (index: number, alt: string) => setImages((current) => current.map((image, i) => (i === index ? { ...image, alt } : image)));
  const move = (index: number, delta: number) =>
    setImages((current) => {
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item);
      return next;
    });

  const save = () => {
    if (images.length < 2) {
      setError("Add at least two photos. For a single photo, use “Add image”.");
      return;
    }
    const missing = images.findIndex((image) => !image.alt.trim());
    if (missing >= 0) {
      setError(`Describe photo ${missing + 1} in its alt text — it's read aloud to visitors using screen readers.`);
      return;
    }
    const attrs = { images: images.map((image) => ({ ...image, alt: image.alt.trim() })), caption: caption.trim() };
    if (editing) editor.chain().focus().updateAttributes("gallery", attrs).run();
    else editor.chain().focus().insertContent({ type: "gallery", attrs }).run();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit gallery" : "Add a photo gallery"}</DialogTitle>
          <DialogDescription>Two to {GALLERY_MAX_IMAGES} photos, shown as a grid. Each photo needs alt text.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {images.length > 0 && (
            <ol className="space-y-3">
              {images.map((image, index) => (
                <li key={`${image.src}-${index}`} className="flex gap-3 rounded-control border border-border p-3">
                  <img src={image.src} alt="" className="h-20 w-28 shrink-0 rounded-control bg-secondary object-cover" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Label htmlFor={`gallery-alt-${index}`}>Photo {index + 1} alt text</Label>
                    <Input id={`gallery-alt-${index}`} value={image.alt} maxLength={300} onChange={(event) => update(index, event.target.value)} />
                    <div className="flex justify-end gap-1">
                      <Button type="button" variant="ghost" size="sm" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Move photo ${index + 1} up`}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" disabled={index === images.length - 1} onClick={() => move(index, 1)} aria-label={`Move photo ${index + 1} down`}>
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setImages((current) => current.filter((_, i) => i !== index))}
                        aria-label={`Remove photo ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {room > 0 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-control border-2 border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
              {uploading ? "Uploading…" : images.length ? "Add more photos" : "Choose photos to upload"}
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            multiple
            accept={ACCEPTED_IMAGE_TYPES}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(event) => upload(event.target.files)}
          />
          <div className="space-y-1.5">
            <Label htmlFor="gallery-caption">Caption (optional)</Label>
            <Input id="gallery-caption" value={caption} maxLength={300} onChange={(event) => setCaption(event.target.value)} />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" onClick={save} disabled={uploading}>
            {editing ? "Save gallery" : "Insert gallery"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CtaButtonDialog({ editor, open, onOpenChange, editing }: BlockDialogProps) {
  const [preset, setPreset] = useState("custom");
  const [label, setLabel] = useState("");
  const [href, setHref] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const attrs = editing ? editor.getAttributes("ctaButton") : {};
    const nextLabel = typeof attrs.label === "string" ? attrs.label : "";
    const nextHref = typeof attrs.href === "string" ? attrs.href : "";
    const match = CTA_PRESETS.find((p) => p.label === nextLabel && p.url === nextHref);
    setPreset(editing ? (match ? match.id : "custom") : CTA_PRESETS[0].id);
    setLabel(editing ? nextLabel : CTA_PRESETS[0].label);
    setHref(editing ? nextHref : CTA_PRESETS[0].url);
    setError("");
  }, [open, editing, editor]);

  const choose = (id: string) => {
    setPreset(id);
    const match = CTA_PRESETS.find((p) => p.id === id);
    if (match) {
      setLabel(match.label);
      setHref(match.url);
    }
    setError("");
  };

  const save = () => {
    const cta = ctaButton({ label, href });
    if (!cta) {
      setError(
        label.trim()
          ? "The link must be a page on this site (starting with /) or a full https:// address."
          : "Give the button a label.",
      );
      return;
    }
    if (editing) editor.chain().focus().updateAttributes("ctaButton", cta).run();
    else editor.chain().focus().insertContent({ type: "ctaButton", attrs: cta }).run();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit button" : "Add a button"}</DialogTitle>
          <DialogDescription>A button inside the article. Preset labels are translated for visitors in every language.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="inline-cta-preset">Button</Label>
            <Select value={preset} onValueChange={choose}>
              <SelectTrigger id="inline-cta-preset">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CTA_PRESETS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label} → {p.url}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom…</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="inline-cta-label">Button label</Label>
              <Input
                id="inline-cta-label"
                value={label}
                maxLength={80}
                onChange={(event) => {
                  setLabel(event.target.value);
                  setPreset("custom");
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inline-cta-url">Button link</Label>
              <Input
                id="inline-cta-url"
                value={href}
                placeholder="/book"
                onChange={(event) => {
                  setHref(event.target.value);
                  setPreset("custom");
                }}
              />
            </div>
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit">{editing ? "Save button" : "Insert button"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
