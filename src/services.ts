// Derived stats built on top of the raw FPL client data.
import { FPLClient } from "./fplClient";

export async function getPlayerNameMap(client: FPLClient): Promise<Map<number, string>> {
  const bootstrap = await client.bootstrapStatic();
  return new Map(bootstrap.elements.map((p) => [p.id, p.web_name]));
}

export async function getCurrentEventId(client: FPLClient): Promise<number> {
  const bootstrap = await client.bootstrapStatic();
  const current = bootstrap.events.find((e) => e.is_current);
  if (current) return current.id;
  const finished = bootstrap.events.filter((e) => e.finished);
  if (finished.length) return finished[finished.length - 1].id;
  return bootstrap.events[0].id;
}

export async function leagueStandings(client: FPLClient, leagueId: number) {
  const data = await client.allLeagueStandings(leagueId);
  return {
    league_id: leagueId,
    league_name: data.league.name,
    standings: data.standings.results.map((r) => ({
      entry_id: r.entry,
      player_name: r.player_name,
      team_name: r.entry_name,
      rank: r.rank,
      last_rank: r.last_rank,
      total_points: r.total,
      event_total: r.event_total,
    })),
  };
}

export async function leagueRankHistory(client: FPLClient, leagueId: number) {
  const standings = await client.allLeagueStandings(leagueId);
  const entries = standings.standings.results;

  const histories = await Promise.all(entries.map((e) => client.entryHistory(e.entry)));

  const teams = entries.map((entry, i) => ({
    entry_id: entry.entry,
    player_name: entry.player_name,
    team_name: entry.entry_name,
    gameweeks: histories[i].current.map((gw) => ({
      event: gw.event,
      points: gw.points,
      total_points: gw.total_points,
      overall_rank: gw.overall_rank,
    })),
  }));

  return { league_id: leagueId, teams };
}

export async function leagueChipTracker(client: FPLClient, leagueId: number) {
  const standings = await client.allLeagueStandings(leagueId);
  const entries = standings.standings.results;

  const histories = await Promise.all(entries.map((e) => client.entryHistory(e.entry)));

  const chipsByName: Record<
    string,
    Array<{ entry_id: number; player_name: string; team_name: string; event: number }>
  > = {};

  entries.forEach((entry, i) => {
    for (const chip of histories[i].chips) {
      if (!chipsByName[chip.name]) chipsByName[chip.name] = [];
      chipsByName[chip.name].push({
        entry_id: entry.entry,
        player_name: entry.player_name,
        team_name: entry.entry_name,
        event: chip.event,
      });
    }
  });

  for (const uses of Object.values(chipsByName)) {
    uses.sort((a, b) => a.event - b.event);
  }

  return { league_id: leagueId, chips: chipsByName };
}

const CHIP_LABELS: Record<string, string> = {
  wildcard: "Wildcard",
  freehit: "Free Hit",
  bboost: "Bench Boost",
  "3xc": "Triple Captain",
};

export async function leagueChipStatus(client: FPLClient, leagueId: number) {
  const [standings, bootstrap] = await Promise.all([
    client.allLeagueStandings(leagueId),
    client.bootstrapStatic(),
  ]);
  const entries = standings.standings.results;
  const currentEvent = await getCurrentEventId(client);

  const histories = await Promise.all(entries.map((e) => client.entryHistory(e.entry)));

  // Group each chip's windows (FPL currently gives every chip type two
  // windows per season — one per half) and label them 1, 2, ... in order.
  const windowsByChip = new Map<string, Array<{ start_event: number; stop_event: number; window: number }>>();
  for (const chip of bootstrap.chips) {
    if (!windowsByChip.has(chip.name)) windowsByChip.set(chip.name, []);
    windowsByChip.get(chip.name)!.push({ start_event: chip.start_event, stop_event: chip.stop_event, window: 0 });
  }
  for (const windows of windowsByChip.values()) {
    windows.sort((a, b) => a.start_event - b.start_event);
    windows.forEach((w, i) => (w.window = i + 1));
  }

  const teams = entries.map((entry, i) => {
    const usedEvents = histories[i].chips.map((c) => ({ name: c.name, event: c.event }));

    const chips = [...windowsByChip.entries()].flatMap(([name, windows]) =>
      windows.map((w) => {
        const used = usedEvents.find(
          (u) => u.name === name && u.event >= w.start_event && u.event <= w.stop_event
        );
        let status: "used" | "available" | "upcoming" | "missed";
        if (used) status = "used";
        else if (currentEvent > w.stop_event) status = "missed";
        else if (currentEvent >= w.start_event) status = "available";
        else status = "upcoming";

        return {
          name,
          label: CHIP_LABELS[name] ?? name,
          window: w.window,
          start_event: w.start_event,
          stop_event: w.stop_event,
          status,
          used_event: used?.event ?? null,
        };
      })
    );

    return {
      entry_id: entry.entry,
      player_name: entry.player_name,
      team_name: entry.entry_name,
      chips,
    };
  });

  return { league_id: leagueId, current_event: currentEvent, teams };
}

export async function leagueCaptainAnalysis(
  client: FPLClient,
  leagueId: number,
  eventId: number
) {
  const standings = await client.allLeagueStandings(leagueId);
  const entries = standings.standings.results;

  const [nameMap, live] = await Promise.all([
    getPlayerNameMap(client),
    client.eventLive(eventId),
  ]);
  const livePoints = new Map(live.elements.map((el) => [el.id, el.stats.total_points]));

  const picksList = await Promise.all(
    entries.map((e) => client.entryPicks(e.entry, eventId))
  );

  const results = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const picks = picksList[i].picks;
    const captainPick = picks.find((p) => p.is_captain);
    const starters = picks.filter((p) => p.multiplier >= 1);

    if (!starters.length || !captainPick) continue;

    const bestStarter = starters.reduce((best, p) =>
      (livePoints.get(p.element) ?? 0) > (livePoints.get(best.element) ?? 0) ? p : best
    );
    const captainRawPoints = livePoints.get(captainPick.element) ?? 0;

    results.push({
      entry_id: entry.entry,
      player_name: entry.player_name,
      team_name: entry.entry_name,
      captain: nameMap.get(captainPick.element) ?? "Unknown",
      captain_points: captainRawPoints * captainPick.multiplier,
      best_possible_captain: nameMap.get(bestStarter.element) ?? "Unknown",
      best_possible_points: (livePoints.get(bestStarter.element) ?? 0) * captainPick.multiplier,
      optimal_captain_choice: captainPick.element === bestStarter.element,
    });
  }

  return { league_id: leagueId, event_id: eventId, captains: results };
}

export async function headToHead(client: FPLClient, entryA: number, entryB: number) {
  const [historyA, historyB] = await Promise.all([
    client.entryHistory(entryA),
    client.entryHistory(entryB),
  ]);

  const gwsA = new Map(historyA.current.map((gw) => [gw.event, gw]));
  const gwsB = new Map(historyB.current.map((gw) => [gw.event, gw]));

  const sharedEvents = [...gwsA.keys()].filter((e) => gwsB.has(e)).sort((a, b) => a - b);

  let winsA = 0;
  let winsB = 0;
  let draws = 0;
  const gameweeks = sharedEvents.map((event) => {
    const pa = gwsA.get(event)!.points;
    const pb = gwsB.get(event)!.points;
    let winner: "a" | "b" | "draw";
    if (pa > pb) {
      winner = "a";
      winsA += 1;
    } else if (pb > pa) {
      winner = "b";
      winsB += 1;
    } else {
      winner = "draw";
      draws += 1;
    }
    return { event, entry_a_points: pa, entry_b_points: pb, winner };
  });

  return {
    entry_a: entryA,
    entry_b: entryB,
    wins_a: winsA,
    wins_b: winsB,
    draws,
    gameweeks,
  };
}

export async function leagueTransfers(client: FPLClient, leagueId: number, eventId: number) {
  const standings = await client.allLeagueStandings(leagueId);
  const entries = standings.standings.results;

  const [nameMap, transfersList, historiesList] = await Promise.all([
    getPlayerNameMap(client),
    Promise.all(entries.map((e) => client.entryTransfers(e.entry))),
    Promise.all(entries.map((e) => client.entryHistory(e.entry))),
  ]);

  const teams = entries.map((entry, i) => {
    const transfers = transfersList[i]
      .filter((t) => t.event === eventId)
      .map((t) => ({
        player_in: nameMap.get(t.element_in) ?? "Unknown",
        player_in_cost: t.element_in_cost / 10,
        player_out: nameMap.get(t.element_out) ?? "Unknown",
        player_out_cost: t.element_out_cost / 10,
        time: t.time,
      }))
      // FPL returns transfers newest-first; show them in the order they were made.
      .reverse();

    const gwHistory = historiesList[i].current.find((gw) => gw.event === eventId);

    return {
      entry_id: entry.entry,
      player_name: entry.player_name,
      team_name: entry.entry_name,
      transfers,
      points_hit: gwHistory?.event_transfers_cost ?? 0,
    };
  });

  return { league_id: leagueId, event_id: eventId, teams };
}
