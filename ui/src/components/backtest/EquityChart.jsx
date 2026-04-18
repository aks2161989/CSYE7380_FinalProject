import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 shadow-xl text-xs">
      <p className="mb-1 font-medium text-slate-300">{label}</p>
      <p className="text-emerald-400">Equity: {payload[0]?.value?.toFixed(4)}</p>
      {payload[1] && (
        <p className="text-red-400">Drawdown: {(payload[1].value * 100).toFixed(2)}%</p>
      )}
    </div>
  );
}

export default function EquityChart({ data }) {
  // Thin out data for performance — show every 5th point
  const thinned = data.filter((_, i) => i % 5 === 0 || i === data.length - 1);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
        Equity Curve
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={thinned}>
            <defs>
              <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "#1e293b" }}
              tickFormatter={(v) => v.slice(0, 7)}
              interval={Math.floor(thinned.length / 5)}
            />
            <YAxis
              yAxisId="eq"
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v.toFixed(1)}x`}
            />
            <YAxis
              yAxisId="dd"
              orientation="right"
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              yAxisId="eq"
              type="monotone"
              dataKey="equity"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#eqGrad)"
            />
            <Line
              yAxisId="dd"
              type="monotone"
              dataKey="drawdown"
              stroke="#ef4444"
              strokeWidth={1}
              dot={false}
              opacity={0.6}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
