"""
server.py -- FastAPI wrapper around the existing RAG pipeline.

Run with:  uvicorn server:app --reload --port 8000
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from pydantic import BaseModel

@asynccontextmanager
async def lifespan(app: FastAPI):
    from retriever import get_vectorstore, get_bm25, get_reranker
    from rag_chain import get_llm
    get_vectorstore()
    get_bm25()
    get_reranker()
    get_llm()
    yield
    
app = FastAPI(title="Buffett RAG API", lifespan=lifespan)

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


@app.get("/api/stock/prices/{symbol}")
def stock_prices(symbol: str, period: str = "6mo"):
    import yfinance as yf

    df = yf.download(symbol.upper(), period=period, auto_adjust=True, progress=False)
    if df.empty:
        raise HTTPException(status_code=404, detail=f"No data for {symbol}")
    if isinstance(df.columns, __import__("pandas").MultiIndex):
        df.columns = df.columns.get_level_values(0)
    df = df[["Open", "High", "Low", "Close", "Volume"]].dropna()
    return [
        {
            "date": str(date.date()),
            "open": round(float(row["Open"]), 2),
            "high": round(float(row["High"]), 2),
            "low": round(float(row["Low"]), 2),
            "close": round(float(row["Close"]), 2),
            "volume": int(row["Volume"]),
        }
        for date, row in df.iterrows()
    ]


@app.get("/api/stock/fundamentals/{symbol}")
def stock_fundamentals(symbol: str):
    import math
    from stock_analysis import compute_ratios, passes_rule, fmt, RATIO_DEFINITIONS

    try:
        data = compute_ratios(symbol.upper())
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    info = data.get("info", {})

    metrics = []
    for name, series in data["ratios"].items():
        defn = RATIO_DEFINITIONS[name]
        try:
            raw = float(series.iloc[0]) if hasattr(series, "iloc") else float(series)
            latest = None if (math.isnan(raw) or math.isinf(raw)) else raw
        except (TypeError, ValueError):
            latest = None

        history = []
        if hasattr(series, "items"):
            for date, val in reversed(list(series.items())):
                try:
                    fval = float(val)
                    if not (math.isnan(fval) or math.isinf(fval)):
                        year = str(date.year) if hasattr(date, "year") else str(date)[:4]
                        history.append({"year": year, "value": round(fval, 4)})
                except (TypeError, ValueError):
                    pass

        status_bool = passes_rule(name, latest) if latest is not None else None
        metrics.append({
            "name": name,
            "value": latest,
            "formatted": fmt(name, latest) if latest is not None else "N/A",
            "status": "pass" if status_bool is True else "fail" if status_bool is False else "info",
            "rule": defn["rule"],
            "logic": defn["logic"],
            "group": defn["group"],
            "history": history,
        })

    def df_to_table(df):
        if df is None or df.empty:
            return {"columns": [], "rows": []}
        cols = [str(c.date()) if hasattr(c, "date") else str(c) for c in df.columns]
        rows = []
        for idx, row in df.iterrows():
            row_data = {"name": str(idx)}
            for col_ts in df.columns:
                key = str(col_ts.date()) if hasattr(col_ts, "date") else str(col_ts)
                try:
                    fval = float(row[col_ts])
                    row_data[key] = None if (math.isnan(fval) or math.isinf(fval)) else fval
                except (TypeError, ValueError):
                    row_data[key] = None
            rows.append(row_data)
        return {"columns": cols, "rows": rows}

    return {
        "symbol": data["symbol"],
        "companyName": info.get("longName", data["symbol"]),
        "currentPrice": info.get("currentPrice") or info.get("regularMarketPrice"),
        "sector": info.get("sector", ""),
        "metrics": metrics,
        "passing": sum(1 for m in metrics if m["status"] == "pass"),
        "failing": sum(1 for m in metrics if m["status"] == "fail"),
        "infoCount": sum(1 for m in metrics if m["status"] == "info"),
        "financials": df_to_table(data.get("financials")),
        "balanceSheet": df_to_table(data.get("balance_sheet")),
        "cashFlow": df_to_table(data.get("cashflow")),
    }


class BuffettTakeRequest(BaseModel):
    symbol: str
    passing: list
    failing: list


@app.post("/api/stock/buffett-take")
def buffett_take(req: BuffettTakeRequest):
    from rag_chain import ask

    passing_str = ", ".join(req.passing) if req.passing else "none"
    failing_str = ", ".join(req.failing) if req.failing else "none"
    question = (
        f"Using Warren Buffett's principles, evaluate {req.symbol}. "
        f"Criteria passed: {passing_str}. "
        f"Criteria failed: {failing_str}. "
        f"Based on these fundamentals, provide a Buffett-style assessment."
    )
    try:
        result = ask(question)
        return {"answer": result["answer"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class BuffettAnalysisRequest(BaseModel):
    symbol: str


@app.post("/api/stock/buffett-analysis")
def buffett_analysis(req: BuffettAnalysisRequest):
    """Generate a Buffett-style scorecard for a stock."""
    from stock_analysis import fetch_stock_data
    from rag_chain import ask

    stock_data = fetch_stock_data(req.symbol)
    if not stock_data:
        return {"error": f"Could not fetch data for {req.symbol}"}

    scorecard = []
    roe = stock_data.get("roe")
    if roe is not None:
        score = "pass" if roe > 0.15 else ("caution" if roe > 0.10 else "fail")
        scorecard.append({"metric": "Return on Equity", "value": f"{roe * 100:.1f}%", "threshold": "> 15%", "score": score, "reason": "Buffett seeks companies that earn high returns on shareholder equity."})

    dte = stock_data.get("debt_to_equity")
    if dte is not None:
        score = "pass" if dte < 50 else ("caution" if dte < 100 else "fail")
        scorecard.append({"metric": "Debt / Equity", "value": f"{dte:.1f}", "threshold": "< 50", "score": score, "reason": "Low debt means the company can weather downturns."})

    margin = stock_data.get("profit_margins")
    if margin is not None:
        score = "pass" if margin > 0.20 else ("caution" if margin > 0.10 else "fail")
        scorecard.append({"metric": "Profit Margin", "value": f"{margin * 100:.1f}%", "threshold": "> 20%", "score": score, "reason": "High margins indicate pricing power and an economic moat."})

    pe = stock_data.get("trailing_pe")
    if pe is not None:
        score = "pass" if pe < 20 else ("caution" if pe < 30 else "fail")
        scorecard.append({"metric": "P/E Ratio", "value": f"{pe:.1f}", "threshold": "< 20", "score": score, "reason": "Buffett looks for a margin of safety — paying a reasonable price."})

    pass_count = sum(1 for s in scorecard if s["score"] == "pass")
    total = len(scorecard)
    moat = "Wide" if pass_count >= total * 0.8 else ("Narrow" if pass_count >= total * 0.5 else "None")

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

    return ask(req.question)


class BacktestTakeRequest(BaseModel):
    symbol: str
    strategyName: str
    totalReturn: float
    sharpeRatio: float
    maxDrawdown: float
    winRate: float
    numTrades: int


@app.post("/api/backtest/buffett-take")
def backtest_buffett_take(req: BacktestTakeRequest):
    from rag_chain import ask

    question = (
        f"A {req.strategyName} strategy on {req.symbol} produced: "
        f"total return {req.totalReturn * 100:.1f}%, Sharpe ratio {req.sharpeRatio:.2f}, "
        f"max drawdown {req.maxDrawdown * 100:.1f}%, win rate {req.winRate * 100:.1f}%, "
        f"{req.numTrades} trades. "
        f"From Warren Buffett's perspective, what does he think of this trading approach and results?"
    )
    try:
        result = ask(question)
        return {"answer": result["answer"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class BacktestRequest(BaseModel):
    symbol: str
    strategy: str
    startDate: str = "2018-01-01"
    endDate: Optional[str] = None
    shortWindow: int = 20
    longWindow: int = 50
    rsiPeriod: int = 14
    oversold: int = 30
    overbought: int = 70


@app.post("/api/backtest")
def backtest(req: BacktestRequest):
    from trading_backtest import run_moving_average_crossover, run_rsi_strategy

    symbol = req.symbol.strip().upper()

    if req.strategy == "ma_crossover":
        result = run_moving_average_crossover(symbol, short_window=req.shortWindow, long_window=req.longWindow, start=req.startDate, end=req.endDate)
    elif req.strategy == "rsi":
        result = run_rsi_strategy(symbol, rsi_period=req.rsiPeriod, oversold=req.oversold, overbought=req.overbought, start=req.startDate, end=req.endDate)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown strategy: {req.strategy}")

    df = result.data
    equity_curve = [
        {
            "date": df.index[i].strftime("%Y-%m-%d"),
            "equity": round(float(df["Equity_Curve"].iloc[i]), 4),
            "drawdown": round(float(df["Drawdown"].iloc[i]), 4),
        }
        for i in range(0, len(df), 5)
    ]

    trades = [
        {
            "id": i + 1,
            "type": "LONG",
            "entryDate": row["Entry_Date"].strftime("%Y-%m-%d"),
            "exitDate": row["Exit_Date"].strftime("%Y-%m-%d"),
            "entryPrice": round(float(row["Entry_Price"]), 2),
            "exitPrice": round(float(row["Exit_Price"]), 2),
            "pnl": round(float(row["PnL"]), 4),
            "shares": 100,
        }
        for i, row in result.trades.iterrows()
    ]

    price_data = [
        {"date": df.index[i].strftime("%Y-%m-%d"), "close": round(float(df["Close"].iloc[i]), 2)}
        for i in range(0, len(df), 3)
    ]

    return {
        "result": {
            "symbol": result.symbol,
            "strategyName": result.strategy_name,
            "totalReturn": round(result.total_return, 4),
            "annualizedReturn": round(result.annualized_return, 4),
            "sharpeRatio": round(result.sharpe_ratio, 4),
            "maxDrawdown": round(result.max_drawdown, 4),
            "winRate": round(result.win_rate, 4),
            "numTrades": result.num_trades,
            "startDate": df.index[0].strftime("%Y-%m-%d"),
            "endDate": df.index[-1].strftime("%Y-%m-%d"),
        },
        "equityCurve": equity_curve,
        "trades": trades,
        "priceData": price_data,
    }


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
        results[name] = {"metrics": metrics, "details": details}

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
