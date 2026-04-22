import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { LineChart, FlaskConical, Sparkles } from "lucide-react";
import StockSelector from "../components/trading/StockSelector";
import PriceChart from "../components/trading/PriceChart";
import FundamentalsPanel from "../components/trading/FundamentalsPanel";
import BacktestForm from "../components/backtest/BacktestForm";
import BacktestResults from "../components/backtest/BacktestResults";
import EquityChart from "../components/backtest/EquityChart";
import SignalChart from "../components/backtest/SignalChart";
import TradesTable from "../components/backtest/TradesTable";
import TradeLikeBuffett from "../components/buffett/TradelikBuffett";
import { runBacktest, getStockPrices, getStockFundamentals, getBacktestBuffettTake } from "../services/api";

const tabs = [
  { id: "buffett", label: "Trade like Buffett", icon: Sparkles },
  { id: "trading", label: "Stock Trading", icon: LineChart },
  { id: "backtest", label: "Backtesting", icon: FlaskConical },
];

export default function TradingPage() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get("tab");
    return tabs.some((t) => t.id === tab) ? tab : "buffett";
  });
  const [selectedSymbol, setSelectedSymbol] = useState(() => {
    return searchParams.get("symbol")?.toUpperCase() || "AAPL";
  });
  const [priceData, setPriceData] = useState([]);
  const [priceLoading, setPriceLoading] = useState(false);
  const [period, setPeriod] = useState("6mo");
  const [fundamentals, setFundamentals] = useState(null);
  const [fundamentalsLoading, setFundamentalsLoading] = useState(false);
  const [backtestPriceData, setBacktestPriceData] = useState(null);

  // Sync state from URL params when they change (e.g., navigating from chat)
  useEffect(() => {
    const tab = searchParams.get("tab");
    const symbol = searchParams.get("symbol");
    if (tab && tabs.some((t) => t.id === tab)) setActiveTab(tab);
    if (symbol) setSelectedSymbol(symbol.toUpperCase());
  }, [searchParams]);

  useEffect(() => {
    setPriceLoading(true);
    getStockPrices(selectedSymbol, period)
      .then(setPriceData)
      .catch(() => setPriceData([]))
      .finally(() => setPriceLoading(false));
  }, [selectedSymbol, period]);

  useEffect(() => {
    setFundamentalsLoading(true);
    setFundamentals(null);
    getStockFundamentals(selectedSymbol)
      .then(setFundamentals)
      .catch(() => setFundamentals(null))
      .finally(() => setFundamentalsLoading(false));
  }, [selectedSymbol]);

  // Backtest state
  const [backtestResult, setBacktestResult] = useState(null);
  const [backtestCurve, setBacktestCurve] = useState(null);
  const [backtestTrades, setBacktestTrades] = useState(null);
  const [backtestLoading, setBacktestLoading] = useState(false);
  const [backtestTake, setBacktestTake] = useState(null);
  const [backtestTakeLoading, setBacktestTakeLoading] = useState(false);

  async function handleBacktest({ symbol, strategy, startDate, endDate, shortWindow, longWindow, rsiPeriod, oversold, overbought }) {
    setBacktestLoading(true);
    setBacktestTake(null);
    setBacktestTakeLoading(true);
    try {
      const data = await runBacktest(symbol, strategy, { startDate, endDate, shortWindow, longWindow, rsiPeriod, oversold, overbought });
      setBacktestResult(data.result);
      setBacktestCurve(data.equityCurve);
      setBacktestTrades(data.trades);
      setBacktestPriceData(data.priceData || null);
      try {
        const take = await getBacktestBuffettTake({
          symbol: data.result.symbol,
          strategyName: data.result.strategyName,
          totalReturn: data.result.totalReturn,
          sharpeRatio: data.result.sharpeRatio,
          maxDrawdown: data.result.maxDrawdown,
          winRate: data.result.winRate,
          numTrades: data.result.numTrades,
        });
        setBacktestTake(take.answer);
      } catch (err) {
        setBacktestTake(`Error: ${err.message}`);
      }
    } finally {
      setBacktestLoading(false);
      setBacktestTakeLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">
      {/* Header + Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Trading & Analysis</h1>
          <p className="mt-1 text-sm text-slate-500">
            Analyze stocks, backtest strategies, and invest like Buffett
          </p>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900/60">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                activeTab === id
                  ? "bg-white text-red-600 shadow-sm dark:bg-slate-800 dark:text-red-400 dark:shadow"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Trade like Buffett Tab */}
      {activeTab === "buffett" && (
        <TradeLikeBuffett
          initialHoldings={(() => {
            const h = searchParams.get("holdings");
            if (!h) return null;
            try {
              return h.split(",").map((s) => {
                const [symbol, weight] = s.split(":");
                return { symbol: symbol.toUpperCase(), weight: parseFloat(weight) };
              }).filter((x) => x.symbol && !isNaN(x.weight) && x.weight > 0);
            } catch { return null; }
          })()}
        />
      )}

      {/* Stock Trading Tab */}
      {activeTab === "trading" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="max-w-xs">
              <StockSelector selected={selectedSymbol} onSelect={setSelectedSymbol} />
            </div>
            <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900/60">
              {["1mo","3mo","6mo","1y"].map((p, i) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded px-3 py-1.5 text-xs font-medium transition-all ${
                    period === p
                      ? "bg-white text-red-600 shadow-sm dark:bg-slate-800 dark:text-red-400"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  {["1M","3M","6M","1Y"][i]}
                </button>
              ))}
            </div>
          </div>
          <PriceChart data={priceData} loading={priceLoading} />
          <FundamentalsPanel data={fundamentals} loading={fundamentalsLoading} />
        </div>
      )}

      {/* Backtesting Tab */}
      {activeTab === "backtest" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
            <div className="lg:col-span-1 flex flex-col gap-4">
              <BacktestForm onRun={handleBacktest} loading={backtestLoading} />
              {backtestResult && (
                <div className="flex-1 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60 flex flex-col">
                  <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Sparkles size={12} /> What Would Warren Buffett Say?
                  </h3>
                  {backtestTakeLoading ? (
                    <p className="text-xs text-slate-400 italic">Analysing results...</p>
                  ) : backtestTake ? (() => {
                    const r = backtestResult;
                    const good = r.totalReturn > 0 && r.sharpeRatio > 1 && r.winRate > 0.5;
                    const bad = r.totalReturn < 0 || r.sharpeRatio < 0.5;
                    const colors = good
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                      : bad
                      ? "bg-red-500/10 border-red-500/20 text-red-800 dark:text-red-300"
                      : "bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300";
                    return (
                      <div className={`rounded-lg border px-3 py-2 flex-1 overflow-y-auto ${colors}`}>
                        <p className="text-xs leading-relaxed">{backtestTake}</p>
                      </div>
                    );
                  })() : null}
                </div>
              )}
            </div>
            <div className="lg:col-span-2 space-y-6">
              {backtestResult ? (
                <>
                  <BacktestResults result={backtestResult} />
                  {backtestPriceData && <SignalChart priceData={backtestPriceData} trades={backtestTrades} />}
                  {backtestCurve && <EquityChart data={backtestCurve} />}
                </>
              ) : (
                <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                  <p className="text-sm text-slate-500">
                    Configure and run a backtest to see results
                  </p>
                </div>
              )}
            </div>
          </div>
          {backtestTrades && <TradesTable trades={backtestTrades} />}
        </div>
      )}
    </div>
  );
}
