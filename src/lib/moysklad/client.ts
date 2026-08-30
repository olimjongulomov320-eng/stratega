const BASE_URL = "https://api.moysklad.ru/api/remap/1.2";
const PAGE_LIMIT = 1000;
const REQUEST_DELAY_MS = 300;

export class MoySkladError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function msFetch<T>(
  token: string,
  path: string,
  query?: Record<string, string | number>
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    url.searchParams.set(key, String(value));
  }

  let attempt = 0;
  for (;;) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json;charset=utf-8",
      },
    });

    if (res.status === 429 && attempt < 3) {
      attempt += 1;
      await sleep(1000 * attempt);
      continue;
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new MoySkladError(
        `MoySklad API xatoligi (${res.status}): ${body.slice(0, 300)}`,
        res.status
      );
    }

    return res.json() as Promise<T>;
  }
}

export type MoySkladImage = {
  meta: { downloadHref: string };
};

export type MoySkladAssortmentItem = {
  id: string;
  updated: string;
  name: string;
  code?: string;
  article?: string;
  archived?: boolean;
  meta: { type: string };
  salePrices?: { value: number; priceType: { name: string } }[];
  images?: { rows: MoySkladImage[] };
};

type ListResponse<T> = {
  rows: T[];
  meta: { size: number; limit: number; offset: number };
};

export async function testConnection(
  token: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await msFetch<ListResponse<MoySkladAssortmentItem>>(token, "/entity/assortment", {
      limit: 1,
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export async function fetchAllAssortment(
  token: string
): Promise<MoySkladAssortmentItem[]> {
  const items: MoySkladAssortmentItem[] = [];
  let offset = 0;

  for (;;) {
    const page = await msFetch<ListResponse<MoySkladAssortmentItem>>(
      token,
      "/entity/assortment",
      { limit: PAGE_LIMIT, offset, expand: "images" }
    );
    items.push(...page.rows);

    if (page.rows.length < PAGE_LIMIT) break;
    offset += PAGE_LIMIT;
    await sleep(REQUEST_DELAY_MS);
  }

  return items;
}

export async function fetchStockReport(
  token: string
): Promise<Map<string, number>> {
  const stockById = new Map<string, number>();
  let offset = 0;

  for (;;) {
    const page = await msFetch<
      ListResponse<{ assortmentId: string; stock: number }>
    >(token, "/report/stock/all/current", { limit: PAGE_LIMIT, offset });

    for (const row of page.rows) {
      stockById.set(row.assortmentId, row.stock);
    }

    if (page.rows.length < PAGE_LIMIT) break;
    offset += PAGE_LIMIT;
    await sleep(REQUEST_DELAY_MS);
  }

  return stockById;
}

export async function downloadImageBytes(
  token: string,
  downloadHref: string
): Promise<Buffer> {
  const res = await fetch(downloadHref, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new MoySkladError(
      `Rasmni yuklab bo'lmadi (${res.status})`,
      res.status
    );
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
