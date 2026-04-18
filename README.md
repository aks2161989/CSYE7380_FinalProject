# Warren Buffett Intelligence Hub

RAG chatbot and stock analysis platform built on Berkshire Hathaway shareholder letters and curated Q&A datasets. Features a React frontend with FastAPI backend, FAISS vector search, and FLAN-T5 / Groq Llama 3 for answer generation.

## Prerequisites

- Python 3.12+
- Node.js 18+
- npm 9+

## Setup

### 1. Backend (Python)

```bash
# Clone and navigate to the project
cd CSYE7380

# Create virtual environment
python3.12 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Build the FAISS vector index (run once, takes ~1-2 min)
python ingest.py
```

### 2. Frontend (React)

```bash
cd ui
npm install
```

### 3. Optional: Better answers with Groq

Create a `.env` file in the project root:

```
GROQ_API_KEY=your_key_here
```

Sign up at https://console.groq.com for a free API key. This switches from local FLAN-T5 to Llama 3.3-70B for higher quality responses.

## Running the App

You need **two terminals** — one for the backend, one for the frontend.

**Terminal 1 — FastAPI Backend:**

```bash
source venv/bin/activate
uvicorn server:app --reload --port 8000
```

**Terminal 2 — React Frontend:**

```bash
cd ui
npm run dev
```

Open **http://localhost:5173** in your browser.

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Portfolio | `/` | Warren Buffett's current Berkshire Hathaway holdings with sector allocation chart and sortable table |
| Chat | `/chat` | RAG chatbot with conversation history sidebar, typing animation, and source citations |
| Trading | `/trading` | Stock analysis with price charts and fundamentals, plus strategy backtesting with equity curves |

## How It Works

```
Question → Embed (MiniLM) → Search (FAISS) → Generate (FLAN-T5 or Llama 3) → Answer + Sources
```

1. **Ingestion** (`ingest.py`): Extracts text from the PDF, chunks it (1000 chars, 200 overlap), parses and deduplicates CSV Q&A pairs, embeds everything with `paraphrase-MiniLM-L6-v2`, and stores in a FAISS vector index.

2. **Query** (`rag_chain.py`): Embeds the user question, retrieves the top-5 most similar chunks, and generates an answer with FLAN-T5-base (or Groq Llama 3 if API key is set).

3. **API** (`server.py`): FastAPI wrapper exposing `POST /api/chat` that calls `rag_chain.ask()`.

4. **UI** (`ui/`): React + Tailwind dark-themed frontend with three pages — portfolio overview, RAG chatbot, and stock trading/backtesting.

## Data

All source data lives in `data/`:

- **PDF**: Berkshire Hathaway shareholder letters (1,010 pages)
- **CSVs** (7 files, 996 unique Q&A pairs): Personal Life, Adaptability, Psychology, Risk Management, Strategy Development, Timing, and a clean aggregated dataset

## Project Structure

```
├── config.py            # All settings (paths, models, parameters)
├── ingest.py            # Data pipeline → FAISS vector index
├── rag_chain.py         # RAG retrieval + answer generation
├── server.py            # FastAPI backend (wraps rag_chain)
├── app.py               # Legacy Streamlit UI
├── requirements.txt     # Python dependencies
├── data/                # PDF + CSV source files
├── vectorstore/         # FAISS index (generated, gitignored)
└── ui/                  # React frontend
    ├── src/
    │   ├── pages/       # HomePage, ChatPage, TradingPage
    │   ├── components/  # Reusable UI components
    │   ├── data/        # Mock data for trading/backtest
    │   ├── services/    # API client
    │   └── utils/       # Formatters
    ├── package.json
    └── vite.config.js
```

## Tech Stack

| Component | Tool |
|-----------|------|
| Embeddings | sentence-transformers/paraphrase-MiniLM-L6-v2 |
| Vector Store | FAISS |
| Generation | FLAN-T5-base (local) / Llama 3.3-70B via Groq (optional) |
| Framework | LangChain |
| Backend | FastAPI + Uvicorn |
| Frontend | React + Vite + Tailwind CSS |
| Charts | Recharts |
