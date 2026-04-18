export const portfolioSummary = {
  totalValue: 267_500_000_000,
  numHoldings: 41,
  topSector: "Technology",
  asOfDate: "2024-12-31",
};

export const holdings = [
  { symbol: "AAPL", name: "Apple Inc.", shares: 300_000_000, avgCost: 39.12, currentPrice: 198.50, marketValue: 59_550_000_000, weight: 22.3, change24h: 1.24, sector: "Technology" },
  { symbol: "BAC", name: "Bank of America", shares: 1_032_852_006, avgCost: 14.17, currentPrice: 37.25, marketValue: 38_473_737_224, weight: 14.4, change24h: -0.52, sector: "Financial Services" },
  { symbol: "AXP", name: "American Express", shares: 151_610_700, avgCost: 8.49, currentPrice: 225.30, marketValue: 34_157_850_810, weight: 12.8, change24h: 0.87, sector: "Financial Services" },
  { symbol: "KO", name: "Coca-Cola Co.", shares: 400_000_000, avgCost: 3.25, currentPrice: 62.45, marketValue: 24_980_000_000, weight: 9.4, change24h: 0.15, sector: "Consumer Defensive" },
  { symbol: "CVX", name: "Chevron Corp.", shares: 118_610_534, avgCost: 95.30, currentPrice: 161.20, marketValue: 19_119_938_081, weight: 7.2, change24h: -1.03, sector: "Energy" },
  { symbol: "OXY", name: "Occidental Petroleum", shares: 248_018_128, avgCost: 52.80, currentPrice: 63.75, marketValue: 15_811_155_660, weight: 5.9, change24h: -0.78, sector: "Energy" },
  { symbol: "KHC", name: "Kraft Heinz Co.", shares: 325_634_818, avgCost: 30.67, currentPrice: 36.10, marketValue: 11_755_416_930, weight: 4.4, change24h: 0.33, sector: "Consumer Defensive" },
  { symbol: "MCO", name: "Moody's Corp.", shares: 24_669_778, avgCost: 10.05, currentPrice: 412.80, marketValue: 10_183_724_390, weight: 3.8, change24h: 1.56, sector: "Financial Services" },
  { symbol: "DVA", name: "DaVita Inc.", shares: 36_095_570, avgCost: 50.45, currentPrice: 136.90, marketValue: 4_941_483_533, weight: 1.9, change24h: 2.14, sector: "Healthcare" },
  { symbol: "VRSN", name: "VeriSign Inc.", shares: 12_815_613, avgCost: 21.30, currentPrice: 198.40, marketValue: 2_542_537_459, weight: 1.0, change24h: -0.22, sector: "Technology" },
];

export const sectorAllocation = [
  { sector: "Technology", weight: 23.3, color: "#3b82f6" },
  { sector: "Financial Services", weight: 31.0, color: "#8b5cf6" },
  { sector: "Consumer Defensive", weight: 13.8, color: "#10b981" },
  { sector: "Energy", weight: 13.1, color: "#f59e0b" },
  { sector: "Healthcare", weight: 1.9, color: "#ef4444" },
  { sector: "Other", weight: 16.9, color: "#64748b" },
];
