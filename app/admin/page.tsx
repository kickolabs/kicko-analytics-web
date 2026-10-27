import Link from "next/link";
import { redirect } from "next/navigation";

import AssignmentControl from "./assignment-control";
import StatusControl from "./status-control";

import {
  Activity,
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Files,
  GraduationCap,
  ShieldCheck,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

// Allow this dashboard to load authenticated, request-time data.
export const instant = false;

type VerificationRequest = {
  id: string;
  request_code: string;
  candidate_full_name: string;
  candidate_email: string;
  service_type: string;
  status: string;
  created_at: string;
  reviewer_id: string | null;
};

type Reviewer = {
  id: string;
  full_name: string | null;
};

const serviceNames: Record<string, string> = {
  identity: "Identity Verification",
  employment: "Employment Verification",
  education: "Education Verification",
  background: "Background Verification",
  overseas: "Overseas Document Verification",
  document: "Document Authenticity Review",
};

function formatStatus(status: string) {
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

function getStatusStyle(status: string) {
  const styles: Record<string, string> = {
    submitted: "bg-blue-50 text-blue-700",
    pending: "bg-slate-100 text-slate-700",
    in_progress: "bg-indigo-50 text-indigo-700",
    under_review: "bg-amber-50 text-amber-700",
    needs_information: "bg-orange-50 text-orange-700",
    completed: "bg-emerald-50 text-emerald-700",
    cancelled: "bg-red-50 text-red-700",
  };

  return styles[status] ?? "bg-slate-100 text-slate-700";
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Verify the authenticated user.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // Verify the user's role using the database.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") {
    redirect("/dashboard");
  }

  // Retrieve statistics, recent requests and reviewer accounts.
  // Keep this order aligned with the destructured result names below.
  const [
    totalResult,
    submittedResult,
    progressResult,
    completedResult,
    reviewResult,
    requestsResult,
    reviewersResult,
  ] = await Promise.all([
    supabase
      .from("verification_requests")
      .select("id", { count: "exact", head: true }),

    supabase
      .from("verification_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "submitted"),

    supabase
      .from("verification_requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "in_progress"]),

    supabase
      .from("verification_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),

    supabase
      .from("verification_requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["under_review", "needs_information"]),

    // Requests query must correspond to requestsResult.
    supabase
      .from("verification_requests")
      .select(
        "id, request_code, candidate_full_name, candidate_email, service_type, status, created_at, reviewer_id",
      )
      .order("created_at", { ascending: false })
      .limit(100),

    // Reviewer query must correspond to reviewersResult.
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "reviewer")
      .order("full_name", { ascending: true }),
  ]);

  const reviewers = (reviewersResult.data ?? []) as Reviewer[];

  const databaseError =
    totalResult.error ||
    submittedResult.error ||
    progressResult.error ||
    completedResult.error ||
    reviewResult.error ||
    requestsResult.error ||
    reviewersResult.error;

  const requests = (requestsResult.data ?? []) as VerificationRequest[];

  const statistics = [
    {
      title: "Total Requests",
      value: totalResult.count ?? 0,
      icon: Files,
      color: "bg-blue-50 text-blue-700",
    },
    {
      title: "New Requests",
      value: submittedResult.count ?? 0,
      icon: Clock3,
      color: "bg-amber-50 text-amber-700",
    },
    {
      title: "In Progress",
      value: progressResult.count ?? 0,
      icon: Activity,
      color: "bg-indigo-50 text-indigo-700",
    },
    {
      title: "Completed",
      value: completedResult.count ?? 0,
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-700",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-[1600px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <div>
              <p className="font-extrabold tracking-tight">
                KICKO <span className="text-blue-700">ANALYTICS</span>
              </p>
              <p className="text-xs text-slate-500">Administration Portal</p>
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Customer Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 sm:py-10">
        {/* Page heading */}
        <div>
          <p className="text-sm font-semibold text-blue-700">Administration</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Admin Dashboard
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Manage customer verification requests and monitor case progress.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Signed in as{" "}
            <span className="font-semibold text-slate-900">{user.email}</span>
          </p>
        </div>

        {/* Database connection status */}
        <div
          className={`mt-7 flex items-start gap-3 rounded-xl border p-4 ${
            databaseError
              ? "border-red-200 bg-red-50"
              : "border-emerald-200 bg-emerald-50"
          }`}
        >
          <Activity
            className={`mt-0.5 h-5 w-5 ${
              databaseError ? "text-red-700" : "text-emerald-700"
            }`}
          />
          <div>
            <p className="text-sm font-bold">
              {databaseError
                ? "Unable to retrieve all database records"
                : "Live database connected"}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              {databaseError
                ? "Check the Supabase connection, permissions and Row Level Security policies."
                : "Statistics, verification cases and reviewer accounts are loaded from Supabase."}
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
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    {stat.title}
                  </p>
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-5 text-3xl font-extrabold">{stat.value}</p>
              </article>
            );
          })}
        </section>

        {/* Request management */}
        <section className="mt-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">Verification Requests</h2>
              <p className="mt-2 text-sm text-slate-500">
                Review recently submitted candidate verification cases.
              </p>
            </div>
            <span className="text-sm text-slate-500">
              Showing up to 100 recent cases
            </span>
          </div>

          {databaseError && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              The requests or reviewer accounts could not be loaded. Please
              check database permissions before relying on the figures shown.
            </div>
          )}

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px] text-left">
                <thead className="bg-slate-50">
                  <tr>
                    {[
                      "Request ID",
                      "Candidate",
                      "Verification Service",
                      "Submitted",
                      "Status",
                      "Update Status",
                      "Assigned Reviewer",
                      "Details",
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
                  {requests.map((request) => (
                    <tr
                      key={request.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-5 py-5 text-xs font-bold text-blue-700">
                        {request.request_code}
                      </td>

                      <td className="px-5 py-5">
                        <p className="text-sm font-semibold text-slate-900">
                          {request.candidate_full_name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {request.candidate_email}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-5 text-sm text-slate-600">
                        {serviceNames[request.service_type] ?? request.service_type}
                      </td>

                      <td className="whitespace-nowrap px-5 py-5 text-sm text-slate-500">
                        {formatDate(request.created_at)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyle(request.status)}`}
                        >
                          {formatStatus(request.status)}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <StatusControl
                          requestId={request.id}
                          initialStatus={request.status}
                        />
                      </td>

                      <td className="px-5 py-5">
                        <AssignmentControl
                          requestId={request.id}
                          initialReviewerId={request.reviewer_id ?? null}
                          reviewers={reviewers}
                        />
                      </td>

                      <td className="whitespace-nowrap px-5 py-5">
                        <Link
                          href={`/admin/${request.id}`}
                          className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {!databaseError && requests.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-5 py-14 text-center">
                        <FileCheck2 className="mx-auto h-9 w-9 text-slate-300" />
                        <p className="mt-4 font-semibold text-slate-800">
                          No verification requests found
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                          New customer requests will appear here.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 px-5 py-4">
              <p className="text-xs text-slate-500">
                Case information is retrieved according to your administrator
                permissions.
              </p>
            </div>
          </div>
        </section>

        {/* Upcoming functionality */}
        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <BriefcaseBusiness className="h-6 w-6 text-blue-700" />
            <h3 className="mt-4 font-bold">Case Management</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Assign reviewers and update verification statuses.
            </p>
            <span className="mt-4 inline-block rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              In progress
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <Files className="h-6 w-6 text-blue-700" />
            <h3 className="mt-4 font-bold">Document Review</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Review supporting documents through controlled access.
            </p>
            <span className="mt-4 inline-block rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              In progress
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <GraduationCap className="h-6 w-6 text-blue-700" />
            <h3 className="mt-4 font-bold">Reviewer Management</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Assign eligible staff and monitor review progress.
            </p>
            <span className="mt-4 inline-block rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              Reviewer assignment enabled
            </span>
          </div>
        </section>

        <footer className="mt-10 border-t border-slate-200 pt-6 text-xs text-slate-500">
          © 2026 KICKO Analytics. Administration Portal.
        </footer>
      </div>
    </main>
  );
}
