import Link from "next/link";
import { redirect } from "next/navigation";
import RevokeReportControl from "../../admin/revoke-report-control";

import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export const instant = false;

type VerificationReport = {
  id: string;
  report_code: string;
  request_id: string;
  storage_path: string;
  validation_token: string;
  report_status: "valid" | "revoked";
  issued_at: string;
  revoked_at: string | null;
  revoke_reason: string | null;
};

type VerificationRequest = {
  id: string;
  request_code: string;
  candidate_full_name: string;
  service_type: string;
};

const serviceNames: Record<string, string> = {
  identity: "Identity Verification",
  employment: "Employment Verification",
  education: "Education Verification",
  background: "Background Verification",
  overseas: "Overseas Document Verification",
  document: "Document Authenticity Review",
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(date));
}

export default async function ReportsPage() {
  const supabase = await createClient();

  // Require authentication.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // Determine whether this signed-in user is an administrator.
    const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

    const isAdmin =
    !profileError && profile?.role === "admin";

  // Retrieve reports the signed-in user is authorised to view.
  const {
    data: reportData,
    error: reportsError,
  } = await supabase
    .from("verification_reports")
    .select(
        "id, report_code, request_id, storage_path, validation_token, report_status, issued_at, revoked_at, revoke_reason",
        )
    .order("issued_at", { ascending: false });

  const reportRows = (reportData ?? []) as VerificationReport[];

  // Load the related request details.
  // Supabase RLS determines which requests the user can access.
  let requestRows: VerificationRequest[] = [];
  let requestError: string | null = null;

  if (reportRows.length > 0) {
    const requestIds = [
      ...new Set(reportRows.map((report) => report.request_id)),
    ];

    const {
      data: requestsData,
      error: requestsError,
    } = await supabase
      .from("verification_requests")
      .select(
        "id, request_code, candidate_full_name, service_type",
      )
      .in("id", requestIds);

    if (requestsError) {
      requestError = requestsError.message;
    } else {
      requestRows = (requestsData ?? []) as VerificationRequest[];
    }
  }

  const requestById = new Map(
    requestRows.map((request) => [request.id, request]),
  );

  // Create short-lived download links for valid reports.
  const reports = await Promise.all(
    reportRows.map(async (report) => {
      let downloadUrl: string | null = null;

      if (report.report_status === "valid") {
        const {
          data: signedData,
          error: signedError,
        } = await supabase.storage
          .from("verification-reports")
          .createSignedUrl(report.storage_path, 300);

        if (!signedError && signedData?.signedUrl) {
          downloadUrl = signedData.signedUrl;
        }
      }

      return {
        ...report,
        downloadUrl,
        request: requestById.get(report.request_id) ?? null,
      };
    }),
  );

  const validCount = reportRows.filter(
    (report) => report.report_status === "valid",
  ).length;

  const revokedCount = reportRows.filter(
    (report) => report.report_status === "revoked",
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <div>
              <p className="font-extrabold tracking-tight">
                KICKO <span className="text-blue-700">ANALYTICS</span>
              </p>

              <p className="text-xs text-slate-500">
                Verification Reports
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        {/* Page heading */}
        <div>
          <p className="text-sm font-semibold text-blue-700">
            Report Management
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Verification Reports
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            View issued PDF reports, check their current status, and
            download available reports securely.
          </p>
        </div>

        {/* Statistics */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <FileText className="h-5 w-5" />
              </div>

              <p className="text-sm font-medium text-slate-500">
                Total Reports
              </p>
            </div>

            <p className="mt-4 text-3xl font-extrabold">
              {reportRows.length}
            </p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <FileCheck2 className="h-5 w-5" />
              </div>

              <p className="text-sm font-medium text-slate-500">
                Valid Reports
              </p>
            </div>

            <p className="mt-4 text-3xl font-extrabold">
              {validCount}
            </p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-700">
                <ShieldAlert className="h-5 w-5" />
              </div>

              <p className="text-sm font-medium text-slate-500">
                Revoked Reports
              </p>
            </div>

            <p className="mt-4 text-3xl font-extrabold">
              {revokedCount}
            </p>
          </article>
        </section>

        {/* Errors */}
        {reportsError && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            Reports could not be loaded. Please check your Supabase
            permissions and try again.
          </div>
        )}

        {requestError && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
          >
            Some related case details could not be loaded. The report
            references and available downloads are still displayed where
            permitted.
          </div>
        )}

        {/* Reports list */}
        <section className="mt-9">
          <h2 className="text-xl font-bold">
            Issued Reports
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            The newest reports appear first.
          </p>

          {!reportsError && reports.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <FileText className="mx-auto h-10 w-10 text-slate-300" />

              <h3 className="mt-4 font-bold text-slate-800">
                No reports available
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Reports will appear here after an authorised user
                generates them for a completed verification case.
              </p>

              <Link
                href="/dashboard"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
              >
                Return to Dashboard
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {reports.map((report) => (
                <article
                  key={report.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                        <FileText className="h-6 w-6" />
                      </div>

                      <div className="min-w-0">
                        <p className="break-all text-base font-extrabold text-blue-700">
                          {report.report_code}
                        </p>

                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {report.request?.candidate_full_name ??
                            "Candidate details unavailable"}
                        </p>

                        <p className="mt-1 break-all text-xs text-slate-500">
                          Case Reference:{" "}
                          {report.request?.request_code ??
                            report.request_id}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Service:{" "}
                          {report.request
                            ? serviceNames[report.request.service_type] ??
                              report.request.service_type
                            : "Not available"}
                        </p>

                        <p className="mt-2 text-xs text-slate-500">
                          Issued: {formatDate(report.issued_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <span
                        className={`inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${
                          report.report_status === "valid"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {report.report_status === "valid" ? (
                          <ShieldCheck className="h-4 w-4" />
                        ) : (
                          <ShieldAlert className="h-4 w-4" />
                        )}

                        {report.report_status === "valid"
                          ? "Valid"
                          : "Revoked"}
                      </span>

                      {report.report_status === "valid" &&
                        report.downloadUrl && (
                          <a
                            href={report.downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800"
                          >
                            <Download className="h-4 w-4" />
                            Download PDF
                          </a>
                        )}

                      {report.report_status === "valid" &&
                        !report.downloadUrl && (
                          <span className="text-xs text-amber-700">
                            Download unavailable
                          </span>
                        )}

                      {isAdmin && (
                        <RevokeReportControl
                            reportId={report.id}
                            reportCode={report.report_code}
                            initialStatus={report.report_status}
                        />
                        )}
                    </div>
                  </div>

                  {report.report_status === "valid" && (
                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <Link
                        href={`/verify-report/${report.validation_token}`}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 hover:text-blue-800"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Report details
                      </Link>
                    </div>
                  )}

                  {report.report_status === "revoked" && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                        <div className="flex items-start gap-3">
                        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />

                        <div>
                            <p className="text-sm font-bold text-red-900">
                            This report has been revoked.
                            </p>

                            <p className="mt-2 text-xs leading-5 text-red-800">
                            Reason: {report.revoke_reason || "No reason recorded."}
                            </p>

                            {report.revoked_at && (
                            <p className="mt-2 text-xs text-red-700">
                                Revoked on: {formatDate(report.revoked_at)}
                            </p>
                            )}
                        </div>
                        </div>
                    </div>
                    )}

                </article>
              ))}
            </div>
          )}
        </section>

        <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

            <p className="text-xs leading-6 text-blue-900">
              Downloads use temporary signed URLs. If a link expires,
              reload this page to request a fresh link. Access remains
              subject to your account permissions and the report's status.
            </p>
          </div>
        </div>

        <footer className="mt-10 border-t border-slate-200 pt-6 text-xs text-slate-500">
          © 2026 KICKO Analytics. Verification Reports.
        </footer>
      </div>
    </main>
  );
}