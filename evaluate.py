"""
evaluate.py -- RAG Evaluation & Chunking Strategy Comparison.

Measures retrieval precision and answer quality across a test suite.
Also compares different chunking strategies to show their impact on retrieval.

Run standalone:  python evaluate.py
"""

import time
import json
import os

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from sentence_transformers import CrossEncoder

from config import PDF_PATH, CSV_FILES, EMBEDDING_MODEL, VECTORSTORE_DIR
from retriever import retrieve, get_vectorstore, hybrid_search, get_reranker
from ingest import load_pdf, load_csvs

RESULTS_PATH = os.path.join(VECTORSTORE_DIR, "eval_results.json")

# Test suite: mix of easy, paraphrased, vague, and cross-topic questions.
# Harder questions test whether semantic search outperforms keyword search.
TEST_SUITE = [
    # --- Easy: direct keyword match ---
    {
        "question": "How did Buffett overcome his fear of public speaking?",
        "expected_source": "qa_personal_life",
        "expected_keywords": ["dale carnegie", "speaking", "course"],
    },
    {
        "question": "What happened with Berkshire's textile operations?",
        "expected_source": "shareholder_letter",
        "expected_keywords": ["textile", "berkshire"],
    },
    # --- Medium: paraphrased (no exact keyword match) ---
    {
        "question": "How does the Oracle of Omaha decide if a company is worth buying?",
        "expected_source": "qa_",
        "expected_keywords": ["intrinsic value", "margin of safety", "earnings"],
    },
    {
        "question": "What personality trait does Buffett say matters more than being smart?",
        "expected_source": "qa_",
        "expected_keywords": ["temperament", "iq", "greedy"],
    },
    {
        "question": "Why did Buffett refuse to move to Wall Street?",
        "expected_source": "qa_personal_life",
        "expected_keywords": ["omaha", "independence", "wall street"],
    },
    {
        "question": "How does Buffett feel about companies that borrow heavily?",
        "expected_source": "qa_",
        "expected_keywords": ["debt", "leverage"],
    },
    # --- Hard: vague or indirect, requires semantic understanding ---
    {
        "question": "What childhood experiences shaped Buffett's money habits?",
        "expected_source": "qa_personal_life",
        "expected_keywords": ["grocery", "gum", "coca-cola", "pinball", "entrepreneurial"],
    },
    {
        "question": "How did Berkshire's float contribute to investment returns?",
        "expected_source": "shareholder_letter",
        "expected_keywords": ["float", "insurance", "premium", "invest"],
    },
    {
        "question": "What's the difference between price and value in Buffett's mind?",
        "expected_source": "qa_",
        "expected_keywords": ["price", "value", "intrinsic", "margin"],
    },
    {
        "question": "Describe how Buffett's strategy evolved after meeting Charlie Munger.",
        "expected_source": "qa_",
        "expected_keywords": ["munger", "quality", "wonderful company", "fair price"],
    },
    # --- Cross-topic: should pull from shareholder letters, not Q&A ---
    {
        "question": "What were Berkshire's operating earnings in the late 1970s?",
        "expected_source": "shareholder_letter",
        "expected_keywords": ["operating earnings", "1977", "1978", "equity capital"],
    },
    {
        "question": "Which insurance companies did Berkshire acquire?",
        "expected_source": "shareholder_letter",
        "expected_keywords": ["national indemnity", "geico", "general re", "insurance"],
    },
    # --- Adversarial: terms that could mislead keyword search ---
    {
        "question": "Does Buffett believe in diversification?",
        "expected_source": "qa_",
        "expected_keywords": ["concentrate", "focus", "few", "outstanding"],
    },
    {
        "question": "What role does doing nothing play in Buffett's strategy?",
        "expected_source": "qa_",
        "expected_keywords": ["patience", "long-term", "hold", "inactivity"],
    },
    {
        "question": "How does Buffett think about competitive advantages?",
        "expected_source": "qa_",
        "expected_keywords": ["moat", "competitive advantage", "durable"],
    },
]


def evaluate_retrieval(search_fn, test_suite=TEST_SUITE, k=5):
    """
    Evaluate retrieval quality across a test suite.

    Metrics:
    - Source Hit Rate: % of queries where the expected source type appears in top-k
    - Keyword Hit Rate: % of queries where expected keywords appear in retrieved docs
    - Mean Reciprocal Rank (MRR): avg of 1/rank of first relevant result
    """
    source_hits = 0
    keyword_hits = 0
    reciprocal_ranks = []

    results = []

    for test in test_suite:
        q = test["question"]
        expected_src = test["expected_source"]
        expected_kw = test["expected_keywords"]

        docs = search_fn(q, k)

        # Source hit: is the expected source in any of the top-k results?
        sources = [doc.metadata.get("source", "") for doc in docs]
        source_hit = any(expected_src in s for s in sources)
        if source_hit:
            source_hits += 1

        # Find rank of first source hit
        first_rank = None
        for i, s in enumerate(sources):
            if expected_src in s:
                first_rank = i + 1
                break
        reciprocal_ranks.append(1.0 / first_rank if first_rank else 0.0)

        # Keyword hit: do any expected keywords appear in retrieved content?
        all_content = " ".join(doc.page_content.lower() for doc in docs)
        kw_found = [kw for kw in expected_kw if kw.lower() in all_content]
        keyword_hit = len(kw_found) > 0
        if keyword_hit:
            keyword_hits += 1

        results.append({
            "question": q,
            "source_hit": source_hit,
            "keyword_hit": keyword_hit,
            "keywords_found": kw_found,
            "keywords_missed": [kw for kw in expected_kw if kw.lower() not in all_content],
            "mrr": reciprocal_ranks[-1],
            "top_sources": sources[:3],
        })

    n = len(test_suite)
    metrics = {
        "source_hit_rate": source_hits / n,
        "keyword_hit_rate": keyword_hits / n,
        "mrr": sum(reciprocal_ranks) / n,
        "num_questions": n,
    }

    return metrics, results


def compare_search_methods():
    """Compare FAISS-only, BM25+FAISS hybrid, and hybrid+reranking."""
    print("Evaluating search methods...\n")

    vs = get_vectorstore()

    # Method 1: FAISS only
    def faiss_search(q, k):
        return vs.similarity_search(q, k=k)

    # Method 2: Hybrid (BM25 + FAISS)
    def hybrid_only(q, k):
        return hybrid_search(q, k=k)

    # Method 3: Hybrid + Reranking
    def hybrid_reranked(q, k):
        return retrieve(q, k_retrieve=10, k_final=k)

    methods = {
        "FAISS Only": faiss_search,
        "Hybrid (BM25 + FAISS)": hybrid_only,
        "Hybrid + Reranking": hybrid_reranked,
    }

    all_metrics = {}
    for name, fn in methods.items():
        print(f"  Testing: {name}...")
        metrics, _ = evaluate_retrieval(fn)
        all_metrics[name] = metrics
        print(f"    Source Hit Rate: {metrics['source_hit_rate']:.0%}")
        print(f"    Keyword Hit Rate: {metrics['keyword_hit_rate']:.0%}")
        print(f"    MRR: {metrics['mrr']:.3f}")

    return all_metrics


def compare_chunk_sizes():
    """
    Compare different chunking strategies by building temporary indexes
    and measuring retrieval quality on each.
    """
    print("\nComparing chunking strategies...\n")

    chunk_configs = [
        {"size": 500, "overlap": 50, "label": "500 / 50"},
        {"size": 750, "overlap": 100, "label": "750 / 100"},
        {"size": 1000, "overlap": 200, "label": "1000 / 200 (current)"},
        {"size": 1500, "overlap": 300, "label": "1500 / 300"},
        {"size": 2000, "overlap": 400, "label": "2000 / 400"},
    ]

    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    csv_docs = load_csvs()

    # Load PDF pages once
    loader = PyPDFLoader(PDF_PATH)
    pages = loader.load()

    all_metrics = {}

    for cfg in chunk_configs:
        label = cfg["label"]
        print(f"  Testing chunk size: {label}...")

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=cfg["size"],
            chunk_overlap=cfg["overlap"],
        )
        pdf_chunks = splitter.split_documents(pages)
        for chunk in pdf_chunks:
            chunk.metadata["source"] = "shareholder_letter"

        all_docs = pdf_chunks + csv_docs
        print(f"    Documents: {len(all_docs)} ({len(pdf_chunks)} PDF chunks + {len(csv_docs)} Q&A)")

        # Build temporary FAISS index
        vs = FAISS.from_documents(all_docs, embeddings)

        def search_fn(q, k):
            return vs.similarity_search(q, k=k)

        metrics, _ = evaluate_retrieval(search_fn)
        metrics["num_documents"] = len(all_docs)
        metrics["num_pdf_chunks"] = len(pdf_chunks)
        all_metrics[label] = metrics

        print(f"    Source Hit Rate: {metrics['source_hit_rate']:.0%}")
        print(f"    Keyword Hit Rate: {metrics['keyword_hit_rate']:.0%}")
        print(f"    MRR: {metrics['mrr']:.3f}")

    return all_metrics


def run_full_evaluation():
    """Run all evaluations and save results."""
    print("=" * 60)
    print("RAG EVALUATION SUITE")
    print("=" * 60)

    start = time.time()

    # Compare search methods
    search_metrics = compare_search_methods()

    # Compare chunk sizes
    chunk_metrics = compare_chunk_sizes()

    # Detailed results for the best method (hybrid + reranking)
    _, detailed_results = evaluate_retrieval(
        lambda q, k: retrieve(q, k_retrieve=10, k_final=k)
    )

    elapsed = time.time() - start

    results = {
        "search_methods": search_metrics,
        "chunk_sizes": chunk_metrics,
        "detailed_results": detailed_results,
        "elapsed_seconds": elapsed,
    }

    os.makedirs(VECTORSTORE_DIR, exist_ok=True)
    with open(RESULTS_PATH, "w") as f:
        json.dump(results, f, indent=2, default=str)

    print(f"\nResults saved to {RESULTS_PATH}")
    print(f"Total evaluation time: {elapsed:.1f} seconds")

    return results


if __name__ == "__main__":
    run_full_evaluation()
