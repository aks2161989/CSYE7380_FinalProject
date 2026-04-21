"""
retriever.py -- Hybrid search (BM25 + FAISS) with cross-encoder reranking.

Combines keyword-based BM25 retrieval with FAISS semantic search using
Reciprocal Rank Fusion (RRF), then reranks the merged results with a
cross-encoder model for higher precision.
"""

import os
import re
import pickle

from rank_bm25 import BM25Okapi
from sentence_transformers import CrossEncoder
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

from config import VECTORSTORE_DIR, EMBEDDING_MODEL

# Singletons
_vectorstore = None
_bm25_index = None
_bm25_docs = None
_reranker = None

BM25_PATH = os.path.join(VECTORSTORE_DIR, "bm25.pkl")
RERANKER_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"


def tokenize(text):
    """Simple whitespace + lowercase tokenizer for BM25."""
    return re.findall(r'\w+', text.lower())


def get_vectorstore():
    """Load the FAISS vector store."""
    global _vectorstore
    if _vectorstore is None:
        embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
        _vectorstore = FAISS.load_local(
            VECTORSTORE_DIR, embeddings, allow_dangerous_deserialization=True
        )
    return _vectorstore


def get_bm25():
    """Load the BM25 index and document list."""
    global _bm25_index, _bm25_docs
    if _bm25_index is None:
        with open(BM25_PATH, "rb") as f:
            data = pickle.load(f)
        _bm25_index = data["bm25"]
        _bm25_docs = data["docs"]
    return _bm25_index, _bm25_docs


def get_reranker():
    """Load the cross-encoder reranker model."""
    global _reranker
    if _reranker is None:
        print(f"Loading reranker: {RERANKER_MODEL}...")
        _reranker = CrossEncoder(RERANKER_MODEL)
        print("Reranker loaded.")
    return _reranker


def build_bm25_index(documents):
    """Build and save a BM25 index from a list of LangChain Documents."""
    corpus = [tokenize(doc.page_content) for doc in documents]
    bm25 = BM25Okapi(corpus)

    os.makedirs(VECTORSTORE_DIR, exist_ok=True)
    with open(BM25_PATH, "wb") as f:
        pickle.dump({"bm25": bm25, "docs": documents}, f)

    print(f"BM25 index saved to {BM25_PATH} ({len(documents)} documents)")
    return bm25


def hybrid_search(query, k=10):
    """
    Combine FAISS semantic search and BM25 keyword search
    using Reciprocal Rank Fusion (RRF).
    """
    vectorstore = get_vectorstore()
    bm25, bm25_docs = get_bm25()

    # FAISS semantic search
    faiss_results = vectorstore.similarity_search(query, k=k)

    # BM25 keyword search
    query_tokens = tokenize(query)
    bm25_scores = bm25.get_scores(query_tokens)
    bm25_top_indices = bm25_scores.argsort()[-k:][::-1]
    bm25_results = [bm25_docs[i] for i in bm25_top_indices if bm25_scores[i] > 0]

    # Reciprocal Rank Fusion
    rrf_scores = {}
    rrf_constant = 60  # standard RRF constant

    for rank, doc in enumerate(faiss_results):
        doc_id = id(doc)
        rrf_scores[doc_id] = rrf_scores.get(doc_id, 0) + 1.0 / (rrf_constant + rank + 1)

    # For BM25, we need to match by content since they're different objects
    content_to_faiss = {doc.page_content: doc for doc in faiss_results}
    merged_docs = {id(doc): doc for doc in faiss_results}

    for rank, doc in enumerate(bm25_results):
        # Check if this doc is already in FAISS results (by content match)
        if doc.page_content in content_to_faiss:
            existing = content_to_faiss[doc.page_content]
            doc_id = id(existing)
        else:
            doc_id = id(doc)
            merged_docs[doc_id] = doc

        rrf_scores[doc_id] = rrf_scores.get(doc_id, 0) + 1.0 / (rrf_constant + rank + 1)

    # Sort by RRF score
    sorted_ids = sorted(rrf_scores, key=rrf_scores.get, reverse=True)
    results = [merged_docs[doc_id] for doc_id in sorted_ids if doc_id in merged_docs]

    return results[:k]


def rerank(query, docs, top_n=5):
    """Rerank documents using a cross-encoder model."""
    if not docs:
        return docs

    reranker = get_reranker()

    # Score each (query, document) pair
    pairs = [(query, doc.page_content) for doc in docs]
    scores = reranker.predict(pairs)

    # Sort by score descending
    scored_docs = sorted(zip(scores, docs), key=lambda x: x[0], reverse=True)
    return [doc for _, doc in scored_docs[:top_n]]


def retrieve(query, k_retrieve=10, k_final=5):
    """
    Full retrieval pipeline: hybrid search -> rerank -> top results.
    """
    candidates = hybrid_search(query, k=k_retrieve)
    reranked = rerank(query, candidates, top_n=k_final)
    return reranked
