import { useState } from "react";
import { Quote, ChevronDown, ChevronUp } from "lucide-react";

export default function BuffettVerdict({ verdict, sources, moat }) {
  const [showSources, setShowSources] = useState(false);

  if (!verdict) return null;

  const borderColor =
    moat === "Wide"
      ? "border-l-emerald-500"
      : moat === "Narrow"
        ? "border-l-amber-500"
        : "border-l-red-500";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
      <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
        Would Buffett Buy?
      </h3>

      {/* Verdict quote */}
      <div className={`rounded-lg border-l-4 ${borderColor} bg-slate-50 px-5 py-4 dark:bg-slate-800/50`}>
        <Quote size={18} className="mb-2 text-slate-300 dark:text-slate-600" />
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {verdict}
        </p>
      </div>

      {/* Sources */}
      {sources?.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowSources(!showSources)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            {showSources ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showSources ? "Hide" : "View"} Sources ({sources.length})
          </button>
          {showSources && (
            <div className="mt-3 space-y-2">
              {sources.slice(0, 3).map((src, i) => {
                let label = src.source;
                if (label === "yahoo_finance") label = "Yahoo Finance (Live Data)";
                else if (label === "shareholder_letter") {
                  label = "Shareholder Letter";
                  if (src.page != null) label += ` (p. ${src.page + 1})`;
                } else {
                  label = label.replace("qa_", "Q&A: ").replace(/_/g, " ");
                }
                return (
                  <div key={i} className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/40">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                      Source {i + 1} — {label}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {src.content?.slice(0, 200)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
