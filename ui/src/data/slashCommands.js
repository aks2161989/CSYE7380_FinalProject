import { stockList } from "./mockStockData";

export const SLASH_COMMANDS = [
  {
    id: "buffett-opinion",
    label: "Know Buffett's opinion on a stock",
    description: "Get Warren Buffett's analysis of any stock",
    template: "What would Buffett think of ",
  },
  {
    id: "trade-like-buffett",
    label: "Trade like Buffett",
    description: "Build a portfolio and analyze it through Buffett's lens",
  },
];

const EXTRA_STOCKS = [
  { symbol: "JNJ", name: "Johnson & Johnson" },
  { symbol: "JPM", name: "JPMorgan Chase" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "NVDA", name: "Nvidia" },
  { symbol: "WMT", name: "Walmart" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "GOOGL", name: "Alphabet (Google)" },
  { symbol: "META", name: "Meta Platforms" },
  { symbol: "V", name: "Visa" },
  { symbol: "MA", name: "Mastercard" },
  { symbol: "PG", name: "Procter & Gamble" },
  { symbol: "DIS", name: "Walt Disney" },
  { symbol: "NFLX", name: "Netflix" },
  { symbol: "AMD", name: "AMD" },
  { symbol: "INTC", name: "Intel" },
  { symbol: "PEP", name: "PepsiCo" },
  { symbol: "UNH", name: "UnitedHealth" },
  { symbol: "HD", name: "Home Depot" },
  { symbol: "CRM", name: "Salesforce" },
];

// Deduplicated unified stock list
const seen = new Set();
export const STOCK_LIST = [...stockList, ...EXTRA_STOCKS].filter((s) => {
  if (seen.has(s.symbol)) return false;
  seen.add(s.symbol);
  return true;
});
