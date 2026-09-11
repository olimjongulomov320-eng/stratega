import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["uz", "ru", "en"],
  defaultLocale: "uz",
  localePrefix: {
    mode: "as-needed",
    prefixes: {
      ru: "/ru",
      en: "/en",
    },
  },
});

export type AppLocale = (typeof routing.locales)[number];
