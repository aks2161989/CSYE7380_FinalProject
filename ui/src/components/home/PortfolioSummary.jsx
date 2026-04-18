import { DollarSign, Briefcase, TrendingUp, Calendar } from "lucide-react";
import { formatCurrency } from "../../utils/formatters";

const cards = [
  { label: "Total Portfolio Value", icon: DollarSign, key: "totalValue", format: formatCurrency, color: "text-emerald-400" },
  { label: "Holdings", icon: Briefcase, key: "numHoldings", format: (v) => v.toString(), color: "text-blue-400" },
  { label: "Top Sector", icon: TrendingUp, key: "topSector", format: (v) => v, color: "text-amber-400" },
  { label: "As Of", icon: Calendar, key: "asOfDate", format: (v) => v, color: "text-purple-400" },
];

export default function PortfolioSummary({ summary }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map(({ label, icon: Icon, key, format, color }) => (
        <div
          key={key}
          className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition-all hover:border-slate-700 hover:bg-slate-900"
        >
          <div className="mb-3 flex items-center gap-2">
            <Icon size={16} className={color} />
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              {label}
            </span>
          </div>
          <p className="text-xl font-semibold text-slate-100">
            {format(summary[key])}
          </p>
        </div>
      ))}
    </div>
  );
}
