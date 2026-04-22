import { MessageSquareText, Briefcase } from "lucide-react";

const ICONS = {
  "buffett-opinion": MessageSquareText,
  "trade-like-buffett": Briefcase,
};

export default function SlashCommandMenu({ commands, selectedIdx, onSelect }) {
  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 mx-auto max-w-3xl">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
        <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Commands
          </p>
        </div>
        {commands.map((cmd, i) => {
          const Icon = ICONS[cmd.id] || MessageSquareText;
          return (
            <button
              key={cmd.id}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(cmd);
              }}
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                i === selectedIdx
                  ? "bg-red-50 dark:bg-red-500/10"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  i === selectedIdx
                    ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                <Icon size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  /{cmd.label}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {cmd.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
