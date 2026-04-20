import { useState, useEffect } from "react";
import { ArrowUpRight, ArrowDownRight, Minus, Loader2 } from "lucide-react";
import { fetchInvestmentActivity } from "../../services/api";

const FALLBACK = [
  { quarter: "Q4 2024", action: "New", company: "Constellation Brands (STZ)", shares: "5.6M", value: "$1.24B", sector: "Consumer Staples" },
  { quarter: "Q4 2024", action: "New", company: "Domino's Pizza (DPZ)", shares: "1.3M", value: "$549M", sector: "Consumer Discretionary" },
  { quarter: "Q4 2024", action: "New", company: "Pool Corp (POOL)", shares: "404K", value: "$152M", sector: "Consumer Discretionary" },
  { quarter: "Q4 2024", action: "Added", company: "Occidental Petroleum (OXY)", shares: "+8.9M", value: "$4.1B total", sector: "Energy" },
  { quarter: "Q4 2024", action: "Reduced", company: "Apple Inc. (AAPL)", shares: "-100M", value: "$59.6B remaining", sector: "Technology" },
  { quarter: "Q4 2024", action: "Reduced", company: "Bank of America (BAC)", shares: "-117M", value: "$38.5B remaining", sector: "Financial Services" },
];

const actionStyles = {
  New: { icon: ArrowUpRight, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/10" },
  Added: { icon: ArrowUpRight, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-500/10" },
  Reduced: { icon: ArrowDownRight, color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-500/10" },
  Sold: { icon: Minus, color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-500/10" },
};

export default function LatestInvestments() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvestmentActivity()
      .then((res) => {
        if (res.activity) setData(res);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const investments = data?.activity || FALLBACK;
  const subtitle = data
    ? `Based on SEC 13F filings — ${data.prev_quarter} → ${data.quarter} (filed ${data.filing_date})`
    : "Based on SEC 13F filings — Q3 & Q4 2024";

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900/60">
      <div className="p-6 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium uppercase tracking-wider text-slate-500">
            Latest Investment Activity
          </h3>
          {data && (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              SEC EDGAR
            </span>
          )}
          {loading && (
            <Loader2 size={14} className="animate-spin text-slate-400" />
          )}
        </div>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-600">
          {subtitle}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-3 text-left font-medium text-slate-400 dark:text-slate-500">Quarter</th>
              <th className="px-6 py-3 text-left font-medium text-slate-400 dark:text-slate-500">Action</th>
              <th className="px-6 py-3 text-left font-medium text-slate-400 dark:text-slate-500">Company</th>
              <th className="px-6 py-3 text-right font-medium text-slate-400 dark:text-slate-500">Shares</th>
              <th className="px-6 py-3 text-right font-medium text-slate-400 dark:text-slate-500">Value</th>
              <th className="px-6 py-3 text-left font-medium text-slate-400 dark:text-slate-500">Sector</th>
            </tr>
          </thead>
          <tbody>
            {investments.map((inv, i) => {
              const style = actionStyles[inv.action] || actionStyles.Added;
              const Icon = style.icon;
              return (
                <tr
                  key={`${inv.company}-${i}`}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-800/50 dark:hover:bg-slate-800/30"
                >
                  <td className="px-6 py-4 text-slate-400 dark:text-slate-500">{inv.quarter}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.color}`}
                    >
                      <Icon size={12} />
                      {inv.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">{inv.company}</td>
                  <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300">{inv.shares}</td>
                  <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300">{inv.value}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{inv.sector}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
