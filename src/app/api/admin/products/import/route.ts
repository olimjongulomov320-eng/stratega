import { applyStockImport, previewStockImport } from "@/lib/stock-import";
import { requireAdminPermission } from "@/lib/require-permission";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

async function readCsvFile(req: Request): Promise<
  { ok: true; text: string } | { ok: false; response: Response }
> {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return {
      ok: false,
      response: Response.json({ error: "Fayl topilmadi." }, { status: 400 }),
    };
  }

  if (file.size > MAX_SIZE) {
    return {
      ok: false,
      response: Response.json(
        { error: "Fayl hajmi 2MB dan oshmasligi kerak." },
        { status: 400 }
      ),
    };
  }

  return { ok: true, text: await file.text() };
}

// IMPORT 1-QADAM: faylni tahlil qilish (preview=true) — hech narsa
// o'zgartirilmaydi, faqat rejalashtirilgan o'zgarishlar qaytariladi.
// IMPORT 2-QADAM: preview yuborilganda — tasdiqlangan holda amalga oshiriladi.
export async function POST(req: Request) {
  try {
    await requireAdminPermission("products.write");
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fileResult = await readCsvFile(req);
  if (!fileResult.ok) return fileResult.response;

  const formData = await req.formData();
  const previewRaw = formData.get("preview");

  if (previewRaw === "true" || previewRaw === "1") {
    const preview = await previewStockImport(fileResult.text);
    if (preview.error) {
      return Response.json({ error: preview.error }, { status: 400 });
    }
    return Response.json({ preview });
  }

  const result = await applyStockImport(fileResult.text);

  if (result.error) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  revalidatePath("/admin/products");
  revalidatePath("/");

  return Response.json({ updated: result.updated, skipped: result.skipped });
}
