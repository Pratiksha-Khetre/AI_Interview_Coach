// Frontend\app\settings\page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/lib/auth-context";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function SettingsContent() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const displayName = user?.displayName || "there";
  const initials = user?.displayName ? getInitials(user.displayName) : "U";

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0d0f15] px-5 py-10 text-slate-100 md:px-8 lg:px-10">
      <div className="mx-auto max-w-2xl">
        {/* HEADER */}
        <div className="mb-8 flex items-center gap-2.5">
          <button
            onClick={() => router.push("/")}
            className="flex size-9 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
            aria-label="Back to dashboard"
          >
            <Sparkles className="size-4" />
          </button>

          <span className="text-[15px] font-semibold tracking-tight text-white">
            Interview<span className="text-indigo-400">ly</span>
          </span>
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-400">
          Your account
        </p>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl">
          Settings
        </h1>

        <p className="mt-1.5 text-sm text-slate-500">
          Manage your account and session.
        </p>

        {/* PROFILE CARD */}
        <section className="mt-6 rounded-xl border border-white/[0.07] bg-[#151823] p-5">
          <h2 className="text-sm font-semibold text-slate-100">Profile</h2>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-lg font-semibold text-white">
              {initials}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-100">
                {displayName}
              </p>
              <p className="truncate text-xs text-slate-500">
                {user?.email ?? ""}
              </p>
            </div>
          </div>
        </section>

        {/* SESSION CARD */}
        <section className="mt-4 rounded-xl border border-white/[0.07] bg-[#151823] p-5">
          <h2 className="text-sm font-semibold text-slate-100">Session</h2>

          <p className="mt-1 text-[13px] text-slate-500">
            Sign out of Interviewly on this device.
          </p>

          <Button
            onClick={handleLogout}
            disabled={loggingOut}
            variant="ghost"
            className="mt-4 border border-rose-400/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/15 hover:text-rose-200"
          >
            <LogOut className="size-4" />
            {loggingOut ? "Logging out..." : "Log out"}
          </Button>
        </section>

        <button
          onClick={() => router.push("/")}
          className="mt-6 flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-300"
        >
          <UserRound className="size-3.5" />
          Back to dashboard
        </button>
      </div>
    </main>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
