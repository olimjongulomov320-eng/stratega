import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/lib/format";
import { CLAIMS } from "@/lib/site";

export type Faq = { q: string; a: string };

/** Short FAQ for a category page. Every answer states only what the site already promises (see CLAIMS). */
export function categoryFaq(locale: Locale, name: string, count: number, minPrice: number | null): Faq[] {
  const price = minPrice !== null ? formatNumber(minPrice) : null;
  const T = {
    uz: {
      price: [`${name} narxi qancha?`, price ? `Katalogda ${count} ta model, narxlar ${price} so'mdan, QQS bilan. Narxi ko'rsatilmagan modellar uchun «Narxini so'rash» tugmasini bosing.` : `Katalogda ${count} ta model. Narx va mavjudlikni menejer aytadi — «Narxini so'rash» tugmasini bosing.`],
      vat: ["Narxlar QQS bilanmi? Hisob-faktura berasizmi?", "Ha, narxlar 12% QQS bilan. Yuridik shaxslarga shartnoma, elektron hisob-faktura va nakladnaya beramiz."],
      pay: ["Qanday to'lash mumkin?", "Bank o'tkazmasi (QQS bilan hisob-faktura va shartnoma) yoki naqd pul / karta — kelishuv bo'yicha."],
      delivery: ["Yetkazib berasizmi?", "Ha, Toshkent va O'zbekistonning barcha viloyatlariga. Muddat va narxni menejer buyurtmada aytadi."],
      order: ["Qanday buyurtma beraman?", "Mahsulotni korzinaga qo'shib so'rov yuboring yoki «1 klikda buyurtma» tugmasi orqali telefon raqamingizni qoldiring — menejer qo'ng'iroq qiladi."],
    },
    ru: {
      price: [`Сколько стоят ${name.toLowerCase()}?`, price ? `В каталоге ${count} моделей, цены от ${price} сум с НДС. Для моделей без цены нажмите «Запросить цену».` : `В каталоге ${count} моделей. Цену и наличие сообщит менеджер — нажмите «Запросить цену».`],
      vat: ["Цены с НДС? Выдаёте счёт-фактуру?", "Да, цены указаны с НДС 12 %. Для юридических лиц — договор, электронная счёт-фактура и накладная."],
      pay: ["Как можно оплатить?", "Безналичный расчёт (счёт-фактура с НДС и договор) или наличные / карта — по договорённости."],
      delivery: ["Есть доставка?", "Да, по Ташкенту и во все регионы Узбекистана. Срок и стоимость менеджер сообщит при заказе."],
      order: ["Как оформить заказ?", "Добавьте товар в корзину и отправьте заявку или нажмите «Купить в 1 клик» и оставьте телефон — менеджер перезвонит."],
    },
    en: {
      price: [`How much do ${name.toLowerCase()} cost?`, price ? `${count} models in the catalogue, from ${price} UZS incl. VAT. For items without a price, press "Request price".` : `${count} models in the catalogue. A manager confirms price and availability — press "Request price".`],
      vat: ["Are prices incl. VAT? Do you issue VAT invoices?", "Yes, prices include 12% VAT. Companies get a contract, an electronic VAT invoice and a delivery note."],
      pay: ["How can I pay?", "Bank transfer (VAT invoice and contract) or cash / card by agreement."],
      delivery: ["Do you deliver?", "Yes, across Tashkent and all regions of Uzbekistan. The manager confirms time and cost with the order."],
      order: ["How do I order?", "Add the item to the cart and send a request, or press \"Buy in 1 click\" and leave your phone number — a manager will call back."],
    },
  }[locale];
  const items: [string, string][] = [T.price as [string, string], T.order as [string, string], T.pay as [string, string]];
  if (CLAIMS.vatDocuments) items.splice(1, 0, T.vat as [string, string]);
  if (CLAIMS.deliveryUzbekistan) items.push(T.delivery as [string, string]);
  return items.map(([q, a]) => ({ q, a }));
}

export function faqJsonLd(faq: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}
