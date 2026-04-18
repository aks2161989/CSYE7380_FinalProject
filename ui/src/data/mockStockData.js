export const stockList = [
  { symbol: "BRK-B", name: "Berkshire Hathaway B" },
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "KO", name: "Coca-Cola" },
  { symbol: "BAC", name: "Bank of America" },
  { symbol: "AXP", name: "American Express" },
  { symbol: "CVX", name: "Chevron" },
  { symbol: "OXY", name: "Occidental Petroleum" },
  { symbol: "KHC", name: "Kraft Heinz" },
  { symbol: "MCO", name: "Moody's Corp." },
];

// Generate 250 days of mock price data
function generatePriceData(basePrice, volatility = 0.02) {
  const data = [];
  let price = basePrice;
  const start = new Date("2024-01-02");
  for (let i = 0; i < 250; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const change = (Math.random() - 0.48) * volatility * price;
    price = Math.max(price * 0.8, price + change);
    const high = price * (1 + Math.random() * 0.015);
    const low = price * (1 - Math.random() * 0.015);
    const open = low + Math.random() * (high - low);

    data.push({
      date: date.toISOString().split("T")[0],
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +price.toFixed(2),
      volume: Math.floor(30_000_000 + Math.random() * 40_000_000),
    });
  }
  return data;
}

export const mockPriceDataBySymbol = {
  "BRK-B": generatePriceData(360),
  AAPL: generatePriceData(185),
  KO: generatePriceData(59),
  BAC: generatePriceData(33),
  AXP: generatePriceData(190),
  CVX: generatePriceData(150),
  OXY: generatePriceData(58),
  KHC: generatePriceData(35),
  MCO: generatePriceData(380),
};

export const mockFundamentals = {
  "BRK-B": { symbol: "BRK-B", name: "Berkshire Hathaway B", price: 412.30, marketCap: "886.4B", peRatio: 10.2, eps: 40.42, dividendYield: "0.00%", week52High: 425.10, week52Low: 342.88, avgVolume: "3.8M", beta: 0.58 },
  AAPL: { symbol: "AAPL", name: "Apple Inc.", price: 198.50, marketCap: "3.05T", peRatio: 30.2, eps: 6.57, dividendYield: "0.55%", week52High: 199.62, week52Low: 164.08, avgVolume: "54.2M", beta: 1.24 },
  KO: { symbol: "KO", name: "Coca-Cola Co.", price: 62.45, marketCap: "269.8B", peRatio: 24.8, eps: 2.52, dividendYield: "3.05%", week52High: 64.99, week52Low: 52.28, avgVolume: "12.1M", beta: 0.59 },
  BAC: { symbol: "BAC", name: "Bank of America", price: 37.25, marketCap: "295.1B", peRatio: 12.4, eps: 3.00, dividendYield: "2.58%", week52High: 39.10, week52Low: 26.44, avgVolume: "38.5M", beta: 1.36 },
  AXP: { symbol: "AXP", name: "American Express", price: 225.30, marketCap: "163.2B", peRatio: 19.1, eps: 11.80, dividendYield: "1.15%", week52High: 232.44, week52Low: 154.73, avgVolume: "3.1M", beta: 1.22 },
  CVX: { symbol: "CVX", name: "Chevron Corp.", price: 161.20, marketCap: "302.5B", peRatio: 12.9, eps: 12.50, dividendYield: "3.85%", week52High: 171.70, week52Low: 139.61, avgVolume: "8.4M", beta: 1.08 },
  OXY: { symbol: "OXY", name: "Occidental Petroleum", price: 63.75, marketCap: "56.3B", peRatio: 14.5, eps: 4.40, dividendYield: "1.13%", week52High: 71.18, week52Low: 55.12, avgVolume: "10.2M", beta: 1.68 },
  KHC: { symbol: "KHC", name: "Kraft Heinz Co.", price: 36.10, marketCap: "43.8B", peRatio: 16.8, eps: 2.15, dividendYield: "4.43%", week52High: 39.56, week52Low: 30.68, avgVolume: "7.3M", beta: 0.62 },
  MCO: { symbol: "MCO", name: "Moody's Corp.", price: 412.80, marketCap: "75.2B", peRatio: 45.2, eps: 9.13, dividendYield: "0.78%", week52High: 421.00, week52Low: 324.15, avgVolume: "1.1M", beta: 1.32 },
};
