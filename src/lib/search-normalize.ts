// Ko'p foydalanuvchilar ruscha "ё" o'rniga oddiy "е" tugmasini bosadi
// (masalan "штабелер" deb yozadi, mahsulot nomida esa "штабелёр").
// Prisma `contains` ustunlar ichidagi harflarni almashtira olmaydi, shuning
// uchun so'rov matnidagi har bir "е"/"ё" pozitsiyasini birma-bir almashtirib,
// barcha mumkin bo'lgan variantlarni qaytaramiz — ulardan biri asl matnga
// to'g'ri keladi. Butun so'zni bir yo'la almashtirish noto'g'ri natija
// beradi (masalan "штабелер" -> "штабёлёр", ikkala "е" ham almashadi).
export function searchQueryVariants(query: string): string[] {
  const swapPositions = [...query]
    .map((ch, i) => ({ ch, i }))
    .filter(({ ch }) => ch === "е" || ch === "ё" || ch === "Е" || ch === "Ё");

  if (swapPositions.length === 0) return [query];

  const swapMap: Record<string, string> = { е: "ё", ё: "е", Е: "Ё", Ё: "Е" };
  const variants = new Set<string>([query]);

  for (const { i } of swapPositions) {
    const chars = [...query];
    chars[i] = swapMap[chars[i]];
    variants.add(chars.join(""));
  }

  return Array.from(variants);
}
