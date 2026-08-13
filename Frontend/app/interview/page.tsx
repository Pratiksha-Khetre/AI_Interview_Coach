// Frontend\app\interview\page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const ACTIVE_INTERVIEW_KEY = "activeInterview";

// ============================================================
// BACKEND TYPES
// ============================================================

console.log("🔥 API BASE URL:", API_BASE_URL);

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

type InterviewReport = {
  correctness: number;
  clarity: number;
  completeness: number;
  relevance: number;
  overall_score: number;
};

type ActiveInterviewRecord = {
  interviewId: string;
  startedAt: number;
};

// ============================================================
// STAGE
// ============================================================

type Stage = "restoring" | "config" | "starting" | "active" | "completed";

// ============================================================
// LOCAL STORAGE HELPERS
// ============================================================

function saveActiveInterview(record: ActiveInterviewRecord) {
  try {
    localStorage.setItem(ACTIVE_INTERVIEW_KEY, JSON.stringify(record));
  } catch {
    // Ignore localStorage errors
  }
}

function readActiveInterview(): ActiveInterviewRecord | null {
  try {
    const raw = localStorage.getItem(ACTIVE_INTERVIEW_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed.interviewId !== "string" ||
      typeof parsed.startedAt !== "number"
    ) {
      return null;
    }

    return parsed as ActiveInterviewRecord;
  } catch {
    return null;
  }
}

function clearActiveInterview() {
  try {
    localStorage.removeItem(ACTIVE_INTERVIEW_KEY);
  } catch {
    // Ignore
  }
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function InterviewPage() {
  const router = useRouter();

  // ============================================================
  // STAGE
  // ============================================================

  const [stage, setStage] = useState<Stage>("restoring");
  const [restoreError, setRestoreError] = useState("");

  // ============================================================
  // RESUME
  // ============================================================

  const [resumeId, setResumeId] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeError, setResumeError] = useState("");

  // ============================================================
  // INTERVIEW CONFIGURATION
  // ============================================================

  const [role, setRole] = useState("");
  const [interviewType, setInterviewType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [duration, setDuration] = useState("");

  // ============================================================
  // ACTIVE INTERVIEW
  // ============================================================

  const [interviewId, setInterviewId] = useState("");

  const [sessionMeta, setSessionMeta] = useState<{
    role: string;
    interviewType: string;
    difficulty: string;
    duration: number;
  } | null>(null);

  const [question, setQuestion] = useState<BackendQuestion | null>(null);

  const [questionNumber, setQuestionNumber] = useState(1);

  const [totalQuestions, setTotalQuestions] = useState(0);

  const [answer, setAnswer] = useState("");

  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // ============================================================
  // FINAL REPORT
  // ============================================================

  const [finalReport, setFinalReport] = useState<InterviewReport | null>(null);

  // ============================================================
  // TIMER
  // ============================================================

  const [timeLeft, setTimeLeft] = useState(0);

  const [interviewStartedAt, setInterviewStartedAt] = useState<number | null>(
    null,
  );

  const [timeExpired, setTimeExpired] = useState(false);

  const isLastQuestion = totalQuestions > 0 && questionNumber >= totalQuestions;

  // ============================================================
  // RESTORE INTERVIEW AFTER REFRESH
  // ============================================================

  useEffect(() => {
    const stored = readActiveInterview();

    if (!stored) {
      setStage("config");
      return;
    }

    const restoreInterview = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/interview/${stored.interviewId}`,
        );

        // ------------------------------------------------------
        // SESSION NOT FOUND
        // ------------------------------------------------------

        if (response.status === 404) {
          clearActiveInterview();
          setStage("config");
          return;
        }

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const session: BackendInterviewSession = await response.json();

        // ------------------------------------------------------
        // ALREADY COMPLETED
        // ------------------------------------------------------

        if (session.status === "COMPLETED") {
          clearActiveInterview();

          router.replace(`/history/${session.interview_id}`);

          return;
        }

        // ------------------------------------------------------
        // CURRENT QUESTION
        // ------------------------------------------------------

        const currentQuestion =
          session.questions[session.current_question_index];

        if (!currentQuestion) {
          clearActiveInterview();
          setStage("config");
          return;
        }

        // ------------------------------------------------------
        // RESTORE SESSION DATA
        // ------------------------------------------------------

        setInterviewId(session.interview_id);

        setSessionMeta({
          role: session.role,
          interviewType: session.interview_type,
          difficulty: session.difficulty,
          duration: session.duration,
        });

        setTotalQuestions(session.questions.length);

        setQuestionNumber(session.current_question_index + 1);

        setQuestion(currentQuestion);

        // ------------------------------------------------------
        // RESTORE TIMER
        // ------------------------------------------------------

        const durationSeconds = session.duration * 60;

        const elapsedSeconds = Math.floor(
          (Date.now() - stored.startedAt) / 1000,
        );

        const remaining = Math.max(durationSeconds - elapsedSeconds, 0);

        setTimeLeft(remaining);

        setInterviewStartedAt(stored.startedAt);

        setTimeExpired(remaining <= 0);

        setStage("active");
      } catch (error) {
        console.error("Restore interview error:", error);

        setRestoreError(
          "We couldn't restore your in-progress interview. You can start a new one.",
        );

        clearActiveInterview();

        setStage("config");
      }
    };

    restoreInterview();

    // Only run once when page mounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================
  // TIMER EFFECT
  // ============================================================

  useEffect(() => {
    if (
      stage !== "active" ||
      !question ||
      !interviewStartedAt ||
      timeLeft <= 0 ||
      timeExpired
    ) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          clearInterval(timer);

          setTimeExpired(true);

          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [stage, question, interviewStartedAt, timeLeft, timeExpired]);

  // ============================================================
  // TIMER FORMAT
  // ============================================================

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);

    const remainingSeconds = seconds % 60;

    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const timerWarning = timeLeft <= 60;

  // ============================================================
  // UPLOAD RESUME
  // ============================================================

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setResumeError("");

    setResumeId("");

    setResumeName("");

    setUploadingResume(true);

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/resume/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to upload resume.");
      }

      if (!data.resume_id) {
        throw new Error(
          "Resume uploaded, but backend did not return resume_id.",
        );
      }

      setResumeId(data.resume_id);

      setResumeName(file.name);
    } catch (error) {
      console.error("Resume upload error:", error);

      setResumeError(
        error instanceof Error ? error.message : "Failed to upload resume.",
      );
    } finally {
      setUploadingResume(false);
    }
  };

  // ============================================================
  // START INTERVIEW
  // ============================================================

  const handleStartInterview = async () => {
    if (starting) {
      return;
    }

    setStartError("");

    // ----------------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------------

    if (!resumeId) {
      setStartError("Please upload your resume first.");
      return;
    }

    if (!role.trim()) {
      setStartError("Please enter your target role.");
      return;
    }

    if (!interviewType) {
      setStartError("Please select an interview type.");
      return;
    }

    if (!difficulty) {
      setStartError("Please select difficulty.");
      return;
    }

    if (!duration) {
      setStartError("Please select interview duration.");
      return;
    }

    try {
      setStarting(true);

      setStage("starting");

      // --------------------------------------------------------
      // START INTERVIEW API
      // --------------------------------------------------------

      const response = await fetch(`${API_BASE_URL}/interview_start`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          resume_id: resumeId,
          role: role,
          interview_type: interviewType,
          difficulty: difficulty,
          duration: Number(duration),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || data.message || "Unable to start interview.",
        );
      }

      if (!data.question || !data.interview_id) {
        throw new Error("Interview started but no question was returned.");
      }

      // --------------------------------------------------------
      // START TIMER
      // --------------------------------------------------------

      const startedAt = Date.now();

      // --------------------------------------------------------
      // SAVE SESSION
      // --------------------------------------------------------

      setInterviewId(data.interview_id);

      setSessionMeta({
        role: role,
        interviewType: interviewType,
        difficulty: difficulty,
        duration: Number(duration),
      });

      setQuestion(data.question);

      setTotalQuestions(
        typeof data.total_questions === "number" ? data.total_questions : 1,
      );

      setQuestionNumber(1);

      setAnswer("");

      setTimeLeft(Number(duration) * 60);

      setInterviewStartedAt(startedAt);

      setTimeExpired(false);

      // --------------------------------------------------------
      // SAVE TO LOCAL STORAGE
      // --------------------------------------------------------

      saveActiveInterview({
        interviewId: data.interview_id,
        startedAt,
      });

      // --------------------------------------------------------
      // ACTIVE
      // --------------------------------------------------------

      setStage("active");
    } catch (error) {
      console.error("Start interview error:", error);

      setStartError(
        error instanceof Error ? error.message : "Unable to start interview.",
      );

      setStage("config");
    } finally {
      setStarting(false);
    }
  };

  // ============================================================
  // SUBMIT ANSWER
  // ============================================================
  //
  // IMPORTANT:
  // Backend should ONLY save the answer here.
  //
  // It should NOT evaluate the answer after every question.
  //
  // For normal questions:
  //
  // answer
  //   ↓
  // save answer
  //   ↓
  // return next question
  //
  // For last question:
  //
  // answer
  //   ↓
  // save answer
  //   ↓
  // evaluate all answers
  //   ↓
  // generate final report
  //   ↓
  // return report
  //
  // ============================================================

  const handleSubmitAnswer = async () => {
    if (submitting) {
      return;
    }

    if (!answer.trim()) {
      return;
    }

    if (!interviewId) {
      setSubmitError("Interview session not found.");
      return;
    }

    setSubmitError("");

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/submit_answer`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          interview_id: interviewId,
          answer: answer.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || data.message || "Unable to submit answer.",
        );
      }

      // ========================================================
      // INTERVIEW COMPLETED
      // ========================================================

      if (data.completed) {
        clearActiveInterview();

        setFinalReport(data.report ?? null);

        setQuestion(null);

        setAnswer("");

        setStage("completed");

        return;
      }

      // ========================================================
      // NEXT QUESTION
      // ========================================================

      if (data.question) {
        setQuestion(data.question);

        setQuestionNumber((previous) => previous + 1);

        setAnswer("");

        return;
      }

      // ========================================================
      // DEFENSIVE FALLBACK
      // ========================================================

      throw new Error(
        "Answer was submitted, but no next question was returned.",
      );
    } catch (error) {
      console.error("Submit answer error:", error);

      setSubmitError(
        error instanceof Error ? error.message : "Unable to submit answer.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // NEW INTERVIEW
  // ============================================================

  const handleNewInterview = () => {
    clearActiveInterview();

    // Resume
    setResumeId("");

    setResumeName("");

    setResumeError("");

    // Configuration
    setRole("");

    setInterviewType("");

    setDifficulty("");

    setDuration("");

    // Interview
    setInterviewId("");

    setSessionMeta(null);

    setQuestion(null);

    setQuestionNumber(1);

    setTotalQuestions(0);

    setAnswer("");

    // Loading/errors
    setStarting(false);

    setStartError("");

    setSubmitting(false);

    setSubmitError("");

    setRestoreError("");

    // Report
    setFinalReport(null);

    // Timer
    setTimeLeft(0);

    setInterviewStartedAt(null);

    setTimeExpired(false);

    setStage("config");
  };

  // ============================================================
  // DISPLAY LABELS
  // ============================================================

  const displayInterviewType = (value: string) => {
    switch (value.toLowerCase()) {
      case "technical":
        return "Technical";

      case "managerial":
        return "Managerial";

      case "hr":
        return "HR";

      default:
        return value;
    }
  };

  const displayDifficulty = (value: string) => {
    switch (value.toLowerCase()) {
      case "easy":
        return "Easy";

      case "medium":
        return "Medium";

      case "hard":
        return "Hard";

      default:
        return value;
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      {/* ======================================================
          BACKGROUND GLOW
      ====================================================== */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-250px] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-3xl" />

        <div className="absolute bottom-[-250px] right-[-150px] h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 py-10">
        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="mb-10 flex items-center justify-between gap-6">
          <div>
            <p className="mb-2 text-sm font-medium text-violet-400">
              AI INTERVIEW COACH
            </p>

            <h1 className="text-3xl font-semibold tracking-tight">
              {stage === "completed" ? "Interview Results" : "Mock Interview"}
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              {stage === "completed"
                ? "Here's your performance analysis."
                : stage === "active"
                  ? "Answer the question as you would in a real interview."
                  : "Practice. Perform. Improve."}
            </p>
          </div>

          {/* TIMER */}

          {stage === "active" && question && sessionMeta && (
            <div className="flex flex-wrap items-center justify-end gap-3">
              <div
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  timerWarning
                    ? "border-red-500/30 bg-red-500/10 text-red-400"
                    : "border-white/10 bg-white/[0.04] text-zinc-300"
                }`}
              >
                <span className="mr-2">⏱</span>

                {formatTime(timeLeft)}
              </div>

              <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
                Question{" "}
                <span className="font-semibold text-white">
                  {questionNumber}
                </span>
                {totalQuestions > 0 && ` of ${totalQuestions}`}
              </div>
            </div>
          )}
        </div>

        {/* ====================================================
            RESTORING
        ==================================================== */}

        {stage === "restoring" && (
          <div className="mx-auto max-w-2xl">
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-12 text-center shadow-2xl backdrop-blur-xl">
              <div className="mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-violet-500" />

              <p className="text-sm text-zinc-400">
                Checking for an in-progress interview...
              </p>
            </div>
          </div>
        )}

        {/* ====================================================
            STARTING
        ==================================================== */}

        {stage === "starting" && (
          <div className="mx-auto max-w-2xl">
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-12 text-center shadow-2xl backdrop-blur-xl">
              <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-violet-500" />

              <h2 className="text-xl font-semibold">
                Preparing your interview
              </h2>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                We're analyzing your resume and generating personalized
                interview questions.
              </p>

              <p className="mt-4 text-xs text-zinc-600">
                This may take a few seconds.
              </p>
            </div>
          </div>
        )}

        {/* ====================================================
            CONFIGURATION
        ==================================================== */}

        {stage === "config" && (
          <div className="mx-auto max-w-2xl">
            {restoreError && (
              <div className="mb-5 rounded-xl border border-yellow-500/20 bg-yellow-500/[0.05] px-4 py-3">
                <p className="text-sm text-yellow-400">{restoreError}</p>
              </div>
            )}

            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="mb-8">
                <h2 className="text-xl font-semibold">
                  Configure your interview
                </h2>

                <p className="mt-2 text-sm text-zinc-400">
                  Choose your interview preferences and let AI generate
                  questions based on your resume.
                </p>
              </div>

              <div className="space-y-5">
                {/* RESUME */}

                <div>
                  <label className="mb-2 block text-sm text-zinc-300">
                    Resume
                  </label>

                  <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-white/15 bg-black/20 px-4 py-4 transition hover:border-violet-500/50">
                    <div>
                      {resumeName ? (
                        <>
                          <p className="text-sm font-medium text-white">
                            {resumeName}
                          </p>

                          <p className="mt-1 text-xs text-zinc-500">
                            Resume uploaded successfully
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-zinc-300">
                            Upload your resume
                          </p>

                          <p className="mt-1 text-xs text-zinc-600">
                            PDF, DOC or DOCX
                          </p>
                        </>
                      )}
                    </div>

                    <span className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black">
                      {uploadingResume
                        ? "Uploading..."
                        : resumeName
                          ? "Change"
                          : "Choose File"}
                    </span>

                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeUpload}
                      disabled={uploadingResume}
                      className="hidden"
                    />
                  </label>

                  {resumeError && (
                    <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/[0.05] px-4 py-3">
                      <p className="text-sm text-red-400">{resumeError}</p>
                    </div>
                  )}
                </div>

                {/* ROLE */}

                <div>
                  <label className="mb-2 block text-sm text-zinc-300">
                    Target Role
                  </label>

                  <input
                    placeholder="e.g. Machine Learning Engineer"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-600 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10"
                  />
                </div>

                {/* TYPE + DIFFICULTY */}

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-zinc-300">
                      Interview Type
                    </label>

                    <select
                      value={interviewType}
                      onChange={(e) => setInterviewType(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#111217] px-4 py-3 text-sm text-zinc-300 outline-none focus:border-violet-500/60"
                    >
                      <option value="">Select type</option>

                      <option value="technical">Technical</option>

                      <option value="hr">HR</option>

                      <option value="managerial">Managerial</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-zinc-300">
                      Difficulty
                    </label>

                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#111217] px-4 py-3 text-sm text-zinc-300 outline-none focus:border-violet-500/60"
                    >
                      <option value="">Select difficulty</option>

                      <option value="easy">Easy</option>

                      <option value="medium">Medium</option>

                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                {/* DURATION */}

                <div>
                  <label className="mb-2 block text-sm text-zinc-300">
                    Duration
                  </label>

                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#111217] px-4 py-3 text-sm text-zinc-300 outline-none focus:border-violet-500/60"
                  >
                    <option value="">Select duration</option>

                    <option value="20">20 minutes</option>

                    <option value="30">30 minutes</option>

                    <option value="45">45 minutes</option>

                    <option value="60">60 minutes</option>
                  </select>
                </div>

                {/* ERROR */}

                {startError && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] px-4 py-3">
                    <p className="text-sm text-red-400">{startError}</p>
                  </div>
                )}

                {/* START BUTTON */}

                <button
                  onClick={handleStartInterview}
                  disabled={starting || uploadingResume}
                  className="mt-3 w-full rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {starting ? "Generating Interview..." : "Start Interview →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            ACTIVE INTERVIEW
        ==================================================== */}

        {stage === "active" && question && (
          <div className="mx-auto max-w-4xl">
            {/* PROGRESS */}

            <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-500"
                style={{
                  width:
                    totalQuestions > 0
                      ? `${Math.min(
                          (questionNumber / totalQuestions) * 100,
                          100,
                        )}%`
                      : "10%",
                }}
              />
            </div>

            {/* SESSION META */}

            {sessionMeta && (
              <div className="mb-5 flex flex-wrap gap-2">
                <span className="rounded-lg bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-400">
                  {displayInterviewType(sessionMeta.interviewType)}
                </span>

                <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-zinc-400">
                  {displayDifficulty(sessionMeta.difficulty)}
                </span>

                <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-zinc-400">
                  {sessionMeta.duration} min
                </span>

                <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-zinc-400">
                  {sessionMeta.role}
                </span>
              </div>
            )}

            {/* TIME WARNING */}

            {timeExpired && (
              <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-5">
                <p className="text-sm font-medium text-red-400">
                  Interview time is over.
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Submit your current answer to finish this question.
                </p>
              </div>
            )}

            {/* QUESTION CARD */}

            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-8 shadow-2xl backdrop-blur-xl">
              <div className="mb-8">
                <div className="mb-4 flex items-center gap-3">
                  <span className="rounded-lg bg-violet-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-400">
                    Interview Question
                  </span>

                  {submitting && (
                    <span className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400">
                      SAVING ANSWER
                    </span>
                  )}
                </div>

                <h2 className="text-2xl font-medium leading-relaxed text-zinc-100">
                  {question.question}
                </h2>
              </div>

              {/* ANSWER INPUT */}

              <div>
                <label className="mb-3 block text-sm font-medium text-zinc-300">
                  Your answer
                </label>

                <textarea
                  placeholder="Take your time and explain your answer clearly..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={9}
                  disabled={submitting}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 p-5 text-sm leading-7 text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-500/60 focus:ring-4 focus:ring-violet-500/5 disabled:opacity-60"
                />

                {/* SUBMIT ERROR */}

                {submitError && (
                  <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/[0.05] px-4 py-3">
                    <p className="text-sm text-red-400">{submitError}</p>
                  </div>
                )}

                {/* BUTTON */}

                <div className="mt-4 flex items-center justify-between gap-4">
                  <span className="text-xs text-zinc-600">
                    Be clear, specific and concise.
                  </span>

                  <button
                    onClick={handleSubmitAnswer}
                    disabled={submitting || !answer.trim()}
                    className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {submitting
                      ? "Saving answer..."
                      : isLastQuestion
                        ? "Complete Interview →"
                        : "Submit Answer →"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            FINAL REPORT
        ==================================================== */}

        {stage === "completed" && finalReport && (
          <div className="mx-auto max-w-4xl">
            {/* SUMMARY */}

            <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.035] p-8 backdrop-blur-xl">
              <div className="flex flex-col items-center justify-between gap-8 sm:flex-row">
                <div>
                  <p className="text-sm font-medium text-violet-400">
                    PERFORMANCE SUMMARY
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold">
                    Interview completed
                  </h2>

                  <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">
                    Your answers have been evaluated across multiple dimensions
                    of interview performance.
                  </p>
                </div>

                {/* SCORE */}

                <div className="relative flex h-36 w-36 shrink-0 items-center justify-center rounded-full border-8 border-violet-500/20">
                  <div className="text-center">
                    <p className="text-4xl font-bold">
                      {Number(finalReport.overall_score).toFixed(1)}
                    </p>

                    <p className="text-xs text-zinc-500">out of 10</p>
                  </div>
                </div>
              </div>
            </div>

            {/* SCORE CARDS */}

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                ["Correctness", finalReport.correctness],
                ["Clarity", finalReport.clarity],
                ["Completeness", finalReport.completeness],
                ["Relevance", finalReport.relevance],
              ].map(([label, score]) => (
                <div
                  key={label as string}
                  className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"
                >
                  <p className="text-sm text-zinc-400">{label as string}</p>

                  <p className="mt-2 text-2xl font-semibold">
                    {Number(score).toFixed(1)}

                    <span className="text-sm text-zinc-600">/10</span>
                  </p>
                </div>
              ))}
            </div>

            {/* ACTIONS */}

            <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-zinc-300">
                  Want the full breakdown, question by question?
                </p>

                <p className="mt-1 text-xs text-zinc-600">
                  Review each answer and its detailed evaluation.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => router.push(`/history/${interviewId}`)}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.08]"
                >
                  View Full Interview →
                </button>

                <button
                  onClick={() => router.push("/dashboard")}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.08]"
                >
                  Back to Dashboard
                </button>

                <button
                  onClick={handleNewInterview}
                  className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
                >
                  Start New Interview →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
