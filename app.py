"""
app.py -- Streamlit chat UI for the Warren Buffett RAG chatbot.

Run with:  streamlit run app.py
"""

import streamlit as st
from rag_chain import ask, get_vectorstore, get_llm
from config import APP_TITLE

# --- Page config ---
st.set_page_config(page_title=APP_TITLE, page_icon="📈", layout="wide")


@st.cache_resource
def load_models():
    """Load vectorstore and LLM once, cached across reruns."""
    get_vectorstore()
    get_llm()
    return True


# Load models on startup
with st.spinner("Loading models (first time may take a minute)..."):
    load_models()

# --- Sidebar ---
with st.sidebar:
    st.header("About")
    st.write(
        "RAG chatbot built on **Berkshire Hathaway shareholder letters** "
        "and **Warren Buffett Q&A data** covering personal life, strategy, "
        "psychology, risk management, timing, and adaptability."
    )

    st.header("Sample Questions")
    sample_questions = [
        "What is Buffett's view on return on equity?",
        "How did Buffett overcome his fear of public speaking?",
        "What happened with Berkshire's textile operations?",
        "How does Buffett approach risk management?",
        "Why does Buffett still live in Omaha?",
        "What is Buffett's investment philosophy?",
    ]
    for sample in sample_questions:
        if st.button(sample, key=sample):
            st.session_state.pending_question = sample

    st.divider()
    st.caption("Data sources: 1,010-page PDF of shareholder letters + 5,992 Q&A pairs across 7 datasets.")

# --- Title ---
st.title(APP_TITLE)
st.caption("Ask questions about Warren Buffett and Berkshire Hathaway")

# --- Chat history ---
if "messages" not in st.session_state:
    st.session_state.messages = []

# Display chat history
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.write(msg["content"])
        if "sources" in msg and msg["sources"]:
            with st.expander("View Sources"):
                for i, src in enumerate(msg["sources"]):
                    source_label = src["source"].replace("qa_", "Q&A: ").replace("_", " ").title()
                    if src.get("page") is not None:
                        source_label += f" (page {src['page'] + 1})"
                    st.markdown(f"**Source {i+1}** — _{source_label}_")
                    st.text(src["content"][:300] + ("..." if len(src["content"]) > 300 else ""))
                    st.divider()

# --- Handle input ---
# Check for pending question from sidebar button
pending = st.session_state.pop("pending_question", None)
user_input = st.chat_input("Ask a question about Warren Buffett...")

question = pending or user_input

if question:
    # Display user message
    st.session_state.messages.append({"role": "user", "content": question})
    with st.chat_message("user"):
        st.write(question)

    # Generate and display answer
    with st.chat_message("assistant"):
        with st.spinner("Thinking..."):
            result = ask(question)
        st.write(result["answer"])

        if result["sources"]:
            with st.expander("View Sources"):
                for i, src in enumerate(result["sources"]):
                    source_label = src["source"].replace("qa_", "Q&A: ").replace("_", " ").title()
                    if src.get("page") is not None:
                        source_label += f" (page {src['page'] + 1})"
                    st.markdown(f"**Source {i+1}** — _{source_label}_")
                    st.text(src["content"][:300] + ("..." if len(src["content"]) > 300 else ""))
                    st.divider()

    st.session_state.messages.append({
        "role": "assistant",
        "content": result["answer"],
        "sources": result["sources"],
    })
