import PortfolioSummary from "../components/home/PortfolioSummary";
import PortfolioChart from "../components/home/PortfolioChart";
import PortfolioTable from "../components/home/PortfolioTable";
import { portfolioSummary, holdings, sectorAllocation } from "../data/mockPortfolio";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">
          Warren Buffett's Portfolio
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Berkshire Hathaway's current equity holdings based on SEC 13F filings
        </p>
      </div>

      {/* Summary cards */}
      <PortfolioSummary summary={portfolioSummary} />

      {/* Chart + Table */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <PortfolioChart data={sectorAllocation} />
        </div>
        <div className="lg:col-span-2">
          <PortfolioTable holdings={holdings} />
        </div>
      </div>
    </div>
  );
}
