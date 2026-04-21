"""
rag_chain.py -- RAG retrieval and generation pipeline.

Features:
- Hybrid search (BM25 + FAISS) with cross-encoder reranking
- Conversation memory for follow-up questions
- Stock analysis with live data + backtesting
- FLAN-T5 (local) or Groq Llama 3 generation
"""

import os

from dotenv import load_dotenv
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

from config import VECTORSTORE_DIR, EMBEDDING_MODEL, LOCAL_MODEL, GROQ_MODEL, TOP_K
from retriever import retrieve, get_vectorstore, get_reranker
from stock_analysis import is_stock_query, extract_ticker, fetch_stock_data, format_stock_summary

load_dotenv()

# Module-level singletons
_model = None
_tokenizer = None
_groq_client = None


def get_llm():
    """Load the generation model (cached after first call)."""
    global _model, _tokenizer, _groq_client
    if _model is None and _groq_client is None:
        groq_key = os.environ.get("GROQ_API_KEY")
        if groq_key:
            from groq import Groq
            _groq_client = Groq(api_key=groq_key)
            print(f"Using Groq {GROQ_MODEL} for generation")
        else:
            print(f"Loading {LOCAL_MODEL} (this may take a moment on first run)...")
            _tokenizer = AutoTokenizer.from_pretrained(LOCAL_MODEL)
            _model = AutoModelForSeq2SeqLM.from_pretrained(LOCAL_MODEL)
            print(f"Loaded {LOCAL_MODEL}")
    return _model, _tokenizer, _groq_client


def build_context(docs):
    """Build structured context string from retrieved documents."""
    context_parts = []
    for i, doc in enumerate(docs, start=1):
        meta = doc.metadata
        source = meta.get("source", "unknown")
        page = meta.get("page")
        header = f"[Context {i}] Source: {source}"
        if page is not None:
            header += f" (page {page + 1})"
        context_parts.append(f"{header}\n{doc.page_content}")
    return "\n\n".join(context_parts)


def format_chat_history(history):
    """Format conversation history for the prompt."""
    if not history:
        return ""
    lines = []
    for msg in history[-4:]:  # last 4 messages (2 turns)
        role = "User" if msg["role"] == "user" else "Assistant"
        lines.append(f"{role}: {msg['content']}")
    return "\n".join(lines)


def build_groq_prompt(question, context, chat_history=""):
    """Build the detailed prompt for Groq."""
    history_block = ""
    if chat_history:
        history_block = f"""
Previous conversation:
{chat_history}

"""
    return f"""You are a Warren Buffett trader/investor chatbot built from team-prepared study material.
Answer the user's question using ONLY the retrieved context below.
{history_block}Rules:
- Do not mention "Context 1", "Context 2", or similar references.
- Do not say "according to the context".
- Give a direct, natural answer.
- Prefer 2-4 sentences.
- Be specific when the dataset supports specifics.
- If this is a follow-up question, use the conversation history to understand what the user is referring to.
- If the question asks how Buffett adapted or evolved, prioritize concrete historical changes in his strategy (e.g., shift from buying cheap stocks to high-quality businesses) if present in the context.
- Avoid vague summaries like "he learned from experience" unless no more specific answer is available.
- If the answer is not clearly supported by the retrieved material, say:
  "I don't have enough grounded information in the dataset to answer that confidently."

Retrieved Context:
{context}

User Question:
{question}"""


def build_stock_groq_prompt(question, context, stock_summary):
    """Build a prompt that combines stock data, backtest results, and Buffett's principles."""
    return f"""You are a Warren Buffett-style investment analyst. The user is asking about a specific stock.
You have three sources of information:
1. Real financial data and backtest results for the stock (below)
2. Warren Buffett's investment principles retrieved from shareholder letters and Q&A datasets

Analyze the stock using Buffett's principles. Be specific about the numbers.

Rules:
- Reference actual metrics (P/E, ROE, debt, margins) from the stock data.
- If backtest results are available, mention how trading strategies (MA crossover, RSI) performed on this stock -- this shows the stock's historical trading behavior.
- Apply Buffett's known criteria: margin of safety, economic moat, return on equity, low debt, consistent earnings, competent management.
- Give a clear assessment: would Buffett likely be interested or not, and why.
- Be honest about limitations -- you cannot predict the future and backtests reflect past performance only.
- Keep it to 5-8 sentences.

Stock Data & Backtest Results:
{stock_summary}

Buffett's Investment Principles (from dataset):
{context}

User Question:
{question}"""


def build_stock_local_prompt(question, context, stock_summary):
    """Build a shorter stock analysis prompt for FLAN-T5."""
    return (
        "Analyze this stock using Warren Buffett's investment principles.\n\n"
        f"Stock Data:\n{stock_summary}\n\n"
        f"Buffett's Principles:\n{context}\n\n"
        f"Question: {question}\n\n"
        "Analysis:"
    )


def build_local_prompt(question, context):
    """Build a shorter prompt for FLAN-T5 (512-token input limit)."""
    return (
        "Use the following context to give a detailed answer to the question. "
        "If the answer is not in the context, say so.\n\n"
        f"Context:\n{context}\n\n"
        f"Question: {question}\n\n"
        "Detailed answer:"
    )


def ask(question, history=None):
    """
    Retrieve relevant chunks and generate an answer.
    Uses hybrid search (BM25 + FAISS) with cross-encoder reranking.
    Supports conversation memory via the history parameter.

    Args:
        question: The user's question
        history: List of {"role": "user"|"assistant", "content": str} dicts

    Returns:
        dict with keys:
            - "answer": the generated answer string
            - "sources": list of dicts with "content", "source", "page" keys
            - "stock_data": dict of stock metrics (only if stock query)
    """
    model, tokenizer, groq_client = get_llm()

    # Check if this is a stock analysis query
    stock_data = None
    stock_summary = None
    if is_stock_query(question):
        ticker = extract_ticker(question)
        if ticker:
            stock_data = fetch_stock_data(ticker)
            if stock_data:
                stock_summary = format_stock_summary(stock_data)

    # Retrieve with hybrid search + reranking
    if stock_data:
        search_query = "investment criteria value investing margin of safety return on equity"
    else:
        # For follow-ups, enrich the query with context from history
        search_query = question
        if history:
            last_assistant = [m for m in history if m["role"] == "assistant"]
            if last_assistant and len(question.split()) < 8:
                # Short question likely a follow-up, add context
                search_query = f"{last_assistant[-1]['content'][:200]} {question}"

    docs = retrieve(search_query, k_retrieve=10, k_final=TOP_K)
    context = build_context(docs)

    # Format chat history for conversation memory
    chat_history = format_chat_history(history) if history else ""

    # Generate answer
    if groq_client is not None:
        if stock_data and stock_summary:
            prompt = build_stock_groq_prompt(question, context, stock_summary)
        else:
            prompt = build_groq_prompt(question, context, chat_history)
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
        )
        answer = response.choices[0].message.content.strip()
    else:
        # Local FLAN-T5: use top 3 docs only, truncate to 512 tokens
        short_context = build_context(docs[:3])
        if stock_data and stock_summary:
            prompt = build_stock_local_prompt(question, short_context, stock_summary)
        else:
            prompt = build_local_prompt(question, short_context)
        inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512)
        outputs = model.generate(**inputs, max_new_tokens=256)
        answer = tokenizer.decode(outputs[0], skip_special_tokens=True).strip()

    # Format sources for display
    sources = []
    if stock_data:
        sources.append({
            "content": stock_summary,
            "source": "yahoo_finance",
            "page": None,
        })
    for doc in docs:
        sources.append({
            "content": doc.page_content,
            "source": doc.metadata.get("source", "unknown"),
            "page": doc.metadata.get("page"),
        })

    result = {"answer": answer, "sources": sources}
    if stock_data:
        result["stock_data"] = stock_data
    return result


if __name__ == "__main__":
    test_questions = [
        "What is Buffett's view on return on equity?",
        "Why does Buffett still live in Omaha?",
        "How does Buffett approach risk management?",
        "Tell me about Berkshire's insurance operations.",
    ]
    for q in test_questions:
        print(f"\nQ: {q}")
        result = ask(q)
        print(f"A: {result['answer']}")
        print(f"Sources: {[s['source'] for s in result['sources']]}")
