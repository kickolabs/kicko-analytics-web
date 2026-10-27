import Link from "next/link";
import { redirect } from "next/navigation";

import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Files,
  ShieldCheck,
  Search,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export const instant = false;

const serviceNames: Record<string, string> = {
  identity: "Identity Verification",
  employment: "Employment Verification",
  education: "Education Verification",
  background: "Background Verification",
  overseas: "Overseas Document Verification",
  document: "Document Authenticity Review",
};

const statusNames: Record<string, string> = {
  submitted: "Submitted",
  pending: "Pending",
  in_progress: "In Progress",
  under_review: "Under Review",
  needs_information: "Needs Information",
  completed: "Completed",
  cancelled: "Cancelled",
};

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

export default async function ReviewerDashboardPage() {
  const supabase = await createClient();

  // Verify the signed-in user.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // Only registered reviewers can access this dashboard.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "reviewer") {
    redirect(profile?.role === "admin" ? "/admin" : "/dashboard");
  }

  // Load statistics and cases assigned to the signed-in reviewer.
  const [
    totalResult,
    activeResult,
    completedResult,
    reviewResult,
    requestsResult,
  ] = await Promise.all([
    supabase
      .from("verification_requests")
      .select("id", { count: "exact", head: true })
      .eq("reviewer_id", user.id),

    supabase
      .from("verification_requests")
      .select("id", { count: "exact", head: true })
      .eq("reviewer_id", user.id)
      .in("status", ["submitted", "pending", "in_progress"]),

    supabase
      .from("verification_requests")
      .select("id", { count: "exact", head: true })
      .eq("reviewer_id", user.id)
      .eq("status", "completed"),

    supabase
      .from("verification_requests")
      .select("id", { count: "exact", head: true })
      .eq("reviewer_id", user.id)
      .in("status", ["under_review", "needs_information"]),

    supabase
      .from("verification_requests")
      .select(
        "id, request_code, candidate_full_name, service_type, status, created_at, updated_at",
      )
      .eq("reviewer_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(100),
  ]);

  const databaseError =
    totalResult.error ||
    activeResult.error ||
    completedResult.error ||
    reviewResult.error ||
    requestsResult.error;

  const requests = requestsResult.data ?? [];

  const statistics = [
    {
      title: "Assigned Cases",
      value: totalResult.count ?? 0,
      description: "Total cases assigned to you",
      icon: Files,
      iconStyle: "bg-blue-50 text-blue-700",
    },
    {
      title: "Active Cases",
      value: activeResult.count ?? 0,
      description: "Cases awaiting completion",
      icon: Clock3,
      iconStyle: "bg-amber-50 text-amber-700",
    },
    {
      title: "Completed",
      value: completedResult.count ?? 0,
      description: "Completed assigned cases",
      icon: CheckCircle2,
      iconStyle: "bg-emerald-50 text-emerald-700",
    },
    {
      title: "Needs Review",
      value: reviewResult.count ?? 0,
      description: "Cases requiring further review",
      icon: Search,
      iconStyle: "bg-violet-50 text-violet-700",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/reviewer" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <div>
              <p className="font-extrabold tracking-tight">
                KICKO <span className="text-blue-700">ANALYTICS</span>
              </p>

              <p className="text-xs text-slate-500">
                Reviewer Workspace
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="text-sm font-semibold text-slate-600 hover:text-blue-700"
          >
            Main Website
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        {/* Page heading */}
        <div>
          <p className="text-sm font-semibold text-blue-700">
            Reviewer Workspace
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            My Assigned Cases
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Welcome, {profile.full_name?.trim() || user.email}.
            Review the cases assigned to your account.
          </p>
        </div>

        {/* Database status */}
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
                ? "Unable to load assigned cases"
                : "Reviewer workspace connected"}
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-600">
              {databaseError
                ? "Please check database permissions and try again."
                : "Your statistics and assigned cases are retrieved from Supabase."}
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
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
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

                <p className="mt-5 text-3xl font-extrabold">
                  {stat.value}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  {stat.description}
                </p>
              </article>
            );
          })}
        </section>

        {/* Assigned cases */}
        <section className="mt-10">
          <div>
            <h2 className="text-xl font-bold">
              Assigned Verification Requests
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Work on cases assigned to your reviewer account.
            </p>
          </div>

          {databaseError && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              The case list could not be loaded. Check the Supabase
              permissions and database connection.
            </div>
          )}

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left">
                <thead className="bg-slate-50">
                  <tr>
                    {[
                      "Request ID",
                      "Candidate",
                      "Verification Service",
                      "Submitted",
                      "Status",
                      "Action",
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

                      <td className="whitespace-nowrap px-5 py-5 text-sm font-semibold">
                        {request.candidate_full_name}
                      </td>

                      <td className="whitespace-nowrap px-5 py-5 text-sm text-slate-600">
                        {serviceNames[request.service_type] ??
                          request.service_type}
                      </td>

                      <td className="whitespace-nowrap px-5 py-5 text-sm text-slate-500">
                        {formatDate(request.created_at)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyle(request.status)}`}
                        >
                          {statusNames[request.status] ??
                            request.status}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-5">
                        <Link
                          href={`/admin/${request.id}`}
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-800"
                        >
                          Open Case
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {!databaseError && requests.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-14 text-center"
                      >
                        <FileCheck2 className="mx-auto h-9 w-9 text-slate-300" />

                        <p className="mt-4 font-semibold text-slate-800">
                          No cases assigned yet
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                          Ask your administrator to assign a verification
                          request to your reviewer account.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 px-5 py-4">
              <p className="text-xs text-slate-500">
                Displaying up to 100 recent cases assigned to your account.
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-10 border-t border-slate-200 pt-6 text-xs text-slate-500">
          © 2026 KICKO Analytics. Reviewer Workspace.
        </footer>
      </div>
    </main>
  );
}