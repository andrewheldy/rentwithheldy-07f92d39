import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Pencil, Plus, Trash2, UserPen, X } from "lucide-react";
import SEO from "@/components/SEO";
import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { toast } from "@/hooks/use-toast";
import { adminDeleteAuthor, adminListAuthors, adminSaveAuthor } from "@/lib/blog/api";
import { safeImageSrc } from "@/lib/blog/content";
import { ACCEPTED_IMAGE_TYPES, uploadBlogImage } from "@/lib/blog/images";
import { slugify } from "@/lib/blog/slug";
import type { BlogAuthor } from "@/lib/blog/types";

/* Author profiles for the author card shown under each article. */

const BIO_MAX = 600;

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? `${words[0][0]}${words[words.length - 1][0]}` : (words[0] ?? "").slice(0, 2)).toUpperCase();
}

function AuthorPhoto({ author, size = "h-14 w-14" }: { author: Pick<BlogAuthor, "name" | "photo_url">; size?: string }) {
  const photo = safeImageSrc(author.photo_url);
  return photo ? (
    <img src={photo} alt="" className={`${size} shrink-0 rounded-full bg-secondary object-cover`} />
  ) : (
    <span aria-hidden className={`${size} flex shrink-0 items-center justify-center rounded-full bg-ink font-heading font-bold text-white`}>
      {initials(author.name) || "?"}
    </span>
  );
}

/** A slug no other author uses: the name's, with -2, -3… when taken. */
function uniqueSlug(name: string, authors: BlogAuthor[], selfId?: string): string {
  const taken = new Set(authors.filter((a) => a.id !== selfId).map((a) => a.slug));
  const base = slugify(name, 70) || "author";
  let slug = base;
  for (let n = 2; taken.has(slug); n += 1) slug = `${base}-${n}`;
  return slug;
}

function AuthorDialog({
  open,
  onOpenChange,
  author,
  authors,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  author: BlogAuthor | null;
  authors: BlogAuthor[];
}) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(author?.name ?? "");
    setRole(author?.role ?? "");
    setBio(author?.bio ?? "");
    setPhoto(author?.photo_url ?? null);
    setError("");
  }, [open, author]);

  const save = useMutation({
    mutationFn: () =>
      adminSaveAuthor(
        {
          name: name.trim(),
          slug: author?.slug ?? uniqueSlug(name, authors),
          role: role.trim() || null,
          bio: bio.trim() || null,
          photo_url: photo,
        },
        author?.id,
      ),
    onSuccess: (saved) => {
      toast({ title: author ? "Author updated" : "Author added", description: saved.name });
      queryClient.invalidateQueries({ queryKey: ["admin", "blog"] });
      queryClient.invalidateQueries({ queryKey: ["blog"] });
      onOpenChange(false);
    },
    onError: (err: Error) => setError(err.message),
  });

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      setPhoto((await uploadBlogImage(file)).url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = () => {
    if (!name.trim()) {
      setError("Add the author's name.");
      return;
    }
    save.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{author ? "Edit author" : "Add an author"}</DialogTitle>
          <DialogDescription>Shown in the author card under their articles.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <div className="flex items-center gap-4">
            <AuthorPhoto author={{ name: name || "?", photo_url: photo }} size="h-16 w-16" />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="me-1.5 h-4 w-4 animate-spin" /> : <ImagePlus className="me-1.5 h-4 w-4" />}
                {photo ? "Replace photo" : "Upload photo"}
              </Button>
              {photo && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setPhoto(null)}>
                  <X className="me-1.5 h-4 w-4" /> Remove photo
                </Button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES}
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(event) => upload(event.target.files?.[0])}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="author-name">Name</Label>
            <Input id="author-name" value={name} maxLength={120} onChange={(event) => setName(event.target.value)} />
            {author && <p className="text-xs text-muted-foreground">Renaming updates the byline on this author's posts.</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="author-role">Role (optional)</Label>
            <Input id="author-role" value={role} maxLength={120} placeholder="e.g. Founder, Rent With Heldy" onChange={(event) => setRole(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="author-bio">Short bio (optional)</Label>
            <Textarea id="author-bio" rows={4} value={bio} maxLength={BIO_MAX} onChange={(event) => setBio(event.target.value)} aria-describedby="author-bio-count" />
            <p id="author-bio-count" className="text-xs text-muted-foreground">
              {bio.trim().length} of {BIO_MAX} characters · written in English, like the articles.
            </p>
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={save.isPending || uploading}>
              {save.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {author ? "Save author" : "Add author"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminBlogAuthors() {
  const queryClient = useQueryClient();
  const authorsQuery = useQuery({ queryKey: ["admin", "blog", "authors"], queryFn: adminListAuthors });
  const authors = authorsQuery.data ?? [];
  const [editing, setEditing] = useState<BlogAuthor | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<BlogAuthor | null>(null);

  const remove = useMutation({
    mutationFn: (author: BlogAuthor) => adminDeleteAuthor(author.id),
    onSuccess: (_, author) => {
      toast({ title: "Author deleted", description: author.name });
      setPendingDelete(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "blog"] });
      queryClient.invalidateQueries({ queryKey: ["blog"] });
    },
    onError: (error: Error) => toast({ title: "Could not delete the author", description: error.message, variant: "destructive" }),
  });

  const openDialog = (author: BlogAuthor | null) => {
    setEditing(author);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Authors · Rent With Heldy Admin" description="Blog author profiles." path="/admin/blog/authors" noIndex />
      <AdminSectionHeader
        title="Authors"
        actions={
          <Button onClick={() => openDialog(null)}>
            <Plus className="me-1.5 h-4 w-4" /> Add author
          </Button>
        }
      />
      <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <p className="max-w-2xl text-muted-foreground">
          Choose an author in the post editor to show their card — photo, role and short bio — under the article. Posts without a profile show the byline only.
        </p>

        {authorsQuery.isLoading ? (
          <p className="text-muted-foreground">Loading authors…</p>
        ) : authorsQuery.error ? (
          <p role="alert" className="text-destructive">
            {(authorsQuery.error as Error).message}
          </p>
        ) : authors.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 p-10 text-center">
            <UserPen className="h-8 w-8 text-muted-foreground" aria-hidden />
            <h2 className="text-lg font-semibold">No authors yet</h2>
            <p className="max-w-md text-sm text-muted-foreground">Add the people who write for the blog.</p>
            <Button onClick={() => openDialog(null)}>
              <Plus className="me-1.5 h-4 w-4" /> Add author
            </Button>
          </Card>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {authors.map((author) => (
              <li key={author.id}>
                <Card className="flex h-full flex-col gap-4 p-5">
                  <div className="flex min-w-0 items-start gap-4">
                    <AuthorPhoto author={author} />
                    <div className="min-w-0">
                      <h2 className="break-words text-lg font-semibold">{author.name}</h2>
                      {author.role && <p className="text-sm text-muted-foreground">{author.role}</p>}
                      {author.bio ? (
                        <p className="mt-2 line-clamp-3 text-sm">{author.bio}</p>
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground">No bio yet — the author card appears once there's a role, bio or photo.</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-auto flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => openDialog(author)} aria-label={`Edit ${author.name}`}>
                      <Pencil className="me-1.5 h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setPendingDelete(author)} aria-label={`Delete ${author.name}`}>
                      <Trash2 className="me-1.5 h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </main>

      <AuthorDialog open={dialogOpen} onOpenChange={setDialogOpen} author={editing} authors={authors} />

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>Their posts keep the byline, but the author card is removed. This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                if (pendingDelete) remove.mutate(pendingDelete);
              }}
            >
              Delete author
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
