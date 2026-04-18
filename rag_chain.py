"""
rag_chain.py -- RAG retrieval and generation pipeline.

Loads the FAISS vector store, retrieves relevant chunks for a user question,
and generates an answer using FLAN-T5 (local) or Groq Llama 3 (if API key is set).
"""

import os

from dotenv import load_dotenv
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

from config import VECTORSTORE_DIR, EMBEDDING_MODEL, LOCAL_MODEL, GROQ_MODEL, TOP_K
from stock_analysis import is_stock_query, extract_ticker, fetch_stock_data, format_stock_summary

load_dotenv()

# Module-level singletons (loaded once, reused across calls)
_vectorstore = None
_model = None
_tokenizer = None
_groq_client = None


def get_vectorstore():
    """Load the FAISS vector store (cached after first call)."""
    global _vectorstore
    if _vectorstore is None:
        embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
        _vectorstore = FAISS.load_local(
            VECTORSTORE_DIR, embeddings, allow_dangerous_deserialization=True
        )
    return _vectorstore


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


def build_groq_prompt(question, context):
    """Build the detailed prompt for Groq Llama 3 (from teammate's rag_chat.py)."""
    return f"""You are a Warren Buffett trader/investor chatbot built from team-prepared study material.
Answer the user's question using ONLY the retrieved context below.

Rules:
- Do not mention "Context 1", "Context 2", or similar references.
- Do not say "according to the context".
- Give a direct, natural answer.
- Prefer 2-4 sentences.
- Be specific when the dataset supports specifics.
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


def ask(question):
    """
    Retrieve relevant chunks and generate an answer.
    If the question is about a specific stock, fetch real market data
    and analyze it through Buffett's investment principles.

    Returns:
        dict with keys:
            - "answer": the generated answer string
            - "sources": list of dicts with "content", "source", "page" keys
            - "stock_data": dict of stock metrics (only if stock query)
    """
    vectorstore = get_vectorstore()
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

    # Retrieve Buffett's principles -- use investment-focused search for stock queries
    if stock_data:
        search_query = "investment criteria value investing margin of safety return on equity"
        docs = vectorstore.similarity_search(search_query, k=TOP_K)
    else:
        docs = vectorstore.similarity_search(question, k=TOP_K)

    context = build_context(docs)

    # Generate answer
    if groq_client is not None:
        if stock_data and stock_summary:
            prompt = build_stock_groq_prompt(question, context, stock_summary)
        else:
            prompt = build_groq_prompt(question, context)
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
