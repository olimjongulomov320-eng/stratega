import { getAdminSession } from "@/lib/admin-auth";
import { can } from "@/lib/permissions";
import { ASSISTANT_TOOLS, findTool } from "@/lib/assistant-tools";

export const runtime = "nodejs";

/**
 * Read-only tool API over real ERP data (for an AI assistant or scripts).
 *   GET  /api/admin/assistant                 → tools this user may call
 *   POST /api/admin/assistant {tool, args}    → { tool, result }
 * Requires an admin session; each tool checks its own permission.
 */
export async function GET() {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({
    tools: ASSISTANT_TOOLS.filter((t) => can(session.role, t.permission)).map((t) => ({ name: t.name, description: t.description })),
  });
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  let body: { tool?: unknown; args?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON body kerak: { tool, args }" }, { status: 400 });
  }
  const tool = typeof body.tool === "string" ? findTool(body.tool) : undefined;
  if (!tool) return Response.json({ error: "Tool topilmadi.", tools: ASSISTANT_TOOLS.map((t) => t.name) }, { status: 404 });
  if (!can(session.role, tool.permission)) return Response.json({ error: "Bu ma'lumot uchun ruxsat yo'q." }, { status: 403 });
  const args = body.args && typeof body.args === "object" && !Array.isArray(body.args) ? (body.args as Record<string, unknown>) : {};
  try {
    return Response.json({ tool: tool.name, result: await tool.run(args, session.role) });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}
