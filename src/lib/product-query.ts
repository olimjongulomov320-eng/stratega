import { Prisma } from "@/generated/prisma/client";

export type SortOption = "popular" | "price_asc" | "price_desc" | "rating" | "newest";

export const SORT_LABELS: Record<SortOption, string> = {
  popular: "Ommabop",
  newest: "Yangi qo'shilgan",
  price_asc: "Arzon narx",
  price_desc: "Qimmat narx",
  rating: "Reyting bo'yicha",
};

export function parseSortOption(value: string | undefined): SortOption {
  if (
    value === "popular" ||
    value === "price_asc" ||
    value === "price_desc" ||
    value === "rating" ||
    value === "newest"
  ) {
    return value;
  }
  return "popular";
}

export function sortToOrderBy(
  sort: SortOption
): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "price_asc":
      return { price: "asc" };
    case "price_desc":
      return { price: "desc" };
    case "rating":
      return { rating: "desc" };
    case "newest":
      return { createdAt: "desc" };
    case "popular":
    default:
      return { soldCount: "desc" };
  }
}
