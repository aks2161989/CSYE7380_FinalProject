import { useState, useEffect } from "react";
import { User, Bot } from "lucide-react";
import SourceCard from "./SourceCard";

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
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isUser
            ? "bg-blue-500/20 text-blue-400"
            : "bg-amber-500/20 text-amber-400"
        }`}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Content */}
      <div className={`max-w-[80%] space-y-2 ${isUser ? "text-right" : ""}`}>
        <div
          className={`inline-block rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-blue-600 text-white rounded-tr-sm"
              : "bg-slate-800 text-slate-200 rounded-tl-sm"
          }`}
        >
          {isUser ? message.content : displayed}
          {!isUser && !done && (
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-amber-400" />
          )}
        </div>

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
