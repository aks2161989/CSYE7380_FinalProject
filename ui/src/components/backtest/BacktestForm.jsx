import { useState } from "react";
import { Play } from "lucide-react";
import { stockList } from "../../data/mockStockData";
import { strategies } from "../../data/mockBacktest";

export default function BacktestForm({ onRun, loading }) {
  const [symbol, setSymbol] = useState("AAPL");
  const [strategy, setStrategy] = useState("ma_crossover");

  function handleSubmit(e) {
    e.preventDefault();
    onRun({ symbol, strategy });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
      <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
        Configure Backtest
      </h3>
      <div className="space-y-4">
        {/* Symbol */}
        <div>
          <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Stock Symbol</label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-red-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {stockList.map((s) => (
              <option key={s.symbol} value={s.symbol}>{s.symbol} — {s.name}</option>
            ))}
          </select>
        </div>

        {/* Strategy */}
        <div>
          <label className="mb-2 block text-xs text-slate-500 dark:text-slate-400">Strategy</label>
          <div className="space-y-2">
            {strategies.map((s) => (
              <label
                key={s.id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-all ${
                  strategy === s.id
                    ? "border-red-500/50 bg-red-50 dark:bg-red-500/5"
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                }`}
              >
                <input
                  type="radio"
                  name="strategy"
                  value={s.id}
                  checked={strategy === s.id}
                  onChange={() => setStrategy(s.id)}
                  className="mt-0.5 accent-red-500"
                />
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-all hover:bg-red-400 disabled:opacity-50"
        >
          <Play size={14} />
          {loading ? "Running..." : "Run Backtest"}
        </button>
      </div>
    </form>
  );
}
