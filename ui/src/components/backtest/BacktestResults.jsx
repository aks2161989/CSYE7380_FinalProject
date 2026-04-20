import { formatPercent } from "../../utils/formatters";

const metrics = [
  { key: "totalReturn", label: "Total Return", format: formatPercent },
  { key: "annualizedReturn", label: "Ann. Return", format: formatPercent },
  { key: "sharpeRatio", label: "Sharpe Ratio", format: (v) => v.toFixed(2) },
  { key: "maxDrawdown", label: "Max Drawdown", format: formatPercent },
  { key: "winRate", label: "Win Rate", format: formatPercent },
  { key: "numTrades", label: "Trades", format: (v) => v.toString() },
];

export default function BacktestResults({ result }) {
  if (!result) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium uppercase tracking-wider text-slate-500">
          Results — {result.strategyName}
        </h3>
        <span className="text-xs text-slate-500">
          {result.symbol} | {result.startDate} to {result.endDate}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
        {metrics.map(({ key, label, format }) => {
          const val = result[key];
          const isNeg = typeof val === "number" && val < 0;
          return (
            <div key={key} className="rounded-lg bg-slate-50 px-3 py-3 text-center dark:bg-slate-800/40">
              <p className="text-xs text-slate-500">{label}</p>
              <p className={`mt-1 text-lg font-bold ${
                key === "maxDrawdown" ? "text-red-600 dark:text-red-400"
                : isNeg ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
              }`}>
                {format(val)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
