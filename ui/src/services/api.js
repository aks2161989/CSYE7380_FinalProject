export async function sendMessage(question) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchPortfolioPrices() {
  const res = await fetch("/api/portfolio/prices");
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchInvestmentActivity() {
  const res = await fetch("/api/portfolio/activity");
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchStockPrices(symbol) {
  const res = await fetch(`/api/stock/prices/${symbol}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchStockFundamentals(symbol) {
  const res = await fetch(`/api/stock/fundamentals/${symbol}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function runBacktest(symbol) {
  const res = await fetch("/api/stock/backtest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchBuffettAnalysis(symbol) {
  const res = await fetch("/api/stock/buffett-analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
