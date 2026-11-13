// Texts for the dealer page (/dilerlar), the service page (/servis) and the warranty block on the home page.
// Only what the site already promises is stated (see config/site-claims.ts): warranty per contract and warranty card,
// VAT documents and Didox, delivery across Uzbekistan, individual customer price lists. No service centre and no
// "parts always in stock" claim: those claims are switched off until they are true.

import type { Locale } from "@/i18n/config";

type FormText = { name: string; phone: string; extra: string; extraPlaceholder: string; message: string; messagePlaceholder: string; send: string; sending: string; done: string; requestType: string };
type PageText = { nav: string; title: string; seoTitle: string; description: string; lead: string; sections: { h2: string; p?: string; ul?: string[]; ol?: string[] }[]; formTitle: string; form: FormText };

export const DEALER_PAGE: Record<Locale, PageText> = {
  ru: {
    nav: "Дилерам",
    title: "Дилерам и оптовым покупателям",
    seoTitle: "Дилерам — складская и строительная техника оптом в Узбекистане | Stratega",
    description: "Станьте дилером Stratega: рохли, штабелеры, генераторы, мойки, строительная техника и запчасти по индивидуальным ценам. Договор, НДС, доставка по Узбекистану.",
    lead: "Магазинам техники, строительным базам, сервисам и компаниям в регионах Узбекистана: рохли, штабелеры, аппараты для сварки ПЭ труб, генераторы, мойки высокого давления, строительная техника и запчасти — по индивидуальным ценам.",
    sections: [
      {
        h2: "Что вы получаете",
        ul: [
          "Индивидуальный прайс-лист: после согласования ваши цены видны на сайте, когда вы входите в личный кабинет по своему номеру телефона.",
          "Договор, накладные и электронные счета-фактуры с НДС через Didox.",
          "Доставку в ваш регион — сроки и стоимость согласуем под объём заказа.",
          "Одного менеджера, который ведёт ваши заказы, остатки и отгрузки.",
          "Запчасти к технике, которую вы продаёте, — в одном каталоге.",
        ],
      },
      {
        h2: "Как начать",
        ol: [
          "Оставьте заявку ниже или позвоните нам.",
          "Менеджер обсудит ассортимент, объёмы и условия.",
          "Подписываем договор и открываем ваш прайс-лист.",
          "Вы заказываете — мы отгружаем со склада в Ташкенте или доставляем в регион.",
        ],
      },
    ],
    formTitle: "Заявка на дилерство",
    form: {
      name: "Компания или имя",
      phone: "Телефон",
      extra: "Город или регион",
      extraPlaceholder: "Например, Самарканд",
      message: "Что вас интересует",
      messagePlaceholder: "Какая техника, примерные объёмы",
      send: "Отправить заявку",
      sending: "Отправляем…",
      done: "Спасибо! Менеджер свяжется с вами в рабочее время.",
      requestType: "Дилерство / опт",
    },
  },
  uz: {
    nav: "Dilerlarga",
    title: "Dilerlar va ulgurji xaridorlar uchun",
    seoTitle: "Dilerlarga — ombor va qurilish texnikasi ulgurji, O'zbekiston | Stratega",
    description: "Stratega dileri bo'ling: rohlya, shtabeler, generator, moyka, qurilish texnikasi va ehtiyot qismlar individual narxlarda. Shartnoma, QQS, O'zbekiston bo'ylab yetkazish.",
    lead: "Texnika do'konlari, qurilish bazalari, servislar va viloyatlardagi kompaniyalar uchun: rohlya, shtabeler, PE quvur payvandlash apparatlari, generatorlar, moykalar, qurilish texnikasi va ehtiyot qismlar — individual narxlarda.",
    sections: [
      {
        h2: "Siz nimaga ega bo'lasiz",
        ul: [
          "Individual narxlar ro'yxati: kelishuvdan so'ng telefon raqamingiz bilan shaxsiy kabinetga kirganingizda saytda o'z narxlaringizni ko'rasiz.",
          "Shartnoma, yuk xatlari va Didox orqali QQS bilan elektron hisob-fakturalar.",
          "Viloyatingizga yetkazib berish — muddat va narx buyurtma hajmiga qarab kelishiladi.",
          "Buyurtmalar, qoldiqlar va jo'natmalarni olib boradigan bitta menejer.",
          "Siz sotadigan texnika uchun ehtiyot qismlar — bitta katalogda.",
        ],
      },
      {
        h2: "Qanday boshlash kerak",
        ol: [
          "Quyida ariza qoldiring yoki bizga qo'ng'iroq qiling.",
          "Menejer assortiment, hajm va shartlarni muhokama qiladi.",
          "Shartnoma imzolaymiz va narxlar ro'yxatingizni ochamiz.",
          "Siz buyurtma berasiz — biz Toshkentdagi ombordan jo'natamiz yoki viloyatga yetkazamiz.",
        ],
      },
    ],
    formTitle: "Dilerlik uchun ariza",
    form: {
      name: "Kompaniya yoki ism",
      phone: "Telefon",
      extra: "Shahar yoki viloyat",
      extraPlaceholder: "Masalan, Samarqand",
      message: "Sizni nima qiziqtiradi",
      messagePlaceholder: "Qanday texnika, taxminiy hajm",
      send: "Ariza yuborish",
      sending: "Yuborilmoqda…",
      done: "Rahmat! Menejer ish vaqtida siz bilan bog'lanadi.",
      requestType: "Dilerlik / ulgurji",
    },
  },
  en: {
    nav: "Dealers",
    title: "For dealers and wholesale buyers",
    seoTitle: "Dealers — warehouse and construction equipment wholesale | Stratega",
    description: "Become a Stratega dealer: pallet trucks, stackers, generators, pressure washers, construction machines and spare parts at individual prices. Contract, VAT, delivery across Uzbekistan.",
    lead: "For equipment shops, building-supply bases, workshops and companies across Uzbekistan: pallet trucks, stackers, PE pipe welders, generators, pressure washers, construction machines and spare parts at individual prices.",
    sections: [
      {
        h2: "What you get",
        ul: [
          "An individual price list: once agreed, your prices show on the site when you sign in with your phone number.",
          "Contract, delivery notes and electronic VAT invoices via Didox.",
          "Delivery to your region — timing and cost agreed by order volume.",
          "One manager for your orders, stock and shipments.",
          "Spare parts for the machines you sell, in one catalogue.",
        ],
      },
      {
        h2: "How to start",
        ol: [
          "Send a request below or call us.",
          "A manager discusses range, volumes and terms.",
          "We sign a contract and open your price list.",
          "You order — we ship from our Tashkent warehouse or deliver to your region.",
        ],
      },
    ],
    formTitle: "Dealer request",
    form: {
      name: "Company or name",
      phone: "Phone",
      extra: "City or region",
      extraPlaceholder: "e.g. Samarkand",
      message: "What are you interested in",
      messagePlaceholder: "Which equipment, rough volumes",
      send: "Send request",
      sending: "Sending…",
      done: "Thank you! A manager will contact you during working hours.",
      requestType: "Dealer / wholesale",
    },
  },
};

export const SERVICE_PAGE: Record<Locale, PageText> = {
  ru: {
    nav: "Сервис и ремонт",
    title: "Сервис, ремонт и запчасти",
    seoTitle: "Сервис, ремонт и запчасти для техники Stratega в Ташкенте | Stratega",
    description: "Гарантийный ремонт и замена по договору, запчасти для рохлей, штабелеров, генераторов и строительной техники, заявка на ремонт и консультацию.",
    lead: "Помогаем с техникой, купленной у нас: гарантия по договору, запчасти, заявки на ремонт и ответы на вопросы по эксплуатации.",
    sections: [
      {
        h2: "Гарантия",
        p: "Срок гарантии зависит от типа товара и указывается в договоре и гарантийном талоне. При обнаружении производственного дефекта в гарантийный период товар ремонтируется или заменяется. Для обращения сообщите номер договора или счёта.",
      },
      {
        h2: "Запчасти",
        p: "В каталоге запчастей — колёса и гидравлика для рохлей, детали для штабелеров, генераторов, двигателей, виброплит, затирочных машин и другой техники. Ищите по модели машины или артикулу детали; если нужной нет, напишите — подберём.",
      },
      {
        h2: "Ремонт после гарантии и консультации",
        ul: [
          "Опишите модель и неисправность в заявке ниже — менеджер скажет, как решить вопрос, сроки и стоимость, и подберёт запчасти.",
          "Ответим на вопросы по запуску, маслам и обслуживанию техники, которую вы купили у нас.",
          "Для ремонта по гарантии приложите номер договора или счёта.",
        ],
      },
    ],
    formTitle: "Заявка на ремонт или запчасть",
    form: {
      name: "Имя или компания",
      phone: "Телефон",
      extra: "Модель техники",
      extraPlaceholder: "Например, рохля CBY-AC 3 т",
      message: "Что случилось",
      messagePlaceholder: "Опишите неисправность или нужную деталь",
      send: "Отправить заявку",
      sending: "Отправляем…",
      done: "Спасибо! Менеджер свяжется с вами в рабочее время.",
      requestType: "Сервис / ремонт",
    },
  },
  uz: {
    nav: "Servis va ta'mirlash",
    title: "Servis, ta'mirlash va ehtiyot qismlar",
    seoTitle: "Stratega texnikasi uchun servis, ta'mirlash va ehtiyot qismlar | Stratega",
    description: "Shartnoma bo'yicha kafolatli ta'mirlash va almashtirish, rohlya, shtabeler, generator va qurilish texnikasi uchun ehtiyot qismlar, ta'mirlash va maslahat uchun ariza.",
    lead: "Bizdan sotib olingan texnika bo'yicha yordam beramiz: shartnoma bo'yicha kafolat, ehtiyot qismlar, ta'mirlash arizalari va foydalanish bo'yicha savollarga javob.",
    sections: [
      {
        h2: "Kafolat",
        p: "Kafolat muddati mahsulot turiga bog'liq va shartnoma hamda kafolat talonida ko'rsatiladi. Kafolat davrida ishlab chiqarish nuqsoni aniqlansa, mahsulot ta'mirlanadi yoki almashtiriladi. Murojaat uchun shartnoma yoki hisob raqamini ayting.",
      },
      {
        h2: "Ehtiyot qismlar",
        p: "Ehtiyot qismlar katalogida — rohlya uchun g'ildiraklar va gidravlika, shtabeler, generator, dvigatel, vibroplita, zatirka mashinasi va boshqa texnika uchun detallar. Mashina modeli yoki detal artikuli bo'yicha qidiring; kerakli detal bo'lmasa, yozing — topib beramiz.",
      },
      {
        h2: "Kafolatdan keyingi ta'mirlash va maslahat",
        ul: [
          "Quyidagi arizada model va nosozlikni yozing — menejer masalani qanday hal qilish, muddat va narxni aytadi hamda ehtiyot qismlarni tanlaydi.",
          "Bizdan sotib olingan texnikani ishga tushirish, moylar va unga xizmat ko'rsatish bo'yicha savollarga javob beramiz.",
          "Kafolatli ta'mirlash uchun shartnoma yoki hisob raqamini ilova qiling.",
        ],
      },
    ],
    formTitle: "Ta'mirlash yoki ehtiyot qism uchun ariza",
    form: {
      name: "Ism yoki kompaniya",
      phone: "Telefon",
      extra: "Texnika modeli",
      extraPlaceholder: "Masalan, rohlya CBY-AC 3 t",
      message: "Nima bo'ldi",
      messagePlaceholder: "Nosozlik yoki kerakli detalni yozing",
      send: "Ariza yuborish",
      sending: "Yuborilmoqda…",
      done: "Rahmat! Menejer ish vaqtida siz bilan bog'lanadi.",
      requestType: "Servis / ta'mirlash",
    },
  },
  en: {
    nav: "Service and repair",
    title: "Service, repair and spare parts",
    seoTitle: "Service, repair and spare parts for Stratega equipment | Stratega",
    description: "Warranty repair or replacement under contract, spare parts for pallet trucks, stackers, generators and construction machines, and repair or advice requests.",
    lead: "We help with equipment bought from us: warranty under contract, spare parts, repair requests and answers about operation.",
    sections: [
      {
        h2: "Warranty",
        p: "The warranty period depends on the product and is stated in the contract and warranty card. If a manufacturing defect appears during the warranty period, the product is repaired or replaced. Please give your contract or invoice number.",
      },
      {
        h2: "Spare parts",
        p: "The spare parts catalogue has wheels and hydraulics for pallet trucks, and parts for stackers, generators, engines, plate compactors, power trowels and other machines. Search by machine model or part code; if a part is missing, write to us.",
      },
      {
        h2: "Repair after warranty and advice",
        ul: [
          "Describe the model and the fault in the request below — a manager tells you how to solve it, timing and cost, and picks the parts.",
          "We answer questions about starting, oils and maintenance of equipment bought from us.",
          "For warranty repair, include your contract or invoice number.",
        ],
      },
    ],
    formTitle: "Repair or spare part request",
    form: {
      name: "Name or company",
      phone: "Phone",
      extra: "Machine model",
      extraPlaceholder: "e.g. pallet truck CBY-AC 3 t",
      message: "What happened",
      messagePlaceholder: "Describe the fault or the part you need",
      send: "Send request",
      sending: "Sending…",
      done: "Thank you! A manager will contact you during working hours.",
      requestType: "Service / repair",
    },
  },
};

/** Home page block: warranty and after-sales help. */
export const HOME_WARRANTY: Record<Locale, { title: string; items: { icon: string; title: string; text: string; href: string; link: string }[] }> = {
  ru: {
    title: "Гарантия и сервис",
    items: [
      { icon: "🛡️", title: "Гарантия по договору", text: "Срок указан в договоре и гарантийном талоне. Производственный дефект в гарантийный период — ремонт или замена.", href: "/delivery", link: "Условия гарантии" },
      { icon: "⚙️", title: "Запчасти", text: "Каталог запчастей для рохлей, штабелеров, генераторов, двигателей и строительной техники.", href: "/ehtiyot-qismlar", link: "Каталог запчастей" },
      { icon: "🛠️", title: "Ремонт и консультации", text: "Опишите модель и неисправность — подскажем решение, сроки и подберём детали.", href: "/servis", link: "Оставить заявку" },
    ],
  },
  uz: {
    title: "Kafolat va servis",
    items: [
      { icon: "🛡️", title: "Shartnoma bo'yicha kafolat", text: "Muddat shartnoma va kafolat talonida ko'rsatiladi. Kafolat davridagi ishlab chiqarish nuqsoni — ta'mirlash yoki almashtirish.", href: "/delivery", link: "Kafolat shartlari" },
      { icon: "⚙️", title: "Ehtiyot qismlar", text: "Rohlya, shtabeler, generator, dvigatel va qurilish texnikasi uchun ehtiyot qismlar katalogi.", href: "/ehtiyot-qismlar", link: "Ehtiyot qismlar katalogi" },
      { icon: "🛠️", title: "Ta'mirlash va maslahat", text: "Model va nosozlikni yozing — yechim, muddatni aytamiz va detallarni tanlaymiz.", href: "/servis", link: "Ariza qoldirish" },
    ],
  },
  en: {
    title: "Warranty and service",
    items: [
      { icon: "🛡️", title: "Warranty under contract", text: "The period is stated in the contract and warranty card. A manufacturing defect in the warranty period — repair or replacement.", href: "/delivery", link: "Warranty terms" },
      { icon: "⚙️", title: "Spare parts", text: "Spare parts for pallet trucks, stackers, generators, engines and construction machines.", href: "/ehtiyot-qismlar", link: "Spare parts catalogue" },
      { icon: "🛠️", title: "Repair and advice", text: "Describe the model and the fault — we suggest a solution and timing and pick the parts.", href: "/servis", link: "Send a request" },
    ],
  },
};
