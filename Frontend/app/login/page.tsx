// Frontend\app\login\page.tsx

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login, signup, error } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

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
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus-visible:border-indigo-400/50 focus-visible:ring-3 focus-visible:ring-indigo-400/20"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-medium text-slate-400"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus-visible:border-indigo-400/50 focus-visible:ring-3 focus-visible:ring-indigo-400/20"
                placeholder="••••••••"
              />
            </div>

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
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
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
