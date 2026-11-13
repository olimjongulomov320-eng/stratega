import { buildLlmsTxt } from "@/lib/llms";
import { llmsData, LLMS_HEADERS } from "@/lib/llms-data";

// Every product with its page, price and key specs, for AI assistants. /llms.txt links here.
export const dynamic = "force-dynamic";

export async function GET() {
  const { categories, products } = await llmsData();
  return new Response(buildLlmsTxt(categories, products), { headers: LLMS_HEADERS });
}
