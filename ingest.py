"""
ingest.py -- Data ingestion pipeline for the Warren Buffett RAG chatbot.

Reads the Berkshire Hathaway shareholder letters (PDF) and Q&A data (multiple CSVs),
creates embeddings, and stores them in a FAISS vector index.

Run once:  python ingest.py
"""

import csv
import os
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


def load_pdf():
    """Load the Berkshire Hathaway letters PDF and split into chunks."""
    loader = PyPDFLoader(PDF_PATH)
    pages = loader.load()
    print(f"  PDF loaded: {len(pages)} pages")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
    )
    chunks = splitter.split_documents(pages)

    for chunk in chunks:
        chunk.metadata["source"] = "shareholder_letter"

    return chunks


def load_csvs():
    """Load all Q&A CSVs, deduplicate, and create documents."""
    docs = []
    seen = set()

    for csv_path in CSV_FILES:
        filename = os.path.basename(csv_path)
        # Extract label from filename, e.g. "Warren Buffett Data - Psychology.csv" -> "Psychology"
        label = filename.replace("Warren Buffett Data - ", "").replace(".csv", "")
        count = 0

        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                question = row["Questions"].strip()
                answer = row["Answers"].strip()

                # Skip duplicate "expanded perspective" rows
                if "(expanded perspective)" in question.lower():
                    continue

                # Skip exact duplicates across all files
                key = (question, answer)
                if key in seen:
                    continue
                seen.add(key)

                content = f"Question: {question}\nAnswer: {answer}"
                docs.append(Document(
                    page_content=content,
                    metadata={"source": f"qa_{label.lower().replace(' ', '_')}", "question": question},
                ))
                count += 1

        print(f"  {filename}: {count} unique Q&A pairs")

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
