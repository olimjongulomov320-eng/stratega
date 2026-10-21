import { applyCustomersImport, previewCustomersImport } from "@/lib/customers-import";
import { requireAdminPermission } from "@/lib/require-permission";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

type ParsedUpload =
  | { ok: true; text: string; preview: boolean }
  | { ok: false; response: Response };

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

// 1-qadam: tahlil (preview) — hech narsa o'zgartirilmaydi.
// 2-qadam: tasdiq — rejalashtirilgan o'zgarishlar bajariladi.
export async function POST(req: Request) {
  try {
    await requireAdminPermission("customers.write");
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const upload = await readUpload(req);
  if (!upload.ok) return upload.response;

  if (upload.preview) {
    const preview = await previewCustomersImport(upload.text);
    if (preview.error) {
      return Response.json({ error: preview.error }, { status: 400 });
    }
    return Response.json({ preview });
  }

  const result = await applyCustomersImport(upload.text);
  if (result.error) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  revalidatePath("/admin/customers");

  return Response.json({
    created: result.created,
    updated: result.updated,
    skipped: result.skipped,
  });
}
