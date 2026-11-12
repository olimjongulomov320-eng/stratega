// Search texts for categories, keyed by category slug: <title>, meta description, and an intro shown under the
// heading when the category has no intro of its own in the admin. Built from the phrases people in Uzbekistan
// actually type (Google and Yandex autocomplete for Uzbekistan / Tashkent, 12.11.2026): product type first,
// "купить в Ташкенте", "цена", "narxi". Brand names are left out: buyers search for the kind of machine.
// `aka` lists other names buyers use; /llms.txt shows them to AI assistants.
// Optional per language: `h1` replaces the category name in the page heading (the breadcrumb keeps the name),
// `sections` is a short buying text shown under the products, and `faq` comes before the standard questions.
// These are code, so they show even when the admin has written its own intro.

import type { Locale } from "@/i18n/config";

export type CategorySeoSection = { h2: string; p?: string; ul?: string[] };
export type CategorySeoText = {
  title: string;
  description: string;
  intro?: string;
  h1?: string;
  sections?: CategorySeoSection[];
  faq?: { q: string; a: string }[];
};
type CategorySeo = Record<Locale, CategorySeoText> & { aka?: string[] };

export const CATEGORY_SEO: Record<string, CategorySeo> = {
  "gidravlik-telejkalar": {
    uz: {
      title: "Rohlya (gidravlik telejka) narxi Toshkentda | Stratega",
      description: "Rohlya — paletlar uchun gidravlik telejkalar 2–3 t, tarozili va rulon uchun. Narxlar QQS bilan. Toshkentda mavjud, O'zbekiston bo'ylab yetkazib beramiz.",
      intro: "Rohlya (gidravlik telejka) — ombor, do'kon va sexda paletlarni tashish uchun qo'l telejkasi. 2 va 3 tonnalik, 1150 va 1220 mm vilkali, tarozili va rulon uchun modellar.",
      h1: "Rohlya — paletlar uchun gidravlik telejkalar",
      sections: [
        {
          h2: "2 va 3 tonnalik rohlyalar",
          ul: [
            "2 t — NIULI CBY-JC ekonom rohlyasi: do'konlar va yengil paletli kichik omborlar uchun.",
            "3 t — NIULI CBY-AC: 550×1150 mm vilkali (1200×800 mm yevropalet uchun) va 685×1220 mm vilkali (1200×1000 mm kabi kengroq paletlar uchun). BQSL 3 t, vilkasi 1200 mm.",
            "Tarozili rohlya — NIULI CBY-CW I va 3 tonnalik elektron tarozili telejka: yuk vilkaning o'zida tortiladi, qabul va jo'natishda qulay.",
          ],
        },
        {
          h2: "Rohlyani qanday tanlash kerak",
          ul: [
            "Yuk ko'tarish — eng og'ir paletingizdan zaxira bilan oling: doim chegarada ishlaydigan telejkaning gidravlikasi tezroq yeyiladi.",
            "Vilka — paletingiz o'lchamiga mos bo'lsin: 1200×800 mm yevropalet uchun 550 mm kenglik va 1150 mm uzunlik.",
            "G'ildirak — poliuretan tinch va polni buzmaydi, neylon og'ir yuk va iflos polga chidamliroq.",
            "Paletni stellajga ko'tarish kerak bo'lsa, rohlya emas, shtabeler kerak.",
          ],
        },
      ],
      faq: [
        { q: "Rohlya va gidravlik telejka — bir narsami?", a: "Ha. Rohlya, gidravlik telejka, palet telejkasi va transpalet — paletlarni vilkada ko'tarib tashiydigan bitta qo'l telejkasining nomlari." },
      ],
    },
    ru: {
      title: "Рохли (гидравлические тележки) купить в Ташкенте — цены | Stratega",
      description: "Рохли — гидравлические тележки для паллет 2–3 т, с весами и для рулонов. Цены с НДС. В наличии в Ташкенте, доставка по всему Узбекистану.",
      intro: "Рохля (гидравлическая тележка, транспалет) — ручная тележка для перевозки паллет по складу, магазину и цеху. Модели на 2 и 3 тонны, с вилами 1150 и 1220 мм, с весами и для рулонов.",
      h1: "Рохли — гидравлические тележки для паллет",
      sections: [
        {
          h2: "Рохли на 2 и 3 тонны",
          ul: [
            "2 т — эконом-рохля NIULI CBY-JC: для магазинов и небольших складов с лёгкими паллетами.",
            "3 т — NIULI CBY-AC с вилами 550×1150 мм (под европаллет 1200×800 мм) и 685×1220 мм (под более широкие паллеты, например 1200×1000 мм). Рохля BQSL на 3 т с вилами 1200 мм.",
            "Рохли с весами — NIULI CBY-CW I и тележка с электронными весами на 3 т: груз взвешивается прямо на вилах, удобно при приёмке и отгрузке.",
          ],
        },
        {
          h2: "Как выбрать рохлю",
          ul: [
            "Грузоподъёмность — берите с запасом от самой тяжёлой паллеты: тележка, которая всё время работает на пределе, быстрее изнашивает гидравлику.",
            "Вилы — под размер ваших паллет: для европаллеты 1200×800 мм нужна ширина 550 мм и длина 1150 мм.",
            "Колёса — полиуретановые тише и не портят пол, нейлоновые лучше переносят тяжёлый груз и грязный пол.",
            "Если паллеты нужно поднимать на стеллаж, нужна не рохля, а штабелер.",
          ],
        },
      ],
      faq: [
        { q: "Рохля и гидравлическая тележка — это одно и то же?", a: "Да. Рохля, гидравлическая тележка, тележка для паллет и транспалет — названия одной ручной тележки, которая поднимает паллету на вилах и перевозит её." },
      ],
    },
    en: {
      title: "Hand pallet trucks in Tashkent — prices | Stratega",
      description: "Hand pallet trucks 2–3 t, with scale and for rolls. Prices incl. VAT. In stock in Tashkent, delivery across Uzbekistan.",
    },
    aka: ["рохля", "гидравлическая тележка", "транспалет", "тележка для паллет", "rohlya", "telejka"],
  },
  "qol-shtabelerlari": {
    uz: {
      title: "Qo'l gidravlik shtabeler narxi Toshkentda | Stratega",
      description: "Qo'lda boshqariladigan gidravlik shtabelerlar 2 t, 1,6 m gacha ko'tarish. Narxlar QQS bilan. Toshkentda mavjud, O'zbekiston bo'ylab yetkazib beramiz.",
      intro: "Qo'l shtabeleri paletlarni elektrsiz, dasta va oyoq pedali bilan stellajga ko'taradi. Kichik omborlar va do'konlar uchun qulay.",
    },
    ru: {
      title: "Ручные гидравлические штабелеры купить в Ташкенте — цены | Stratega",
      description: "Ручные гидравлические штабелеры 2 т, подъём до 1,6 м, без электричества. Цены с НДС. В наличии в Ташкенте, доставка по всему Узбекистану.",
      intro: "Ручной (гидравлический) штабелер поднимает паллеты на стеллажи без электричества: подъём ручкой и ножной педалью. Подходит для небольших складов и магазинов.",
    },
    en: {
      title: "Manual hydraulic stackers in Tashkent — prices | Stratega",
      description: "Manual hydraulic stackers 2 t, lift up to 1.6 m. Prices incl. VAT. In stock in Tashkent, delivery across Uzbekistan.",
    },
    aka: ["ручной штабелер", "гидравлический штабелер", "shtabeler"],
  },
  "elektr-shtabelerlar": {
    uz: {
      title: "Elektr shtabeler narxi Toshkentda | Stratega",
      description: "Elektr shtabelerlar 1,5–2 t, ko'tarish 1,6–4,5 m, yarim avtomat va o'zi yuradigan. Narxlar QQS bilan. Toshkentda mavjud, O'zbekiston bo'ylab yetkazib beramiz.",
      intro: "Elektr shtabeler paletlarni akkumulyator yordamida stellajlarga ko'taradi. Yuk ko'tarish 1,5–2 t, ko'tarish balandligi 1,6 m dan 4,5 m gacha bo'lgan modellar.",
    },
    ru: {
      title: "Электрические штабелеры купить в Ташкенте — цены | Stratega",
      description: "Электроштабелеры 1,5–2 т, подъём 1,6–4,5 м, полуавтомат и самоходные. Цены с НДС. В наличии в Ташкенте, доставка по всему Узбекистану.",
      intro: "Электрический штабелер (электроштабелер) поднимает паллеты на стеллажи на аккумуляторе. Полуавтоматические и самоходные модели грузоподъёмностью 1,5–2 т и высотой подъёма от 1,6 до 4,5 м.",
    },
    en: {
      title: "Electric stackers in Tashkent — prices | Stratega",
      description: "Electric stackers 1.5–2 t, lift 1.6–4.5 m. Prices incl. VAT. In stock in Tashkent, delivery across Uzbekistan.",
    },
    aka: ["штабелер", "электрический штабелер", "электроштабелер", "shtabeler"],
  },
  "pol-yuvish-mashinalari": {
    uz: {
      title: "Pol yuvish mashinasi narxi Toshkentda | Stratega",
      description: "Ombor, do'kon va sex uchun pol yuvish mashinalari: qo'lda boshqariladigan va o'rindiqli. Narxlar QQS bilan. Toshkentda mavjud, O'zbekiston bo'ylab yetkazib beramiz.",
      intro: "Pol yuvish mashinasi ombor, do'kon, ofis va sexlarda polni yuvadi va darhol quritadi. Akkumulyatorli va tarmoqdan ishlaydigan, qo'lda va o'rindiqli modellar.",
    },
    ru: {
      title: "Поломоечные машины купить в Ташкенте — цены | Stratega",
      description: "Поломоечные машины (поломойки) для склада, магазина и цеха: ручные и с сиденьем. Цены с НДС. В наличии в Ташкенте, доставка по всему Узбекистану.",
      intro: "Поломоечная машина (поломойка) моет и сразу высушивает пол на складах, в магазинах, офисах и цехах. Аккумуляторные и сетевые модели, ручные и с сиденьем.",
    },
    en: {
      title: "Floor scrubbers in Tashkent — prices | Stratega",
      description: "Floor scrubbers, walk-behind and ride-on. Prices incl. VAT. In stock in Tashkent, delivery across Uzbekistan.",
    },
    aka: ["поломоечная машина", "поломойка", "pol yuvish mashinasi"],
  },
  "supurish-mashinalari": {
    uz: {
      title: "Supurish mashinasi narxi Toshkentda | Stratega",
      description: "Ombor, hudud va ko'cha uchun supurish mashinalari, o'rindiqli va kabinali. Narxlar QQS bilan. Toshkentda mavjud, O'zbekiston bo'ylab yetkazib beramiz.",
      intro: "Supurish mashinasi ombor, avtoturargoh va korxona hududidagi chiqindi va changni yig'adi. O'rindiqli va kabinali modellar, tozalash kengligi 2 m gacha.",
    },
    ru: {
      title: "Подметальные машины купить в Ташкенте — цены | Stratega",
      description: "Подметальные машины для склада, территории и улицы, с сиденьем и кабиной. Цены с НДС. В наличии в Ташкенте, доставка по всему Узбекистану.",
      intro: "Подметальная машина собирает мусор и пыль на складах, парковках и территориях предприятий. Модели с сиденьем и с кабиной, ширина уборки до 2 м.",
    },
    en: {
      title: "Floor sweepers in Tashkent — prices | Stratega",
      description: "Ride-on and cab sweepers. Prices incl. VAT. In stock in Tashkent, delivery across Uzbekistan.",
    },
    aka: ["подметальная машина", "supurish mashinasi"],
  },
  "sanoat-changyutgichlari": {
    uz: {
      title: "Sanoat (qurilish) changyutgichi narxi Toshkentda | Stratega",
      description: "Quruq va ho'l tozalash uchun sanoat changyutgichlari, 20–80 L. Narxlar QQS bilan. Toshkentda mavjud, O'zbekiston bo'ylab yetkazib beramiz.",
      intro: "Sanoat (qurilish) changyutgichi quruq va ho'l tozalash uchun: chang, suv, qurilish chiqindisi. Baki 20 dan 80 litrgacha, 1–3 motorli.",
    },
    ru: {
      title: "Промышленные и строительные пылесосы купить в Ташкенте | Stratega",
      description: "Промышленные (строительные) пылесосы для сухой и влажной уборки, 20–80 л. Цены с НДС. В наличии в Ташкенте, доставка по всему Узбекистану.",
      intro: "Промышленный (строительный) пылесос для сухой и влажной уборки: пыль, вода, строительный мусор. Баки от 20 до 80 литров, 1–3 мотора.",
    },
    en: {
      title: "Industrial vacuum cleaners in Tashkent | Stratega",
      description: "Wet and dry vacuums, 20–80 L. Prices incl. VAT. In stock in Tashkent, delivery across Uzbekistan.",
    },
    aka: ["промышленный пылесос", "строительный пылесос", "changyutgich"],
  },
  "payvandlash-apparatlari": {
    uz: {
      title: "PE va PND quvur paykasi (dazmol) narxi Toshkentda | Stratega",
      description: "PE va PND quvurlar uchun payka (dazmol, utyug): 63–630 mm stykovoy payvandlash apparatlari va 20–110 mm paykalar. Narxlar QQS bilan, Toshkentda mavjud.",
      intro: "Polietilen (PND) quvurlarni payvandlash apparatlari: 63 dan 630 mm gacha mexanik va gidravlik stykovoy apparatlar, suv va isitish uchun plastik (PPR) quvur paykalari 20–110 mm.",
      h1: "PE va PND quvurlar uchun payka — payvandlash apparatlari",
      sections: [
        {
          h2: "Payka, dazmol, utyug — bir narsami?",
          p: "Ha. Polietilen quvurlarni uchma-uch (stykovoy) payvandlash apparatini har xil atashadi: payka, dazmol, utyug, quvur payvandlash apparati, PND apparati. Bu bitta uskuna: qisqichli markazlashtirgich, torets kesgich va isitish ko'zgusi. Quvur uchlari tekislanadi, qizdiriladi va siqiladi — chok quvurning o'zidek mustahkam bo'ladi.",
        },
        {
          h2: "Diametringizga qaysi payka kerak",
          ul: [
            "20–63 mm, polipropilen (PPR) — CN-026 paykasi.",
            "50–110 mm — CN-013A paykasi, nasadkalar to'plami bilan.",
            "63–200 va 63–250 mm — gidrostansiyali TURAN CN-63/200 va CN-63/250 stykovoy apparatlari, 220 V.",
            "90–315 mm — gidravlik TURAN CN-90/315H, 220 V.",
            "160–450 va 160–500 mm — gidravlik TURAN CN-160/450H va CN-160/500H.",
            "315–630 mm — TURAN CN-315/630H, 380 V kerak.",
          ],
        },
      ],
      faq: [
        { q: "PE quvur paykasi polipropilen paykasidan nimasi bilan farq qiladi?", a: "PE paykasi (stykovoy apparat) PE va PND quvurlarni uchma-uch payvandlaydi, 63 mm dan katta suv, kanalizatsiya va sug'orish quvurlari uchun. Polipropilen paykasi quvur va fitingni rastrub usulida ulaydi — PPR va 110 mm gacha kichik quvurlar uchun." },
      ],
    },
    ru: {
      title: "Пайка для ПЭ и ПНД труб — аппараты сварки в Ташкенте | Stratega",
      description: "Пайка для ПЭ и ПНД труб (утюг, дазмол): аппараты стыковой сварки 63–630 мм и паяльники 20–110 мм. Цены с НДС. В наличии в Ташкенте, доставка по Узбекистану.",
      intro: "Аппараты для сварки полиэтиленовых (ПНД, ПЭ) труб: механические и гидравлические аппараты стыковой сварки от 63 до 630 мм, а также паяльники для пластиковых (ППР) труб 20–110 мм для водопровода и отопления.",
      h1: "Пайка для ПЭ и ПНД труб — аппараты сварки",
      sections: [
        {
          h2: "Пайка, утюг, дазмол — это одно и то же?",
          p: "Да. Аппарат стыковой сварки полиэтиленовых труб называют по-разному: пайка, утюг, дазмол, паяльник для труб, аппарат для сварки ПНД труб. Это одно оборудование: центратор с зажимами, торцеватель и нагревательное зеркало. Торцы труб выравнивают, нагревают и сжимают — шов получается не слабее самой трубы.",
        },
        {
          h2: "Какая пайка нужна под ваш диаметр",
          ul: [
            "20–63 мм, полипропилен (PPR) — паяльник CN-026.",
            "50–110 мм — паяльник CN-013A с комплектом насадок.",
            "63–200 и 63–250 мм — стыковые TURAN CN-63/200 и CN-63/250 с гидростанцией, 220 В.",
            "90–315 мм — гидравлическая TURAN CN-90/315H, 220 В.",
            "160–450 и 160–500 мм — гидравлические TURAN CN-160/450H и CN-160/500H.",
            "315–630 мм — TURAN CN-315/630H, нужно 380 В.",
          ],
        },
      ],
      faq: [
        { q: "Чем пайка для ПЭ труб отличается от паяльника для полипропилена?", a: "Пайка для ПЭ труб (стыковой аппарат) сваривает ПЭ и ПНД трубы встык — для водопровода, канализации и полива от 63 мм. Паяльник для полипропилена соединяет трубу и фитинг раструбом — для PPR и небольших труб до 110 мм." },
      ],
    },
    en: {
      title: "PE and PPR pipe welding machines in Tashkent | Stratega",
      description: "Butt fusion machines 63–630 mm and socket welders. Prices incl. VAT. In stock in Tashkent, delivery across Uzbekistan.",
    },
    aka: ["пайка для пэ труб", "утюг для труб", "дазмол", "аппарат для сварки пнд труб", "сварка пнд труб", "аппарат стыковой сварки", "паяльник для пластиковых труб", "payka", "dazmol", "payvandlash apparati"],
  },
  "generatorlar": {
    uz: {
      title: "Generator narxi Toshkentda — benzinli generatorlar | Stratega",
      description: "Uy, dacha va qurilish uchun benzinli generatorlar 0,65–10 kVt, elektr starterli. Narxlar QQS bilan. Toshkentda mavjud, O'zbekiston bo'ylab yetkazib beramiz.",
      intro: "Benzinli generator uy, do'kon, dacha va qurilish maydonini zaxira elektr bilan ta'minlaydi. Quvvati 0,65 dan 10 kVt gacha, 220 V, qo'l va elektr starterli modellar.",
    },
    ru: {
      title: "Бензиновые генераторы купить в Ташкенте — цены | Stratega",
      description: "Бензогенераторы 0,65–10 кВт для дома, дачи и стройки, с электростартером. Цены с НДС. В наличии в Ташкенте, доставка по всему Узбекистану.",
      intro: "Бензиновый генератор (бензогенератор) даёт резервное электричество для дома, магазина, дачи и стройки. Мощность от 0,65 до 10 кВт, однофазные 220 В, модели с ручным и электростартером.",
    },
    en: {
      title: "Petrol generators in Tashkent — prices | Stratega",
      description: "Petrol generators 0.65–10 kW. Prices incl. VAT. In stock in Tashkent, delivery across Uzbekistan.",
    },
    aka: ["генератор", "бензиновый генератор", "бензогенератор", "генератор для дома", "generator", "generator narxi"],
  },
  "invertorli-generatorlar": {
    uz: {
      title: "Invertorli generator narxi Toshkentda | Stratega",
      description: "Invertorli benzinli generatorlar 0,9–10 kVt: shovqinsiz, elektronika va qozonlar uchun. Narxlar QQS bilan. Toshkentda mavjud, O'zbekiston bo'ylab yetkazib beramiz.",
      intro: "Invertorli generator kompyuter, kassa, qozon va boshqa sezgir texnika uchun barqaror kuchlanish beradi. Shovqinsiz g'ilofli va ochiq modellar, 0,9–10 kVt.",
    },
    ru: {
      title: "Инверторные генераторы купить в Ташкенте — цены | Stratega",
      description: "Инверторные бензогенераторы 0,9–10 кВт: тихие, для электроники и котлов. Цены с НДС. В наличии в Ташкенте, доставка по всему Узбекистану.",
      intro: "Инверторный генератор выдаёт стабильное напряжение для компьютеров, касс, котлов и другой чувствительной техники. Тихие модели в кожухе и открытые, 0,9–10 кВт.",
    },
    en: {
      title: "Inverter generators in Tashkent — prices | Stratega",
      description: "Inverter generators 0.9–10 kW. Prices incl. VAT. In stock in Tashkent, delivery across Uzbekistan.",
    },
    aka: ["инверторный генератор", "тихий генератор", "invertorli generator"],
  },
  "dizel-generatorlar": {
    uz: {
      title: "Dizel generator narxi Toshkentda | Stratega",
      description: "Dizel generatorlar 2,8–11 kVA, ochiq va shovqin himoyali g'ilofda, elektr starterli. Narxlar QQS bilan. Toshkentda mavjud, O'zbekiston bo'ylab yetkazib beramiz.",
      intro: "Dizel generator uzoq ishlash uchun: uy, korxona, qurilish. Ochiq va shovqin himoyali g'ilofda, elektr starterli, 2,8–11 kVA.",
    },
    ru: {
      title: "Дизельные генераторы купить в Ташкенте — цены | Stratega",
      description: "Дизель генераторы 2,8–11 кВА, открытые и в шумозащитном кожухе, электростарт. Цены с НДС. В наличии в Ташкенте, доставка по всему Узбекистану.",
      intro: "Дизельный генератор (дизель генератор) для долгой работы: дом, предприятие, стройка. Открытые и в шумозащитном кожухе, с электростартером, 2,8–11 кВА.",
    },
    en: {
      title: "Diesel generators in Tashkent — prices | Stratega",
      description: "Diesel generators 2.8–11 kVA. Prices incl. VAT. In stock in Tashkent, delivery across Uzbekistan.",
    },
    aka: ["дизельный генератор", "дизель генератор", "dizel generator"],
  },
  "payvandlash-generatorlari": {
    uz: {
      title: "Svarka generator narxi Toshkentda | Stratega",
      description: "Payvandlash funksiyali benzinli generatorlar 130–160 A. Narxlar QQS bilan. Toshkentda mavjud, O'zbekiston bo'ylab yetkazib beramiz.",
      intro: "Payvandlash funksiyali generator — elektr tarmog'i yo'q joyda ham tok beradi va 130–160 A payvandlash imkonini beradi.",
    },
    ru: {
      title: "Сварочные генераторы купить в Ташкенте — цены | Stratega",
      description: "Бензиновые генераторы со сваркой 130–160 А: ток и сварка в одном. Цены с НДС. В наличии в Ташкенте, доставка по всему Узбекистану.",
      intro: "Сварочный генератор — бензиновый инверторный генератор с функцией сварки 130–160 А. Даёт электричество и позволяет варить там, где нет сети.",
    },
    en: {
      title: "Welder generators in Tashkent — prices | Stratega",
      description: "Petrol welder generators 130–160 A. Prices incl. VAT. In stock in Tashkent, delivery across Uzbekistan.",
    },
    aka: ["сварочный генератор", "генератор со сваркой", "svarka generator"],
  },
  "motoblok-va-kultivatorlar": {
    uz: {
      title: "Motoblok va kultivator narxi Toshkentda | Stratega",
      description: "Benzinli va dizel motobloklar, motokultivatorlar va mini traktorlar. Narxlar QQS bilan. Toshkentda mavjud, O'zbekiston bo'ylab yetkazib beramiz.",
      intro: "Tomorqa, bog' va dalada yer haydash va yumshatish uchun motobloklar, motokultivatorlar va mini traktorlar. Benzinli va dizel.",
    },
    ru: {
      title: "Мотоблоки и культиваторы купить в Ташкенте — цены | Stratega",
      description: "Бензиновые и дизельные мотоблоки, мотокультиваторы и минитракторы. Цены с НДС. В наличии в Ташкенте, доставка по всему Узбекистану.",
      intro: "Мотоблоки, мотокультиваторы и мини-тракторы для вспашки и рыхления земли на огороде, в саду и на поле. Бензиновые и дизельные.",
    },
    en: {
      title: "Walk-behind tractors and tillers in Tashkent | Stratega",
      description: "Petrol and diesel tillers. Prices incl. VAT. In stock in Tashkent, delivery across Uzbekistan.",
    },
    aka: ["мотоблок", "культиватор", "мотокультиватор", "minitraktor", "motoblok", "kultivator"],
  },
  "yuqori-bosimli-yuvish-apparatlari": {
    uz: {
      title: "Karcher (yuqori bosimli moyka) narxi Toshkentda | Stratega",
      description: "Avtomoyka va tozalash uchun yuqori bosimli yuvish apparatlari (karcher): elektr va benzinli. Narxlar QQS bilan. Toshkentda mavjud, O'zbekiston bo'ylab yetkazib beramiz.",
      intro: "Yuqori bosimli yuvish apparati (karcher) — avtomoyka, texnika, hovli va fasadlarni yuvish uchun. 220 va 380 V elektr, 500 bar gacha benzinli va dizel sanoat modellari.",
    },
    ru: {
      title: "Мойки высокого давления (керхер) купить в Ташкенте | Stratega",
      description: "Аппараты высокого давления (керхер) для автомойки и уборки: электрические и бензиновые. Цены с НДС. В наличии в Ташкенте, доставка по всему Узбекистану.",
      intro: "Мойка высокого давления (в народе «керхер») — аппарат для автомойки, мойки техники, дворов и фасадов. Электрические на 220 и 380 В, бензиновые и дизельные промышленные модели до 500 бар.",
    },
    en: {
      title: "Pressure washers in Tashkent — prices | Stratega",
      description: "Electric and petrol pressure washers. Prices incl. VAT. In stock in Tashkent, delivery across Uzbekistan.",
    },
    aka: ["мойка высокого давления", "керхер", "минимойка", "автомойка аппарат", "karcher", "moyka apparati"],
  },
  "yuvish-apparati-nasoslari": {
    uz: {
      title: "Moyka (karcher) nasosi narxi Toshkentda | Stratega",
      description: "Yuqori bosimli moykalar uchun plunjerli va aksial nasoslar 190–275 bar. Narxlar QQS bilan. Toshkentda mavjud, O'zbekiston bo'ylab yetkazib beramiz.",
      intro: "Yuqori bosimli moykalar (karcher) uchun nasoslar: plunjerli (latun) va aksial, bosim 190–275 bar, 12–18 L/min.",
    },
    ru: {
      title: "Насосы для моек высокого давления купить в Ташкенте | Stratega",
      description: "Плунжерные и аксиальные насосы для моек высокого давления 190–275 бар. Цены с НДС. В наличии в Ташкенте, доставка по всему Узбекистану.",
      intro: "Насосы для моек высокого давления (керхеров): плунжерные (латунные) и аксиальные, давление 190–275 бар, производительность 12–18 л/мин.",
    },
    en: {
      title: "Pressure washer pumps in Tashkent | Stratega",
      description: "Plunger and axial pumps 190–275 bar. Prices incl. VAT. In stock in Tashkent, delivery across Uzbekistan.",
    },
    aka: ["насос для мойки высокого давления", "плунжерный насос", "насос для керхера"],
  },
  "yuvish-apparati-aksessuarlari": {
    uz: {
      title: "Karcher uchun aksessuarlar Toshkentda | Stratega",
      description: "Yuqori bosimli moykalar uchun pistoletlar, shlanglar, ko'pik nasadkalari va soplolar. Narxlar QQS bilan. Toshkentda mavjud, O'zbekiston bo'ylab yetkazib beramiz.",
      intro: "Yuqori bosimli moykalar (karcher) uchun aksessuarlar: pistoletlar, yuqori bosimli shlanglar, ko'pik nasadkalari, soplolar, tag va yuzalarni yuvish nasadkalari.",
    },
    ru: {
      title: "Аксессуары для моек высокого давления в Ташкенте | Stratega",
      description: "Пистолеты, шланги высокого давления, пенные насадки и форсунки для керхеров. Цены с НДС. В наличии в Ташкенте, доставка по всему Узбекистану.",
      intro: "Аксессуары для моек высокого давления (керхеров): пистолеты, шланги высокого давления, пенные насадки (пеногенераторы), форсунки, насадки для мойки днища и поверхностей.",
    },
    en: {
      title: "Pressure washer accessories in Tashkent | Stratega",
      description: "Guns, hoses, foam lances, nozzles. Prices incl. VAT. In stock in Tashkent, delivery across Uzbekistan.",
    },
    aka: ["пистолет для мойки высокого давления", "шланг высокого давления", "пенная насадка", "karcher pistolet"],
  },
  "beton-silliqlash-mashinalari": {
    uz: {
      title: "Beton zatirka mashinasi (vertolyot) narxi Toshkentda | Stratega",
      description: "Beton uchun zatirka mashinalari «vertolyot» 60–100 sm, benzinli va o'rindiqli. Narxlar QQS bilan. Toshkentda mavjud, O'zbekiston bo'ylab yetkazib beramiz.",
      intro: "Beton zatirka (silliqlash) mashinasi — «vertolyot» — beton polni tekislaydi va silliqlaydi. Diski 60–100 sm benzinli mashinalar, chetlar uchun va o'rindiqli ikki rotorli modellar.",
    },
    ru: {
      title: "Затирочные машины (вертолет) по бетону купить в Ташкенте | Stratega",
      description: "Затирочные машины «вертолёт» для бетона 60–100 см, бензиновые и с сиденьем. Цены с НДС. В наличии в Ташкенте, доставка по всему Узбекистану.",
      intro: "Затирочная машина по бетону (в народе «вертолёт») выравнивает и заглаживает бетонный пол. Бензиновые машины с диском 60–100 см, кромочные и двухроторные с сиденьем, лопасти и диски.",
    },
    en: {
      title: "Concrete power trowels in Tashkent | Stratega",
      description: "Power trowels 60–100 cm. Prices incl. VAT. In stock in Tashkent, delivery across Uzbekistan.",
    },
    aka: ["затирочная машина", "вертолет для бетона", "затирка бетона", "vertolyot"],
  },
  "shov-kesgichlar": {
    uz: {
      title: "Shov kesgich (shvonarezchik) narxi Toshkentda | Stratega",
      description: "Beton va asfalt uchun shov kesgichlar, 500 mm gacha disk, benzinli va dizel. Narxlar QQS bilan. Toshkentda mavjud, O'zbekiston bo'ylab yetkazib beramiz.",
      intro: "Shov kesgich (shvonarezchik) beton va asfaltni kesadi. 500 mm gacha diskli benzinli va dizel modellar, olmosli disklar va ehtiyot qismlar.",
    },
    ru: {
      title: "Швонарезчики и алмазные диски купить в Ташкенте | Stratega",
      description: "Нарезчики швов по бетону и асфальту, диск до 500 мм, бензиновые и дизельные. Цены с НДС. В наличии в Ташкенте, доставка по всему Узбекистану.",
      intro: "Швонарезчик (нарезчик швов, резчик швов) режет бетон и асфальт. Бензиновые и дизельные модели под диск до 500 мм, алмазные диски и запчасти.",
    },
    en: {
      title: "Floor saws in Tashkent — prices | Stratega",
      description: "Concrete and asphalt saws up to 500 mm. Prices incl. VAT. In stock in Tashkent, delivery across Uzbekistan.",
    },
    aka: ["швонарезчик", "нарезчик швов", "резчик швов", "shvonarezchik"],
  },
  "vibroplita-va-vibrotrambovkalar": {
    uz: {
      title: "Vibroplita va vibrotrambovka narxi Toshkentda | Stratega",
      description: "Grunt, shag'al va asfalt uchun vibroplitalar va vibrotrambovkalar, benzinli va elektr. Narxlar QQS bilan. Toshkentda mavjud, O'zbekiston bo'ylab yetkazib beramiz.",
      intro: "Vibroplita va vibrotrambovka plitka, beton va yo'l qoplamasi oldidan grunt, qum, shag'al va asfaltni zichlaydi. Benzinli va elektr, to'g'ri va reversiv modellar.",
    },
    ru: {
      title: "Виброплиты и вибротрамбовки купить в Ташкенте — цены | Stratega",
      description: "Виброплиты и вибротрамбовки для грунта, щебня и асфальта, бензиновые и электрические. Цены с НДС. В наличии в Ташкенте, доставка по всему Узбекистану.",
      intro: "Виброплита и вибротрамбовка уплотняют грунт, песок, щебень и асфальт перед укладкой плитки, бетона и дорожного покрытия. Бензиновые и электрические, прямоходные и реверсивные.",
    },
    en: {
      title: "Plate compactors and rammers in Tashkent | Stratega",
      description: "Plate compactors and tamping rammers. Prices incl. VAT. In stock in Tashkent, delivery across Uzbekistan.",
    },
    aka: ["виброплита", "вибротрамбовка", "трамбовка", "vibroplita"],
  },
  "armatura-dastgohlari": {
    uz: {
      title: "Armatura egish va kesish stanogi narxi Toshkentda | Stratega",
      description: "Armatura egish, kesish va to'g'rilash stanoklari 50 mm gacha, xomut egish, CNC. Narxlar QQS bilan. Toshkentda mavjud, O'zbekiston bo'ylab yetkazib beramiz.",
      intro: "Armatura stanoklari: egish (armatura va xomut egish), kesish va to'g'rilash stanoklari, shu jumladan CNC, 50 mm gacha armatura uchun.",
    },
    ru: {
      title: "Станки для гибки и резки арматуры купить в Ташкенте | Stratega",
      description: "Станки для гибки, резки и правки арматуры до 50 мм, гибка хомутов, ЧПУ. Цены с НДС. В наличии в Ташкенте, доставка по всему Узбекистану.",
      intro: "Станки для арматуры: гибочные (гибка арматуры и хомутов), резочные (резка арматуры) и правильные станки, в том числе с ЧПУ, для арматуры до 50 мм.",
    },
    en: {
      title: "Rebar bending and cutting machines in Tashkent | Stratega",
      description: "Rebar benders, cutters and straighteners. Prices incl. VAT. In stock in Tashkent, delivery across Uzbekistan.",
    },
    aka: ["станок для гибки арматуры", "станок для резки арматуры", "гибочный станок", "armatura stanok"],
  },
  "beton-frezalash-va-silliqlash": {
    uz: {
      title: "Mozaika silliqlash va beton frezalash mashinasi Toshkentda | Stratega",
      description: "Beton uchun mozaik-silliqlash va frezalash mashinalari, olmosli disklar. Narxlar QQS bilan. Toshkentda mavjud, O'zbekiston bo'ylab yetkazib beramiz.",
      intro: "Mozaik-silliqlash mashinasi beton va mozaik pollarni silliqlaydi, frezalash mashinasi betonning ustki qatlamini oladi. Elektr va benzinli modellar, olmosli disklar.",
    },
    ru: {
      title: "Мозаично-шлифовальные и фрезеровальные машины в Ташкенте | Stratega",
      description: "Мозаично-шлифовальные машины по бетону и фрезеровальные машины, алмазные диски. Цены с НДС. В наличии в Ташкенте, доставка по всему Узбекистану.",
      intro: "Мозаично-шлифовальная машина шлифует бетонные и мозаичные полы, фрезеровальная машина снимает верхний слой бетона. Электрические и бензиновые модели, алмазные диски.",
    },
    en: {
      title: "Concrete grinders and scarifiers in Tashkent | Stratega",
      description: "Mosaic grinders and scarifiers. Prices incl. VAT. In stock in Tashkent, delivery across Uzbekistan.",
    },
    aka: ["мозаично шлифовальная машина", "фрезеровальная машина по бетону", "mozaika"],
  },
  "vibroreyka-va-beton-asboblari": {
    uz: {
      title: "Vibroreyka va beton asboblari narxi Toshkentda | Stratega",
      description: "Benzinli va elektr vibroreykalar, beton uchun qoidalar va gladilkalar. Narxlar QQS bilan. Toshkentda mavjud, O'zbekiston bo'ylab yetkazib beramiz.",
      intro: "Vibroreyka pol va maydonchalardagi yangi betonni zichlaydi va tekislaydi. Benzinli va elektr vibroreykalar, 1–6 m alyuminiy profillar, qoidalar va gladilkalar.",
    },
    ru: {
      title: "Виброрейки и инструмент для бетона купить в Ташкенте | Stratega",
      description: "Виброрейки бензиновые и электрические, правила, гладилки для бетона. Цены с НДС. В наличии в Ташкенте, доставка по всему Узбекистану.",
      intro: "Виброрейка уплотняет и выравнивает свежий бетон на полах и площадках. Бензиновые и электрические виброрейки, алюминиевые профили 1–6 м, правила и гладилки.",
    },
    en: {
      title: "Vibrating screeds in Tashkent — prices | Stratega",
      description: "Petrol and electric screeds. Prices incl. VAT. In stock in Tashkent, delivery across Uzbekistan.",
    },
    aka: ["виброрейка", "правило для бетона", "vibroreyka"],
  },
  "beton-vibratorlari": {
    uz: {
      title: "Beton vibratori narxi Toshkentda | Stratega",
      description: "Beton uchun chuqurlik vibratorlari, vibro tayoqlar va shlanglar 1–12 m. Narxlar QQS bilan. Toshkentda mavjud, O'zbekiston bo'ylab yetkazib beramiz.",
      intro: "Beton vibratori qolipdagi betonni zichlaydi. Qo'l elektr vibratorlari, benzinli yuritmalar, vibro tayoqlar va 1–12 m shlanglar.",
    },
    ru: {
      title: "Глубинные вибраторы для бетона купить в Ташкенте | Stratega",
      description: "Глубинные вибраторы для бетона, вибробулавы и рукава 1–12 м. Цены с НДС. В наличии в Ташкенте, доставка по всему Узбекистану.",
      intro: "Глубинный вибратор (вибратор для бетона) уплотняет бетон в опалубке. Ручные электрические вибраторы, бензиновые приводы, вибробулавы и рукава от 1 до 12 метров.",
    },
    en: {
      title: "Concrete vibrators in Tashkent | Stratega",
      description: "Poker vibrators and shafts. Prices incl. VAT. In stock in Tashkent, delivery across Uzbekistan.",
    },
    aka: ["глубинный вибратор", "вибратор для бетона", "beton vibrator"],
  },
  "motopompa-va-dvigatellar": {
    uz: {
      title: "Motopompa (suv nasosi) narxi Toshkentda | Stratega",
      description: "Toza, iflos suv va kimyo uchun motopompalar 1–4 dyuym, yuqori bosimli. Narxlar QQS bilan. Toshkentda mavjud, O'zbekiston bo'ylab yetkazib beramiz.",
      intro: "Motopompa (benzinli suv nasosi) sug'orish, suvni chiqarish va balandga uzatish uchun. Toza va iflos suv, kimyo uchun, yuqori bosimli 1–4 dyuymli modellar.",
    },
    ru: {
      title: "Мотопомпы бензиновые купить в Ташкенте — цены | Stratega",
      description: "Мотопомпы для чистой, грязной воды и химии 1–4 дюйма, пожарные высоконапорные. Цены с НДС. В наличии в Ташкенте, доставка по всему Узбекистану.",
      intro: "Мотопомпа (бензиновый водяной насос) для полива, откачки воды и подачи на высоту. Модели для чистой и грязной воды, химии, высоконапорные 1–4 дюйма.",
    },
    en: {
      title: "Water pumps in Tashkent — prices | Stratega",
      description: "Petrol and diesel water pumps 1–4 inch. Prices incl. VAT. In stock in Tashkent, delivery across Uzbekistan.",
    },
    aka: ["мотопомпа", "водяной насос бензиновый", "motopompa", "suv nasosi"],
  },
  "dvigatellar": {
    uz: {
      title: "Dvigatel narxi Toshkentda — benzinli va dizel | Stratega",
      description: "168F, 170F, 177F, 188F, 190F, 192F benzinli va 178F–192F dizel dvigatellar. Narxlar QQS bilan. Toshkentda mavjud, O'zbekiston bo'ylab yetkazib beramiz.",
      intro: "Motoblok, motopompa, generator va qurilish texnikasi uchun benzinli va dizel dvigatellar: 168F, 170F, 177F, 188F, 190F, 192F va 170F–195F dizel.",
    },
    ru: {
      title: "Бензиновые и дизельные двигатели купить в Ташкенте | Stratega",
      description: "Двигатели 168F, 170F, 177F, 188F, 190F, 192F и дизельные 178F–192F для техники. Цены с НДС. В наличии в Ташкенте, доставка по всему Узбекистану.",
      intro: "Бензиновые и дизельные двигатели для мотоблоков, мотопомп, генераторов и строительной техники: 168F, 170F, 177F, 188F, 190F, 192F и дизельные 170F–195F.",
    },
    en: {
      title: "Petrol and diesel engines in Tashkent | Stratega",
      description: "Small petrol and diesel engines. Prices incl. VAT. In stock in Tashkent, delivery across Uzbekistan.",
    },
    aka: ["бензиновый двигатель", "дизельный двигатель", "двигатель 170f", "dvigatel"],
  },
  "qurilish-texnikasi": {
    uz: {
      title: "Betonomeshalka va qurilish texnikasi narxi Toshkentda | Stratega",
      description: "Betonomeshalkalar 120–180 L, vibroplitalar, zatirka mashinalari va boshqa qurilish texnikasi. Narxlar QQS bilan. Toshkentda mavjud, O'zbekiston bo'ylab yetkazib beramiz.",
      intro: "Qurilish va obodonlashtirish uchun texnika: betonomeshalkalar (beton qorgich) 120–180 L, vibroplitalar, vibrotrambovkalar, zatirka mashinalari.",
    },
    ru: {
      title: "Бетономешалки и строительная техника купить в Ташкенте | Stratega",
      description: "Бетономешалки 120–180 л, виброплиты, затирочные машины и другая строительная техника. Цены с НДС. В наличии в Ташкенте, доставка по всему Узбекистану.",
      intro: "Строительная техника для стройки и благоустройства: бетономешалки 120–180 л, виброплиты, вибротрамбовки, затирочные машины.",
    },
    en: {
      title: "Concrete mixers and construction machinery in Tashkent | Stratega",
      description: "Concrete mixers and site machinery. Prices incl. VAT. In stock in Tashkent, delivery across Uzbekistan.",
    },
    aka: ["бетономешалка", "строительная техника", "betonomeshalka"],
  },
  "havo-kompressorlari": {
    uz: {
      title: "Kompressor narxi Toshkentda — havo kompressorlari | Stratega",
      description: "Kompressorlar 6–300 L: moysiz, tasmali porshenli, benzinli va dizel. Narxlar QQS bilan. Toshkentda mavjud, O'zbekiston bo'ylab yetkazib beramiz.",
      intro: "Havo kompressori pnevmatik asboblar, bo'yash, shinomontaj va ustaxona uchun. Moysiz (shovqinsiz), tasmali porshenli, benzinli va dizel, resiver 6–300 L.",
    },
    ru: {
      title: "Воздушные компрессоры купить в Ташкенте — цены | Stratega",
      description: "Компрессоры 6–300 л: безмасляные, поршневые ременные, бензиновые и дизельные. Цены с НДС. В наличии в Ташкенте, доставка по всему Узбекистану.",
      intro: "Воздушный компрессор для пневмоинструмента, покраски, шиномонтажа и мастерской. Безмасляные (бесшумные), поршневые с ременным приводом, бензиновые и дизельные, ресивер 6–300 л.",
    },
    en: {
      title: "Air compressors in Tashkent — prices | Stratega",
      description: "Oil-free, belt-driven, petrol and diesel compressors. Prices incl. VAT. In stock in Tashkent, delivery across Uzbekistan.",
    },
    aka: ["компрессор", "воздушный компрессор", "безмасляный компрессор", "kompressor"],
  },
  "qurilish-texnikasi-ehtiyot-qismlari": {
    uz: {
      title: "Qurilish texnikasi ehtiyot qismlari Toshkentda | Stratega",
      description: "Vibroplita, vibrotrambovka, zatirka mashinasi, shov kesgich va stanoklar uchun ehtiyot qismlar. Toshkentda mavjud, O'zbekiston bo'ylab yetkazib beramiz.",
      intro: "Qurilish texnikasi ehtiyot qismlari: vibroplita, vibrotrambovka, vibroreyka, zatirka mashinasi, shov kesgich, vibrator va armatura stanoklari uchun.",
    },
    ru: {
      title: "Запчасти для строительной техники в Ташкенте | Stratega",
      description: "Запчасти для виброплит, вибротрамбовок, затирочных машин, швонарезчиков и станков. В наличии в Ташкенте, доставка по всему Узбекистану.",
      intro: "Запчасти для строительной техники: виброплит, вибротрамбовок, виброреек, затирочных машин, швонарезчиков, вибраторов и станков для арматуры.",
    },
    en: {
      title: "Construction machinery spare parts in Tashkent | Stratega",
      description: "Spare parts for compactors, trowels, saws. In stock in Tashkent, delivery across Uzbekistan.",
    },
    aka: ["запчасти для виброплиты", "запчасти для затирочной машины", "ehtiyot qismlar"],
  },
  "dvigatel-va-generator-ehtiyot-qismlari": {
    uz: {
      title: "Dvigatel va generator ehtiyot qismlari Toshkentda | Stratega",
      description: "Karbyurator, starter, filtr, AVR, rozetka va boshqa dvigatel va generator ehtiyot qismlari. Toshkentda mavjud, O'zbekiston bo'ylab yetkazib beramiz.",
      intro: "Benzinli va dizel dvigatellar va generatorlar uchun ehtiyot qismlar: karbyuratorlar, qo'l va elektr starterlar, filtrlar, AVR kuchlanish regulyatorlari, bak qopqoqlari, rozetkalar.",
    },
    ru: {
      title: "Запчасти для двигателей и генераторов в Ташкенте | Stratega",
      description: "Карбюраторы, стартеры, фильтры, AVR, розетки и другие запчасти для двигателей и генераторов. В наличии в Ташкенте, доставка по всему Узбекистану.",
      intro: "Запчасти для бензиновых и дизельных двигателей и генераторов: карбюраторы, ручные и электростартеры, фильтры, регуляторы напряжения AVR, крышки баков, розетки и автоматы.",
    },
    en: {
      title: "Engine and generator spare parts in Tashkent | Stratega",
      description: "Carburettors, starters, filters, AVR. In stock in Tashkent, delivery across Uzbekistan.",
    },
    aka: ["запчасти для генератора", "карбюратор", "ehtiyot qismlar"],
  },
  // Categories without products at the moment.
  "avtokotargichlar": {
    uz: {
      title: "Avtoko'targich narxi Toshkentda — ikki va to'rt ustunli | Stratega",
      description:
        "Ikki ustunli, to'rt ustunli va qaychi avtoko'targichlar 3,5–5,5 t, Karjoys. Avtoservis va shinomontaj uchun. Narxlar QQS bilan, O'zbekiston bo'ylab yetkazib berish.",
    },
    ru: {
      title: "Автоподъёмники в Ташкенте — цены, двухстоечные и ножничные | Stratega",
      description:
        "Двухстоечные, четырёхстоечные и ножничные автоподъёмники 3,5–5,5 т Karjoys для СТО и шиномонтажа. Цены с НДС, доставка по Узбекистану.",
    },
    en: {
      title: "Car lifts in Tashkent — two-post, four-post, scissor | Stratega",
      description:
        "Two-post, four-post and scissor car lifts, 3.5–5.5 t, Karjoys. Prices incl. VAT, delivery across Uzbekistan.",
    },
  },
  "shinomontaj-stanoklari": {
    uz: {
      title: "Shinomontaj stanogi narxi Toshkentda | Stratega",
      description:
        "Yengil va yuk avtomobillari uchun shinomontaj stanoklari Karjoys: 10–21\" disklar, yuk va og'ir texnika uchun 56\" gacha. Narxlar QQS bilan.",
    },
    ru: {
      title: "Шиномонтажные станки в Ташкенте — цены, купить | Stratega",
      description:
        "Шиномонтажные станки Karjoys для легковых и грузовых авто: диски 10–21\", для грузовиков и спецтехники до 56\". Цены с НДС, доставка по Узбекистану.",
    },
    en: {
      title: "Tyre changers in Tashkent — prices | Stratega",
      description:
        "Karjoys tyre changers for cars (10–21\" rims) and trucks up to 56\". Prices incl. VAT, delivery across Uzbekistan.",
    },
  },
  "balansirovka-stanoklari": {
    uz: {
      title: "Balansirovka stanogi narxi Toshkentda | Stratega",
      description:
        "Yengil va yuk g'ildiraklari uchun balansirovka stanoklari Karjoys, aniqlik ±1 g. Narxlar QQS bilan, O'zbekiston bo'ylab yetkazib berish.",
    },
    ru: {
      title: "Балансировочные станки в Ташкенте — цены | Stratega",
      description:
        "Балансировочные станки Karjoys для легковых и грузовых колёс, точность ±1 г. Цены с НДС, доставка по Узбекистану.",
    },
    en: {
      title: "Wheel balancers in Tashkent — prices | Stratega",
      description:
        "Karjoys wheel balancers for car and truck wheels, ±1 g accuracy. Prices incl. VAT.",
    },
  },
  "razval-sxojdenie-stendlari": {
    uz: {
      title: "3D razval-sxojdenie stendi narxi Toshkentda | Stratega",
      description:
        "3D razval-sxojdenie stendlari Karjoys: 30 000 dan ortiq avtomobil bazasi, bitta va ikki ekranli modellar. Narxlar QQS bilan.",
    },
    ru: {
      title: "Стенды развал-схождения 3D в Ташкенте — цены | Stratega",
      description:
        "3D-стенды развал-схождения Karjoys: база более 30 000 автомобилей, модели с одним и двумя экранами. Цены с НДС, доставка по Узбекистану.",
    },
    en: {
      title: "3D wheel aligners in Tashkent — prices | Stratega",
      description:
        "Karjoys 3D wheel aligners with a 30,000+ vehicle database. Prices incl. VAT.",
    },
  },
  "avtokonditsioner-uskunalari": {
    uz: {
      title: "Avtokonditsioner zapravka stansiyasi narxi | Stratega",
      description:
        "Avtokonditsionerlarni zapravka qilish stansiyalari R134a va R1234yf: qo'lda, yarim avtomat va to'liq avtomat. Narxlar QQS bilan.",
    },
    ru: {
      title: "Установки для заправки автокондиционеров — цены | Stratega",
      description:
        "Станции заправки автокондиционеров R134a и R1234yf: ручные, полуавтоматические и автоматические Karjoys. Цены с НДС, доставка по Узбекистану.",
    },
    en: {
      title: "A/C service stations — prices | Stratega",
      description:
        "Karjoys A/C recovery and recharge stations for R134a and R1234yf. Prices incl. VAT.",
    },
  },
  "kuzov-tamirlash-uskunalari": {
    uz: {
      title: "Kuzov stapeli va spotter narxi Toshkentda | Stratega",
      description:
        "Kuzov ta'mirlash uchun stapellar, spotterlar va payvandlash apparatlari Karjoys. Narxlar QQS bilan, O'zbekiston bo'ylab yetkazib berish.",
    },
    ru: {
      title: "Стапели и споттеры для кузовного ремонта — цены | Stratega",
      description:
        "Стапели, споттеры и сварочные аппараты Karjoys для кузовного ремонта. Цены с НДС, доставка по Узбекистану.",
    },
    en: {
      title: "Frame machines and spotters — prices | Stratega",
      description:
        "Karjoys frame machines, spotters and welders for body repair. Prices incl. VAT.",
    },
  },
  "stroplar": {
    uz: {
      title: "Strop narxi Toshkentda — tekstil, zanjirli, arqon | Stratega",
      description:
        "Tekstil (STP, STK), zanjirli va arqon stroplar TOR 1–10 t. Strop narxi QQS bilan, katta hajmga alohida narx.",
    },
    ru: {
      title: "Стропы в Ташкенте — цены: текстильные, цепные, канатные | Stratega",
      description:
        "Текстильные (СТП, СТК), цепные и канатные стропы TOR 1–10 т. Цены с НДС, для крупных партий — отдельные цены.",
    },
    en: {
      title: "Lifting slings in Tashkent — prices | Stratega",
      description:
        "TOR textile, chain and wire-rope slings, 1–10 t. Prices incl. VAT.",
    },
  },
  "elektr-tallar": {
    uz: {
      title: "Elektr tal narxi Toshkentda | Stratega",
      description:
        "Elektr arqonli va zanjirli tallar TOR 200 kg – 5 t, 220/380 V. Narxlar QQS bilan, O'zbekiston bo'ylab yetkazib berish.",
    },
    ru: {
      title: "Тали электрические в Ташкенте — цены | Stratega",
      description:
        "Электрические канатные и цепные тали TOR от 200 кг до 5 т, 220/380 В. Цены с НДС, доставка по Узбекистану.",
    },
    en: {
      title: "Electric hoists in Tashkent — prices | Stratega",
      description:
        "TOR electric wire-rope and chain hoists, 200 kg – 5 t. Prices incl. VAT.",
    },
  },
  "qol-zanjirli-tallar": {
    uz: {
      title: "Qo'l zanjirli tal narxi Toshkentda | Stratega",
      description:
        "Qo'l zanjirli tallar TOR 0,5–10 t, ko'tarish balandligi 3–6 m. Tal narxi QQS bilan.",
    },
    ru: {
      title: "Тали ручные цепные в Ташкенте — цены | Stratega",
      description:
        "Ручные цепные тали TOR 0,5–10 т, высота подъёма 3–6 м. Цены с НДС, доставка по Узбекистану.",
    },
    en: {
      title: "Manual chain hoists in Tashkent — prices | Stratega",
      description:
        "TOR manual chain hoists, 0.5–10 t. Prices incl. VAT.",
    },
  },
};
