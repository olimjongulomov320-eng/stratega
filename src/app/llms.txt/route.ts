import { buildLlmsTxt } from "@/lib/llms";
import { llmsData, LLMS_HEADERS } from "@/lib/llms-data";

// Short map of the shop for AI assistants; every product is in /llms-full.txt. Built on request, cached by the CDN for an hour.
export const dynamic = "force-dynamic";

export async function GET() {
  const { categories, products } = await llmsData();
  return new Response(buildLlmsTxt(categories, products, { full: false }), { headers: LLMS_HEADERS });
}
