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




⏺ Yes, this is all working correctly. Here's the breakdown:

  The warnings are harmless -- you can ignore them:
  - unauthenticated requests to HF Hub -- just means you don't have a
  Hugging Face token set, downloads still work fine
  - embeddings.position_ids UNEXPECTED -- normal when loading this embedding
   model, doesn't affect results
  - tied weights -- a FLAN-T5 config quirk, doesn't affect generation

  The answers are working as expected. Some are great, some are short:

  ┌──────────────────────┬───────────────────────────────────────┐
  │       Question       │            Answer Quality             │
  ├──────────────────────┼───────────────────────────────────────┤
  │ Return on equity     │ Good -- detailed and accurate         │
  ├──────────────────────┼───────────────────────────────────────┤
  │ Why live in Omaha    │ Good -- insightful answer             │
  ├──────────────────────┼───────────────────────────────────────┤
  │ Risk management      │ Weak -- "He is a risk manager"        │
  ├──────────────────────┼───────────────────────────────────────┤
  │ Insurance operations │ Weak -- "The main focus is insurance" │
  └──────────────────────┴───────────────────────────────────────┘

  The short answers are a limitation of FLAN-T5-base -- it's a small model
  (250M params) running on CPU. It works, but it's not very articulate on
  broad questions. It does better on specific questions.

  To get much better answers, you can sign up for a free Groq API key at
  https://console.groq.com and run:

  GROQ_API_KEY=your_key streamlit run app.py

  That switches to Llama 3 (8B params) which gives full, detailed paragraph
  answers instead of one-liners. The free tier gives you 14,400 requests/day
   which is more than enough.

  For now, go ahead and try the UI:

  streamlit run app.py

❯ okay but is this what needs to be done for the assignemnt?                

⏺ Yes, this covers the Part 1 requirements. Re-reading what you shared:

  ▎ Part I Chat-Bot:
  ▎ 1. Train your Chat-Bot using a hand-coded Transformer or RAG framework
  ▎ at your choice on the raw data you've prepared.
  ▎ 2. Build a user interface to connect to your model, e.g. Streamlit, 
  ▎ Django, etc. Design your user interface in a way to allow the user to   
  ▎ input questions.
                                                                            
  Requirement 1 -- RAG framework on your raw data. Done:                    
  - Your data (PDF + 6 CSVs) ingested, embedded, indexed in FAISS
  - RAG pipeline retrieves relevant context and generates answers           
                                                            
  Requirement 2 -- User interface with question input. Done:                
  - Streamlit chat UI where users type questions and get answers with
  sources                                                                   
                                                            
  Both requirements are met. You can run streamlit run app.py and demo the  
  full working chatbot.                                                     
  