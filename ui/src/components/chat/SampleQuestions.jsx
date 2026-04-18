import { Sparkles } from "lucide-react";
import { sampleQuestions } from "../../data/mockChat";

export default function SampleQuestions({ onSelect }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-400">
        <Sparkles size={24} />
      </div>
      <h2 className="mb-1 text-xl font-semibold text-slate-100">
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
            className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-left text-sm text-slate-300 transition-all hover:border-amber-500/30 hover:bg-slate-800/80 hover:text-slate-100"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
