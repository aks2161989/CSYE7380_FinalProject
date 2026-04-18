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
        "What would Buffett think of AAPL stock?",
    ]
    for sample in sample_questions:
        if st.button(sample, key=sample):
            st.session_state.pending_question = sample

    st.divider()
    st.caption("Data sources: 1,010-page PDF of shareholder letters + 5,992 Q&A pairs across 7 datasets.")

# --- Title ---
st.title(APP_TITLE)
st.caption("Ask questions about Warren Buffett, or ask what he'd think of any stock (e.g. \"What would Buffett think of TSLA?\")")

# --- Chat history ---
if "messages" not in st.session_state:
    st.session_state.messages = []


def display_stock_card(stock_data):
    """Display a stock metrics card."""
    d = stock_data
    st.markdown(f"**{d['name']}** ({d['ticker']}) — {d['sector']}")

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Price", f"${d['current_price']:.2f}" if d['current_price'] else "N/A")
    with col2:
        st.metric("P/E Ratio", f"{d['trailing_pe']:.1f}" if d['trailing_pe'] else "N/A")
    with col3:
        roe_pct = f"{d['roe'] * 100:.1f}%" if d['roe'] else "N/A"
        st.metric("ROE", roe_pct)
    with col4:
        st.metric("Debt/Equity", f"{d['debt_to_equity']:.1f}" if d['debt_to_equity'] else "N/A")

    col5, col6, col7, col8 = st.columns(4)
    with col5:
        margin = f"{d['profit_margins'] * 100:.1f}%" if d['profit_margins'] else "N/A"
        st.metric("Profit Margin", margin)
    with col6:
        div_yield = f"{d['dividend_yield'] * 100:.2f}%" if d['dividend_yield'] else "N/A"
        st.metric("Dividend Yield", div_yield)
    with col7:
        ret_1y = f"{d['1y_return']:.1f}%" if d['1y_return'] is not None else "N/A"
        st.metric("1Y Return", ret_1y)
    with col8:
        ret_5y = f"{d['5y_return']:.1f}%" if d['5y_return'] is not None else "N/A"
        st.metric("5Y Return", ret_5y)

    # Display backtest results
    bt_ma = d.get("backtest_ma")
    bt_rsi = d.get("backtest_rsi")
    if bt_ma or bt_rsi:
        st.markdown("**Backtest Results** (2018-present)")
        bc1, bc2 = st.columns(2)
        if bt_ma:
            with bc1:
                st.markdown(f"_MA Crossover (20/50)_")
                m1, m2, m3 = st.columns(3)
                m1.metric("Return", f"{bt_ma['total_return']:.1%}")
                m2.metric("Sharpe", f"{bt_ma['sharpe_ratio']:.2f}")
                m3.metric("Win Rate", f"{bt_ma['win_rate']:.0%}")
        if bt_rsi:
            with bc2:
                st.markdown(f"_RSI Strategy (30/70)_")
                r1, r2, r3 = st.columns(3)
                r1.metric("Return", f"{bt_rsi['total_return']:.1%}")
                r2.metric("Sharpe", f"{bt_rsi['sharpe_ratio']:.2f}")
                r3.metric("Win Rate", f"{bt_rsi['win_rate']:.0%}")


def display_sources(sources):
    """Display source citations in an expander."""
    if sources:
        with st.expander("View Sources"):
            for i, src in enumerate(sources):
                raw_source = src["source"]
                if raw_source == "yahoo_finance":
                    source_label = "Yahoo Finance (Live Data + Backtest)"
                elif raw_source == "shareholder_letter":
                    source_label = "Shareholder Letter"
                    if src.get("page") is not None:
                        source_label += f" (page {src['page'] + 1})"
                else:
                    source_label = raw_source.replace("qa_", "Q&A: ").replace("_", " ").title()
                st.markdown(f"**Source {i+1}** — _{source_label}_")
                st.text(src["content"][:300] + ("..." if len(src["content"]) > 300 else ""))
                st.divider()


# Display chat history
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.write(msg["content"])
        if msg.get("stock_data"):
            display_stock_card(msg["stock_data"])
        display_sources(msg.get("sources"))

# --- Handle input ---
pending = st.session_state.pop("pending_question", None)
user_input = st.chat_input("Ask about Buffett, or try: \"What would Buffett think of AAPL?\"")

question = pending or user_input

if question:
    # Display user message
    st.session_state.messages.append({"role": "user", "content": question})
    with st.chat_message("user"):
        st.write(question)

    # Generate and display answer
    with st.chat_message("assistant"):
        with st.spinner("Analyzing..." if "stock" in question.lower() or "think" in question.lower() else "Thinking..."):
            result = ask(question)

        # Show stock data card if present
        if result.get("stock_data"):
            display_stock_card(result["stock_data"])

        st.write(result["answer"])
        display_sources(result.get("sources"))

    st.session_state.messages.append({
        "role": "assistant",
        "content": result["answer"],
        "sources": result.get("sources"),
        "stock_data": result.get("stock_data"),
    })
