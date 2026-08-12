// Frontend/app/interview-details/page.tsx

"use client";

import { useState } from "react";

type Evaluation = {
  correctness: number;
  clarity: number;
  completeness: number;
  relevance: number;
  overall_score: number;
};

type QuestionResult = {
  id: number;
  question: string;
  answer: string;
  evaluation: Evaluation;
  feedback: string;
};

const mockInterview = {
  id: "interview-001",
  role: "Machine Learning Engineer",
  type: "Technical",
  difficulty: "Medium",
  duration: 30,
  date: "08 Aug 2026",
  overallScore: 8.4,

  strengths: [
    "Good understanding of machine learning fundamentals.",
    "Answers were mostly relevant to the questions.",
    "You explained technical concepts using practical examples.",
  ],

  weaknesses: [
    "Some answers could be more structured.",
    "A few technical explanations lacked depth.",
    "Try to give more concise answers instead of over-explaining.",
  ],

  suggestions: [
    "Use the STAR structure for experience-based questions.",
    "Explain technical concepts with a short example.",
    "Practice answering technical questions within 1–2 minutes.",
  ],

  questions: [
    {
      id: 1,
      question:
        "What is the difference between supervised and unsupervised learning?",

      answer:
        "Supervised learning uses labeled data to train the model, while unsupervised learning works with unlabeled data. Classification and regression are examples of supervised learning, while clustering is an example of unsupervised learning.",

      evaluation: {
        correctness: 9,
        clarity: 8,
        completeness: 8,
        relevance: 9,
        overall_score: 8.5,
      },

      feedback:
        "Your answer correctly explains the main difference and provides appropriate examples. You could improve it by briefly mentioning the goal of each learning approach.",
    },

    {
      id: 2,
      question:
        "What is overfitting in machine learning and how can you prevent it?",

      answer:
        "Overfitting happens when a model performs very well on training data but poorly on unseen data. We can prevent it using regularization, cross validation, dropout and by collecting more data.",

      evaluation: {
        correctness: 9,
        clarity: 8,
        completeness: 8,
        relevance: 9,
        overall_score: 8.5,
      },

      feedback:
        "Good answer with several valid prevention techniques. Adding an explanation of why regularization and cross-validation help would make the answer stronger.",
    },

    {
      id: 3,
      question: "Explain the difference between precision and recall.",

      answer:
        "Precision tells us how many predicted positives were actually positive. Recall tells us how many actual positives were correctly identified by the model.",

      evaluation: {
        correctness: 9,
        clarity: 9,
        completeness: 7,
        relevance: 10,
        overall_score: 8.7,
      },

      feedback:
        "The definitions are correct and concise. You could improve completeness by including the formulas or a simple real-world example.",
    },
  ],
};

export default function InterviewDetailsPage() {
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(1);

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-emerald-400";
    if (score >= 6) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBackground = (score: number) => {
    if (score >= 8) return "bg-emerald-500/10";
    if (score >= 6) return "bg-yellow-500/10";
    return "bg-red-500/10";
  };

  const getDifficultyStyle = (difficulty: string) => {
    if (difficulty === "Easy") {
      return "bg-emerald-500/10 text-emerald-400";
    }

    if (difficulty === "Medium") {
      return "bg-yellow-500/10 text-yellow-400";
    }

    return "bg-red-500/10 text-red-400";
  };

  const averageMetric = (metric: keyof Evaluation) => {
    const values = mockInterview.questions.map(
      (item) => item.evaluation[metric],
    );

    return values.reduce((sum, value) => sum + value, 0) / values.length;
  };

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      {/* ================================================= */}
      {/* BACKGROUND */}
      {/* ================================================= */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-250px] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-3xl" />

        <div className="absolute bottom-[-250px] right-[-150px] h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        {/* ================================================= */}
        {/* TOP NAV */}
        {/* ================================================= */}

        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => {
              window.location.href = "/dashboard";
            }}
            className="flex items-center gap-2 text-sm text-zinc-500 transition hover:text-white"
          >
            ← Back to Dashboard
          </button>

          <button
            onClick={() => {
              window.location.href = "/interview";
            }}
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            New Interview →
          </button>
        </div>

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

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

        {/* ================================================= */}
        {/* INTERVIEW INFO */}
        {/* ================================================= */}

        <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold text-zinc-100">
                  {mockInterview.role}
                </h2>

                <span className="rounded-lg bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-400">
                  {mockInterview.type}
                </span>

                <span
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium ${getDifficultyStyle(
                    mockInterview.difficulty,
                  )}`}
                >
                  {mockInterview.difficulty}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-600">
                <span>{mockInterview.duration} minutes</span>

                <span>{mockInterview.date}</span>

                <span>Interview ID: {mockInterview.id}</span>
              </div>
            </div>

            {/* Score */}

            <div className="flex items-center gap-4">
              <div
                className={`flex h-24 w-24 items-center justify-center rounded-full border-8 border-violet-500/20 ${getScoreBackground(
                  mockInterview.overallScore,
                )}`}
              >
                <div className="text-center">
                  <p
                    className={`text-2xl font-bold ${getScoreColor(
                      mockInterview.overallScore,
                    )}`}
                  >
                    {mockInterview.overallScore.toFixed(1)}
                  </p>

                  <p className="text-[10px] text-zinc-600">/ 10</p>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-600">
                  Overall Score
                </p>

                <p className="mt-1 text-sm text-zinc-400">Strong performance</p>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* SCORE BREAKDOWN */}
        {/* ================================================= */}

        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Performance Breakdown</h2>

            <p className="mt-1 text-sm text-zinc-500">
              Your average performance across all answers.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              {
                label: "Correctness",
                value: averageMetric("correctness"),
              },
              {
                label: "Clarity",
                value: averageMetric("clarity"),
              },
              {
                label: "Completeness",
                value: averageMetric("completeness"),
              },
              {
                label: "Relevance",
                value: averageMetric("relevance"),
              },
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
                    {metric.value.toFixed(1)}
                  </p>

                  <span className="mb-1 text-xs text-zinc-600">/10</span>
                </div>

                {/* Progress */}

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
                    style={{
                      width: `${metric.value * 10}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================================================= */}
        {/* STRENGTHS / WEAKNESSES */}
        {/* ================================================= */}

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Strengths */}

          <div className="rounded-3xl border border-emerald-500/10 bg-white/[0.035] p-6">
            <div className="mb-5">
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">
                What you did well
              </p>

              <h2 className="mt-1 text-xl font-semibold">Strengths</h2>
            </div>

            <div className="space-y-4">
              {mockInterview.strengths.map((strength, index) => (
                <div
                  key={index}
                  className="flex gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-4"
                >
                  <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs text-emerald-400">
                    ✓
                  </div>

                  <p className="text-sm leading-6 text-zinc-400">{strength}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Weaknesses */}

          <div className="rounded-3xl border border-yellow-500/10 bg-white/[0.035] p-6">
            <div className="mb-5">
              <p className="text-xs font-medium uppercase tracking-wider text-yellow-400">
                Areas to improve
              </p>

              <h2 className="mt-1 text-xl font-semibold">Weaknesses</h2>
            </div>

            <div className="space-y-4">
              {mockInterview.weaknesses.map((weakness, index) => (
                <div
                  key={index}
                  className="flex gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-4"
                >
                  <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-yellow-500/10 text-xs text-yellow-400">
                    !
                  </div>

                  <p className="text-sm leading-6 text-zinc-400">{weakness}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* IMPROVEMENT SUGGESTIONS */}
        {/* ================================================= */}

        <div className="mb-8 rounded-3xl border border-violet-500/10 bg-white/[0.035] p-6">
          <div className="mb-5">
            <p className="text-xs font-medium uppercase tracking-wider text-violet-400">
              AI Recommendations
            </p>

            <h2 className="mt-1 text-xl font-semibold">How to improve</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {mockInterview.suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/[0.06] bg-black/20 p-5"
              >
                <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-sm font-semibold text-violet-400">
                  {index + 1}
                </div>

                <p className="text-sm leading-6 text-zinc-400">{suggestion}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ================================================= */}
        {/* QUESTIONS & ANSWERS */}
        {/* ================================================= */}

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
            {mockInterview.questions.map((item) => {
              const isExpanded = expandedQuestion === item.id;

              return (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]"
                >
                  {/* Question header */}

                  <button
                    onClick={() =>
                      setExpandedQuestion(isExpanded ? null : item.id)
                    }
                    className="flex w-full items-center justify-between gap-5 p-6 text-left transition hover:bg-white/[0.025]"
                  >
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-sm font-semibold text-violet-400">
                        {item.id}
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wider text-zinc-600">
                          Question {item.id}
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
                            item.evaluation.overall_score,
                          )}`}
                        >
                          {item.evaluation.overall_score.toFixed(1)}
                        </p>
                      </div>

                      <span className="text-zinc-600">
                        {isExpanded ? "−" : "+"}
                      </span>
                    </div>
                  </button>

                  {/* Expanded content */}

                  {isExpanded && (
                    <div className="border-t border-white/[0.06] p-6">
                      {/* Question */}

                      <div className="mb-6">
                        <p className="mb-2 text-xs uppercase tracking-wider text-zinc-600">
                          Question
                        </p>

                        <p className="text-sm leading-7 text-zinc-200">
                          {item.question}
                        </p>
                      </div>

                      {/* User answer */}

                      <div className="mb-6">
                        <p className="mb-2 text-xs uppercase tracking-wider text-zinc-600">
                          Your Answer
                        </p>

                        <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-5">
                          <p className="text-sm leading-7 text-zinc-400">
                            {item.answer}
                          </p>
                        </div>
                      </div>

                      {/* Metrics */}

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

                      {/* AI Feedback */}

                      <div className="rounded-2xl border border-violet-500/10 bg-violet-500/[0.04] p-5">
                        <p className="text-xs font-medium uppercase tracking-wider text-violet-400">
                          AI Feedback
                        </p>

                        <p className="mt-3 text-sm leading-7 text-zinc-400">
                          {item.feedback}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ================================================= */}
        {/* BOTTOM ACTIONS */}
        {/* ================================================= */}

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
            onClick={() => {
              window.location.href = "/interview";
            }}
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            Start New Interview →
          </button>
        </div>
      </div>
    </main>
  );
}
