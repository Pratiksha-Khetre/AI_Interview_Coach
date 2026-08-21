"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  ChevronRight,
  CircleHelp,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Play,
  Plus,
  Search,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  X,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PerformanceChart } from "@/components/performance-chart";
import { useAuth } from "@/lib/auth-context";
import {
  getUserInterviews,
  type StoredInterviewReport,
} from "@/lib/interviews-store";

// ============================================================
// NAVIGATION
// ============================================================

const navGroups = [
  {
    label: "Workspace",
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        path: "/",
      },
      {
        label: "Start Interview",
        icon: Play,
        path: "/interview",
      },
      {
        label: "Interview History",
        icon: BookOpen,
        path: "/history",
      },
      {
        label: "Performance",
        icon: BarChart3,
        path: "/performance",
      },
    ],
  },
  {
    label: "Library",
    items: [
      {
        label: "Resume",
        icon: FileText,
        path: "/resume",
      },
      {
        label: "Saved Roles",
        icon: BriefcaseBusiness,
        path: "/saved-roles",
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        label: "Profile",
        icon: UserRound,
        path: "/profile",
      },
      {
        label: "Settings",
        icon: Settings,
        path: "/settings",
      },
    ],
  },
];

// ============================================================
// NAME + FORMAT HELPERS
// ============================================================

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
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

function formatDifficultyLabel(difficulty: string): string {
  if (!difficulty) return "Unknown";

  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
}

function formatShortDate(
  timestamp: StoredInterviewReport["completedAt"],
): string {
  if (!timestamp) return "—";

  return timestamp.toDate().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function computeStreak(interviews: StoredInterviewReport[]): number {
  const days = new Set<string>();

  for (const interview of interviews) {
    if (interview.completedAt) {
      days.add(interview.completedAt.toDate().toDateString());
    }
  }

  let streak = 0;
  const cursor = new Date();

  while (days.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

// ============================================================
// AVATAR
// ============================================================

function Avatar({
  small = false,
  initials = "U",
}: {
  small?: boolean;
  initials?: string;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 font-semibold text-white ${
        small ? "size-8 text-[11px]" : "size-9 text-xs"
      }`}
    >
      {initials}
    </div>
  );
}

// ============================================================
// PROFILE MENU (clickable avatar -> dropdown)
// ============================================================

function ProfileMenu() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = user?.displayName ? getInitials(user.displayName) : "U";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    router.push("/login");
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label="Open profile menu"
        aria-expanded={open}
        className="rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-indigo-400/50"
      >
        <Avatar initials={initials} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-white/[0.08] bg-[#151823] py-1.5 shadow-2xl shadow-black/40">
          <div className="border-b border-white/[0.07] px-3.5 py-3">
            <p className="truncate text-xs font-semibold text-slate-100">
              {user?.displayName || "Account"}
            </p>
            <p className="truncate text-[11px] text-slate-500">
              {user?.email ?? ""}
            </p>
          </div>

          <button
            onClick={() => {
              setOpen(false);
              router.push("/profile");
            }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-slate-300 transition-colors hover:bg-white/[0.05] hover:text-slate-100"
          >
            <UserRound className="size-[15px]" />
            Profile
          </button>

          <button
            onClick={() => {
              setOpen(false);
              router.push("/settings");
            }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-slate-300 transition-colors hover:bg-white/[0.05] hover:text-slate-100"
          >
            <Settings className="size-[15px]" />
            Settings
          </button>

          <div className="my-1 border-t border-white/[0.07]" />

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-rose-300 transition-colors hover:bg-rose-500/10"
          >
            <LogOut className="size-[15px]" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SIDEBAR
// ============================================================

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { user } = useAuth();

  const displayName = user?.displayName || "there";
  const initials = user?.displayName ? getInitials(user.displayName) : "U";

  const handleNavigation = (path: string) => {
    onClose();
    router.push(path);
  };

  return (
    <>
      {open && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-950/70 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/[0.07] bg-[#10121a] px-4 py-5 transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* LOGO */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/25">
              <Sparkles className="size-4" />
            </div>

            <span className="text-[15px] font-semibold tracking-tight text-white">
              Interview<span className="text-indigo-400">ly</span>
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            className="text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X />
          </Button>
        </div>

        {/* NAVIGATION */}
        <nav className="mt-9 flex flex-col gap-7">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {group.label}
              </p>

              <div className="flex flex-col gap-1">
                {group.items.map(({ label, icon: Icon, path }) => (
                  <button
                    key={label}
                    onClick={() => handleNavigation(path)}
                    className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] text-slate-400 transition-all hover:bg-white/[0.05] hover:text-slate-100"
                  >
                    <Icon className="size-[16px]" />

                    {label}

                    {label === "Start Interview" && (
                      <span className="ml-auto size-1.5 rounded-full bg-indigo-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* BOTTOM */}
        <div className="mt-auto flex flex-col gap-4">
          <div className="rounded-xl border border-indigo-400/10 bg-indigo-500/[0.08] p-4">
            <div className="mb-3 flex size-8 items-center justify-center rounded-lg bg-indigo-400/15 text-indigo-300">
              <CircleHelp className="size-4" />
            </div>

            <p className="text-xs font-semibold text-slate-100">
              Need some help?
            </p>

            <p className="mt-1 text-[11px] leading-4 text-slate-500">
              Learn how to get the most from your practice sessions.
            </p>

            <button className="mt-3 text-xs font-semibold text-indigo-300">
              View guide <ChevronRight className="ml-1 inline size-3" />
            </button>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] p-2.5">
            <Avatar small initials={initials} />

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-100">
                {displayName}
              </p>

              <p className="truncate text-[11px] text-slate-500">
                {user?.email ?? ""}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  label,
  value,
  note,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof Target;
  tone: string;
}) {
  return (
    <div className="group rounded-xl border border-white/[0.07] bg-[#151823] p-4 transition-all hover:-translate-y-0.5 hover:border-indigo-400/20 hover:bg-[#191c29]">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-medium text-slate-500">{label}</p>

        <div
          className={`flex size-7 items-center justify-center rounded-lg ${tone}`}
        >
          <Icon className="size-3.5" />
        </div>
      </div>

      <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-100">
        {value}
      </p>

      <p className="mt-1 text-[11px] text-slate-500">{note}</p>
    </div>
  );
}

// ============================================================
// PROGRESS
// ============================================================

function Progress({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>

        <span className="font-semibold text-slate-200">
          {Math.round(value)}%
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-white/[0.08]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400 transition-all duration-1000"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================
// DIFFICULTY
// ============================================================

function Difficulty({ value }: { value: string }) {
  const tone =
    value.toLowerCase() === "hard"
      ? "bg-rose-400/10 text-rose-300"
      : value.toLowerCase() === "medium"
        ? "bg-amber-400/10 text-amber-300"
        : "bg-emerald-400/10 text-emerald-300";

  return (
    <span className={`rounded-md px-2 py-1 text-[10px] font-semibold ${tone}`}>
      {formatDifficultyLabel(value)}
    </span>
  );
}

// ============================================================
// HEADER
// ============================================================

function DashboardHeader({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="flex items-center justify-between border-b border-white/[0.07] bg-[#0f1118]/80 px-5 py-4 backdrop-blur-sm md:px-8">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
          onClick={onMenu}
          aria-label="Open navigation"
        >
          <Menu />
        </Button>

        <div>
          <p className="text-sm font-medium text-slate-200">Dashboard</p>

          <p className="mt-0.5 text-[11px] text-slate-500">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-[11px] text-emerald-300 sm:flex">
          <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_theme(colors.emerald.400)]" />
          AI Coach Ready
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-slate-500 hover:bg-white/10 hover:text-white"
          aria-label="Search"
        >
          <Search />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative text-slate-500 hover:bg-white/10 hover:text-white"
          aria-label="Notifications"
        >
          <Bell />

          <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-indigo-400" />
        </Button>

        <div className="hidden h-5 w-px bg-white/10 sm:block" />

        <ProfileMenu />
      </div>
    </header>
  );
}

// ============================================================
// DASHBOARD
// ============================================================

export function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [interviews, setInterviews] = useState<StoredInterviewReport[]>([]);
  const [loadingInterviews, setLoadingInterviews] = useState(true);

  // ============================================================
  // LOAD REAL INTERVIEW DATA FROM FIRESTORE
  // ============================================================

  useEffect(() => {
    if (!user) {
      setInterviews([]);
      setLoadingInterviews(false);
      return;
    }

    let cancelled = false;
    setLoadingInterviews(true);

    getUserInterviews(user.uid)
      .then((data) => {
        if (!cancelled) setInterviews(data);
      })
      .catch((err) => {
        console.error("Failed to load interview history:", err);
      })
      .finally(() => {
        if (!cancelled) setLoadingInterviews(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  // ============================================================
  // DERIVED STATS
  // ============================================================

  const stats = useMemo(() => {
    if (interviews.length === 0) {
      return {
        count: 0,
        averageScore: 0,
        bestScore: 0,
        streak: 0,
        skillAverages: {
          correctness: 0,
          clarity: 0,
          completeness: 0,
          relevance: 0,
        },
      };
    }

    const scores = interviews.map((i) => i.overallScore * 10);

    return {
      count: interviews.length,
      averageScore: average(scores),
      bestScore: Math.max(...scores),
      streak: computeStreak(interviews),
      skillAverages: {
        correctness: average(interviews.map((i) => i.correctness * 10)),
        clarity: average(interviews.map((i) => i.clarity * 10)),
        completeness: average(interviews.map((i) => i.completeness * 10)),
        relevance: average(interviews.map((i) => i.relevance * 10)),
      },
    };
  }, [interviews]);

  const weakestSkill = useMemo(() => {
    if (interviews.length === 0) return null;

    const labeled: [string, number][] = [
      ["correctness", stats.skillAverages.correctness],
      ["clarity", stats.skillAverages.clarity],
      ["completeness", stats.skillAverages.completeness],
      ["relevance", stats.skillAverages.relevance],
    ];

    labeled.sort((a, b) => a[1] - b[1]);
    return labeled[0];
  }, [interviews.length, stats.skillAverages]);

  const recentInterviews = interviews.slice(0, 3);

  const chartData = useMemo(() => {
    // chronological order (oldest -> newest) for a left-to-right trend line
    return [...interviews].reverse().map((interview) => ({
      label: formatShortDate(interview.completedAt),
      score: Math.round(interview.overallScore * 10),
    }));
  }, [interviews]);

  // ============================================================
  // NAVIGATION HANDLERS
  // ============================================================

  const startInterview = () => {
    router.push("/interview");
  };

  const openHistory = () => {
    router.push("/history");
  };

  const openPerformance = () => {
    router.push("/performance");
  };

  return (
    <div className="min-h-screen bg-[#0d0f15] text-slate-100">
      <div className="flex min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="min-w-0 flex-1">
          <DashboardHeader onMenu={() => setSidebarOpen(true)} />

          <main className="mx-auto max-w-[1440px] px-5 py-6 md:px-8 lg:px-10 lg:py-8">
            {/* ================================================= */}
            {/* PAGE HEADER */}
            {/* ================================================= */}

            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-400">
                  Your workspace
                </p>

                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl">
                  Hey, {user?.displayName || "there"}
                </h1>

                <p className="mt-1.5 text-sm text-slate-500">
                  Build confidence one practice session at a time.
                </p>
              </div>

              <Button
                onClick={startInterview}
                className="h-10 rounded-lg bg-indigo-500 px-4 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-400"
              >
                <Plus data-icon="inline-start" />
                Start New Interview
              </Button>
            </div>

            {/* ================================================= */}
            {/* HERO */}
            {/* ================================================= */}

            <section className="relative overflow-hidden rounded-2xl border border-indigo-400/15 bg-gradient-to-br from-[#1b1d32] via-[#17192b] to-[#141520] p-6 shadow-2xl shadow-indigo-950/20 md:p-8">
              <div className="relative z-10 max-w-lg">
                <div className="mb-5 flex size-10 items-center justify-center rounded-xl bg-indigo-400/15 text-indigo-300">
                  <Sparkles className="size-5" />
                </div>

                <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                  Ready for your next interview?
                </h2>

                <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
                  Practice with an AI interviewer trained around your resume,
                  role and goals.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    onClick={startInterview}
                    className="h-9 rounded-lg bg-indigo-500 px-4 text-xs font-semibold text-white hover:bg-indigo-400"
                  >
                    Start New Interview
                    <ChevronRight data-icon="inline-end" />
                  </Button>

                  <Button
                    onClick={openHistory}
                    variant="ghost"
                    className="h-9 rounded-lg border border-white/10 px-4 text-xs text-slate-300 hover:bg-white/10 hover:text-white"
                  >
                    View History
                  </Button>
                </div>
              </div>

              {/* DECORATION */}

              <div className="pointer-events-none absolute right-5 top-1/2 hidden size-52 -translate-y-1/2 md:block">
                <div className="absolute inset-6 rounded-full border border-indigo-300/15" />

                <div className="absolute inset-12 rounded-full border border-violet-300/20" />

                <div className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-300 shadow-[0_0_28px_8px_rgba(129,140,248,.3)]" />

                <Zap className="absolute right-5 top-8 size-4 text-violet-300" />

                <Target className="absolute bottom-8 left-4 size-4 text-indigo-300" />

                <span className="absolute left-9 top-12 size-2 rounded-full bg-violet-300" />

                <span className="absolute bottom-14 right-7 size-2 rounded-full bg-indigo-300" />
              </div>
            </section>

            {/* ================================================= */}
            {/* READINESS + STATS */}
            {/* ================================================= */}

            <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
              <section className="rounded-xl border border-white/[0.07] bg-[#151823] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-100">
                      Interview Readiness
                    </h2>

                    <p className="mt-1 text-[11px] text-slate-500">
                      Based on all of your sessions
                    </p>
                  </div>

                  <span className="text-xs font-medium text-indigo-300">
                    All time
                  </span>
                </div>

                <div className="mt-5 flex items-center gap-6">
                  <div
                    className="relative flex size-28 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: `conic-gradient(#818cf8 ${Math.round(
                        stats.averageScore,
                      )}%, rgba(255,255,255,.08) 0)`,
                    }}
                  >
                    <div className="flex size-20 flex-col items-center justify-center rounded-full bg-[#151823]">
                      <span className="text-2xl font-semibold text-white">
                        {stats.count > 0
                          ? `${Math.round(stats.averageScore)}%`
                          : "—"}
                      </span>

                      <span className="text-[10px] text-slate-500">ready</span>
                    </div>
                  </div>

                  <div className="grid flex-1 gap-3 sm:grid-cols-2">
                    <Progress
                      label="Correctness"
                      value={stats.skillAverages.correctness}
                    />

                    <Progress
                      label="Clarity"
                      value={stats.skillAverages.clarity}
                    />

                    <Progress
                      label="Completeness"
                      value={stats.skillAverages.completeness}
                    />

                    <Progress
                      label="Relevance"
                      value={stats.skillAverages.relevance}
                    />
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
                <StatCard
                  label="Interviews Completed"
                  value={String(stats.count)}
                  note={
                    stats.count > 0
                      ? "Keep practicing"
                      : "Complete your first interview"
                  }
                  icon={BriefcaseBusiness}
                  tone="bg-indigo-500/15 text-indigo-300"
                />

                <StatCard
                  label="Average Score"
                  value={
                    stats.count > 0 ? `${Math.round(stats.averageScore)}%` : "—"
                  }
                  note="Across all sessions"
                  icon={TrendingUp}
                  tone="bg-emerald-500/15 text-emerald-300"
                />

                <StatCard
                  label="Best Score"
                  value={
                    stats.count > 0 ? `${Math.round(stats.bestScore)}%` : "—"
                  }
                  note="Personal best"
                  icon={Target}
                  tone="bg-violet-500/15 text-violet-300"
                />

                <StatCard
                  label="Current Streak"
                  value={`${stats.streak} day${stats.streak === 1 ? "" : "s"}`}
                  note={stats.streak > 0 ? "Keep it going" : "Start today"}
                  icon={Zap}
                  tone="bg-amber-500/15 text-amber-300"
                />
              </section>
            </div>

            {/* ================================================= */}
            {/* PERFORMANCE */}
            {/* ================================================= */}

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
              <section className="min-w-0 rounded-xl border border-white/[0.07] bg-[#151823] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-100">
                      Performance Overview
                    </h2>

                    <p className="mt-1 text-[11px] text-slate-500">
                      Your score trend across recent sessions.
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <PerformanceChart data={chartData} />
                </div>
              </section>

              <section className="rounded-xl border border-white/[0.07] bg-[#151823] p-5">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    Skill Breakdown
                  </h2>

                  <p className="mt-1 text-[11px] text-slate-500">
                    Your average across all sessions.
                  </p>
                </div>

                <div className="mt-6 flex flex-col gap-5">
                  <Progress
                    label="Correctness"
                    value={stats.skillAverages.correctness}
                  />
                  <Progress
                    label="Clarity"
                    value={stats.skillAverages.clarity}
                  />
                  <Progress
                    label="Completeness"
                    value={stats.skillAverages.completeness}
                  />
                  <Progress
                    label="Relevance"
                    value={stats.skillAverages.relevance}
                  />
                </div>
              </section>
            </div>

            {/* ================================================= */}
            {/* RECENT INTERVIEWS */}
            {/* ================================================= */}

            <section className="mt-5 rounded-xl border border-white/[0.07] bg-[#151823] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    Recent Interviews
                  </h2>

                  <p className="mt-1 text-[11px] text-slate-500">
                    Review your latest practice sessions.
                  </p>
                </div>

                <Button
                  onClick={openHistory}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-indigo-300 hover:bg-indigo-400/10 hover:text-indigo-200"
                >
                  View all
                  <ChevronRight data-icon="inline-end" />
                </Button>
              </div>

              <div className="mt-5 flex flex-col gap-2">
                {loadingInterviews ? (
                  <p className="py-6 text-center text-xs text-slate-500">
                    Loading your interviews...
                  </p>
                ) : recentInterviews.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-500">
                    No interviews yet — start one to see it here.
                  </p>
                ) : (
                  recentInterviews.map((item) => (
                    <div
                      key={item.interviewId}
                      className="flex flex-wrap items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.015] p-3 transition-colors hover:bg-white/[0.04] md:flex-nowrap"
                    >
                      <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/10 text-[10px] font-bold text-indigo-300">
                        {formatInterviewType(item.interviewType)
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-[170px] flex-1">
                        <p className="text-xs font-medium text-slate-200">
                          {formatRole(item.role)}
                        </p>

                        <p className="mt-1 text-[11px] text-slate-500">
                          {formatInterviewType(item.interviewType)} ·{" "}
                          {formatShortDate(item.completedAt)}
                        </p>
                      </div>

                      <Difficulty value={item.difficulty} />

                      <span className="text-lg font-semibold text-white">
                        {Math.round(item.overallScore * 10)}%
                      </span>

                      <span className="hidden rounded-md bg-emerald-400/10 px-2 py-1 text-[10px] font-medium text-emerald-300 sm:inline">
                        Completed
                      </span>

                      <button
                        onClick={() =>
                          router.push(`/history/${item.interviewId}`)
                        }
                        className="text-xs font-medium text-indigo-300 hover:text-indigo-200"
                      >
                        View Report
                        <ChevronRight className="inline size-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* ================================================= */}
            {/* QUICK ACTIONS */}
            {/* ================================================= */}

            <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.2fr]">
              <section className="rounded-xl border border-white/[0.07] bg-[#151823] p-5">
                <h2 className="text-sm font-semibold text-slate-100">
                  Quick Actions
                </h2>

                <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                  <button
                    onClick={startInterview}
                    className="flex items-center gap-3 rounded-lg border border-indigo-400/15 bg-indigo-500/10 p-3 text-left text-xs font-medium text-indigo-200 transition hover:bg-indigo-500/15"
                  >
                    <Play className="size-4" />
                    Start Interview
                    <ChevronRight className="ml-auto size-3" />
                  </button>

                  <button
                    onClick={openPerformance}
                    className="flex items-center gap-3 rounded-lg border border-white/[0.07] p-3 text-left text-xs font-medium text-slate-300 transition hover:bg-white/[0.05]"
                  >
                    <Target className="size-4 text-amber-300" />
                    Performance
                    <ChevronRight className="ml-auto size-3 text-slate-500" />
                  </button>

                  <button
                    onClick={openHistory}
                    className="flex items-center gap-3 rounded-lg border border-white/[0.07] p-3 text-left text-xs font-medium text-slate-300 transition hover:bg-white/[0.05]"
                  >
                    <FileText className="size-4 text-violet-300" />
                    Review Reports
                    <ChevronRight className="ml-auto size-3 text-slate-500" />
                  </button>
                </div>
              </section>

              {/* AI INSIGHT */}

              <section className="relative overflow-hidden rounded-xl border border-indigo-400/15 bg-indigo-500/[0.08] p-5">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-sm font-semibold text-indigo-200">
                    <Sparkles className="size-4 text-indigo-300" />
                    AI Coach Insight
                  </div>

                  <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
                    {weakestSkill ? (
                      <>
                        Your{" "}
                        <span className="font-semibold text-indigo-200">
                          {formatDifficultyLabel(weakestSkill[0])}
                        </span>{" "}
                        score is your lowest area right now, averaging{" "}
                        <span className="font-semibold text-indigo-200">
                          {Math.round(weakestSkill[1])}%
                        </span>
                        . Focus your next few sessions there to raise your
                        overall readiness.
                      </>
                    ) : (
                      "Complete a few interviews and I'll surface personalized insights here."
                    )}
                  </p>

                  <button
                    onClick={openPerformance}
                    className="mt-4 text-xs font-semibold text-indigo-300"
                  >
                    View detailed analysis
                    <ChevronRight className="ml-1 inline size-3" />
                  </button>
                </div>

                <Sparkles className="absolute -bottom-5 -right-2 size-28 text-indigo-400/10" />
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
