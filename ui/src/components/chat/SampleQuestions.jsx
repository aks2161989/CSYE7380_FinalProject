import { Sparkles } from "lucide-react";
import { sampleQuestions } from "../../data/mockChat";

export default function SampleQuestions({ onSelect }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-100 to-red-50 text-red-600 dark:from-red-500/20 dark:to-red-600/10 dark:text-red-400">
        <Sparkles size={24} />
      </div>
      <h2 className="mb-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
        Ask about Warren Buffett
      </h2>
      <p className="mb-8 text-sm text-slate-500">
        Powered by RAG over shareholder letters & curated Q&A data
      </p>
      <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
        {sampleQuestions.map((q) => (
          <button
            key={q}
            onClick={() => onSelect(q)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-600 transition-all hover:border-red-500/30 hover:bg-red-50/50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-red-500/30 dark:hover:bg-slate-800/80 dark:hover:text-slate-100"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
