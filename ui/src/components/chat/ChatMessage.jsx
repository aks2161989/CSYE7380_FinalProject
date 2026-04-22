import { useState, useEffect } from "react";
import { User, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import SourceCard from "./SourceCard";
import StockCard from "./StockCard";
import PortfolioOverviewCard from "./PortfolioOverviewCard";
import warrenAvatar from "../../assets/warren-avatar-sm.png";

function useTypingEffect(text, enabled) {
  const [displayed, setDisplayed] = useState(enabled ? "" : text);
  const [done, setDone] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setDisplayed(text);
      setDone(true);
      return;
    }

    setDisplayed("");
    setDone(false);
    const words = text.split(" ");
    let i = 0;

    const interval = setInterval(() => {
      i++;
      setDisplayed(words.slice(0, i).join(" "));
      if (i >= words.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [text, enabled]);

  return { displayed, done };
}

export default function ChatMessage({ message, animate = false }) {
  const isUser = message.role === "user";
  const { displayed, done } = useTypingEffect(
    message.content,
    animate && !isUser
  );

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      {isUser ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
          <User size={16} />
        </div>
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 overflow-hidden">
          <img
            src={warrenAvatar}
            alt="Warren AI"
            className="h-7 w-7 object-contain"
          />
        </div>
      )}

      {/* Content */}
      <div className={`max-w-[80%] space-y-2 ${isUser ? "text-right" : ""}`}>
        {/* Portfolio overview card — for portfolio analysis responses */}
        {!isUser && message.type === "portfolio-overview" && message.portfolio_data && (
          <PortfolioOverviewCard data={message.portfolio_data} />
        )}

        {/* Stock data card — shown above text for stock queries */}
        {!isUser && message.stock_data && (
          <StockCard data={message.stock_data} />
        )}

        <div
          className={`inline-block rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-blue-600 text-white rounded-tr-sm"
              : "bg-slate-200 text-slate-800 rounded-tl-sm dark:bg-slate-800 dark:text-slate-200"
          }`}
        >
          {isUser ? message.content : displayed}
          {!isUser && !done && (
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-slate-1000 dark:bg-red-400" />
          )}
        </div>

        {/* View Detailed Analysis link — for Buffett opinion responses */}
        {done && message.buffett_analysis && (
          <Link
            to={`/trading?tab=trading&symbol=${message.buffett_analysis.stock_data?.ticker || ""}`}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
          >
            View Detailed Analysis <ArrowRight size={14} />
          </Link>
        )}

        {/* Sources — show after typing finishes */}
        {done && message.sources?.length > 0 && (
          <div className="space-y-1.5">
            {message.sources.map((src, i) => (
              <SourceCard key={i} source={src} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
