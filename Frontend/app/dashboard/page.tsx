// Frontend\app\dashboard\page.tsx

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ============================================================
// BACKEND TYPES
// ============================================================

type BackendQuestion = {
  question: string;
  answer: string | null;
  evaluation: string | null;
};

type BackendInterviewSession = {
  interview_id: string;
  resume_id: string;
  role: string;
  interview_type: string;
  difficulty: string;
  duration: number;
  questions: BackendQuestion[];
  current_question_index: number;
  status: string;
};

type HistoryResponse = {
  history: BackendInterviewSession[];
};

type EvaluationScores = {
  correctness: number;
  clarity: number;
  completeness: number;
  relevance: number;
  overall_score: number;
};

// ============================================================
// DASHBOARD TYPE
// ============================================================

type DashboardInterview = {
  interviewId: string;
  role: string;
  interviewTypeRaw: string;
  interviewTypeDisplay: "Technical" | "HR" | "Managerial";
  difficultyDisplay: "Easy" | "Medium" | "Hard";
  duration: number;
  score: number | null;
};

// ============================================================
// HELPERS
// ============================================================

function parseEvaluation(evaluation: string | null): EvaluationScores | null {
  if (!evaluation) return null;

  try {
    const parsed = JSON.parse(evaluation);

    if (typeof parsed.overall_score !== "number") {
      return null;
    }

    return parsed as EvaluationScores;
  } catch {
    return null;
  }
}

function computeInterviewScore(questions: BackendQuestion[]): number | null {
  const scores: number[] = [];

  for (const q of questions) {
    const evalData = parseEvaluation(q.evaluation);

    if (
      evalData &&
      typeof evalData.overall_score === "number" &&
      !Number.isNaN(evalData.overall_score)
    ) {
      scores.push(evalData.overall_score);
    }
  }

  if (scores.length === 0) {
    return null;
  }

  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;

  return Number(average.toFixed(1));
}

function formatInterviewType(type: string): "Technical" | "HR" | "Managerial" {
  switch (type.toLowerCase()) {
    case "technical":
      return "Technical";

    case "managerial":
      return "Managerial";

    default:
      return "HR";
  }
}

function formatDifficulty(difficulty: string): "Easy" | "Medium" | "Hard" {
  switch (difficulty.toLowerCase()) {
    case "hard":
      return "Hard";

    case "medium":
      return "Medium";

    default:
      return "Easy";
  }
}

function toTitleCase(text: string): string {
  return text
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ============================================================
// COMPONENT
// ============================================================

export default function DashboardPage() {
  const [interviews, setInterviews] = useState<DashboardInterview[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [filterType, setFilterType] = useState("all");

  // ============================================================
  // FETCH HISTORY
  // ============================================================

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/history`);

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data: HistoryResponse = await response.json();

      const backendHistory = Array.isArray(data.history) ? data.history : [];

      const completed = backendHistory.filter(
        (item) => item.status === "COMPLETED",
      );

      const formatted: DashboardInterview[] = completed.map((item) => ({
        interviewId: item.interview_id,

        role: item.role ? toTitleCase(item.role) : "Unknown Role",

        interviewTypeRaw: item.interview_type,

        interviewTypeDisplay: formatInterviewType(item.interview_type),

        difficultyDisplay: formatDifficulty(item.difficulty),

        duration: item.duration,

        score: computeInterviewScore(item.questions || []),
      }));

      setInterviews(formatted);
    } catch (err) {
      console.error("Failed to load interview history:", err);

      setError("Unable to load interview history.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================
  // LOAD HISTORY WHEN PAGE OPENS
  // ============================================================

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // ============================================================
  // FILTER
  // ============================================================

  const filteredInterviews =
    filterType === "all"
      ? interviews
      : interviews.filter(
          (interview) =>
            interview.interviewTypeRaw.toLowerCase() === filterType,
        );

  // ============================================================
  // STATS
  // ============================================================

  const totalInterviews = interviews.length;

  const scoredInterviews = interviews.filter(
    (
      interview,
    ): interview is DashboardInterview & {
      score: number;
    } => interview.score !== null,
  );

  const averageScore =
    scoredInterviews.length > 0
      ? scoredInterviews.reduce((sum, interview) => sum + interview.score, 0) /
        scoredInterviews.length
      : null;

  const bestScore =
    scoredInterviews.length > 0
      ? Math.max(...scoredInterviews.map((interview) => interview.score))
      : null;

  const latestScore =
    interviews.length > 0 ? interviews[interviews.length - 1].score : null;

  // ============================================================
  // STYLE HELPERS
  // ============================================================

  const getScoreStyle = (score: number | null) => {
    if (score === null) {
      return "text-zinc-500";
    }

    if (score >= 8) {
      return "text-emerald-400";
    }

    if (score >= 6) {
      return "text-yellow-400";
    }

    return "text-red-400";
  };

  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-emerald-500/10 text-emerald-400";

      case "Medium":
        return "bg-yellow-500/10 text-yellow-400";

      case "Hard":
        return "bg-red-500/10 text-red-400";

      default:
        return "bg-white/5 text-zinc-400";
    }
  };

  const formatScore = (score: number | null) => {
    return score === null ? "N/A" : score.toFixed(1);
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-[#09090b] text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-violet-500" />

            <p className="text-sm text-zinc-400">Loading your dashboard...</p>
          </div>
        </div>
      </main>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error) {
    return (
      <main className="min-h-screen bg-[#09090b] text-white">
        <div className="relative mx-auto max-w-6xl px-6 py-10">
          <p className="mb-2 text-sm font-medium text-violet-400">
            AI INTERVIEW COACH
          </p>

          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>

          <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
            <p className="text-sm text-red-400">{error}</p>

            <button
              onClick={fetchHistory}
              className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ============================================================
  // MAIN DASHBOARD
  // ============================================================

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      {/* ======================================================
          BACKGROUND
      ====================================================== */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-250px] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-3xl" />

        <div className="absolute bottom-[-250px] right-[-150px] h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-sm font-medium text-violet-400">
              AI INTERVIEW COACH
            </p>

            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>

            <p className="mt-2 text-sm text-zinc-400">
              Track your interview performance and improve over time.
            </p>
          </div>

          {/* ==================================================
              IMPORTANT:
              USING LINK INSTEAD OF router.push()
          ================================================== */}

          <Link
            href="/interview"
            className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            Start New Interview →
          </Link>
        </div>

        {/* ======================================================
            STAT CARDS
        ====================================================== */}

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* TOTAL */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl">
            <p className="text-sm text-zinc-400">Total Interviews</p>

            <p className="mt-3 text-3xl font-semibold">{totalInterviews}</p>

            <p className="mt-2 text-xs text-zinc-600">
              Practice sessions completed
            </p>
          </div>

          {/* AVERAGE */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl">
            <p className="text-sm text-zinc-400">Average Score</p>

            <p className="mt-3 text-3xl font-semibold">
              {formatScore(averageScore)}

              {averageScore !== null && (
                <span className="ml-1 text-sm text-zinc-600">/10</span>
              )}
            </p>

            <p className="mt-2 text-xs text-emerald-400">Overall performance</p>
          </div>

          {/* BEST */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl">
            <p className="text-sm text-zinc-400">Best Score</p>

            <p className="mt-3 text-3xl font-semibold">
              {formatScore(bestScore)}

              {bestScore !== null && (
                <span className="ml-1 text-sm text-zinc-600">/10</span>
              )}
            </p>

            <p className="mt-2 text-xs text-violet-400">Personal best</p>
          </div>

          {/* LATEST */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl">
            <p className="text-sm text-zinc-400">Latest Score</p>

            <p
              className={`mt-3 text-3xl font-semibold ${getScoreStyle(
                latestScore,
              )}`}
            >
              {formatScore(latestScore)}

              {latestScore !== null && (
                <span className="ml-1 text-sm text-zinc-600">/10</span>
              )}
            </p>

            <p className="mt-2 text-xs text-zinc-500">Most recent interview</p>
          </div>
        </div>

        {/* ======================================================
            INTERVIEW HISTORY
        ====================================================== */}

        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl">
          {/* SECTION HEADER */}

          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold">Interview History</h2>

              <p className="mt-1 text-sm text-zinc-500">
                Review your previous interview sessions.
              </p>
            </div>

            {/* FILTER */}

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#111217] px-4 py-2.5 text-sm text-zinc-300 outline-none focus:border-violet-500/60"
            >
              <option value="all">All Interviews</option>

              <option value="technical">Technical</option>

              <option value="hr">HR</option>

              <option value="managerial">Managerial</option>
            </select>
          </div>

          {/* ==================================================
              NO INTERVIEWS
          ================================================== */}

          {totalInterviews === 0 ? (
            <div className="py-16 text-center">
              <p className="mb-5 text-sm text-zinc-500">No interviews yet.</p>

              <Link
                href="/interview"
                className="inline-flex items-center justify-center rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
              >
                + Start New Interview
              </Link>
            </div>
          ) : (
            <>
              {/* ==================================================
                  DESKTOP TABLE
              ================================================== */}

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-zinc-600">
                      <th className="pb-4 font-medium">Role</th>

                      <th className="pb-4 font-medium">Type</th>

                      <th className="pb-4 font-medium">Difficulty</th>

                      <th className="pb-4 font-medium">Duration</th>

                      <th className="pb-4 font-medium">Score</th>

                      <th className="pb-4 font-medium">Date</th>

                      <th className="pb-4 text-right font-medium">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredInterviews.map((interview) => (
                      <tr
                        key={interview.interviewId}
                        className="border-b border-white/[0.06] last:border-0"
                      >
                        {/* ROLE */}

                        <td className="py-5">
                          <p className="font-medium text-zinc-200">
                            {interview.role}
                          </p>
                        </td>

                        {/* TYPE */}

                        <td className="py-5">
                          <span className="rounded-lg bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-400">
                            {interview.interviewTypeDisplay}
                          </span>
                        </td>

                        {/* DIFFICULTY */}

                        <td className="py-5">
                          <span
                            className={`rounded-lg px-2.5 py-1 text-xs font-medium ${getDifficultyStyle(
                              interview.difficultyDisplay,
                            )}`}
                          >
                            {interview.difficultyDisplay}
                          </span>
                        </td>

                        {/* DURATION */}

                        <td className="py-5 text-sm text-zinc-400">
                          {interview.duration} min
                        </td>

                        {/* SCORE */}

                        <td className="py-5">
                          <span
                            className={`font-semibold ${getScoreStyle(
                              interview.score,
                            )}`}
                          >
                            {formatScore(interview.score)}
                          </span>

                          {interview.score !== null && (
                            <span className="ml-1 text-xs text-zinc-600">
                              /10
                            </span>
                          )}
                        </td>

                        {/* DATE */}

                        <td className="py-5 text-sm text-zinc-500">
                          Date unavailable
                        </td>

                        {/* ACTION */}

                        <td className="py-5 text-right">
                          <Link
                            href={`/history/${interview.interviewId}`}
                            className="inline-flex rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-violet-500/40 hover:bg-violet-500/5 hover:text-white"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ==================================================
                  MOBILE CARDS
              ================================================== */}

              <div className="space-y-3 md:hidden">
                {filteredInterviews.map((interview) => (
                  <div
                    key={interview.interviewId}
                    className="rounded-2xl border border-white/10 bg-black/20 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-medium text-zinc-200">
                          {interview.role}
                        </h3>

                        <p className="mt-1 text-xs text-zinc-600">
                          Date unavailable
                        </p>
                      </div>

                      <p
                        className={`text-xl font-semibold ${getScoreStyle(
                          interview.score,
                        )}`}
                      >
                        {formatScore(interview.score)}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-lg bg-violet-500/10 px-2.5 py-1 text-xs text-violet-400">
                        {interview.interviewTypeDisplay}
                      </span>

                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs ${getDifficultyStyle(
                          interview.difficultyDisplay,
                        )}`}
                      >
                        {interview.difficultyDisplay}
                      </span>

                      <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-zinc-500">
                        {interview.duration} min
                      </span>
                    </div>

                    <Link
                      href={`/history/${interview.interviewId}`}
                      className="mt-4 flex w-full items-center justify-center rounded-xl border border-white/10 py-2.5 text-xs font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white"
                    >
                      View Interview →
                    </Link>
                  </div>
                ))}
              </div>

              {/* ==================================================
                  FILTER EMPTY
              ================================================== */}

              {filteredInterviews.length === 0 && (
                <div className="py-16 text-center">
                  <p className="text-sm text-zinc-500">No interviews found.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
