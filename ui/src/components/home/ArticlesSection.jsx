import { ExternalLink, Clock } from "lucide-react";

const articles = [
  {
    title: "Warren Buffett's 2024 Annual Letter to Shareholders",
    source: "Berkshire Hathaway",
    date: "Feb 2025",
    description:
      "Buffett reflects on Berkshire's record operating earnings, the importance of fiscal responsibility, and why he still believes in America's economic future.",
    url: "https://www.berkshirehathaway.com/letters/2024ltr.pdf",
    tag: "Shareholder Letter",
  },
  {
    title: "Berkshire Hathaway Tops $1 Trillion Market Cap",
    source: "Reuters",
    date: "Aug 2024",
    description:
      "Warren Buffett's Berkshire Hathaway became the first non-tech U.S. company to reach a $1 trillion market capitalization, a milestone decades in the making.",
    url: "https://www.reuters.com/business/finance/berkshire-hathaway-nears-1-trillion-market-value-2024-08-28/",
    tag: "Milestone",
  },
  {
    title: "The Evolution of Buffett's Investment Philosophy",
    source: "Financial Times",
    date: "Mar 2025",
    description:
      "From cigar-butt investing to quality compounders — how Buffett's strategy evolved over six decades and what it means for today's investors.",
    url: "https://www.ft.com/stream/7b47f1b1-4779-4b5e-b308-31d5765b70a6",
    tag: "Analysis",
  },
  {
    title: "Inside Berkshire's $189 Billion Cash Pile",
    source: "Bloomberg",
    date: "Jan 2025",
    description:
      "With a record cash position in Treasury bills, Buffett signals patience — waiting for the right pitch while markets hover near all-time highs.",
    url: "https://finance.yahoo.com/news/warren-buffett-sits-sidelines-189-162514413.html",
    tag: "Strategy",
  },
];

const tagColors = {
  "Shareholder Letter": "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
  Milestone: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  Analysis: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
  Strategy: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
};

export default function ArticlesSection() {
  return (
    <section>
      <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-slate-100">
        Latest Articles & Insights
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {articles.map((a) => (
          <a
            key={a.title}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700 dark:hover:bg-slate-900 dark:hover:shadow-none"
          >
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    tagColors[a.tag] ?? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                  }`}
                >
                  {a.tag}
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-900 group-hover:text-red-600 transition-colors dark:text-slate-100 dark:group-hover:text-red-400">
                {a.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {a.description}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {a.date} &middot; {a.source}
              </span>
              <ExternalLink
                size={14}
                className="opacity-0 transition-opacity group-hover:opacity-100 text-slate-400"
              />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
