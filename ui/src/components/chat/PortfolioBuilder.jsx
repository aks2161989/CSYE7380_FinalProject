import { useState, useRef, useEffect } from "react";
import { Plus, X, BarChart3 } from "lucide-react";
import StockAutocomplete from "./StockAutocomplete";
import { STOCK_LIST } from "../../data/slashCommands";

const SUGGESTED = ["AAPL", "KO", "BAC", "MSFT", "NVDA", "JPM", "TSLA", "AMZN"];

export default function PortfolioBuilder({ onAnalyze, onCancel, disabled }) {
  const [tickerInput, setTickerInput] = useState("");
  const [weightInput, setWeightInput] = useState("");
  const [holdings, setHoldings] = useState([]);
  const [error, setError] = useState(null);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedStockIdx, setSelectedStockIdx] = useState(0);
  const tickerRef = useRef(null);
  const wrapperRef = useRef(null);

  const totalWeight = holdings.reduce((s, h) => s + h.weight, 0);

  const filteredStocks =
    tickerInput.length > 0
      ? STOCK_LIST.filter(
          (s) =>
            s.symbol.toLowerCase().includes(tickerInput.toLowerCase()) ||
            s.name.toLowerCase().includes(tickerInput.toLowerCase())
        ).slice(0, 6)
      : [];

  useEffect(() => {
    if (filteredStocks.length > 0 && tickerInput.length > 0) {
      setShowAutocomplete(true);
      setSelectedStockIdx(0);
    } else {
      setShowAutocomplete(false);
    }
  }, [tickerInput, filteredStocks.length]);

  // Close autocomplete on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowAutocomplete(false);
      }
    }
    if (showAutocomplete) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showAutocomplete]);

  function addHolding() {
    const sym = tickerInput.trim().toUpperCase();
    const wt = parseFloat(weightInput);
    if (!sym || isNaN(wt) || wt <= 0) return;
    if (holdings.some((h) => h.symbol === sym)) {
      setError(`${sym} is already added.`);
      return;
    }
    setError(null);
    setHoldings((prev) => [...prev, { symbol: sym, weight: wt }]);
    setTickerInput("");
    setWeightInput("");
    tickerRef.current?.focus();
  }

  function removeHolding(symbol) {
    setHoldings((prev) => prev.filter((h) => h.symbol !== symbol));
  }

  function handleSelectStock(stock) {
    setTickerInput(stock.symbol);
    setShowAutocomplete(false);
    // Focus weight input after selecting ticker
    setTimeout(() => {
      const weightEl = document.getElementById("portfolio-weight-input");
      weightEl?.focus();
    }, 0);
  }

  function handleTickerKeyDown(e) {
    if (showAutocomplete && filteredStocks.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedStockIdx((p) => (p < filteredStocks.length - 1 ? p + 1 : 0));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedStockIdx((p) => (p > 0 ? p - 1 : filteredStocks.length - 1));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        handleSelectStock(filteredStocks[selectedStockIdx]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowAutocomplete(false);
        return;
      }
    }
    if (e.key === "Enter") {
      e.preventDefault();
      addHolding();
    }
  }

  function handleSubmit() {
    if (holdings.length === 0 || disabled) return;
    onAnalyze(holdings);
  }

  return (
    <div className="border-t border-slate-200 bg-white px-4 pt-4 pb-3 dark:border-slate-800 dark:bg-[#0d1520]">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-red-500" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Trade like Buffett
            </span>
          </div>
          <button
            onClick={onCancel}
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X size={14} />
          </button>
        </div>

        {/* Input row */}
        <div ref={wrapperRef} className="relative">
          {showAutocomplete && filteredStocks.length > 0 && (
            <StockAutocomplete
              stocks={filteredStocks}
              selectedIdx={selectedStockIdx}
              onSelect={handleSelectStock}
            />
          )}
          <div className="flex flex-wrap gap-2">
            <input
              ref={tickerRef}
              type="text"
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
              onKeyDown={handleTickerKeyDown}
              placeholder="Ticker (e.g. AAPL)"
              disabled={disabled}
              className="w-36 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-red-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 placeholder:text-slate-400 disabled:opacity-50"
            />
            <input
              id="portfolio-weight-input"
              type="number"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHolding())}
              placeholder="Weight %"
              min="0.1"
              max="100"
              disabled={disabled}
              className="w-24 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-red-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 placeholder:text-slate-400 disabled:opacity-50"
            />
            <button
              onClick={addHolding}
              disabled={!tickerInput.trim() || !weightInput || disabled}
              className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-40 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </div>

        {/* Suggested stocks */}
        <div className="mt-2 flex flex-wrap gap-1">
          {SUGGESTED.map((sym) => (
            <button
              key={sym}
              onClick={() => setTickerInput(sym)}
              disabled={disabled}
              className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500 transition-colors hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-red-500/30 dark:hover:text-red-400 disabled:opacity-50"
            >
              {sym}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-2 text-xs text-red-500">{error}</p>
        )}

        {/* Holdings chips */}
        {holdings.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {holdings.map((h) => (
              <div
                key={h.symbol}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {h.symbol}
                </span>
                <span className="text-xs text-slate-400">{h.weight}%</span>
                <button
                  onClick={() => removeHolding(h.symbol)}
                  disabled={disabled}
                  className="ml-0.5 flex h-4 w-4 items-center justify-center rounded text-slate-400 transition-colors hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-500/20 dark:hover:text-red-400"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer: total weight + analyze button */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {holdings.length > 0
              ? `${holdings.length} stock${holdings.length > 1 ? "s" : ""} · Total: ${totalWeight}%`
              : "Add stocks to build your portfolio"}
          </span>
          <button
            onClick={handleSubmit}
            disabled={holdings.length === 0 || disabled}
            className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-red-400 disabled:opacity-40 disabled:hover:bg-red-500"
          >
            <BarChart3 size={14} /> Analyze Portfolio
          </button>
        </div>
      </div>
    </div>
  );
}
