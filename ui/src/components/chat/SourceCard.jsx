import { useState, useEffect, useRef } from "react";
import { ChevronDown, FileText } from "lucide-react";

export default function SourceCard({ source, index, messageIndex = 0 }) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = () => {
      setOpen(true);
      setHighlighted(true);
      setTimeout(() => setHighlighted(false), 1500);
    };
    el.addEventListener("citation-click", handler);
    return () => el.removeEventListener("citation-click", handler);
  }, []);

  const label = source.source
    .replace("qa_", "Q&A: ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const pageInfo = source.page != null ? ` (page ${source.page + 1})` : "";

  return (
    <div
      id={`source-card-${messageIndex}-${index}`}
      ref={ref}
      className={`rounded-lg border transition-all duration-300 ${
        highlighted
          ? "border-blue-400 ring-2 ring-blue-300 dark:border-blue-500 dark:ring-blue-500/30"
          : "border-slate-200 dark:border-slate-800"
      } bg-slate-50 dark:bg-slate-950/50`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/30"
      >
        <FileText size={12} className="shrink-0 text-slate-400 dark:text-slate-500" />
        <span className="flex-1 text-slate-500 dark:text-slate-400">
          <span className="font-medium text-slate-700 dark:text-slate-300">Source {index + 1}</span>
          {" — "}
          {label}
          {pageInfo}
        </span>
        <ChevronDown
          size={12}
          className={`shrink-0 text-slate-400 transition-transform dark:text-slate-500 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-slate-200 px-3 py-2 dark:border-slate-800">
          <p className="text-xs leading-relaxed text-slate-500">
            {source.content.slice(0, 300)}
            {source.content.length > 300 ? "..." : ""}
          </p>
        </div>
      )}
    </div>
  );
}
