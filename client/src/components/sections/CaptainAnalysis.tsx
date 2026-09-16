import { motion } from "framer-motion";
import type { CaptainsResponse } from "../../api";
import { GlowCard } from "../ui/GlowCard";

export function CaptainAnalysis({ data }: { data: CaptainsResponse }) {
  return (
    <GlowCard>
      <h2 className="mb-1 text-base font-semibold">Kapten-analys</h2>
      <p className="mb-4 text-xs text-text-dim">Gameweek {data.event_id}</p>

      {data.captains.length === 0 ? (
        <p className="text-sm text-text-dim">Ingen data för denna gameweek än.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-text-dim">
              <th className="px-2 py-2">Namn</th>
              <th className="px-2 py-2">Kapten</th>
              <th className="px-2 py-2">Resultat</th>
            </tr>
          </thead>
          <tbody>
            {data.captains.map((c, i) => (
              <motion.tr
                key={c.entry_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="border-b border-border last:border-0"
              >
                <td className="px-2 py-2">{c.player_name}</td>
                <td className="px-2 py-2">
                  {c.captain} ({c.captain_points}p)
                </td>
                <td className="px-2 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      c.optimal_captain_choice ? "bg-accent/15 text-accent" : "bg-danger/15 text-danger"
                    }`}
                  >
                    {c.optimal_captain_choice ? "Optimal" : "Missade bäst"}
                  </span>
                  {!c.optimal_captain_choice && (
                    <div className="text-xs text-text-dim">
                      bäst: {c.best_possible_captain} ({c.best_possible_points}p)
                    </div>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      )}
    </GlowCard>
  );
}
