import os

# Base directory (where this file lives)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# --- Paths ---
DATA_DIR = os.path.join(BASE_DIR, "data")
PDF_PATH = os.path.join(DATA_DIR, "All-Berkshire-Hathaway-Letters.pdf")
CSV_FILES = [
    os.path.join(DATA_DIR, f) for f in [
        "Warren Buffett Data - Personal life.csv",
        "Warren Buffett Data - Adaptability.csv",
        "Warren Buffett Data - Psychology.csv",
        "Warren Buffett Data - Risk Management.csv",
        "Warren Buffett Data - Strategy Development.csv",
        "Warren Buffett Data - Timing.csv",
    ]
]
VECTORSTORE_DIR = os.path.join(BASE_DIR, "vectorstore")

# --- Chunking ---
CHUNK_SIZE = 1000       # characters per chunk
CHUNK_OVERLAP = 200     # overlap between consecutive chunks

# --- Embedding model ---
EMBEDDING_MODEL = "sentence-transformers/paraphrase-MiniLM-L6-v2"

# --- Generation model ---
LOCAL_MODEL = "google/flan-t5-base"         # runs on CPU, ~900MB download
GROQ_MODEL = "llama3-8b-8192"              # optional, needs GROQ_API_KEY env var

# --- Retrieval ---
TOP_K = 5               # number of chunks to retrieve from FAISS

# --- UI ---
APP_TITLE = "Warren Buffett Knowledge Base"
