import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { sector, weight } = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 shadow-xl">
      <p className="text-sm font-medium text-slate-200">{sector}</p>
      <p className="text-sm text-slate-400">{weight.toFixed(1)}%</p>
    </div>
  );
}

export default function PortfolioChart({ data }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
        Sector Allocation
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
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
      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-4">
        {data.map((s) => (
          <div key={s.sector} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-xs text-slate-400">{s.sector}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
