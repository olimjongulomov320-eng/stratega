export type Line = { productId: string; quantity: number; price?: number };

export function parseLines(raw: FormDataEntryValue | null): Line[] {
  if (typeof raw !== "string") return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((l) => typeof l?.productId === "string" && l.productId.trim() !== "" && Number.isFinite(l?.quantity) && l.quantity > 0)
      .map((l) => ({ productId: l.productId, quantity: Math.round(l.quantity), price: Number.isFinite(l.price) ? Math.round(l.price) : undefined }))
      .slice(0, 200);
  } catch {
    return [];
  }
}
