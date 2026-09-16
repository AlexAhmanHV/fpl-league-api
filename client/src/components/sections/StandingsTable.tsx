import { motion } from "framer-motion";
import type { StandingRow } from "../../api";
import { AnimatedNumber } from "../ui/AnimatedNumber";
import { GlowCard } from "../ui/GlowCard";

export function StandingsTable({ standings }: { standings: StandingRow[] }) {
  return (
    <GlowCard>
      <h2 className="mb-1 text-base font-semibold">Tabell</h2>
      <p className="mb-4 text-xs text-text-dim">Aktuell ställning i ligan</p>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wide text-text-dim">
            <th className="px-2 py-2">#</th>
            <th className="px-2 py-2">Namn</th>
            <th className="px-2 py-2"></th>
            <th className="px-2 py-2">GW</th>
            <th className="px-2 py-2">Totalt</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((r, i) => (
            <motion.tr
              key={r.entry_id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className="border-b border-border last:border-0"
            >
              <td className="px-2 py-2 font-bold text-accent">{r.rank}</td>
              <td className="px-2 py-2">{r.player_name}</td>
              <td className="px-2 py-2 text-xs">
                {r.last_rank && r.last_rank !== r.rank ? (
                  <span className={r.last_rank > r.rank ? "text-accent" : "text-danger"}>
                    {r.last_rank > r.rank ? "▲" : "▼"}
                  </span>
                ) : null}
              </td>
              <td className="px-2 py-2">{r.event_total}</td>
              <td className="px-2 py-2 font-semibold">
                <AnimatedNumber value={r.total_points} />
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </GlowCard>
  );
}
