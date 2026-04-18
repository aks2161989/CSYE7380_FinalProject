export const strategies = [
  { id: "ma_crossover", name: "Moving Average Crossover", description: "Buy when short MA crosses above long MA, sell on cross below" },
  { id: "rsi", name: "RSI Mean Reversion", description: "Buy when RSI < oversold threshold, sell when RSI > overbought" },
  { id: "bollinger", name: "Bollinger Bands", description: "Buy at lower band, sell at upper band" },
];

export const mockBacktestResult = {
  symbol: "AAPL",
  strategyName: "MA Crossover (20/50)",
  totalReturn: 0.42,
  annualizedReturn: 0.068,
  sharpeRatio: 0.85,
  maxDrawdown: -0.18,
  winRate: 0.55,
  numTrades: 23,
  startDate: "2020-01-02",
  endDate: "2024-12-31",
};

// Generate equity curve
function generateEquityCurve() {
  const data = [];
  let equity = 1.0;
  let peak = 1.0;
  const start = new Date("2020-01-02");
  for (let i = 0; i < 1250; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const dailyReturn = (Math.random() - 0.48) * 0.02;
    equity *= 1 + dailyReturn;
    peak = Math.max(peak, equity);
    const drawdown = (equity - peak) / peak;

    data.push({
      date: date.toISOString().split("T")[0],
      equity: +equity.toFixed(4),
      drawdown: +drawdown.toFixed(4),
    });
  }
  return data;
}

export const mockEquityCurve = generateEquityCurve();

export const mockTrades = [
  { id: 1, entryDate: "2020-03-15", exitDate: "2020-05-22", type: "LONG", entryPrice: 178.02, exitPrice: 187.36, pnl: 0.0525, shares: 100 },
  { id: 2, entryDate: "2020-07-10", exitDate: "2020-08-14", type: "LONG", entryPrice: 195.50, exitPrice: 210.30, pnl: 0.0757, shares: 100 },
  { id: 3, entryDate: "2020-09-21", exitDate: "2020-10-12", type: "LONG", entryPrice: 214.20, exitPrice: 208.10, pnl: -0.0285, shares: 100 },
  { id: 4, entryDate: "2020-11-30", exitDate: "2021-01-15", type: "LONG", entryPrice: 220.80, exitPrice: 245.60, pnl: 0.1123, shares: 100 },
  { id: 5, entryDate: "2021-03-08", exitDate: "2021-04-22", type: "LONG", entryPrice: 238.90, exitPrice: 252.70, pnl: 0.0578, shares: 100 },
  { id: 6, entryDate: "2021-05-19", exitDate: "2021-06-03", type: "LONG", entryPrice: 258.40, exitPrice: 250.10, pnl: -0.0321, shares: 100 },
  { id: 7, entryDate: "2021-08-02", exitDate: "2021-09-17", type: "LONG", entryPrice: 262.30, exitPrice: 278.90, pnl: 0.0633, shares: 100 },
  { id: 8, entryDate: "2021-11-08", exitDate: "2022-01-05", type: "LONG", entryPrice: 285.10, exitPrice: 268.40, pnl: -0.0586, shares: 100 },
  { id: 9, entryDate: "2022-03-14", exitDate: "2022-05-20", type: "LONG", entryPrice: 244.60, exitPrice: 262.80, pnl: 0.0744, shares: 100 },
  { id: 10, entryDate: "2022-07-18", exitDate: "2022-08-31", type: "LONG", entryPrice: 254.20, exitPrice: 270.50, pnl: 0.0641, shares: 100 },
  { id: 11, entryDate: "2023-01-10", exitDate: "2023-03-05", type: "LONG", entryPrice: 230.40, exitPrice: 248.90, pnl: 0.0803, shares: 100 },
  { id: 12, entryDate: "2023-06-12", exitDate: "2023-07-28", type: "LONG", entryPrice: 275.80, exitPrice: 288.30, pnl: 0.0453, shares: 100 },
];
