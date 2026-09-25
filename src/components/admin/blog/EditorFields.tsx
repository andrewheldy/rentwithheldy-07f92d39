import { useRef, useState, type KeyboardEvent } from "react";
import { ArrowDown, ArrowUp, Check, Circle, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isHttpUrl } from "@/lib/blog/content";
import { ACCEPTED_IMAGE_TYPES, uploadBlogImage, type UploadedImage } from "@/lib/blog/images";
import type { BlogSource, BlogTag } from "@/lib/blog/types";

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

interface FeaturedImageValue {
  url: string | null;
  alt: string;
  width: number | null;
  height: number | null;
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
      onChange({ ...value, url: uploaded.url, width: uploaded.width, height: uploaded.height });
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
        <div className="relative overflow-hidden rounded-control border border-border">
          <img src={value.url} alt="" className="aspect-[16/10] w-full object-cover" />
          <div className="absolute end-2 top-2 flex gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Replace"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              aria-label="Remove featured image"
              onClick={() => onChange({ url: null, alt: value.alt, width: null, height: null })}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
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
    </div>
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
