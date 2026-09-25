import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Eye, Loader2, Undo2, X } from "lucide-react";
import SEO from "@/components/SEO";
import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import { BlogStatusBadge } from "@/components/admin/blog/BlogStatusBadge";
import { RichTextEditor } from "@/components/admin/blog/RichTextEditor";
import {
  CharacterGuide,
  FeaturedImageField,
  PublishingChecklist,
  SourcesField,
  TagInput,
} from "@/components/admin/blog/EditorFields";
import { ArticleView } from "@/components/blog/ArticleView";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  adminGetPost,
  adminListTags,
  adminSavePost,
  fetchCategories,
  isSlugAvailable,
  type PostInput,
} from "@/lib/blog/api";
import { hasContent, isHttpUrl, safeHref } from "@/lib/blog/content";
import { CTA_PRESETS, DEFAULT_AUTHOR } from "@/lib/blog/presets";
import {
  META_DESCRIPTION_GUIDE,
  SEO_TITLE_GUIDE,
  defaultCanonical,
  postPath,
  resolveArticleMeta,
} from "@/lib/blog/seo";
import { isValidSlug, slugify } from "@/lib/blog/slug";
import { effectiveStatus, isLive } from "@/lib/blog/status";
import { EMPTY_DOC, type BlogCategory, type BlogPost, type BlogSource, type BlogStatus, type RichTextDoc } from "@/lib/blog/types";

// ---------------------------------------------------------------------------
// Form model
// ---------------------------------------------------------------------------

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  content: RichTextDoc;
  featured: { url: string | null; alt: string; width: number | null; height: number | null };
  categoryId: string;
  tags: string[];
  author: string;
  status: BlogStatus;
  publishedAt: string; // datetime-local (editor's time zone)
  lastUpdatedAt: string; // datetime-local
  seoTitle: string;
  metaDescription: string;
  primaryKeyword: string;
  canonicalUrl: string;
  socialTitle: string;
  socialDescription: string;
  ctaPreset: string; // "none" | preset id | "custom"
  ctaLabel: string;
  ctaUrl: string;
  sources: BlogSource[];
}

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  excerpt: "",
  content: EMPTY_DOC,
  featured: { url: null, alt: "", width: null, height: null },
  categoryId: "",
  tags: [],
  author: DEFAULT_AUTHOR,
  status: "draft",
  publishedAt: "",
  lastUpdatedAt: "",
  seoTitle: "",
  metaDescription: "",
  primaryKeyword: "",
  canonicalUrl: "",
  socialTitle: "",
  socialDescription: "",
  ctaPreset: "none",
  ctaLabel: "",
  ctaUrl: "",
  sources: [],
};

const pad = (n: number) => String(n).padStart(2, "0");
/** ISO → value for <input type="datetime-local"> in the editor's time zone. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
const nullIfBlank = (value: string) => (value.trim() ? value.trim() : null);

function formFromPost(post: BlogPost): FormState {
  const preset = CTA_PRESETS.find((p) => p.label === post.cta_label && p.url === post.cta_url);
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    featured: {
      url: post.featured_image,
      alt: post.featured_image_alt ?? "",
      width: post.featured_image_width,
      height: post.featured_image_height,
    },
    categoryId: post.category_id ?? "",
    tags: post.tags.map((t) => t.name),
    author: post.author,
    // A scheduled post whose time has come is simply published.
    status: effectiveStatus(post),
    publishedAt: toLocalInput(post.published_at),
    lastUpdatedAt: toLocalInput(post.last_updated_at),
    seoTitle: post.seo_title ?? "",
    metaDescription: post.meta_description ?? "",
    primaryKeyword: post.primary_keyword ?? "",
    canonicalUrl: post.canonical_url ?? "",
    socialTitle: post.social_title ?? "",
    socialDescription: post.social_description ?? "",
    ctaPreset: post.cta_label ? (preset ? preset.id : "custom") : "none",
    ctaLabel: post.cta_label ?? "",
    ctaUrl: post.cta_url ?? "",
    sources: post.sources.map((s) => ({ name: s.name, url: s.url, publisher: s.publisher ?? "" })),
  };
}

function toInput(form: FormState, status: BlogStatus, publishedAt: string | null, lastUpdatedAt: string | null): PostInput {
  const hasCta = form.ctaPreset !== "none" && form.ctaLabel.trim() && form.ctaUrl.trim();
  return {
    title: form.title.trim(),
    slug: form.slug.trim(),
    excerpt: form.excerpt.trim(),
    content: form.content,
    featured_image: form.featured.url,
    featured_image_alt: form.featured.url ? nullIfBlank(form.featured.alt) : null,
    featured_image_width: form.featured.url ? form.featured.width : null,
    featured_image_height: form.featured.url ? form.featured.height : null,
    category_id: form.categoryId || null,
    author: form.author.trim() || DEFAULT_AUTHOR,
    status,
    published_at: publishedAt,
    last_updated_at: lastUpdatedAt,
    seo_title: nullIfBlank(form.seoTitle),
    meta_description: nullIfBlank(form.metaDescription),
    primary_keyword: nullIfBlank(form.primaryKeyword),
    canonical_url: nullIfBlank(form.canonicalUrl),
    social_title: nullIfBlank(form.socialTitle),
    social_description: nullIfBlank(form.socialDescription),
    cta_label: hasCta ? form.ctaLabel.trim() : null,
    cta_url: hasCta ? form.ctaUrl.trim() : null,
    tags: form.tags,
    sources: form.sources,
  };
}

/** Assemble an in-memory post (for the live preview) from unsaved form state. */
function previewPost(form: FormState, categories: BlogCategory[], id?: string): BlogPost {
  const input = toInput(form, form.status, fromLocalInput(form.publishedAt) ?? new Date().toISOString(), fromLocalInput(form.lastUpdatedAt));
  const category = categories.find((c) => c.id === input.category_id) ?? null;
  const now = new Date().toISOString();
  return {
    ...input,
    id: id ?? "preview",
    slug: input.slug || "preview",
    category: category ? { id: category.id, slug: category.slug, name: category.name } : null,
    tags: input.tags.map((name) => ({ id: name, slug: slugify(name), name })),
    sources: input.sources.filter((s) => s.name.trim() && isHttpUrl(s.url)),
    created_at: now,
    updated_at: now,
  };
}

const sectionTitle = "text-lg font-semibold";

export default function AdminBlogEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const postQuery = useQuery({ queryKey: ["admin", "blog", "post", id], queryFn: () => adminGetPost(id!), enabled: !isNew });
  const categoriesQuery = useQuery({ queryKey: ["blog", "categories"], queryFn: fetchCategories });
  const tagsQuery = useQuery({ queryKey: ["admin", "blog", "tags"], queryFn: adminListTags });
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loadedPost, setLoadedPost] = useState<BlogPost | null>(null);
  const [snapshot, setSnapshot] = useState(JSON.stringify(EMPTY_FORM));
  const [slugTouched, setSlugTouched] = useState(false);
  const [lastUpdatedTouched, setLastUpdatedTouched] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const errorRef = useRef<HTMLDivElement>(null);

  // Load an existing post into the form once.
  useEffect(() => {
    if (postQuery.data && postQuery.data.id !== loadedPost?.id) {
      const next = formFromPost(postQuery.data);
      setLoadedPost(postQuery.data);
      setForm(next);
      setSnapshot(JSON.stringify(next));
      setSlugTouched(true);
      setLastUpdatedTouched(false);
      setEditorKey((k) => k + 1);
    }
  }, [postQuery.data, loadedPost?.id]);

  const dirty = JSON.stringify(form) !== snapshot;
  const wasLive = loadedPost ? isLive(loadedPost) : false;
  const wasEverPublished = Boolean(loadedPost && loadedPost.status !== "draft");

  // Warn before closing the tab with unsaved work.
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const onTitle = (title: string) =>
    setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }));

  const choosePreset = (presetId: string) => {
    const preset = CTA_PRESETS.find((p) => p.id === presetId);
    setForm((f) => ({
      ...f,
      ctaPreset: presetId,
      ctaLabel: preset ? preset.label : presetId === "custom" ? f.ctaLabel : "",
      ctaUrl: preset ? preset.url : presetId === "custom" ? f.ctaUrl : "",
    }));
  };

  const checklist = [
    { label: "Title", done: form.title.trim().length > 0 },
    { label: "Slug", done: isValidSlug(form.slug) },
    { label: "Excerpt", done: form.excerpt.trim().length > 0 },
    { label: "Featured image", done: Boolean(form.featured.url) },
    { label: "Image alt text", done: Boolean(form.featured.url && form.featured.alt.trim()) },
    { label: "Meta description", done: form.metaDescription.trim().length > 0 },
    { label: "Category", done: Boolean(form.categoryId) },
    { label: "Article content", done: hasContent(form.content) },
    { label: "Call to action", done: form.ctaPreset !== "none" && Boolean(form.ctaLabel.trim() && form.ctaUrl.trim()), optional: true },
    { label: "Sources", done: form.sources.some((s) => s.name.trim() && isHttpUrl(s.url)), optional: true },
  ];

  const validate = (status: BlogStatus, publishedAtIso: string | null): string[] => {
    const problems: string[] = [];
    if (!form.title.trim()) problems.push("Add a title.");
    if (!isValidSlug(form.slug.trim())) problems.push("The slug may only use lowercase letters, numbers and single hyphens (e.g. fll-airport-delivery).");
    if (status === "scheduled") {
      if (!publishedAtIso) problems.push("Choose the date and time this post should go live.");
      else if (new Date(publishedAtIso) <= new Date()) problems.push("A scheduled date must be in the future. To publish now, choose “Published”.");
    }
    if (form.ctaPreset !== "none") {
      if (!form.ctaLabel.trim() || !form.ctaUrl.trim()) problems.push("Give the call to action both a label and a link, or choose “No call to action”.");
      else if (!/^(\/|https:\/\/)/.test(form.ctaUrl.trim()) || !safeHref(form.ctaUrl.trim()))
        problems.push("The call-to-action link must be a page on this site (starting with /) or a full https:// address.");
    }
    if (form.canonicalUrl.trim() && !/^https:\/\/\S+$/.test(form.canonicalUrl.trim()))
      problems.push("The canonical URL must be a full https:// address (or leave it blank to use the default).");
    form.sources.forEach((s, i) => {
      const touched = s.name.trim() || s.url.trim() || s.publisher?.trim();
      if (!touched) return;
      if (!s.name.trim()) problems.push(`Source ${i + 1} needs a name.`);
      if (!isHttpUrl(s.url)) problems.push(`Source ${i + 1} needs a full URL starting with https://.`);
    });
    return problems;
  };

  const save = useCallback(
    async (targetStatus: BlogStatus) => {
      let publishedAtIso = fromLocalInput(form.publishedAt);
      let status = targetStatus;
      if (status === "published") {
        if (!publishedAtIso) publishedAtIso = new Date().toISOString();
        // A future date on "Published" means the editor really wants to schedule.
        if (new Date(publishedAtIso) > new Date()) status = "scheduled";
      }
      const problems = validate(status, publishedAtIso);
      if (!(await isSlugAvailable(form.slug.trim(), loadedPost?.id).catch(() => true))) {
        problems.push("Another post already uses this slug. Choose a different one.");
      }
      setErrors(problems);
      if (problems.length) {
        requestAnimationFrame(() => errorRef.current?.focus());
        return;
      }

      // "Last updated" moves automatically when a live article's words change,
      // unless the editor set it by hand.
      let lastUpdatedIso = fromLocalInput(form.lastUpdatedAt);
      const contentChanged =
        loadedPost &&
        (loadedPost.title !== form.title.trim() ||
          loadedPost.excerpt !== form.excerpt.trim() ||
          JSON.stringify(loadedPost.content) !== JSON.stringify(form.content));
      if (wasLive && status === "published" && contentChanged && !lastUpdatedTouched) {
        lastUpdatedIso = new Date().toISOString();
      }

      setSaving(true);
      try {
        const savedId = await adminSavePost(toInput(form, status, publishedAtIso, lastUpdatedIso), loadedPost?.id);
        const fresh = await adminGetPost(savedId);
        queryClient.invalidateQueries({ queryKey: ["admin", "blog"] });
        queryClient.invalidateQueries({ queryKey: ["blog"] });
        if (fresh) {
          const next = formFromPost(fresh);
          setLoadedPost(fresh);
          setForm(next);
          setSnapshot(JSON.stringify(next));
          setLastUpdatedTouched(false);
          // Once saved, the address stays put unless the editor changes it.
          setSlugTouched(true);
          queryClient.setQueryData(["admin", "blog", "post", savedId], fresh);
        }
        const live = fresh ? isLive(fresh) : false;
        toast({
          title:
            status === "draft"
              ? wasLive
                ? "Unpublished — saved as a draft"
                : "Draft saved"
              : status === "scheduled"
                ? "Post scheduled"
                : wasLive
                  ? "Published post updated"
                  : "Post published",
          description: live ? `Live at rentwithheldy.com${postPath(fresh!.slug)}` : undefined,
        });
        if (isNew) navigate(`/admin/blog/${savedId}`, { replace: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Something went wrong.";
        setErrors([message.includes("duplicate key") ? "Another post already uses this slug. Choose a different one." : message]);
        requestAnimationFrame(() => errorRef.current?.focus());
      } finally {
        setSaving(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, loadedPost, wasLive, lastUpdatedTouched, isNew],
  );

  // Ctrl/Cmd+S saves in the currently selected status.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (!saving) save(form.status);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save, saving, form.status]);

  if (!isNew && postQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminSectionHeader title="Blog" />
        <p className="container mx-auto px-4 py-10 text-muted-foreground">Loading post…</p>
      </div>
    );
  }
  if (!isNew && !postQuery.isLoading && !postQuery.data) {
    return (
      <div className="min-h-screen bg-background">
        <AdminSectionHeader title="Blog" />
        <div className="container mx-auto px-4 py-10">
          <p className="text-muted-foreground">{postQuery.error ? (postQuery.error as Error).message : "This post doesn't exist or was deleted."}</p>
          <Button asChild variant="outline" className="mt-4"><Link to="/admin/blog">Back to all posts</Link></Button>
        </div>
      </div>
    );
  }

  const primaryLabel =
    form.status === "draft"
      ? wasLive ? "Unpublish & save draft" : "Save draft"
      : form.status === "scheduled"
        ? wasLive ? "Update schedule" : "Schedule"
        : wasLive ? "Update" : "Publish";

  const meta = resolveArticleMeta({
    title: form.title || "Untitled post",
    slug: form.slug || "your-post",
    excerpt: form.excerpt,
    content: form.content,
    featured_image: form.featured.url,
    featured_image_alt: form.featured.alt,
    published_at: null,
    last_updated_at: null,
    seo_title: form.seoTitle,
    meta_description: form.metaDescription,
    canonical_url: form.canonicalUrl,
    social_title: form.socialTitle,
    social_description: form.socialDescription,
  });
  const slugChangedOnLive = wasLive && loadedPost && form.slug.trim() !== loadedPost.slug;

  return (
    <div className="min-h-screen bg-background">
      <SEO title={`${isNew ? "New post" : "Edit post"} · Rent With Heldy Admin`} description="Internal blog editor." path="/admin/blog" noIndex />
      <AdminSectionHeader title="Blog" />

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/blog"><ArrowLeft className="me-1.5 h-4 w-4" /> All posts</Link>
            </Button>
            <h2 className="text-2xl font-semibold">{isNew ? "New post" : "Edit post"}</h2>
            {loadedPost && <BlogStatusBadge status={effectiveStatus(loadedPost)} />}
          </div>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {saving ? "Saving…" : dirty ? "Unsaved changes" : loadedPost ? "All changes saved" : ""}
          </p>
        </div>

        {errors.length > 0 && (
          <div ref={errorRef} tabIndex={-1} role="alert" className="mb-6 rounded-card border border-destructive/40 bg-destructive/5 p-4 focus:outline-none">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-destructive">Please fix the following before saving:</p>
                <ul className="mt-2 list-disc space-y-1 ps-5 text-sm">
                  {errors.map((e) => <li key={e}>{e}</li>)}
                </ul>
              </div>
              <button type="button" aria-label="Dismiss" onClick={() => setErrors([])} className="rounded p-1 hover:bg-destructive/10"><X className="h-4 w-4" /></button>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          {/* ================= Main column ================= */}
          <div className="order-2 min-w-0 space-y-6 lg:order-1">
            <Card className="space-y-5 p-5 sm:p-6">
              <div className="space-y-1.5">
                <Label htmlFor="post-title">Title</Label>
                <Input id="post-title" value={form.title} onChange={(e) => onTitle(e.target.value)} placeholder="e.g. Can You Have a Rental Car Delivered to Fort Lauderdale Airport?" className="h-12 text-lg font-semibold" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="post-slug">Slug (web address)</Label>
                <div className="flex items-stretch overflow-hidden rounded-control border border-input focus-within:ring-2 focus-within:ring-ring">
                  <span className="hidden items-center bg-muted px-3 text-sm text-muted-foreground sm:flex">rentwithheldy.com/blog/</span>
                  <input
                    id="post-slug"
                    value={form.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"));
                    }}
                    onBlur={() => set("slug", slugify(form.slug))}
                    className="h-10 min-w-0 flex-1 bg-background px-3 font-mono text-sm focus:outline-none"
                    aria-describedby="post-slug-help"
                  />
                  {slugTouched && !wasEverPublished && (
                    <button type="button" className="border-s border-input px-3 text-xs font-medium text-muted-foreground hover:text-foreground" onClick={() => { setSlugTouched(false); set("slug", slugify(form.title)); }}>
                      From title
                    </button>
                  )}
                </div>
                <p id="post-slug-help" className="text-xs text-muted-foreground">
                  {slugChangedOnLive
                    ? `This post is live. After you update, the old address (/blog/${loadedPost!.slug}) will permanently redirect to the new one.`
                    : "Created from the title automatically. Lowercase letters, numbers and hyphens only."}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="post-excerpt">Excerpt</Label>
                <Textarea id="post-excerpt" rows={3} maxLength={600} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} placeholder="One or two sentences that sum up the article. Shown on blog cards and under the headline." />
                <p className="text-xs text-muted-foreground">{form.excerpt.trim().length} characters · 1–2 sentences works best.</p>
              </div>
              <div className="space-y-1.5">
                <p id="post-content-label" className="text-sm font-medium leading-none">Article content</p>
                <RichTextEditor key={editorKey} value={form.content} onChange={(doc) => set("content", doc)} labelledBy="post-content-label" />
              </div>
            </Card>

            <Card className="space-y-4 p-5 sm:p-6">
              <div>
                <h3 className={sectionTitle}>Sources</h3>
                <p className="text-sm text-muted-foreground">Shown in a “Sources” list at the end of the article. Links open safely in a new tab.</p>
              </div>
              <SourcesField sources={form.sources} onChange={(s) => set("sources", s)} />
            </Card>

            <Card className="space-y-4 p-5 sm:p-6">
              <div>
                <h3 className={sectionTitle}>Call to action</h3>
                <p className="text-sm text-muted-foreground">An optional button panel after the article. Presets are translated for visitors in every language.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cta-preset">Button</Label>
                <Select value={form.ctaPreset} onValueChange={choosePreset}>
                  <SelectTrigger id="cta-preset"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No call to action</SelectItem>
                    {CTA_PRESETS.map((p) => <SelectItem key={p.id} value={p.id}>{p.label} → {p.url}</SelectItem>)}
                    <SelectItem value="custom">Custom…</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.ctaPreset !== "none" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="cta-label">CTA label</Label>
                    <Input id="cta-label" maxLength={80} value={form.ctaLabel} onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value, ctaPreset: "custom" }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cta-url">CTA URL</Label>
                    <Input id="cta-url" value={form.ctaUrl} placeholder="/book" onChange={(e) => setForm((f) => ({ ...f, ctaUrl: e.target.value, ctaPreset: "custom" }))} />
                  </div>
                </div>
              )}
            </Card>

            <Card className="space-y-5 p-5 sm:p-6">
              <div>
                <h3 className={sectionTitle}>SEO</h3>
                <p className="text-sm text-muted-foreground">Leave any field blank to use a sensible default from the article.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="seo-title">SEO title</Label>
                <Input id="seo-title" value={form.seoTitle} placeholder={`${form.title || "Article title"} | Rent With Heldy`} onChange={(e) => set("seoTitle", e.target.value)} aria-describedby="seo-title-guide" />
                <CharacterGuide id="seo-title-guide" length={meta.title.length} {...SEO_TITLE_GUIDE} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="meta-description">Meta description</Label>
                <Textarea id="meta-description" rows={3} value={form.metaDescription} placeholder="A one- or two-sentence summary for search results. Uses the excerpt if blank." onChange={(e) => set("metaDescription", e.target.value)} aria-describedby="meta-description-guide" />
                <CharacterGuide id="meta-description-guide" length={form.metaDescription.trim().length} {...META_DESCRIPTION_GUIDE} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="primary-keyword">Primary keyword</Label>
                  <Input id="primary-keyword" value={form.primaryKeyword} placeholder="e.g. fort lauderdale airport car delivery" onChange={(e) => set("primaryKeyword", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="canonical-url">Canonical URL</Label>
                  <Input id="canonical-url" value={form.canonicalUrl} placeholder={defaultCanonical(form.slug || "your-post")} onChange={(e) => set("canonicalUrl", e.target.value)} />
                  <p className="text-xs text-muted-foreground">Blank = this article's own address.</p>
                </div>
              </div>
              <details className="rounded-control border border-border p-4">
                <summary className="cursor-pointer text-sm font-medium">Social sharing (optional)</summary>
                <div className="mt-4 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="social-title">Social title</Label>
                    <Input id="social-title" value={form.socialTitle} placeholder={form.seoTitle || form.title} onChange={(e) => set("socialTitle", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="social-description">Social description</Label>
                    <Textarea id="social-description" rows={2} value={form.socialDescription} placeholder={meta.description} onChange={(e) => set("socialDescription", e.target.value)} />
                  </div>
                  <p className="text-xs text-muted-foreground">The featured image is used as the share image.</p>
                </div>
              </details>
              <div className="rounded-control bg-muted/60 p-4" aria-label="Search result preview">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Search preview</p>
                <p className="mt-2 truncate text-sm text-emerald-800">{meta.canonical.replace("https://", "")}</p>
                <p className="line-clamp-1 text-lg text-[#1a0dab]">{meta.title}</p>
                <p className="line-clamp-2 text-sm text-muted-foreground">{meta.description || "Add an excerpt or meta description."}</p>
              </div>
            </Card>
          </div>

          {/* ================= Sidebar ================= */}
          <aside className="order-1 space-y-6 lg:sticky lg:top-4 lg:order-2">
            <Card className="space-y-4 p-5">
              <h3 className={sectionTitle}>Publishing</h3>
              <div className="space-y-1.5">
                <Label htmlFor="post-status">Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v as BlogStatus)}>
                  <SelectTrigger id="post-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft — only admins can see it</SelectItem>
                    <SelectItem value="scheduled">Scheduled — goes live at the publish date</SelectItem>
                    <SelectItem value="published">Published — live on the site</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.status !== "draft" && (
                <div className="space-y-1.5">
                  <Label htmlFor="publish-date">Publish date</Label>
                  <Input id="publish-date" type="datetime-local" value={form.publishedAt} onChange={(e) => set("publishedAt", e.target.value)} />
                  <p className="text-xs text-muted-foreground">
                    {form.status === "scheduled" ? "The post goes live automatically at this time (your time zone)." : "Leave blank to use the moment you publish."}
                  </p>
                </div>
              )}
              {wasEverPublished && (
                <div className="space-y-1.5">
                  <Label htmlFor="last-updated">Last updated date</Label>
                  <div className="flex gap-2">
                    <Input id="last-updated" type="datetime-local" value={form.lastUpdatedAt} onChange={(e) => { setLastUpdatedTouched(true); set("lastUpdatedAt", e.target.value); }} />
                    <Button type="button" variant="outline" size="sm" className="h-10 shrink-0" onClick={() => { setLastUpdatedTouched(true); set("lastUpdatedAt", toLocalInput(new Date().toISOString())); }}>
                      Now
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Shown to readers as “Updated”. Set automatically when you change a live article's text.</p>
                </div>
              )}
              <div className="flex flex-col gap-2 pt-1">
                <Button type="button" size="lg" onClick={() => save(form.status)} disabled={saving}>
                  {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                  {primaryLabel}
                </Button>
                {form.status === "draft" && !saving && (
                  <Button type="button" variant="outline" onClick={() => { set("status", "published"); save("published"); }}>
                    Publish now
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={() => setPreviewOpen(true)}>
                  <Eye className="me-2 h-4 w-4" /> Preview
                </Button>
                {wasLive && form.status !== "draft" && (
                  <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" disabled={saving} onClick={() => { set("status", "draft"); save("draft"); }}>
                    <Undo2 className="me-2 h-4 w-4" /> Unpublish
                  </Button>
                )}
                {loadedPost && wasLive && (
                  <a href={postPath(loadedPost.slug)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline">
                    View live article <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                {loadedPost && !wasLive && (
                  <Link to={`/admin/blog/${loadedPost.id}/preview`} target="_blank" className="text-center text-sm font-medium text-primary hover:underline">
                    Open saved preview in a new tab
                  </Link>
                )}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className={`${sectionTitle} mb-2`}>Publishing checklist</h3>
              <PublishingChecklist items={checklist} />
            </Card>

            <Card className="space-y-4 p-5">
              <h3 className={sectionTitle}>Organize</h3>
              <div className="space-y-1.5">
                <Label htmlFor="post-category">Category</Label>
                <Select value={form.categoryId || "none"} onValueChange={(v) => set("categoryId", v === "none" ? "" : v)}>
                  <SelectTrigger id="post-category"><SelectValue placeholder="Choose a category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="post-tags">Tags</Label>
                <TagInput tags={form.tags} onChange={(t) => set("tags", t)} suggestions={tagsQuery.data ?? []} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="post-author">Author</Label>
                <Input id="post-author" value={form.author} maxLength={120} onChange={(e) => set("author", e.target.value)} />
              </div>
            </Card>

            <Card className="space-y-3 p-5">
              <h3 className={sectionTitle}>Featured image</h3>
              <FeaturedImageField value={form.featured} onChange={(v) => set("featured", v)} />
            </Card>
          </aside>
        </div>
      </main>

      {/* Live preview of UNSAVED changes, rendered with the public template. */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="flex h-[100dvh] max-h-none w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:rounded-none">
          <div className="flex items-center justify-between gap-3 border-b border-amber-300 bg-amber-50 px-4 py-2.5 text-amber-950">
            <DialogTitle className="text-sm font-semibold">Preview — this is how the article will look. Unsaved changes are included.</DialogTitle>
          </div>
          <div className="flex-1 overflow-y-auto bg-background">
            <ArticleView post={previewPost(form, categories, loadedPost?.id)} preview />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
