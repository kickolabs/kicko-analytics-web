import Link from "next/link";
import { redirect } from "next/navigation";

import {
  Activity,
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileCheck2,
  Files,
  Fingerprint,
  GraduationCap,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type VerificationCase = {
  id: string;
  request_code: string;
  candidate_full_name: string;
  service_type: string;
  status: string;
  created_at: string;
};

const serviceNames: Record<string, string> = {
  identity: "Identity Verification",
  employment: "Employment Verification",
  education: "Education Verification",
  background: "Background Verification",
  overseas: "Overseas Document Verification",
  document: "Document Authenticity Review",
};

function getStatusStyle(status: string) {
  switch (status) {
    case "completed":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";

    case "in_progress":
      return "bg-blue-50 text-blue-700 ring-blue-600/20";

    case "under_review":
    case "needs_information":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";

    case "cancelled":
      return "bg-red-50 text-red-700 ring-red-600/20";

    default:
      return "bg-slate-100 text-slate-700 ring-slate-500/20";
  }
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    submitted: "Submitted",
    pending: "Pending",
    in_progress: "In Progress",
    under_review: "Under Review",
    needs_information: "Needs Information",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return labels[status] ?? status;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export const instant = false;
export default async function DashboardPage() {
  const supabase = await createClient();

  // Get the currently authenticated user.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // Get actual verification statistics from Supabase.
  const [
    totalResult,
    activeResult,
    completedResult,
    reviewResult,
    recentResult,
  ] = await Promise.all([
    supabase
      .from("verification_requests")
      .select("id", { count: "exact", head: true }),

    supabase
      .from("verification_requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["submitted", "pending", "in_progress"]),

    supabase
      .from("verification_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),

    supabase
      .from("verification_requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["under_review", "needs_information"]),

    supabase
      .from("verification_requests")
      .select(
        "id, request_code, candidate_full_name, service_type, status, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const databaseError =
    totalResult.error ||
    activeResult.error ||
    completedResult.error ||
    reviewResult.error ||
    recentResult.error;

  const requests = (recentResult.data ?? []) as VerificationCase[];

  const statistics = [
    {
      title: "Total Requests",
      value: totalResult.count ?? 0,
      detail: "All accessible verification cases",
      icon: Files,
      iconStyle: "bg-blue-50 text-blue-700",
    },
    {
      title: "In Progress",
      value: activeResult.count ?? 0,
      detail: "Awaiting completion",
      icon: Clock3,
      iconStyle: "bg-amber-50 text-amber-700",
    },
    {
      title: "Completed",
      value: completedResult.count ?? 0,
      detail: "Completed verification cases",
      icon: CheckCircle2,
      iconStyle: "bg-emerald-50 text-emerald-700",
    },
    {
      title: "Needs Review",
      value: reviewResult.count ?? 0,
      detail: "Require additional review",
      icon: Search,
      iconStyle: "bg-violet-50 text-violet-700",
    },
  ];

  const navigation = [
    {
      label: "Overview",
      icon: LayoutDashboard,
      href: "/dashboard",
      active: true,
    },
    {
      label: "Verifications",
      icon: ShieldCheck,
      href: "#recent-cases",
      active: false,
    },
    {
      label: "Reports",
      icon: Files,
      href: "/dashboard/reports",
      active: false,
    },
    {
      label: "Team",
      icon: Users,
      href: "#team",
      active: false,
    },
    {
      label: "Settings",
      icon: Settings,
      href: "#account",
      active: false,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
          <Link
            href="/"
            className="flex h-20 items-center gap-3 border-b border-slate-100 px-6"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <div>
              <p className="text-base font-extrabold tracking-tight">
                KICKO <span className="text-blue-700">ANALYTICS</span>
              </p>

              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Verification Platform
              </p>
            </div>
          </Link>

          <div className="px-4 py-6">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Workspace
            </p>

            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;

                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                      item.active
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-blue-700"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" />

                    {item.label}

                    {item.label === "Verifications" && (
                      <span className="ml-auto rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        {totalResult.count ?? 0}
                      </span>
                    )}
                  </a>
                );
              })}
            </nav>

            <p className="mb-3 mt-9 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Support
            </p>

            <a
              href="/#contact"
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-700"
            >
              <CircleHelp className="h-[18px] w-[18px]" />
              Help & Support
            </a>
          </div>

          <div className="mt-auto p-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-blue-700">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <p className="mt-3 text-sm font-bold">Need assistance?</p>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                Contact our team for assistance with verification requests.
              </p>

              <Link
                href="/#contact"
                className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-blue-700"
              >
                Contact Support
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <Link
              href="/"
              className="mt-4 flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Back to Website
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <span className="text-sm font-extrabold">
                KICKO <span className="text-blue-700">ANALYTICS</span>
              </span>
            </div>

            <div className="hidden text-sm text-slate-500 sm:block">
              Workspace /{" "}
              <span className="font-semibold text-slate-900">Overview</span>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                aria-label="Notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600"
              >
                <Bell className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 border-l border-slate-200 pl-3 sm:pl-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  {(user.email?.[0] ?? "K").toUpperCase()}
                </div>

                <div className="hidden sm:block">
                  <p className="max-w-60 truncate text-sm font-semibold">
                    {user.email}
                  </p>

                  <p className="text-xs text-slate-500">
                    Customer Workspace
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* Dashboard body */}
          <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">
                  Customer Dashboard
                </p>

                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
                  Verification Overview
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Manage requests, follow verification progress and access
                  reports.
                </p>
              </div>

              <Link
                href="/dashboard/new-request"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-3.5 text-sm font-bold text-white hover:bg-blue-800"
              >
                <Plus className="h-4 w-4" />
                New Verification Request
              </Link>
            </div>

            {/* Database status */}
            <div
              className={`mt-7 flex gap-3 rounded-xl border px-4 py-3.5 ${
                databaseError
                  ? "border-red-200 bg-red-50"
                  : "border-emerald-200 bg-emerald-50"
              }`}
            >
              <Activity
                className={`mt-0.5 h-5 w-5 shrink-0 ${
                  databaseError ? "text-red-700" : "text-emerald-700"
                }`}
              />

              <div>
                <p
                  className={`text-sm font-semibold ${
                    databaseError ? "text-red-900" : "text-emerald-900"
                  }`}
                >
                  {databaseError
                    ? "Unable to load all dashboard data"
                    : "Live database connected"}
                </p>

                <p
                  className={`mt-1 text-xs leading-5 ${
                    databaseError ? "text-red-800" : "text-emerald-800"
                  }`}
                >
                  {databaseError
                    ? "Please check your Supabase connection, table permissions and database policies."
                    : "The statistics and recent cases below are retrieved from Supabase."}
                </p>
              </div>
            </div>

            {/* Statistics */}
            <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statistics.map((stat) => {
                const Icon = stat.icon;

                return (
                  <article
                    key={stat.title}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-500">
                        {stat.title}
                      </p>

                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.iconStyle}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>

                    <p className="mt-5 text-3xl font-extrabold tracking-tight text-slate-950">
                      {stat.value}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      {stat.detail}
                    </p>
                  </article>
                );
              })}
            </section>

            {/* Quick services */}
            <section className="mt-10">
              <h2 className="text-lg font-bold text-slate-900">
                Start a Verification
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select a service to create a new request.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    title: "Identity Verification",
                    description: "Review identity details and documents.",
                    icon: Fingerprint,
                  },
                  {
                    title: "Employment Verification",
                    description: "Review employment history and tenure.",
                    icon: BriefcaseBusiness,
                  },
                  {
                    title: "Education Verification",
                    description: "Review academic qualifications.",
                    icon: GraduationCap,
                  },
                  {
                    title: "Document Verification",
                    description: "Review important employment documents.",
                    icon: FileCheck2,
                  },
                ].map((service) => {
                  const Icon = service.icon;

                  return (
                    <Link
                      key={service.title}
                      href="/dashboard/new-request"
                      className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 group-hover:bg-blue-700 group-hover:text-white">
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-slate-900">
                          {service.title}
                        </h3>

                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          {service.description}
                        </p>

                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-700">
                          Start Request
                          <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* Recent requests */}
            <section id="recent-cases" className="mt-10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Recent Verification Cases
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    The latest requests saved in your account.
                  </p>
                </div>

                <Link
                  href="/dashboard/new-request"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
                >
                  New Request
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        {[
                          "Request ID",
                          "Candidate",
                          "Verification Type",
                          "Submitted",
                          "Status",
                        ].map((heading) => (
                          <th
                            key={heading}
                            className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {requests.map((item) => (
                        <tr
                          key={item.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="whitespace-nowrap px-5 py-5 text-xs font-bold text-blue-700">
                            {item.request_code}
                          </td>

                          <td className="whitespace-nowrap px-5 py-5 text-sm font-semibold text-slate-900">
                            {item.candidate_full_name}
                          </td>

                          <td className="whitespace-nowrap px-5 py-5 text-sm text-slate-600">
                            {serviceNames[item.service_type] ??
                              item.service_type}
                          </td>

                          <td className="whitespace-nowrap px-5 py-5 text-sm text-slate-500">
                            {formatDate(item.created_at)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-5">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset ${getStatusStyle(item.status)}`}
                            >
                              {getStatusLabel(item.status)}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {!databaseError && requests.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-5 py-12 text-center"
                          >
                            <Files className="mx-auto h-8 w-8 text-slate-300" />

                            <p className="mt-3 text-sm font-semibold text-slate-700">
                              No verification requests yet
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Create your first request to see it here.
                            </p>

                            <Link
                              href="/dashboard/new-request"
                              className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-700"
                            >
                              Create Request
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-slate-100 px-5 py-4">
                  <p className="text-xs text-slate-500">
                    Showing the 10 most recent requests accessible to your
                    account.
                  </p>
                </div>
              </div>
            </section>

            {/* Reports and account */}
            <section className="mt-10 grid gap-5 lg:grid-cols-2">
              <div
                id="reports"
                className="rounded-xl border border-slate-200 bg-white p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Files className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900">
                      Verification Reports
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Report generation and secure report downloads will be
                      connected in the next development phase.
                    </p>

                    <span className="mt-4 inline-flex rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                      Coming next
                    </span>
                  </div>
                </div>
              </div>

              <div
                id="account"
                className="rounded-xl border border-slate-200 bg-white p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                    <Users className="h-5 w-5" />
                  </div>

                  <div id="team">
                    <h3 className="font-bold text-slate-900">
                      Customer Workspace
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Team management and account settings will be developed
                      after the core verification workflow.
                    </p>

                    <span className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                      In development
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <footer className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>
                © 2026 KICKO Analytics. All rights reserved.
              </p>

              <div className="flex gap-5">
                <Link href="/#contact" className="hover:text-blue-700">
                  Support
                </Link>

                <Link href="/#about" className="hover:text-blue-700">
                  About Us
                </Link>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}