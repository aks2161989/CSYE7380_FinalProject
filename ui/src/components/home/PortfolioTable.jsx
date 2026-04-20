import { useState, useMemo } from "react";
import { ChevronDown, ArrowRight, HelpCircle } from "lucide-react";
import { formatCurrency, formatNumber } from "../../utils/formatters";
import CompanyLogo from "./CompanyLogo";

const sortOptions = [
  { id: "weight", label: "Biggest Holdings" },
  { id: "lastTransaction", label: "Latest Trades" },
  { id: "gainPercent", label: "Biggest Wins" },
  { id: "losers", label: "Biggest Losses" },
];

export default function PortfolioTable({ holdings }) {
  const [sortBy, setSortBy] = useState("weight");
  const [sectorFilter, setSectorFilter] = useState("All");
  const [expandedRow, setExpandedRow] = useState(null);

  const sectors = useMemo(() => {
    const set = new Set(holdings.map((h) => h.sector));
    return ["All", ...Array.from(set).sort()];
  }, [holdings]);

  const filtered = useMemo(() => {
    let list = holdings;
    if (sectorFilter !== "All") {
      list = list.filter((h) => h.sector === sectorFilter);
    }
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "weight":
          return b.weight - a.weight;
        case "lastTransaction": {
          const order = { Bought: 0, Sold: 1, Held: 2 };
          return (order[a.lastTransaction.action] ?? 3) - (order[b.lastTransaction.action] ?? 3);
        }
        case "gainPercent":
          return b.gainPercent - a.gainPercent;
        case "losers":
          return a.gainPercent - b.gainPercent;
        default:
          return 0;
      }
    });
  }, [holdings, sortBy, sectorFilter]);

  function GainBar({ percent }) {
    const clamped = Math.min(percent, 500);
    const width = Math.max((clamped / 500) * 100, 4);
    return (
      <span className="inline-flex items-center gap-2">
        <span className="hidden sm:inline-block h-1.5 w-16 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <span
            className="block h-full rounded-full bg-emerald-500"
            style={{ width: `${width}%` }}
          />
        </span>
        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
          +{percent.toFixed(1)}%
        </span>
        <ArrowRight size={12} className="text-emerald-500 dark:text-emerald-400" />
      </span>
    );
  }

  function TransactionBadge({ tx }) {
    const colorMap = {
      Sold: "text-red-600 dark:text-red-400",
      Bought: "text-emerald-600 dark:text-emerald-400",
      Held: "text-slate-500 dark:text-slate-400",
    };
    return (
      <div className="text-right">
        <p className={`text-sm font-semibold ${colorMap[tx.action] ?? "text-slate-500"}`}>
          {tx.quarter}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{tx.detail}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900/60">
      {/* Sort pills + filter */}
      <div className="flex flex-col gap-3 p-6 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 mr-1">Sort by:</span>
          {sortOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSortBy(opt.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                sortBy === opt.id
                  ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 dark:text-slate-500">Industry:</span>
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none transition-colors focus:border-red-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            {sectors.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div>
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="border-y border-slate-200 dark:border-slate-800">
              <th className="w-[22%] px-5 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">
                Stock
              </th>
              <th className="w-[12%] px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">
                % of Portfolio
              </th>
              <th className="w-[30%] px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span className="inline-flex items-center gap-1">
                  Average Buy Price
                  <HelpCircle size={12} className="text-slate-400 dark:text-slate-500" />
                </span>
              </th>
              <th className="w-[13%] px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">
                Current Price
              </th>
              <th className="w-[17%] px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400">
                Last Transaction
              </th>
              <th className="w-[6%] px-2 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((h) => (
              <>
                <tr
                  key={h.symbol}
                  onClick={() => setExpandedRow(expandedRow === h.symbol ? null : h.symbol)}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50 cursor-pointer dark:border-slate-800/50 dark:hover:bg-slate-800/30"
                >
                  {/* Stock — logo + name + industry */}
                  <td className="px-5 py-5">
                    <div className="flex items-center gap-3">
                      <CompanyLogo symbol={h.symbol} />
                      <div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                          {h.industry}
                        </p>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {h.name}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* % of Portfolio */}
                  <td className="px-4 py-5 text-slate-700 dark:text-slate-300 font-medium">
                    {h.weight.toFixed(1)}%
                  </td>

                  {/* Average Buy Price + gain */}
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-700 dark:text-slate-300">${h.avgCost.toFixed(2)}</span>
                      <GainBar percent={h.gainPercent} />
                    </div>
                  </td>

                  {/* Current Price */}
                  <td className="px-4 py-5 text-slate-700 dark:text-slate-300 font-medium">
                    ${h.currentPrice.toFixed(2)}
                  </td>

                  {/* Last Transaction */}
                  <td className="px-4 py-5">
                    <TransactionBadge tx={h.lastTransaction} />
                  </td>

                  {/* Expand chevron */}
                  <td className="px-2 py-5">
                    <ChevronDown
                      size={16}
                      className={`text-slate-400 transition-transform dark:text-slate-500 ${expandedRow === h.symbol ? "rotate-180" : ""}`}
                    />
                  </td>
                </tr>

                {/* Expanded detail row */}
                {expandedRow === h.symbol && (
                  <tr key={`${h.symbol}-detail`} className="border-b border-slate-100 dark:border-slate-800/50">
                    <td colSpan={6} className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/20">
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-3xl">
                        <div>
                          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Shares Held</p>
                          <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200">{formatNumber(h.shares)}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Market Value</p>
                          <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(h.marketValue)}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sector</p>
                          <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200">{h.sector}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">24h Change</p>
                          <p className={`mt-0.5 text-sm font-semibold ${h.change24h >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                            {h.change24h >= 0 ? "+" : ""}{h.change24h.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
