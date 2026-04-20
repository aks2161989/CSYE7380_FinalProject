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


class QuestionRequest(BaseModel):
    question: str


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


@app.post("/api/chat")
def chat(req: QuestionRequest):
    from rag_chain import ask

    return ask(req.question)
