import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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

function makeCandlestickShape(domMin, domMax) {
  return function CandlestickShape(props) {
    const { x, y, width, height, payload } = props;
    if (!payload || height == null) return null;

    const { open, high, low, close } = payload;
    const color = close >= open ? "#10b981" : "#ef4444";

    // Derive pixel scale from the bar's own y/height + known domain
    const plotHeight = height * (domMax - domMin) / (close - domMin);
    const plotTop = y - (domMax - close) * height / (close - domMin);
    const scale = (v) => plotTop + ((domMax - v) / (domMax - domMin)) * plotHeight;

    const cx = x + width / 2;
    const bodyTop = Math.min(scale(open), scale(close));
    const bodyH = Math.max(Math.abs(scale(close) - scale(open)), 1);

    return (
      <g>
        <line x1={cx} y1={scale(high)} x2={cx} y2={scale(low)} stroke={color} strokeWidth={1} />
        <rect x={x + 1} y={bodyTop} width={Math.max(width - 2, 1)} height={bodyH} fill={color} />
      </g>
    );
  };
}

export default function PriceChart({ data, loading }) {
  const { dark } = useTheme();
  const gridStroke = dark ? "#1e293b" : "#e2e8f0";
  const tickFill = dark ? "#64748b" : "#94a3b8";

  const allPrices = data.flatMap((d) => [d.high, d.low]);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const pad = (maxPrice - minPrice) * 0.05;
  const domMin = minPrice - pad;
  const domMax = maxPrice + pad;

  const CandlestickShape = makeCandlestickShape(domMin, domMax);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
      <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
        Price History
      </h3>
      <div className="h-72">
        {loading && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-slate-400">Loading price data...</p>
          </div>
        )}
        {!loading && data.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-slate-400">No data available</p>
          </div>
        )}
        {!loading && data.length > 0 && <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
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
              domain={[domMin, domMax]}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="close"
              shape={<CandlestickShape />}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>}
      </div>
    </div>
  );
}
