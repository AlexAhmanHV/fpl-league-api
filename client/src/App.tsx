import { motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import {
  api,
  type CaptainsResponse,
  type ChipStatusResponse,
  type HistoryResponse,
  type StandingsResponse,
} from "./api";
import { CaptainAnalysis } from "./components/sections/CaptainAnalysis";
import { ChipTracker } from "./components/sections/ChipTracker";
import { HeadToHead } from "./components/sections/HeadToHead";
import { RankHistoryChart } from "./components/sections/RankHistoryChart";
import { StandingsTable } from "./components/sections/StandingsTable";
import { Transfers } from "./components/sections/Transfers";
import { GradientHeading } from "./components/ui/GradientHeading";
import { CardSkeleton } from "./components/ui/Skeleton";

function CardShell({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-border bg-panel p-5">{children}</div>;
}

const LEAGUE_ID = "1092251";

export default function App() {
  const leagueId = LEAGUE_ID;

  const [standings, setStandings] = useState<StandingsResponse | null>(null);
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [chips, setChips] = useState<ChipStatusResponse | null>(null);
  const [captains, setCaptains] = useState<CaptainsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);

    api
      .standings(leagueId)
      .then((data) => {
        if (cancelled) return;
        setStandings(data);
      })
      .catch((err) => !cancelled && setError(err.message));

    api.history(leagueId).then((data) => !cancelled && setHistory(data)).catch(() => {});
    api.chipStatus(leagueId).then((data) => !cancelled && setChips(data)).catch(() => {});
    api.captains(leagueId).then((data) => !cancelled && setCaptains(data)).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [leagueId]);

  return (
    <div className="min-h-screen">
      <header className="px-6 pb-4 pt-10 text-center">
        <GradientHeading>{standings?.league_name ?? "FPL Mini-League Dashboard"}</GradientHeading>
        <p className="mt-1 text-sm text-text-dim">
          {standings ? `${standings.standings.length} lag` : "Laddar…"}
        </p>
      </header>

      <main className="mx-auto grid max-w-5xl gap-5 px-6 py-6">
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
            {error}
          </motion.div>
        )}

        {standings ? (
          <StandingsTable standings={standings.standings} />
        ) : (
          !error && (
            <CardShell>
              <CardSkeleton rows={6} />
            </CardShell>
          )
        )}

        {history ? (
          <RankHistoryChart teams={history.teams} />
        ) : (
          !error && (
            <CardShell>
              <CardSkeleton rows={3} />
            </CardShell>
          )
        )}

        <div className="grid gap-5 md:grid-cols-2">
          {captains ? (
            <CaptainAnalysis data={captains} />
          ) : (
            !error && (
              <CardShell>
                <CardSkeleton rows={4} />
              </CardShell>
            )
          )}
          {chips ? (
            <ChipTracker data={chips} />
          ) : (
            !error && (
              <CardShell>
                <CardSkeleton rows={4} />
              </CardShell>
            )
          )}
        </div>

        {history && captains && (
          <Transfers
            leagueId={leagueId}
            events={history.teams[0]?.gameweeks.map((g) => g.event) ?? []}
            defaultEvent={captains.event_id}
          />
        )}

        {standings && <HeadToHead standings={standings.standings} />}
      </main>

      <footer className="px-6 py-8 text-center text-xs text-text-dim">
        Byggt på FPL:s publika data ·{" "}
        <a href="/docs" className="text-accent hover:underline">
          API-dokumentation
        </a>
      </footer>
    </div>
  );
}
