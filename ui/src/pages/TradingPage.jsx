import { useState, useEffect } from "react";
import { LineChart, FlaskConical, Sparkles, Loader2 } from "lucide-react";
import StockSelector from "../components/trading/StockSelector";
import PriceChart from "../components/trading/PriceChart";
import FundamentalsPanel from "../components/trading/FundamentalsPanel";
import BacktestForm from "../components/backtest/BacktestForm";
import BacktestResults from "../components/backtest/BacktestResults";
import EquityChart from "../components/backtest/EquityChart";
import TradesTable from "../components/backtest/TradesTable";
import TradeLikeBuffett from "../components/buffett/TradelikBuffett";
import { fetchStockPrices, fetchStockFundamentals, runBacktest } from "../services/api";

const tabs = [
  { id: "buffett", label: "Trade like Buffett", icon: Sparkles },
  { id: "trading", label: "Stock Trading", icon: LineChart },
  { id: "backtest", label: "Backtesting", icon: FlaskConical },
];

export default function TradingPage() {
  const [activeTab, setActiveTab] = useState("buffett");
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");

  // Live stock data
  const [priceData, setPriceData] = useState([]);
  const [fundamentals, setFundamentals] = useState(null);
  const [stockLoading, setStockLoading] = useState(false);

  // Backtest state
  const [backtestResults, setBacktestResults] = useState(null);
  const [backtestLoading, setBacktestLoading] = useState(false);
  const [activeStrategy, setActiveStrategy] = useState("ma");

  // Fetch live price + fundamentals when symbol changes
  useEffect(() => {
    if (activeTab !== "trading") return;
    setStockLoading(true);
    Promise.all([
      fetchStockPrices(selectedSymbol).catch(() => []),
      fetchStockFundamentals(selectedSymbol).catch(() => null),
    ]).then(([prices, fund]) => {
      if (Array.isArray(prices)) setPriceData(prices);
      if (fund && !fund.error) {
        setFundamentals({
          symbol: fund.ticker,
          name: fund.name,
          price: fund.current_price,
          marketCap: fund.market_cap >= 1e12 ? `$${(fund.market_cap / 1e12).toFixed(1)}T` : `$${(fund.market_cap / 1e9).toFixed(1)}B`,
          peRatio: fund.trailing_pe,
          eps: fund.current_price && fund.trailing_pe ? fund.current_price / fund.trailing_pe : null,
          dividendYield: fund.dividend_yield ? `${(fund.dividend_yield * 100).toFixed(2)}%` : "0.00%",
          week52High: fund["52w_high"],
          week52Low: fund["52w_low"],
          avgVolume: "N/A",
          beta: null,
        });
      }
    }).finally(() => setStockLoading(false));
  }, [selectedSymbol, activeTab]);

  async function handleBacktest({ symbol }) {
    setBacktestLoading(true);
    try {
      const data = await runBacktest(symbol);
      setBacktestResults(data);
      if (data.ma) setActiveStrategy("ma");
      else if (data.rsi) setActiveStrategy("rsi");
    } finally {
      setBacktestLoading(false);
    }
  }

  const currentBacktest = backtestResults?.[activeStrategy];

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
      {activeTab === "buffett" && <TradeLikeBuffett />}

      {/* Stock Trading Tab */}
      {activeTab === "trading" && (
        <div className="space-y-6">
          <div className="max-w-xs">
            <StockSelector selected={selectedSymbol} onSelect={setSelectedSymbol} />
          </div>
          {stockLoading ? (
            <div className="flex items-center justify-center gap-2 py-16">
              <Loader2 size={24} className="animate-spin text-red-500" />
              <span className="text-sm text-slate-500">Fetching live data...</span>
            </div>
          ) : (
            <>
              <PriceChart data={priceData} />
              <FundamentalsPanel data={fundamentals} />
            </>
          )}
        </div>
      )}

      {/* Backtesting Tab */}
      {activeTab === "backtest" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <BacktestForm onRun={handleBacktest} loading={backtestLoading} />
            </div>
            <div className="lg:col-span-2 space-y-6">
              {backtestResults ? (
                <>
                  {/* Strategy toggle */}
                  <div className="flex gap-2">
                    {backtestResults.ma && (
                      <button
                        onClick={() => setActiveStrategy("ma")}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                          activeStrategy === "ma"
                            ? "bg-red-500 text-slate-950"
                            : "border border-slate-200 text-slate-500 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400"
                        }`}
                      >
                        MA Crossover
                      </button>
                    )}
                    {backtestResults.rsi && (
                      <button
                        onClick={() => setActiveStrategy("rsi")}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                          activeStrategy === "rsi"
                            ? "bg-red-500 text-slate-950"
                            : "border border-slate-200 text-slate-500 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400"
                        }`}
                      >
                        RSI Strategy
                      </button>
                    )}
                  </div>
                  {currentBacktest && (
                    <>
                      <BacktestResults result={currentBacktest.result} />
                      {currentBacktest.equityCurve && (
                        <EquityChart data={currentBacktest.equityCurve} />
                      )}
                    </>
                  )}
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
          {currentBacktest?.trades?.length > 0 && (
            <TradesTable trades={currentBacktest.trades} />
          )}
        </div>
      )}
    </div>
  );
}
