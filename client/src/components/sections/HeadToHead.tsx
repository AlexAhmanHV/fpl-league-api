import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { api, type HeadToHeadResponse, type StandingRow } from "../../api";
import { GlowCard } from "../ui/GlowCard";

export function HeadToHead({ standings }: { standings: StandingRow[] }) {
  const [entryA, setEntryA] = useState(standings[0]?.entry_id);
  const [entryB, setEntryB] = useState(standings[1]?.entry_id ?? standings[0]?.entry_id);
  const [result, setResult] = useState<HeadToHeadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const teamA = standings.find((s) => s.entry_id === entryA);
  const teamB = standings.find((s) => s.entry_id === entryB);

  async function compare() {
    if (!entryA || !entryB || entryA === entryB) {
      setError("Välj två olika lag.");
      setResult(null);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      setResult(await api.headToHead(entryA, entryB));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlowCard>
      <h2 className="mb-1 text-base font-semibold">Head-to-head</h2>
      <p className="mb-4 text-xs text-text-dim">Jämför två managers gameweek för gameweek</p>

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <select
          value={entryA}
          onChange={(e) => setEntryA(Number(e.target.value))}
          className="rounded-lg border border-border bg-panel-hover px-2.5 py-2 text-sm"
        >
          {standings.map((s) => (
            <option key={s.entry_id} value={s.entry_id}>
              {s.player_name}
            </option>
          ))}
        </select>
        <span className="text-sm text-text-dim">vs</span>
        <select
          value={entryB}
          onChange={(e) => setEntryB(Number(e.target.value))}
          className="rounded-lg border border-border bg-panel-hover px-2.5 py-2 text-sm"
        >
          {standings.map((s) => (
            <option key={s.entry_id} value={s.entry_id}>
              {s.player_name}
            </option>
          ))}
        </select>
        <button
          onClick={compare}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-[#04241a] transition hover:brightness-110"
        >
          {loading ? "Laddar…" : "Jämför"}
        </button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <motion.div
              key={`${entryA}-${entryB}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="my-2 text-center text-3xl font-bold"
            >
              <span className="text-accent">{result.wins_a}</span> – {result.draws} –{" "}
              <span className="text-accent">{result.wins_b}</span>
            </motion.div>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-text-dim">
                  <th className="px-2 py-2">GW</th>
                  <th className="px-2 py-2">{teamA?.player_name ?? "A"}</th>
                  <th className="px-2 py-2">{teamB?.player_name ?? "B"}</th>
                </tr>
              </thead>
              <tbody>
                {result.gameweeks.map((gw) => (
                  <tr key={gw.event} className="border-b border-border last:border-0">
                    <td className="px-2 py-2">GW {gw.event}</td>
                    <td className={`px-2 py-2 ${gw.winner === "a" ? "font-bold" : ""}`}>{gw.entry_a_points}</td>
                    <td className={`px-2 py-2 ${gw.winner === "b" ? "font-bold" : ""}`}>{gw.entry_b_points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </GlowCard>
  );
}
