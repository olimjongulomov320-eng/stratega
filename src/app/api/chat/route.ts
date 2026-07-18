import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

const GROQ_MODEL = "llama-3.3-70b-versatile";

async function buildSystemPrompt() {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { name: true },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { name: true, price: true, category: { select: { name: true } } },
      orderBy: { soldCount: "desc" },
      take: 40,
    }),
  ]);

  const catalogLines = products
    .map(
      (p) =>
        `- ${p.name} (${p.category.name}) — ${new Intl.NumberFormat("ru-RU").format(p.price)} so'm`
    )
    .join("\n");

  return `Siz "Stratega" — qurilish, gidravlika, klining va bog' texnikasi bo'yicha B2B ta'minot kompaniyasining virtual yordamchisisiz.

Vazifangiz: mijozlarga to'g'ri uskunani tanlashda yordam berish, savollariga javob berish va kerak bo'lsa ularni "Spetsifikatsiya yuborish" (/korzina) sahifasiga yo'naltirish.

Qoidalar:
- Har doim o'zbek tilida (lotin alifbosida) javob bering, agar mijoz boshqa tilda yozsa o'sha tilda javob bering (rus yoki ingliz).
- Qisqa, aniq va do'stona javob bering. Ortiqcha cho'zmang.
- Faqat quyidagi kategoriyalar bo'yicha ishlaymiz: ${categories.map((c) => c.name).join(", ")}.
- Narxlar taxminiy, aniq narx va mavjudlik uchun menejer bilan bog'lanishni yoki saytdagi "Spetsifikatsiya yuborish" formasini tavsiya qiling.
- Agar mijoz aniq mahsulot izlasa, quyidagi katalogdan mos variantlarni tavsiya qiling.
- Agar savol texnika bilan bog'liq bo'lmasa, muloyimlik bilan mavzuni texnikaga qaytaring.

Mavjud mahsulotlar namunasi:
${catalogLines}`;
}

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Chat hozircha sozlanmagan." },
      { status: 500 }
    );
  }

  const body = (await req.json()) as { messages?: ChatMessage[] };
  const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];

  if (messages.length === 0) {
    return Response.json({ error: "Xabar bo'sh." }, { status: 400 });
  }

  const systemPrompt = await buildSystemPrompt();

  const groqRes = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
        temperature: 0.4,
        max_tokens: 500,
      }),
    }
  );

  if (!groqRes.ok) {
    const errText = await groqRes.text();
    console.error("Groq API error:", groqRes.status, errText);
    return Response.json(
      { error: "Yordamchi vaqtincha javob bera olmadi. Birozdan so'ng qayta urinib ko'ring." },
      { status: 502 }
    );
  }

  const data = await groqRes.json();
  const reply: string =
    data?.choices?.[0]?.message?.content?.trim() ??
    "Kechirasiz, javob shakllantirib bo'lmadi.";

  return Response.json({ reply });
}
