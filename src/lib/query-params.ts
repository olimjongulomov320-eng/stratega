// Catalogue filters come straight from the URL; out-of-range values used to make Prisma throw (HTTP 500).

/** Largest value a Postgres int column accepts. */
const INT4_MAX = 2_147_483_647;
/** Deepest catalogue page a URL may ask for (24 products per page). */
const MAX_PAGE = 1000;

/** A non-negative number from a query parameter, or undefined. Values too big for the database are capped. */
export function numParam(value: string | string[] | undefined): number | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.min(n, INT4_MAX) : undefined;
}

/** 1-based page number from a query parameter. */
export function pageParam(value: string | string[] | undefined): number {
  return Math.min(MAX_PAGE, Math.max(1, Math.floor(numParam(value) ?? 1)));
}

/** Prisma range filter; for integer columns the bounds are rounded inward, since Prisma rejects 1.5 for an Int. */
export function rangeFilter(min: number | undefined, max: number | undefined, int = false) {
  if (min === undefined && max === undefined) return undefined;
  return {
    ...(min !== undefined ? { gte: int ? Math.ceil(min) : min } : {}),
    ...(max !== undefined ? { lte: int ? Math.floor(max) : max } : {}),
  };
}
