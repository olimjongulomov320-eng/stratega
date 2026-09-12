import { prisma } from "@/lib/prisma";
import { localizeCategory } from "@/lib/localize";
import type { AppLocale } from "@/i18n/routing";

export async function getCategories(locale: AppLocale = "uz") {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return categories.map((c) => localizeCategory(c, locale));
}
