"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { testConnection } from "@/lib/moysklad/client";
import { runMoySkladSync, type SyncResult } from "@/lib/moysklad/sync";

const PROVIDER = "moysklad";

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized");
  }
}

export type SettingsResult = { ok: true } | { ok: false; error: string };

export async function saveMoySkladSettings(
  apiToken: string,
  priceTypeName: string
): Promise<SettingsResult> {
  await requireAdmin();

  const trimmedToken = apiToken.trim();
  if (!trimmedToken) {
    return { ok: false, error: "API tokenni kiriting." };
  }

  await prisma.integrationSettings.upsert({
    where: { provider: PROVIDER },
    create: {
      provider: PROVIDER,
      apiToken: trimmedToken,
      priceTypeName: priceTypeName.trim() || null,
      isEnabled: true,
    },
    update: {
      apiToken: trimmedToken,
      priceTypeName: priceTypeName.trim() || null,
      isEnabled: true,
    },
  });

  revalidatePath("/admin/settings/moysklad");
  return { ok: true };
}

export async function testMoySkladConnection(): Promise<SettingsResult> {
  await requireAdmin();

  const settings = await prisma.integrationSettings.findUnique({
    where: { provider: PROVIDER },
  });

  if (!settings?.apiToken) {
    return { ok: false, error: "Avval API tokenni saqlang." };
  }

  const result = await testConnection(settings.apiToken);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true };
}

export async function syncMoySkladNow(): Promise<SyncResult> {
  await requireAdmin();
  const result = await runMoySkladSync();
  revalidatePath("/admin/settings/moysklad");
  return result;
}
