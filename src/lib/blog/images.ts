import { supabase } from "@/integrations/supabase/client";
import { slugify } from "./slug";

// Uploads article images to the public `blog-images` Supabase Storage bucket
// (same storage the fleet photos use). Large photos are resized in the
// browser before upload so readers never download a 6 MB phone photo.

export const BLOG_IMAGE_BUCKET = "blog-images";
const MAX_WIDTH = 2000;
const JPEG_QUALITY = 0.84;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
export const ACCEPTED_IMAGE_TYPES = ACCEPTED.join(",");

export interface UploadedImage {
  url: string;
  width: number | null;
  height: number | null;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file could not be read as an image."));
    };
    img.src = url;
  });
}

/**
 * Resize to at most MAX_WIDTH wide and re-encode as JPEG (universally
 * supported for social previews). GIFs are uploaded untouched to keep
 * animation.
 */
async function prepare(file: File): Promise<{ blob: Blob; ext: string; width: number | null; height: number | null }> {
  if (file.type === "image/gif") return { blob: file, ext: "gif", width: null, height: null };
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_WIDTH / img.naturalWidth);
  const width = Math.round(img.naturalWidth * scale);
  const height = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { blob: file, ext: file.name.split(".").pop() ?? "jpg", width, height };
  ctx.fillStyle = "#ffffff"; // flatten transparency for JPEG
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
  if (!blob) return { blob: file, ext: "jpg", width, height };
  return { blob, ext: "jpg", width, height };
}

export async function uploadBlogImage(file: File): Promise<UploadedImage> {
  if (!ACCEPTED.includes(file.type)) {
    throw new Error("Please choose a JPG, PNG, WebP, AVIF or GIF image.");
  }
  if (file.size > 25 * 1024 * 1024) {
    throw new Error("That image is larger than 25 MB. Please choose a smaller file.");
  }
  const { blob, ext, width, height } = await prepare(file);
  if (blob.size > 10 * 1024 * 1024) {
    throw new Error("That image is still larger than 10 MB after resizing. Please choose a smaller file.");
  }
  const now = new Date();
  const base = slugify(file.name.replace(/\.[^.]+$/, ""), 60) || "image";
  const path = `posts/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}-${base}.${ext}`;
  const { error } = await supabase.storage.from(BLOG_IMAGE_BUCKET).upload(path, blob, {
    contentType: ext === "gif" ? "image/gif" : "image/jpeg",
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(BLOG_IMAGE_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, width, height };
}
