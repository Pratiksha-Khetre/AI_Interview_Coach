"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
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

type EvaluationScores = {
  correctness: number;
  clarity: number;
  completeness: number;
  relevance: number;
  overall_score: number;
  strengths: string[];
  areas_for_improvement: string[];
  final_feedback: string;
};

type QuestionWithEvaluation = {
  question: string;
  answer: string | null;
  evaluation: EvaluationScores | null;
};

// ============================================================
// HELPERS
// ============================================================

function parseEvaluation(evaluation: string | null): EvaluationScores | null {
  if (!evaluation) return null;

  try {
    const parsed = JSON.parse(evaluation);

    if (typeof parsed.overall_score !== "number") return null;

    return {
      correctness: Number(parsed.correctness) || 0,
      clarity: Number(parsed.clarity) || 0,
      completeness: Number(parsed.completeness) || 0,
      relevance: Number(parsed.relevance) || 0,
      overall_score: Number(parsed.overall_score) || 0,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      areas_for_improvement: Array.isArray(parsed.areas_for_improvement)
        ? parsed.areas_for_improvement
        : [],
      final_feedback:
        typeof parsed.final_feedback === "string" ? parsed.final_feedback : "",
    };
  } catch {
    return null;
  }
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;

  return Number(
    (values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1),
  );
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

export default function InterviewDetailsPage() {
  const router = useRouter();
  const params = useParams<{ interviewId: string }>();
  const interviewId = params?.interviewId;

  const [session, setSession] = useState<BackendInterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  // ============================================================
  // FETCH SINGLE INTERVIEW
  // ============================================================

  const fetchInterview = useCallback(async () => {
    if (!interviewId) return;

    setLoading(true);
    setError("");
    setNotFound(false);

    try {
      const response = await fetch(`${API_BASE_URL}/interview/${interviewId}`);

      if (response.status === 404) {
        setNotFound(true);
        return;
      }

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data: BackendInterviewSession = await response.json();
      setSession(data);
    } catch (err) {
      console.error("Failed to load interview:", err);
      setError("Unable to load this interview.");
    } finally {
      setLoading(false);
    }
  }, [interviewId]);

  useEffect(() => {
    fetchInterview();
  }, [fetchInterview]);

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-[#09090b] text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-violet-500" />
            <p className="text-sm text-zinc-400">Loading interview report...</p>
          </div>
        </div>
      </main>
    );
  }

  // ============================================================
  // NOT FOUND
  // ============================================================

  if (notFound) {
    return (
      <main className="min-h-screen bg-[#09090b] text-white">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <p className="mb-2 text-sm font-medium text-violet-400">
            AI INTERVIEW COACH
          </p>

          <h1 className="text-2xl font-semibold">Interview not found</h1>

          <p className="mt-3 text-sm text-zinc-500">
            This interview may have been removed or the link is incorrect.
          </p>

          <button
            onClick={() => router.push("/dashboard")}
            className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            ← Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error || !session) {
    return (
      <main className="min-h-screen bg-[#09090b] text-white">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
            <p className="text-sm text-red-400">
              {error || "Unable to load this interview."}
            </p>

            <button
              onClick={() => fetchInterview()}
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
  // DERIVED DATA
  // ============================================================

  const questions: QuestionWithEvaluation[] = session.questions.map((q) => ({
    question: q.question,
    answer: q.answer,
    evaluation: parseEvaluation(q.evaluation),
  }));

  const validEvaluations = questions
    .map((q) => q.evaluation)
    .filter(
      (evaluation): evaluation is EvaluationScores => evaluation !== null,
    );

  const overallScore = average(validEvaluations.map((e) => e.overall_score));
  const avgCorrectness = average(validEvaluations.map((e) => e.correctness));
  const avgClarity = average(validEvaluations.map((e) => e.clarity));
  const avgCompleteness = average(validEvaluations.map((e) => e.completeness));
  const avgRelevance = average(validEvaluations.map((e) => e.relevance));

  // Aggregated (deduplicated) from each question's own evaluation —
  // the backend has no interview-level strengths/weaknesses field.
  const allStrengths = Array.from(
    new Set(validEvaluations.flatMap((e) => e.strengths).filter(Boolean)),
  );

  const allAreasForImprovement = Array.from(
    new Set(
      validEvaluations.flatMap((e) => e.areas_for_improvement).filter(Boolean),
    ),
  );

  const interviewTypeDisplay = formatInterviewType(session.interview_type);
  const difficultyDisplay = formatDifficulty(session.difficulty);
  const roleDisplay = session.role ? toTitleCase(session.role) : "Unknown Role";

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-zinc-500";
    if (score >= 8) return "text-emerald-400";
    if (score >= 6) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBackground = (score: number | null) => {
    if (score === null) return "bg-white/5";
    if (score >= 8) return "bg-emerald-500/10";
    if (score >= 6) return "bg-yellow-500/10";
    return "bg-red-500/10";
  };

  const getDifficultyStyle = (difficulty: string) => {
    if (difficulty === "Easy") return "bg-emerald-500/10 text-emerald-400";
    if (difficulty === "Medium") return "bg-yellow-500/10 text-yellow-400";
    return "bg-red-500/10 text-red-400";
  };

  const formatScore = (score: number | null) =>
    score === null ? "N/A" : score.toFixed(1);

  // ============================================================
  // UI
  // ============================================================

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-250px] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute bottom-[-250px] right-[-150px] h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        {/* TOP NAV */}

        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-sm text-zinc-500 transition hover:text-white"
          >
            ← Back to Dashboard
          </button>

          <button
            onClick={() => router.push("/interview")}
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            New Interview →
          </button>
        </div>

        {/* HEADER */}

        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-violet-400">
            INTERVIEW PERFORMANCE
          </p>

          <h1 className="text-3xl font-semibold tracking-tight">
            Interview Analysis
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Detailed analysis of your interview performance.
          </p>
        </div>

        {/* INTERVIEW INFO */}

        <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold text-zinc-100">
                  {roleDisplay}
                </h2>

                <span className="rounded-lg bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-400">
                  {interviewTypeDisplay}
                </span>

                <span
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium ${getDifficultyStyle(
                    difficultyDisplay,
                  )}`}
                >
                  {difficultyDisplay}
                </span>

                {session.status !== "COMPLETED" && (
                  <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-400">
                    {session.status}
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-600">
                <span>{session.duration} minutes</span>
                <span>Date unavailable</span>
                <span>Interview ID: {session.interview_id}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div
                className={`flex h-24 w-24 items-center justify-center rounded-full border-8 border-violet-500/20 ${getScoreBackground(
                  overallScore,
                )}`}
              >
                <div className="text-center">
                  <p
                    className={`text-2xl font-bold ${getScoreColor(overallScore)}`}
                  >
                    {formatScore(overallScore)}
                  </p>
                  <p className="text-[10px] text-zinc-600">/ 10</p>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-600">
                  Overall Score
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  {overallScore === null
                    ? "No evaluated answers yet"
                    : overallScore >= 8
                      ? "Strong performance"
                      : overallScore >= 6
                        ? "Solid performance"
                        : "Needs improvement"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SCORE BREAKDOWN */}

        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Performance Breakdown</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Your average performance across all answers.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Correctness", value: avgCorrectness },
              { label: "Clarity", value: avgClarity },
              { label: "Completeness", value: avgCompleteness },
              { label: "Relevance", value: avgRelevance },
            ].map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"
              >
                <p className="text-sm text-zinc-400">{metric.label}</p>

                <div className="mt-3 flex items-end justify-between">
                  <p
                    className={`text-2xl font-semibold ${getScoreColor(
                      metric.value,
                    )}`}
                  >
                    {formatScore(metric.value)}
                  </p>
                  <span className="mb-1 text-xs text-zinc-600">/10</span>
                </div>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
                    style={{ width: `${(metric.value ?? 0) * 10}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* STRENGTHS / AREAS TO IMPROVE */}

        {(allStrengths.length > 0 || allAreasForImprovement.length > 0) && (
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-emerald-500/10 bg-white/[0.035] p-6">
              <div className="mb-5">
                <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">
                  What you did well
                </p>
                <h2 className="mt-1 text-xl font-semibold">Strengths</h2>
              </div>

              {allStrengths.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  No strengths recorded yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {allStrengths.map((strength, index) => (
                    <div
                      key={index}
                      className="flex gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-4"
                    >
                      <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs text-emerald-400">
                        ✓
                      </div>
                      <p className="text-sm leading-6 text-zinc-400">
                        {strength}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-yellow-500/10 bg-white/[0.035] p-6">
              <div className="mb-5">
                <p className="text-xs font-medium uppercase tracking-wider text-yellow-400">
                  Areas to improve
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  Areas for Improvement
                </h2>
              </div>

              {allAreasForImprovement.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  No improvement areas recorded yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {allAreasForImprovement.map((item, index) => (
                    <div
                      key={index}
                      className="flex gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-4"
                    >
                      <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-yellow-500/10 text-xs text-yellow-400">
                        !
                      </div>
                      <p className="text-sm leading-6 text-zinc-400">{item}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* QUESTIONS & ANSWERS */}

        <div className="mb-8">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">
              Question-by-Question Analysis
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Review each answer and the AI evaluation.
            </p>
          </div>

          <div className="space-y-4">
            {questions.map((item, index) => {
              const isExpanded = expandedIndex === index;

              return (
                <div
                  key={index}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]"
                >
                  <button
                    onClick={() => setExpandedIndex(isExpanded ? null : index)}
                    className="flex w-full items-center justify-between gap-5 p-6 text-left transition hover:bg-white/[0.025]"
                  >
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-sm font-semibold text-violet-400">
                        {index + 1}
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wider text-zinc-600">
                          Question {index + 1}
                        </p>
                        <h3 className="mt-1 line-clamp-2 text-sm font-medium leading-6 text-zinc-200">
                          {item.question}
                        </h3>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-4">
                      <div className="hidden text-right sm:block">
                        <p className="text-xs text-zinc-600">Score</p>
                        <p
                          className={`mt-1 font-semibold ${getScoreColor(
                            item.evaluation?.overall_score ?? null,
                          )}`}
                        >
                          {formatScore(item.evaluation?.overall_score ?? null)}
                        </p>
                      </div>
                      <span className="text-zinc-600">
                        {isExpanded ? "−" : "+"}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-white/[0.06] p-6">
                      <div className="mb-6">
                        <p className="mb-2 text-xs uppercase tracking-wider text-zinc-600">
                          Question
                        </p>
                        <p className="text-sm leading-7 text-zinc-200">
                          {item.question}
                        </p>
                      </div>

                      <div className="mb-6">
                        <p className="mb-2 text-xs uppercase tracking-wider text-zinc-600">
                          Your Answer
                        </p>
                        <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-5">
                          <p className="text-sm leading-7 text-zinc-400">
                            {item.answer && item.answer.trim()
                              ? item.answer
                              : "No answer submitted."}
                          </p>
                        </div>
                      </div>

                      {item.evaluation ? (
                        <>
                          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                            {[
                              ["Correctness", item.evaluation.correctness],
                              ["Clarity", item.evaluation.clarity],
                              ["Completeness", item.evaluation.completeness],
                              ["Relevance", item.evaluation.relevance],
                            ].map(([label, score]) => (
                              <div
                                key={label as string}
                                className="rounded-xl border border-white/[0.06] bg-black/20 p-4"
                              >
                                <p className="text-xs text-zinc-600">
                                  {label as string}
                                </p>
                                <p
                                  className={`mt-2 text-lg font-semibold ${getScoreColor(
                                    score as number,
                                  )}`}
                                >
                                  {(score as number).toFixed(1)}
                                  <span className="ml-1 text-xs text-zinc-600">
                                    /10
                                  </span>
                                </p>
                              </div>
                            ))}
                          </div>

                          {item.evaluation.final_feedback && (
                            <div className="rounded-2xl border border-violet-500/10 bg-violet-500/[0.04] p-5">
                              <p className="text-xs font-medium uppercase tracking-wider text-violet-400">
                                AI Feedback
                              </p>
                              <p className="mt-3 text-sm leading-7 text-zinc-400">
                                {item.evaluation.final_feedback}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-5">
                          <p className="text-sm text-zinc-500">
                            This question has not been evaluated yet.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* BOTTOM ACTIONS */}

        <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:flex-row">
          <div>
            <p className="font-medium text-zinc-200">
              Ready for another interview?
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              Practice consistently to improve your performance.
            </p>
          </div>

          <button
            onClick={() => router.push("/interview")}
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            Start New Interview →
          </button>
        </div>
      </div>
    </main>
  );
}
