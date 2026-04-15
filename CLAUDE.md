# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
source venv/bin/activate          # Python 3.12 venv
pip install -r requirements.txt   # install deps
python ingest.py                  # build FAISS index (run once)
python rag_chain.py               # test RAG pipeline standalone
streamlit run app.py              # launch UI at localhost:8501
```

## Architecture

RAG chatbot: embed question, search FAISS for similar chunks, generate answer with FLAN-T5.

Two-phase data flow:

1. **Offline** (`ingest.py`): PDF chunked (1000 chars, 200 overlap), CSV Q&A pairs deduplicated and combined as `"Question: ...\nAnswer: ..."`, all embedded with MiniLM-L6-v2, stored in FAISS under `vectorstore/`.

2. **Online** (`rag_chain.py`): `ask()` retrieves top-5 docs, feeds top-3 into prompt, generates via FLAN-T5-base (or Groq Llama 3 if `GROQ_API_KEY` is set). Returns answer + source metadata.

Key details:
- All config in `config.py` -- no hardcoded values elsewhere
- `rag_chain.py` uses module-level singletons; `app.py` uses `@st.cache_resource` -- models load once
- Prompt truncated to 512 tokens for FLAN-T5 input limit
- `vectorstore/` is gitignored -- regenerate with `python ingest.py`

## Data

In `data/`: 1 PDF (1,010 pages, shareholder letters) + 6 CSVs (996 Q&A pairs). All CSVs have schema: `Questions, Answers, Label`.
