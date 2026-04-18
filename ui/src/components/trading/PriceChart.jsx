import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 shadow-xl text-xs">
      <p className="mb-1 font-medium text-slate-300">{label}</p>
      <p className="text-slate-400">Open: <span className="text-slate-200">${d.open}</span></p>
      <p className="text-slate-400">High: <span className="text-emerald-400">${d.high}</span></p>
      <p className="text-slate-400">Low: <span className="text-red-400">${d.low}</span></p>
      <p className="text-slate-400">Close: <span className="text-slate-200">${d.close}</span></p>
    </div>
  );
}

export default function PriceChart({ data }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
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
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#1e293b" }}
              tickFormatter={(v) => v.slice(5)}
              interval={Math.floor(data.length / 6)}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 11 }}
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
