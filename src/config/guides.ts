// Buyer guides (/qollanma/<slug>): articles that answer what people type into Google and Yandex
// ("как выбрать рохлю", "сварка пнд труб таблица"…) and lead to the products we actually stock.
// Prices are never written here: the product cards under each guide show the live catalogue price.
// Guides exist in Russian and Uzbek only (English pages are not indexed).
//
// Keep every statement general and true. Welding parameters always defer to the pipe maker's table.

export type GuideLocale = "uz" | "ru";
export const GUIDE_LOCALES: readonly GuideLocale[] = ["uz", "ru"];

export type GuideBlock =
  | { h2: string }
  | { p: string }
  | { ul: string[] }
  | { table: { head: string[]; rows: string[][] } };

type GuideText = {
  title: string;
  /** <title> tag, up to ~70 chars. */
  seoTitle: string;
  description: string;
  /** Short line under the title and on the guide list. */
  lead: string;
  body: GuideBlock[];
  faq: { q: string; a: string }[];
};

export type Guide = {
  slug: string;
  icon: string;
  /** ISO dates for Article structured data. */
  published: string;
  updated: string;
  /** Product slugs shown as cards (inactive ones are skipped). */
  products: string[];
  /** Category slugs linked under the article. */
  categories: string[];
  text: Record<GuideLocale, GuideText>;
};

export const GUIDES: Guide[] = [
  {
    slug: "pnd-quvur-payvandlash-apparati-tanlash",
    icon: "🔥",
    published: "2026-11-12",
    updated: "2026-11-12",
    products: [
      "polietilen-quvur-payvandlash-apparati-turan-cn-63200-63200-mm",
      "gidravlik-quvur-payvandlash-apparati-turan-cn-90315h-90315-mm",
      "gidravlik-quvur-payvandlash-apparati-turan-cn-160450h-160450-mm",
      "gidravlik-quvur-payvandlash-apparati-turan-cn-160500h-160500-mm",
      "gidravlik-quvur-payvandlash-apparati-turan-cn-315630h-315630-mm",
      "quvur-payvandlash-apparati-payka-cn-013a-50-110-mm-toplam",
      "ppr-quvur-payvandlash-apparati-cn-026-2063-mm",
    ],
    categories: ["payvandlash-apparatlari"],
    text: {
      ru: {
        title: "Аппарат для сварки ПНД труб: как выбрать",
        seoTitle: "Аппарат для сварки ПНД труб: как выбрать, цены в Ташкенте",
        description:
          "Какой аппарат нужен для сварки ПНД и полиэтиленовых труб: стыковой или паяльник, какой диаметр, 220 или 380 В. Модели в наличии в Ташкенте, доставка по Узбекистану.",
        lead: "Стыковой аппарат или паяльник, диаметр, питание 220/380 В — разбираемся по шагам и подбираем модель под ваши трубы.",
        body: [
          { p: "ПНД (полиэтиленовые, HDPE) трубы соединяют сваркой: правильно сваренный шов не уступает по прочности самой трубе. Чтобы выбрать аппарат, ответьте на три вопроса: какой диаметр труб, какой тип сварки и есть ли на объекте 380 В." },
          { h2: "1. Тип сварки: стыковая или раструбная (паяльник)" },
          { ul: [
            "Стыковая сварка — концы труб нагревают плоским нагревателем и прижимают друг к другу. Нужен аппарат с центратором (зажимами), торцевателем и нагревателем. Это основной способ для водопровода, газопровода, канализации и орошения диаметром от 63 мм и больше.",
            "Раструбная сварка (паяльник) — труба и фитинг нагреваются насадками и вставляются друг в друга. Подходит для небольших диаметров: внутренние сети, полипропиленовые (PPR) трубы водопровода и отопления, ПЭ трубы малого диаметра.",
            "Электромуфтовая сварка — соединение специальной муфтой со встроенной спиралью; нужен отдельный аппарат и электромуфты. Удобна для ремонта и стеснённых мест.",
          ] },
          { h2: "2. Диаметр труб" },
          { p: "Каждый стыковой аппарат рассчитан на свой диапазон диаметров — он задаётся вкладышами центратора. Берите аппарат так, чтобы ваши основные трубы были внутри диапазона, а не на его краю." },
          { table: {
            head: ["Диаметр труб", "Тип", "Модель в наличии"],
            rows: [
              ["20–63 мм (PPR)", "Паяльник", "CN-026"],
              ["50–110 мм", "Паяльник, комплект", "CN-013A"],
              ["63–200 мм", "Стыковой, гидравлический", "TURAN CN-63/200"],
              ["90–315 мм", "Стыковой, гидравлический", "TURAN CN-90/315H"],
              ["160–450 мм", "Стыковой, гидравлический", "TURAN CN-160/450H"],
              ["160–500 мм", "Стыковой, гидравлический", "TURAN CN-160/500H"],
              ["315–630 мм", "Стыковой, гидравлический", "TURAN CN-315/630H"],
            ],
          } },
          { h2: "3. Питание: 220 или 380 В" },
          { p: "Аппараты до 315 мм работают от обычной сети 220 В — их можно подключить к генератору на объекте. Большие аппараты (например, 315–630 мм) требуют 380 В и мощного генератора: проверьте это заранее, если работаете в поле." },
          { h2: "4. Что ещё проверить" },
          { ul: [
            "Гидравлика: гидравлический привод прижима даёт точное давление осадки, что особенно важно для труб больших диаметров.",
            "Температура нагревателя регулируется: для ПЭ обычно около 220 °C, но всегда сверяйтесь с таблицей производителя труб.",
            "Вес и габариты: аппарат 63–200 мм весит около 120 кг, 315–630 мм — более 600 кг. Подумайте, как будете возить его на объект.",
            "Документы: для юрлиц — договор и счёт-фактура с НДС.",
          ] },
          { p: "Не уверены, какой аппарат нужен? Напишите диаметр и материал труб и примерный объём работ — подберём модель и скажем срок доставки в ваш регион." },
        ],
        faq: [
          { q: "Какой аппарат нужен для сварки ПНД трубы 110 мм?", a: "Для стыковой сварки 110 мм подойдёт аппарат с диапазоном 63–200 мм (TURAN CN-63/200). Для раструбной сварки — паяльник на 50–110 мм (CN-013A)." },
          { q: "Можно ли варить ПНД трубы паяльником для полипропилена?", a: "Только трубы и фитинги малого диаметра и с насадками нужного размера. Для магистральных ПНД труб от 63 мм правильнее стыковая сварка." },
          { q: "Есть ли аппараты в наличии в Ташкенте?", a: "Да, стыковые аппараты TURAN и паяльники CN-013A и CN-026 есть на нашем складе в Ташкенте. Доставляем по всему Узбекистану." },
          { q: "Нужен ли 380 В?", a: "Аппаратам до 315 мм достаточно 220 В. Аппаратам на 315–630 мм нужно 380 В." },
        ],
      },
      uz: {
        title: "PND quvur payvandlash apparati: qanday tanlash kerak",
        seoTitle: "PND quvur payvandlash apparati: tanlash va narxi, Toshkent",
        description:
          "PND va polietilen quvurlar uchun qaysi payvandlash apparati kerak: stykovoy yoki payka, diametr, 220 yoki 380 V. Toshkentda mavjud, O'zbekiston bo'ylab yetkazib beramiz.",
        lead: "Stykovoy apparat yoki payka, diametr, 220/380 V — qadamma-qadam tushuntiramiz va quvuringizga mos modelni tanlaymiz.",
        body: [
          { p: "PND (polietilen, HDPE) quvurlar payvandlash orqali ulanadi: to'g'ri payvandlangan chok quvurning o'zidek mustahkam bo'ladi. Apparat tanlash uchun uchta savolga javob bering: quvur diametri qancha, qaysi usulda payvandlaysiz va obyektda 380 V bormi." },
          { h2: "1. Payvandlash turi: stykovoy yoki payka (rastrub)" },
          { ul: [
            "Stykovoy (uchma-uch) payvandlash — quvur uchlari tekis isitgich bilan qizdiriladi va bir-biriga siqiladi. Markazlashtirgich (qisqichlar), torets kesgich va isitgichli apparat kerak. Suv, gaz, kanalizatsiya va sug'orish quvurlari uchun 63 mm va undan katta diametrlarda asosiy usul.",
            "Rastrubli payvandlash (payka) — quvur va fiting nasadkalar bilan qizdirilib, bir-biriga kiritiladi. Kichik diametrlar uchun: ichki tarmoqlar, polipropilen (PPR) suv va isitish quvurlari, kichik PE quvurlar.",
            "Elektromufta bilan payvandlash — ichida spirali bor maxsus mufta orqali ulanadi; alohida apparat va elektromuftalar kerak. Ta'mirlash va tor joylar uchun qulay.",
          ] },
          { h2: "2. Quvur diametri" },
          { p: "Har bir stykovoy apparat o'z diametr oralig'i uchun mo'ljallangan — u markazlashtirgich vkladishlari bilan belgilanadi. Asosiy quvurlaringiz oraliqning chetida emas, ichida bo'lsin." },
          { table: {
            head: ["Quvur diametri", "Turi", "Mavjud model"],
            rows: [
              ["20–63 mm (PPR)", "Payka", "CN-026"],
              ["50–110 mm", "Payka, to'plam", "CN-013A"],
              ["63–200 mm", "Stykovoy, gidravlik", "TURAN CN-63/200"],
              ["90–315 mm", "Stykovoy, gidravlik", "TURAN CN-90/315H"],
              ["160–450 mm", "Stykovoy, gidravlik", "TURAN CN-160/450H"],
              ["160–500 mm", "Stykovoy, gidravlik", "TURAN CN-160/500H"],
              ["315–630 mm", "Stykovoy, gidravlik", "TURAN CN-315/630H"],
            ],
          } },
          { h2: "3. Elektr ta'minoti: 220 yoki 380 V" },
          { p: "315 mm gacha bo'lgan apparatlar oddiy 220 V tarmoqdan ishlaydi — obyektda generatorga ulash mumkin. Katta apparatlar (masalan, 315–630 mm) 380 V va kuchli generator talab qiladi: dalada ishlasangiz, buni oldindan tekshiring." },
          { h2: "4. Yana nimalarga qarash kerak" },
          { ul: [
            "Gidravlika: gidravlik siqish aniq bosim beradi, bu ayniqsa katta diametrli quvurlar uchun muhim.",
            "Isitgich harorati sozlanadi: PE uchun odatda 220 °C atrofida, lekin har doim quvur ishlab chiqaruvchisining jadvaliga qarang.",
            "Og'irligi va o'lchami: 63–200 mm apparat taxminan 120 kg, 315–630 mm — 600 kg dan ortiq. Obyektga qanday olib borishni o'ylang.",
            "Hujjatlar: yuridik shaxslar uchun shartnoma va QQS bilan hisob-faktura.",
          ] },
          { p: "Qaysi apparat kerakligini bilmaysizmi? Quvur diametri, materiali va ish hajmini yozing — modelni tanlab, viloyatingizga yetkazib berish muddatini aytamiz." },
        ],
        faq: [
          { q: "110 mm PND quvur uchun qaysi apparat kerak?", a: "110 mm ni stykovoy payvandlash uchun 63–200 mm oraliqli apparat (TURAN CN-63/200) mos keladi. Rastrubli payvandlash uchun — 50–110 mm payka (CN-013A)." },
          { q: "PND quvurni polipropilen paykasi bilan payvandlasa bo'ladimi?", a: "Faqat kichik diametrli quvur va fitinglarni, mos o'lchamdagi nasadkalar bilan. 63 mm dan katta magistral PND quvurlar uchun stykovoy payvandlash to'g'riroq." },
          { q: "Apparatlar Toshkentda mavjudmi?", a: "Ha, TURAN stykovoy apparatlari va CN-013A, CN-026 paykalari Toshkentdagi omborimizda bor. O'zbekiston bo'ylab yetkazib beramiz." },
          { q: "380 V kerakmi?", a: "315 mm gacha apparatlarga 220 V yetarli. 315–630 mm apparatlarga 380 V kerak." },
        ],
      },
    },
  },
  {
    slug: "pnd-quvur-stykovoy-payvandlash",
    icon: "🧰",
    published: "2026-11-12",
    updated: "2026-11-12",
    products: [
      "polietilen-quvur-payvandlash-apparati-turan-cn-63200-63200-mm",
      "gidravlik-quvur-payvandlash-apparati-turan-cn-90315h-90315-mm",
      "gidravlik-quvur-payvandlash-apparati-turan-cn-160450h-160450-mm",
      "gidravlik-quvur-payvandlash-apparati-turan-cn-315630h-315630-mm",
    ],
    categories: ["payvandlash-apparatlari", "generatorlar"],
    text: {
      ru: {
        title: "Стыковая сварка ПНД труб: порядок работы",
        seoTitle: "Стыковая сварка ПНД труб: порядок работы и таблица параметров",
        description:
          "Как варить ПНД трубы встык: подготовка, торцевание, нагрев, осадка, охлаждение. Где брать таблицу параметров и какие ошибки портят шов.",
        lead: "Пошаговый порядок стыковой сварки полиэтиленовых труб и типичные ошибки, из-за которых шов течёт.",
        body: [
          { p: "Стыковая сварка — основной способ соединения ПНД (ПЭ, HDPE) труб диаметром от 63 мм. Качество шва зависит от трёх величин: температуры нагревателя, давления и времени на каждом этапе. Их берут из таблицы сварки для конкретной трубы (диаметр и SDR) — её даёт производитель труб или аппарата." },
          { h2: "Порядок работы" },
          { ul: [
            "Подготовка. Установите аппарат на ровное место, защитите зону сварки от ветра, пыли и дождя. Очистите концы труб.",
            "Закрепление. Зажмите трубы в центраторе с вкладышами нужного диаметра, концы должны свободно выступать.",
            "Торцевание. Сведите трубы на торцеватель и снимайте стружку, пока она не пойдёт непрерывной лентой с обеих сторон. Уберите стружку, не трогая торцы руками.",
            "Проверка соосности и зазора. Сведите торцы: смещение кромок и зазор должны быть минимальными (допуски — в таблице или нормативе).",
            "Измерение давления протяжки. Запишите давление, при котором подвижная каретка начинает двигаться, — его прибавляют к давлениям из таблицы.",
            "Нагрев. Проверьте температуру нагревателя (для ПЭ обычно около 220 °C), установите его между торцами, сформируйте первичный валик, затем держите прогрев с минимальным давлением указанное время.",
            "Технологическая пауза. Быстро уберите нагреватель — пауза должна быть как можно короче.",
            "Осадка и охлаждение. Сведите торцы, поднимите давление до значения из таблицы и оставьте шов остывать под давлением. Не снимайте трубу из зажимов раньше времени.",
          ] },
          { h2: "Типичные ошибки" },
          { ul: [
            "Сварка без таблицы «на глаз» — шов может выглядеть нормально, но не держать давление.",
            "Не учтено давление протяжки — фактическое давление осадки оказывается ниже нужного.",
            "Грязь или касание торцов руками после торцевания.",
            "Слишком долгая пауза между нагревом и осадкой — торцы остывают.",
            "Сварка на ветру и холоде без укрытия.",
            "Нагрузка на шов до полного остывания.",
          ] },
          { h2: "Как проверить шов" },
          { p: "Валик должен быть ровным и одинаковым по всей окружности, без трещин и раковин, с углублением между двумя половинами не ниже поверхности трубы. Для ответственных сетей (газ, напорный водопровод) после монтажа проводят испытание давлением по проекту." },
          { p: "Подбираем аппарат под диаметр ваших труб и помогаем с запуском: напишите диаметр, SDR и объём работ." },
        ],
        faq: [
          { q: "Где взять таблицу сварки ПНД труб?", a: "Таблицу параметров (температура, давление, время) дают производитель труб и производитель аппарата для каждого диаметра и SDR. Давления в таблице аппарата зависят от площади его цилиндров, поэтому берите таблицу именно для своего аппарата." },
          { q: "Какая температура нагревателя для ПНД?", a: "Для полиэтилена обычно около 220 °C (как правило, в пределах 210–230 °C), точное значение — по таблице производителя труб." },
          { q: "Можно ли варить зимой?", a: "Можно при соблюдении требований производителя: с укрытием от ветра и осадков и с учётом минимальной рабочей температуры аппарата (для TURAN — от −5 °C)." },
        ],
      },
      uz: {
        title: "PND quvurlarni stykovoy payvandlash: ish tartibi",
        seoTitle: "PND quvurni stykovoy payvandlash: ish tartibi va jadval",
        description:
          "PND quvurlarni uchma-uch payvandlash: tayyorlash, torets kesish, qizdirish, siqish, sovutish. Parametrlar jadvali qayerdan olinadi va qaysi xatolar chokni buzadi.",
        lead: "Polietilen quvurlarni stykovoy payvandlashning qadamma-qadam tartibi va chok oqishiga olib keladigan xatolar.",
        body: [
          { p: "Stykovoy payvandlash — 63 mm va undan katta PND (PE, HDPE) quvurlarni ulashning asosiy usuli. Chok sifati uchta kattalikka bog'liq: isitgich harorati, bosim va har bir bosqich vaqti. Ular aniq quvur (diametr va SDR) uchun payvandlash jadvalidan olinadi — jadvalni quvur yoki apparat ishlab chiqaruvchisi beradi." },
          { h2: "Ish tartibi" },
          { ul: [
            "Tayyorlash. Apparatni tekis joyga qo'ying, payvandlash joyini shamol, chang va yomg'irdan himoya qiling. Quvur uchlarini tozalang.",
            "Mahkamlash. Quvurlarni kerakli diametrdagi vkladishlar bilan markazlashtirgichga qisib qo'ying, uchlari erkin chiqib tursin.",
            "Torets kesish. Quvurlarni torets kesgichga yaqinlashtiring va qirindi ikki tomondan uzluksiz lenta bo'lib chiqquncha kesing. Qirindini olib tashlang, toretslarga qo'l tekkizmang.",
            "O'qdoshlik va tirqishni tekshirish. Toretslarni yaqinlashtiring: chetlar siljishi va tirqish minimal bo'lishi kerak.",
            "Tortish bosimini o'lchash. Harakatlanuvchi karetka siljiy boshlagan bosimni yozib oling — u jadvaldagi bosimlarga qo'shiladi.",
            "Qizdirish. Isitgich haroratini tekshiring (PE uchun odatda 220 °C atrofida), uni toretslar orasiga qo'ying, birlamchi valik hosil qiling, so'ng minimal bosimda belgilangan vaqt qizdiring.",
            "Texnologik pauza. Isitgichni tez oling — pauza iloji boricha qisqa bo'lsin.",
            "Siqish va sovutish. Toretslarni yaqinlashtiring, bosimni jadvaldagi qiymatgacha ko'taring va chokni bosim ostida soviting. Quvurni qisqichlardan vaqtidan oldin chiqarmang.",
          ] },
          { h2: "Ko'p uchraydigan xatolar" },
          { ul: [
            "Jadvalsiz, «ko'z bilan» payvandlash — chok yaxshi ko'rinsa ham bosimga chidamasligi mumkin.",
            "Tortish bosimi hisobga olinmagan — haqiqiy siqish bosimi kerakligidan past bo'ladi.",
            "Torets kesishdan keyin kir yoki toretslarga qo'l tegishi.",
            "Qizdirish va siqish orasidagi uzoq pauza — toretslar soviydi.",
            "Shamol va sovuqda himoyasiz payvandlash.",
            "To'liq sovumagan chokka yuk berish.",
          ] },
          { h2: "Chokni qanday tekshirish mumkin" },
          { p: "Valik butun aylana bo'ylab tekis va bir xil, yoriq va g'ovaklarsiz bo'lishi kerak; ikki yarmi orasidagi chuqurcha quvur sirtidan pastga tushmasligi kerak. Mas'uliyatli tarmoqlar (gaz, bosimli suv) montajdan keyin loyiha bo'yicha bosim bilan sinovdan o'tkaziladi." },
          { p: "Quvuringiz diametriga mos apparat tanlaymiz va ishga tushirishda yordam beramiz: diametr, SDR va ish hajmini yozing." },
        ],
        faq: [
          { q: "PND quvur payvandlash jadvalini qayerdan olsa bo'ladi?", a: "Parametrlar jadvalini (harorat, bosim, vaqt) har bir diametr va SDR uchun quvur ishlab chiqaruvchisi va apparat ishlab chiqaruvchisi beradi. Apparat jadvalidagi bosimlar uning silindrlari maydoniga bog'liq, shuning uchun aynan o'z apparatingiz jadvalidan foydalaning." },
          { q: "PND uchun isitgich harorati qancha?", a: "Polietilen uchun odatda 220 °C atrofida (ko'pincha 210–230 °C oralig'ida), aniq qiymat — quvur ishlab chiqaruvchisi jadvali bo'yicha." },
          { q: "Qishda payvandlasa bo'ladimi?", a: "Ishlab chiqaruvchi talablariga rioya qilinsa bo'ladi: shamol va yog'ingarchilikdan himoya bilan hamda apparatning minimal ish haroratini hisobga olib (TURAN uchun −5 °C dan)." },
        ],
      },
    },
  },
  {
    slug: "rohlya-tanlash",
    icon: "🛒",
    published: "2026-11-12",
    updated: "2026-11-12",
    products: [
      "gidravlik-telejka-rohlya-niuli-cby-ac-3-t-vilkalar-550-1150-mm",
      "gidravlik-telejka-rohlya-niuli-cby-ac-3-t-vilkalar-685-1220-mm",
      "ekonom-gidravlik-telejka-niuli-cby-jc-2-t",
      "tarozili-gidravlik-telejka-niuli-cby-cw-i",
    ],
    categories: ["gidravlik-telejkalar", "elektr-telejkalar"],
    text: {
      ru: {
        title: "Как выбрать рохлю (гидравлическую тележку)",
        seoTitle: "Как выбрать рохлю: грузоподъёмность, вилы, колёса | Ташкент",
        description:
          "Как выбрать гидравлическую тележку (рохлю): 2, 2,5 или 3 тонны, длина и ширина вил под ваши паллеты, полиуретановые или нейлоновые колёса, рохля с весами. Цены в Ташкенте.",
        lead: "Грузоподъёмность, вилы под ваши паллеты и колёса под ваш пол — всё, что нужно знать перед покупкой рохли.",
        body: [
          { p: "Рохля (ручная гидравлическая тележка) — самый простой способ перемещать паллеты по складу, магазину или цеху. Модели похожи внешне, но отличаются грузоподъёмностью, размерами вил и колёсами — от этого зависит, будет ли тележка удобной и долговечной." },
          { h2: "1. Грузоподъёмность" },
          { p: "Самые распространённые варианты — 2, 2,5 и 3 тонны. Берите с запасом относительно самой тяжёлой паллеты: тележка, которая постоянно работает на пределе, быстрее изнашивает гидравлику и колёса. Для складов стройматериалов, напитков и мешков чаще выбирают 3 т." },
          { h2: "2. Вилы: длина и ширина" },
          { ul: [
            "Длина 1150 мм — стандарт для европаллеты 1200×800 мм.",
            "Общая ширина 550 мм — для европаллет и большинства стандартных паллет.",
            "Ширина 685 мм — для более широких паллет (например, 1200×1000 мм) и неустойчивых грузов: груз стоит на вилах увереннее.",
            "Нижняя высота вил (обычно 75–85 мм) должна свободно заходить под вашу паллету.",
          ] },
          { h2: "3. Колёса" },
          { ul: [
            "Полиуретан (PU) — тихие, не портят пол, хорошо подходят для гладких полов, магазинов и складов с плиткой или наливным полом.",
            "Нейлон — твёрже, легче катятся под большой нагрузкой, устойчивы к грязи и мелкому мусору; на гладком полу шумнее.",
            "Резина — мягкий ход и тише всех, но под тяжёлым грузом катится тяжелее.",
          ] },
          { h2: "4. Особые модели" },
          { ul: [
            "Рохля с весами — взвешивает груз прямо на вилах, удобна при отгрузке и приёмке.",
            "Электрическая тележка — когда паллет много, расстояния большие или есть уклоны.",
            "Если паллеты нужно поднимать на стеллаж, нужна не рохля, а штабелер.",
          ] },
          { p: "Напишите вес паллет, их размер и тип пола — подберём тележку и скажем срок доставки." },
        ],
        faq: [
          { q: "Какую рохлю выбрать для европаллет?", a: "Для европаллеты 1200×800 мм подходит тележка с вилами длиной 1150 мм и общей шириной 550 мм." },
          { q: "Чем полиуретановые колёса лучше нейлоновых?", a: "Полиуретановые тише и бережнее к полу; нейлоновые твёрже и лучше переносят грязь и тяжёлые нагрузки, но шумнее." },
          { q: "Есть ли доставка рохлей по Узбекистану?", a: "Да, доставляем по Ташкенту и во все регионы Узбекистана. Для юрлиц — договор и счёт-фактура с НДС." },
        ],
      },
      uz: {
        title: "Rohlya (gidravlik telejka) qanday tanlanadi",
        seoTitle: "Rohlya qanday tanlanadi: yuk, vilka, g'ildirak | Toshkent",
        description:
          "Gidravlik telejka (rohlya) tanlash: 2, 2,5 yoki 3 tonna, paddonlaringizga mos vilka uzunligi va kengligi, poliuretan yoki neylon g'ildiraklar, tarozili rohlya. Toshkentda narxlar.",
        lead: "Yuk ko'tarish quvvati, paddonga mos vilka va polga mos g'ildirak — rohlya sotib olishdan oldin bilish kerak bo'lgan hamma narsa.",
        body: [
          { p: "Rohlya (qo'l gidravlik telejkasi) — ombor, do'kon yoki sexda paddonlarni tashishning eng oddiy usuli. Modellar tashqi ko'rinishdan o'xshash, lekin yuk ko'tarish quvvati, vilka o'lchami va g'ildiraklari bilan farq qiladi — telejka qulay va uzoq ishlashi shunga bog'liq." },
          { h2: "1. Yuk ko'tarish quvvati" },
          { p: "Eng ko'p tarqalgan variantlar — 2, 2,5 va 3 tonna. Eng og'ir paddoningizdan zaxira bilan oling: doim chegarada ishlaydigan telejkaning gidravlikasi va g'ildiraklari tezroq yeyiladi. Qurilish materiallari, ichimliklar va qoplar omborlari uchun ko'pincha 3 t tanlanadi." },
          { h2: "2. Vilkalar: uzunligi va kengligi" },
          { ul: [
            "Uzunlik 1150 mm — 1200×800 mm yevropaddon uchun standart.",
            "Umumiy kenglik 550 mm — yevropaddonlar va ko'pchilik standart paddonlar uchun.",
            "Kenglik 685 mm — kengroq paddonlar (masalan, 1200×1000 mm) va beqaror yuklar uchun: yuk vilkada mustahkamroq turadi.",
            "Vilkaning pastki balandligi (odatda 75–85 mm) paddoningiz tagiga bemalol kirishi kerak.",
          ] },
          { h2: "3. G'ildiraklar" },
          { ul: [
            "Poliuretan (PU) — shovqinsiz, polni buzmaydi; silliq pol, do'konlar va kafel yoki quyma polli omborlar uchun yaxshi.",
            "Neylon — qattiqroq, og'ir yukda yengil yuradi, kir va mayda chiqindiga chidamli; silliq polda shovqinliroq.",
            "Rezina — eng yumshoq va shovqinsiz, lekin og'ir yukda qiyinroq yuradi.",
          ] },
          { h2: "4. Maxsus modellar" },
          { ul: [
            "Tarozili rohlya — yukni to'g'ridan-to'g'ri vilkada tortadi, jo'natish va qabul qilishda qulay.",
            "Elektr telejka — paddonlar ko'p, masofa uzoq yoki qiyalik bo'lsa.",
            "Paddonlarni stellajga ko'tarish kerak bo'lsa, rohlya emas, shtabeler kerak.",
          ] },
          { p: "Paddonlar og'irligi, o'lchami va pol turini yozing — telejka tanlab, yetkazib berish muddatini aytamiz." },
        ],
        faq: [
          { q: "Yevropaddon uchun qaysi rohlyani tanlash kerak?", a: "1200×800 mm yevropaddon uchun vilka uzunligi 1150 mm va umumiy kengligi 550 mm bo'lgan telejka mos keladi." },
          { q: "Poliuretan g'ildirak neylondan nimasi bilan yaxshi?", a: "Poliuretan shovqinsizroq va polga ehtiyotkor; neylon qattiqroq, kir va og'ir yukka yaxshiroq chidaydi, lekin shovqinliroq." },
          { q: "Rohlyani O'zbekiston bo'ylab yetkazib berasizmi?", a: "Ha, Toshkent va O'zbekistonning barcha viloyatlariga yetkazib beramiz. Yuridik shaxslar uchun shartnoma va QQS bilan hisob-faktura." },
        ],
      },
    },
  },
  {
    slug: "shtabeler-qolda-yoki-elektr",
    icon: "🏗️",
    published: "2026-11-12",
    updated: "2026-11-12",
    products: [
      "shtabeler-gidravlik-qolda-16m",
      "qol-gidravlik-shtabeleri-niuli-cty-eh-3-m-gacha-kotarish",
      "shtabeler-elektr-poluavtomat-16m",
      "elektr-shtabeler-niuli-ctqb15-35-1-5-t-kotarish-3-5-m-akkumulyator-va-zaryadlovchi-bilan",
      "shtabeler-elektr-avtomat-35m",
    ],
    categories: ["qol-shtabelerlari", "elektr-shtabelerlar"],
    text: {
      ru: {
        title: "Штабелер: ручной или электрический — что выбрать",
        seoTitle: "Штабелер ручной или электрический: что выбрать | Ташкент",
        description:
          "Чем отличаются ручной гидравлический, полуэлектрический и самоходный электрический штабелер. Как выбрать по высоте подъёма, весу паллет и числу операций в день.",
        lead: "Ручной, полуэлектрический или самоходный — выбираем штабелер по высоте стеллажей и тому, сколько паллет вы поднимаете в день.",
        body: [
          { p: "Штабелер поднимает паллеты на стеллажи и снимает их — это то, чего не умеет рохля. Главный выбор — как он поднимает груз и как едет: руками или от аккумулятора." },
          { h2: "Три типа штабелеров" },
          { table: {
            head: ["Тип", "Подъём", "Ход", "Когда подходит"],
            rows: [
              ["Ручной гидравлический", "Качанием ручки", "Толкаете вручную", "Несколько подъёмов в день, невысокие стеллажи, нет розетки"],
              ["Полуэлектрический", "Электромотор", "Толкаете вручную", "Подъёмов много, расстояния короткие"],
              ["Самоходный электрический", "Электромотор", "Электрический", "Постоянная работа, длинные проходы, высокие стеллажи"],
            ],
          } },
          { h2: "Как выбрать" },
          { ul: [
            "Высота подъёма: измерьте верхний ярус стеллажа и добавьте запас 100–200 мм, чтобы вилы проходили над балкой.",
            "Грузоподъёмность указывается при определённом центре загрузки (обычно 500 мм) и на высоте может снижаться — смотрите диаграмму нагрузки.",
            "Число операций: если подъёмов больше 20–30 в день, ручная прокачка утомляет — выгоднее полуэлектрический или электрический.",
            "Узкие проходы: учитывайте радиус разворота и длину штабелера.",
            "Аккумулятор: у электрических моделей проверьте ёмкость, время зарядки и возможность зарядки от обычной розетки 220 В.",
            "Ширина вил: должна подходить к вашим паллетам; у некоторых моделей вилы раздвижные.",
          ] },
          { h2: "Ручной штабелер: плюсы и минусы" },
          { p: "Плюсы — низкая цена, нет аккумулятора и зарядки, простое обслуживание. Минусы — медленный подъём и физическая нагрузка на оператора. Хороший выбор для магазина или небольшого склада." },
          { h2: "Электрический штабелер: плюсы и минусы" },
          { p: "Плюсы — быстрый подъём на большую высоту, меньше усталости, выше производительность. Минусы — дороже, нужна зарядка и уход за аккумулятором. Окупается на складах с постоянным оборотом паллет." },
          { p: "Напишите высоту стеллажей, вес паллет и сколько операций в день — подберём штабелер." },
        ],
        faq: [
          { q: "Какой штабелер нужен для стеллажа 3 метра?", a: "Нужна высота подъёма не меньше высоты верхней балки плюс 100–200 мм запаса. Для 3 м подойдут модели с подъёмом 3–3,5 м: ручные с высоким подъёмом или электрические." },
          { q: "Чем штабелер отличается от рохли?", a: "Рохля приподнимает паллету на несколько сантиметров, чтобы её перевезти. Штабелер поднимает паллету на высоту стеллажа." },
          { q: "Можно ли заряжать электрический штабелер от обычной розетки?", a: "Да, у моделей со встроенным или комплектным зарядным устройством, работающим от 220 В. Уточните это для конкретной модели." },
        ],
      },
      uz: {
        title: "Shtabeler: qo'lda yoki elektr — qaysi birini tanlash",
        seoTitle: "Shtabeler qo'lda yoki elektr: qaysi birini tanlash | Toshkent",
        description:
          "Qo'l gidravlik, yarim elektr va o'zi yuradigan elektr shtabelerning farqi. Ko'tarish balandligi, paddon og'irligi va kunlik operatsiyalar soniga qarab tanlash.",
        lead: "Qo'lda, yarim elektr yoki o'zi yuradigan — shtabelerni stellaj balandligi va kuniga nechta paddon ko'tarishingizga qarab tanlaymiz.",
        body: [
          { p: "Shtabeler paddonlarni stellajga ko'taradi va tushiradi — rohlya buni qila olmaydi. Asosiy tanlov — yukni qanday ko'taradi va qanday yuradi: qo'lda yoki akkumulyator bilan." },
          { h2: "Shtabelerning uch turi" },
          { table: {
            head: ["Turi", "Ko'tarish", "Yurish", "Qachon mos"],
            rows: [
              ["Qo'l gidravlik", "Dastani qimirlatib", "Qo'lda itariladi", "Kuniga bir necha ko'tarish, past stellajlar, rozetka yo'q"],
              ["Yarim elektr", "Elektr motor", "Qo'lda itariladi", "Ko'tarish ko'p, masofa qisqa"],
              ["O'zi yuradigan elektr", "Elektr motor", "Elektr", "Doimiy ish, uzun yo'laklar, baland stellajlar"],
            ],
          } },
          { h2: "Qanday tanlash kerak" },
          { ul: [
            "Ko'tarish balandligi: stellajning yuqori qavatini o'lchang va vilka balkadan o'tishi uchun 100–200 mm zaxira qo'shing.",
            "Yuk ko'tarish quvvati ma'lum yuk markazida (odatda 500 mm) ko'rsatiladi va balandlikda kamayishi mumkin — yuk diagrammasiga qarang.",
            "Operatsiyalar soni: kuniga 20–30 dan ortiq ko'tarish bo'lsa, qo'lda nasoslash charchatadi — yarim elektr yoki elektr foydaliroq.",
            "Tor yo'laklar: burilish radiusi va shtabeler uzunligini hisobga oling.",
            "Akkumulyator: elektr modellarda sig'imi, zaryadlash vaqti va oddiy 220 V rozetkadan zaryadlash imkonini tekshiring.",
            "Vilka kengligi paddonlaringizga mos bo'lishi kerak; ba'zi modellarda vilkalar suriladi.",
          ] },
          { h2: "Qo'l shtabeleri: afzallik va kamchiliklari" },
          { p: "Afzalliklari — arzon narx, akkumulyator va zaryadlash yo'q, oddiy xizmat ko'rsatish. Kamchiliklari — sekin ko'tarish va operatorga jismoniy yuk. Do'kon yoki kichik ombor uchun yaxshi tanlov." },
          { h2: "Elektr shtabeler: afzallik va kamchiliklari" },
          { p: "Afzalliklari — katta balandlikka tez ko'tarish, kamroq charchoq, yuqori unumdorlik. Kamchiliklari — qimmatroq, zaryadlash va akkumulyatorga qarash kerak. Paddon aylanmasi doimiy bo'lgan omborlarda o'zini oqlaydi." },
          { p: "Stellaj balandligi, paddon og'irligi va kunlik operatsiyalar sonini yozing — shtabeler tanlab beramiz." },
        ],
        faq: [
          { q: "3 metrli stellaj uchun qaysi shtabeler kerak?", a: "Ko'tarish balandligi yuqori balkadan kamida 100–200 mm ko'p bo'lishi kerak. 3 m uchun 3–3,5 m ko'taradigan modellar mos: baland ko'taradigan qo'l shtabeleri yoki elektr shtabeler." },
          { q: "Shtabeler rohlyadan nimasi bilan farq qiladi?", a: "Rohlya paddonni tashish uchun bir necha santimetr ko'taradi. Shtabeler paddonni stellaj balandligigacha ko'taradi." },
          { q: "Elektr shtabelerni oddiy rozetkadan zaryadlasa bo'ladimi?", a: "Ha, 220 V da ishlaydigan ichki yoki komplektdagi zaryadlovchisi bor modellarda. Aniq model uchun so'rang." },
        ],
      },
    },
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function isGuideLocale(locale: string): locale is GuideLocale {
  return (GUIDE_LOCALES as readonly string[]).includes(locale);
}

/** Guides that link to a category, for "useful to read" links on category pages. */
export function guidesForCategory(categorySlug: string): Guide[] {
  return GUIDES.filter((g) => g.categories.includes(categorySlug));
}
