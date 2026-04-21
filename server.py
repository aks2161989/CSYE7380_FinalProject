"""
server.py -- FastAPI wrapper around the existing RAG pipeline.

Run with:  uvicorn server:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Buffett RAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: str
    content: str


class QuestionRequest(BaseModel):
    question: str
    history: list[ChatMessage] = []


PORTFOLIO_TICKERS = ["AAPL", "BAC", "AXP", "KO", "CVX", "OXY", "KHC", "MCO", "DVA", "VRSN"]


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/portfolio/prices")
def portfolio_prices():
    """Fetch live prices for all portfolio holdings from Yahoo Finance."""
    import yfinance as yf

    tickers = yf.Tickers(" ".join(PORTFOLIO_TICKERS))
    prices = {}
    for symbol in PORTFOLIO_TICKERS:
        try:
            info = tickers.tickers[symbol].info
            prices[symbol] = {
                "currentPrice": info.get("currentPrice") or info.get("regularMarketPrice"),
                "change24h": info.get("regularMarketChangePercent"),
            }
        except Exception:
            prices[symbol] = None
    return prices


@app.get("/api/portfolio/activity")
def portfolio_activity():
    """Fetch latest investment activity from SEC 13F filings."""
    from sec_filings import fetch_investment_activity

    result = fetch_investment_activity()
    if result is None:
        return {"error": "Could not fetch filing data"}
    return result


class BuffettAnalysisRequest(BaseModel):
    symbol: str


@app.get("/api/stock/prices/{symbol}")
def stock_prices(symbol: str):
    """Fetch 1-year price history for a stock."""
    import yfinance as yf

    stock = yf.Ticker(symbol)
    hist = stock.history(period="1y")
    if hist.empty:
        return {"error": f"No data for {symbol}"}

    if isinstance(hist.columns, __import__("pandas").MultiIndex):
        hist.columns = hist.columns.get_level_values(0)

    data = []
    for date, row in hist.iterrows():
        data.append({
            "date": date.strftime("%Y-%m-%d"),
            "open": round(row["Open"], 2),
            "high": round(row["High"], 2),
            "low": round(row["Low"], 2),
            "close": round(row["Close"], 2),
            "volume": int(row["Volume"]),
        })
    return data


@app.get("/api/stock/fundamentals/{symbol}")
def stock_fundamentals(symbol: str):
    """Fetch live fundamentals for a stock."""
    from stock_analysis import fetch_stock_data

    data = fetch_stock_data(symbol)
    if not data:
        return {"error": f"No data for {symbol}"}
    return data


@app.post("/api/stock/backtest")
def stock_backtest(req: BuffettAnalysisRequest):
    """Run MA and RSI backtests on a stock."""
    from trading_backtest import run_moving_average_crossover, run_rsi_strategy

    results = {}
    for label, runner in [("ma", run_moving_average_crossover), ("rsi", run_rsi_strategy)]:
        try:
            r = runner(req.symbol)
            eq = r.data[["Equity_Curve", "Drawdown"]].copy()
            eq.index = eq.index.strftime("%Y-%m-%d")
            curve = [{"date": d, "equity": round(e, 4), "drawdown": round(dd, 4)}
                     for d, (e, dd) in eq.iterrows()]
            trades = []
            if not r.trades.empty:
                for _, t in r.trades.iterrows():
                    trades.append({
                        "entryDate": t["Entry_Date"].strftime("%Y-%m-%d"),
                        "exitDate": t["Exit_Date"].strftime("%Y-%m-%d"),
                        "entryPrice": round(float(t["Entry_Price"]), 2),
                        "exitPrice": round(float(t["Exit_Price"]), 2),
                        "pnl": round(float(t["PnL"]), 4),
                    })
            results[label] = {
                "result": {
                    "symbol": r.symbol,
                    "strategyName": r.strategy_name,
                    "totalReturn": round(r.total_return, 4),
                    "annualizedReturn": round(r.annualized_return, 4),
                    "sharpeRatio": round(r.sharpe_ratio, 2),
                    "maxDrawdown": round(r.max_drawdown, 4),
                    "winRate": round(r.win_rate, 4),
                    "numTrades": r.num_trades,
                    "startDate": r.data.index[0].strftime("%Y-%m-%d"),
                    "endDate": r.data.index[-1].strftime("%Y-%m-%d"),
                },
                "equityCurve": curve,
                "trades": trades,
            }
        except Exception:
            results[label] = None
    return results


@app.post("/api/stock/buffett-analysis")
def buffett_analysis(req: BuffettAnalysisRequest):
    """Generate a Buffett-style analysis for a stock."""
    from stock_analysis import fetch_stock_data
    from rag_chain import ask

    stock_data = fetch_stock_data(req.symbol)
    if not stock_data:
        return {"error": f"Could not fetch data for {req.symbol}"}

    # Buffett scorecard criteria
    scorecard = []
    roe = stock_data.get("roe")
    if roe is not None:
        score = "pass" if roe > 0.15 else ("caution" if roe > 0.10 else "fail")
        scorecard.append({
            "metric": "Return on Equity",
            "value": f"{roe * 100:.1f}%",
            "threshold": "> 15%",
            "score": score,
            "reason": "Buffett seeks companies that earn high returns on shareholder equity — a sign of durable competitive advantage.",
        })

    dte = stock_data.get("debt_to_equity")
    if dte is not None:
        score = "pass" if dte < 50 else ("caution" if dte < 100 else "fail")
        scorecard.append({
            "metric": "Debt / Equity",
            "value": f"{dte:.1f}",
            "threshold": "< 50",
            "score": score,
            "reason": "Low debt means the company can weather downturns. Buffett avoids over-leveraged businesses.",
        })

    margin = stock_data.get("profit_margins")
    if margin is not None:
        score = "pass" if margin > 0.20 else ("caution" if margin > 0.10 else "fail")
        scorecard.append({
            "metric": "Profit Margin",
            "value": f"{margin * 100:.1f}%",
            "threshold": "> 20%",
            "score": score,
            "reason": "High margins indicate pricing power and an economic moat that protects against competition.",
        })

    pe = stock_data.get("trailing_pe")
    if pe is not None:
        score = "pass" if pe < 20 else ("caution" if pe < 30 else "fail")
        scorecard.append({
            "metric": "P/E Ratio",
            "value": f"{pe:.1f}",
            "threshold": "< 20",
            "score": score,
            "reason": "Buffett looks for a margin of safety — paying a reasonable price relative to earnings.",
        })

    div = stock_data.get("dividend_yield")
    if div is not None:
        score = "pass" if div > 0.01 else "caution"
        scorecard.append({
            "metric": "Dividend Yield",
            "value": f"{div * 100:.2f}%",
            "threshold": "> 1%",
            "score": score,
            "reason": "Dividends signal management confidence and shareholder-friendly capital allocation.",
        })

    ret_5y = stock_data.get("5y_return")
    if ret_5y is not None:
        score = "pass" if ret_5y > 50 else ("caution" if ret_5y > 0 else "fail")
        scorecard.append({
            "metric": "5-Year Return",
            "value": f"{ret_5y:.1f}%",
            "threshold": "> 50%",
            "score": score,
            "reason": "Consistent long-term value creation reflects a strong underlying business.",
        })

    # Moat assessment
    pass_count = sum(1 for s in scorecard if s["score"] == "pass")
    total = len(scorecard)
    if pass_count >= total * 0.8:
        moat = "Wide"
    elif pass_count >= total * 0.5:
        moat = "Narrow"
    else:
        moat = "None"

    # Get Buffett's principles from RAG
    rag_result = ask(f"What would Buffett think of {req.symbol} stock?")

    return {
        "stock_data": stock_data,
        "scorecard": scorecard,
        "moat": moat,
        "passCount": pass_count,
        "totalCriteria": total,
        "verdict": rag_result.get("answer", ""),
        "sources": rag_result.get("sources", []),
    }


@app.post("/api/chat")
def chat(req: QuestionRequest):
    from rag_chain import ask

    history = [{"role": m.role, "content": m.content} for m in req.history]
    return ask(req.question, history=history)


@app.get("/api/evaluation/search-methods")
def eval_search_methods():
    """Run evaluation comparing FAISS-only, Hybrid, and Hybrid+Reranking."""
    from evaluate import evaluate_retrieval, TEST_SUITE
    from retriever import get_vectorstore, hybrid_search, retrieve

    vs = get_vectorstore()

    methods = {
        "FAISS Only": lambda q, k: vs.similarity_search(q, k=k),
        "Hybrid (BM25 + FAISS)": lambda q, k: hybrid_search(q, k=k),
        "Hybrid + Reranking": lambda q, k: retrieve(q, k_retrieve=10, k_final=k),
    }

    results = {}
    for name, fn in methods.items():
        metrics, details = evaluate_retrieval(fn)
        results[name] = {
            "metrics": metrics,
            "details": details,
        }

    return results


@app.get("/api/evaluation/chunk-sizes")
def eval_chunk_sizes():
    """Run evaluation comparing different chunking strategies."""
    from evaluate import compare_chunk_sizes

    return compare_chunk_sizes()


@app.get("/api/evaluation/test-suite")
def eval_test_suite():
    """Return the test suite used for evaluation."""
    from evaluate import TEST_SUITE

    return TEST_SUITE
