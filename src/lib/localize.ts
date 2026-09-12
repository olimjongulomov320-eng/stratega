import type { AppLocale } from "@/i18n/routing";

type LocalizableProduct = {
  name: string;
  nameRu?: string | null;
  nameEn?: string | null;
  description: string;
  descriptionRu?: string | null;
  descriptionEn?: string | null;
};

type LocalizableCategory = {
  name: string;
  nameRu?: string | null;
  nameEn?: string | null;
};

// Tarjima maydoni bo'lmasa (yoki bo'sh bo'lsa) — o'zbekcha asl matn ko'rsatiladi.
export function localizeProduct<T extends LocalizableProduct>(
  product: T,
  locale: AppLocale
): T {
  if (locale === "uz") return product;
  const name =
    (locale === "ru" ? product.nameRu : product.nameEn) || product.name;
  const description =
    (locale === "ru" ? product.descriptionRu : product.descriptionEn) ||
    product.description;
  return { ...product, name, description };
}

export function localizeCategory<T extends LocalizableCategory>(
  category: T,
  locale: AppLocale
): T {
  if (locale === "uz") return category;
  const name =
    (locale === "ru" ? category.nameRu : category.nameEn) || category.name;
  return { ...category, name };
}
