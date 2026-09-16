import { motion } from "framer-motion";
import type { ChipStatusResponse, ChipWindowStatus } from "../../api";
import { GlowCard } from "../ui/GlowCard";

const CHIP_ORDER = ["wildcard", "freehit", "bboost", "3xc"];
const CHIP_SHORT: Record<string, string> = { wildcard: "WC", freehit: "FH", bboost: "BB", "3xc": "TC" };
const STATUS_TITLE: Record<ChipWindowStatus["status"], string> = {
  used: "Använd",
  available: "Kvar att spela",
  upcoming: "Öppnar senare",
  missed: "Missad (fönstret stängt)",
};
const STATUS_COLOR: Record<ChipWindowStatus["status"], string> = {
  used: "bg-accent",
  available: "bg-[#2f81f7]",
  upcoming: "bg-border",
  missed: "bg-danger",
};

export function ChipTracker({ data }: { data: ChipStatusResponse }) {
  return (
    <GlowCard>
      <h2 className="mb-1 text-base font-semibold">Chip-tracker</h2>
      <p className="mb-4 text-xs text-text-dim">Vem spelade vad, och vad som är kvar</p>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wide text-text-dim">
            <th className="px-2 py-2">Namn</th>
            {CHIP_ORDER.map((name) => (
              <th key={name} className="px-2 py-2 text-center">
                {CHIP_SHORT[name]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.teams.map((team, i) => (
            <motion.tr
              key={team.entry_id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="border-b border-border last:border-0"
            >
              <td className="px-2 py-2">{team.player_name}</td>
              {CHIP_ORDER.map((name) => {
                const windows = team.chips.filter((c) => c.name === name).sort((a, b) => a.window - b.window);
                return (
                  <td key={name} className="px-2 py-2 text-center">
                    <span className="inline-flex gap-[3px]">
                      {windows.map((w) => (
                        <span
                          key={w.window}
                          title={`${w.label} · del ${w.window} (GW${w.start_event}-${w.stop_event})${
                            w.used_event ? ` · spelad GW${w.used_event}` : ""
                          } · ${STATUS_TITLE[w.status]}`}
                          className={`inline-block h-2.5 w-2.5 rounded-[3px] ${STATUS_COLOR[w.status]}`}
                        />
                      ))}
                    </span>
                  </td>
                );
              })}
            </motion.tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3.5 flex flex-wrap gap-3.5 text-[11px] text-text-dim">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-accent" /> Använd
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-[#2f81f7]" /> Kvar nu
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-border" /> Öppnar senare
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-danger" /> Missad
        </span>
      </div>
    </GlowCard>
  );
}
