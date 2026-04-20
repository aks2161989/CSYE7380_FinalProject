import { formatPercent } from "../../utils/formatters";

export default function TradesTable({ trades }) {
  if (!trades?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900/60">
      <div className="p-6 pb-3">
        <h3 className="text-sm font-medium uppercase tracking-wider text-slate-500">
          Trade Log
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-3 text-left font-medium text-slate-400 dark:text-slate-500">#</th>
              <th className="px-6 py-3 text-left font-medium text-slate-400 dark:text-slate-500">Type</th>
              <th className="px-6 py-3 text-left font-medium text-slate-400 dark:text-slate-500">Entry Date</th>
              <th className="px-6 py-3 text-left font-medium text-slate-400 dark:text-slate-500">Exit Date</th>
              <th className="px-6 py-3 text-right font-medium text-slate-400 dark:text-slate-500">Entry Price</th>
              <th className="px-6 py-3 text-right font-medium text-slate-400 dark:text-slate-500">Exit Price</th>
              <th className="px-6 py-3 text-right font-medium text-slate-400 dark:text-slate-500">P&L</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800/50 dark:hover:bg-slate-800/30">
                <td className="px-6 py-3 text-slate-400 dark:text-slate-500">{t.id}</td>
                <td className="px-6 py-3">
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                    {t.type}
                  </span>
                </td>
                <td className="px-6 py-3 text-slate-700 dark:text-slate-300">{t.entryDate}</td>
                <td className="px-6 py-3 text-slate-700 dark:text-slate-300">{t.exitDate}</td>
                <td className="px-6 py-3 text-right text-slate-700 dark:text-slate-300">${t.entryPrice.toFixed(2)}</td>
                <td className="px-6 py-3 text-right text-slate-700 dark:text-slate-300">${t.exitPrice.toFixed(2)}</td>
                <td className={`px-6 py-3 text-right font-semibold ${
                  t.pnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                }`}>
                  {formatPercent(t.pnl)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
