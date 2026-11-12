import type { GuideLocale } from "@/config/guides";

/** Labels for the guide pages (guides exist in Uzbek and Russian only). */
export const GUIDE_UI: Record<GuideLocale, { title: string; intro: string; seoTitle: string; description: string; updated: string; products: string; allIn: string; faq: string; more: string; read: string; ctaTitle: string; ctaText: string }> = {
  ru: {
    title: "Полезные статьи",
    seoTitle: "Как выбрать оборудование: статьи и советы | Stratega",
    description: "Как выбрать аппарат для сварки ПНД труб, рохлю и штабелер: понятные статьи с таблицами и моделями в наличии в Ташкенте. Доставка по Узбекистану.",
    intro: "Помогаем выбрать оборудование до покупки: что важно, чем отличаются модели и какие ошибки встречаются чаще всего.",
    updated: "Обновлено",
    products: "Модели в нашем каталоге",
    allIn: "Все:",
    faq: "Частые вопросы",
    more: "Другие статьи",
    read: "Читать",
    ctaTitle: "Поможем подобрать",
    ctaText: "Позвоните или напишите — подберём модель и скажем цену и срок доставки в ваш регион.",
  },
  uz: {
    title: "Foydali maqolalar",
    seoTitle: "Uskunani qanday tanlash: maqolalar va maslahatlar | Stratega",
    description: "PND quvur payvandlash apparati, rohlya va shtabeler qanday tanlanadi: jadvallar va Toshkentda mavjud modellar bilan tushunarli maqolalar. O'zbekiston bo'ylab yetkazib beramiz.",
    intro: "Sotib olishdan oldin uskunani tanlashga yordam beramiz: nima muhim, modellar qanday farqlanadi va qaysi xatolar ko'p uchraydi.",
    updated: "Yangilangan",
    products: "Katalogimizdagi modellar",
    allIn: "Barchasi:",
    faq: "Ko'p beriladigan savollar",
    more: "Boshqa maqolalar",
    read: "O'qish",
    ctaTitle: "Tanlashga yordam beramiz",
    ctaText: "Qo'ng'iroq qiling yoki yozing — model tanlab, narxi va viloyatingizga yetkazib berish muddatini aytamiz.",
  },
};
