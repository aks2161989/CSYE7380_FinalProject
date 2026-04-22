import { TrendingUp } from "lucide-react";

export default function StockAutocomplete({ stocks, selectedIdx, onSelect }) {
  if (stocks.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 mx-auto max-w-3xl">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
        <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Select a stock
          </p>
        </div>
        <div className="max-h-56 overflow-y-auto">
          {stocks.map((stock, i) => (
            <button
              key={stock.symbol}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(stock);
              }}
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                i === selectedIdx
                  ? "bg-red-50 dark:bg-red-500/10"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
              }`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                  i === selectedIdx
                    ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                <TrendingUp size={14} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {stock.symbol}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {stock.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
