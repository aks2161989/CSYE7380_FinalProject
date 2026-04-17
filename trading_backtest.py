import math
from dataclasses import dataclass

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import yfinance as yf


@dataclass
class BacktestResult:
    symbol: str
    strategy_name: str
    total_return: float
    annualized_return: float
    sharpe_ratio: float
    max_drawdown: float
    win_rate: float
    num_trades: int
    data: pd.DataFrame
    trades: pd.DataFrame


def download_price_data(symbol: str, start: str = "2018-01-01", end: str = None) -> pd.DataFrame:
    df = yf.download(symbol, start=start, end=end, auto_adjust=True, progress=False)

    if df.empty:
        raise ValueError(f"No price data found for symbol: {symbol}")

    # Flatten multi-index columns if needed
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    required_cols = ["Open", "High", "Low", "Close", "Volume"]
    df = df[[col for col in required_cols if col in df.columns]].copy()
    df.dropna(inplace=True)

    return df


def compute_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()

    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    avg_gain = gain.rolling(period).mean()
    avg_loss = loss.rolling(period).mean()

    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))

    return rsi.fillna(50)


def calculate_metrics(df: pd.DataFrame, trades: pd.DataFrame, symbol: str, strategy_name: str) -> BacktestResult:
    strategy_returns = df["Strategy_Return"].fillna(0)
    equity_curve = (1 + strategy_returns).cumprod()

    total_return = equity_curve.iloc[-1] - 1

    trading_days = len(df)
    annualized_return = (equity_curve.iloc[-1] ** (252 / trading_days) - 1) if trading_days > 0 else 0

    volatility = strategy_returns.std() * np.sqrt(252)
    sharpe_ratio = ((strategy_returns.mean() * 252) / volatility) if volatility != 0 else 0

    rolling_max = equity_curve.cummax()
    drawdown = equity_curve / rolling_max - 1
    max_drawdown = drawdown.min()

    if not trades.empty:
        win_rate = (trades["PnL"] > 0).mean()
        num_trades = len(trades)
    else:
        win_rate = 0.0
        num_trades = 0

    df = df.copy()
    df["Equity_Curve"] = equity_curve
    df["Drawdown"] = drawdown

    return BacktestResult(
        symbol=symbol,
        strategy_name=strategy_name,
        total_return=float(total_return),
        annualized_return=float(annualized_return),
        sharpe_ratio=float(sharpe_ratio),
        max_drawdown=float(max_drawdown),
        win_rate=float(win_rate),
        num_trades=int(num_trades),
        data=df,
        trades=trades
    )


def run_moving_average_crossover(symbol: str, short_window: int = 20, long_window: int = 50,
                                 start: str = "2018-01-01", end: str = None) -> BacktestResult:
    if short_window >= long_window:
        raise ValueError("short_window must be smaller than long_window")

    df = download_price_data(symbol, start, end)
    df = df.copy()

    df["SMA_Short"] = df["Close"].rolling(short_window).mean()
    df["SMA_Long"] = df["Close"].rolling(long_window).mean()

    # Buy when short MA > long MA, else stay in cash
    df["Signal"] = np.where(df["SMA_Short"] > df["SMA_Long"], 1, 0)
    df["Position"] = df["Signal"].shift(1).fillna(0)

    df["Market_Return"] = df["Close"].pct_change().fillna(0)
    df["Strategy_Return"] = df["Position"] * df["Market_Return"]

    trades = extract_trades(df, price_col="Close", signal_col="Signal")

    return calculate_metrics(df, trades, symbol, f"MA Crossover ({short_window}/{long_window})")


def run_rsi_strategy(symbol: str, rsi_period: int = 14, oversold: int = 30, overbought: int = 70,
                     start: str = "2018-01-01", end: str = None) -> BacktestResult:
    df = download_price_data(symbol, start, end)
    df = df.copy()

    df["RSI"] = compute_rsi(df["Close"], rsi_period)

    # Buy when RSI < oversold; exit when RSI > overbought
    signal = []
    in_position = 0

    for _, row in df.iterrows():
        if in_position == 0 and row["RSI"] < oversold:
            in_position = 1
        elif in_position == 1 and row["RSI"] > overbought:
            in_position = 0
        signal.append(in_position)

    df["Signal"] = signal
    df["Position"] = df["Signal"].shift(1).fillna(0)

    df["Market_Return"] = df["Close"].pct_change().fillna(0)
    df["Strategy_Return"] = df["Position"] * df["Market_Return"]

    trades = extract_trades(df, price_col="Close", signal_col="Signal")

    return calculate_metrics(df, trades, symbol, f"RSI Strategy ({oversold}/{overbought})")


def extract_trades(df: pd.DataFrame, price_col: str, signal_col: str) -> pd.DataFrame:
    trades = []
    entry_date = None
    entry_price = None
    current_position = 0

    for i in range(1, len(df)):
        prev_signal = df[signal_col].iloc[i - 1]
        curr_signal = df[signal_col].iloc[i]
        curr_price = df[price_col].iloc[i]
        curr_date = df.index[i]

        # Enter long
        if current_position == 0 and prev_signal == 0 and curr_signal == 1:
            entry_date = curr_date
            entry_price = curr_price
            current_position = 1

        # Exit long
        elif current_position == 1 and prev_signal == 1 and curr_signal == 0:
            exit_date = curr_date
            exit_price = curr_price
            pnl = (exit_price / entry_price) - 1

            trades.append({
                "Entry_Date": entry_date,
                "Exit_Date": exit_date,
                "Entry_Price": entry_price,
                "Exit_Price": exit_price,
                "PnL": pnl
            })

            entry_date = None
            entry_price = None
            current_position = 0

    # Close open trade on last day
    if current_position == 1 and entry_price is not None:
        exit_date = df.index[-1]
        exit_price = df[price_col].iloc[-1]
        pnl = (exit_price / entry_price) - 1

        trades.append({
            "Entry_Date": entry_date,
            "Exit_Date": exit_date,
            "Entry_Price": entry_price,
            "Exit_Price": exit_price,
            "PnL": pnl
        })

    return pd.DataFrame(trades)


def plot_backtest(result: BacktestResult):
    df = result.data
    trades = result.trades

    fig, axes = plt.subplots(3, 1, figsize=(14, 12), sharex=True)

    # Price chart
    axes[0].plot(df.index, df["Close"], label="Close")
    if "SMA_Short" in df.columns:
        axes[0].plot(df.index, df["SMA_Short"], label="SMA Short")
    if "SMA_Long" in df.columns:
        axes[0].plot(df.index, df["SMA_Long"], label="SMA Long")

    if not trades.empty:
        axes[0].scatter(trades["Entry_Date"], trades["Entry_Price"], marker="^", s=100, label="Buy")
        axes[0].scatter(trades["Exit_Date"], trades["Exit_Price"], marker="v", s=100, label="Sell")

    axes[0].set_title(f"{result.symbol} - {result.strategy_name}")
    axes[0].legend()
    axes[0].grid(True)

    # Equity curve
    axes[1].plot(df.index, df["Equity_Curve"], label="Strategy Equity")
    axes[1].set_title("Equity Curve")
    axes[1].grid(True)

    # Drawdown
    axes[2].plot(df.index, df["Drawdown"], label="Drawdown")
    axes[2].set_title("Drawdown")
    axes[2].grid(True)

    plt.tight_layout()
    plt.show()


def print_metrics(result: BacktestResult):
    print(f"\n===== {result.strategy_name} on {result.symbol} =====")
    print(f"Total Return:      {result.total_return:.2%}")
    print(f"Annualized Return: {result.annualized_return:.2%}")
    print(f"Sharpe Ratio:      {result.sharpe_ratio:.2f}")
    print(f"Max Drawdown:      {result.max_drawdown:.2%}")
    print(f"Win Rate:          {result.win_rate:.2%}")
    print(f"Number of Trades:  {result.num_trades}")

def backtest_summary(symbol: str, strategy: str = "ma") -> dict:
    symbol = symbol.strip().upper()
    strategy = strategy.strip().lower()

    if strategy == "ma":
        result = run_moving_average_crossover(symbol, short_window=20, long_window=50)
    elif strategy == "rsi":
        result = run_rsi_strategy(symbol, rsi_period=14, oversold=30, overbought=70)
    else:
        raise ValueError("Strategy must be 'ma' or 'rsi'")

    return {
        "symbol": result.symbol,
        "strategy_name": result.strategy_name,
        "total_return": result.total_return,
        "annualized_return": result.annualized_return,
        "sharpe_ratio": result.sharpe_ratio,
        "max_drawdown": result.max_drawdown,
        "win_rate": result.win_rate,
        "num_trades": result.num_trades,
    }

if __name__ == "__main__":
    symbol = "AAPL"

    ma_result = run_moving_average_crossover(symbol, short_window=20, long_window=50)
    print_metrics(ma_result)
    plot_backtest(ma_result)

    rsi_result = run_rsi_strategy(symbol, rsi_period=14, oversold=30, overbought=70)
    print_metrics(rsi_result)
    plot_backtest(rsi_result)