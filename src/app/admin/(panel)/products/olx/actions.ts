"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { requireAction, audit, safe, str, bool, type ActionState } from "@/lib/admin";
import { getOlxSettings, saveOlxSettings } from "@/lib/olx";

export async function saveOlx(_: ActionState, form: FormData): Promise<ActionState> {
  return safe(async () => {
    const session = await requireAction("products.write");
    const current = await getOlxSettings();
    await saveOlxSettings({
      lang: str(form, "lang") === "uz" ? "uz" : "ru",
      city: str(form, "city") || current.city,
      contactName: str(form, "contactName") || current.contactName,
      phone: str(form, "phone") || current.phone,
      onlyInStock: bool(form, "onlyInStock"),
      feedKey: bool(form, "newKey") ? randomBytes(16).toString("hex") : current.feedKey,
    });
    await audit(session, "OLX eksport sozlamalari saqlandi", "Setting");
    revalidatePath("/admin/products/olx");
    return { ok: true, message: "Saqlandi." };
  });
}
