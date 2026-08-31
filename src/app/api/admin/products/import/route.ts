import { isAdminAuthenticated } from "@/lib/admin-auth";
import { applyStockImport } from "@/lib/stock-import";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "Fayl topilmadi." }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return Response.json(
      { error: "Fayl hajmi 2MB dan oshmasligi kerak." },
      { status: 400 }
    );
  }

  const text = await file.text();
  const result = await applyStockImport(text);

  if (result.error) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  revalidatePath("/admin/products");
  revalidatePath("/");

  return Response.json({ updated: result.updated, skipped: result.skipped });
}
