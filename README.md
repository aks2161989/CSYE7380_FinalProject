# Warren Buffett Knowledge Base

RAG chatbot that answers questions about Warren Buffett using Berkshire Hathaway shareholder letters and curated Q&A datasets. Built with LangChain, FAISS, FLAN-T5, and Streamlit.

## Setup

```bash
# Create virtual environment with Python 3.12
python3.12 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Build the vector index (run once, takes ~1 min)
python ingest.py

# Launch the chatbot
streamlit run app.py
```

Open http://localhost:8501 in your browser.

### Optional: Better answers with Groq

Sign up at https://console.groq.com for a free API key, then:

```bash
GROQ_API_KEY=your_key streamlit run app.py
```

This switches from local FLAN-T5 to Llama 3 for higher quality responses.

## How It Works

```
Question → Embed (MiniLM) → Search (FAISS) → Generate (FLAN-T5) → Answer + Sources
```

1. **Ingestion** (`ingest.py`): Extracts text from the PDF, chunks it, parses and deduplicates CSV Q&A pairs, embeds everything with `paraphrase-MiniLM-L6-v2`, and stores in a FAISS vector index.

2. **Query** (`rag_chain.py`): Embeds the user question, retrieves the top-5 most similar chunks, and generates an answer with FLAN-T5-base.

3. **UI** (`app.py`): Streamlit chat interface with conversation history, sample questions, and expandable source citations.

## Data

All source data lives in `data/`:

- **PDF**: Berkshire Hathaway shareholder letters (1,010 pages)
- **CSVs** (6 files, 996 unique Q&A pairs): Personal Life, Adaptability, Psychology, Risk Management, Strategy Development, Timing

## Project Structure

```
├── config.py          # All settings (paths, models, parameters)
├── ingest.py          # Data pipeline → FAISS vector index
├── rag_chain.py       # RAG retrieval + answer generation
├── app.py             # Streamlit chat UI
├── requirements.txt
└── data/              # PDF + CSV source files
```

## Tech Stack

| Component | Tool |
|-----------|------|
| Embeddings | sentence-transformers/paraphrase-MiniLM-L6-v2 |
| Vector Store | FAISS |
| Generation | FLAN-T5-base (local) / Llama 3 via Groq (optional) |
| Framework | LangChain |
| UI | Streamlit |
