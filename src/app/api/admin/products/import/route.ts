import { applyStockImport, previewStockImport } from "@/lib/stock-import";
import { requireAdminPermission } from "@/lib/require-permission";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

type ParsedUpload =
  | { ok: true; text: string; preview: boolean }
  | { ok: false; response: Response };

// Eslatma: Request body bir marta o'qiladi. `req.formData()` ni ikki marta
// chaqirish "Body already used" xatosiga olib keladi — shuning uchun
// forma bir marta o'qilib, ham fayl matni ham `preview` belgisi olinadi.
async function readUpload(req: Request): Promise<ParsedUpload> {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return {
      ok: false,
      response: Response.json({ error: "Faylni o'qib bo'lmadi." }, { status: 400 }),
    };
  }

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

  const previewRaw = formData.get("preview");
  return {
    ok: true,
    text: await file.text(),
    preview: previewRaw === "true" || previewRaw === "1",
  };
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

  const upload = await readUpload(req);
  if (!upload.ok) return upload.response;

  if (upload.preview) {
    const preview = await previewStockImport(upload.text);
    if (preview.error) {
      return Response.json({ error: preview.error }, { status: 400 });
    }
    return Response.json({ preview });
  }

  const result = await applyStockImport(upload.text);

  if (result.error) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin/stock");
  revalidatePath("/");

  return Response.json({ updated: result.updated, skipped: result.skipped });
}
