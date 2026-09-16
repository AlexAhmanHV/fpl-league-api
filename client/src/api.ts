export interface StandingRow {
  entry_id: number;
  player_name: string;
  team_name: string;
  rank: number;
  last_rank: number;
  total_points: number;
  event_total: number;
}

export interface StandingsResponse {
  league_id: number;
  league_name: string;
  standings: StandingRow[];
}

export interface HistoryTeam {
  entry_id: number;
  player_name: string;
  team_name: string;
  gameweeks: Array<{ event: number; points: number; total_points: number; overall_rank: number }>;
}

export interface HistoryResponse {
  league_id: number;
  teams: HistoryTeam[];
}

export interface ChipWindowStatus {
  name: string;
  label: string;
  window: number;
  start_event: number;
  stop_event: number;
  status: "used" | "available" | "upcoming" | "missed";
  used_event: number | null;
}

export interface ChipStatusResponse {
  league_id: number;
  current_event: number;
  teams: Array<{ entry_id: number; player_name: string; team_name: string; chips: ChipWindowStatus[] }>;
}

export interface CaptainRow {
  entry_id: number;
  player_name: string;
  team_name: string;
  captain: string;
  captain_points: number;
  best_possible_captain: string;
  best_possible_points: number;
  optimal_captain_choice: boolean;
}

export interface CaptainsResponse {
  league_id: number;
  event_id: number;
  captains: CaptainRow[];
}

export interface TransferItem {
  player_in: string;
  player_in_cost: number;
  player_out: string;
  player_out_cost: number;
  time: string;
}

export interface TransfersResponse {
  league_id: number;
  event_id: number;
  teams: Array<{
    entry_id: number;
    player_name: string;
    team_name: string;
    transfers: TransferItem[];
    points_hit: number;
  }>;
}

export interface HeadToHeadResponse {
  entry_a: number;
  entry_b: number;
  wins_a: number;
  wins_b: number;
  draws: number;
  gameweeks: Array<{ event: number; entry_a_points: number; entry_b_points: number; winner: "a" | "b" | "draw" }>;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? "Något gick fel");
  return data as T;
}

export const api = {
  standings: (leagueId: string) => fetchJson<StandingsResponse>(`/leagues/${leagueId}/standings`),
  history: (leagueId: string) => fetchJson<HistoryResponse>(`/leagues/${leagueId}/history`),
  chipStatus: (leagueId: string) => fetchJson<ChipStatusResponse>(`/leagues/${leagueId}/chip-status`),
  captains: (leagueId: string) => fetchJson<CaptainsResponse>(`/leagues/${leagueId}/captains`),
  transfers: (leagueId: string, eventId?: number) =>
    fetchJson<TransfersResponse>(`/leagues/${leagueId}/transfers${eventId ? `?event_id=${eventId}` : ""}`),
  headToHead: (entryA: number, entryB: number) =>
    fetchJson<HeadToHeadResponse>(`/head-to-head?entry_a=${entryA}&entry_b=${entryB}`),
};
