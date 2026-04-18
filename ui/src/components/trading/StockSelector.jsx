import { Search } from "lucide-react";
import { stockList } from "../../data/mockStockData";

export default function StockSelector({ selected, onSelect }) {
  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
      <select
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-900 py-2.5 pl-9 pr-4 text-sm text-slate-100 outline-none transition-colors focus:border-amber-500/50"
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
