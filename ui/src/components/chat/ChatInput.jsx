import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import SlashCommandMenu from "./SlashCommandMenu";
import StockAutocomplete from "./StockAutocomplete";
import PortfolioBuilder from "./PortfolioBuilder";
import { SLASH_COMMANDS, STOCK_LIST } from "../../data/slashCommands";

const OPINION_TEMPLATE = "What would Buffett think of ";

export default function ChatInput({ onSend, onSendPortfolio, disabled }) {
  const [text, setText] = useState("");
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [selectedSlashIdx, setSelectedSlashIdx] = useState(0);
  const [activeCommand, setActiveCommand] = useState(null);
  const [showStockAutocomplete, setShowStockAutocomplete] = useState(false);
  const [selectedStockIdx, setSelectedStockIdx] = useState(0);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  // Filter commands based on what user typed after "/"
  const filteredCommands = SLASH_COMMANDS.filter((cmd) =>
    cmd.label.toLowerCase().includes(slashFilter.toLowerCase())
  );

  // Filter stocks based on what user typed after the template
  const stockFilter =
    activeCommand === "buffett-opinion" && text.startsWith(OPINION_TEMPLATE)
      ? text.slice(OPINION_TEMPLATE.length).replace(/\?$/, "").trim()
      : "";

  const filteredStocks =
    stockFilter.length > 0
      ? STOCK_LIST.filter(
          (s) =>
            s.symbol.toLowerCase().includes(stockFilter.toLowerCase()) ||
            s.name.toLowerCase().includes(stockFilter.toLowerCase())
        ).slice(0, 8)
      : [];

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSlashMenu(false);
        setShowStockAutocomplete(false);
      }
    }
    if (showSlashMenu || showStockAutocomplete) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showSlashMenu, showStockAutocomplete]);

  // Show/hide stock autocomplete based on filter
  useEffect(() => {
    if (activeCommand === "buffett-opinion" && filteredStocks.length > 0 && stockFilter.length > 0) {
      setShowStockAutocomplete(true);
      setSelectedStockIdx(0);
    } else {
      setShowStockAutocomplete(false);
    }
  }, [stockFilter, activeCommand, filteredStocks.length]);

  function handleChange(e) {
    const val = e.target.value;
    setText(val);

    // Detect "/" at start of input (only when not in a command mode)
    if (!activeCommand) {
      if (val.startsWith("/")) {
        setShowSlashMenu(true);
        setSlashFilter(val.slice(1));
        setSelectedSlashIdx(0);
      } else {
        setShowSlashMenu(false);
        setSlashFilter("");
      }
    }
  }

  function handleSelectCommand(cmd) {
    setShowSlashMenu(false);
    setSlashFilter("");

    if (cmd.id === "buffett-opinion") {
      setActiveCommand("buffett-opinion");
      setText(OPINION_TEMPLATE);
      setTimeout(() => inputRef.current?.focus(), 0);
    } else if (cmd.id === "trade-like-buffett") {
      setActiveCommand("trade-like-buffett");
      setText("");
    }
  }

  function handleSelectStock(stock) {
    setShowStockAutocomplete(false);
    setText(`What would Buffett think of ${stock.symbol}?`);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleCancelPortfolio() {
    setActiveCommand(null);
    setText("");
  }

  function handleAnalyzePortfolio(holdings) {
    setActiveCommand(null);
    setText("");
    onSendPortfolio(holdings);
  }

  function handleKeyDown(e) {
    // Slash menu navigation
    if (showSlashMenu && filteredCommands.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSlashIdx((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSlashIdx((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedSlashIdx]) {
          handleSelectCommand(filteredCommands[selectedSlashIdx]);
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowSlashMenu(false);
        setText("");
        return;
      }
    }

    // Stock autocomplete navigation
    if (showStockAutocomplete && filteredStocks.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedStockIdx((prev) =>
          prev < filteredStocks.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedStockIdx((prev) =>
          prev > 0 ? prev - 1 : filteredStocks.length - 1
        );
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        handleSelectStock(filteredStocks[selectedStockIdx]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowStockAutocomplete(false);
        return;
      }
    }

    // Escape out of command mode
    if (e.key === "Escape" && activeCommand) {
      e.preventDefault();
      setActiveCommand(null);
      setText("");
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (showSlashMenu || showStockAutocomplete) return;
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    setActiveCommand(null);
  }

  // Portfolio builder mode — replace entire input area
  if (activeCommand === "trade-like-buffett") {
    return (
      <PortfolioBuilder
        onAnalyze={handleAnalyzePortfolio}
        onCancel={handleCancelPortfolio}
        disabled={disabled}
      />
    );
  }

  return (
    <div className="border-t border-slate-200 bg-white px-4 pt-4 pb-3 dark:border-slate-800 dark:bg-[#0d1520]">
      <div ref={wrapperRef} className="relative">
        {/* Slash command menu */}
        {showSlashMenu && filteredCommands.length > 0 && (
          <SlashCommandMenu
            commands={filteredCommands}
            selectedIdx={selectedSlashIdx}
            onSelect={handleSelectCommand}
          />
        )}

        {/* Stock autocomplete */}
        {showStockAutocomplete && filteredStocks.length > 0 && (
          <StockAutocomplete
            stocks={filteredStocks}
            selectedIdx={selectedStockIdx}
            onSelect={handleSelectStock}
          />
        )}

        <form onSubmit={handleSubmit}>
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder='Type / for commands, or send a message.'
              disabled={disabled}
              className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={disabled || !text.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500 text-slate-950 transition-all hover:bg-red-400 disabled:opacity-30 disabled:hover:bg-red-500"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
      <p className="mx-auto mt-2.5 max-w-3xl text-center text-xs leading-relaxed text-slate-400 dark:text-slate-500">
        Ask Warren AI can make mistakes. Check important info.
        <br />
        Content is for educational purposes only. Not financial advice.
      </p>
    </div>
  );
}
