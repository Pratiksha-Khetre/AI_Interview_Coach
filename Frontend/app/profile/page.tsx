"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Edit3,
  LogOut,
  Mail,
  UserRound,
  X,
} from "lucide-react";
import { updateProfile } from "firebase/auth";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "U";

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 font-semibold text-white shadow-lg shadow-indigo-500/20 ${
        large ? "size-24 text-2xl" : "size-9 text-xs"
      }`}
    >
      {getInitials(name)}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.displayName || "");
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Name cannot be empty.");
      return;
    }

    setSaving(true);
    setError("");
    setSaveMessage("");

    try {
      await updateProfile(user, {
        displayName: trimmedName,
      });

      setEditing(false);
      setSaveMessage("Profile updated successfully.");

      // Clear success message after a few seconds.
      setTimeout(() => {
        setSaveMessage("");
      }, 3000);
    } catch (err) {
      console.error("Profile update error:", err);
      setError("Unable to update your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user?.displayName || "");
    setEditing(false);
    setError("");
    setSaveMessage("");
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
      setError("Unable to log out. Please try again.");
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0d0f15]">
        <div className="text-center">
          <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-4 border-white/10 border-t-indigo-400" />

          <p className="text-sm text-slate-500">Loading your profile...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0d0f15] px-6 text-slate-100">
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
            <UserRound className="size-6" />
          </div>

          <h1 className="text-xl font-semibold text-white">Sign in required</h1>

          <p className="mt-2 text-sm text-slate-500">
            Please sign in to view your profile.
          </p>

          <Button
            onClick={() => router.push("/login")}
            className="mt-6 bg-indigo-500 text-white hover:bg-indigo-400"
          >
            Go to Login
          </Button>
        </div>
      </main>
    );
  }

  const displayName = user.displayName || "User";

  return (
    <main className="min-h-screen bg-[#0d0f15] px-5 py-6 text-slate-100 md:px-8 lg:px-10">
      <div className="mx-auto max-w-4xl">
        {/* HEADER */}
        <div className="mb-8 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="size-5" />
          </Button>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-400">
              Account
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Profile
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your Interviewly profile.
            </p>
          </div>
        </div>

        {/* PROFILE CARD */}
        <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#151823]">
          {/* TOP PROFILE SECTION */}
          <div className="border-b border-white/[0.07] p-6 md:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <Avatar name={displayName} large />

              <div className="flex-1">
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-slate-500">
                  Your account
                </p>

                <h2 className="mt-2 text-xl font-semibold text-white">
                  {displayName}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {user.email || "No email available"}
                </p>
              </div>

              {!editing && (
                <Button
                  onClick={() => {
                    setEditing(true);
                    setError("");
                    setSaveMessage("");
                  }}
                  variant="ghost"
                  className="border border-white/[0.08] text-slate-300 hover:bg-white/[0.06] hover:text-white"
                >
                  <Edit3 data-icon="inline-start" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* ACCOUNT INFORMATION */}
          <div className="p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-slate-100">
                Account Information
              </h2>

              <p className="mt-1 text-[11px] text-slate-500">
                Your information from your Interviewly account.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* NAME */}
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <UserRound className="size-4" />

                  <span className="text-[11px] font-medium uppercase tracking-wide">
                    Display Name
                  </span>
                </div>

                {editing ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter your name"
                    autoFocus
                    className="mt-3 w-full rounded-lg border border-white/[0.08] bg-[#0d0f15] px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-400/20"
                  />
                ) : (
                  <p className="mt-3 text-sm font-medium text-slate-200">
                    {displayName}
                  </p>
                )}
              </div>

              {/* EMAIL */}
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Mail className="size-4" />

                  <span className="text-[11px] font-medium uppercase tracking-wide">
                    Email Address
                  </span>
                </div>

                <p className="mt-3 break-all text-sm font-medium text-slate-200">
                  {user.email || "No email available"}
                </p>

                <p className="mt-1 text-[10px] text-slate-600">
                  Email editing is currently disabled.
                </p>
              </div>
            </div>

            {/* EDIT ACTIONS */}
            {editing && (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-400"
                >
                  {saving ? (
                    <>
                      <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check data-icon="inline-start" />
                      Save Changes
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleCancel}
                  disabled={saving}
                  variant="ghost"
                  className="border border-white/[0.08] text-slate-300 hover:bg-white/[0.06] hover:text-white"
                >
                  <X data-icon="inline-start" />
                  Cancel
                </Button>
              </div>
            )}

            {/* SUCCESS MESSAGE */}
            {saveMessage && (
              <div className="mt-5 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.06] px-4 py-3 text-xs text-emerald-300">
                {saveMessage}
              </div>
            )}

            {/* ERROR MESSAGE */}
            {error && (
              <div className="mt-5 rounded-lg border border-rose-400/15 bg-rose-400/[0.06] px-4 py-3 text-xs text-rose-300">
                {error}
              </div>
            )}
          </div>
        </section>

        {/* ACCOUNT ACTIONS */}
        <section className="mt-5 rounded-2xl border border-white/[0.07] bg-[#151823] p-6 md:p-8">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-slate-100">
              Account Actions
            </h2>

            <p className="mt-1 text-[11px] text-slate-500">
              Manage your current session.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl border border-rose-400/10 bg-rose-500/[0.04] p-4 text-left transition hover:border-rose-400/20 hover:bg-rose-500/[0.08]"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-300">
              <LogOut className="size-4" />
            </div>

            <div>
              <p className="text-sm font-medium text-rose-200">Log out</p>

              <p className="mt-0.5 text-[11px] text-slate-500">
                Sign out of your Interviewly account.
              </p>
            </div>
          </button>
        </section>

        {/* FOOTER */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-xs font-medium text-indigo-300 hover:text-indigo-200"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </main>
  );
}
