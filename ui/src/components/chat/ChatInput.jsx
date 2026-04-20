import { useState } from "react";
import { Send } from "lucide-react";

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  }

  return (
    <div className="border-t border-slate-200 bg-white px-4 pt-4 pb-3 dark:border-slate-800 dark:bg-[#0d1520]">
      <form onSubmit={handleSubmit}>
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Send a message."
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
      <p className="mx-auto mt-2.5 max-w-3xl text-center text-xs leading-relaxed text-slate-400 dark:text-slate-500">
        Ask Warren AI can make mistakes. Check important info.
        <br />
        Content is for educational purposes only. Not financial advice.
      </p>
    </div>
  );
}
