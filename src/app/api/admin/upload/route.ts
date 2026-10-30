import { getAdminSession } from "@/lib/admin-auth";
import { can } from "@/lib/permissions";
import { saveProductImage } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session || !can(session.role, "products.write")) {
    return Response.json({ error: "Ruxsat yo'q." }, { status: 401 });
  }
  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Fayl topilmadi." }, { status: 400 });
  try {
    return Response.json({ url: await saveProductImage(file) });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 400 });
  }
}
