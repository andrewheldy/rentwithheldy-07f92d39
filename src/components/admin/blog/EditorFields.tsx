import { useRef, useState, type KeyboardEvent } from "react";
import { ArrowDown, ArrowUp, Check, Circle, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isHttpUrl } from "@/lib/blog/content";
import { ACCEPTED_IMAGE_TYPES, uploadBlogImage, type UploadedImage } from "@/lib/blog/images";
import type { BlogSource, BlogTag, HeaderLayout } from "@/lib/blog/types";

/* Building blocks for the post editor (pages/AdminBlogEditor.tsx). */

// ---------------------------------------------------------------------------
// Character-count guidance (never blocks saving or publishing)
// ---------------------------------------------------------------------------

export function CharacterGuide({ id, length, min, max }: { id: string; length: number; min: number; max: number }) {
  const state = length === 0 ? "empty" : length < min ? "short" : length > max ? "long" : "good";
  const message = {
    empty: `Suggested: ${min}–${max} characters.`,
    short: `${length} characters — a little short. Suggested ${min}–${max}.`,
    long: `${length} characters — may be cut off in search results. Suggested ${min}–${max}.`,
    good: `${length} characters — a good length.`,
  }[state];
  return (
    <p id={id} className={`text-xs ${state === "good" ? "text-emerald-700" : state === "long" ? "text-amber-700" : "text-muted-foreground"}`}>
      {message}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Featured image
// ---------------------------------------------------------------------------

export interface FeaturedImageValue {
  url: string | null;
  alt: string;
  width: number | null;
  height: number | null;
  caption: string;
  credit: string;
  /** Focal point, 0–100 % from the left and from the top. */
  focusX: number;
  focusY: number;
}

const clampPercent = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

/**
 * Click (or use the arrow keys on) the photo to mark its subject. Wherever
 * the photo is cropped — blog cards, the wide header — that point stays in
 * frame.
 */
function FocalPointPicker({ value, onChange }: { value: FeaturedImageValue; onChange: (next: FeaturedImageValue) => void }) {
  const setFocus = (x: number, y: number) => onChange({ ...value, focusX: clampPercent(x), focusY: clampPercent(y) });
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const step = event.shiftKey ? 10 : 5;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    setFocus(value.focusX + move[0], value.focusY + move[1]);
  };
  const position = `${value.focusX}% ${value.focusY}%`;
  return (
    <div className="space-y-2">
      <button
        type="button"
        className="relative block w-full cursor-crosshair overflow-hidden rounded-control border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`Focal point: ${value.focusX}% from the left, ${value.focusY}% from the top. Click the subject of the photo, or use the arrow keys.`}
        onClick={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          // Keyboard "clicks" (Enter/Space) report 0,0 — ignore them.
          if (event.detail === 0) return;
          setFocus(((event.clientX - box.left) / box.width) * 100, ((event.clientY - box.top) / box.height) * 100);
        }}
        onKeyDown={onKeyDown}
      >
        <img src={value.url!} alt="" className="block h-auto w-full" draggable={false} />
        <span
          aria-hidden
          className="pointer-events-none absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary/40 shadow-[0_0_0_2px_rgba(0,0,0,0.45)]"
          style={{ left: `${value.focusX}%`, top: `${value.focusY}%` }}
        />
      </button>
      <p className="text-xs text-muted-foreground">Click the subject of the photo to keep it in frame when the photo is cropped.</p>
      <div className="grid grid-cols-[3fr_2fr] gap-2" aria-hidden>
        <div>
          <img src={value.url!} alt="" className="aspect-[21/9] w-full rounded-control object-cover" style={{ objectPosition: position }} />
          <p className="mt-1 text-[0.6875rem] text-muted-foreground">Wide header</p>
        </div>
        <div>
          <img src={value.url!} alt="" className="aspect-[16/10] w-full rounded-control object-cover" style={{ objectPosition: position }} />
          <p className="mt-1 text-[0.6875rem] text-muted-foreground">Blog card</p>
        </div>
      </div>
    </div>
  );
}

export function FeaturedImageField({
  value,
  onChange,
}: {
  value: FeaturedImageValue;
  onChange: (next: FeaturedImageValue) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const uploaded: UploadedImage = await uploadBlogImage(file);
      // A new photo starts centered.
      onChange({ ...value, url: uploaded.url, width: uploaded.width, height: uploaded.height, focusX: 50, focusY: 50 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {value.url ? (
        <div className="space-y-2">
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Replace"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              aria-label="Remove featured image"
              onClick={() => onChange({ ...value, url: null, width: null, height: null, focusX: 50, focusY: 50 })}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <FocalPointPicker value={value} onChange={onChange} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-control border-2 border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
          {uploading ? "Uploading and optimizing…" : "Upload featured image"}
          <span className="text-xs">Landscape works best (at least 1200 px wide)</span>
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
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="space-y-1.5">
        <Label htmlFor="featured-alt">Image alt text</Label>
        <Input
          id="featured-alt"
          value={value.alt}
          placeholder="Describe what's in the photo"
          onChange={(event) => onChange({ ...value, alt: event.target.value })}
        />
        <p className="text-xs text-muted-foreground">Read aloud by screen readers and used for social previews.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="featured-caption">Caption (optional)</Label>
        <Input
          id="featured-caption"
          value={value.caption}
          maxLength={300}
          onChange={(event) => onChange({ ...value, caption: event.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="featured-credit">Photo credit (optional)</Label>
        <Input
          id="featured-credit"
          value={value.credit}
          maxLength={120}
          placeholder="e.g. Rent With Heldy"
          onChange={(event) => onChange({ ...value, credit: event.target.value })}
        />
        <p className="text-xs text-muted-foreground">Shown under the header photo as “Photo: …”.</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Article header layout
// ---------------------------------------------------------------------------

const HEADER_OPTIONS: { value: HeaderLayout; label: string; description: string }[] = [
  { value: "stacked", label: "Title, then photo", description: "The headline first, with the featured photo below it." },
  { value: "overlay", label: "Photo behind the title", description: "A full-width photo with the headline on top. Needs a featured image." },
  { value: "text", label: "Title only", description: "No photo in the header. The featured image is still used on cards and when shared." },
];

export function HeaderLayoutField({
  value,
  onChange,
  hasImage,
}: {
  value: HeaderLayout;
  onChange: (next: HeaderLayout) => void;
  hasImage: boolean;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-medium leading-none">Article header</legend>
      {HEADER_OPTIONS.map((option) => {
        const id = `header-layout-${option.value}`;
        const checked = value === option.value;
        return (
          <label
            key={option.value}
            htmlFor={id}
            className={`flex cursor-pointer gap-3 rounded-control border p-3 transition-colors focus-within:ring-2 focus-within:ring-primary ${
              checked ? "border-ink bg-secondary/60" : "border-border hover:border-ink/40"
            }`}
          >
            <input
              id={id}
              type="radio"
              name="header-layout"
              value={option.value}
              checked={checked}
              onChange={() => onChange(option.value)}
              className="mt-1 h-4 w-4 shrink-0 accent-[hsl(var(--ink))]"
              aria-describedby={`${id}-help`}
            />
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{option.label}</span>
              <span id={`${id}-help`} className="block text-xs text-muted-foreground">
                {option.description}
              </span>
            </span>
          </label>
        );
      })}
      {value === "overlay" && !hasImage && (
        <p className="text-xs text-amber-700">Add a featured image to use this header. Until then, the title is shown on its own.</p>
      )}
    </fieldset>
  );
}

// ---------------------------------------------------------------------------
// Sources (repeatable)
// ---------------------------------------------------------------------------

export function SourcesField({ sources, onChange }: { sources: BlogSource[]; onChange: (next: BlogSource[]) => void }) {
  const update = (index: number, patch: Partial<BlogSource>) =>
    onChange(sources.map((source, i) => (i === index ? { ...source, ...patch } : source)));
  const move = (index: number, delta: number) => {
    const next = [...sources];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {sources.length === 0 && (
        <p className="rounded-control border border-dashed border-border p-4 text-sm text-muted-foreground">
          No sources yet. Add the websites, studies or official pages this article relies on — they appear in a “Sources” list at the bottom of the article.
        </p>
      )}
      {sources.map((source, index) => {
        const urlInvalid = source.url.trim() !== "" && !isHttpUrl(source.url);
        return (
          <fieldset key={index} className="rounded-control border border-border p-4">
            <legend className="px-1 text-sm font-medium">Source {index + 1}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={`source-name-${index}`}>Source name</Label>
                <Input
                  id={`source-name-${index}`}
                  value={source.name}
                  placeholder="e.g. FLL Ground Transportation"
                  onChange={(event) => update(index, { name: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`source-publisher-${index}`}>Publisher (optional)</Label>
                <Input
                  id={`source-publisher-${index}`}
                  value={source.publisher ?? ""}
                  placeholder="e.g. Broward County"
                  onChange={(event) => update(index, { publisher: event.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor={`source-url-${index}`}>URL</Label>
                <Input
                  id={`source-url-${index}`}
                  type="url"
                  inputMode="url"
                  value={source.url}
                  placeholder="https://"
                  aria-invalid={urlInvalid}
                  onChange={(event) => update(index, { url: event.target.value })}
                />
                {urlInvalid && <p className="text-xs text-destructive">Enter a full address starting with https://</p>}
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-1">
              <Button type="button" variant="ghost" size="sm" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Move source ${index + 1} up`}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="sm" disabled={index === sources.length - 1} onClick={() => move(index, 1)} aria-label={`Move source ${index + 1} down`}>
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => onChange(sources.filter((_, i) => i !== index))}>
                <Trash2 className="me-1 h-4 w-4" /> Remove
              </Button>
            </div>
          </fieldset>
        );
      })}
      <Button type="button" variant="outline" onClick={() => onChange([...sources, { name: "", url: "", publisher: "" }])}>
        <Plus className="me-2 h-4 w-4" /> Add source
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

export function TagInput({ tags, onChange, suggestions }: { tags: string[]; onChange: (next: string[]) => void; suggestions: BlogTag[] }) {
  const [draft, setDraft] = useState("");
  const add = (raw: string) => {
    const name = raw.trim().replace(/,$/, "").trim();
    if (!name || tags.some((t) => t.toLowerCase() === name.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...tags, name]);
    setDraft("");
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add(draft);
    } else if (event.key === "Backspace" && !draft && tags.length) {
      onChange(tags.slice(0, -1));
    }
  };
  return (
    <div className="space-y-2">
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <li key={tag} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-sm">
              {tag}
              <button type="button" aria-label={`Remove tag ${tag}`} onClick={() => onChange(tags.filter((t) => t !== tag))} className="rounded-full p-0.5 hover:bg-background">
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Input
        id="post-tags"
        list="post-tag-suggestions"
        value={draft}
        placeholder="Type a tag and press Enter"
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => draft && add(draft)}
      />
      <datalist id="post-tag-suggestions">
        {suggestions.map((tag) => (
          <option key={tag.id} value={tag.name} />
        ))}
      </datalist>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Publishing checklist — guidance only, not a score
// ---------------------------------------------------------------------------

export interface ChecklistItem {
  label: string;
  done: boolean;
  optional?: boolean;
}

export function PublishingChecklist({ items }: { items: ChecklistItem[] }) {
  const done = items.filter((i) => i.done).length;
  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">
        {done} of {items.length} ready. Nothing here blocks publishing — it's a reminder of what makes a strong article.
      </p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2.5 text-sm">
            {item.done ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                <Check className="h-3 w-3" aria-hidden />
              </span>
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground/60" aria-hidden />
            )}
            <span className={item.done ? "text-foreground" : "text-muted-foreground"}>
              {item.label}
              {item.optional && <span className="text-xs text-muted-foreground"> (optional)</span>}
            </span>
            <span className="sr-only">{item.done ? "— done" : "— not yet"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
