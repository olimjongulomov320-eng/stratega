// Buying texts for category pages: the page heading (h1), short sections under the products and extra FAQ, in Uzbek
// and Russian. Merged into CATEGORY_SEO (config/category-seo.ts), which renders them.
//
// Written from the search phrases buyers in Uzbekistan use (Google and Yandex autocomplete for Tashkent, 13.11.2026:
// "генератор для дома 5 квт", "керхер цена", "мотоблок нархлари", "kompressor narxi"…) and from what the catalogue
// actually holds. Only models and ranges that are on the site are named. No prices: product cards show live prices.

import type { CategorySeoSection } from "./category-seo";

type Text = { h1: string; sections: CategorySeoSection[]; faq: { q: string; a: string }[] };
export const CATEGORY_CONTENT: Record<string, { uz: Text; ru: Text }> = {
  "qol-shtabelerlari": {
    ru: {
      h1: "Ручные гидравлические штабелеры",
      sections: [
        {
          h2: "Когда нужен ручной штабелер",
          p: "Ручной (гидравлический) штабелер — например, NIULI CTY-E на 2 т с подъёмом 1,6 м — поднимает паллету на стеллаж без электричества: вилы поднимаются ручкой и ножной педалью. Он подходит, когда паллет немного в день, высота стеллажа до 1,6 м и на складе нет места для зарядки аккумулятора.",
        },
        {
          h2: "Как выбрать",
          ul: [
            "Грузоподъёмность — по самой тяжёлой паллете, с запасом.",
            "Высота подъёма — на 10–20 см выше верхнего яруса стеллажа.",
            "Если паллет больше 20–30 в день или стеллажи выше 1,6 м, удобнее электрический штабелер.",
            "Если паллету нужно только перевезти по полу, хватит рохли.",
          ],
        },
      ],
      faq: [
        { q: "Чем ручной штабелер отличается от рохли?", a: "Рохля поднимает паллету на несколько сантиметров, чтобы перевезти её по полу. Штабелер поднимает паллету на стеллаж — на высоту до 1,6 м у ручных моделей." },
      ],
    },
    uz: {
      h1: "Qo'l gidravlik shtabelerlari",
      sections: [
        {
          h2: "Qo'l shtabeleri qachon kerak",
          p: "Qo'l (gidravlik) shtabeleri — masalan, 2 t va 1,6 m ko'taradigan NIULI CTY-E — paletni elektrsiz stellajga ko'taradi: vilkalar dasta va oyoq pedali bilan ko'tariladi. Kuniga paletlar kam, stellaj balandligi 1,6 m gacha va akkumulyator zaryadlash joyi bo'lmasa qulay.",
        },
        {
          h2: "Qanday tanlash kerak",
          ul: [
            "Yuk ko'tarish — eng og'ir paletingizdan zaxira bilan.",
            "Ko'tarish balandligi — stellajning yuqori qavatidan 10–20 sm baland.",
            "Kuniga 20–30 dan ortiq palet yoki 1,6 m dan baland stellaj bo'lsa, elektr shtabeler qulayroq.",
            "Paletni faqat pol bo'ylab tashish kerak bo'lsa, rohlya yetadi.",
          ],
        },
      ],
      faq: [
        { q: "Qo'l shtabeleri rohlyadan nimasi bilan farq qiladi?", a: "Rohlya paletni pol bo'ylab tashish uchun bir necha santimetrga ko'taradi. Shtabeler paletni stellajga ko'taradi — qo'l modellarida 1,6 m gacha." },
      ],
    },
  },

  "elektr-shtabelerlar": {
    ru: {
      h1: "Штабелеры электрические (электроштабелеры)",
      sections: [
        {
          h2: "Полуавтомат, автомат и самоходный штабелер",
          ul: [
            "Полуавтоматический (полуэлектрический) — вилы поднимает электромотор, а штабелер везут вручную. Модели на 2 т с подъёмом 1,6 и 3 м.",
            "Автоматический — электрический подъём и электрический ход. Модель на 2 т с подъёмом 3,5 м.",
            "Самоходный — для больших складов и частой работы: 2 т, подъём до 4,5 м.",
            "NIULI CTQB — 1–1,5 т, подъём 1,6–3,5 м, с аккумулятором.",
          ],
        },
        {
          h2: "Как выбрать электроштабелер",
          ul: [
            "Высота подъёма — на 10–20 см выше верхнего яруса стеллажа.",
            "Грузоподъёмность на высоте ниже, чем у пола: смотрите таблицу нагрузки в карточке.",
            "Сколько паллет в день: до 20–30 хватит полуавтомата, больше — берите самоходный.",
            "Ширина проходов между стеллажами — штабелеру нужно место для разворота.",
          ],
        },
      ],
      faq: [
        { q: "Сколько работает аккумулятор?", a: "Обычно одну рабочую смену; точное время зависит от модели, веса паллет и числа подъёмов. Ёмкость аккумулятора указана в характеристиках товара." },
        { q: "Чем штабелер отличается от погрузчика?", a: "Штабелер поднимает паллеты на стеллаж и работает на ровном полу склада. Погрузчик рассчитан на более тяжёлые грузы и работу на улице." },
      ],
    },
    uz: {
      h1: "Elektr shtabelerlar (elektroshtabeler)",
      sections: [
        {
          h2: "Yarim avtomat, avtomat va o'zi yuradigan shtabeler",
          ul: [
            "Yarim avtomat — vilkalarni elektr motor ko'taradi, shtabeler qo'lda suriladi. 2 t, 1,6 va 3 m ko'tarish.",
            "Avtomat — elektr ko'tarish va elektr yurish. 2 t, 3,5 m ko'tarish.",
            "O'zi yuradigan — katta omborlar va tez-tez ishlash uchun: 2 t, 4,5 m gacha ko'tarish.",
            "NIULI CTQB — 1–1,5 t, 1,6–3,5 m ko'tarish, akkumulyatorli.",
          ],
        },
        {
          h2: "Elektr shtabelerni qanday tanlash kerak",
          ul: [
            "Ko'tarish balandligi — stellajning yuqori qavatidan 10–20 sm baland.",
            "Balandlikda yuk ko'tarish poldagidan kam: kartochkadagi yuk jadvaliga qarang.",
            "Kuniga qancha palet: 20–30 tagacha yarim avtomat yetadi, ko'proq bo'lsa — o'zi yuradiganini oling.",
            "Stellajlar orasidagi o'tish kengligi — shtabelerga burilish uchun joy kerak.",
          ],
        },
      ],
      faq: [
        { q: "Akkumulyator qancha ishlaydi?", a: "Odatda bitta ish smenasi; aniq vaqt model, palet og'irligi va ko'tarishlar soniga bog'liq. Akkumulyator sig'imi mahsulot xususiyatlarida ko'rsatilgan." },
        { q: "Shtabeler va pogruzchik farqi nima?", a: "Shtabeler paletni stellajga ko'taradi va tekis ombor polida ishlaydi. Pogruzchik (yuk ortgich) og'irroq yuk va ko'chada ishlash uchun mo'ljallangan." },
      ],
    },
  },

  "pol-yuvish-mashinalari": {
    ru: {
      h1: "Поломоечные машины (поломойки)",
      sections: [
        {
          h2: "Какие модели есть",
          ul: [
            "Компактная G15 (ширина 330 мм) — для магазинов, офисов и узких проходов.",
            "BISON E60 (550 мм) и E100 (650 мм, 2 щётки) — для складов, цехов, супермаркетов; оператор идёт за машиной.",
            "G150 (860 мм) и BISON E130 (880 мм) — с сиденьем оператора, для больших площадей и паркингов.",
          ],
        },
        {
          h2: "Как выбрать поломоечную машину",
          ul: [
            "Площадь: до 1000 м² — компактная или ручная, 1000–3000 м² — 550–650 мм, больше — с сиденьем.",
            "Ширина проходов между стеллажами и кассами.",
            "Время работы от аккумулятора — на одну уборку без подзарядки.",
            "Тип пола: плитка, бетон, наливной пол — под него подбирают щётку или пад.",
          ],
        },
      ],
      faq: [
        { q: "Поломойка и поломоечная машина — это одно и то же?", a: "Да. Поломойка, поломоечная машина и скраббер — машина, которая моет пол щёткой с моющим раствором и сразу собирает грязную воду." },
      ],
    },
    uz: {
      h1: "Pol yuvish mashinalari (polomoyka)",
      sections: [
        {
          h2: "Qanday modellar bor",
          ul: [
            "Ixcham G15 (kengligi 330 mm) — do'konlar, ofislar va tor yo'laklar uchun.",
            "BISON E60 (550 mm) va E100 (650 mm, 2 cho'tka) — omborlar, sexlar, supermarketlar uchun; operator orqasidan yuradi.",
            "G150 (860 mm) va BISON E130 (880 mm) — operator o'rindig'i bilan, katta maydonlar va parkinglar uchun.",
          ],
        },
        {
          h2: "Pol yuvish mashinasini qanday tanlash kerak",
          ul: [
            "Maydon: 1000 m² gacha — ixcham, 1000–3000 m² — 550–650 mm, undan katta — o'rindiqli.",
            "Stellajlar va kassalar orasidagi yo'lak kengligi.",
            "Akkumulyatordan ishlash vaqti — bitta tozalashga qayta zaryadsiz yetishi kerak.",
            "Pol turi: kafel, beton, quyma pol — cho'tka yoki pad shunga qarab tanlanadi.",
          ],
        },
      ],
      faq: [
        { q: "Polomoyka va pol yuvish mashinasi — bir narsami?", a: "Ha. Polomoyka, pol yuvish mashinasi va skrabber — polni cho'tka va yuvish eritmasi bilan yuvib, iflos suvni darhol yig'ib oladigan mashina." },
      ],
    },
  },

  "supurish-mashinalari": {
    ru: {
      h1: "Подметальные машины для улицы и склада",
      sections: [
        {
          h2: "Какие модели есть",
          ul: [
            "С сиденьем оператора: DETANFU T-1250A (1250 мм) и G1350 (1350 мм) — склады, парковки, территории заводов.",
            "С кабиной: DETANFU T-GL10 (1900 мм) и G2000 (2000 мм) — улицы, большие площадки, работа в любую погоду.",
          ],
        },
        {
          h2: "Как выбрать подметальную машину",
          ul: [
            "Ширина уборки и площадь — сколько м² нужно убрать за смену.",
            "Улица или помещение: на улице удобнее кабина, в цехе — компактная модель.",
            "Объём бункера — как часто придётся его выгружать.",
            "Пыль: для цехов нужна машина с фильтром и пылеподавлением.",
          ],
        },
      ],
      faq: [
        { q: "Чем подметальная машина отличается от поломоечной?", a: "Подметальная собирает мусор и пыль щётками в бункер, без воды. Поломоечная моет пол раствором и собирает грязную воду. На складах часто нужны обе." },
      ],
    },
    uz: {
      h1: "Ko'cha va ombor uchun supurish mashinalari",
      sections: [
        {
          h2: "Qanday modellar bor",
          ul: [
            "Operator o'rindig'i bilan: DETANFU T-1250A (1250 mm) va G1350 (1350 mm) — omborlar, avtoturargohlar, zavod hududlari.",
            "Kabinali: DETANFU T-GL10 (1900 mm) va G2000 (2000 mm) — ko'chalar, katta maydonlar, har qanday ob-havoda ishlash.",
          ],
        },
        {
          h2: "Supurish mashinasini qanday tanlash kerak",
          ul: [
            "Supurish kengligi va maydon — bir smenada necha m² tozalash kerak.",
            "Ko'cha yoki bino ichi: ko'chada kabina qulay, sexda — ixcham model.",
            "Bunker hajmi — uni qanchalik tez-tez bo'shatish kerak bo'ladi.",
            "Chang: sexlar uchun filtrli va chang bosuvchi mashina kerak.",
          ],
        },
      ],
      faq: [
        { q: "Supurish mashinasi pol yuvish mashinasidan nimasi bilan farq qiladi?", a: "Supurish mashinasi axlat va changni cho'tkalar bilan bunkerga yig'adi, suvsiz. Pol yuvish mashinasi polni eritma bilan yuvadi va iflos suvni yig'adi." },
      ],
    },
  },

  "sanoat-changyutgichlari": {
    ru: {
      h1: "Промышленные и строительные пылесосы",
      sections: [
        {
          h2: "Какие модели есть",
          ul: [
            "BISON EVC2001 — 20 л, 1000 Вт: мастерские, небольшие объекты, автосервис.",
            "BISON EVC6002 — 60 л, 2 мотора по 1000 Вт: стройка, цех, клининг.",
            "BISON EVC8003 — 80 л, 3 мотора по 1000 Вт: большие объёмы мусора и воды.",
            "Все модели — для сухой и влажной уборки: собирают пыль, мусор и воду.",
          ],
        },
        {
          h2: "Как выбрать строительный пылесос",
          ul: [
            "Объём бака: 20 л — для мелких работ, 60–80 л — для стройки и цеха.",
            "Число моторов — сила всасывания для тяжёлого мусора и воды.",
            "Для бетонной и гипсовой пыли меняйте и чистите фильтр чаще.",
          ],
        },
      ],
      faq: [
        { q: "Можно ли собирать воду промышленным пылесосом?", a: "Да, пылесосы BISON EVC рассчитаны на сухую и влажную уборку: они собирают и пыль, и воду." },
      ],
    },
    uz: {
      h1: "Sanoat va qurilish changyutgichlari",
      sections: [
        {
          h2: "Qanday modellar bor",
          ul: [
            "BISON EVC2001 — 20 l, 1000 Vt: ustaxonalar, kichik obyektlar, avtoservis.",
            "BISON EVC6002 — 60 l, 2 ta 1000 Vt motor: qurilish, sex, klining.",
            "BISON EVC8003 — 80 l, 3 ta 1000 Vt motor: ko'p axlat va suv uchun.",
            "Hammasi quruq va nam tozalash uchun: chang, axlat va suvni yig'adi.",
          ],
        },
        {
          h2: "Qurilish changyutgichini qanday tanlash kerak",
          ul: [
            "Bak hajmi: 20 l — kichik ishlar uchun, 60–80 l — qurilish va sex uchun.",
            "Motorlar soni — og'ir axlat va suvni so'rish kuchi.",
            "Beton va gips changi uchun filtrni tez-tez tozalang va almashtiring.",
          ],
        },
      ],
      faq: [
        { q: "Sanoat changyutgichi bilan suv yig'ish mumkinmi?", a: "Ha, BISON EVC changyutgichlari quruq va nam tozalash uchun: chang va suvni ham yig'adi." },
      ],
    },
  },

  "generatorlar": {
    ru: {
      h1: "Генераторы бензиновые для дома, дачи и стройки",
      sections: [
        {
          h2: "Генератор на 3, 5, 8 и 10 кВт",
          ul: [
            "До 1 кВт — BISON BS950 (0,65 кВт): свет, телефон, ноутбук.",
            "2–3,5 кВт — BISON, SDL и XS на 3 кВт: холодильник, освещение, насос, электроинструмент.",
            "5–6 кВт — SDL и XS на 5 кВт, XS на 6 кВт: дом целиком, кондиционер, бойлер.",
            "7,5–9,5 кВт — BISON до 9,5 кВт, SDL и XS на 8 кВт: большой дом, магазин, стройка.",
            "Многие модели есть в версии с электростартером — запуск кнопкой или ключом.",
          ],
        },
        {
          h2: "Как рассчитать мощность генератора",
          ul: [
            "Сложите мощность всех приборов, которые будут работать одновременно, и добавьте 20–30 % запаса.",
            "Насосы, холодильники и кондиционеры при запуске берут в 2–3 раза больше — учитывайте их пусковую мощность.",
            "Для котлов, компьютеров и электроники лучше инверторный генератор: у него стабильное напряжение.",
            "Для работы по многу часов подряд выгоднее дизельный генератор.",
          ],
        },
      ],
      faq: [
        { q: "Какой генератор нужен для дома?", a: "Для частного дома обычно хватает 5–8 кВт: свет, холодильник, насос и кондиционер. Сложите мощность приборов, которые работают одновременно, и добавьте запас 20–30 %." },
        { q: "Чем бензиновый генератор отличается от инверторного?", a: "Обычный бензиновый генератор дешевле и подходит для света, насосов и инструмента. Инверторный выдаёт стабильное напряжение для электроники, тише и экономичнее при малой нагрузке." },
      ],
    },
    uz: {
      h1: "Benzinli generatorlar — uy, dacha va qurilish uchun",
      sections: [
        {
          h2: "3, 5, 8 va 10 kVt generator",
          ul: [
            "1 kVt gacha — BISON BS950 (0,65 kVt): chiroq, telefon, noutbuk.",
            "2–3,5 kVt — BISON, SDL va XS 3 kVt: muzlatkich, yoritish, nasos, elektr asboblar.",
            "5–6 kVt — SDL va XS 5 kVt, XS 6 kVt: butun uy, konditsioner, boyler.",
            "7,5–9,5 kVt — BISON 9,5 kVt gacha, SDL va XS 8 kVt: katta uy, do'kon, qurilish.",
            "Ko'p modellar elektr starterli variantda ham bor — tugma yoki kalit bilan yoqiladi.",
          ],
        },
        {
          h2: "Generator quvvatini qanday hisoblash kerak",
          ul: [
            "Bir vaqtda ishlaydigan barcha asboblar quvvatini qo'shing va 20–30 % zaxira qo'shing.",
            "Nasos, muzlatkich va konditsioner yoqilganda 2–3 baravar ko'p quvvat oladi — buni hisobga oling.",
            "Qozon, kompyuter va elektronika uchun invertorli generator yaxshiroq: kuchlanishi barqaror.",
            "Ko'p soat uzluksiz ishlash uchun dizel generator tejamliroq.",
          ],
        },
      ],
      faq: [
        { q: "Uy uchun qanday generator kerak?", a: "Xususiy uy uchun odatda 5–8 kVt yetadi: chiroq, muzlatkich, nasos va konditsioner. Bir vaqtda ishlaydigan asboblar quvvatini qo'shing va 20–30 % zaxira qo'shing." },
        { q: "Benzinli generator invertorlidan nimasi bilan farq qiladi?", a: "Oddiy benzinli generator arzonroq va chiroq, nasos, asboblar uchun mos. Invertorli generator elektronika uchun barqaror kuchlanish beradi, jimroq va kam yukda tejamliroq." },
      ],
    },
  },

  "invertorli-generatorlar": {
    ru: {
      h1: "Инверторные генераторы — тихие, для дома и электроники",
      sections: [
        {
          h2: "Какие модели есть",
          ul: [
            "Тихие в кожухе: BISON BS2000iS (1,8 кВт), BS2500iS (2,3 кВт), BS6250iE (5 кВт).",
            "Компактный BISON BS1500i (0,9 кВт) — для дачи, рыбалки, торговой точки.",
            "Открытая рама: BISON 3–5 кВт и XS на 3 и 5 кВт — дом, магазин, кафе.",
            "На колёсах: BISON BS10500i (8 кВт) и BS12500i (10 кВт) — большой дом, офис.",
          ],
        },
        {
          h2: "Зачем нужен инверторный генератор",
          ul: [
            "Стабильное напряжение — безопасно для газового котла, компьютера, телевизора, холодильника с инвертором.",
            "Работает тише обычного и расходует меньше топлива, когда нагрузка небольшая.",
            "Мощность выбирают так же, как у обычного генератора: сумма приборов плюс 20–30 % запаса.",
          ],
        },
      ],
      faq: [
        { q: "Подходит ли инверторный генератор для газового котла?", a: "Да, котлам с электроникой нужен инверторный генератор: он выдаёт ровное напряжение без скачков." },
      ],
    },
    uz: {
      h1: "Invertorli generatorlar — jim, uy va elektronika uchun",
      sections: [
        {
          h2: "Qanday modellar bor",
          ul: [
            "Korpusli jim modellar: BISON BS2000iS (1,8 kVt), BS2500iS (2,3 kVt), BS6250iE (5 kVt).",
            "Ixcham BISON BS1500i (0,9 kVt) — dacha, baliq ovi, savdo nuqtasi uchun.",
            "Ochiq rama: BISON 3–5 kVt va XS 3 va 5 kVt — uy, do'kon, kafe.",
            "G'ildirakli: BISON BS10500i (8 kVt) va BS12500i (10 kVt) — katta uy, ofis.",
          ],
        },
        {
          h2: "Invertorli generator nima uchun kerak",
          ul: [
            "Barqaror kuchlanish — gaz qozoni, kompyuter, televizor, invertorli muzlatkich uchun xavfsiz.",
            "Oddiyidan jimroq ishlaydi va kam yukda yoqilg'ini kamroq sarflaydi.",
            "Quvvat oddiy generator kabi tanlanadi: asboblar yig'indisi va 20–30 % zaxira.",
          ],
        },
      ],
      faq: [
        { q: "Invertorli generator gaz qozoni uchun mos keladimi?", a: "Ha, elektronikali qozonlarga invertorli generator kerak: u sakrashlarsiz tekis kuchlanish beradi." },
      ],
    },
  },

  "dizel-generatorlar": {
    ru: {
      h1: "Дизельные генераторы (дизель-генераторы)",
      sections: [
        {
          h2: "Какие модели есть",
          ul: [
            "Открытые с электростартером: BISON от 2,8 до 11 кВА.",
            "В шумозащитном кожухе: BISON от 4,5 до 11 кВА — для дома, офиса и магазина, где важна тишина.",
            "Двухцилиндровые BISON на 9 и 11 кВА — для долгой работы под нагрузкой.",
            "XS на 8 и 10 кВт — в однофазной версии на 220 В и в версии с равной номинальной и максимальной мощностью.",
          ],
        },
        {
          h2: "Когда выбирать дизельный генератор",
          ul: [
            "Если генератор работает много часов подряд — дизель расходует меньше топлива, чем бензиновый.",
            "Для стройки, фермы, магазина и резервного питания дома.",
            "Мощность в кВА: кВт ≈ кВА × 0,8. Сложите мощность приборов и добавьте 20–30 % запаса.",
          ],
        },
      ],
      faq: [
        { q: "Что значит кВА и как перевести в кВт?", a: "кВА — полная мощность генератора. Для расчёта нагрузки умножьте её на 0,8: генератор на 10 кВА даёт около 8 кВт." },
      ],
    },
    uz: {
      h1: "Dizel generatorlar",
      sections: [
        {
          h2: "Qanday modellar bor",
          ul: [
            "Elektr starterli ochiq modellar: BISON 2,8 dan 11 kVA gacha.",
            "Shovqindan himoya korpusida: BISON 4,5 dan 11 kVA gacha — jimlik muhim bo'lgan uy, ofis va do'kon uchun.",
            "Ikki silindrli BISON 9 va 11 kVA — yuk ostida uzoq ishlash uchun.",
            "XS 8 va 10 kVt — 220 V bir fazali va nominal va maksimal quvvati teng versiyalarda.",
          ],
        },
        {
          h2: "Dizel generatorni qachon tanlash kerak",
          ul: [
            "Generator ko'p soat uzluksiz ishlasa — dizel benzinlidan kam yoqilg'i sarflaydi.",
            "Qurilish, ferma, do'kon va uyni zaxira elektr bilan ta'minlash uchun.",
            "Quvvat kVA da: kVt ≈ kVA × 0,8. Asboblar quvvatini qo'shing va 20–30 % zaxira qo'shing.",
          ],
        },
      ],
      faq: [
        { q: "kVA nima va kVt ga qanday o'tkaziladi?", a: "kVA — generatorning to'liq quvvati. Yukni hisoblash uchun uni 0,8 ga ko'paytiring: 10 kVA generator taxminan 8 kVt beradi." },
      ],
    },
  },

  "payvandlash-generatorlari": {
    ru: {
      h1: "Сварочные генераторы (генератор-сварка)",
      sections: [
        {
          h2: "Генератор и сварка в одном аппарате",
          p: "Бензиновые инверторные генераторы-сварка BISON BS2500iw (2 кВт), BS3500iw (3 кВт) и BS4500iw (4 кВт) дают ток для сварки и электричество для инструмента там, где нет сети: на стройке, в поле, на ферме.",
        },
        {
          h2: "Как выбрать",
          ul: [
            "Сварочный ток — под диаметр электродов, которыми вы работаете.",
            "Мощность генератора — если одновременно нужны болгарка, свет или насос.",
            "Инверторная схема даёт ровную дугу и стабильное напряжение для инструмента.",
          ],
        },
      ],
      faq: [
        { q: "Можно ли от сварочного генератора питать дом?", a: "Да, в режиме генератора он выдаёт 220 В для освещения и инструмента в пределах своей мощности." },
      ],
    },
    uz: {
      h1: "Payvandlash generatorlari (generator-svarka)",
      sections: [
        {
          h2: "Generator va svarka bitta apparatda",
          p: "Benzinli invertorli generator-svarkalar BISON BS2500iw (2 kVt), BS3500iw (3 kVt) va BS4500iw (4 kVt) tarmoq yo'q joyda — qurilishda, dalada, fermada — payvandlash toki va asboblar uchun elektr beradi.",
        },
        {
          h2: "Qanday tanlash kerak",
          ul: [
            "Payvandlash toki — ishlatadigan elektrodlaringiz diametriga qarab.",
            "Generator quvvati — bir vaqtda bolgarka, chiroq yoki nasos kerak bo'lsa.",
            "Invertor sxemasi tekis yoy va asboblar uchun barqaror kuchlanish beradi.",
          ],
        },
      ],
      faq: [
        { q: "Svarka generatoridan uyni elektr bilan ta'minlash mumkinmi?", a: "Ha, generator rejimida u o'z quvvati doirasida yoritish va asboblar uchun 220 V beradi." },
      ],
    },
  },

  "motoblok-va-kultivatorlar": {
    ru: {
      h1: "Мотоблоки и культиваторы",
      sections: [
        {
          h2: "Какие модели есть",
          ul: [
            "Бензиновые мотоблоки BISON 4 кВт — с фрезами, в том числе с задними фрезами (BS3TGQ-4G-1) и шириной обработки 950 мм (BS950FG-Z).",
            "Дизельный мотоблок BISON BS1050FD (4 кВт, 1000 мм) — для тяжёлой земли и долгой работы.",
            "Мотокультиваторы BISON BS450FG (3,1 кВт) и BS1G-80-2 (4 кВт) — огород, теплица, дача.",
            "Дизельный мини-трактор-культиватор BISON BS-002 с полным приводом — фермы и большие участки.",
            "Почвофреза для трактора RX220H — навесная, от вала отбора мощности; другие размеры серии RX — по запросу.",
          ],
        },
        {
          h2: "Мотоблок или культиватор",
          ul: [
            "Культиватор — только рыхлит землю: огород до 10–15 соток.",
            "Мотоблок — пашет, культивирует, работает с навесным оборудованием и прицепом.",
            "Дизельный мотоблок экономичнее на большой площади, бензиновый — легче и дешевле.",
          ],
        },
      ],
      faq: [
        { q: "Чем мотоблок отличается от культиватора?", a: "Культиватор только рыхлит почву. Мотоблок мощнее: к нему подключают плуг, косилку, прицеп и другое навесное оборудование." },
      ],
    },
    uz: {
      h1: "Motobloklar va kultivatorlar",
      sections: [
        {
          h2: "Qanday modellar bor",
          ul: [
            "Benzinli motobloklar BISON 4 kVt — frezali, shu jumladan orqa frezali (BS3TGQ-4G-1) va 950 mm ishlov kengligi bilan (BS950FG-Z).",
            "Dizel motoblok BISON BS1050FD (4 kVt, 1000 mm) — og'ir yer va uzoq ishlash uchun.",
            "Motokultivatorlar BISON BS450FG (3,1 kVt) va BS1G-80-2 (4 kVt) — tomorqa, issiqxona, dacha.",
            "To'liq yuritmali dizel mini-traktor-kultivator BISON BS-002 — fermalar va katta yerlar uchun.",
            "Traktor uchun tuproq frezasi RX220H — osma, VOM orqali ishlaydi; RX seriyasining boshqa o'lchamlari — so'rov bo'yicha.",
          ],
        },
        {
          h2: "Motoblok yoki kultivator",
          ul: [
            "Kultivator — faqat yerni yumshatadi: 10–15 sotixgacha tomorqa.",
            "Motoblok — haydaydi, kultivatsiya qiladi, osma uskunalar va pritsep bilan ishlaydi.",
            "Katta maydonda dizel motoblok tejamliroq, benzinli — yengilroq va arzonroq.",
          ],
        },
      ],
      faq: [
        { q: "Motoblok kultivatordan nimasi bilan farq qiladi?", a: "Kultivator faqat tuproqni yumshatadi. Motoblok kuchliroq: unga plug, o'roq, pritsep va boshqa osma uskunalar ulanadi." },
      ],
    },
  },

  "yuqori-bosimli-yuvish-apparatlari": {
    ru: {
      h1: "Мойки высокого давления (керхер, минимойка)",
      sections: [
        {
          h2: "Электрические, бензиновые и дизельные мойки",
          ul: [
            "Электрические BISON 100–190 бар — для автомобиля, дома, двора, автомойки и кондиционеров; работают от розетки.",
            "Бензиновые BISON 170–250 бар — там, где нет электричества: стройка, ферма, техника.",
            "Дизельные BISON 200–250 бар — для долгой ежедневной работы.",
            "Промышленные бензиновые и дизельные, в том числе сверхвысокого давления, — для очистки техники, бетона и оборудования.",
          ],
        },
        {
          h2: "Как выбрать мойку высокого давления",
          ul: [
            "Давление: 100–130 бар — машина и двор, 150–190 бар — автомойка и техника, от 200 бар — стройка и промышленность.",
            "Расход воды (л/мин) — чем больше, тем быстрее смывается грязь.",
            "Помпа: латунная служит дольше алюминиевой при ежедневной работе.",
            "Для автомойки берите модель, рассчитанную на работу по многу часов, и пенную насадку.",
          ],
        },
      ],
      faq: [
        { q: "Керхер и мойка высокого давления — это одно и то же?", a: "Да. «Керхер» — привычное название любой мойки высокого давления по имени известного бренда. На сайте мойки BISON — электрические, бензиновые и дизельные." },
        { q: "Какое давление нужно для мойки автомобиля?", a: "Для легкового автомобиля достаточно 100–150 бар. Для автомойки, грузовиков и техники берите 160–200 бар и больше." },
      ],
    },
    uz: {
      h1: "Yuqori bosimli yuvish apparatlari (karcher, moyka)",
      sections: [
        {
          h2: "Elektr, benzinli va dizel moykalar",
          ul: [
            "Elektr BISON 100–190 bar — avtomobil, uy, hovli, avtomoyka va konditsionerlar uchun; rozetkadan ishlaydi.",
            "Benzinli BISON 170–250 bar — elektr yo'q joyda: qurilish, ferma, texnika.",
            "Dizel BISON 200–250 bar — har kungi uzoq ishlash uchun.",
            "Sanoat benzinli va dizel, shu jumladan o'ta yuqori bosimli — texnika, beton va uskunalarni tozalash uchun.",
          ],
        },
        {
          h2: "Moykani qanday tanlash kerak",
          ul: [
            "Bosim: 100–130 bar — mashina va hovli, 150–190 bar — avtomoyka va texnika, 200 bardan — qurilish va sanoat.",
            "Suv sarfi (l/min) — qancha ko'p bo'lsa, kir shuncha tez yuviladi.",
            "Pompa: har kuni ishlaganda latun pompa alyuminiydan uzoqroq xizmat qiladi.",
            "Avtomoyka uchun ko'p soat ishlashga mo'ljallangan model va ko'pik nasadkasini oling.",
          ],
        },
      ],
      faq: [
        { q: "Karcher va yuqori bosimli moyka — bir narsami?", a: "Ha. «Karcher» (kerxer) — har qanday yuqori bosimli yuvish apparatining mashhur brend nomidan olingan odatiy nomi. Saytda BISON moykalari — elektr, benzinli va dizel." },
        { q: "Mashina yuvish uchun qanday bosim kerak?", a: "Yengil avtomobil uchun 100–150 bar yetadi. Avtomoyka, yuk mashinalari va texnika uchun 160–200 bar va undan ko'pini oling." },
      ],
    },
  },

  "yuvish-apparati-nasoslari": {
    ru: {
      h1: "Насосы (помпы) для моек высокого давления",
      sections: [
        {
          h2: "Аксиальные и плунжерные насосы",
          ul: [
            "Аксиальные BISON BS-P170 (190 бар) и BS-P180 (200 бар) — компактные, для бытовых и полупрофессиональных моек.",
            "Плунжерные BISON BS-PE (200–275 бар, 12,6–15 л/мин) — для электрических профессиональных моек.",
            "Плунжерные BISON BS-PG (220–275 бар, 15–18 л/мин) — для бензиновых моек и автомоек.",
          ],
        },
        {
          h2: "Как подобрать насос",
          ul: [
            "Давление и расход — как у вашей мойки или чуть выше.",
            "Обороты и вал — под ваш двигатель или электромотор.",
            "Плунжерный насос дольше служит при ежедневной работе.",
          ],
        },
      ],
      faq: [
        { q: "Помпа и насос для мойки — это одно и то же?", a: "Да, помпой называют насос высокого давления в мойке. Он создаёт давление воды." },
      ],
    },
    uz: {
      h1: "Yuqori bosimli moykalar uchun nasoslar (pompa)",
      sections: [
        {
          h2: "Aksial va plunjerli nasoslar",
          ul: [
            "Aksial BISON BS-P170 (190 bar) va BS-P180 (200 bar) — ixcham, maishiy va yarim professional moykalar uchun.",
            "Plunjerli BISON BS-PE (200–275 bar, 12,6–15 l/min) — elektr professional moykalar uchun.",
            "Plunjerli BISON BS-PG (220–275 bar, 15–18 l/min) — benzinli moykalar va avtomoykalar uchun.",
          ],
        },
        {
          h2: "Nasosni qanday tanlash kerak",
          ul: [
            "Bosim va sarf — moykangiznikidek yoki biroz yuqori.",
            "Aylanish va val — dvigatelingiz yoki elektr motoringizga mos.",
            "Har kungi ishda plunjerli nasos uzoqroq xizmat qiladi.",
          ],
        },
      ],
      faq: [
        { q: "Moyka pompasi va nasosi — bir narsami?", a: "Ha, moykadagi yuqori bosimli nasos pompa deb ataladi. U suv bosimini hosil qiladi." },
      ],
    },
  },

  "yuvish-apparati-aksessuarlari": {
    ru: {
      h1: "Аксессуары для моек высокого давления",
      sections: [
        {
          h2: "Что есть в наличии",
          ul: [
            "Пистолеты BISON на 210 и 275 бар.",
            "Шланги высокого давления Ø6 и Ø8 мм, от 1500 до 3600 psi.",
            "Пенные насадки (пеногенераторы) 900 и 1000 мл и садовый пенный распылитель.",
            "Насадки для мойки поверхностей 13–24″ — плитка, брусчатка, полы.",
            "Насадки для мойки днища автомобиля, набор сопел (0°, 15°, 25°, 40°), насадка 6-в-1, телескопическая штанга, пескоструйный комплект.",
          ],
        },
        {
          h2: "Как подобрать аксессуар",
          ul: [
            "Рабочее давление аксессуара должно быть не ниже давления мойки.",
            "Проверьте резьбу или быстросъёмное соединение вашей мойки.",
            "Для автомойки нужны пенная насадка и шланг длиннее стандартного.",
          ],
        },
      ],
      faq: [
        { q: "Подойдёт ли пенная насадка к моей мойке?", a: "Сверьте тип соединения и давление в карточке товара. Если сомневаетесь, напишите модель мойки — подскажем." },
      ],
    },
    uz: {
      h1: "Yuqori bosimli moykalar uchun aksessuarlar",
      sections: [
        {
          h2: "Nimalar bor",
          ul: [
            "BISON pistoletlari 210 va 275 bar.",
            "Yuqori bosimli shlanglar Ø6 va Ø8 mm, 1500 dan 3600 psi gacha.",
            "Ko'pik nasadkalari (penogenerator) 900 va 1000 ml va bog' ko'pik purkagichi.",
            "Yuzalarni yuvish nasadkalari 13–24″ — kafel, bruschatka, pollar.",
            "Avtomobil tagini yuvish nasadkalari, soplolar to'plami (0°, 15°, 25°, 40°), 6-in-1 nasadka, teleskopik shtanga, peskostruy to'plami.",
          ],
        },
        {
          h2: "Aksessuarni qanday tanlash kerak",
          ul: [
            "Aksessuarning ish bosimi moyka bosimidan past bo'lmasligi kerak.",
            "Moykangizning rezbasi yoki tez ulanish turini tekshiring.",
            "Avtomoyka uchun ko'pik nasadkasi va uzunroq shlang kerak.",
          ],
        },
      ],
      faq: [
        { q: "Ko'pik nasadkasi moykamga mos keladimi?", a: "Mahsulot kartochkasida ulanish turi va bosimni solishtiring. Ikkilansangiz, moyka modelini yozing — yordam beramiz." },
      ],
    },
  },

  "beton-silliqlash-mashinalari": {
    ru: {
      h1: "Затирочные машины по бетону (вертолёт)",
      sections: [
        {
          h2: "Какие модели есть",
          ul: [
            "Бензиновые XS на 60, 90 и 100 см, в том числе усиленные 90 и 100 см.",
            "Кромочная XS 60 см — для краёв, углов и вокруг колонн.",
            "Бензиновые BISON BSH80, BSH90, BSH100 (780–960 мм).",
            "Двухроторные с сиденьем оператора — для больших площадей.",
          ],
        },
        {
          h2: "Как выбрать затирочную машину",
          ul: [
            "60 см — небольшие комнаты, края и узкие места; 90–100 см — основной размер для пола и стяжки.",
            "Двухроторная с сиденьем окупается на площадях от нескольких тысяч м².",
            "Для топпинга и упрочнённого пола нужна машина с регулировкой угла лопастей и диском.",
          ],
        },
      ],
      faq: [
        { q: "Что такое вертолёт для бетона?", a: "Так называют затирочную машину по бетону: вращающиеся лопасти выравнивают и уплотняют поверхность свежего бетонного пола." },
      ],
    },
    uz: {
      h1: "Beton zatirka mashinalari (vertolyot)",
      sections: [
        {
          h2: "Qanday modellar bor",
          ul: [
            "Benzinli XS 60, 90 va 100 sm, shu jumladan kuchaytirilgan 90 va 100 sm.",
            "Chekka XS 60 sm — chekkalar, burchaklar va ustunlar atrofi uchun.",
            "Benzinli BISON BSH80, BSH90, BSH100 (780–960 mm).",
            "Operator o'rindig'i bilan ikki rotorli — katta maydonlar uchun.",
          ],
        },
        {
          h2: "Zatirka mashinasini qanday tanlash kerak",
          ul: [
            "60 sm — kichik xonalar, chekkalar va tor joylar; 90–100 sm — pol va styajka uchun asosiy o'lcham.",
            "O'rindiqli ikki rotorli bir necha ming m² maydonlarda o'zini oqlaydi.",
            "Topping va mustahkamlangan pol uchun parrak burchagi rostlanadigan va diskli mashina kerak.",
          ],
        },
      ],
      faq: [
        { q: "Beton uchun vertolyot nima?", a: "Beton zatirka mashinasi shunday ataladi: aylanuvchi parraklar yangi beton pol yuzasini tekislaydi va zichlaydi." },
      ],
    },
  },

  "shov-kesgichlar": {
    ru: {
      h1: "Швонарезчики (нарезчики швов) по бетону и асфальту",
      sections: [
        {
          h2: "Какие модели есть",
          ul: [
            "Бензиновые XS, SDL и XS Weike — диск 500 мм.",
            "Дизельные SDL 188F, XS 190F и XS 192F — диск 500 мм, для долгой работы.",
            "Бензиновые BISON BSH500 на 13, 15 и 17 л.с. — диск до 500 мм.",
            "Алмазные диски 400 и 500 мм.",
          ],
        },
        {
          h2: "Как выбрать швонарезчик",
          ul: [
            "Глубина реза зависит от диаметра диска: 500 мм режет глубже, 400 мм — легче и дешевле.",
            "Дизель — для больших объёмов и ежедневной работы, бензин — для бригад и разовых работ.",
            "Для бетона и асфальта нужны разные алмазные диски — уточняйте при заказе.",
          ],
        },
      ],
      faq: [
        { q: "Швонарезчик, нарезчик швов и резчик швов — одно и то же?", a: "Да, это одна машина для нарезки деформационных швов и резки бетона и асфальта алмазным диском." },
      ],
    },
    uz: {
      h1: "Shov kesgichlar (shvonarezchik) — beton va asfalt uchun",
      sections: [
        {
          h2: "Qanday modellar bor",
          ul: [
            "Benzinli XS, SDL va XS Weike — 500 mm disk.",
            "Dizel SDL 188F, XS 190F va XS 192F — 500 mm disk, uzoq ishlash uchun.",
            "Benzinli BISON BSH500 13, 15 va 17 o.k. — 500 mm gacha disk.",
            "Olmosli disklar 400 va 500 mm.",
          ],
        },
        {
          h2: "Shov kesgichni qanday tanlash kerak",
          ul: [
            "Kesish chuqurligi disk diametriga bog'liq: 500 mm chuqurroq kesadi, 400 mm — yengilroq va arzonroq.",
            "Dizel — katta hajm va har kungi ish uchun, benzin — brigadalar va bir martalik ishlar uchun.",
            "Beton va asfalt uchun boshqa-boshqa olmosli disklar kerak — buyurtmada aniqlang.",
          ],
        },
      ],
      faq: [
        { q: "Shov kesgich va shvonarezchik — bir narsami?", a: "Ha, bu deformatsiya choklarini kesish va beton, asfaltni olmosli disk bilan kesish mashinasi." },
      ],
    },
  },

  "vibroplita-va-vibrotrambovkalar": {
    ru: {
      h1: "Виброплиты и вибротрамбовки",
      sections: [
        {
          h2: "Какие модели есть",
          ul: [
            "Бензиновые виброплиты SDL и XS C90T, BISON BSHC50 и BSHC80 — песок, щебень, тротуарная плитка.",
            "Реверсивная бензиновая виброплита XS 160 — тяжёлый грунт, ход вперёд и назад.",
            "Бензиновые вибротрамбовки XS 100, XS 125, BISON BSRM75 и BSRM80 — траншеи и узкие места.",
            "Электрические вибротрамбовки XS 100 и XS 125 на 220 и 380 В — работа в помещении и без выхлопа.",
          ],
        },
        {
          h2: "Виброплита или вибротрамбовка",
          ul: [
            "Виброплита — для широких площадей: основание под плитку, дорожки, площадки.",
            "Вибротрамбовка (трамбовка, «лягушка») — для траншей, колодцев и плотного грунта на глубину.",
            "Реверсивная плита нужна для глины и толстых слоёв.",
          ],
        },
      ],
      faq: [
        { q: "Какая виброплита нужна для тротуарной плитки?", a: "Для укладки плитки подходит лёгкая бензиновая виброплита (например, C90T) с резиновым ковриком, чтобы не повредить плитку." },
      ],
    },
    uz: {
      h1: "Vibroplitalar va vibrotrambovkalar",
      sections: [
        {
          h2: "Qanday modellar bor",
          ul: [
            "Benzinli vibroplitalar SDL va XS C90T, BISON BSHC50 va BSHC80 — qum, shag'al, trotuar plitkasi.",
            "Reversli benzinli vibroplita XS 160 — og'ir grunt, oldinga va orqaga yurish.",
            "Benzinli vibrotrambovkalar XS 100, XS 125, BISON BSRM75 va BSRM80 — transheyalar va tor joylar.",
            "Elektr vibrotrambovkalar XS 100 va XS 125, 220 va 380 V — bino ichida va tutunsiz ishlash.",
          ],
        },
        {
          h2: "Vibroplita yoki vibrotrambovka",
          ul: [
            "Vibroplita — keng maydonlar uchun: plitka asosi, yo'laklar, maydonchalar.",
            "Vibrotrambovka (trambovka) — transheya, quduq va gruntni chuqur zichlash uchun.",
            "Loy va qalin qatlamlar uchun reversli plita kerak.",
          ],
        },
      ],
      faq: [
        { q: "Trotuar plitkasi uchun qanday vibroplita kerak?", a: "Plitka yotqizish uchun rezina gilamchali yengil benzinli vibroplita (masalan, C90T) mos keladi — plitka shikastlanmaydi." },
      ],
    },
  },

  "armatura-dastgohlari": {
    ru: {
      h1: "Станки для гибки, резки и правки арматуры (арматурогибы)",
      sections: [
        {
          h2: "Какие станки есть",
          ul: [
            "Гибка арматуры: BL 40, XS 45 и XS 50 (усиленные), XS 45 и XS 50 с ЧПУ.",
            "Резка арматуры: BL 40, XS 45 и XS 50 (усиленные).",
            "Гибка хомутов: XS 20, XS 25, XS 28.",
            "Радиусная гибка XS 32 и гидравлический станок для правки арматуры XS 9 кВт.",
          ],
        },
        {
          h2: "Как выбрать станок",
          ul: [
            "Число в названии — максимальный диаметр арматуры в мм (например, 40 или 50).",
            "Усиленные модели — для ежедневной работы на заводах ЖБИ и больших стройках.",
            "ЧПУ запоминает углы гиба и ускоряет серийную работу.",
            "Для хомутов удобнее отдельный хомутогиб, чем большой станок.",
          ],
        },
      ],
      faq: [
        { q: "Какой станок нужен для арматуры 32 мм?", a: "Берите станок с запасом по диаметру — на 40, 45 или 50 мм: он работает с арматурой 32 мм без перегрузки." },
      ],
    },
    uz: {
      h1: "Armatura egish, kesish va to'g'rilash stanoklari",
      sections: [
        {
          h2: "Qanday stanoklar bor",
          ul: [
            "Armatura egish: BL 40, XS 45 va XS 50 (kuchaytirilgan), XS 45 va XS 50 CHPU bilan.",
            "Armatura kesish: BL 40, XS 45 va XS 50 (kuchaytirilgan).",
            "Xomut egish: XS 20, XS 25, XS 28.",
            "Radius egish XS 32 va gidravlik armatura to'g'rilash stanogi XS 9 kVt.",
          ],
        },
        {
          h2: "Stanokni qanday tanlash kerak",
          ul: [
            "Nomdagi raqam — armaturaning maksimal diametri mm da (masalan, 40 yoki 50).",
            "Kuchaytirilgan modellar — temir-beton zavodlari va katta qurilishlarda har kungi ish uchun.",
            "CHPU egish burchaklarini eslab qoladi va seriyali ishni tezlashtiradi.",
            "Xomut uchun alohida xomut egish stanogi qulayroq.",
          ],
        },
      ],
      faq: [
        { q: "32 mm armatura uchun qanday stanok kerak?", a: "Diametr bo'yicha zaxirali stanok oling — 40, 45 yoki 50 mm: u 32 mm armatura bilan ortiqcha yuklanmasdan ishlaydi." },
      ],
    },
  },

  "beton-frezalash-va-silliqlash": {
    ru: {
      h1: "Мозаично-шлифовальные и фрезеровальные машины по бетону",
      sections: [
        {
          h2: "Какие машины есть",
          ul: [
            "Мозаично-шлифовальные XS 350 (220 и 380 В) и XS 530 (380 В) — шлифовка бетона, мозаичных и наливных полов.",
            "Фрезеровальные XS 250, бензиновая и электрическая — снимают старое покрытие, разметку, неровности.",
            "Ножи (фрезы) и алмазные шлифовальные диски к машинам.",
          ],
        },
        {
          h2: "Как выбрать",
          ul: [
            "Шлифовка — для гладкого пола; фрезеровка — для удаления слоя и подготовки основания.",
            "380 В — для больших площадей и мощных машин; 220 В — где нет трёхфазной сети.",
            "Ширина обработки (350 или 530 мм) определяет скорость работы.",
          ],
        },
      ],
      faq: [
        { q: "Для чего нужна мозаично-шлифовальная машина?", a: "Она шлифует и полирует бетонные и мозаичные полы алмазными дисками: выравнивает поверхность и снимает верхний слой." },
      ],
    },
    uz: {
      h1: "Beton uchun mozaika-silliqlash va frezalash mashinalari",
      sections: [
        {
          h2: "Qanday mashinalar bor",
          ul: [
            "Mozaika-silliqlash XS 350 (220 va 380 V) va XS 530 (380 V) — beton, mozaika va quyma pollarni silliqlash.",
            "Frezalash XS 250, benzinli va elektr — eski qoplama, belgilar va notekisliklarni olib tashlaydi.",
            "Mashinalar uchun pichoqlar (freza) va olmosli silliqlash disklari.",
          ],
        },
        {
          h2: "Qanday tanlash kerak",
          ul: [
            "Silliqlash — tekis pol uchun; frezalash — qatlamni olib tashlash va asosni tayyorlash uchun.",
            "380 V — katta maydonlar va kuchli mashinalar uchun; 220 V — uch fazali tarmoq bo'lmasa.",
            "Ishlov kengligi (350 yoki 530 mm) ish tezligini belgilaydi.",
          ],
        },
      ],
      faq: [
        { q: "Mozaika-silliqlash mashinasi nima uchun kerak?", a: "U beton va mozaika pollarni olmosli disklar bilan silliqlaydi va jilolaydi: yuzani tekislaydi va yuqori qatlamni oladi." },
      ],
    },
  },

  "vibroreyka-va-beton-asboblari": {
    ru: {
      h1: "Виброрейки и инструмент для бетона",
      sections: [
        {
          h2: "Что есть в наличии",
          ul: [
            "Бензиновые виброрейки SDL и XS (нержавеющая сталь), в том числе с коротким валом.",
            "Электрическая виброрейка XS на 220 В и аккумуляторное виброправило 2-в-1.",
            "Алюминиевые профили для виброрейки от 1 до 6 м — подбираются под ширину захватки.",
            "Правило для бетона 3 м, гладилки 120×20, 120×30 см и малая, шлифовальные машины для стен.",
          ],
        },
        {
          h2: "Как выбрать виброрейку",
          ul: [
            "Длина профиля — по ширине заливаемой полосы между маяками.",
            "Бензиновая — для улицы и объектов без электричества; электрическая и аккумуляторная — для помещений.",
            "Для стяжки и тонких слоёв достаточно лёгкой рейки 2–3 м.",
          ],
        },
      ],
      faq: [
        { q: "Чем виброрейка отличается от обычного правила?", a: "Виброрейка вибрирует: она не только выравнивает, но и уплотняет бетон, выгоняя воздух. Обычное правило только выравнивает поверхность." },
      ],
    },
    uz: {
      h1: "Vibroreykalar va beton asboblari",
      sections: [
        {
          h2: "Nimalar bor",
          ul: [
            "Benzinli vibroreykalar SDL va XS (zanglamaydigan po'lat), qisqa valli variant ham bor.",
            "Elektr vibroreyka XS 220 V va akkumulyatorli vibropravilo 2-in-1.",
            "Vibroreyka uchun alyuminiy profillar 1 dan 6 m gacha — quyiladigan polosa kengligiga qarab.",
            "Beton uchun pravilo 3 m, gladilkalar 120×20, 120×30 sm va kichik, devor silliqlash mashinalari.",
          ],
        },
        {
          h2: "Vibroreykani qanday tanlash kerak",
          ul: [
            "Profil uzunligi — mayoqlar orasidagi quyiladigan polosa kengligiga qarab.",
            "Benzinli — ko'cha va elektrsiz obyektlar uchun; elektr va akkumulyatorli — bino ichi uchun.",
            "Styajka va yupqa qatlamlar uchun yengil 2–3 m reyka yetadi.",
          ],
        },
      ],
      faq: [
        { q: "Vibroreyka oddiy pravilodan nimasi bilan farq qiladi?", a: "Vibroreyka tebranadi: u betonni nafaqat tekislaydi, balki havoni chiqarib zichlaydi. Oddiy pravilo faqat yuzani tekislaydi." },
      ],
    },
  },

  "beton-vibratorlari": {
    ru: {
      h1: "Вибраторы для бетона (глубинные вибраторы)",
      sections: [
        {
          h2: "Какие вибраторы есть",
          ul: [
            "Глубинные вибраторы JG и XS 2,2 кВт на 220 В, XS 2,2 и 3 кВт на 380 В — колонны, плиты, фундаменты.",
            "Ручные вибраторы 900–2300 Вт — небольшие заливки, частный дом.",
            "Бензиновые приводы SDL 170F и BISON BS-VH (Honda GX160), ранцевый бензиновый вибратор — там, где нет электричества.",
            "Вибробулавы (валы) 1–4 м для ручных вибраторов и SDL Ø50 мм с валом от 4 до 12 м.",
          ],
        },
        {
          h2: "Как выбрать вибратор для бетона",
          ul: [
            "Диаметр булавы — под шаг арматуры: булава должна свободно проходить между прутьями.",
            "Длина вала — по высоте колонны или глубине заливки.",
            "220 В — для частных объектов, 380 В — для стройплощадок с трёхфазной сетью.",
          ],
        },
      ],
      faq: [
        { q: "Зачем нужен глубинный вибратор?", a: "Он уплотняет бетон внутри опалубки: выгоняет воздух, чтобы в колоннах и фундаменте не было пустот и раковин." },
      ],
    },
    uz: {
      h1: "Beton vibratorlari (chuqurlik vibratorlari)",
      sections: [
        {
          h2: "Qanday vibratorlar bor",
          ul: [
            "Chuqurlik vibratorlari JG va XS 2,2 kVt 220 V, XS 2,2 va 3 kVt 380 V — ustunlar, plitalar, poydevorlar.",
            "Qo'l vibratorlari 900–2300 Vt — kichik quyishlar, xususiy uy.",
            "Benzinli yuritmalar SDL 170F va BISON BS-VH (Honda GX160), ryukzak benzinli vibrator — elektr yo'q joyda.",
            "Qo'l vibratorlari uchun 1–4 m vibrobulava (val) va SDL Ø50 mm, val 4 dan 12 m gacha.",
          ],
        },
        {
          h2: "Beton vibratorini qanday tanlash kerak",
          ul: [
            "Bulava diametri — armatura qadamiga qarab: bulava sterjenlar orasidan bemalol o'tishi kerak.",
            "Val uzunligi — ustun balandligi yoki quyish chuqurligiga qarab.",
            "220 V — xususiy obyektlar uchun, 380 V — uch fazali tarmoqli qurilish maydonlari uchun.",
          ],
        },
      ],
      faq: [
        { q: "Chuqurlik vibratori nima uchun kerak?", a: "U qolip ichidagi betonni zichlaydi: ustun va poydevorda bo'shliq qolmasligi uchun havoni chiqaradi." },
      ],
    },
  },

  "motopompa-va-dvigatellar": {
    ru: {
      h1: "Мотопомпы бензиновые и дизельные",
      sections: [
        {
          h2: "Какие мотопомпы есть",
          ul: [
            "Для чистой воды: бензиновые BISON и SDL от 1,5 до 4 дюймов (12–100 м³/ч), дизельные BISON 2–4 дюйма.",
            "Высокого давления и высокого напора — полив, подача воды на высоту и на большое расстояние.",
            "Для грязной воды BISON BS30T и BS40T (3 и 4 дюйма) — откачка котлованов, подвалов, траншей.",
            "Для химии BISON BS20C и BS30C — удобрения и агрессивные жидкости.",
          ],
        },
        {
          h2: "Как выбрать мотопомпу",
          ul: [
            "Диаметр патрубка (дюймы) определяет производительность: 2″ — огород, 3–4″ — поле, котлован, откачка.",
            "Напор (м) — если воду нужно поднять высоко или подать далеко, берите модель высокого напора.",
            "Грязная вода с песком и камнями — только мотопомпа для грязной воды.",
          ],
        },
      ],
      faq: [
        { q: "Какая мотопомпа нужна для полива?", a: "Для огорода и сада обычно хватает 2-дюймовой бензиновой мотопомпы. Для поля и арыков — 3–4 дюйма или модель высокого напора." },
      ],
    },
    uz: {
      h1: "Benzinli va dizel motopompalar",
      sections: [
        {
          h2: "Qanday motopompalar bor",
          ul: [
            "Toza suv uchun: benzinli BISON va SDL 1,5 dan 4 dyuymgacha (12–100 m³/soat), dizel BISON 2–4 dyuym.",
            "Yuqori bosimli va yuqori naporli — sug'orish, suvni balandga va uzoqqa uzatish.",
            "Iflos suv uchun BISON BS30T va BS40T (3 va 4 dyuym) — kotlovan, yerto'la, transheyalardan suv chiqarish.",
            "Kimyo uchun BISON BS20C va BS30C — o'g'itlar va agressiv suyuqliklar.",
          ],
        },
        {
          h2: "Motopompani qanday tanlash kerak",
          ul: [
            "Patrubok diametri (dyuym) unumdorlikni belgilaydi: 2″ — tomorqa, 3–4″ — dala, kotlovan, suv chiqarish.",
            "Napor (m) — suvni baland ko'tarish yoki uzoqqa uzatish kerak bo'lsa, yuqori naporli model oling.",
            "Qum va toshli iflos suv — faqat iflos suv motopompasi.",
          ],
        },
      ],
      faq: [
        { q: "Sug'orish uchun qanday motopompa kerak?", a: "Tomorqa va bog' uchun odatda 2 dyuymli benzinli motopompa yetadi. Dala va ariqlar uchun — 3–4 dyuym yoki yuqori naporli model." },
      ],
    },
  },

  "dvigatellar": {
    ru: {
      h1: "Бензиновые и дизельные двигатели (170F, 188F, 192F)",
      sections: [
        {
          h2: "Какие двигатели есть",
          ul: [
            "Бензиновые BISON от 156F (2,5 л.с.) до 192F (16 л.с.): 168F, 170F, 177F, 188F, 190F и другие.",
            "Бензиновые SDL 170F, XS 170F, Yihu 190F и двигатели SDL для вибротрамбовки.",
            "Дизельные BISON от 170F (2,5 кВт) до 195F (9,2 кВт), а также 1100FE на 10 кВт.",
            "Двухцилиндровые дизельные BISON BS292F (воздушное охлаждение) и BS2V80 (водяное).",
          ],
        },
        {
          h2: "Как подобрать двигатель",
          ul: [
            "Мощность и объём — не меньше, чем у старого двигателя или по требованию машины.",
            "Вал: диаметр, длина, шпонка или резьба — сверьте с вашей техникой.",
            "Дизель — для мотоблоков и машин, которые работают долго; бензин — легче и проще в обслуживании.",
          ],
        },
      ],
      faq: [
        { q: "Подойдёт ли двигатель 170F на мой мотоблок?", a: "Сверьте мощность, диаметр и длину вала и крепление с вашим мотоблоком. Напишите модель техники — подберём двигатель." },
      ],
    },
    uz: {
      h1: "Benzinli va dizel dvigatellar (170F, 188F, 192F)",
      sections: [
        {
          h2: "Qanday dvigatellar bor",
          ul: [
            "Benzinli BISON 156F (2,5 o.k.) dan 192F (16 o.k.) gacha: 168F, 170F, 177F, 188F, 190F va boshqalar.",
            "Benzinli SDL 170F, XS 170F, Yihu 190F va vibrotrambovka uchun SDL dvigatellari.",
            "Dizel BISON 170F (2,5 kVt) dan 195F (9,2 kVt) gacha, shuningdek 10 kVt li 1100FE.",
            "Ikki silindrli dizel BISON BS292F (havo bilan sovutish) va BS2V80 (suv bilan).",
          ],
        },
        {
          h2: "Dvigatelni qanday tanlash kerak",
          ul: [
            "Quvvat va hajm — eski dvigateldan yoki mashina talabidan kam bo'lmasin.",
            "Val: diametri, uzunligi, shponka yoki rezba — texnikangiz bilan solishtiring.",
            "Dizel — uzoq ishlaydigan motobloklar va mashinalar uchun; benzin — yengilroq va xizmat ko'rsatish oson.",
          ],
        },
      ],
      faq: [
        { q: "170F dvigatel motoblokimga mos keladimi?", a: "Quvvat, val diametri va uzunligi hamda mahkamlashni motoblokingiz bilan solishtiring. Texnika modelini yozing — dvigatel tanlab beramiz." },
      ],
    },
  },

  "qurilish-texnikasi": {
    ru: {
      h1: "Бетономешалки (бетоносмесители)",
      sections: [
        {
          h2: "Бетономешалки на 120–180 литров",
          ul: [
            "BISON BS-CM120 и BS-CM140 — частный дом, дача, небольшие заливки.",
            "BISON BS-CM160 и BS-CM180 — фундамент, стяжка, работа бригады.",
          ],
        },
        {
          h2: "Как выбрать бетономешалку",
          ul: [
            "Объём барабана: готового бетона за один замес получается примерно 60–70 % от объёма.",
            "120–140 л — для мелких работ, 160–180 л — для фундамента и регулярной работы.",
            "Проверьте, есть ли на объекте розетка нужной мощности.",
          ],
        },
      ],
      faq: [
        { q: "Сколько бетона даёт бетономешалка на 180 литров?", a: "За один замес — около 110–125 литров готового бетона: обычно загружают 60–70 % объёма барабана." },
      ],
    },
    uz: {
      h1: "Betonomeshalkalar (beton qorg'ichlar)",
      sections: [
        {
          h2: "120–180 litrli betonomeshalkalar",
          ul: [
            "BISON BS-CM120 va BS-CM140 — xususiy uy, dacha, kichik quyishlar.",
            "BISON BS-CM160 va BS-CM180 — poydevor, styajka, brigada ishi.",
          ],
        },
        {
          h2: "Betonomeshalkani qanday tanlash kerak",
          ul: [
            "Baraban hajmi: bir qorishda tayyor beton hajmning taxminan 60–70 % ini tashkil qiladi.",
            "120–140 l — kichik ishlar uchun, 160–180 l — poydevor va doimiy ish uchun.",
            "Obyektda kerakli quvvatdagi rozetka borligini tekshiring.",
          ],
        },
      ],
      faq: [
        { q: "180 litrli betonomeshalka qancha beton beradi?", a: "Bir qorishda taxminan 110–125 litr tayyor beton: odatda baraban hajmining 60–70 % i yuklanadi." },
      ],
    },
  },

  "havo-kompressorlari": {
    ru: {
      h1: "Воздушные компрессоры",
      sections: [
        {
          h2: "Какие компрессоры есть",
          ul: [
            "Безмасляные тихие BISON 6–50 л, в том числе с двумя моторами — покраска, шиномонтаж, мастерская.",
            "Поршневые ременные BISON от 40 до 300 л (75–1090 л/мин) — автосервис, цех, пневмоинструмент.",
            "Вертикальные модели на 50 и 100 л — когда мало места.",
            "Бензиновые (50 и 70 л) и дизельный на 200 л — там, где нет электричества.",
          ],
        },
        {
          h2: "Как выбрать компрессор",
          ul: [
            "Производительность (л/мин) — на 20–30 % больше, чем расход вашего инструмента.",
            "Ресивер: 24–50 л — покраска и подкачка, 100–300 л — пневмоинструмент и цех.",
            "Безмасляный — чистый воздух и тише; ременной масляный — для долгой работы.",
          ],
        },
      ],
      faq: [
        { q: "Какой компрессор нужен для покраски автомобиля?", a: "Обычно ресивер от 50 л и производительность от 200 л/мин; безмасляный даёт воздух без масла, но для покраски всё равно ставят фильтр-влагоотделитель." },
      ],
    },
    uz: {
      h1: "Havo kompressorlari",
      sections: [
        {
          h2: "Qanday kompressorlar bor",
          ul: [
            "Moysiz jim BISON 6–50 l, shu jumladan ikki motorli — bo'yash, shinomontaj, ustaxona.",
            "Porshenli tasmali BISON 40 dan 300 l gacha (75–1090 l/min) — avtoservis, sex, pnevmoasboblar.",
            "Joy kam bo'lganda — 50 va 100 l vertikal modellar.",
            "Benzinli (50 va 70 l) va 200 l dizel — elektr yo'q joyda.",
          ],
        },
        {
          h2: "Kompressorni qanday tanlash kerak",
          ul: [
            "Unumdorlik (l/min) — asbobingiz sarfidan 20–30 % ko'p.",
            "Resiver: 24–50 l — bo'yash va dam berish, 100–300 l — pnevmoasboblar va sex.",
            "Moysiz — toza havo va jimroq; tasmali moyli — uzoq ishlash uchun.",
          ],
        },
      ],
      faq: [
        { q: "Mashina bo'yash uchun qanday kompressor kerak?", a: "Odatda 50 l dan resiver va 200 l/min dan unumdorlik; moysiz kompressor moysiz havo beradi, lekin bo'yash uchun baribir namlik ajratgich filtr qo'yiladi." },
      ],
    },
  },
};
