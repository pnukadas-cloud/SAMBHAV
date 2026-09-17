import React, { useState, useEffect } from "react";
import { fetchInstructorAnalytics } from "../../api/client";

interface ModuleCompletion {
  title: string;
  order_index: number;
  completions: number;
}

interface ConceptStat {
  concept: string;
  attempts: number;
  averageScore: number;
}

interface LearnerBehind {
  id: string;
  name: string;
  email: string;
  completedLessons: number;
  averageScore: number;
  reason: string;
}

interface AnalyticsData {
  hasData: boolean;
  totalSubmissions: number;
  averageScore: number;
  moduleCompletions: ModuleCompletion[];
  scoreDistribution: {
    "90-100": number;
    "75-89": number;
    "60-74": number;
    "<60": number;
  };
  conceptStats: ConceptStat[];
  learnersBehind: LearnerBehind[];
}

export const InstructorAnalyticsView: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchInstructorAnalytics();
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to fetch instructor analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400">
        <div className="inline-block w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p>Calculating cohort metrics from database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-950/40 border border-rose-800/50 rounded-2xl text-rose-300 flex items-center justify-between">
        <span>{error}</span>
        <button
          onClick={loadAnalytics}
          className="px-3 py-1 bg-rose-900/50 hover:bg-rose-900 text-rose-200 text-xs font-semibold rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  const hasAnyData = data && (data.hasData || data.totalSubmissions > 0 || (data.learnersBehind && data.learnersBehind.length > 0));
  const maxCompletions = Math.max(1, ...(data?.moduleCompletions?.map((m) => m.completions) || [1]));
  const totalScores =
    (data?.scoreDistribution?.["90-100"] || 0) +
    (data?.scoreDistribution?.["75-89"] || 0) +
    (data?.scoreDistribution?.["60-74"] || 0) +
    (data?.scoreDistribution?.["<60"] || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>📈</span> Real-Time Cohort Analytics
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Calculated directly from real database progress records, simulation logs, and assessment scores.
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-2 self-start md:self-auto transition-colors cursor-pointer"
        >
          <span>🔄</span> Refresh Data
        </button>
      </div>

      {!hasAnyData ? (
        <div className="p-16 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="text-lg font-bold text-white mb-1">No Learner Activity Yet</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Once your enrolled learners start completing modules, running quantum circuits, or submitting quizzes, real performance distributions and insights will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
                Total Submissions
              </span>
              <span className="text-3xl font-extrabold text-white">
                {data?.totalSubmissions ?? 0}
              </span>
              <span className="text-xs text-slate-500 block mt-1">Quizzes & evaluations</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
                Average Assessment Score
              </span>
              <span className="text-3xl font-extrabold text-teal-300">
                {data?.averageScore ?? 0}%
              </span>
              <span className="text-xs text-slate-500 block mt-1">Across all completed attempts</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
                Active Modules
              </span>
              <span className="text-3xl font-extrabold text-indigo-400">
                {data?.moduleCompletions?.filter((m) => m.completions > 0).length ?? 0}
                <span className="text-sm font-normal text-slate-500"> / 10</span>
              </span>
              <span className="text-xs text-slate-500 block mt-1">Modules with completed lessons</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
                Identified for Attention
              </span>
              <span className="text-3xl font-extrabold text-amber-400">
                {data?.learnersBehind?.length ?? 0}
              </span>
              <span className="text-xs text-slate-500 block mt-1">Pacing or score below threshold</span>
            </div>
          </div>

          {/* Analytics Grids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Module Completion Distribution */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <span>📚</span> Module Progression Funnel
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Total student lesson completions across the 10-module quantum curriculum.
              </p>

              <div className="space-y-3.5">
                {data?.moduleCompletions?.map((mod, idx) => {
                  const pct = Math.round((mod.completions / maxCompletions) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-300 truncate max-w-[70%]">
                          {mod.title}
                        </span>
                        <span className="text-slate-400 font-mono">
                          {mod.completions} {mod.completions === 1 ? "completion" : "completions"}
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800/80">
                        <div
                          className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(mod.completions > 0 ? 5 : 0, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Score Distribution & Concept Performance */}
            <div className="space-y-6">
              {/* Score Distribution */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                  <span>🎯</span> Grade & Score Distribution
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Assessment grade spread for verified submissions.
                </p>

                {totalScores === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    No graded submissions recorded yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-emerald-900/30">
                      <span className="text-xs text-emerald-400 font-bold block">90 - 100%</span>
                      <span className="text-xl font-extrabold text-white mt-1 block">
                        {data?.scoreDistribution?.["90-100"] || 0}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {Math.round(((data?.scoreDistribution?.["90-100"] || 0) / totalScores) * 100)}%
                      </span>
                    </div>

                    <div className="bg-slate-950/80 p-3 rounded-xl border border-teal-900/30">
                      <span className="text-xs text-teal-400 font-bold block">75 - 89%</span>
                      <span className="text-xl font-extrabold text-white mt-1 block">
                        {data?.scoreDistribution?.["75-89"] || 0}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {Math.round(((data?.scoreDistribution?.["75-89"] || 0) / totalScores) * 100)}%
                      </span>
                    </div>

                    <div className="bg-slate-950/80 p-3 rounded-xl border border-amber-900/30">
                      <span className="text-xs text-amber-400 font-bold block">60 - 74%</span>
                      <span className="text-xl font-extrabold text-white mt-1 block">
                        {data?.scoreDistribution?.["60-74"] || 0}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {Math.round(((data?.scoreDistribution?.["60-74"] || 0) / totalScores) * 100)}%
                      </span>
                    </div>

                    <div className="bg-slate-950/80 p-3 rounded-xl border border-rose-900/30">
                      <span className="text-xs text-rose-400 font-bold block">&lt; 60%</span>
                      <span className="text-xl font-extrabold text-white mt-1 block">
                        {data?.scoreDistribution?.["<60"] || 0}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {Math.round(((data?.scoreDistribution?.["<60"] || 0) / totalScores) * 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Concept Performance */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                  <span>🧠</span> Concept Difficulty Breakdown
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Assessment areas ordered by student attempt volume and average accuracy.
                </p>

                {(!data?.conceptStats || data.conceptStats.length === 0) ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    No concept assessments completed yet.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {data.conceptStats.map((cs, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80"
                      >
                        <div>
                          <span className="text-xs font-semibold text-slate-200 block">
                            {cs.concept}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {cs.attempts} {cs.attempts === 1 ? "attempt" : "attempts"}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                            cs.averageScore >= 80
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : cs.averageScore >= 65
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {cs.averageScore}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Learners Identified for Remediation / Attention */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <span>⚠️</span> Learners Identified for Support & Remediation
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Students identified by algorithm based on slow pacing or scores below passing threshold.
            </p>

            {(!data?.learnersBehind || data.learnersBehind.length === 0) ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                All learners are progressing within expected performance thresholds.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-2.5 font-semibold">Student Name</th>
                      <th className="pb-2.5 font-semibold">Email</th>
                      <th className="pb-2.5 font-semibold">Completed Lessons</th>
                      <th className="pb-2.5 font-semibold">Average Score</th>
                      <th className="pb-2.5 font-semibold">Diagnostic Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {data.learnersBehind.map((lb) => (
                      <tr key={lb.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 font-medium text-white">{lb.name}</td>
                        <td className="py-3 text-slate-400">{lb.email}</td>
                        <td className="py-3 text-slate-300 font-mono">
                          {lb.completedLessons} / 31
                        </td>
                        <td className="py-3 font-semibold text-amber-400">
                          {lb.averageScore > 0 ? `${lb.averageScore}%` : "No attempts"}
                        </td>
                        <td className="py-3 text-rose-300/90 font-medium">{lb.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
