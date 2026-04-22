import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, BarChart3, Loader2, Quote, Shield, Pencil, Check, X } from "lucide-react";
import { fetchBuffettAnalysis } from "../../services/api";
import { scoreHex, getScoreStyle } from "../../utils/buffettScoring";
import DonutChart from "../shared/DonutChart";

const SUGGESTED_STOCKS = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "KO", name: "Coca-Cola" },
  { symbol: "BAC", name: "Bank of America" },
  { symbol: "JNJ", name: "J&J" },
  { symbol: "JPM", name: "JPMorgan" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "NVDA", name: "Nvidia" },
  { symbol: "WMT", name: "Walmart" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "AMZN", name: "Amazon" },
];

const moatColor = {
  Wide: "text-emerald-600 dark:text-emerald-400",
  Narrow: "text-amber-600 dark:text-amber-400",
  None: "text-red-600 dark:text-red-400",
};

function metricShort(name) {
  if (!name) return "?";
  if (name.toLowerCase().includes("equity")) return "ROE";
  if (name.toLowerCase().includes("debt")) return "D/E";
  if (name.toLowerCase().includes("margin")) return "Margin";
  if (name.toLowerCase().includes("p/e") || name.toLowerCase().includes("price")) return "P/E";
  return name.slice(0, 5);
}

const criteriaColor = {
  pass: "bg-emerald-500",
  caution: "bg-amber-400",
  fail: "bg-red-500",
};

// ── Score card ────────────────────────────────────────────────────────────────
function ScoreCard({ label, value, colorClass = "text-slate-900 dark:text-slate-100", sub }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${colorClass}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-slate-400">{sub}</p>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TradeLikeBuffett({ initialHoldings = null }) {
  const [tickerInput, setTickerInput] = useState("");
  const [weightInput, setWeightInput] = useState("");
  const [holdings, setHoldings] = useState(
    initialHoldings && initialHoldings.length > 0
      ? initialHoldings
      : [
          { symbol: "AAPL", weight: 42 },
          { symbol: "BAC", weight: 13 },
          { symbol: "AXP", weight: 10 },
          { symbol: "KO", weight: 9 },
          { symbol: "CVX", weight: 14 },
          { symbol: "OXY", weight: 12 },
        ]
  );
  const [analyzed, setAnalyzed] = useState(false);
  const autoAnalyzed = useRef(false);
  const [editingSymbol, setEditingSymbol] = useState(null);
  const [editWeight, setEditWeight] = useState("");
  const [tooltip, setTooltip] = useState(null); // { x, y, item }
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [portfolioVerdict, setPortfolioVerdict] = useState(null);
  const [loadingVerdict, setLoadingVerdict] = useState(false);
  const [error, setError] = useState(null);

  const totalWeight = holdings.reduce((sum, h) => sum + h.weight, 0);

  // Auto-analyze when navigating from chat with initialHoldings
  useEffect(() => {
    if (initialHoldings && initialHoldings.length > 0 && !autoAnalyzed.current) {
      autoAnalyzed.current = true;
      analyzePortfolio();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function addHolding() {
    const sym = tickerInput.trim().toUpperCase();
    const wt = parseFloat(weightInput);
    if (!sym || isNaN(wt) || wt <= 0) return;
    if (holdings.some((h) => h.symbol === sym)) {
      setError(`${sym} is already in your portfolio.`);
      return;
    }
    setError(null);
    setHoldings((prev) => [...prev, { symbol: sym, weight: wt }]);
    setTickerInput("");
    setWeightInput("");
  }

  function removeHolding(symbol) {
    setHoldings((prev) => prev.filter((h) => h.symbol !== symbol));
    setResults(null);
    setPortfolioVerdict(null);
  }

  function startEdit(h) {
    setEditingSymbol(h.symbol);
    setEditWeight(String(h.weight));
  }

  function saveEdit(symbol) {
    const wt = parseFloat(editWeight);
    if (!isNaN(wt) && wt > 0) {
      setHoldings((prev) => prev.map((h) => h.symbol === symbol ? { ...h, weight: wt } : h));
    }
    setEditingSymbol(null);
  }

  async function analyzePortfolio() {
    if (holdings.length === 0) return;
    setAnalyzed(true);
    setAnalyzing(true);
    setError(null);
    setResults(null);
    setPortfolioVerdict(null);

    const fetched = await Promise.allSettled(
      holdings.map(async (h) => {
        const analysis = await fetchBuffettAnalysis(h.symbol);
        return { symbol: h.symbol, weight: h.weight, analysis };
      })
    );

    const resultList = fetched.map((r, i) => {
      if (r.status === "fulfilled") return r.value;
      return { symbol: holdings[i].symbol, weight: holdings[i].weight, analysis: null };
    });

    setResults(resultList);
    setAnalyzing(false);

    setLoadingVerdict(true);
    const passingItems = [];
    const failingItems = [];
    resultList.forEach((r) => {
      if (!r.analysis) return;
      const passRate = r.analysis.passCount / (r.analysis.totalCriteria || 1);
      const label = `${r.symbol} (${r.weight}% allocation)`;
      if (passRate >= 0.5) {
        passingItems.push(`${label}: ${r.analysis.passCount}/${r.analysis.totalCriteria} criteria passed, ${r.analysis.moat} moat`);
      } else {
        failingItems.push(`${label}: only ${r.analysis.passCount}/${r.analysis.totalCriteria} criteria passed, ${r.analysis.moat} moat`);
      }
    });

    try {
      const res = await fetch("/api/stock/buffett-take", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: `this portfolio of ${resultList.length} stocks`,
          passing: passingItems,
          failing: failingItems,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPortfolioVerdict(data.answer ?? data.verdict ?? null);
      }
    } catch {
      // verdict is optional
    } finally {
      setLoadingVerdict(false);
    }
  }

  // ── Derived metrics ──────────────────────────────────────────────────────
  const validResults = results?.filter((r) => r.analysis) ?? [];
  const totalWtValid = validResults.reduce((s, r) => s + r.weight, 0) || 1;

  const avgPassRate =
    validResults.length > 0
      ? validResults.reduce((s, r) => s + r.analysis.passCount / (r.analysis.totalCriteria || 1), 0) /
        validResults.length
      : 0;

  const weightedPassRate =
    validResults.length > 0
      ? validResults.reduce(
          (s, r) =>
            s + (r.weight / totalWtValid) * (r.analysis.passCount / (r.analysis.totalCriteria || 1)),
          0
        )
      : 0;

  const avgScore = (avgPassRate * 10).toFixed(1);
  const weightedScore = (weightedPassRate * 10).toFixed(1);
  const strongPicks = validResults.filter(
    (r) => r.analysis.passCount / (r.analysis.totalCriteria || 1) >= 0.7
  ).length;

  // Donut segments — arc size = allocation weight, color = Buffett score
  const donutSegments = validResults.map((r) => ({
    symbol: r.symbol,
    value: r.weight,
    color: scoreHex(r.analysis.passCount / (r.analysis.totalCriteria || 1)),
  }));

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Builder card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
        <h3 className="mb-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Build your portfolio
        </h3>
        <p className="mb-4 text-sm text-slate-500">
          Add stocks with allocation weights, then analyze the whole portfolio through Buffett's lens
        </p>

        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={tickerInput}
            onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && addHolding()}
            placeholder="Ticker (e.g. AAPL)"
            className="w-36 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-red-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
          <input
            type="number"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addHolding()}
            placeholder="Weight %"
            min="0.1"
            max="100"
            className="w-28 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-red-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
          <button
            onClick={addHolding}
            disabled={!tickerInput.trim() || !weightInput}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            <Plus size={14} /> Add
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGGESTED_STOCKS.map((s) => (
            <button
              key={s.symbol}
              onClick={() => setTickerInput(s.symbol)}
              className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] text-slate-500 transition-colors hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-red-500/30 dark:hover:text-red-400"
            >
              {s.symbol}
            </button>
          ))}
        </div>

        {holdings.length > 0 && (
          <div className="mt-5 space-y-4">
            {!analyzed ? (
              /* Pre-analysis: amber example box */
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                    Example — Berkshire Hathaway's top holdings
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      Math.abs(totalWeight - 100) < 0.5
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    Total: {totalWeight.toFixed(1)}%{" "}
                    {Math.abs(totalWeight - 100) < 0.5 ? "✓" : "(should sum to 100%)"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {holdings.map((h) => {
                    const isEditing = editingSymbol === h.symbol;
                    return (
                      <div
                        key={h.symbol}
                        className="group flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm transition-all dark:bg-slate-800"
                      >
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{h.symbol}</span>
                        {isEditing ? (
                          <>
                            <input
                              autoFocus
                              type="number"
                              value={editWeight}
                              onChange={(e) => setEditWeight(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEdit(h.symbol);
                                if (e.key === "Escape") setEditingSymbol(null);
                              }}
                              className="w-12 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs text-slate-800 outline-none focus:border-red-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                            />
                            <span className="text-[10px] text-slate-400">%</span>
                            <button onClick={() => saveEdit(h.symbol)} className="text-emerald-500 transition hover:text-emerald-400">
                              <Check size={12} />
                            </button>
                            <button onClick={() => setEditingSymbol(null)} className="text-slate-400 transition hover:text-slate-600">
                              <X size={12} />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="text-xs text-slate-500">{h.weight}%</span>
                            <span className="flex items-center gap-1 overflow-hidden max-w-0 opacity-0 transition-all duration-200 group-hover:max-w-[48px] group-hover:opacity-100">
                              <button onClick={() => startEdit(h)} className="text-slate-400 transition hover:text-blue-500">
                                <Pencil size={11} />
                              </button>
                              <button onClick={() => removeHolding(h.symbol)} className="text-slate-400 transition hover:text-red-500">
                                <Trash2 size={11} />
                              </button>
                            </span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Post-analysis: always-visible holdings chips */
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Portfolio — {holdings.length} holdings
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      Math.abs(totalWeight - 100) < 0.5
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    Total: {totalWeight.toFixed(1)}%{" "}
                    {Math.abs(totalWeight - 100) < 0.5 ? "✓" : "(should sum to 100%)"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {holdings.map((h) => {
                    const isEditing = editingSymbol === h.symbol;
                    return (
                      <div
                        key={h.symbol}
                        className="group flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm transition-all dark:bg-slate-800"
                      >
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{h.symbol}</span>

                        {isEditing ? (
                          <>
                            <input
                              autoFocus
                              type="number"
                              value={editWeight}
                              onChange={(e) => setEditWeight(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEdit(h.symbol);
                                if (e.key === "Escape") setEditingSymbol(null);
                              }}
                              className="w-12 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs text-slate-800 outline-none focus:border-red-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                            />
                            <span className="text-[10px] text-slate-400">%</span>
                            <button onClick={() => saveEdit(h.symbol)} className="text-emerald-500 transition hover:text-emerald-400">
                              <Check size={12} />
                            </button>
                            <button onClick={() => setEditingSymbol(null)} className="text-slate-400 transition hover:text-slate-600">
                              <X size={12} />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="text-xs text-slate-500">{h.weight}%</span>
                            {/* actions — hidden until hover */}
                            <span className="flex items-center gap-1 overflow-hidden max-w-0 opacity-0 transition-all duration-200 group-hover:max-w-[48px] group-hover:opacity-100">
                              <button
                                onClick={() => startEdit(h)}
                                className="text-slate-400 transition hover:text-blue-500"
                              >
                                <Pencil size={11} />
                              </button>
                              <button
                                onClick={() => removeHolding(h.symbol)}
                                className="text-slate-400 transition hover:text-red-500"
                              >
                                <Trash2 size={11} />
                              </button>
                            </span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={analyzePortfolio}
              disabled={analyzing}
              className="flex items-center gap-2 rounded-lg bg-red-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-400 disabled:opacity-50"
            >
              {analyzing ? <Loader2 size={14} className="animate-spin" /> : <BarChart3 size={14} />}
              {analyzing ? "Analyzing all stocks..." : "Analyze Portfolio"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      {analyzing && (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <Loader2 size={32} className="animate-spin text-red-500" />
          <p className="text-sm text-slate-500">
            Fetching fundamentals for {holdings.length} stocks in parallel...
          </p>
          <p className="text-xs text-slate-400">This may take 15–30 seconds</p>
        </div>
      )}

      {results && !analyzing && (
        <>
          {/* Donut + score cards */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
            {/* Donut */}
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900/60 sm:w-64 sm:shrink-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Allocation × Buffett Score
              </p>
              <div className="text-slate-900 dark:text-slate-100">
                <DonutChart
                  segments={donutSegments}
                  centerLabel={`${weightedScore}`}
                  centerSub="WEIGHTED"
                />
              </div>
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
                {donutSegments.map((seg) => (
                  <div key={seg.symbol} className="flex items-center gap-1">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: seg.color }}
                    />
                    <span className="text-[10px] font-medium text-slate-500">{seg.symbol}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Score cards 2×2 */}
            <div className="grid flex-1 grid-cols-2 gap-4">
              <ScoreCard label="Stocks Analyzed" value={validResults.length.toString()} />
              <ScoreCard
                label="Avg Buffett Score"
                value={`${avgScore}/10`}
                colorClass={
                  parseFloat(avgScore) >= 7
                    ? "text-emerald-600 dark:text-emerald-400"
                    : parseFloat(avgScore) >= 4
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-red-600 dark:text-red-400"
                }
                sub="unweighted average"
              />
              <ScoreCard
                label="Weighted Score"
                value={`${weightedScore}/10`}
                colorClass={
                  parseFloat(weightedScore) >= 7
                    ? "text-emerald-600 dark:text-emerald-400"
                    : parseFloat(weightedScore) >= 4
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-red-600 dark:text-red-400"
                }
                sub="by allocation weight"
              />
              <ScoreCard
                label="Strong Picks"
                value={`${strongPicks}/${validResults.length}`}
                sub="≥ 70% criteria passing"
              />
            </div>
          </div>

          {/* Criteria colour key */}
          <div className="flex items-center gap-4 rounded-lg border border-slate-100 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/40">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Criteria key
            </span>
            {[
              { color: "bg-emerald-500", label: "Pass" },
              { color: "bg-amber-400", label: "Caution" },
              { color: "bg-red-500", label: "Fail" },
              { color: "bg-slate-300 dark:bg-slate-600", label: "N/A" },
            ].map((k) => (
              <div key={k.label} className="flex items-center gap-1.5">
                <span className={`inline-block h-3 w-3 rounded-sm ${k.color}`} />
                <span className="text-[11px] text-slate-500">{k.label}</span>
              </div>
            ))}
            <span className="ml-auto text-[10px] text-slate-400">
              ROE · D/E · Margin · P/E — hover a square for details
            </span>
          </div>

          {/* Per-stock table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
            <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h3 className="text-sm font-medium uppercase tracking-wider text-slate-500">
                Stock-by-Stock Breakdown
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    {[
                      { label: "Stock", align: "text-left" },
                      { label: "Weight", align: "text-center" },
                      { label: "Criteria", align: "text-center" },
                      { label: "Score", align: "text-center" },
                      { label: "Moat", align: "text-center" },
                      { label: "Buffett Pick?", align: "text-center" },
                    ].map((h) => (
                      <th
                        key={h.label}
                        className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 ${h.align}`}
                      >
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => {
                    if (!r.analysis) {
                      return (
                        <tr key={r.symbol} className="border-b border-slate-50 dark:border-slate-800/50">
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                            {r.symbol}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-500">{r.weight}%</td>
                          <td colSpan={4} className="px-4 py-3 text-center text-xs text-red-500">
                            Failed to load data
                          </td>
                        </tr>
                      );
                    }

                    const scorecard = r.analysis.scorecard ?? [];
                    const passCount = r.analysis.passCount ?? 0;
                    const total = r.analysis.totalCriteria || 1;
                    const passRate = passCount / total;
                    const style = getScoreStyle(passRate);
                    const score = (passRate * 10).toFixed(1);
                    const moat = r.analysis.moat;

                    // weight bar width (relative to largest holding)
                    const maxWt = Math.max(...results.map((x) => x.weight));
                    const barPct = Math.round((r.weight / maxWt) * 100);

                    return (
                      <tr
                        key={r.symbol}
                        className={`border-b border-slate-50 dark:border-slate-800/50 ${style.bg}`}
                      >
                        {/* Stock name */}
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {r.symbol}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {r.analysis.stock_data?.name ?? ""}
                          </div>
                        </td>

                        {/* Weight + bar */}
                        <td className="px-4 py-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {r.weight}%
                            </span>
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                              <div
                                className="h-full rounded-full bg-slate-500 dark:bg-slate-400"
                                style={{ width: `${barPct}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Criteria heatmap */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {scorecard.length > 0
                              ? scorecard.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className={`flex h-7 w-9 cursor-default items-center justify-center rounded text-[9px] font-bold text-white ${
                                      criteriaColor[item.score] ?? "bg-slate-300 dark:bg-slate-600"
                                    }`}
                                    onMouseEnter={(e) => {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setTooltip({ x: rect.left + rect.width / 2, y: rect.top, item });
                                    }}
                                    onMouseLeave={() => setTooltip(null)}
                                  >
                                    {metricShort(item.metric)}
                                  </div>
                                ))
                              : <span className="text-xs text-slate-400">—</span>}
                          </div>
                        </td>

                        {/* Score */}
                        <td className="px-4 py-3 text-center">
                          <span className={`text-base font-bold ${style.text}`}>{score}/10</span>
                        </td>

                        {/* Moat */}
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Shield size={12} className={moatColor[moat]} />
                            <span className={`text-xs font-semibold ${moatColor[moat]}`}>{moat}</span>
                          </div>
                        </td>

                        {/* Pick badge */}
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${style.badge}`}
                          >
                            {style.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Portfolio AI verdict */}
          {(portfolioVerdict || loadingVerdict) && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
              <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
                What Would Buffett Think of This Portfolio?
              </h3>
              {loadingVerdict ? (
                <div className="flex items-center gap-3 py-4">
                  <Loader2 size={18} className="animate-spin text-red-500" />
                  <span className="text-sm text-slate-500">
                    Generating Buffett's portfolio assessment...
                  </span>
                </div>
              ) : (
                <div
                  className={`rounded-lg border-l-4 ${
                    parseFloat(weightedScore) >= 7
                      ? "border-l-emerald-500"
                      : parseFloat(weightedScore) >= 4
                      ? "border-l-amber-500"
                      : "border-l-red-500"
                  } bg-slate-50 px-5 py-4 dark:bg-slate-800/50`}
                >
                  <Quote size={18} className="mb-2 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {portfolioVerdict}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Fixed tooltip — escapes all overflow containers */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-[9999] w-44 rounded-lg bg-slate-900 px-3 py-2.5 text-left shadow-xl dark:bg-slate-700"
          style={{ left: tooltip.x, top: tooltip.y - 8, transform: "translate(-50%, -100%)" }}
        >
          <p className="text-[10px] font-semibold text-white">{tooltip.item.metric}</p>
          <p className="mt-0.5 text-[10px] text-slate-300">Value: {tooltip.item.value}</p>
          <p className="text-[10px] text-slate-400">Target: {tooltip.item.threshold}</p>
        </div>
      )}
    </div>
  );
}
