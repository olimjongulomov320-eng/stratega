import { prisma } from "@/lib/prisma";
import { rateLimit, getRequestIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

const GROQ_MODEL = "llama-3.3-70b-versatile";
const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 1000;
const CHAT_RATE_LIMIT = 20;
const CHAT_RATE_WINDOW_MS = 10 * 60 * 1000;

function sanitizeMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (m): m is ChatMessage =>
        typeof m === "object" &&
        m !== null &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
    )
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));
}

async function buildSystemPrompt(locale: string) {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { name: true, nameRu: true } }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { name: true, nameRu: true, sku: true, price: true, stock: true, category: { select: { name: true } } },
      orderBy: [{ isFeatured: "desc" }, { price: "asc" }],
      take: 60,
    }),
  ]);
  const catalog = products
    .map(
      (p) =>
        `- ${p.name}${p.nameRu ? ` / ${p.nameRu}` : ""}${p.sku ? ` [${p.sku}]` : ""} (${p.category.name}) — ${new Intl.NumberFormat("ru-RU").format(p.price)} so'm, ${p.stock > 0 ? `omborda ${p.stock} dona` : "buyurtma asosida"}`
    )
    .join("\n");
  const language = locale === "ru" ? "Russian" : locale === "en" ? "English" : "Uzbek (Latin script)";

  return `You are the virtual assistant of STRATEGA (stratega.uz), a Tashkent company that imports warehouse equipment (electric and manual stackers, hydraulic pallet trucks / "rohlya") and PE/PP pipe welding machines directly from factories in China and sells them in Uzbekistan with VAT invoices and contracts.

Rules:
- Answer in ${language} unless the customer writes in another language — then answer in that language.
- Be short, concrete and friendly.
- Product lines: ${categories.map((c) => c.name).join(", ")}.
- Prices on the site include VAT. Final price and lead time are confirmed by a manager in a quotation. Suggest adding products to the cart and sending a request, or calling ${"+998 99 301 11 70"}.
- Recommend products ONLY from the catalogue below, matched to the customer's load capacity, lift height or pipe diameter.
- Never invent facts: do not promise certificates, warranty length, service centres, delivery prices or delivery times. If asked, say a manager will confirm.
- If the question is unrelated to equipment, politely bring the conversation back.

Catalogue:
${catalog}`;
}

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Chat hozircha sozlanmagan." },
      { status: 500 }
    );
  }

  if (!rateLimit(`chat:${getRequestIp(req)}`, CHAT_RATE_LIMIT, CHAT_RATE_WINDOW_MS)) {
    return Response.json(
      { error: "Juda ko'p so'rov. Birozdan so'ng qayta urinib ko'ring." },
      { status: 429 }
    );
  }

  let body: { messages?: unknown; locale?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Noto'g'ri so'rov." }, { status: 400 });
  }
  const messages = sanitizeMessages(body.messages);

  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return Response.json({ error: "Xabar bo'sh." }, { status: 400 });
  }

  const systemPrompt = await buildSystemPrompt(typeof body.locale === "string" ? body.locale : "uz");

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
          ...messages,
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
