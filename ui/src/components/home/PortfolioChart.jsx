import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { sector, weight } = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{sector}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{weight.toFixed(1)}%</p>
    </div>
  );
}

export default function PortfolioChart({ data }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
      <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
        Sector Allocation
      </h3>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
        <div className="h-52 w-52 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={85}
                dataKey="weight"
                nameKey="sector"
                stroke="none"
                paddingAngle={2}
              >
                {data.map((entry) => (
                  <Cell key={entry.sector} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Legend — horizontal row */}
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {data.map((s) => (
            <div key={s.sector} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {s.sector} <span className="font-medium text-slate-700 dark:text-slate-300">{s.weight.toFixed(1)}%</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
