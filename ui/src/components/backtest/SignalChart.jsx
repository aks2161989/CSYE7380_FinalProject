import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceDot, ResponsiveContainer,
} from "recharts";
import { useTheme } from "../../context/ThemeContext";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-xl text-xs dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-1 font-medium text-slate-600 dark:text-slate-300">{label}</p>
      <p className="text-slate-500 dark:text-slate-400">
        Price: <span className="text-slate-800 dark:text-slate-200">${payload[0]?.value?.toFixed(2)}</span>
      </p>
    </div>
  );
}

export default function SignalChart({ priceData, trades }) {
  const { dark } = useTheme();
  const gridStroke = dark ? "#1e293b" : "#e2e8f0";
  const tickFill = dark ? "#64748b" : "#94a3b8";

  if (!priceData?.length) return null;

  const priceLookup = Object.fromEntries(priceData.map((d) => [d.date, d.close]));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="mb-4 flex items-center gap-4">
        <h3 className="text-sm font-medium uppercase tracking-wider text-slate-500">
          Price & Signals
        </h3>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> Buy
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500" /> Sell
          </span>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={priceData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis
              dataKey="date"
              tick={{ fill: tickFill, fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: gridStroke }}
              tickFormatter={(v) => v.slice(0, 7)}
              interval={Math.floor(priceData.length / 6)}
            />
            <YAxis
              tick={{ fill: tickFill, fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              domain={["auto", "auto"]}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="close"
              stroke="#f59e0b"
              strokeWidth={1.5}
              dot={false}
            />
            {trades?.map((t) => (
              priceLookup[t.entryDate] && (
                <ReferenceDot
                  key={`buy-${t.id}`}
                  x={t.entryDate}
                  y={priceLookup[t.entryDate]}
                  r={5}
                  fill="#10b981"
                  stroke="#fff"
                  strokeWidth={1.5}
                />
              )
            ))}
            {trades?.map((t) => (
              priceLookup[t.exitDate] && (
                <ReferenceDot
                  key={`sell-${t.id}`}
                  x={t.exitDate}
                  y={priceLookup[t.exitDate]}
                  r={5}
                  fill="#ef4444"
                  stroke="#fff"
                  strokeWidth={1.5}
                />
              )
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
