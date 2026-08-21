"use client";

import { ChangeEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ResumePage() {
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  // ============================================================
  // FILE SELECTION
  // ============================================================

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    setError(null);
    setUploaded(false);
    setResumeId(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.type !== "application/pdf") {
      setSelectedFile(null);
      setError("Only PDF files are allowed.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);
      setError("File size must not exceed 5 MB.");
      return;
    }

    setSelectedFile(file);
  };

  // ============================================================
  // FORMAT FILE SIZE
  // ============================================================

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // ============================================================
  // UPLOAD RESUME
  // ============================================================

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a PDF resume first.");
      return;
    }

    if (!API_BASE_URL) {
      setError("API URL is not configured.");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setUploaded(false);
      setResumeId(null);

      const formData = new FormData();

      formData.append("file", selectedFile);

      const response = await fetch(`${API_BASE_URL}/resume/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || `Resume upload failed (${response.status})`,
        );
      }

      setUploaded(true);
      setResumeId(data.resume_id ?? null);

      // Keep the latest resume ID locally so the frontend
      // can remember which resume was most recently uploaded.
      if (data.resume_id) {
        localStorage.setItem("latest_resume_id", data.resume_id);
        localStorage.setItem("latest_resume_name", selectedFile.name);
      }
    } catch (err) {
      console.error("Resume upload error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload resume. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  // ============================================================
  // REMOVE SELECTED FILE
  // ============================================================

  const removeFile = () => {
    if (uploading) return;

    setSelectedFile(null);
    setUploaded(false);
    setResumeId(null);
    setError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ============================================================
  // OPEN FILE PICKER
  // ============================================================

  const openFilePicker = () => {
    if (uploading) return;

    fileInputRef.current?.click();
  };

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <main className="min-h-screen bg-[#0d0f15] px-5 py-8 text-slate-100 md:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        {/* ======================================================
            TOP BAR
        ====================================================== */}

        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-xs font-medium text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="size-4 text-indigo-400" />
            Interviewly
          </div>
        </div>

        {/* ======================================================
            HEADER
        ====================================================== */}

        <section className="mb-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-400">
            Library
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Your Resume
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Upload your resume so Interviewly can personalize your interview
            questions around your experience, skills, and target role.
          </p>
        </section>

        {/* ======================================================
            MAIN CARD
        ====================================================== */}

        <section className="rounded-2xl border border-white/[0.07] bg-[#151823] p-5 shadow-2xl shadow-black/10 md:p-7">
          {/* CARD HEADER */}

          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
              <FileText className="size-5" />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Upload Resume
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                PDF files only · Maximum size 5 MB
              </p>
            </div>
          </div>

          {/* ====================================================
              UPLOAD AREA
          ==================================================== */}

          <div
            onClick={openFilePicker}
            className={`mt-7 cursor-pointer rounded-xl border border-dashed p-8 text-center transition-all ${
              selectedFile
                ? "border-indigo-400/30 bg-indigo-500/[0.04]"
                : "border-white/[0.12] bg-white/[0.015] hover:border-indigo-400/30 hover:bg-indigo-500/[0.03]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
              <Upload className="size-5" />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-200">
              {selectedFile ? "Resume selected" : "Upload your resume"}
            </h3>

            <p className="mt-2 text-xs text-slate-500">
              {selectedFile
                ? "Click here to choose a different file"
                : "Click to browse your files"}
            </p>

            <p className="mt-3 text-[11px] text-slate-600">PDF · Up to 5 MB</p>
          </div>

          {/* ====================================================
              SELECTED FILE
          ==================================================== */}

          {selectedFile && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-300">
                <FileText className="size-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-200">
                  {selectedFile.name}
                </p>

                <p className="mt-1 text-[11px] text-slate-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>

              {!uploading && (
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    removeFile();
                  }}
                  className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.06] hover:text-slate-200"
                  aria-label="Remove selected resume"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          )}

          {/* ====================================================
              ERROR
          ==================================================== */}

          {error && (
            <div className="mt-4 rounded-xl border border-rose-400/15 bg-rose-400/[0.06] px-4 py-3">
              <p className="text-xs text-rose-300">{error}</p>
            </div>
          )}

          {/* ====================================================
              SUCCESS
          ==================================================== */}

          {uploaded && (
            <div className="mt-4 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />

                <div>
                  <p className="text-xs font-semibold text-emerald-300">
                    Resume uploaded successfully
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-slate-400">
                    Your resume has been processed and is ready to personalize
                    your interview questions.
                  </p>

                  {resumeId && (
                    <p className="mt-2 break-all text-[10px] text-slate-600">
                      Resume ID: {resumeId}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ====================================================
              ACTIONS
          ==================================================== */}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              disabled={uploading}
              className="h-10 rounded-lg border border-white/[0.08] px-5 text-xs text-slate-300 hover:bg-white/[0.05] hover:text-white"
            >
              Cancel
            </Button>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="h-10 rounded-lg bg-indigo-500 px-5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {uploading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Processing Resume...
                </>
              ) : uploaded ? (
                <>
                  <CheckCircle2 />
                  Upload Again
                </>
              ) : (
                <>
                  <Upload />
                  Upload Resume
                </>
              )}
            </Button>
          </div>
        </section>

        {/* ======================================================
            HOW IT WORKS
        ====================================================== */}

        <section className="mt-5 grid gap-4 md:grid-cols-3">
          <InfoCard
            number="01"
            title="Upload"
            description="Choose your latest resume in PDF format."
          />

          <InfoCard
            number="02"
            title="AI Processing"
            description="Your resume is parsed, chunked and converted into searchable vectors."
          />

          <InfoCard
            number="03"
            title="Personalized Interviews"
            description="Interviewly uses your resume to generate relevant interview questions."
          />
        </section>
      </div>
    </main>
  );
}

// ============================================================
// INFO CARD
// ============================================================

function InfoCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#151823] p-4">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-semibold tracking-[0.15em] text-indigo-400">
          {number}
        </span>

        <h3 className="text-xs font-semibold text-slate-200">{title}</h3>
      </div>

      <p className="mt-3 text-[11px] leading-5 text-slate-500">{description}</p>
    </div>
  );
}
