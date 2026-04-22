import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import DonutChart from "../shared/DonutChart";

function ScoreCard({ label, value, colorClass = "text-slate-900 dark:text-slate-100", sub }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 whitespace-nowrap">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${colorClass}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-slate-400">{sub}</p>}
    </div>
  );
}

function scoreColor(score) {
  const n = parseFloat(score);
  if (n >= 7) return "text-emerald-600 dark:text-emerald-400";
  if (n >= 4) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export default function PortfolioOverviewCard({ data }) {
  const { holdings, results, avgScore, weightedScore, strongPicks, donutSegments } = data;
  const stockCount = results?.length || 0;

  // Encode holdings for deep link: AAPL:42,BAC:13,KO:9
  const holdingsParam = (holdings || [])
    .map((h) => `${h.symbol}:${h.weight}`)
    .join(",");

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80" style={{ maxWidth: "560px" }}>
      <p className="mb-5 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Portfolio Analysis
      </p>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Donut + Legend */}
        <div className="flex flex-col items-center shrink-0">
          <DonutChart
            segments={donutSegments}
            centerLabel={weightedScore}
            centerSub="WEIGHTED"
          />
          <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1.5">
            {donutSegments.map((seg) => (
              <div key={seg.symbol} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {seg.symbol}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Score cards 2×2 */}
        <div className="grid flex-1 grid-cols-2 gap-3 content-start">
          <ScoreCard label="Stocks Analyzed" value={stockCount} />
          <ScoreCard
            label="Avg Buffett Score"
            value={`${avgScore}/10`}
            colorClass={scoreColor(avgScore)}
            sub="unweighted average"
          />
          <ScoreCard
            label="Weighted Score"
            value={`${weightedScore}/10`}
            colorClass={scoreColor(weightedScore)}
            sub="by allocation weight"
          />
          <ScoreCard
            label="Strong Picks"
            value={`${strongPicks}/${stockCount}`}
            sub={"\u2265 70% criteria passing"}
          />
        </div>
      </div>

      {/* See Detailed Analysis button */}
      <div className="mt-5 flex justify-end">
        <Link
          to={`/trading?tab=buffett&holdings=${encodeURIComponent(holdingsParam)}`}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
        >
          See Detailed Analysis <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
