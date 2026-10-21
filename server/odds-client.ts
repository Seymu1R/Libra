import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { z } from "zod";
import { ODDS_API_BASE_URL, ODDS_MARKETS, ODDS_REQUEST, sportOf } from "@/lib/config";
import { FIXTURE_ANCHOR } from "@/lib/fixtures-anchor";
import { parseQuotaHeaders, type QuotaHeaders } from "@/lib/odds-api/quota";
import {
  eventsResponseSchema,
  oddsResponseSchema,
  sportsResponseSchema,
  type ApiEvent,
  type OddsEvent,
  type Sport,
} from "@/lib/odds-api/schemas";
import { toApiIso } from "@/lib/time";

export interface ApiResult<T> {
  data: T;
  quota: QuotaHeaders;
}

export interface CallLog {
  endpoint: string;
  httpStatus: number;
  quota: QuotaHeaders;
}

export interface TimeWindow {
  from: Date;
  to: Date;
}

export interface OddsClient {
  readonly mock: boolean;
  getSports(): Promise<ApiResult<Sport[]>>;
  getEvents(sportKey: string, window: TimeWindow): Promise<ApiResult<ApiEvent[]>>;
  getOdds(sportKey: string, window: TimeWindow): Promise<ApiResult<OddsEvent[]>>;
}

export class OddsApiError extends Error {
  constructor(
    readonly httpStatus: number,
    message: string,
  ) {
    super(message);
    this.name = "OddsApiError";
  }
}

const NO_QUOTA: QuotaHeaders = { remaining: null, used: null, last: null };

export class HttpOddsClient implements OddsClient {
  readonly mock = false;

  constructor(
    private readonly apiKey: string,
    private readonly onCall: (log: CallLog) => Promise<void> = async () => {},
    private readonly baseUrl: string = ODDS_API_BASE_URL,
  ) {}

  getSports(all = false) {
    return this.request("/v4/sports", all ? { all: "true" } : {}, sportsResponseSchema);
  }

  getEvents(sportKey: string, window: TimeWindow) {
    return this.request(`/v4/sports/${encodeURIComponent(sportKey)}/events`, windowParams(window), eventsResponseSchema);
  }

  getOdds(sportKey: string, window: TimeWindow) {
    return this.request(
      `/v4/sports/${encodeURIComponent(sportKey)}/odds`,
      { ...ODDS_REQUEST, markets: ODDS_MARKETS[sportOf(sportKey)], ...windowParams(window) },
      oddsResponseSchema,
    );
  }

  private async request<S extends z.ZodType>(
    endpoint: string,
    params: Record<string, string>,
    schema: S,
  ): Promise<ApiResult<z.infer<S>>> {
    const url = new URL(endpoint, this.baseUrl);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    url.searchParams.set("apiKey", this.apiKey);

    const res = await fetch(url, { cache: "no-store" });
    const quota = parseQuotaHeaders(res.headers);
    console.info(
      `[odds-api] ${endpoint} → ${res.status} remaining=${quota.remaining} used=${quota.used} last=${quota.last}`,
    );
    await this.onCall({ endpoint, httpStatus: res.status, quota });

    if (!res.ok) {
      const body = (await res.text()).slice(0, 300);
      throw new OddsApiError(res.status, `HTTP ${res.status}: ${body}`);
    }
    const parsed = schema.safeParse(await res.json());
    if (!parsed.success) {
      throw new OddsApiError(res.status, `Gözlənilməz cavab strukturu: ${parsed.error.message.slice(0, 300)}`);
    }
    return { data: parsed.data, quota };
  }
}

function windowParams(window: TimeWindow): Record<string, string> {
  return { commenceTimeFrom: toApiIso(window.from), commenceTimeTo: toApiIso(window.to) };
}

/** Serves fixtures/ — no network, no credits. Fixture times are shifted so FIXTURE_ANCHOR ≈ now. */
export class MockOddsClient implements OddsClient {
  readonly mock = true;

  constructor(
    private readonly now: () => Date = () => new Date(),
    private readonly fixturesDir: string = path.join(process.cwd(), "fixtures"),
  ) {}

  async getSports() {
    const data = sportsResponseSchema.parse(await this.read("sports.json"));
    return { data, quota: NO_QUOTA };
  }

  async getEvents(sportKey: string, window: TimeWindow) {
    const raw = eventsResponseSchema.parse(await this.read(`events/${sportKey}.json`));
    return { data: this.inWindow(raw.map((e) => this.shift(e)), window), quota: NO_QUOTA };
  }

  async getOdds(sportKey: string, window: TimeWindow) {
    const raw = oddsResponseSchema.parse(await this.read(`odds/${sportKey}.json`));
    // The real API also returns odds for live games inside the window, so the "not started"
    // filter in the sync service is still exercised: we include events from 3h before `from`.
    const widened = { from: new Date(window.from.getTime() - 3 * 3600_000), to: window.to };
    return { data: this.inWindow(raw.map((e) => this.shift(e)), widened), quota: NO_QUOTA };
  }

  private async read(file: string): Promise<unknown> {
    try {
      return JSON.parse(await readFile(path.join(this.fixturesDir, file), "utf8"));
    } catch {
      throw new OddsApiError(404, `Mock fixture tapılmadı: ${file}`);
    }
  }

  private shift<T extends { commence_time: string }>(e: T): T {
    const delta = this.now().getTime() - new Date(FIXTURE_ANCHOR).getTime();
    return { ...e, commence_time: toApiIso(new Date(new Date(e.commence_time).getTime() + delta)) };
  }

  private inWindow<T extends { commence_time: string }>(events: T[], window: TimeWindow): T[] {
    return events.filter((e) => {
      const t = new Date(e.commence_time).getTime();
      return t >= window.from.getTime() && t <= window.to.getTime();
    });
  }
}

export function isMockMode(): boolean {
  return process.env.USE_MOCK_DATA === "true";
}

/** The only place ODDS_API_KEY is read (project-context rule 2). */
export function createOddsClient(onCall?: (log: CallLog) => Promise<void>): OddsClient {
  if (isMockMode()) return new MockOddsClient();
  const key = process.env.ODDS_API_KEY;
  if (!key) {
    throw new OddsApiError(0, "ODDS_API_KEY təyin edilməyib. .env faylına əlavə edin və ya USE_MOCK_DATA=true qoyun.");
  }
  return new HttpOddsClient(key, onCall);
}
