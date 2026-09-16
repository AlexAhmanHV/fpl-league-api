import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { HistoryTeam } from "../../api";
import { GlowCard } from "../ui/GlowCard";

const CHART_COLORS = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
  "var(--series-6)",
  "var(--series-7)",
  "var(--series-8)",
];

function computeLeagueRanks(teams: HistoryTeam[]) {
  const events = [...new Set(teams.flatMap((t) => t.gameweeks.map((g) => g.event)))].sort((a, b) => a - b);

  const byEntry = new Map(
    teams.map((t) => [
      t.entry_id,
      {
        entry_id: t.entry_id,
        player_name: t.player_name,
        totals: new Map(t.gameweeks.map((g) => [g.event, g.total_points])),
        ranks: new Map<number, number>(),
      },
    ])
  );

  for (const event of events) {
    const totals = teams
      .map((t) => ({ entry_id: t.entry_id, total: byEntry.get(t.entry_id)!.totals.get(event) }))
      .filter((x): x is { entry_id: number; total: number } => x.total !== undefined)
      .sort((a, b) => b.total - a.total);
    totals.forEach((t, i) => byEntry.get(t.entry_id)!.ranks.set(event, i + 1));
  }

  return { events, series: teams.map((t) => byEntry.get(t.entry_id)!) };
}

export function RankHistoryChart({ teams }: { teams: HistoryTeam[] }) {
  const [hoverEvent, setHoverEvent] = useState<number | null>(null);
  const { events, series } = useMemo(() => computeLeagueRanks(teams), [teams]);

  // Measure the actual rendered width so the SVG viewBox matches it 1:1 —
  // otherwise a narrow (mobile) card scales the whole viewBox down and the
  // axis/tooltip text shrinks along with it, becoming unreadable.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState(640);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setMeasuredWidth(Math.round(width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!teams.length || !teams[0].gameweeks.length) {
    return (
      <GlowCard>
        <h2 className="mb-1 text-base font-semibold">Rank-historik</h2>
        <p className="text-sm text-text-dim">Ingen historik än.</p>
      </GlowCard>
    );
  }

  const n = series.length;
  const W = measuredWidth;
  const H = 260;
  const marginLeft = 28;
  const marginRight = 16;
  const marginTop = 14;
  const marginBottom = 28;
  const plotW = W - marginLeft - marginRight;
  const plotH = H - marginTop - marginBottom;

  const first = events[0];
  const last = events[events.length - 1];
  const xFor = (event: number) => marginLeft + (events.length === 1 ? plotW / 2 : ((event - first) / (last - first)) * plotW);
  const yFor = (rank: number) => marginTop + ((rank - 1) / Math.max(1, n - 1)) * plotH;

  const hovered = hoverEvent
    ? series
        .filter((s) => s.ranks.has(hoverEvent))
        .sort((a, b) => a.ranks.get(hoverEvent)! - b.ranks.get(hoverEvent)!)
    : null;

  return (
    <GlowCard>
      <h2 className="mb-1 text-base font-semibold">Rank-historik</h2>
      <p className="mb-4 text-xs text-text-dim">Ligaplacering per gameweek</p>

      <div className="relative" ref={wrapRef}>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block" preserveAspectRatio="none">
          {Array.from({ length: n }, (_, i) => i + 1).map((r) => (
            <g key={r}>
              <line x1={marginLeft} y1={yFor(r)} x2={W - marginRight} y2={yFor(r)} stroke="var(--border)" strokeWidth={1} />
              <text x={marginLeft - 8} y={yFor(r) + 3} textAnchor="end" fontSize={10} fill="var(--text-dim)">
                {r}
              </text>
            </g>
          ))}

          {events.map((e) => (
            <text key={e} x={xFor(e)} y={H - marginBottom + 16} textAnchor="middle" fontSize={10} fill="var(--text-dim)">
              GW{e}
            </text>
          ))}

          {series.map((s, i) => {
            const pts = events
              .filter((e) => s.ranks.has(e))
              .map((e) => `${xFor(e)},${yFor(s.ranks.get(e)!)}`)
              .join(" ");
            return (
              <motion.polyline
                key={s.entry_id}
                points={pts}
                fill="none"
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.9, delay: i * 0.08, ease: "easeInOut" }}
              />
            );
          })}

          {series.map((s, i) =>
            events
              .filter((e) => s.ranks.has(e))
              .map((e) => (
                <circle
                  key={`${s.entry_id}-${e}`}
                  cx={xFor(e)}
                  cy={yFor(s.ranks.get(e)!)}
                  r={4}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  stroke="var(--panel)"
                  strokeWidth={2}
                />
              ))
          )}

          {hoverEvent && (
            <line
              x1={xFor(hoverEvent)}
              y1={marginTop}
              x2={xFor(hoverEvent)}
              y2={marginTop + plotH}
              stroke="var(--text-dim)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          )}

          {events.map((e) => {
            const slice = plotW / events.length;
            return (
              <rect
                key={e}
                x={xFor(e) - slice / 2}
                y={marginTop}
                width={slice}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHoverEvent(e)}
                onMouseLeave={() => setHoverEvent(null)}
              />
            );
          })}
        </svg>

        {hovered && hoverEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pointer-events-none absolute top-0 min-w-[140px] rounded-lg border border-border bg-panel-hover p-2 text-xs shadow-xl"
            style={{ left: `min(${(xFor(hoverEvent) / W) * 100}%, calc(100% - 150px))` }}
          >
            <div className="mb-1.5 text-[11px] text-text-dim">Gameweek {hoverEvent}</div>
            {hovered.map((s) => {
              const idx = series.findIndex((x) => x.entry_id === s.entry_id);
              return (
                <div key={s.entry_id} className="flex items-center gap-1.5 py-0.5">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }} />
                  <span className="flex-1 truncate">{s.player_name}</span>
                  <span className="text-text-dim">
                    #{s.ranks.get(hoverEvent)} · {s.totals.get(hoverEvent)}p
                  </span>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>

      <div className="mt-3.5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-text-dim">
        {series.map((s, i) => (
          <span key={s.entry_id} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
            {s.player_name}
          </span>
        ))}
      </div>
    </GlowCard>
  );
}
