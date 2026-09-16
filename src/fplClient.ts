// Thin client around the unofficial FPL API, with TTL caching.
import axios, { AxiosInstance } from "axios";
import NodeCache from "node-cache";

const BASE_URL = "https://fantasy.premierleague.com/api";

export class FPLNotFoundError extends Error {}

// Bootstrap data (players/teams/events) changes rarely mid-week.
const bootstrapCache = new NodeCache({ stdTTL: 3600 });
// League standings and entry histories can shift after each deadline.
const standingsCache = new NodeCache({ stdTTL: 900 });
const entryCache = new NodeCache({ stdTTL: 900 });
// Picks for a finished gameweek never change; cache them longer.
const picksCache = new NodeCache({ stdTTL: 3600 });
const liveCache = new NodeCache({ stdTTL: 900 });
const transfersCache = new NodeCache({ stdTTL: 900 });

export interface StandingsResult {
  entry: number;
  player_name: string;
  entry_name: string;
  rank: number;
  last_rank: number;
  total: number;
  event_total: number;
}

export interface StandingsResponse {
  league: { id: number; name: string };
  standings: { results: StandingsResult[]; has_next: boolean };
}

export interface EntryHistory {
  current: Array<{
    event: number;
    points: number;
    total_points: number;
    overall_rank: number;
    event_transfers: number;
    event_transfers_cost: number;
  }>;
  chips: Array<{ name: string; event: number; time: string }>;
}

export interface PicksResponse {
  picks: Array<{ element: number; multiplier: number; is_captain: boolean }>;
}

export interface ChipWindow {
  id: number;
  name: string;
  start_event: number;
  stop_event: number;
}

export interface BootstrapStatic {
  events: Array<{ id: number; is_current: boolean; finished: boolean }>;
  elements: Array<{ id: number; web_name: string }>;
  chips: ChipWindow[];
}

export interface EventLive {
  elements: Array<{ id: number; stats: { total_points: number } }>;
}

export interface Transfer {
  element_in: number;
  element_in_cost: number;
  element_out: number;
  element_out_cost: number;
  event: number;
  time: string;
}

async function get<T>(client: AxiosInstance, path: string): Promise<T> {
  try {
    const resp = await client.get<T>(path);
    return resp.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      throw new FPLNotFoundError(`FPL resource not found: ${path}`);
    }
    throw err;
  }
}

export class FPLClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({ baseURL: BASE_URL, timeout: 15000 });
  }

  async bootstrapStatic(): Promise<BootstrapStatic> {
    const cached = bootstrapCache.get<BootstrapStatic>("data");
    if (cached) return cached;
    const data = await get<BootstrapStatic>(this.client, "/bootstrap-static/");
    bootstrapCache.set("data", data);
    return data;
  }

  async leagueStandings(leagueId: number, page = 1): Promise<StandingsResponse> {
    const key = `${leagueId}:${page}`;
    const cached = standingsCache.get<StandingsResponse>(key);
    if (cached) return cached;
    const data = await get<StandingsResponse>(
      this.client,
      `/leagues-classic/${leagueId}/standings/?page_standings=${page}`
    );
    standingsCache.set(key, data);
    return data;
  }

  async allLeagueStandings(leagueId: number): Promise<StandingsResponse> {
    let page = 1;
    let current = await this.leagueStandings(leagueId, page);
    const results = [...current.standings.results];
    while (current.standings.has_next) {
      page += 1;
      current = await this.leagueStandings(leagueId, page);
      results.push(...current.standings.results);
    }
    return {
      league: current.league,
      standings: { results, has_next: false },
    };
  }

  async entryHistory(entryId: number): Promise<EntryHistory> {
    const cached = entryCache.get<EntryHistory>(entryId);
    if (cached) return cached;
    const data = await get<EntryHistory>(this.client, `/entry/${entryId}/history/`);
    entryCache.set(entryId, data);
    return data;
  }

  async entryPicks(entryId: number, eventId: number): Promise<PicksResponse> {
    const key = `${entryId}:${eventId}`;
    const cached = picksCache.get<PicksResponse>(key);
    if (cached) return cached;
    const data = await get<PicksResponse>(
      this.client,
      `/entry/${entryId}/event/${eventId}/picks/`
    );
    picksCache.set(key, data);
    return data;
  }

  async eventLive(eventId: number): Promise<EventLive> {
    const cached = liveCache.get<EventLive>(eventId);
    if (cached) return cached;
    const data = await get<EventLive>(this.client, `/event/${eventId}/live/`);
    liveCache.set(eventId, data);
    return data;
  }

  async entryTransfers(entryId: number): Promise<Transfer[]> {
    const cached = transfersCache.get<Transfer[]>(entryId);
    if (cached) return cached;
    const data = await get<Transfer[]>(this.client, `/entry/${entryId}/transfers/`);
    transfersCache.set(entryId, data);
    return data;
  }
}

let sharedClient: FPLClient | null = null;

export function getClient(): FPLClient {
  if (!sharedClient) sharedClient = new FPLClient();
  return sharedClient;
}
