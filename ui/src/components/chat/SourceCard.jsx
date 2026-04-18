import { useState } from "react";
import { ChevronDown, FileText } from "lucide-react";

export default function SourceCard({ source, index }) {
  const [open, setOpen] = useState(false);

  const label = source.source
    .replace("qa_", "Q&A: ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const pageInfo = source.page != null ? ` (page ${source.page + 1})` : "";

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/50">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-slate-800/30"
      >
        <FileText size={12} className="shrink-0 text-slate-500" />
        <span className="flex-1 text-slate-400">
          <span className="font-medium text-slate-300">Source {index + 1}</span>
          {" — "}
          {label}
          {pageInfo}
        </span>
        <ChevronDown
          size={12}
          className={`shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-slate-800 px-3 py-2">
          <p className="text-xs leading-relaxed text-slate-500">
            {source.content.slice(0, 300)}
            {source.content.length > 300 ? "..." : ""}
          </p>
        </div>
      )}
    </div>
  );
}
