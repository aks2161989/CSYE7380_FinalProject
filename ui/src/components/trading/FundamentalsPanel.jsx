import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ChevronDown, ChevronRight, Sparkles } from "lucide-react";

const STATUS = {
  pass: { label: "Pass", color: "text-emerald-500", bg: "bg-emerald-500/10", dot: "bg-emerald-500" },
  fail: { label: "Fail", color: "text-red-500",     bg: "bg-red-500/10",     dot: "bg-red-500"     },
  info: { label: "Info", color: "text-slate-400",   bg: "bg-slate-500/10",   dot: "bg-slate-400"   },
};
const BAR_COLOR = { pass: "#10b981", fail: "#ef4444", info: "#64748b" };

function fmtNum(val) {
  if (val === null || val === undefined) return "—";
  const abs = Math.abs(val);
  if (abs >= 1e12) return `${(val / 1e12).toFixed(1)}T`;
  if (abs >= 1e9)  return `${(val / 1e9).toFixed(1)}B`;
  if (abs >= 1e6)  return `${(val / 1e6).toFixed(1)}M`;
  return val.toFixed(2);
}

function Collapsible({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-slate-100 dark:border-slate-800">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {title}
      </button>
      {open && <div className="border-t border-slate-100 dark:border-slate-800">{children}</div>}
    </div>
  );
}

function MetricChart({ metric }) {
  const color = BAR_COLOR[metric.status];
  const s = STATUS[metric.status];
  return (
    <div className="grid grid-cols-3 gap-4 py-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="col-span-2">
        <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">{metric.name}</p>
        <div className="h-28">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metric.history} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={(v) => v.toFixed(2)} />
              <Tooltip
                formatter={(v) => [v.toFixed(4), metric.name]}
                contentStyle={{ fontSize: 11, background: "#0f172a", border: "1px solid #1e293b", borderRadius: 6, color: "#cbd5e1" }}
              />
              <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="flex flex-col justify-center space-y-2 pl-2">
        <div>
          <p className="text-xs text-slate-400">Rule</p>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{metric.rule}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Latest</p>
          <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{metric.formatted}</p>
        </div>
        <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${s.bg} ${s.color}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
          {s.label}
        </span>
        <p className="text-xs text-slate-400 leading-relaxed">{metric.logic}</p>
      </div>
    </div>
  );
}

function RawTable({ tableData }) {
  if (!tableData?.rows?.length) return <p className="p-4 text-sm text-slate-400">No data available</p>;
  const { columns, rows } = tableData;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <th className="px-4 py-2 text-left font-medium text-slate-400 min-w-[180px]" />
            {columns.map((c) => (
              <th key={c} className="px-4 py-2 text-right font-medium text-slate-400 whitespace-nowrap">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-100/50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20">
              <td className="px-4 py-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">{row.name}</td>
              {columns.map((c) => (
                <td key={c} className={`px-4 py-2 text-right tabular-nums ${
                  row[c] === null ? "text-slate-300 dark:text-slate-600"
                  : row[c] < 0   ? "text-red-500"
                  : "text-slate-700 dark:text-slate-300"
                }`}>
                  {row[c] === null ? "None" : fmtNum(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FundamentalsPanel({ data, loading }) {
  const [buffettTake, setBuffettTake] = useState(null);
  const [buffettLoading, setBuffettLoading] = useState(false);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
        <p className="text-sm text-slate-400">Loading Buffett analysis...</p>
      </div>
    );
  }
  if (!data) return null;

  const groups = ["Income Statement", "Balance Sheet", "Cash Flow"];

  async function handleBuffettTake() {
    setBuffettLoading(true);
    try {
      const passing = data.metrics.filter((m) => m.status === "pass").map((m) => m.name);
      const failing = data.metrics.filter((m) => m.status === "fail").map((m) => m.name);
      const res = await fetch("/api/stock/buffett-take", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: data.symbol, passing, failing }),
      });
      const text = await res.text();
      if (!res.ok) {
        setBuffettTake(`Server error ${res.status}: ${text.slice(0, 200)}`);
        return;
      }
      const json = JSON.parse(text);
      setBuffettTake(json.answer);
    } catch (err) {
      setBuffettTake(`Could not retrieve response: ${err.message}`);
    } finally {
      setBuffettLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Company Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {data.companyName}
              <span className="ml-2 text-base font-normal text-slate-400">({data.symbol})</span>
              {data.currentPrice && (
                <span className="ml-3 text-lg font-semibold text-amber-500">${data.currentPrice.toFixed(2)}</span>
              )}
            </h2>
            {data.sector && <p className="mt-1 text-sm text-slate-400">{data.sector}</p>}
          </div>
          <div className="flex gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">✓ {data.passing} Passing</span>
            <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-500">✗ {data.failing} Failing</span>
            <span className="flex items-center gap-1.5 rounded-full bg-slate-500/10 px-3 py-1 text-xs font-semibold text-slate-400">ℹ {data.infoCount} Info</span>
          </div>
        </div>
      </div>

      {/* Metrics Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60 space-y-5">
        <h3 className="text-sm font-medium uppercase tracking-wider text-slate-500">Warren Buffett's Rules of Thumb</h3>
        {groups.map((group) => {
          const gm = data.metrics.filter((m) => m.group === group);
          if (!gm.length) return null;
          return (
            <div key={group}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{group}</p>
              <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Metric</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-400">Value</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-slate-400">Rule</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-slate-400">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Buffett's Logic</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gm.map((m) => {
                      const s = STATUS[m.status];
                      return (
                        <tr key={m.name} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                          <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300">{m.name}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-slate-800 dark:text-slate-200">{m.formatted}</td>
                          <td className="px-4 py-2.5 text-center text-xs text-slate-400">{m.rule}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${s.bg} ${s.color}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />{s.label}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-slate-500 max-w-xs">{m.logic}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Historical Trends */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60 space-y-3">
        <h3 className="text-sm font-medium uppercase tracking-wider text-slate-500">Historical Trends</h3>
        {groups.map((group) => {
          const gm = data.metrics.filter((m) => m.group === group && m.history?.length > 0);
          if (!gm.length) return null;
          return (
            <Collapsible key={group} title={group} defaultOpen={group === "Income Statement"}>
              <div className="px-4">
                {gm.map((m) => <MetricChart key={m.name} metric={m} />)}
              </div>
            </Collapsible>
          );
        })}
      </div>

      {/* What Would Warren Buffett Say */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">What Would Warren Buffett Say?</h3>
        <button
          onClick={handleBuffettTake}
          disabled={buffettLoading}
          className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-all"
        >
          <Sparkles size={14} />
          {buffettLoading ? "Thinking..." : "Get Warren Buffett's Take"}
        </button>
        {buffettTake && (
          <div className="mt-4 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 px-4 py-3">
            <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">{buffettTake}</p>
          </div>
        )}
      </div>

      {/* Raw Financial Statements */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60 space-y-3">
        <h3 className="mb-1 text-sm font-medium uppercase tracking-wider text-slate-500">Raw Financial Statements</h3>
        <Collapsible title="Income Statement">
          <RawTable tableData={data.financials} />
        </Collapsible>
        <Collapsible title="Balance Sheet">
          <RawTable tableData={data.balanceSheet} />
        </Collapsible>
        <Collapsible title="Cash Flow Statement">
          <RawTable tableData={data.cashFlow} />
        </Collapsible>
      </div>
    </div>
  );
}
