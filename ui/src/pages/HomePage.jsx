import { useState, useEffect, useMemo } from "react";
import PortfolioSummary from "../components/home/PortfolioSummary";
import PortfolioChart from "../components/home/PortfolioChart";
import PortfolioTable from "../components/home/PortfolioTable";
import ArticlesSection from "../components/home/ArticlesSection";
import LatestInvestments from "../components/home/LatestInvestments";
import HeroSection from "../components/home/HeroSection";
import { portfolioSummary, holdings as mockHoldings, sectorAllocation } from "../data/mockPortfolio";
import { fetchPortfolioPrices } from "../services/api";

export default function HomePage() {
  const [livePrices, setLivePrices] = useState(null);

  useEffect(() => {
    fetchPortfolioPrices()
      .then(setLivePrices)
      .catch(() => setLivePrices(null));
  }, []);

  const holdings = useMemo(() => {
    if (!livePrices) return mockHoldings;
    return mockHoldings.map((h) => {
      const live = livePrices[h.symbol];
      if (!live?.currentPrice) return h;
      const currentPrice = live.currentPrice;
      const gainPercent = ((currentPrice - h.avgCost) / h.avgCost) * 100;
      const marketValue = currentPrice * h.shares;
      return {
        ...h,
        currentPrice,
        gainPercent: Math.round(gainPercent * 10) / 10,
        marketValue: Math.round(marketValue),
        change24h: live.change24h ?? h.change24h,
      };
    });
  }, [livePrices]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
      {/* Hero */}
      <HeroSection />

      {/* Articles */}
      <ArticlesSection />

      {/* Portfolio section header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Berkshire Hathaway Portfolio
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Current equity holdings based on SEC 13F filings
          {livePrices && (
            <span className="ml-2 inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          )}
        </p>
      </div>

      {/* Summary cards */}
      <PortfolioSummary summary={portfolioSummary} />

      {/* Sector Chart */}
      <PortfolioChart data={sectorAllocation} />

      {/* Holdings Table — full width */}
      <PortfolioTable holdings={holdings} />

      {/* Latest Investments Table */}
      <LatestInvestments />
    </div>
  );
}
