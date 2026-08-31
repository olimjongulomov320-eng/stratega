"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getCurrentEmployee } from "@/lib/employee-auth";
import {
  createStockDocument,
  postStockDocument,
  cancelStockDocument,
  type CreateStockDocumentInput,
} from "@/lib/stock-documents";

export type DocActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin(): Promise<string | null> {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized");
  }
  const employee = await getCurrentEmployee();
  return employee?.id ?? null;
}

export async function createDocument(
  input: CreateStockDocumentInput
): Promise<DocActionResult> {
  const actorId = await requireAdmin();

  let documentId: string;
  try {
    const doc = await createStockDocument(input, actorId);
    documentId = doc.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }

  revalidatePath("/admin/stock-documents");
  redirect(`/admin/stock-documents/${documentId}`);
}

export async function postDocument(documentId: string): Promise<DocActionResult> {
  const actorId = await requireAdmin();

  try {
    await postStockDocument(documentId, actorId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }

  revalidatePath("/admin/stock-documents");
  revalidatePath(`/admin/stock-documents/${documentId}`);
  revalidatePath("/admin/stock");
  revalidatePath("/admin/products");
  revalidatePath("/admin/warehouses");
  return { ok: true };
}

export async function cancelDocument(
  documentId: string
): Promise<DocActionResult> {
  const actorId = await requireAdmin();

  try {
    await cancelStockDocument(documentId, actorId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }

  revalidatePath("/admin/stock-documents");
  revalidatePath(`/admin/stock-documents/${documentId}`);
  revalidatePath("/admin/stock");
  revalidatePath("/admin/products");
  revalidatePath("/admin/warehouses");
  return { ok: true };
}
