"""
visualize.py -- Compute UMAP 2D projection of all document embeddings.

Projects the ~10,000 document embeddings from FAISS down to 2D using UMAP,
colored by source type. Used by the Evaluation page for data visualization.

Run once after ingestion:  python visualize.py
"""

import json
import os
import pickle
import numpy as np

from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

from config import VECTORSTORE_DIR, EMBEDDING_MODEL

PROJECTION_PATH = os.path.join(VECTORSTORE_DIR, "umap_projection.json")
MAX_POINTS = 3000  # sample for performance -- UMAP on 10k is slow


def main():
    print("Loading FAISS vector store...")
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    vs = FAISS.load_local(VECTORSTORE_DIR, embeddings, allow_dangerous_deserialization=True)

    # Extract embeddings and metadata from FAISS
    print("Extracting embeddings from index...")
    index = vs.index
    ntotal = index.ntotal
    dim = index.d
    print(f"  Total vectors: {ntotal}, dim: {dim}")

    # Reconstruct all vectors from the FAISS index
    vectors = np.zeros((ntotal, dim), dtype=np.float32)
    for i in range(ntotal):
        vectors[i] = index.reconstruct(i)

    # Get metadata for each doc
    docstore = vs.docstore
    index_to_docstore_id = vs.index_to_docstore_id

    docs_meta = []
    for i in range(ntotal):
        doc_id = index_to_docstore_id[i]
        doc = docstore.search(doc_id)
        source = doc.metadata.get("source", "unknown")
        content = doc.page_content[:400]
        docs_meta.append({"source": source, "preview": content})

    # Sample if too large
    if ntotal > MAX_POINTS:
        print(f"Sampling {MAX_POINTS} points from {ntotal} (stratified by source)...")
        sources = np.array([m["source"] for m in docs_meta])
        unique_sources = np.unique(sources)
        sampled_indices = []
        for src in unique_sources:
            src_indices = np.where(sources == src)[0]
            n_sample = min(len(src_indices), MAX_POINTS * len(src_indices) // ntotal + 1)
            sampled = np.random.choice(src_indices, size=n_sample, replace=False)
            sampled_indices.extend(sampled.tolist())
        sampled_indices = sorted(sampled_indices)[:MAX_POINTS]
        vectors = vectors[sampled_indices]
        docs_meta = [docs_meta[i] for i in sampled_indices]

    # Run UMAP
    print(f"Running UMAP on {len(vectors)} vectors (this takes ~30-60 seconds)...")
    import umap
    reducer = umap.UMAP(
        n_components=2,
        n_neighbors=15,
        min_dist=0.1,
        metric="cosine",
        random_state=42,
    )
    projection = reducer.fit_transform(vectors)

    # Normalize to [-1, 1] range for easier plotting
    x_range = projection[:, 0].max() - projection[:, 0].min()
    y_range = projection[:, 1].max() - projection[:, 1].min()
    x_center = (projection[:, 0].max() + projection[:, 0].min()) / 2
    y_center = (projection[:, 1].max() + projection[:, 1].min()) / 2

    points = []
    for i, meta in enumerate(docs_meta):
        x = (projection[i, 0] - x_center) / (x_range / 2)
        y = (projection[i, 1] - y_center) / (y_range / 2)
        points.append({
            "x": round(float(x), 4),
            "y": round(float(y), 4),
            "source": meta["source"],
            "preview": meta["preview"],
        })

    # Count per source for the legend
    source_counts = {}
    for m in docs_meta:
        source_counts[m["source"]] = source_counts.get(m["source"], 0) + 1

    result = {
        "points": points,
        "source_counts": source_counts,
        "total_sampled": len(points),
        "total_documents": ntotal,
    }

    with open(PROJECTION_PATH, "w") as f:
        json.dump(result, f)

    print(f"\nProjection saved to {PROJECTION_PATH}")
    print(f"Sources: {list(source_counts.keys())}")
    print(f"Counts: {source_counts}")


if __name__ == "__main__":
    main()
