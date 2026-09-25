import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Eye, MoreHorizontal, Newspaper, Pencil, Plus, Search, Send, Trash2, Undo2 } from "lucide-react";
import SEO from "@/components/SEO";
import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import { BlogStatusBadge } from "@/components/admin/blog/BlogStatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { adminDeletePost, adminListPosts, adminSetStatus, fetchCategories } from "@/lib/blog/api";
import { postPath } from "@/lib/blog/seo";
import { effectiveStatus, isLive } from "@/lib/blog/status";
import type { BlogPostSummary, BlogStatus } from "@/lib/blog/types";

type AdminRow = BlogPostSummary & { updated_at: string; created_at: string };

const fmt = (iso: string | null | undefined, withTime = false) =>
  iso
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        ...(withTime ? { timeStyle: "short" } : {}),
        timeZone: "America/New_York",
      }).format(new Date(iso))
    : "—";

export default function AdminBlog() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | BlogStatus>("all");
  const [category, setCategory] = useState("all");
  const [pendingDelete, setPendingDelete] = useState<AdminRow | null>(null);

  const postsQuery = useQuery({ queryKey: ["admin", "blog", "posts"], queryFn: adminListPosts });
  const categoriesQuery = useQuery({ queryKey: ["blog", "categories"], queryFn: fetchCategories });
  const posts = useMemo(() => (postsQuery.data ?? []) as AdminRow[], [postsQuery.data]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (status !== "all" && effectiveStatus(post) !== status) return false;
      if (category === "none" && post.category) return false;
      if (category !== "all" && category !== "none" && post.category?.id !== category) return false;
      if (!needle) return true;
      return [post.title, post.slug, post.author, post.excerpt].some((v) => v?.toLowerCase().includes(needle));
    });
  }, [posts, query, status, category]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "blog"] });
    queryClient.invalidateQueries({ queryKey: ["blog"] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ post, next }: { post: AdminRow; next: "publish" | "unpublish" }) => {
      if (next === "unpublish") return adminSetStatus(post.id, "draft", post.published_at);
      // Publishing keeps an original past publish date; otherwise it is now.
      const keepDate = post.published_at && new Date(post.published_at) <= new Date();
      return adminSetStatus(post.id, "published", keepDate ? post.published_at : new Date().toISOString());
    },
    onSuccess: (_, { post, next }) => {
      toast({ title: next === "publish" ? "Post published" : "Post unpublished", description: post.title });
      refresh();
    },
    onError: (error: Error) => toast({ title: "Could not update the post", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (post: AdminRow) => adminDeletePost(post.id),
    onSuccess: (_, post) => {
      toast({ title: "Post deleted", description: post.title });
      setPendingDelete(null);
      refresh();
    },
    onError: (error: Error) => toast({ title: "Could not delete the post", description: error.message, variant: "destructive" }),
  });

  const actions = (post: AdminRow) => {
    const live = isLive(post);
    return (
      <div className="flex items-center justify-end gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to={`/admin/blog/${post.id}`}>
            <Pencil className="me-1.5 h-3.5 w-3.5" /> Edit
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" aria-label={`More actions for ${post.title}`}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link to={`/admin/blog/${post.id}/preview`}>
                <Eye className="me-2 h-4 w-4" /> Preview
              </Link>
            </DropdownMenuItem>
            {live && (
              <DropdownMenuItem asChild>
                <a href={postPath(post.slug)} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="me-2 h-4 w-4" /> View live
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {post.status === "draft" || !live ? (
              <DropdownMenuItem onSelect={() => statusMutation.mutate({ post, next: "publish" })}>
                <Send className="me-2 h-4 w-4" /> Publish now
              </DropdownMenuItem>
            ) : null}
            {post.status !== "draft" && (
              <DropdownMenuItem onSelect={() => statusMutation.mutate({ post, next: "unpublish" })}>
                <Undo2 className="me-2 h-4 w-4" /> Unpublish
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setPendingDelete(post)}>
              <Trash2 className="me-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Blog · Rent With Heldy Admin" description="Internal blog management." path="/admin/blog" noIndex />
      <AdminSectionHeader title="Blog" />
      <main className="container mx-auto space-y-6 px-4 py-6 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Content</p>
            <h2 className="mt-1 text-3xl font-semibold">Blog posts</h2>
            <p className="mt-2 text-muted-foreground">Write, preview, schedule and publish articles for rentwithheldy.com/blog.</p>
          </div>
          <Button asChild size="lg">
            <Link to="/admin/blog/new">
              <Plus className="me-2 h-4 w-4" /> New Post
            </Link>
          </Button>
        </div>

        <Card className="p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="blog-search">Search</Label>
              <div className="relative">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input id="blog-search" className="ps-9" placeholder="Title, slug or author" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="blog-status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger id="blog-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="blog-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="blog-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {(categoriesQuery.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                  <SelectItem value="none">No category</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {postsQuery.isLoading ? (
          <Card className="p-10 text-center text-muted-foreground">Loading posts…</Card>
        ) : postsQuery.error ? (
          <Card className="border-destructive p-6 text-destructive">{(postsQuery.error as Error).message}</Card>
        ) : filtered.length === 0 ? (
          <Card className="p-10 text-center">
            <Newspaper className="mx-auto h-9 w-9 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">{posts.length ? "No posts match these filters" : "No blog posts yet"}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {posts.length ? "Adjust the search or filters above." : "Create your first post — it stays a private draft until you publish it."}
            </p>
          </Card>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-xl border bg-card lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Publish date</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-end">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="max-w-sm">
                        <Link to={`/admin/blog/${post.id}`} className="font-semibold hover:text-primary">{post.title}</Link>
                        <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">/blog/{post.slug}</p>
                      </TableCell>
                      <TableCell>{post.category?.name ?? "—"}</TableCell>
                      <TableCell><BlogStatusBadge status={effectiveStatus(post)} /></TableCell>
                      <TableCell>{post.author}</TableCell>
                      <TableCell className="whitespace-nowrap">{fmt(post.published_at, post.status === "scheduled")}</TableCell>
                      <TableCell className="whitespace-nowrap">{fmt(post.updated_at)}</TableCell>
                      <TableCell>{actions(post)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="grid gap-3 lg:hidden">
              {filtered.map((post) => (
                <Card key={post.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{post.title}</p>
                      <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">/blog/{post.slug}</p>
                    </div>
                    <BlogStatusBadge status={effectiveStatus(post)} />
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div><dt className="text-muted-foreground">Category</dt><dd className="font-medium">{post.category?.name ?? "—"}</dd></div>
                    <div><dt className="text-muted-foreground">Author</dt><dd className="font-medium">{post.author}</dd></div>
                    <div><dt className="text-muted-foreground">Publish date</dt><dd className="font-medium">{fmt(post.published_at)}</dd></div>
                    <div><dt className="text-muted-foreground">Updated</dt><dd className="font-medium">{fmt(post.updated_at)}</dd></div>
                  </dl>
                  <div className="mt-4">{actions(post)}</div>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              “{pendingDelete?.title}” will be permanently deleted, along with its sources and tags. This cannot be undone.
              {pendingDelete && isLive(pendingDelete) && " It is currently live — its URL will stop working."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                if (pendingDelete) deleteMutation.mutate(pendingDelete);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete post"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
