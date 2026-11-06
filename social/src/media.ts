// Media resolution. Owned photos and videos live in public/social-media/ so
// the deployed site serves them at https://rentwithheldy.com/social-media/…;
// every platform API pulls media from a public HTTPS URL. External HTTPS
// URLs are also accepted (for videos too large to keep in Git).

import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export const MEDIA_DIR = "public/social-media";

export type MediaKind = "image" | "video";

export interface MediaItem {
  /** As written in the post file. */
  source: string;
  kind: MediaKind;
  mime: string;
  publicUrl: string;
  /** Absolute path for repo files; null for external URLs. */
  localPath: string | null;
  bytes: number | null;
  width: number | null;
  height: number | null;
}

const EXTENSIONS: Record<string, { kind: MediaKind; mime: string }> = {
  ".jpg": { kind: "image", mime: "image/jpeg" },
  ".jpeg": { kind: "image", mime: "image/jpeg" },
  ".png": { kind: "image", mime: "image/png" },
  ".webp": { kind: "image", mime: "image/webp" },
  ".mp4": { kind: "video", mime: "video/mp4" },
  ".mov": { kind: "video", mime: "video/quicktime" },
};

export function mediaTypeFor(source: string) {
  const pathname = source.startsWith("https://") ? new URL(source).pathname : source;
  return EXTENSIONS[path.extname(pathname).toLowerCase()] ?? null;
}

/** Reads width/height from a JPEG or PNG header without decoding the image. */
export function imageDimensions(buffer: Uint8Array): { width: number; height: number } | null {
  const view = Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  // PNG: 8-byte signature, then the IHDR chunk with width/height.
  if (view.length >= 24 && view.readUInt32BE(0) === 0x89504e47) {
    return { width: view.readUInt32BE(16), height: view.readUInt32BE(20) };
  }
  // JPEG: walk segments until a start-of-frame marker.
  if (view.length >= 4 && view[0] === 0xff && view[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < view.length) {
      if (view[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = view[offset + 1];
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2;
        continue;
      }
      const length = view.readUInt16BE(offset + 2);
      const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isSof) return { height: view.readUInt16BE(offset + 5), width: view.readUInt16BE(offset + 7) };
      offset += 2 + length;
    }
  }
  return null;
}

export class MediaError extends Error {}

export function resolveMedia(source: string, repoRoot: string, mediaBaseUrl: string): MediaItem {
  const type = mediaTypeFor(source);
  if (!type) {
    throw new MediaError(`media "${source}": unsupported file type (use .jpg, .png, .webp, .mp4 or .mov)`);
  }

  if (/^https?:\/\//i.test(source)) {
    if (!source.startsWith("https://")) throw new MediaError(`media "${source}": external media must use https://`);
    return { source, ...type, publicUrl: source, localPath: null, bytes: null, width: null, height: null };
  }

  const normalized = path.posix.normalize(source.replace(/\\/g, "/"));
  if (!normalized.startsWith(`${MEDIA_DIR}/`) || normalized.includes("..")) {
    throw new MediaError(`media "${source}": repo media must live in ${MEDIA_DIR}/`);
  }
  const localPath = path.join(repoRoot, normalized);
  if (!existsSync(localPath)) throw new MediaError(`media "${source}": file not found`);

  const bytes = statSync(localPath).size;
  let dimensions: { width: number; height: number } | null = null;
  if (type.kind === "image") {
    // The first 256 KB always contains the JPEG/PNG frame header in practice.
    const head = readFileSync(localPath).subarray(0, 256 * 1024);
    dimensions = imageDimensions(head);
  }
  const relative = normalized.slice(`${MEDIA_DIR}/`.length);
  const publicUrl = `${mediaBaseUrl}/social-media/${relative.split("/").map(encodeURIComponent).join("/")}`;
  return {
    source,
    ...type,
    publicUrl,
    localPath,
    bytes,
    width: dimensions?.width ?? null,
    height: dimensions?.height ?? null,
  };
}
