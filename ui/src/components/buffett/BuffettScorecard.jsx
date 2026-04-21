import { CheckCircle, AlertTriangle, XCircle, Shield } from "lucide-react";

const scoreIcons = {
  pass: { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20" },
  caution: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/20" },
  fail: { icon: XCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10", border: "border-red-200 dark:border-red-500/20" },
};

const moatColors = {
  Wide: "text-emerald-600 dark:text-emerald-400",
  Narrow: "text-amber-600 dark:text-amber-400",
  None: "text-red-600 dark:text-red-400",
};

export default function BuffettScorecard({ scorecard, moat, passCount, totalCriteria, stockName }) {
  if (!scorecard?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
      {/* Header with moat badge */}
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-medium uppercase tracking-wider text-slate-500">
          Buffett Scorecard — {stockName}
        </h3>
        <div className="flex items-center gap-2">
          <Shield size={16} className={moatColors[moat]} />
          <span className={`text-sm font-semibold ${moatColors[moat]}`}>
            {moat} Moat
          </span>
          <span className="text-xs text-slate-400">
            ({passCount}/{totalCriteria} passed)
          </span>
        </div>
      </div>

      {/* Criteria grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {scorecard.map((item) => {
          const style = scoreIcons[item.score];
          const Icon = style.icon;
          return (
            <div
              key={item.metric}
              className={`rounded-lg border p-4 ${style.bg} ${style.border}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon size={16} className={style.color} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {item.metric}
                  </span>
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {item.value}
                </span>
              </div>
              <div className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                Buffett target: {item.threshold}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {item.reason}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
