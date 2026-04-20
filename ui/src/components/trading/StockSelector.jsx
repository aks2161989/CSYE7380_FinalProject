import { Search } from "lucide-react";
import { stockList } from "../../data/mockStockData";

export default function StockSelector({ selected, onSelect }) {
  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
      <select
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-900 outline-none transition-colors focus:border-red-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      >
        {stockList.map((s) => (
          <option key={s.symbol} value={s.symbol}>
            {s.symbol} — {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}
