"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  ChevronRight,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PerformanceChart } from "@/components/performance-chart";
import {
  getUserInterviews,
  type StoredInterviewReport,
} from "@/lib/interviews-store";
import { useAuth } from "@/lib/auth-context";

// ============================================================
// HELPERS
// ============================================================

function average(values: number[]): number {
  if (values.length === 0) return 0;

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatRole(role: string): string {
  if (!role) return "Unknown Role";

  return role
    .split(" ")
    .map((word) => {
      if (word.toLowerCase() === "ml") return "ML";
      if (word.toLowerCase() === "ai") return "AI";
      if (word.toLowerCase() === "hr") return "HR";

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function formatInterviewType(type: string): string {
  if (!type) return "Unknown";

  const normalized = type.toLowerCase();

  if (normalized === "hr") return "HR";
  if (normalized === "technical") return "Technical";
  if (normalized === "managerial") return "Managerial";

  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

function formatDifficulty(difficulty: string): string {
  if (!difficulty) return "Unknown";

  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
}

function getScoreTone(score: number): string {
  if (score >= 80) {
    return "bg-emerald-400/10 text-emerald-300";
  }

  if (score >= 60) {
    return "bg-amber-400/10 text-amber-300";
  }

  return "bg-rose-400/10 text-rose-300";
}

// ============================================================
// PROGRESS BAR
// ============================================================

function SkillBar({ label, value }: { label: string; value: number }) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>

        <span className="text-xs font-semibold text-slate-200">
          {Math.round(safeValue)}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400 transition-all duration-700"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  label,
  value,
  description,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  description: string;
  icon: typeof Target;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#151823] p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium text-slate-500">{label}</p>

          <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-slate-500">{description}</p>
        </div>

        <div
          className={`flex size-9 items-center justify-center rounded-lg ${tone}`}
        >
          <Icon className="size-4" />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PAGE
// ============================================================

export default function PerformancePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [interviews, setInterviews] = useState<StoredInterviewReport[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ==========================================================
  // LOAD FIRESTORE DATA
  // ==========================================================

  useEffect(() => {
    if (!user) {
      setInterviews([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    setLoading(true);
    setError(null);

    getUserInterviews(user.uid)
      .then((data) => {
        if (!cancelled) {
          setInterviews(data);
        }
      })
      .catch((err) => {
        console.error("Failed to load performance data:", err);

        if (!cancelled) {
          setError("Unable to load your performance data.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  // ==========================================================
  // PERFORMANCE STATISTICS
  // ==========================================================

  const stats = useMemo(() => {
    if (interviews.length === 0) {
      return {
        averageScore: 0,
        bestScore: 0,
        correctness: 0,
        clarity: 0,
        completeness: 0,
        relevance: 0,
        averageWpm: 0,
        averageAnswerDuration: 0,
        totalFillerWords: 0,
      };
    }

    const scores = interviews.map((interview) => interview.overallScore * 10);

    const correctness = interviews.map(
      (interview) => interview.correctness * 10,
    );

    const clarity = interviews.map((interview) => interview.clarity * 10);

    const completeness = interviews.map(
      (interview) => interview.completeness * 10,
    );

    const relevance = interviews.map((interview) => interview.relevance * 10);

    const communicationReports = interviews
      .map((interview) => interview.communicationAnalysis)
      .filter(Boolean);

    return {
      averageScore: average(scores),
      bestScore: Math.max(...scores),

      correctness: average(correctness),
      clarity: average(clarity),
      completeness: average(completeness),
      relevance: average(relevance),

      averageWpm: average(
        communicationReports.map((item) => item?.average_wpm ?? 0),
      ),

      averageAnswerDuration: average(
        communicationReports.map((item) => item?.average_answer_duration ?? 0),
      ),

      totalFillerWords: communicationReports.reduce(
        (sum, item) => sum + (item?.total_filler_words ?? 0),
        0,
      ),
    };
  }, [interviews]);

  // ==========================================================
  // CHART DATA
  // ==========================================================

  const chartData = useMemo(() => {
    return [...interviews].reverse().map((interview) => ({
      label: interview.completedAt
        ? interview.completedAt.toDate().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "—",

      score: Math.round(interview.overallScore * 10),
    }));
  }, [interviews]);

  // ==========================================================
  // STRONGEST / WEAKEST SKILLS
  // ==========================================================

  const skillRanking = useMemo(() => {
    const skills = [
      {
        label: "Correctness",
        value: stats.correctness,
      },
      {
        label: "Clarity",
        value: stats.clarity,
      },
      {
        label: "Completeness",
        value: stats.completeness,
      },
      {
        label: "Relevance",
        value: stats.relevance,
      },
    ];

    return [...skills].sort((a, b) => b.value - a.value);
  }, [stats]);

  const strongestSkill = skillRanking[0];
  const weakestSkill = skillRanking[skillRanking.length - 1];

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0d0f15]">
        <div className="text-center">
          <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-4 border-white/10 border-t-indigo-400" />

          <p className="text-sm text-slate-500">Loading performance...</p>
        </div>
      </main>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0d0f15] px-6">
        <div className="max-w-md text-center">
          <BarChart3 className="mx-auto mb-4 size-10 text-indigo-400" />

          <h2 className="text-xl font-semibold text-white">
            Unable to load performance
          </h2>

          <p className="mt-2 text-sm text-slate-500">{error}</p>

          <Button
            onClick={() => window.location.reload()}
            className="mt-6 bg-indigo-500 text-white hover:bg-indigo-400"
          >
            Try Again
          </Button>
        </div>
      </main>
    );
  }

  // ==========================================================
  // EMPTY
  // ==========================================================

  if (interviews.length === 0) {
    return (
      <main className="min-h-screen bg-[#0d0f15] px-5 py-10 text-slate-100 md:px-8">
        <div className="mx-auto max-w-5xl">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="mb-8 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft data-icon="inline-start" />
            Dashboard
          </Button>

          <div className="rounded-2xl border border-white/[0.07] bg-[#151823] p-10 text-center">
            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
              <BarChart3 className="size-6" />
            </div>

            <h1 className="text-2xl font-semibold text-white">
              No performance data yet
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Complete your first interview and your performance analytics will
              appear here.
            </p>

            <Button
              onClick={() => router.push("/interview")}
              className="mt-6 bg-indigo-500 text-white hover:bg-indigo-400"
            >
              Start New Interview
              <ChevronRight data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================================
  // MAIN PERFORMANCE PAGE
  // ==========================================================

  return (
    <main className="min-h-screen bg-[#0d0f15] px-5 py-8 text-slate-100 md:px-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">
        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-400">
              Analytics
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Performance
            </h1>

            <p className="mt-1.5 text-sm text-slate-500">
              Track your interview performance and identify areas for
              improvement.
            </p>
          </div>

          <Button
            onClick={() => router.push("/interview")}
            className="bg-indigo-500 text-white hover:bg-indigo-400"
          >
            Start New Interview
          </Button>
        </div>

        {/* ================================================== */}
        {/* TOP STATS */}
        {/* ================================================== */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Average Score"
            value={`${Math.round(stats.averageScore)}%`}
            description={`Across ${interviews.length} interview${
              interviews.length === 1 ? "" : "s"
            }`}
            icon={TrendingUp}
            tone="bg-emerald-500/15 text-emerald-300"
          />

          <StatCard
            label="Best Score"
            value={`${Math.round(stats.bestScore)}%`}
            description="Personal best"
            icon={Target}
            tone="bg-violet-500/15 text-violet-300"
          />

          <StatCard
            label="Average WPM"
            value={
              stats.averageWpm > 0 ? `${Math.round(stats.averageWpm)}` : "—"
            }
            description="Speaking pace"
            icon={Zap}
            tone="bg-amber-500/15 text-amber-300"
          />

          <StatCard
            label="Filler Words"
            value={String(stats.totalFillerWords)}
            description="Detected across interviews"
            icon={BarChart3}
            tone="bg-rose-500/15 text-rose-300"
          />
        </div>

        {/* ================================================== */}
        {/* SCORE TREND */}
        {/* ================================================== */}

        <section className="mt-5 rounded-xl border border-white/[0.07] bg-[#151823] p-5 md:p-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Score Trend
              </h2>

              <p className="mt-1 text-[11px] text-slate-500">
                Your overall score across completed interviews.
              </p>
            </div>

            <span className="text-xs font-medium text-indigo-300">
              {interviews.length} sessions
            </span>
          </div>

          <div className="mt-5">
            <PerformanceChart data={chartData} />
          </div>
        </section>

        {/* ================================================== */}
        {/* SKILL PERFORMANCE */}
        {/* ================================================== */}

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-xl border border-white/[0.07] bg-[#151823] p-5 md:p-6">
            <h2 className="text-sm font-semibold text-slate-100">
              Skill Performance
            </h2>

            <p className="mt-1 text-[11px] text-slate-500">
              Average scores across all your interviews.
            </p>

            <div className="mt-7 flex flex-col gap-6">
              <SkillBar label="Correctness" value={stats.correctness} />

              <SkillBar label="Clarity" value={stats.clarity} />

              <SkillBar label="Completeness" value={stats.completeness} />

              <SkillBar label="Relevance" value={stats.relevance} />
            </div>
          </section>

          {/* ================================================= */}
          {/* INSIGHT */}
          {/* ================================================= */}

          <section className="rounded-xl border border-indigo-400/15 bg-indigo-500/[0.08] p-5 md:p-6">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-indigo-300" />

              <h2 className="text-sm font-semibold text-indigo-100">
                Performance Insight
              </h2>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500">
                  Strongest Area
                </p>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-100">
                    {strongestSkill.label}
                  </span>

                  <span className="text-sm font-semibold text-emerald-300">
                    {Math.round(strongestSkill.value)}%
                  </span>
                </div>
              </div>

              <div className="border-t border-white/[0.07]" />

              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500">
                  Focus Area
                </p>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-100">
                    {weakestSkill.label}
                  </span>

                  <span className="text-sm font-semibold text-amber-300">
                    {Math.round(weakestSkill.value)}%
                  </span>
                </div>
              </div>

              <div className="border-t border-white/[0.07]" />

              <p className="text-sm leading-6 text-slate-400">
                Your strongest area is{" "}
                <span className="font-semibold text-indigo-200">
                  {strongestSkill.label}
                </span>
                . Focus your next practice sessions on{" "}
                <span className="font-semibold text-indigo-200">
                  {weakestSkill.label}
                </span>{" "}
                to improve your overall readiness.
              </p>
            </div>
          </section>
        </div>

        {/* ================================================== */}
        {/* COMMUNICATION */}
        {/* ================================================== */}

        <section className="mt-5 rounded-xl border border-white/[0.07] bg-[#151823] p-5 md:p-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Communication Analysis
            </h2>

            <p className="mt-1 text-[11px] text-slate-500">
              Based on the speech-to-text and answer timing metrics from your
              interviews.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-[11px] text-slate-500">Average Answer Time</p>

              <p className="mt-2 text-xl font-semibold text-white">
                {stats.averageAnswerDuration > 0
                  ? `${stats.averageAnswerDuration.toFixed(1)}s`
                  : "—"}
              </p>
            </div>

            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-[11px] text-slate-500">
                Average Speaking Pace
              </p>

              <p className="mt-2 text-xl font-semibold text-white">
                {stats.averageWpm > 0
                  ? `${Math.round(stats.averageWpm)} WPM`
                  : "—"}
              </p>
            </div>

            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-[11px] text-slate-500">Total Filler Words</p>

              <p className="mt-2 text-xl font-semibold text-white">
                {stats.totalFillerWords}
              </p>
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* RECENT PERFORMANCE */}
        {/* ================================================== */}

        <section className="mt-5 rounded-xl border border-white/[0.07] bg-[#151823] p-5 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Recent Performance
              </h2>

              <p className="mt-1 text-[11px] text-slate-500">
                Your latest completed sessions.
              </p>
            </div>

            <button
              onClick={() => router.push("/history")}
              className="text-xs font-medium text-indigo-300 hover:text-indigo-200"
            >
              View history
              <ChevronRight className="ml-1 inline size-3" />
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-2">
            {interviews.slice(0, 5).map((interview) => {
              const score = interview.overallScore * 10;

              return (
                <div
                  key={interview.interviewId}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.015] p-3 transition hover:bg-white/[0.04] md:flex-nowrap"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-[10px] font-bold text-indigo-300">
                    {formatInterviewType(interview.interviewType)
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-[170px] flex-1">
                    <p className="text-xs font-medium text-slate-200">
                      {formatRole(interview.role)}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-500">
                      {formatInterviewType(interview.interviewType)} ·{" "}
                      {formatDifficulty(interview.difficulty)}
                    </p>
                  </div>

                  <span
                    className={`rounded-md px-2 py-1 text-[10px] font-semibold ${getScoreTone(
                      score,
                    )}`}
                  >
                    {Math.round(score)}%
                  </span>

                  <button
                    onClick={() =>
                      router.push(`/history/${interview.interviewId}`)
                    }
                    className="text-xs font-medium text-indigo-300 hover:text-indigo-200"
                  >
                    View Report
                    <ChevronRight className="inline size-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
