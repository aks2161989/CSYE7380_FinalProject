const metrics = [
  { key: "price", label: "Price", format: (v) => `$${v.toFixed(2)}` },
  { key: "marketCap", label: "Market Cap" },
  { key: "peRatio", label: "P/E Ratio", format: (v) => v.toFixed(1) },
  { key: "eps", label: "EPS", format: (v) => `$${v.toFixed(2)}` },
  { key: "dividendYield", label: "Div. Yield" },
  { key: "week52High", label: "52W High", format: (v) => `$${v.toFixed(2)}` },
  { key: "week52Low", label: "52W Low", format: (v) => `$${v.toFixed(2)}` },
  { key: "avgVolume", label: "Avg Volume" },
  { key: "beta", label: "Beta", format: (v) => v.toFixed(2) },
];

export default function FundamentalsPanel({ data }) {
  if (!data) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
      <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
        Fundamentals — {data.name}
      </h3>
      <div className="grid grid-cols-3 gap-4">
        {metrics.map(({ key, label, format }) => (
          <div key={key} className="rounded-lg bg-slate-50 px-3 py-3 dark:bg-slate-800/40">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
              {format ? format(data[key]) : data[key]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
