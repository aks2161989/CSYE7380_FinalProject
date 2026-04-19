"""Warren Buffett financial ratio analysis and stock query helpers using yfinance."""

from __future__ import annotations

import re
import numpy as np
import pandas as pd
import yfinance as yf
from typing import Optional

from trading_backtest import backtest_summary


# ── Buffett ratio definitions ─────────────────────────────────────────────────

RATIO_DEFINITIONS: dict[str, dict] = {
    "Gross Margin": {
        "threshold": 0.40, "direction": "above", "rule": "≥ 40%",
        "logic": "Signals the company isn't competing on price.",
        "format": "pct", "group": "Income Statement",
    },
    "SG&A Expense Margin": {
        "threshold": 0.30, "direction": "below", "rule": "≤ 30%",
        "logic": "Wide-moat companies don't need to spend a lot on overhead to operate.",
        "format": "pct", "group": "Income Statement",
    },
    "R&D Expense Margin": {
        "threshold": 0.30, "direction": "below", "rule": "≤ 30%",
        "logic": "R&D expenses don't always create value for shareholders.",
        "format": "pct", "group": "Income Statement",
    },
    "Depreciation Margin": {
        "threshold": 0.10, "direction": "below", "rule": "≤ 10%",
        "logic": "Buffett doesn't like businesses that need depreciating assets to maintain their competitive advantage.",
        "format": "pct", "group": "Income Statement",
    },
    "Interest Expense Margin": {
        "threshold": 0.15, "direction": "below", "rule": "≤ 15%",
        "logic": "Great businesses don't need debt to finance themselves.",
        "format": "pct", "group": "Income Statement",
    },
    "Income Tax Rate": {
        "threshold": None, "direction": "info", "rule": "≈ 21% (Corp Rate)",
        "logic": "Great businesses are so profitable that they pay their full tax load.",
        "format": "pct", "group": "Income Statement",
    },
    "Net Profit Margin": {
        "threshold": 0.20, "direction": "above", "rule": "≥ 20%",
        "logic": "Great companies convert 20% or more of their revenue into net income.",
        "format": "pct", "group": "Income Statement",
    },
    "EPS Growth": {
        "threshold": 1.0, "direction": "above", "rule": "> 1.0x (growing YoY)",
        "logic": "Great companies increase profits every year.",
        "format": "ratio", "group": "Income Statement",
    },
    "Cash > Debt Ratio": {
        "threshold": 1.0, "direction": "above", "rule": "> 1.0x",
        "logic": "Great companies generate lots of cash without needing much debt.",
        "format": "ratio", "group": "Balance Sheet",
    },
    "Adjusted Debt to Equity": {
        "threshold": 0.80, "direction": "below", "rule": "< 0.80x",
        "logic": "Great companies finance themselves with equity.",
        "format": "ratio", "group": "Balance Sheet",
    },
    "CapEx Margin": {
        "threshold": 0.25, "direction": "below", "rule": "< 25%",
        "logic": "Great companies don't need much equipment to generate profits.",
        "format": "pct", "group": "Cash Flow",
    },
}


def passes_rule(ratio_name: str, value: float) -> Optional[bool]:
    """True = pass, False = fail, None = informational only."""
    defn = RATIO_DEFINITIONS.get(ratio_name)
    if defn is None or defn["direction"] == "info" or pd.isna(value):
        return None
    return value >= defn["threshold"] if defn["direction"] == "above" else value <= defn["threshold"]


def fmt(ratio_name: str, value: float) -> str:
    if pd.isna(value):
        return "N/A"
    defn = RATIO_DEFINITIONS.get(ratio_name, {})
    return f"{value:.1%}" if defn.get("format") == "pct" else f"{value:.2f}x"


def _get_row(df: pd.DataFrame, *names: str) -> Optional[pd.Series]:
    for name in names:
        if name in df.index:
            return df.loc[name]
    return None


def compute_ratios(symbol: str) -> dict:
    """Fetch yfinance data and compute all Buffett financial ratios."""
    ticker = yf.Ticker(symbol.upper().strip())
    fin = ticker.financials
    bs = ticker.balancesheet
    cf = ticker.cashflow

    if fin is None or fin.empty:
        raise ValueError(f"No financial data for {symbol.upper()!r}. Check the ticker symbol.")

    ratios: dict[str, Optional[pd.Series]] = {}

    # Income Statement
    gross_profit  = _get_row(fin, "Gross Profit")
    total_revenue = _get_row(fin, "Total Revenue")
    sga           = _get_row(fin, "Selling General And Administration", "Selling General Administrative")
    rnd           = _get_row(fin, "Research And Development")
    depr          = _get_row(fin, "Reconciled Depreciation", "Depreciation And Amortization In Income Statement")
    interest_exp  = _get_row(fin, "Interest Expense", "Interest Expense Non Operating")
    operating_inc = _get_row(fin, "Operating Income")
    tax_prov      = _get_row(fin, "Tax Provision")
    pretax_inc    = _get_row(fin, "Pretax Income")
    net_income    = _get_row(fin, "Net Income")
    basic_eps     = _get_row(fin, "Basic EPS")

    if gross_profit is not None and total_revenue is not None:
        ratios["Gross Margin"] = gross_profit / total_revenue

    if sga is not None and gross_profit is not None:
        ratios["SG&A Expense Margin"] = sga / gross_profit

    if rnd is not None and gross_profit is not None:
        ratios["R&D Expense Margin"] = rnd / gross_profit

    if depr is not None and gross_profit is not None:
        ratios["Depreciation Margin"] = depr / gross_profit

    if interest_exp is not None and operating_inc is not None:
        ratios["Interest Expense Margin"] = interest_exp / operating_inc

    if tax_prov is not None and pretax_inc is not None:
        ratios["Income Tax Rate"] = tax_prov / pretax_inc

    if net_income is not None and total_revenue is not None:
        ratios["Net Profit Margin"] = net_income / total_revenue

    if basic_eps is not None and len(basic_eps) >= 2:
        vals = []
        for i in range(len(basic_eps)):
            if i < len(basic_eps) - 1 and basic_eps.iloc[i + 1] != 0:
                vals.append(basic_eps.iloc[i] / basic_eps.iloc[i + 1])
            else:
                vals.append(np.nan)
        ratios["EPS Growth"] = pd.Series(vals, index=basic_eps.index)

    # Balance Sheet
    cash         = _get_row(bs, "Cash And Cash Equivalents", "Cash Equivalents")
    current_debt = _get_row(bs, "Current Debt", "Short Long Term Debt", "Current Debt And Capital Lease Obligation")
    total_debt   = _get_row(bs, "Total Debt")
    total_assets = _get_row(bs, "Total Assets")

    if cash is not None and current_debt is not None:
        ratios["Cash > Debt Ratio"] = cash / current_debt.replace(0, np.nan)

    if total_debt is not None and total_assets is not None:
        denom = (total_assets - total_debt).replace(0, np.nan)
        ratios["Adjusted Debt to Equity"] = total_debt / denom

    # Cash Flow
    capex      = _get_row(cf, "Capital Expenditure", "Capital Expenditures", "Purchase Of Property Plant And Equipment")
    net_inc_cf = _get_row(cf, "Net Income From Continuing Operations", "Net Income")

    if capex is not None and net_inc_cf is not None:
        ratios["CapEx Margin"] = -capex / net_inc_cf.replace(0, np.nan)

    return {
        "symbol": symbol.upper().strip(),
        "ratios": ratios,
        "financials": fin,
        "balance_sheet": bs,
        "cashflow": cf,
        "info": ticker.info,
    }


# ── Natural-language stock query helpers ─────────────────────────────────────

TICKER_ALIASES = {
    "apple": "AAPL", "microsoft": "MSFT", "google": "GOOGL", "alphabet": "GOOGL",
    "amazon": "AMZN", "tesla": "TSLA", "meta": "META", "facebook": "META",
    "netflix": "NFLX", "nvidia": "NVDA", "berkshire": "BRK-B", "coca-cola": "KO",
    "coke": "KO", "disney": "DIS", "nike": "NKE", "walmart": "WMT",
    "jpmorgan": "JPM", "visa": "V", "mastercard": "MA", "johnson": "JNJ",
    "procter": "PG", "exxon": "XOM", "chevron": "CVX", "pfizer": "PFE",
    "intel": "INTC", "amd": "AMD", "boeing": "BA", "goldman": "GS",
    "costco": "COST", "starbucks": "SBUX", "paypal": "PYPL", "uber": "UBER",
    "airbnb": "ABNB", "snowflake": "SNOW", "salesforce": "CRM", "oracle": "ORCL",
    "ibm": "IBM", "spotify": "SPOT", "snap": "SNAP", "twitter": "X",
}

_COMMON_WORDS = {
    "I", "A", "THE", "AND", "FOR", "HOW", "WHAT", "WHY", "WHO", "IS", "IT",
    "OF", "ON", "IN", "TO", "DO", "BE", "HE", "OR", "AN", "AT", "IF", "SO",
    "NO", "MY", "UP", "BY", "AM", "AS", "WE", "US",
}


def extract_ticker(query: str) -> Optional[str]:
    """Try to extract a stock ticker or company name from a user query."""
    # Explicit $AAPL pattern
    m = re.search(r'\$([A-Z]{1,5})\b', query)
    if m:
        return m.group(1)

    # Bare uppercase word that looks like a ticker
    m = re.search(r'\b([A-Z]{1,5})\b', query)
    if m and m.group(1) not in _COMMON_WORDS:
        return m.group(1)

    # Company name aliases
    query_lower = query.lower()
    for name, ticker in TICKER_ALIASES.items():
        if name in query_lower:
            return ticker

    return None


def is_stock_query(query: str) -> bool:
    """Return True if the query is about a specific stock."""
    stock_keywords = [
        "stock", "invest in", "buy", "sell", "think of", "think about",
        "analysis", "analyze", "would buffett", "buffett think",
        "backtest", "worth buying", "good investment", "what about",
    ]
    query_lower = query.lower()
    return any(kw in query_lower for kw in stock_keywords) and extract_ticker(query) is not None


def fetch_stock_data(ticker: str) -> Optional[dict]:
    """Fetch key financial metrics for a stock ticker."""
    try:
        stock = yf.Ticker(ticker)
        info = stock.info

        if not info.get("longName"):
            return None

        hist = stock.history(period="1y")
        price_now = info.get("currentPrice")
        price_1y_ago = hist["Close"].iloc[0] if len(hist) > 0 else None
        yearly_return = ((price_now - price_1y_ago) / price_1y_ago * 100
                         if price_1y_ago and price_now else None)

        hist_5y = stock.history(period="5y")
        price_5y_ago = hist_5y["Close"].iloc[0] if len(hist_5y) > 0 else None
        five_year_return = ((price_now - price_5y_ago) / price_5y_ago * 100
                            if price_5y_ago and price_now else None)

        backtest_ma = backtest_rsi = None
        try:
            backtest_ma = backtest_summary(ticker, strategy="ma")
            backtest_rsi = backtest_summary(ticker, strategy="rsi")
        except Exception:
            pass

        return {
            "name": info.get("longName", ticker),
            "ticker": ticker,
            "sector": info.get("sector", "N/A"),
            "industry": info.get("industry", "N/A"),
            "current_price": price_now,
            "market_cap": info.get("marketCap"),
            "trailing_pe": info.get("trailingPE"),
            "forward_pe": info.get("forwardPE"),
            "roe": info.get("returnOnEquity"),
            "debt_to_equity": info.get("debtToEquity"),
            "profit_margins": info.get("profitMargins"),
            "dividend_yield": info.get("dividendYield"),
            "52w_high": info.get("fiftyTwoWeekHigh"),
            "52w_low": info.get("fiftyTwoWeekLow"),
            "1y_return": yearly_return,
            "5y_return": five_year_return,
            "backtest_ma": backtest_ma,
            "backtest_rsi": backtest_rsi,
        }
    except Exception:
        return None


def format_stock_summary(data: dict) -> str:
    """Format stock data into readable text for the LLM prompt."""
    if not data:
        return "Could not retrieve stock data."

    def fmt_pct(val):
        return f"{val:.1f}%" if val is not None else "N/A"

    def fmt_money(val):
        if val is None:
            return "N/A"
        if val >= 1e12:
            return f"${val/1e12:.1f}T"
        if val >= 1e9:
            return f"${val/1e9:.1f}B"
        return f"${val/1e6:.0f}M"

    lines = [
        f"Company: {data['name']} ({data['ticker']})",
        f"Sector: {data['sector']} | Industry: {data['industry']}",
        f"Current Price: ${data['current_price']:.2f}" if data["current_price"] else "Current Price: N/A",
        f"Market Cap: {fmt_money(data['market_cap'])}",
        f"Trailing P/E: {data['trailing_pe']:.1f}" if data["trailing_pe"] else "Trailing P/E: N/A",
        f"Forward P/E: {data['forward_pe']:.1f}" if data["forward_pe"] else "Forward P/E: N/A",
        f"Return on Equity: {fmt_pct(data['roe'] * 100 if data['roe'] else None)}",
        f"Debt-to-Equity: {data['debt_to_equity']:.1f}" if data["debt_to_equity"] else "Debt-to-Equity: N/A",
        f"Profit Margin: {fmt_pct(data['profit_margins'] * 100 if data['profit_margins'] else None)}",
        f"Dividend Yield: {fmt_pct(data['dividend_yield'] * 100 if data['dividend_yield'] else None)}",
        (f"52-Week Range: ${data['52w_low']:.2f} - ${data['52w_high']:.2f}"
         if data["52w_low"] and data["52w_high"] else "52-Week Range: N/A"),
        f"1-Year Return: {fmt_pct(data['1y_return'])}",
        f"5-Year Return: {fmt_pct(data['5y_return'])}",
    ]

    bt_ma = data.get("backtest_ma")
    bt_rsi = data.get("backtest_rsi")
    if bt_ma or bt_rsi:
        lines.append("\nBacktest Results (2018-present):")
    if bt_ma:
        lines.append(
            f"  MA Crossover (20/50): Return={bt_ma['total_return']:.1%}, "
            f"Sharpe={bt_ma['sharpe_ratio']:.2f}, "
            f"Max Drawdown={bt_ma['max_drawdown']:.1%}, "
            f"Win Rate={bt_ma['win_rate']:.0%}, "
            f"Trades={bt_ma['num_trades']}"
        )
    if bt_rsi:
        lines.append(
            f"  RSI Strategy (30/70): Return={bt_rsi['total_return']:.1%}, "
            f"Sharpe={bt_rsi['sharpe_ratio']:.2f}, "
            f"Max Drawdown={bt_rsi['max_drawdown']:.1%}, "
            f"Win Rate={bt_rsi['win_rate']:.0%}, "
            f"Trades={bt_rsi['num_trades']}"
        )

    return "\n".join(lines)
