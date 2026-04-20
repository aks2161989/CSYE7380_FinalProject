import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useTheme } from "../../context/ThemeContext";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-xl text-xs dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-1 font-medium text-slate-700 dark:text-slate-300">{label}</p>
      <p className="text-slate-500 dark:text-slate-400">Open: <span className="text-slate-800 dark:text-slate-200">${d.open}</span></p>
      <p className="text-slate-500 dark:text-slate-400">High: <span className="text-emerald-600 dark:text-emerald-400">${d.high}</span></p>
      <p className="text-slate-500 dark:text-slate-400">Low: <span className="text-red-600 dark:text-red-400">${d.low}</span></p>
      <p className="text-slate-500 dark:text-slate-400">Close: <span className="text-slate-800 dark:text-slate-200">${d.close}</span></p>
    </div>
  );
}

export default function PriceChart({ data }) {
  const { dark } = useTheme();
  const gridStroke = dark ? "#1e293b" : "#e2e8f0";
  const tickFill = dark ? "#64748b" : "#94a3b8";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
      <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
        Price History
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis
              dataKey="date"
              tick={{ fill: tickFill, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: gridStroke }}
              tickFormatter={(v) => v.slice(5)}
              interval={Math.floor(data.length / 6)}
            />
            <YAxis
              tick={{ fill: tickFill, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              domain={["auto", "auto"]}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="close"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#priceGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
