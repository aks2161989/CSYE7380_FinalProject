import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { fetchSearchMethodEval, fetchChunkSizeEval, fetchTestSuite } from "../services/api";

function MetricCard({ label, value, highlight }) {
  return (
    <div className={`rounded-xl border p-4 text-center ${
      highlight
        ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
        : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
    }`}>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}

function BarComparison({ data, metricKey, label, formatFn }) {
  const maxVal = Math.max(...data.map((d) => d[metricKey]));
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
      {data.map((d) => (
        <div key={d.name} className="flex items-center gap-3">
          <span className="w-44 shrink-0 text-right text-xs text-slate-500 dark:text-slate-400">
            {d.name}
          </span>
          <div className="flex-1">
            <div className="h-6 rounded bg-slate-100 dark:bg-slate-700">
              <div
                className="flex h-6 items-center rounded bg-red-500/80 px-2 text-xs font-medium text-white transition-all duration-500"
                style={{ width: `${(d[metricKey] / maxVal) * 100}%` }}
              >
                {formatFn ? formatFn(d[metricKey]) : d[metricKey]}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function EvaluationPage() {
  const [searchResults, setSearchResults] = useState(null);
  const [chunkResults, setChunkResults] = useState(null);
  const [testSuite, setTestSuite] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [chunkLoading, setChunkLoading] = useState(false);

  useEffect(() => {
    fetchTestSuite().then(setTestSuite).catch(console.error);
  }, []);

  const runSearchEval = async () => {
    setSearchLoading(true);
    try {
      const data = await fetchSearchMethodEval();
      setSearchResults(data);
    } catch (e) {
      console.error(e);
    }
    setSearchLoading(false);
  };

  const runChunkEval = async () => {
    setChunkLoading(true);
    try {
      const data = await fetchChunkSizeEval();
      setChunkResults(data);
    } catch (e) {
      console.error(e);
    }
    setChunkLoading(false);
  };

  const fmtPct = (v) => `${(v * 100).toFixed(0)}%`;
  const fmtMrr = (v) => v.toFixed(3);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-6 py-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          RAG Evaluation Dashboard
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Benchmarks retrieval quality across search methods and chunking strategies.
          Demonstrates why hybrid search with cross-encoder reranking outperforms FAISS alone.
        </p>
      </div>

      {/* Section 1: Search Method Comparison */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Search Method Comparison
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Compares FAISS-only, hybrid (BM25 + FAISS), and hybrid + cross-encoder reranking
              on {testSuite ? testSuite.length : "..."} test questions.
            </p>
          </div>
          <button
            onClick={runSearchEval}
            disabled={searchLoading}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {searchLoading && <Loader2 size={16} className="animate-spin" />}
            {searchLoading ? "Evaluating..." : "Run Evaluation"}
          </button>
        </div>

        {searchResults && (
          <div className="space-y-6">
            {/* Metric cards per method */}
            <div className="grid gap-6 md:grid-cols-3">
              {Object.entries(searchResults).map(([name, { metrics }]) => {
                const isBest = name === "Hybrid + Reranking";
                return (
                  <div
                    key={name}
                    className={`space-y-3 rounded-xl border p-5 ${
                      isBest
                        ? "border-green-300 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
                        : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                    }`}
                  >
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {name}
                      {isBest && (
                        <span className="ml-2 text-xs font-normal text-green-600 dark:text-green-400">
                          (recommended)
                        </span>
                      )}
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      <MetricCard label="Source Hit" value={fmtPct(metrics.source_hit_rate)} highlight={metrics.source_hit_rate === 1} />
                      <MetricCard label="Keyword Hit" value={fmtPct(metrics.keyword_hit_rate)} highlight={metrics.keyword_hit_rate >= 0.9} />
                      <MetricCard label="MRR" value={fmtMrr(metrics.mrr)} highlight={metrics.mrr >= 0.95} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bar charts */}
            <div className="grid gap-6 md:grid-cols-3">
              {(() => {
                const barData = Object.entries(searchResults).map(([name, { metrics }]) => ({
                  name,
                  sourceHit: metrics.source_hit_rate * 100,
                  keywordHit: metrics.keyword_hit_rate * 100,
                  mrr: metrics.mrr * 100,
                }));
                return (
                  <>
                    <BarComparison data={barData} metricKey="sourceHit" label="Source Hit Rate (%)" formatFn={(v) => `${v.toFixed(0)}%`} />
                    <BarComparison data={barData} metricKey="keywordHit" label="Keyword Hit Rate (%)" formatFn={(v) => `${v.toFixed(0)}%`} />
                    <BarComparison data={barData} metricKey="mrr" label="Mean Reciprocal Rank (%)" formatFn={(v) => `${v.toFixed(1)}%`} />
                  </>
                );
              })()}
            </div>

            {/* Detailed results table */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="border-b border-slate-200 px-5 py-3 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Per-Question Results (Hybrid + Reranking)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Question</th>
                      <th className="px-4 py-3 text-center">Source</th>
                      <th className="px-4 py-3 text-center">Keywords</th>
                      <th className="px-4 py-3 text-center">MRR</th>
                      <th className="px-4 py-3">Found</th>
                      <th className="px-4 py-3">Missed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {searchResults["Hybrid + Reranking"]?.details.map((d, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="max-w-xs truncate px-4 py-2.5 text-slate-700 dark:text-slate-300">
                          {d.question}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                            d.source_hit
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}>
                            {d.source_hit ? "Pass" : "Fail"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                            d.keyword_hit
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}>
                            {d.keyword_hit ? "Pass" : "Fail"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center text-slate-600 dark:text-slate-400">
                          {d.mrr.toFixed(2)}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-green-600 dark:text-green-400">
                          {d.keywords_found.slice(0, 3).join(", ")}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-red-500 dark:text-red-400">
                          {d.keywords_missed.slice(0, 3).join(", ") || "--"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Section 2: Chunking Strategy Comparison */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Chunking Strategy Comparison
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tests 5 chunk size / overlap configurations to find the optimal balance between
              context granularity and retrieval quality.
            </p>
          </div>
          <button
            onClick={runChunkEval}
            disabled={chunkLoading}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {chunkLoading && <Loader2 size={16} className="animate-spin" />}
            {chunkLoading ? "Evaluating (~2 min)..." : "Run Evaluation"}
          </button>
        </div>

        {chunkResults && (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Chunk Config</th>
                    <th className="px-4 py-3 text-right">PDF Chunks</th>
                    <th className="px-4 py-3 text-right">Total Docs</th>
                    <th className="px-4 py-3 text-center">Source Hit</th>
                    <th className="px-4 py-3 text-center">Keyword Hit</th>
                    <th className="px-4 py-3 text-center">MRR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {Object.entries(chunkResults).map(([label, m]) => {
                    const isCurrent = label.includes("current");
                    const bestKw = Math.max(...Object.values(chunkResults).map((x) => x.keyword_hit_rate));
                    const isBestKw = m.keyword_hit_rate === bestKw;
                    return (
                      <tr
                        key={label}
                        className={
                          isCurrent
                            ? "bg-green-50/50 dark:bg-green-950/20"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }
                      >
                        <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300">
                          {label}
                          {isCurrent && (
                            <span className="ml-2 text-xs text-green-600 dark:text-green-400">active</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-600 dark:text-slate-400">
                          {m.num_pdf_chunks.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-600 dark:text-slate-400">
                          {m.num_documents.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-center">{fmtPct(m.source_hit_rate)}</td>
                        <td className={`px-4 py-2.5 text-center font-medium ${
                          isBestKw ? "text-green-600 dark:text-green-400" : ""
                        }`}>
                          {fmtPct(m.keyword_hit_rate)}
                        </td>
                        <td className="px-4 py-2.5 text-center">{fmtMrr(m.mrr)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bar chart for keyword hit rate */}
            <BarComparison
              data={Object.entries(chunkResults).map(([name, m]) => ({
                name,
                keywordHit: m.keyword_hit_rate * 100,
              }))}
              metricKey="keywordHit"
              label="Keyword Hit Rate by Chunk Size (%)"
              formatFn={(v) => `${v.toFixed(0)}%`}
            />
          </div>
        )}
      </section>

      {/* Section 3: Test Suite */}
      {testSuite && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Benchmark Test Suite ({testSuite.length} Questions)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Mix of easy keyword matches, paraphrased queries, vague questions, and adversarial inputs
            designed to differentiate search methods.
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 w-8">#</th>
                  <th className="px-4 py-3">Question</th>
                  <th className="px-4 py-3">Expected Source</th>
                  <th className="px-4 py-3">Expected Keywords</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {testSuite.map((t, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-2.5 text-slate-400">{i + 1}</td>
                    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{t.question}</td>
                    <td className="px-4 py-2.5">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                        {t.expected_source}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400">
                      {t.expected_keywords.join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
