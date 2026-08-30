import { put } from "@vercel/blob";
import { downloadImageBytes, type MoySkladAssortmentItem } from "./client";

export async function syncProductImage(
  token: string,
  item: MoySkladAssortmentItem
): Promise<string | null> {
  const firstImage = item.images?.rows?.[0];
  if (!firstImage) return null;

  const bytes = await downloadImageBytes(token, firstImage.meta.downloadHref);
  const blob = await put(`products/moysklad-${item.id}.jpg`, bytes, {
    access: "public",
    addRandomSuffix: false,
    contentType: "image/jpeg",
  });
  return blob.url;
}
