import { requireAdminPermission } from "@/lib/require-permission";
import { ASSISTANT_TOOLS, getAssistantTool } from "@/lib/inventory-assistant";

export const runtime = "nodejs";

// AI yordamchi uchun tayyor tool API. LLM (yoki UI) shu reyestrdagi
// haqiqiy biznes funksiyalarini chaqiradi — soxta javoblar yo'q.
//
//   GET  /api/admin/assistant          -> tool'lar ro'yxati (nom + tavsif)
//   POST /api/admin/assistant {tool, args} -> natija (JSON)
export async function GET() {
  try {
    await requireAdminPermission("stock.read");
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json({
    tools: ASSISTANT_TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
    })),
  });
}

export async function POST(req: Request) {
  try {
    await requireAdminPermission("stock.read");
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { tool?: string; args?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Noto'g'ri so'rov body." }, { status: 400 });
  }

  const tool = body.tool ? getAssistantTool(body.tool) : undefined;
  if (!tool) {
    return Response.json(
      { error: "Tool topilmadi.", tools: ASSISTANT_TOOLS.map((t) => t.name) },
      { status: 404 }
    );
  }

  try {
    const result = await tool.execute(body.args ?? {});
    return Response.json({ tool: tool.name, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
