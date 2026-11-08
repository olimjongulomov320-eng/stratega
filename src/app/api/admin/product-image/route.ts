import { revalidateStorefront } from "@/lib/storefront-cache";
import { getAdminSession } from "@/lib/admin-auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { saveProductImage } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * Bulk photo upload: the file name (without extension) is the product SKU,
 * e.g. "XS-1218.jpg". A suffix after "__" adds an extra photo:
 * "XS-1218__2.jpg". mode=main replaces the main photo, mode=extra always adds.
 */
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session || !can(session.role, "products.write")) {
    return Response.json({ error: "Ruxsat yo'q." }, { status: 401 });
  }
  const form = await req.formData();
  const file = form.get("file");
  const mode = form.get("mode") === "extra" ? "extra" : "main";
  if (!(file instanceof File)) return Response.json({ error: "Fayl topilmadi." }, { status: 400 });

  const stem = file.name.replace(/\.[^.]+$/, "").trim();
  const [skuPart, suffix] = stem.split("__");
  const key = skuPart.trim();
  // File names cannot contain "/", so "BS-0.17_8-50.jpg" also matches SKU "BS-0.17/8-50".
  const product =
    (await prisma.product.findFirst({ where: { sku: { equals: key, mode: "insensitive" } } })) ??
    (await prisma.product.findFirst({ where: { sku: { equals: key.replace(/_/g, "/"), mode: "insensitive" } } })) ??
    (await prisma.product.findFirst({ where: { slug: key.toLowerCase() } }));
  if (!product) return Response.json({ error: `"${key}" SKU bilan mahsulot topilmadi.` }, { status: 404 });

  try {
    const url = await saveProductImage(file, product.sku ?? product.slug);
    const asExtra = mode === "extra" || Boolean(suffix);
    // An extra photo goes to the gallery; if the product has no main photo yet, it becomes the main one.
    const data = asExtra && product.imageUrl ? { images: [...product.images, url] } : { imageUrl: url };
    await prisma.product.update({ where: { id: product.id }, data });
    revalidateStorefront();
    await prisma.auditLog.create({
      data: { action: asExtra ? "Qo'shimcha rasm yuklandi" : "Asosiy rasm yuklandi", actor: session.name, actorId: session.employeeId, entityType: "Product", entityId: product.id, details: { file: file.name, url } },
    });
    return Response.json({ ok: true, product: product.name, sku: product.sku, url, as: asExtra ? "extra" : "main" });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 400 });
  }
}
