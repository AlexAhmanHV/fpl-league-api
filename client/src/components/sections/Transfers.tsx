import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { api, type TransfersResponse } from "../../api";
import { GlowCard } from "../ui/GlowCard";

export function Transfers({
  leagueId,
  events,
  defaultEvent,
}: {
  leagueId: string;
  events: number[];
  defaultEvent: number;
}) {
  const [eventId, setEventId] = useState(defaultEvent);
  const [data, setData] = useState<TransfersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => setEventId(defaultEvent), [defaultEvent]);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .transfers(leagueId, eventId)
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [leagueId, eventId]);

  const teamsWithMoves = data?.teams.filter((t) => t.transfers.length > 0) ?? [];
  const quietTeams = data?.teams.filter((t) => t.transfers.length === 0) ?? [];

  return (
    <GlowCard>
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Byten</h2>
        <select
          value={eventId}
          onChange={(e) => setEventId(Number(e.target.value))}
          className="rounded-lg border border-border bg-panel-hover px-2.5 py-1.5 text-xs"
        >
          {events.map((e) => (
            <option key={e} value={e}>
              GW{e}
            </option>
          ))}
        </select>
      </div>
      <p className="mb-4 text-xs text-text-dim">Vilka byten som gjordes i respektive omgång</p>

      {loading && <p className="text-sm text-text-dim">Laddar…</p>}
      {error && <p className="text-sm text-danger">{error}</p>}

      {!loading && data && teamsWithMoves.length === 0 && (
        <p className="text-sm text-text-dim">Inga byten gjorda denna gameweek.</p>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={eventId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {teamsWithMoves.map((team) => (
            <div key={team.entry_id}>
              <div className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                {team.player_name}
                {team.points_hit > 0 && (
                  <span className="rounded-full bg-danger/15 px-2 py-0.5 text-[11px] font-semibold text-danger">
                    -{team.points_hit}p hit
                  </span>
                )}
                <span className="text-xs font-normal text-text-dim">
                  {team.transfers.length} {team.transfers.length === 1 ? "byte" : "byten"}
                </span>
              </div>
              <ul className="space-y-1">
                {team.transfers.map((t, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-2 rounded-lg bg-panel-hover px-3 py-1.5 text-sm"
                  >
                    <span className="text-danger">{t.player_out}</span>
                    <span className="text-text-dim">→</span>
                    <span className="text-accent">{t.player_in}</span>
                    <span className="ml-auto text-xs text-text-dim">£{t.player_in_cost.toFixed(1)}m</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          ))}

          {quietTeams.length > 0 && teamsWithMoves.length > 0 && (
            <p className="text-xs text-text-dim">
              Inga byten: {quietTeams.map((t) => t.player_name).join(", ")}
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </GlowCard>
  );
}
