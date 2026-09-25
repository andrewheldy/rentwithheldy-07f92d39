import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Pencil } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { ArticleView } from "@/components/blog/ArticleView";
import { BlogStatusBadge } from "@/components/admin/blog/BlogStatusBadge";
import { Button } from "@/components/ui/button";
import { adminGetPost } from "@/lib/blog/api";
import { effectiveStatus } from "@/lib/blog/status";

/* /admin/blog/:id/preview — the SAVED version of any post (including drafts
   and scheduled posts) inside the real site chrome. Admin-only route
   (ProtectedRoute), noindex meta + X-Robots-Tag header (vercel.json). */

export default function AdminBlogPreview() {
  const { id = "" } = useParams();
  const { data: post, isLoading, error } = useQuery({ queryKey: ["admin", "blog", "post", id], queryFn: () => adminGetPost(id) });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO title="Preview · Rent With Heldy Admin" description="Blog post preview." path={`/admin/blog/${id}/preview`} noIndex />
      <div className="border-b border-amber-300 bg-amber-50 text-amber-950">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-semibold">Preview</span>
            {post && <BlogStatusBadge status={effectiveStatus(post)} />}
            <span className="hidden text-amber-900/80 sm:inline">Only admins can see this page.</span>
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm" variant="ghost"><Link to="/admin/blog"><ArrowLeft className="me-1.5 h-4 w-4" /> All posts</Link></Button>
            {post && <Button asChild size="sm" variant="outline" className="bg-white"><Link to={`/admin/blog/${post.id}`}><Pencil className="me-1.5 h-4 w-4" /> Edit</Link></Button>}
          </div>
        </div>
      </div>
      <Header />
      <main className="flex-1">
        {isLoading ? (
          <p className="container mx-auto px-4 py-16 text-muted-foreground">Loading preview…</p>
        ) : error || !post ? (
          <p className="container mx-auto px-4 py-16 text-muted-foreground">{error ? (error as Error).message : "This post doesn't exist or was deleted."}</p>
        ) : (
          <ArticleView post={post} preview />
        )}
      </main>
      <Footer />
    </div>
  );
}
