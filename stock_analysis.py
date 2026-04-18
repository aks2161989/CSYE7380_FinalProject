"""
stock_analysis.py -- Fetch stock data and generate Buffett-style analysis.

Uses yfinance for real market data and combines it with RAG-retrieved
Buffett principles to produce an investment analysis.
"""

import re
import yfinance as yf
from trading_backtest import backtest_summary


# Common stock name-to-ticker mappings for natural language queries
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


def extract_ticker(query):
    """Try to extract a stock ticker or company name from a user query."""
    query_lower = query.lower()

    # Check for explicit ticker patterns (e.g., "$AAPL", "AAPL stock")
    ticker_match = re.search(r'\$([A-Z]{1,5})\b', query)
    if ticker_match:
        return ticker_match.group(1)

    # Check for "ticker AAPL" or uppercase 1-5 letter words that look like tickers
    ticker_match = re.search(r'\b([A-Z]{1,5})\b', query)
    if ticker_match:
        candidate = ticker_match.group(1)
        # Filter out common English words
        skip = {"I", "A", "THE", "AND", "FOR", "HOW", "WHAT", "WHY", "WHO", "IS", "IT",
                "OF", "ON", "IN", "TO", "DO", "BE", "HE", "OR", "AN", "AT", "IF", "SO",
                "NO", "MY", "UP", "BY", "AM", "AS", "WE", "US"}
        if candidate not in skip:
            return candidate

    # Check for company name aliases
    for name, ticker in TICKER_ALIASES.items():
        if name in query_lower:
            return ticker

    return None


def is_stock_query(query):
    """Detect if the user is asking about a specific stock."""
    query_lower = query.lower()
    stock_keywords = [
        "stock", "invest in", "buy", "sell", "think of", "think about",
        "analysis", "analyze", "would buffett", "buffett think",
        "backtest", "worth buying", "good investment", "what about",
    ]
    has_keyword = any(kw in query_lower for kw in stock_keywords)
    has_ticker = extract_ticker(query) is not None
    return has_keyword and has_ticker


def fetch_stock_data(ticker):
    """Fetch key financial metrics for a stock ticker."""
    try:
        stock = yf.Ticker(ticker)
        info = stock.info

        if not info.get("longName"):
            return None

        # Get historical price data for simple backtest
        hist = stock.history(period="1y")
        price_1y_ago = hist["Close"].iloc[0] if len(hist) > 0 else None
        price_now = info.get("currentPrice")
        yearly_return = None
        if price_1y_ago and price_now:
            yearly_return = ((price_now - price_1y_ago) / price_1y_ago) * 100

        # Get 5-year history for longer-term view
        hist_5y = stock.history(period="5y")
        price_5y_ago = hist_5y["Close"].iloc[0] if len(hist_5y) > 0 else None
        five_year_return = None
        if price_5y_ago and price_now:
            five_year_return = ((price_now - price_5y_ago) / price_5y_ago) * 100

        # Run backtests using trading_backtest.py
        backtest_ma = None
        backtest_rsi = None
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


def format_stock_summary(data):
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
        f"Current Price: ${data['current_price']:.2f}" if data['current_price'] else "Current Price: N/A",
        f"Market Cap: {fmt_money(data['market_cap'])}",
        f"Trailing P/E: {data['trailing_pe']:.1f}" if data['trailing_pe'] else "Trailing P/E: N/A",
        f"Forward P/E: {data['forward_pe']:.1f}" if data['forward_pe'] else "Forward P/E: N/A",
        f"Return on Equity: {fmt_pct(data['roe'] * 100 if data['roe'] else None)}",
        f"Debt-to-Equity: {data['debt_to_equity']:.1f}" if data['debt_to_equity'] else "Debt-to-Equity: N/A",
        f"Profit Margin: {fmt_pct(data['profit_margins'] * 100 if data['profit_margins'] else None)}",
        f"Dividend Yield: {fmt_pct(data['dividend_yield'] * 100 if data['dividend_yield'] else None)}",
        f"52-Week Range: ${data['52w_low']:.2f} - ${data['52w_high']:.2f}" if data['52w_low'] and data['52w_high'] else "52-Week Range: N/A",
        f"1-Year Return: {fmt_pct(data['1y_return'])}",
        f"5-Year Return: {fmt_pct(data['5y_return'])}",
    ]

    # Add backtest results
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


if __name__ == "__main__":
    # Quick test
    for query in [
        "What would Buffett think of AAPL?",
        "Should I invest in Tesla stock?",
        "Analyze Microsoft",
        "How is the weather today?",
    ]:
        ticker = extract_ticker(query)
        is_stock = is_stock_query(query)
        print(f"Query: {query}")
        print(f"  Ticker: {ticker}, Is stock query: {is_stock}")
        if is_stock and ticker:
            data = fetch_stock_data(ticker)
            if data:
                print(f"  {data['name']}: P/E={data['trailing_pe']}, ROE={data['roe']}")
        print()
