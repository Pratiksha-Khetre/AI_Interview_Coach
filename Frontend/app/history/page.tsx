"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, ChevronRight, Search, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import {
  getUserInterviews,
  type StoredInterviewReport,
} from "@/lib/interviews-store";

// ============================================================
// HELPERS
// ============================================================

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

function formatDate(timestamp: StoredInterviewReport["completedAt"]): string {
  if (!timestamp) return "Date unavailable";

  return timestamp.toDate().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ============================================================
// DIFFICULTY BADGE
// ============================================================

function DifficultyBadge({ value }: { value: string }) {
  const normalized = value?.toLowerCase();

  const tone =
    normalized === "hard"
      ? "bg-rose-400/10 text-rose-300"
      : normalized === "medium"
        ? "bg-amber-400/10 text-amber-300"
        : "bg-emerald-400/10 text-emerald-300";

  return (
    <span className={`rounded-md px-2 py-1 text-[10px] font-semibold ${tone}`}>
      {formatDifficulty(value)}
    </span>
  );
}

// ============================================================
// SCORE BADGE
// ============================================================

function ScoreBadge({ score }: { score: number }) {
  const percentage = Math.round(score * 10);

  const tone =
    percentage >= 80
      ? "text-emerald-300"
      : percentage >= 60
        ? "text-amber-300"
        : "text-rose-300";

  return <span className={`text-lg font-semibold ${tone}`}>{percentage}%</span>;
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function HistoryPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [interviews, setInterviews] = useState<StoredInterviewReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  // ============================================================
  // LOAD INTERVIEW HISTORY FROM FIRESTORE
  // ============================================================

  useEffect(() => {
    if (!user) {
      setInterviews([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadHistory() {
      try {
        setLoading(true);
        setError(null);

        const data = await getUserInterviews(user.uid);

        if (!cancelled) {
          setInterviews(data);
        }
      } catch (err) {
        console.error("Failed to load interview history:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load interview history.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // ============================================================
  // FILTER INTERVIEWS
  // ============================================================

  const filteredInterviews = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return interviews.filter((interview) => {
      const role = interview.role?.toLowerCase() ?? "";
      const interviewType = interview.interviewType?.toLowerCase() ?? "";
      const difficulty = interview.difficulty?.toLowerCase() ?? "";

      const matchesSearch =
        searchValue === "" ||
        role.includes(searchValue) ||
        interviewType.includes(searchValue);

      const matchesType =
        typeFilter === "all" || interviewType === typeFilter.toLowerCase();

      const matchesDifficulty =
        difficultyFilter === "all" ||
        difficulty === difficultyFilter.toLowerCase();

      return matchesSearch && matchesType && matchesDifficulty;
    });
  }, [interviews, search, typeFilter, difficultyFilter]);

  // ============================================================
  // RETRY
  // ============================================================

  const retry = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const data = await getUserInterviews(user.uid);

      setInterviews(data);
    } catch (err) {
      console.error("Failed to reload history:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load interview history.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0d0f15] text-slate-100">
        <div className="text-center">
          <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-4 border-white/10 border-t-indigo-400" />

          <p className="text-sm text-slate-500">Loading interview history...</p>
        </div>
      </main>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0d0f15] px-6 text-slate-100">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-300">
            <BookOpen className="size-5" />
          </div>

          <h2 className="text-xl font-semibold">Unable to load history</h2>

          <p className="mt-2 text-sm text-slate-500">{error}</p>

          <div className="mt-6 flex justify-center gap-3">
            <Button
              onClick={retry}
              className="bg-indigo-500 text-white hover:bg-indigo-500/85"
            >
              Retry
            </Button>

            <Button
              onClick={() => router.push("/")}
              variant="ghost"
              className="border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
            >
              Dashboard
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // ============================================================
  // EMPTY HISTORY
  // ============================================================

  if (interviews.length === 0) {
    return (
      <main className="min-h-screen bg-[#0d0f15] px-5 py-8 text-slate-100 md:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <button
            onClick={() => router.push("/")}
            className="mb-8 flex items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-slate-200"
          >
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </button>

          <div className="flex min-h-[65vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-300">
                <BookOpen className="size-6" />
              </div>

              <h1 className="text-2xl font-semibold text-white">
                No interviews yet
              </h1>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Complete your first interview and your report will automatically
                appear here.
              </p>

              <Button
                onClick={() => router.push("/interview")}
                className="mt-6 bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-400"
              >
                <Play data-icon="inline-start" />
                Start New Interview
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ============================================================
  // MAIN HISTORY PAGE
  // ============================================================

  return (
    <main className="min-h-screen bg-[#0d0f15] px-5 py-8 text-slate-100 md:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        {/* ====================================================== */}
        {/* HEADER */}
        {/* ====================================================== */}

        <div className="mb-7">
          <button
            onClick={() => router.push("/")}
            className="mb-6 flex items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-slate-200"
          >
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </button>

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-400">
                Your workspace
              </p>

              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl">
                Interview History
              </h1>

              <p className="mt-1.5 text-sm text-slate-500">
                Review your completed interviews and performance.
              </p>
            </div>

            <Button
              onClick={() => router.push("/interview")}
              className="h-10 rounded-lg bg-indigo-500 px-4 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-400"
            >
              <Play data-icon="inline-start" />
              Start New Interview
            </Button>
          </div>
        </div>

        {/* ====================================================== */}
        {/* SUMMARY */}
        {/* ====================================================== */}

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/[0.07] bg-[#151823] p-4">
            <p className="text-[11px] text-slate-500">Total Interviews</p>

            <p className="mt-2 text-2xl font-semibold text-white">
              {interviews.length}
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-[#151823] p-4">
            <p className="text-[11px] text-slate-500">Average Score</p>

            <p className="mt-2 text-2xl font-semibold text-white">
              {Math.round(
                (interviews.reduce((sum, item) => sum + item.overallScore, 0) /
                  interviews.length) *
                  10,
              )}
              %
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-[#151823] p-4">
            <p className="text-[11px] text-slate-500">Best Score</p>

            <p className="mt-2 text-2xl font-semibold text-white">
              {Math.round(
                Math.max(...interviews.map((item) => item.overallScore)) * 10,
              )}
              %
            </p>
          </div>
        </div>

        {/* ====================================================== */}
        {/* FILTERS */}
        {/* ====================================================== */}

        <div className="mb-6 rounded-xl border border-white/[0.07] bg-[#151823] p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {/* SEARCH */}

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />

              <input
                type="text"
                placeholder="Search by role or interview type..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] py-2.5 pl-9 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 transition focus:border-indigo-400/50 focus:ring-3 focus:ring-indigo-400/20"
              />
            </div>

            {/* TYPE */}

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="rounded-lg border border-white/[0.08] bg-[#11131c] px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-indigo-400/50 focus:ring-3 focus:ring-indigo-400/20"
            >
              <option value="all">All Interview Types</option>
              <option value="hr">HR</option>
              <option value="technical">Technical</option>
              <option value="managerial">Managerial</option>
            </select>

            {/* DIFFICULTY */}

            <select
              value={difficultyFilter}
              onChange={(event) => setDifficultyFilter(event.target.value)}
              className="rounded-lg border border-white/[0.08] bg-[#11131c] px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-indigo-400/50 focus:ring-3 focus:ring-indigo-400/20"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* ====================================================== */}
        {/* FILTER RESULT COUNT */}
        {/* ====================================================== */}

        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-300">
              {filteredInterviews.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-300">
              {interviews.length}
            </span>{" "}
            interviews
          </p>

          {(search || typeFilter !== "all" || difficultyFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setTypeFilter("all");
                setDifficultyFilter("all");
              }}
              className="text-xs font-medium text-indigo-300 hover:text-indigo-200"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* ====================================================== */}
        {/* NO FILTER MATCH */}
        {/* ====================================================== */}

        {filteredInterviews.length === 0 ? (
          <div className="rounded-xl border border-white/[0.07] bg-[#151823] p-10 text-center">
            <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-white/[0.04] text-slate-400">
              <Search className="size-5" />
            </div>

            <h2 className="text-lg font-semibold text-slate-100">
              No matching interviews
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          /* ==================================================== */
          /* INTERVIEW LIST */
          /* ==================================================== */

          <div className="rounded-xl border border-white/[0.07] bg-[#151823] p-4">
            <div className="flex flex-col gap-2">
              {filteredInterviews.map((interview) => (
                <div
                  key={interview.interviewId}
                  className="group flex flex-wrap items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.015] p-3.5 transition-all hover:border-indigo-400/15 hover:bg-white/[0.04] md:flex-nowrap"
                >
                  {/* TYPE ICON */}

                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-[10px] font-bold text-indigo-300">
                    {formatInterviewType(interview.interviewType)
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>

                  {/* ROLE + DATE */}

                  <div className="min-w-[180px] flex-1">
                    <p className="text-xs font-semibold text-slate-200">
                      {formatRole(interview.role)}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-500">
                      {formatInterviewType(interview.interviewType)} ·{" "}
                      {interview.duration} min ·{" "}
                      {formatDate(interview.completedAt)}
                    </p>
                  </div>

                  {/* DIFFICULTY */}

                  <DifficultyBadge value={interview.difficulty} />

                  {/* SCORE */}

                  <ScoreBadge score={interview.overallScore} />

                  {/* STATUS */}

                  <span className="hidden rounded-md bg-emerald-400/10 px-2 py-1 text-[10px] font-medium text-emerald-300 sm:inline">
                    Completed
                  </span>

                  {/* REPORT */}

                  <button
                    onClick={() =>
                      router.push(`/history/${interview.interviewId}`)
                    }
                    className="flex items-center text-xs font-medium text-indigo-300 transition hover:text-indigo-200"
                  >
                    View Report
                    <ChevronRight className="ml-0.5 size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
