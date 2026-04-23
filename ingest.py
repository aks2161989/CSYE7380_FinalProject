"""
ingest.py -- Data ingestion pipeline for the Warren Buffett RAG chatbot.

Reads the Berkshire Hathaway shareholder letters (PDF) and Q&A data (multiple CSVs),
creates embeddings, and stores them in a FAISS vector index.

Run once:  python ingest.py
"""

import csv
import os
import re
import time

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document

from config import (
    PDF_PATH, CSV_FILES, VECTORSTORE_DIR,
    CHUNK_SIZE, CHUNK_OVERLAP, EMBEDDING_MODEL,
)
from retriever import build_bm25_index


# Synthetic first-person prefixes that appear in the cleaned dataset.
# These add noise to embeddings without carrying real meaning.
PREFIX_PATTERNS = [
    "Speaking for myself ", "In my view ", "From my perspective ",
    "Personally ", "To me ", "I believe ", "I am convinced that ",
    "For my part ", "I feel ", "In my opinion ", "My view is that ",
    "I think ", "As I see it ",
]

# UTF-8 mojibake mappings (text that got decoded as Windows-1252).
# Keys use hex escapes because the byte sequences contain quote characters.
MOJIBAKE_FIXES = {
    "â€™": "'",      # right single quote
    "â€˜": "'",      # left single quote
    "â€œ": '"',      # left double quote
    "â€\x9d": '"',        # right double quote
    "â€”": "--",     # em dash
    "â€–": "-",      # en dash
    "â€¦": "...",    # ellipsis
    "Â ": " ",            # non-breaking space
}


def clean_text(text):
    """Fix encoding artifacts, strip synthetic prefixes, normalize whitespace."""
    if not text:
        return text

    # Fix mojibake (UTF-8 decoded as Windows-1252)
    for bad, good in MOJIBAKE_FIXES.items():
        text = text.replace(bad, good)

    # Strip synthetic first-person prefixes (often combined, e.g. "Personally I believe X")
    for _ in range(3):  # handle stacked prefixes
        stripped = False
        for prefix in PREFIX_PATTERNS:
            if text.startswith(prefix):
                text = text[len(prefix):].lstrip()
                # Lowercase the first letter if the rest of the sentence has a capital
                if text and text[0].isupper() and len(text) > 1 and text[1].islower():
                    pass  # keep the capital -- start of sentence
                stripped = True
                break
        if not stripped:
            break

    # Collapse multiple whitespace
    text = re.sub(r'\s+', ' ', text).strip()

    return text


def load_pdf():
    """Load the Berkshire Hathaway letters PDF and split into chunks."""
    loader = PyPDFLoader(PDF_PATH)
    pages = loader.load()
    print(f"  PDF loaded: {len(pages)} pages")

    # Clean encoding artifacts and normalize whitespace in each page
    for page in pages:
        page.page_content = clean_text(page.page_content)

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
    )
    chunks = splitter.split_documents(pages)

    # Filter out tiny chunks (page headers, footers, isolated artifacts)
    chunks = [c for c in chunks if len(c.page_content.strip()) > 50]

    for chunk in chunks:
        chunk.metadata["source"] = "shareholder_letter"

    return chunks


def load_csvs():
    """Load all Q&A CSVs, clean, deduplicate, and create documents."""
    docs = []
    seen = set()
    total_cleaned = 0

    for csv_path in CSV_FILES:
        filename = os.path.basename(csv_path)
        count = 0
        cleaned_count = 0

        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Handle both column naming conventions
                question_raw = (row.get("Questions") or row.get("question", "")).strip()
                answer_raw = (row.get("Answers") or row.get("answer", "")).strip()
                label = (row.get("Label") or row.get("refined_category") or "").strip()

                # Clean both fields
                question = clean_text(question_raw)
                answer = clean_text(answer_raw)

                if question != question_raw or answer != answer_raw:
                    cleaned_count += 1

                if not question or not answer:
                    continue

                # Skip rows with very short answers (likely noise)
                if len(answer) < 20:
                    continue

                # Skip duplicate "expanded perspective" rows
                if "(expanded perspective)" in question.lower():
                    continue

                # Skip exact duplicates across all files (post-cleaning dedup is more effective)
                key = (question.lower(), answer.lower())
                if key in seen:
                    continue
                seen.add(key)

                source_tag = f"qa_{label.lower().replace(' ', '_').replace('&', 'and')}" if label else "qa"
                content = f"Question: {question}\nAnswer: {answer}"
                docs.append(Document(
                    page_content=content,
                    metadata={"source": source_tag, "question": question},
                ))
                count += 1

        total_cleaned += cleaned_count
        print(f"  {filename}: {count} unique Q&A pairs ({cleaned_count} cleaned)")

    print(f"  Total rows cleaned (prefix/encoding fixes): {total_cleaned}")
    return docs


def main():
    start = time.time()

    print("Loading PDF...")
    pdf_docs = load_pdf()
    print(f"  -> {len(pdf_docs)} chunks from PDF\n")

    print("Loading CSVs...")
    csv_docs = load_csvs()
    print(f"  -> {len(csv_docs)} total Q&A pairs\n")

    all_docs = pdf_docs + csv_docs
    print(f"Total documents: {len(all_docs)}\n")

    print("Creating embeddings and FAISS index (this may take a few minutes)...")
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    vectorstore = FAISS.from_documents(all_docs, embeddings)
    vectorstore.save_local(VECTORSTORE_DIR)

    print("Building BM25 keyword index...")
    build_bm25_index(all_docs)

    elapsed = time.time() - start
    print(f"\nVector store saved to {VECTORSTORE_DIR}/")
    print(f"Done in {elapsed:.1f} seconds.")

    # --- Smoke test ---
    print("\n--- Smoke Test ---")
    test_queries = [
        "What is Buffett's opinion on debt?",
        "How did Buffett overcome his fear of public speaking?",
        "What happened with Berkshire's textile operations?",
        "How does Buffett manage risk?",
    ]
    for q in test_queries:
        results = vectorstore.similarity_search(q, k=3)
        print(f"\nQuery: {q}")
        for i, doc in enumerate(results):
            src = doc.metadata.get("source", "unknown")
            preview = doc.page_content[:120].replace("\n", " ")
            print(f"  [{i+1}] source={src} | {preview}...")


if __name__ == "__main__":
    main()
