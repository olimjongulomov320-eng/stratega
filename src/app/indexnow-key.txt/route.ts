import { INDEXNOW_KEY } from "@/lib/indexnow";

// The key file IndexNow fetches to confirm that submissions for this site come from its owner.
export function GET() {
  return new Response(INDEXNOW_KEY, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
