// Frontend\app\history\page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface Evaluation {
  correctness: number;
  clarity: number;
  completeness: number;
  relevance: number;
  overall_score: number;
  strengths: string[];
  areas_for_improvement: string[];
  final_feedback: string;
}

interface InterviewQuestion {
  question: string;
  answer: string | null;
  evaluation: string | Evaluation | null;
}

interface InterviewSession {
  interview_id: string;
  resume_id: string;
  role: string;
  interview_type: string;
  difficulty: string;
  duration: number;
  questions: InterviewQuestion[];
  current_question_index: number;
  status: string;
}

interface HistoryItem extends InterviewSession {
  score: number;
}

/* =========================================================
   DISPLAY HELPERS
   ========================================================= */

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

/* =========================================================
   SAFE EVALUATION PARSER
   ========================================================= */

function parseEvaluation(
  evaluation: string | Evaluation | null,
): Evaluation | null {
  if (!evaluation) {
    return null;
  }

  if (typeof evaluation === "object") {
    return evaluation;
  }

  try {
    return JSON.parse(evaluation);
  } catch {
    console.warn("Unable to parse evaluation:", evaluation);
    return null;
  }
}

/* =========================================================
   SCORE CALCULATION
   ========================================================= */

function computeInterviewScore(questions: InterviewQuestion[]): number {
  const scores: number[] = [];

  for (const question of questions) {
    const evaluation = parseEvaluation(question.evaluation);

    if (!evaluation) continue;

    const score = Number(evaluation.overall_score);

    if (!Number.isNaN(score)) {
      scores.push(score);
    }
  }

  if (scores.length === 0) {
    return 0;
  }

  const total = scores.reduce((sum, score) => sum + score, 0);

  return Number((total / scores.length).toFixed(1));
}

/* =========================================================
   MAIN PAGE
   ========================================================= */

export default function HistoryPage() {
  const router = useRouter();

  const [interviews, setInterviews] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  /* =======================================================
     FETCH HISTORY
     ======================================================= */

  async function fetchHistory() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/history`);

      if (!response.ok) {
        throw new Error(`Failed to fetch history (${response.status})`);
      }

      const data = await response.json();

      const historyData: InterviewSession[] = Array.isArray(data.history)
        ? data.history
        : Array.isArray(data)
          ? data
          : [];

      const completedInterviews: HistoryItem[] = historyData
        .filter((interview) => interview.status === "COMPLETED")
        .map((interview) => ({
          ...interview,
          score: computeInterviewScore(interview.questions || []),
        }));

      setInterviews(completedInterviews);
    } catch (err) {
      console.error("History fetch error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load interview history.",
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     INITIAL LOAD
     ======================================================= */

  useEffect(() => {
    fetchHistory();
  }, []);

  /* =======================================================
     FILTER DATA
     ======================================================= */

  const filteredInterviews = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return interviews.filter((interview) => {
      const matchesSearch =
        searchValue === "" ||
        interview.role.toLowerCase().includes(searchValue) ||
        interview.interview_type.toLowerCase().includes(searchValue);

      const matchesType =
        typeFilter === "all" ||
        interview.interview_type.toLowerCase() === typeFilter.toLowerCase();

      const matchesDifficulty =
        difficultyFilter === "all" ||
        interview.difficulty.toLowerCase() === difficultyFilter.toLowerCase();

      return matchesSearch && matchesType && matchesDifficulty;
    });
  }, [interviews, search, typeFilter, difficultyFilter]);

  /* =======================================================
     LOADING STATE
     ======================================================= */

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-black rounded-full mx-auto mb-4" />

          <p className="text-gray-600">Loading interview history...</p>
        </div>
      </main>
    );
  }

  /* =======================================================
     ERROR STATE
     ======================================================= */

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2">Unable to load history</h2>

          <p className="text-gray-600 mb-6">{error}</p>

          <button
            onClick={fetchHistory}
            className="px-5 py-2 rounded-lg bg-black text-white hover:opacity-90"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  /* =======================================================
     EMPTY STATE
     ======================================================= */

  if (interviews.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">No interviews yet.</h2>

          <p className="text-gray-600 mb-6">
            Complete your first interview to see it here.
          </p>

          <button
            onClick={() => router.push("/interview")}
            className="px-6 py-3 rounded-lg bg-black text-white hover:opacity-90"
          >
            Start New Interview
          </button>
        </div>
      </main>
    );
  }

  /* =======================================================
     PAGE
     ======================================================= */

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Interview History</h1>

            <p className="text-gray-600 mt-1">
              Review your completed interviews and performance.
            </p>
          </div>

          <button
            onClick={() => router.push("/interview")}
            className="px-5 py-3 rounded-lg bg-black text-white hover:opacity-90"
          >
            Start New Interview
          </button>
        </div>

        {/* FILTERS */}

        <div className="bg-white rounded-xl border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* SEARCH */}

            <input
              type="text"
              placeholder="Search by role or interview type..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-black"
            />

            {/* TYPE */}

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="border rounded-lg px-4 py-2"
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
              className="border rounded-lg px-4 py-2"
            >
              <option value="all">All Difficulties</option>

              <option value="easy">Easy</option>

              <option value="medium">Medium</option>

              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* FILTERED EMPTY */}

        {filteredInterviews.length === 0 ? (
          <div className="bg-white border rounded-xl p-10 text-center">
            <h2 className="text-xl font-semibold mb-2">
              No matching interviews
            </h2>

            <p className="text-gray-600">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          /* INTERVIEW TABLE */

          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="text-left px-6 py-4 font-semibold">Role</th>

                    <th className="text-left px-6 py-4 font-semibold">Type</th>

                    <th className="text-left px-6 py-4 font-semibold">
                      Difficulty
                    </th>

                    <th className="text-left px-6 py-4 font-semibold">
                      Duration
                    </th>

                    <th className="text-left px-6 py-4 font-semibold">Score</th>

                    <th className="text-left px-6 py-4 font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredInterviews.map((interview) => (
                    <tr
                      key={interview.interview_id}
                      className="border-b last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium">
                          {formatRole(interview.role)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {formatInterviewType(interview.interview_type)}
                      </td>

                      <td className="px-6 py-4">
                        {formatDifficulty(interview.difficulty)}
                      </td>

                      <td className="px-6 py-4">{interview.duration} min</td>

                      <td className="px-6 py-4">
                        <span
                          className={`font-semibold ${
                            interview.score >= 8
                              ? "text-green-600"
                              : interview.score >= 5
                                ? "text-yellow-600"
                                : "text-red-600"
                          }`}
                        >
                          {interview.score.toFixed(1)}
                          /10
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            router.push(`/history/${interview.interview_id}`)
                          }
                          className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
