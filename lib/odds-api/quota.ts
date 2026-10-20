export interface QuotaHeaders {
  remaining: number | null;
  used: number | null;
  last: number | null;
}

type HeaderSource = { get(name: string): string | null };

function toNumber(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function parseQuotaHeaders(headers: HeaderSource): QuotaHeaders {
  return {
    remaining: toNumber(headers.get("x-requests-remaining")),
    used: toNumber(headers.get("x-requests-used")),
    last: toNumber(headers.get("x-requests-last")),
  };
}
