import { put } from "@vercel/blob";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "Fayl topilmadi." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return Response.json(
      { error: "Faqat rasm fayllari qabul qilinadi." },
      { status: 400 }
    );
  }

  if (file.size > 8 * 1024 * 1024) {
    return Response.json(
      { error: "Fayl hajmi 8MB dan oshmasligi kerak." },
      { status: 400 }
    );
  }

  const ext = file.name.split(".").pop() || "png";
  const key = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const blob = await put(key, file, {
    access: "public",
    addRandomSuffix: false,
  });

  return Response.json({ url: blob.url });
}
