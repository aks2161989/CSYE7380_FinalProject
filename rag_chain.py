"""
rag_chain.py -- RAG retrieval and generation pipeline.

Loads the FAISS vector store, retrieves relevant chunks for a user question,
and generates an answer using FLAN-T5 (local) or Groq Llama 3 (if API key is set).
"""

import os

from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

from config import VECTORSTORE_DIR, EMBEDDING_MODEL, LOCAL_MODEL, TOP_K


# Module-level singletons (loaded once, reused across calls)
_vectorstore = None
_model = None
_tokenizer = None


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
    global _model, _tokenizer
    if _model is None:
        groq_key = os.environ.get("GROQ_API_KEY")
        if groq_key:
            # Use Groq cloud LLM for better quality
            from langchain_groq import ChatGroq
            _model = ChatGroq(
                model_name="llama3-8b-8192",
                temperature=0.3,
            )
            _tokenizer = None
            print("Using Groq Llama 3 for generation")
        else:
            # Use local FLAN-T5
            print(f"Loading {LOCAL_MODEL} (this may take a moment on first run)...")
            _tokenizer = AutoTokenizer.from_pretrained(LOCAL_MODEL)
            _model = AutoModelForSeq2SeqLM.from_pretrained(LOCAL_MODEL)
            print(f"Loaded {LOCAL_MODEL}")
    return _model, _tokenizer


def build_prompt(question, context_docs):
    """Build the prompt from retrieved documents and the user question."""
    # Use top 3 chunks for the prompt (keeps within FLAN-T5 token limits)
    context_parts = []
    for doc in context_docs[:3]:
        context_parts.append(doc.page_content)
    context = "\n\n".join(context_parts)

    prompt = (
        "Use the following context to give a detailed answer to the question. "
        "If the answer is not in the context, say so.\n\n"
        f"Context:\n{context}\n\n"
        f"Question: {question}\n\n"
        "Detailed answer:"
    )
    return prompt


def ask(question):
    """
    Retrieve relevant chunks and generate an answer.

    Returns:
        dict with keys:
            - "answer": the generated answer string
            - "sources": list of dicts with "content", "source", "page" keys
    """
    vectorstore = get_vectorstore()
    model, tokenizer = get_llm()

    # Retrieve top-k relevant documents
    docs = vectorstore.similarity_search(question, k=TOP_K)

    # Build prompt
    prompt = build_prompt(question, docs)

    # Generate answer
    if tokenizer is not None:
        # Local FLAN-T5: tokenize, truncate to 512 tokens, and generate
        inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512)
        outputs = model.generate(**inputs, max_new_tokens=256)
        answer = tokenizer.decode(outputs[0], skip_special_tokens=True).strip()
    else:
        # Groq cloud LLM
        response = model.invoke(prompt)
        answer = response.content.strip()

    # Format sources for display
    sources = []
    for doc in docs:
        sources.append({
            "content": doc.page_content,
            "source": doc.metadata.get("source", "unknown"),
            "page": doc.metadata.get("page"),
        })

    return {"answer": answer, "sources": sources}


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
