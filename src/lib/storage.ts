import "server-only";
import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

// SVG is deliberately not allowed: it can carry scripts.
export const IMAGE_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
};

export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/** Validates and stores a product image. Returns its public URL. */
export async function saveProductImage(file: File, baseName?: string): Promise<string> {
  const ext = IMAGE_TYPES[file.type];
  if (!ext) throw new Error("Faqat PNG, JPG, WEBP yoki AVIF rasmlar.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Fayl hajmi 8MB dan oshmasligi kerak.");
  const safeBase = (baseName ?? "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  const name = `${safeBase ? `${safeBase}-` : ""}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`products/${name}`, file, { access: "public", addRandomSuffix: false, contentType: file.type });
    return blob.url;
  }
  // No Vercel Blob: keep files on this server's disk (development, or a VPS with LOCAL_UPLOADS=1).
  // They are served by src/app/uploads/[...path]/route.ts.
  if (process.env.NODE_ENV !== "production" || process.env.LOCAL_UPLOADS === "1") {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
    return `/uploads/${name}`;
  }
  throw new Error("Rasm saqlash sozlanmagan: BLOB_READ_WRITE_TOKEN (Vercel) yoki LOCAL_UPLOADS=1 (o'z serveringiz) kerak.");
}
