# Warren Buffett Intelligence Hub

RAG chatbot and stock analysis platform that answers questions about Warren Buffett using shareholder letters and curated Q&A datasets. Ask about Buffett's philosophy, or ask what he'd think of any stock -- it fetches live financial data, runs backtests, and applies Buffett's principles.

## Setup

### 1. Backend

```bash
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python ingest.py        # builds FAISS + BM25 indexes (~1 min)
```

### 2. Frontend

```bash
cd ui
npm install
```

### 3. Groq API Key (recommended)

Create a `.env` file in the project root:

```
GROQ_API_KEY=your_key_here
```

Free key at https://console.groq.com. Switches from local FLAN-T5 to Llama 3.3-70B for much better answers.

## Running

**Terminal 1 -- Backend:**
```bash
source venv/bin/activate
uvicorn server:app --reload --port 8000
```

**Terminal 2 -- Frontend:**
```bash
cd ui
npm run dev
```

Open http://localhost:5173.

**Streamlit UI** (alternative, no frontend needed):
```bash
streamlit run app.py
```

## How It Works

```
Question → Embed (MiniLM) → Hybrid Search (BM25 + FAISS) → Cross-Encoder Reranking → Generate (FLAN-T5 or Llama 3) → Answer + Sources
```

1. **Ingestion** (`ingest.py`): Extracts text from the PDF, chunks it (1000 chars, 200 overlap), parses and deduplicates CSV Q&A pairs, embeds everything with `paraphrase-MiniLM-L6-v2`, and stores in both a FAISS vector index and a BM25 keyword index.

2. **Retrieval** (`retriever.py`): Runs FAISS semantic search and BM25 keyword search in parallel, merges results via Reciprocal Rank Fusion (RRF), then reranks the top 10 candidates down to 5 using a cross-encoder (`ms-marco-MiniLM-L-6-v2`). Supports conversation memory -- short follow-up questions are enriched with prior context.

3. **Generation** (`rag_chain.py`): Feeds retrieved context into the LLM prompt and generates an answer. Uses Groq Llama 3.3-70B if API key is set, otherwise falls back to local FLAN-T5-base on CPU.

4. **Stock Analysis** (`stock_analysis.py` + `trading_backtest.py`): When a user asks about a specific stock (e.g. "What would Buffett think of AAPL?"), fetches live financial data from Yahoo Finance (P/E, ROE, debt, margins), runs backtests (MA Crossover 20/50, RSI 30/70) on historical data since 2018, retrieves Buffett's principles from the RAG knowledge base, and generates a combined analysis.

5. **API** (`server.py`): FastAPI backend exposing `POST /api/chat`, stock analysis endpoints, and evaluation endpoints. Called by the React frontend.

6. **UI** (`ui/`): React + Tailwind dark-themed frontend with four pages -- portfolio overview, RAG chatbot, stock trading/backtesting, and RAG evaluation dashboard.

7. **Evaluation** (`evaluate.py`): Benchmarks the retrieval pipeline with 15 test questions across difficulty levels. Compares FAISS-only vs Hybrid vs Hybrid+Reranking, and tests 5 chunking strategies (500-2000 chars). Metrics: Source Hit Rate, Keyword Hit Rate, Mean Reciprocal Rank. Run with `python evaluate.py`.

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Portfolio | `/` | Berkshire Hathaway holdings with sector allocation chart |
| Chat | `/chat` | RAG chatbot with conversation history, sources, stock analysis |
| Trading | `/trading` | Fundamental analysis (12 Buffett ratios) + strategy backtesting |

## Data

In `data/`:

- **PDF**: All Berkshire Hathaway shareholder letters (1,010 pages)
- **CSVs** (7 files, 5,992 unique Q&A pairs): Personal Life, Adaptability, Psychology, Risk Management, Strategy Development, Timing, and an aggregated investment dataset

## Project Structure

```
├── config.py              # All settings (paths, models, parameters)
├── ingest.py              # Data pipeline → FAISS + BM25 indexes
├── retriever.py           # Hybrid search (BM25+FAISS) + cross-encoder reranking
├── rag_chain.py           # RAG orchestration + LLM generation + conversation memory
├── stock_analysis.py      # Live stock data + Buffett ratio analysis
├── trading_backtest.py    # MA crossover + RSI backtesting strategies
├── evaluate.py            # RAG evaluation + chunking comparison
├── server.py              # FastAPI backend
├── app.py                 # Streamlit UI (standalone alternative)
├── requirements.txt
├── .env.example
├── architecture.md        # Mermaid diagrams of system architecture
├── data/                  # PDF + CSV source files
├── vectorstore/           # FAISS + BM25 indexes (generated, gitignored)
└── ui/                    # React + Vite + Tailwind frontend
    ├── src/pages/         # Portfolio, Chat, Trading pages
    ├── src/components/    # Reusable UI components
    └── src/services/      # API client
```

## Tech Stack

| Component | Tool |
|-----------|------|
| Embeddings | paraphrase-MiniLM-L6-v2 |
| Vector Store | FAISS + BM25 (hybrid) |
| Reranking | cross-encoder/ms-marco-MiniLM-L-6-v2 |
| Generation | FLAN-T5-base (local) / Llama 3.3-70B via Groq |
| Framework | LangChain |
| Stock Data | Yahoo Finance (yfinance) |
| Backtesting | Custom (MA Crossover, RSI) |
| Backend | FastAPI + Uvicorn |
| Frontend | React + Vite + Tailwind CSS |
| Evaluation | Custom benchmark suite (10 questions, 3 metrics) | 
