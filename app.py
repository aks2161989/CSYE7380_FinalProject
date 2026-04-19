"""
app.py -- Streamlit UI for Warren Buffett RAG Chatbot + Stock Analysis & Backtesting.

Run with:  streamlit run app.py
"""

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
import streamlit as st

from config import APP_TITLE
from rag_chain import ask, get_vectorstore, get_llm
from stock_analysis import compute_ratios, passes_rule, fmt, RATIO_DEFINITIONS
from trading_backtest import run_moving_average_crossover, run_rsi_strategy

# ── Page config ──────────────────────────────────────────────────────────────
st.set_page_config(page_title=APP_TITLE, page_icon="📈", layout="wide")


@st.cache_resource
def load_models():
    get_vectorstore()
    get_llm()
    return True


with st.spinner("Loading models (first time may take a minute)..."):
    load_models()

# ── Sidebar ──────────────────────────────────────────────────────────────────
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
    st.caption("Data: 1,010-page PDF + 5,992 Q&A pairs across 7 datasets.")

# ── Tabs ─────────────────────────────────────────────────────────────────────
tab_chat, tab_stocks = st.tabs(["💬 Chat Bot", "📊 Stock Analysis & Backtesting"])


# ═══════════════════════════ TAB 1: CHAT BOT ═════════════════════════════════
with tab_chat:
    st.title(APP_TITLE)
    st.caption("Ask questions about Warren Buffett and Berkshire Hathaway")

    if "messages" not in st.session_state:
        st.session_state.messages = []

    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.write(msg["content"])
            if "sources" in msg and msg["sources"]:
                with st.expander("View Sources"):
                    for i, src in enumerate(msg["sources"]):
                        label = src["source"].replace("qa_", "Q&A: ").replace("_", " ").title()
                        if src.get("page") is not None:
                            label += f" (page {src['page'] + 1})"
                        st.markdown(f"**Source {i+1}** — _{label}_")
                        st.text(src["content"][:300] + ("..." if len(src["content"]) > 300 else ""))
                        st.divider()

    pending = st.session_state.pop("pending_question", None)
    user_input = st.chat_input("Ask a question about Warren Buffett...")
    question = pending or user_input

    if question:
        st.session_state.messages.append({"role": "user", "content": question})
        with st.chat_message("user"):
            st.write(question)

        with st.chat_message("assistant"):
            with st.spinner("Thinking..."):
                result = ask(question)
            st.write(result["answer"])
            if result["sources"]:
                with st.expander("View Sources"):
                    for i, src in enumerate(result["sources"]):
                        label = src["source"].replace("qa_", "Q&A: ").replace("_", " ").title()
                        if src.get("page") is not None:
                            label += f" (page {src['page'] + 1})"
                        st.markdown(f"**Source {i+1}** — _{label}_")
                        st.text(src["content"][:300] + ("..." if len(src["content"]) > 300 else ""))
                        st.divider()

        st.session_state.messages.append({
            "role": "assistant",
            "content": result["answer"],
            "sources": result["sources"],
        })


# ══════════════════ TAB 2: STOCK ANALYSIS & BACKTESTING ══════════════════════
with tab_stocks:
    st.title("Stock Analysis & Backtesting")

    # ── Shared stock symbol input ─────────────────────────────────────────────
    col_sym, col_spacer = st.columns([2, 5])
    with col_sym:
        stock_symbol = st.text_input(
            "Stock Symbol",
            value=st.session_state.get("stock_symbol", "AAPL"),
            placeholder="e.g. AAPL, MSFT, TSLA",
            key="stock_symbol_input",
        ).strip().upper()

    st.divider()

    # ════════════════ SECTION 1: WARREN BUFFETT FINANCIAL ANALYSIS ════════════
    st.subheader("Warren Buffett's Rules of Thumb")
    st.caption("Key financial ratios with Buffett's reference thresholds for any publicly traded company.")

    analyze_clicked = st.button("Analyze Fundamentals", type="primary", key="analyze_btn")

    if analyze_clicked:
        with st.spinner(f"Fetching fundamental data for {stock_symbol}..."):
            try:
                st.session_state.analysis_result = compute_ratios(stock_symbol)
                st.session_state.analysis_symbol = stock_symbol
            except Exception as e:
                st.error(f"Could not fetch data for {stock_symbol!r}: {e}")
                st.session_state.pop("analysis_result", None)

    if "analysis_result" in st.session_state:
        res = st.session_state.analysis_result
        ratios = res["ratios"]
        info = res.get("info", {})

        company_name = info.get("longName", res["symbol"])
        price = info.get("currentPrice") or info.get("regularMarketPrice")
        price_str = f"  |  ${price:.2f}" if price else ""
        st.markdown(f"#### {company_name} ({res['symbol']}){price_str}")

        # Summary table
        rows = []
        for ratio_name, defn in RATIO_DEFINITIONS.items():
            series = ratios.get(ratio_name)
            if series is None:
                continue
            latest = series.iloc[0] if hasattr(series, "iloc") else float(series)
            passed = passes_rule(ratio_name, latest)
            status = "ℹ️" if passed is None else ("✅" if passed else "❌")
            rows.append({
                "Status": status,
                "Metric": ratio_name,
                "Latest Value": fmt(ratio_name, latest),
                "Rule": defn["rule"],
                "Group": defn["group"],
                "Buffett's Logic": defn["logic"],
            })

        df_summary = pd.DataFrame(rows)
        pass_n = df_summary["Status"].eq("✅").sum()
        fail_n = df_summary["Status"].eq("❌").sum()
        info_n = df_summary["Status"].eq("ℹ️").sum()

        m1, m2, m3 = st.columns(3)
        m1.metric("Passing", pass_n)
        m2.metric("Failing", fail_n)
        m3.metric("Informational", info_n)

        st.dataframe(df_summary, hide_index=True, use_container_width=True)

        # Warren Buffett's Take
        st.markdown("##### What Would Warren Buffett Say?")
        if st.button("Get Warren Buffett's Take", key="buffett_take_btn"):
            passing_lines = []
            failing_lines = []
            for row in rows:
                line = f"- {row['Metric']}: {row['Latest Value']} (rule: {row['Rule']})"
                if row["Status"] == "✅":
                    passing_lines.append(line)
                elif row["Status"] == "❌":
                    failing_lines.append(line)

            passing_block = "\n".join(passing_lines) if passing_lines else "  (none)"
            failing_block = "\n".join(failing_lines) if failing_lines else "  (none)"

            question = (
                f"Based on Warren Buffett's investment philosophy, evaluate {company_name} ({res['symbol']}) "
                f"as a potential investment. Here are its key financial metrics:\n\n"
                f"Passing Buffett's criteria ({pass_n} metrics):\n{passing_block}\n\n"
                f"Failing Buffett's criteria ({fail_n} metrics):\n{failing_block}\n\n"
                f"What does Buffett's philosophy say about a company with these characteristics? "
                f"Would he consider it a strong investment, and what are the key strengths or concerns?"
            )

            with st.spinner("Consulting Warren Buffett's wisdom..."):
                take = ask(question)

            st.session_state.buffett_take = take["answer"]

        if "buffett_take" in st.session_state:
            st.info(st.session_state.buffett_take)

        st.divider()

        # Historical trends per group
        st.markdown("##### Historical Trends")
        for group in ["Income Statement", "Balance Sheet", "Cash Flow"]:
            group_ratios = {
                k: v for k, v in ratios.items()
                if RATIO_DEFINITIONS.get(k, {}).get("group") == group and v is not None
            }
            if not group_ratios:
                continue

            with st.expander(f"📋 {group}", expanded=(group == "Income Statement")):
                for ratio_name, series in group_ratios.items():
                    defn = RATIO_DEFINITIONS[ratio_name]
                    sorted_s = series.sort_index()
                    chart_data = pd.DataFrame(
                        sorted_s.values,
                        index=[pd.Timestamp(d).strftime("%Y") for d in sorted_s.index],
                        columns=[ratio_name],
                    ).dropna()
                    if chart_data.empty:
                        continue

                    col_c, col_i = st.columns([3, 1])
                    with col_c:
                        st.markdown(f"**{ratio_name}**")
                        st.bar_chart(chart_data, height=160)
                    with col_i:
                        latest_val = series.iloc[0]
                        passed = passes_rule(ratio_name, latest_val)
                        verdict = "✅ Pass" if passed is True else ("❌ Fail" if passed is False else "ℹ️ Info")
                        st.metric("Rule", defn["rule"])
                        st.metric("Latest", fmt(ratio_name, latest_val))
                        st.caption(verdict)
                        st.caption(defn["logic"])

        # Raw financial statements
        st.markdown("##### Raw Financial Statements")

        def _fmt_cols(df: pd.DataFrame) -> pd.DataFrame:
            out = df.copy()
            try:
                out.columns = [pd.Timestamp(c).strftime("%Y-%m-%d") for c in out.columns]
            except Exception:
                pass
            return out

        with st.expander("Income Statement"):
            st.dataframe(_fmt_cols(res["financials"]), use_container_width=True)
        with st.expander("Balance Sheet"):
            st.dataframe(_fmt_cols(res["balance_sheet"]), use_container_width=True)
        with st.expander("Cash Flow Statement"):
            st.dataframe(_fmt_cols(res["cashflow"]), use_container_width=True)

    st.divider()

    # ═══════════════════════ SECTION 2: BACKTESTING ══════════════════════════
    st.subheader("Trading Strategy Backtesting")
    st.caption("Backtest Moving Average Crossover or RSI strategies on historical price data.")

    col_strat, col_start = st.columns(2)
    with col_strat:
        strategy = st.selectbox("Strategy", ["Moving Average Crossover", "RSI"], key="bt_strategy")
    with col_start:
        start_date = st.date_input("Start Date", value=pd.Timestamp("2018-01-01"), key="bt_start")

    if strategy == "Moving Average Crossover":
        c1, c2 = st.columns(2)
        with c1:
            short_win = int(st.number_input("Short MA Window", value=20, min_value=5, max_value=100, key="short_win"))
        with c2:
            long_win = int(st.number_input("Long MA Window", value=50, min_value=10, max_value=300, key="long_win"))
    else:
        c1, c2, c3 = st.columns(3)
        with c1:
            rsi_period = int(st.number_input("RSI Period", value=14, min_value=2, max_value=50, key="rsi_period"))
        with c2:
            oversold = int(st.number_input("Oversold Threshold", value=30, min_value=10, max_value=49, key="oversold"))
        with c3:
            overbought = int(st.number_input("Overbought Threshold", value=70, min_value=51, max_value=90, key="overbought"))

    run_bt = st.button("Run Backtest", type="primary", key="run_bt")

    if run_bt:
        start_str = start_date.strftime("%Y-%m-%d")
        with st.spinner(f"Running backtest for {stock_symbol}..."):
            try:
                if strategy == "Moving Average Crossover":
                    if short_win >= long_win:
                        st.error("Short MA window must be smaller than Long MA window.")
                    else:
                        bt = run_moving_average_crossover(stock_symbol, short_window=short_win, long_window=long_win, start=start_str)
                        st.session_state.bt_result = bt
                else:
                    bt = run_rsi_strategy(stock_symbol, rsi_period=rsi_period, oversold=oversold, overbought=overbought, start=start_str)
                    st.session_state.bt_result = bt
            except Exception as e:
                st.error(f"Backtest failed: {e}")
                st.session_state.pop("bt_result", None)

    if "bt_result" in st.session_state:
        bt = st.session_state.bt_result
        df = bt.data
        trades = bt.trades

        st.markdown(f"#### Results: {bt.strategy_name} on {bt.symbol}")

        m1, m2, m3, m4, m5, m6 = st.columns(6)
        m1.metric("Total Return", f"{bt.total_return:.1%}")
        m2.metric("Annualized Return", f"{bt.annualized_return:.1%}")
        m3.metric("Sharpe Ratio", f"{bt.sharpe_ratio:.2f}")
        m4.metric("Max Drawdown", f"{bt.max_drawdown:.1%}")
        m5.metric("Win Rate", f"{bt.win_rate:.1%}")
        m6.metric("# Trades", str(bt.num_trades))

        # Chart
        fig, axes = plt.subplots(3, 1, figsize=(14, 10), sharex=True)

        axes[0].plot(df.index, df["Close"], label="Close Price", color="#1f77b4")
        if "SMA_Short" in df.columns:
            axes[0].plot(df.index, df["SMA_Short"], label="Short MA", color="orange", linewidth=1)
        if "SMA_Long" in df.columns:
            axes[0].plot(df.index, df["SMA_Long"], label="Long MA", color="green", linewidth=1)

        if not trades.empty:
            axes[0].scatter(trades["Entry_Date"], trades["Entry_Price"],
                            marker="^", color="green", s=80, label="Buy", zorder=5)
            axes[0].scatter(trades["Exit_Date"], trades["Exit_Price"],
                            marker="v", color="red", s=80, label="Sell", zorder=5)

        axes[0].set_title(f"{bt.symbol} — {bt.strategy_name}")
        axes[0].legend(fontsize=8)
        axes[0].grid(True, alpha=0.3)

        axes[1].plot(df.index, df["Equity_Curve"], label="Strategy Equity", color="#2ca02c")
        axes[1].axhline(1.0, color="gray", linestyle="--", linewidth=0.8)
        axes[1].set_title("Equity Curve")
        axes[1].grid(True, alpha=0.3)

        axes[2].fill_between(df.index, df["Drawdown"], 0, color="red", alpha=0.4, label="Drawdown")
        axes[2].set_title("Drawdown")
        axes[2].grid(True, alpha=0.3)

        plt.tight_layout()
        st.pyplot(fig)
        plt.close(fig)

        if not trades.empty:
            with st.expander("Trade History"):
                display_trades = trades.copy()
                display_trades["Entry_Date"] = pd.to_datetime(display_trades["Entry_Date"]).dt.strftime("%Y-%m-%d")
                display_trades["Exit_Date"] = pd.to_datetime(display_trades["Exit_Date"]).dt.strftime("%Y-%m-%d")
                display_trades["Entry_Price"] = display_trades["Entry_Price"].round(2)
                display_trades["Exit_Price"] = display_trades["Exit_Price"].round(2)
                display_trades["PnL"] = display_trades["PnL"].map(lambda x: f"{x:.2%}")
                st.dataframe(display_trades, hide_index=True, use_container_width=True)
