import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, X } from "lucide-react";

export default function ChatFloatingButton() {
  const navigate = useNavigate();
  const [showBubble, setShowBubble] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowBubble(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end gap-3">
      {/* Speech bubble */}
      {showBubble && !dismissed && (
        <div className="animate-fade-in relative rounded-xl bg-white px-4 py-3 shadow-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-700 max-w-[220px]">
          <button
            onClick={() => setDismissed(true)}
            className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600"
          >
            <X size={10} />
          </button>
          <p
            className="text-xs leading-relaxed text-slate-700 dark:text-slate-200 cursor-pointer"
            onClick={() => navigate("/chat")}
          >
            <span className="font-semibold">Talk to Warren's BOT</span> to know about his investments, philosophy & more!
          </p>
          {/* Arrow pointing to button */}
          <div className="absolute -right-2 bottom-4 h-3 w-3 rotate-45 border-r border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800" />
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => navigate("/chat")}
        aria-label="Open chatbot"
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-red-500 text-slate-950 shadow-lg shadow-red-500/25 transition-all hover:bg-red-400 hover:shadow-red-500/40 hover:scale-105 active:scale-95"
      >
        <MessageCircle size={24} />
      </button>
    </div>
  );
}
