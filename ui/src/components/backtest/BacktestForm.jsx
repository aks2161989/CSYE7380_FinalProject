import { useState } from "react";
import { Play } from "lucide-react";
import { stockList } from "../../data/mockStockData";
import { strategies } from "../../data/mockBacktest";

export default function BacktestForm({ onRun, loading }) {
  const [symbol, setSymbol] = useState("AAPL");
  const [strategy, setStrategy] = useState("ma_crossover");
  const [startDate, setStartDate] = useState("2018-01-01");
  const [endDate, setEndDate] = useState("");
  // MA params
  const [shortWindow, setShortWindow] = useState(20);
  const [longWindow, setLongWindow] = useState(50);
  // RSI params
  const [rsiPeriod, setRsiPeriod] = useState(14);
  const [oversold, setOversold] = useState(30);
  const [overbought, setOverbought] = useState(70);

  function handleSubmit(e) {
    e.preventDefault();
    onRun({
      symbol, strategy, startDate, endDate: endDate || null,
      shortWindow: Number(shortWindow), longWindow: Number(longWindow),
      rsiPeriod: Number(rsiPeriod), oversold: Number(oversold), overbought: Number(overbought),
    });
  }

  const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-red-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
  const labelCls = "mb-1 block text-xs text-slate-500 dark:text-slate-400";

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
      <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
        Configure Backtest
      </h3>
      <div className="space-y-4">
        {/* Symbol */}
        <div>
          <label className={labelCls}>Stock Symbol</label>
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className={inputCls}>
            {stockList.map((s) => (
              <option key={s.symbol} value={s.symbol}>{s.symbol} — {s.name}</option>
            ))}
          </select>
        </div>

        {/* Strategy */}
        <div>
          <label className={labelCls}>Strategy</label>
          <select value={strategy} onChange={(e) => setStrategy(e.target.value)} className={inputCls}>
            {strategies.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Start & End Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* MA params */}
        {strategy === "ma_crossover" && (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Short MA Window</label>
              <input type="number" min={1} max={200} value={shortWindow} onChange={(e) => setShortWindow(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Long MA Window</label>
              <input type="number" min={1} max={500} value={longWindow} onChange={(e) => setLongWindow(e.target.value)} className={inputCls} />
            </div>
          </div>
        )}

        {/* RSI params */}
        {strategy === "rsi" && (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>RSI Period</label>
              <input type="number" min={2} max={50} value={rsiPeriod} onChange={(e) => setRsiPeriod(e.target.value)} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Oversold Threshold</label>
                <input type="number" min={10} max={49} value={oversold} onChange={(e) => setOversold(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Overbought Threshold</label>
                <input type="number" min={51} max={90} value={overbought} onChange={(e) => setOverbought(e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>
        )}

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
