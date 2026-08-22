// Frontend\app\login\page.tsx

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { auth } from "@/lib/firebase";

function mapResetError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-not-found":
      return "No account found with that email.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again in a bit.";
    default:
      return "Couldn't send the reset email. Please try again.";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { login, signup, error } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [resetMessage, setResetMessage] = useState("");
  const [resetIsError, setResetIsError] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResetMessage("");

    try {
      if (mode === "signup") {
        await signup(name, email, password);
      } else {
        await login(email, password);
      }
      router.push("/");
    } catch {
      // error is already set in auth-context; nothing else to do here
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setResetIsError(true);
      setResetMessage("Enter your email above, then click this again.");
      return;
    }

    setResetSubmitting(true);
    setResetMessage("");

    try {
      await sendPasswordResetEmail(auth, email);
      setResetIsError(false);
      setResetMessage("Password reset email sent — check your inbox.");
    } catch (err) {
      setResetIsError(true);
      setResetMessage(mapResetError(err));
    } finally {
      setResetSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d0f15] px-4 text-slate-100">
      <div className="w-full max-w-sm">
        {/* LOGO */}
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/25">
            <Sparkles className="size-4" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-white">
            Interview<span className="text-indigo-400">ly</span>
          </span>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-[#151823] p-6">
          <h1 className="text-lg font-semibold text-slate-100">
            {mode === "login" ? "Log in" : "Create an account"}
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            {mode === "login"
              ? "Welcome back to Interviewly."
              : "Start practicing interviews tailored to you."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-xs font-medium text-slate-400"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus-visible:border-indigo-400/50 focus-visible:ring-3 focus-visible:ring-indigo-400/20"
                  placeholder="Your name"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-medium text-slate-400"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setResetMessage("");
                }}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus-visible:border-indigo-400/50 focus-visible:ring-3 focus-visible:ring-indigo-400/20"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-slate-400"
                >
                  Password
                </label>

                {mode === "login" && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={resetSubmitting}
                    className="text-[11px] font-medium text-indigo-300 hover:text-indigo-200"
                  >
                    {resetSubmitting ? "Sending..." : "Forgot password?"}
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 pr-10 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus-visible:border-indigo-400/50 focus-visible:ring-3 focus-visible:ring-indigo-400/20"
                  placeholder="••••••••"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {resetMessage && (
              <p
                className={`rounded-lg px-3 py-2 text-xs ${
                  resetIsError
                    ? "border border-rose-400/15 bg-rose-500/10 text-rose-300"
                    : "border border-emerald-400/15 bg-emerald-500/10 text-emerald-300"
                }`}
              >
                {resetMessage}
              </p>
            )}

            {error && (
              <p className="rounded-lg border border-rose-400/15 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full justify-center bg-indigo-500 text-white hover:bg-indigo-500/85"
            >
              {submitting
                ? "Please wait..."
                : mode === "login"
                  ? "Log in"
                  : "Sign up"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setResetMessage("");
            }}
            className="mt-5 w-full text-center text-[13px] text-slate-500 hover:text-slate-300"
          >
            {mode === "login"
              ? "Don't have an account? Sign up"
              : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}
