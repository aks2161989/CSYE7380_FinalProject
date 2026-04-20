import { useState } from "react";
import { LineChart, FlaskConical } from "lucide-react";
import StockSelector from "../components/trading/StockSelector";
import PriceChart from "../components/trading/PriceChart";
import FundamentalsPanel from "../components/trading/FundamentalsPanel";
import BacktestForm from "../components/backtest/BacktestForm";
import BacktestResults from "../components/backtest/BacktestResults";
import EquityChart from "../components/backtest/EquityChart";
import TradesTable from "../components/backtest/TradesTable";
import { mockPriceDataBySymbol, mockFundamentals } from "../data/mockStockData";
import { runBacktest } from "../services/api";

const tabs = [
  { id: "trading", label: "Stock Trading", icon: LineChart },
  { id: "backtest", label: "Backtesting", icon: FlaskConical },
];

export default function TradingPage() {
  const [activeTab, setActiveTab] = useState("trading");
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");

  // Backtest state
  const [backtestResult, setBacktestResult] = useState(null);
  const [backtestCurve, setBacktestCurve] = useState(null);
  const [backtestTrades, setBacktestTrades] = useState(null);
  const [backtestLoading, setBacktestLoading] = useState(false);

  async function handleBacktest({ symbol, strategy }) {
    setBacktestLoading(true);
    try {
      const data = await runBacktest(symbol, strategy);
      setBacktestResult(data.result);
      setBacktestCurve(data.equityCurve);
      setBacktestTrades(data.trades);
    } finally {
      setBacktestLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">
      {/* Header + Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Trading & Analysis</h1>
          <p className="mt-1 text-sm text-slate-500">
            Analyze stocks and backtest trading strategies
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

      {/* Stock Trading Tab */}
      {activeTab === "trading" && (
        <div className="space-y-6">
          <div className="max-w-xs">
            <StockSelector selected={selectedSymbol} onSelect={setSelectedSymbol} />
          </div>
          <PriceChart data={mockPriceDataBySymbol[selectedSymbol] || []} />
          <FundamentalsPanel data={mockFundamentals[selectedSymbol]} />
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
              {backtestResult ? (
                <>
                  <BacktestResults result={backtestResult} />
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
