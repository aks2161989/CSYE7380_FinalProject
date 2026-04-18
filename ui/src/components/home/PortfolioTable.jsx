import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { formatCurrency, formatNumber, formatPercentRaw } from "../../utils/formatters";

const columns = [
  { key: "symbol", label: "Symbol" },
  { key: "name", label: "Company" },
  { key: "shares", label: "Shares", align: "right" },
  { key: "currentPrice", label: "Price", align: "right" },
  { key: "marketValue", label: "Market Value", align: "right" },
  { key: "weight", label: "Weight", align: "right" },
  { key: "change24h", label: "24h", align: "right" },
];

export default function PortfolioTable({ holdings }) {
  const [sortKey, setSortKey] = useState("weight");
  const [sortAsc, setSortAsc] = useState(false);

  function handleSort(key) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  const sorted = [...holdings].sort((a, b) => {
    const va = a[sortKey];
    const vb = b[sortKey];
    if (typeof va === "string") return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortAsc ? va - vb : vb - va;
  });

  function formatCell(key, value) {
    switch (key) {
      case "shares": return formatNumber(value);
      case "currentPrice": return `$${value.toFixed(2)}`;
      case "marketValue": return formatCurrency(value);
      case "weight": return `${value.toFixed(1)}%`;
      case "change24h": return formatPercentRaw(value);
      default: return value;
    }
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
      <div className="p-6 pb-3">
        <h3 className="text-sm font-medium uppercase tracking-wider text-slate-500">
          Holdings
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`cursor-pointer px-6 py-3 font-medium text-slate-500 transition-colors hover:text-slate-300 ${
                    col.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    <ArrowUpDown size={12} className={sortKey === col.key ? "text-amber-400" : "opacity-30"} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((h) => (
              <tr key={h.symbol} className="border-b border-slate-800/50 transition-colors hover:bg-slate-800/30">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-6 py-4 ${col.align === "right" ? "text-right" : "text-left"} ${
                      col.key === "symbol" ? "font-semibold text-amber-400" : ""
                    } ${
                      col.key === "change24h"
                        ? h.change24h >= 0 ? "text-emerald-400" : "text-red-400"
                        : "text-slate-300"
                    }`}
                  >
                    {formatCell(col.key, h[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
