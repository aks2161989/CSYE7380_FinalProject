import { useState } from "react";
import { Search, Loader2, TrendingUp } from "lucide-react";
import { fetchBuffettAnalysis } from "../../services/api";
import BuffettScorecard from "./BuffettScorecard";
import BuffettVerdict from "./BuffettVerdict";

const POPULAR_STOCKS = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "KO", name: "Coca-Cola" },
  { symbol: "BAC", name: "Bank of America" },
  { symbol: "JNJ", name: "J&J" },
  { symbol: "JPM", name: "JPMorgan" },
  { symbol: "NVDA", name: "Nvidia" },
];

function MetricCard({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-3 dark:bg-slate-800/40">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}

export default function TradeLikeBuffett() {
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  async function analyze(symbol) {
    const s = (symbol || ticker).trim().toUpperCase();
    if (!s) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const result = await fetchBuffettAnalysis(s);
      if (result.error) {
        setError(result.error);
      } else {
        setAnalysis(result);
      }
    } catch {
      setError("Failed to fetch analysis. Make sure the backend server is running.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    analyze();
  }

  const sd = analysis?.stock_data;

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
        <h3 className="mb-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Analyze any stock through Buffett's lens
        </h3>
        <p className="mb-4 text-sm text-slate-500">
          Enter a ticker to see how it measures up against Warren Buffett's investment criteria
        </p>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="Enter ticker (e.g. AAPL)"
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-900 outline-none transition-colors focus:border-red-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !ticker.trim()}
            className="flex items-center gap-2 rounded-lg bg-red-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-all hover:bg-red-400 disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </form>

        {/* Quick picks */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {POPULAR_STOCKS.map((s) => (
            <button
              key={s.symbol}
              onClick={() => { setTicker(s.symbol); analyze(s.symbol); }}
              disabled={loading}
              className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] text-slate-500 transition-colors hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-red-500/30 dark:hover:text-red-400 disabled:opacity-50"
            >
              {s.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <Loader2 size={32} className="animate-spin text-red-500" />
          <p className="text-sm text-slate-500">
            Fetching live data & running Buffett analysis...
          </p>
          <p className="text-xs text-slate-400">
            This may take 10-15 seconds (fetching fundamentals + RAG analysis)
          </p>
        </div>
      )}

      {/* Results */}
      {analysis && !loading && (
        <>
          {/* Stock overview */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {sd?.name}
                </h3>
                <p className="text-sm text-slate-500">
                  {sd?.ticker} · {sd?.sector} · {sd?.industry}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  ${sd?.current_price?.toFixed(2)}
                </p>
                {sd?.["1y_return"] != null && (
                  <p className={`text-xs font-medium ${sd["1y_return"] > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    {sd["1y_return"] > 0 ? "+" : ""}{sd["1y_return"].toFixed(1)}% (1Y)
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricCard label="Market Cap" value={sd?.market_cap ? (sd.market_cap >= 1e12 ? `$${(sd.market_cap / 1e12).toFixed(1)}T` : `$${(sd.market_cap / 1e9).toFixed(1)}B`) : "N/A"} />
              <MetricCard label="P/E Ratio" value={sd?.trailing_pe?.toFixed(1) ?? "N/A"} />
              <MetricCard label="52W Range" value={sd?.["52w_low"] && sd?.["52w_high"] ? `$${sd["52w_low"].toFixed(0)} – $${sd["52w_high"].toFixed(0)}` : "N/A"} />
              <MetricCard label="Dividend Yield" value={sd?.dividend_yield ? `${(sd.dividend_yield * 100).toFixed(2)}%` : "N/A"} />
            </div>
          </div>

          {/* Scorecard */}
          <BuffettScorecard
            scorecard={analysis.scorecard}
            moat={analysis.moat}
            passCount={analysis.passCount}
            totalCriteria={analysis.totalCriteria}
            stockName={sd?.name}
          />

          {/* Verdict */}
          <BuffettVerdict
            verdict={analysis.verdict}
            sources={analysis.sources}
            moat={analysis.moat}
          />
        </>
      )}
    </div>
  );
}
