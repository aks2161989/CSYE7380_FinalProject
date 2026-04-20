import { useState } from "react";

const LOGO_DEV_PUBLIC_KEY = "pk_LBmLXMUXR82QrV3PCBB1Lw";

const tickerDomains = {
  AAPL: "apple.com", MSFT: "microsoft.com", GOOGL: "google.com", AMZN: "amazon.com",
  TSLA: "tesla.com", META: "meta.com", NFLX: "netflix.com", NVDA: "nvidia.com",
  BAC: "bankofamerica.com", AXP: "americanexpress.com", KO: "coca-cola.com",
  CVX: "chevron.com", OXY: "oxy.com", KHC: "kraftheinzcompany.com",
  MCO: "moodys.com", DVA: "davita.com", VRSN: "verisign.com",
  DIS: "disney.com", NKE: "nike.com", WMT: "walmart.com", JPM: "jpmorgan.com",
  V: "visa.com", MA: "mastercard.com", JNJ: "jnj.com", PG: "pg.com",
  XOM: "exxonmobil.com", PFE: "pfizer.com", INTC: "intel.com", AMD: "amd.com",
  BA: "boeing.com", GS: "goldmansachs.com", COST: "costco.com", SBUX: "starbucks.com",
  CRM: "salesforce.com", ORCL: "oracle.com", IBM: "ibm.com",
};

function Metric({ label, value, highlight }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p className={`mt-0.5 text-lg font-bold ${highlight ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-slate-100"}`}>
        {value}
      </p>
    </div>
  );
}

function fmt(val, suffix = "", prefix = "", decimals = 1) {
  if (val == null) return "N/A";
  return `${prefix}${Number(val).toFixed(decimals)}${suffix}`;
}

function fmtPct(val) {
  if (val == null) return "N/A";
  return `${(val * 100).toFixed(1)}%`;
}

export default function StockCard({ data }) {
  const [logoFailed, setLogoFailed] = useState(false);

  if (!data) return null;

  const domain = tickerDomains[data.ticker];
  const hasBacktest = data.backtest_ma || data.backtest_rsi;

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900/80">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        {domain && !logoFailed ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
            <img
              src={`https://img.logo.dev/${domain}?token=${LOGO_DEV_PUBLIC_KEY}&size=80&format=png`}
              alt={data.ticker}
              className="h-6 w-6 object-contain"
              onError={() => setLogoFailed(true)}
            />
          </div>
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-600 text-[10px] font-bold text-white">
            {data.ticker.slice(0, 2)}
          </div>
        )}
        <div>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {data.name}
          </span>
          <span className="ml-1.5 text-xs text-slate-400">
            ({data.ticker}) — {data.sector}
          </span>
        </div>
      </div>

      {/* Row 1: Core metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Metric label="Price" value={fmt(data.current_price, "", "$", 2)} />
        <Metric label="P/E Ratio" value={fmt(data.trailing_pe)} />
        <Metric label="ROE" value={data.roe != null ? `${(data.roe * 100).toFixed(1)}%` : "N/A"} />
        <Metric label="Debt/Equity" value={fmt(data.debt_to_equity)} />
      </div>

      {/* Row 2: Secondary metrics */}
      <div className="mt-4 grid grid-cols-4 gap-4">
        <Metric label="Profit Margin" value={data.profit_margins != null ? fmtPct(data.profit_margins) : "N/A"} />
        <Metric label="Dividend Yield" value={data.dividend_yield != null ? fmtPct(data.dividend_yield) : "N/A"} />
        <Metric
          label="1Y Return"
          value={data["1y_return"] != null ? `${data["1y_return"].toFixed(1)}%` : "N/A"}
          highlight={data["1y_return"] > 0}
        />
        <Metric
          label="5Y Return"
          value={data["5y_return"] != null ? `${data["5y_return"].toFixed(1)}%` : "N/A"}
          highlight={data["5y_return"] > 0}
        />
      </div>

      {/* Backtest Results */}
      {hasBacktest && (
        <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Backtest Results (2018–present)
          </p>
          <div className="grid grid-cols-2 gap-4">
            {data.backtest_ma && (
              <div>
                <p className="mb-2 text-[11px] font-medium italic text-slate-500 dark:text-slate-400">
                  MA Crossover (20/50)
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <Metric label="Return" value={`${(data.backtest_ma.total_return * 100).toFixed(1)}%`} highlight />
                  <Metric label="Sharpe" value={data.backtest_ma.sharpe_ratio.toFixed(2)} />
                  <Metric label="Win Rate" value={`${(data.backtest_ma.win_rate * 100).toFixed(0)}%`} />
                </div>
              </div>
            )}
            {data.backtest_rsi && (
              <div>
                <p className="mb-2 text-[11px] font-medium italic text-slate-500 dark:text-slate-400">
                  RSI Strategy (30/70)
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <Metric label="Return" value={`${(data.backtest_rsi.total_return * 100).toFixed(1)}%`} highlight />
                  <Metric label="Sharpe" value={data.backtest_rsi.sharpe_ratio.toFixed(2)} />
                  <Metric label="Win Rate" value={`${(data.backtest_rsi.win_rate * 100).toFixed(0)}%`} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
