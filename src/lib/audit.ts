import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type TxClient = Prisma.TransactionClient;

export type AuditParams = {
  actorId?: string | null;
  actorLabel?: string | null; // masalan, "admin" (umumiy parol orqali kirilganda)
  action: string; // "product.update", "stock.adjust", ...
  entity: string;
  entityId: string;
  oldData?: unknown;
  newData?: unknown;
};

// Muhim admin harakatlarini AuditLog jadvaliga yozadi. tx berilsa — shu
// tranzaksiya ichida, aks holda alohida yozuv sifatida.
export async function writeAuditLog(
  params: AuditParams,
  tx?: TxClient
): Promise<void> {
  const client = tx ?? prisma;
  await client.auditLog.create({
    data: {
      actorId: params.actorId ?? null,
      actorLabel: params.actorLabel ?? null,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      oldData: params.oldData === undefined ? undefined : (params.oldData as Prisma.InputJsonValue),
      newData: params.newData === undefined ? undefined : (params.newData as Prisma.InputJsonValue),
    },
  });
}
