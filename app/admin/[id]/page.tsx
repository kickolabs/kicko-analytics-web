import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import GenerateReportButton from "./generate-report-button";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  FileCheck2,
  FileText,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import StatusControl from "../status-control";
import ReviewForm from "./review-form";
import VoidReviewControl from "./void-review-control";

export const instant = false;

type PageProps = {
  params: Promise<{ id: string }>;
};

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

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
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

export default async function AdminCaseDetailsPage({
  params,
}: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  // Confirm that the user is authenticated.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // Only administrators and authorised reviewers can access this page.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    !["admin", "reviewer"].includes(profile.role)
  ) {
    redirect("/dashboard");
  }

  // Load the selected verification request.
  const { data: request, error: requestError } = await supabase
    .from("verification_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (requestError) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-white p-6">
          <h1 className="text-xl font-bold text-red-700">
            Unable to load this request
          </h1>

          <p className="mt-3 text-sm text-slate-600">
            Please check your database permissions and try again.
          </p>

          <Link
            href="/admin"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Admin Dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (!request) {
    notFound();
  }

  // Retrieve document metadata for this request.
  const {
    data: documents,
    error: documentsError,
  } = await supabase
    .from("verification_documents")
    .select(
      "id, original_filename, storage_path, mime_type, file_size_bytes, created_at",
    )
    .eq("request_id", request.id)
    .order("created_at", { ascending: false });

    // Load review findings for this verification request.
    const { data: reviews, error: reviewsError } = await supabase
      .from("verification_reviews")
      .select(
        "id, check_category, outcome, findings, internal_notes, created_at, is_void, void_reason, voided_at",
      )
      .eq("request_id", request.id)
      .order("created_at", { ascending: false });

  // Generate temporary download links only for authorised staff.
  const documentsWithLinks = await Promise.all(
    (documents ?? []).map(async (document) => {
      const { data, error } = await supabase.storage
        .from("verification-documents")
        .createSignedUrl(document.storage_path, 300);

      return {
        ...document,
        signedUrl: error ? null : data.signedUrl,
      };
    }),
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <div>
              <p className="font-extrabold tracking-tight">
                KICKO <span className="text-blue-700">ANALYTICS</span>
              </p>

              <p className="text-xs text-slate-500">
                Verification Management
              </p>
            </div>
          </Link>

          <Link
            href={profile.role === "admin" ? "/admin" : "/reviewer"}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            {profile.role === "admin"
              ? "Admin Dashboard"
              : "Reviewer Dashboard"}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        {/* Page heading */}
        <div>
          <p className="text-sm font-semibold text-blue-700">
            Case Management
          </p>

          <h1 className="mt-2 break-words text-3xl font-extrabold tracking-tight">
            Verification Case Details
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            Review candidate information and manage this verification request.
          </p>
        </div>

        {/* Request reference and status */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Request Reference
              </p>

              <p className="mt-2 break-all text-xl font-extrabold text-blue-700">
                {request.request_code}
              </p>

              <p className="mt-3 text-sm text-slate-500">
                Submitted {formatDate(request.created_at)}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                Current Status
              </p>

              <span
                className={`inline-flex rounded-full px-3 py-2 text-sm font-semibold ${getStatusStyle(request.status)}`}
              >
                {statusNames[request.status] ?? request.status}
              </span>
            </div>
          </div>
        </section>

        {/* Candidate information */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <UserRound className="h-5 w-5" />
            </div>

            <h2 className="text-lg font-bold">Candidate Information</h2>
          </div>

          <div className="mt-7 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Full Name
              </p>

              <p className="mt-2 font-semibold">
                {request.candidate_full_name}
              </p>
            </div>

            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Mail className="h-4 w-4" />
                Email Address
              </p>

              <p className="mt-2 break-all font-medium">
                {request.candidate_email}
              </p>
            </div>

            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Phone className="h-4 w-4" />
                Mobile Number
              </p>

              <p className="mt-2 font-medium">
                {request.candidate_mobile}
              </p>
            </div>

            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <MapPin className="h-4 w-4" />
                Country
              </p>

              <p className="mt-2 font-medium">
                {request.candidate_country}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Verification Service
              </p>

              <p className="mt-2 font-medium">
                {serviceNames[request.service_type] ??
                  request.service_type}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Candidate Reference
              </p>

              <p className="mt-2 font-medium">
                {request.external_reference || "Not provided"}
              </p>
            </div>
          </div>

          <div className="mt-7 border-t border-slate-100 pt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Additional Information
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {request.notes || "No additional information provided."}
            </p>
          </div>

          <div className="mt-6 flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />

            {request.consent_confirmed
              ? "Consent declaration recorded"
              : "Consent confirmation not recorded"}
          </div>
        </section>

        {/* Status management */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-bold">Manage Case Status</h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Update the request status as your team processes the case.
          </p>

          <div className="mt-5 max-w-sm">
            <StatusControl
              requestId={request.id}
              initialStatus={request.status}
            />
          </div>
        </section>

        {/* Verification Report Generation */}
        <section className="mt-6">
          {request.status === "completed" ? (
            <GenerateReportButton
              request={{
                id: request.id,
                request_code: request.request_code,
                candidate_full_name: request.candidate_full_name,
                candidate_email: request.candidate_email,
                candidate_mobile: request.candidate_mobile,
                candidate_country: request.candidate_country,
                service_type: request.service_type,
                status: request.status,
              }}
              reviews={(reviews ?? [])
                .filter((review) => !review.is_void)
                .map((review) => ({
                  check_category: review.check_category,
                  outcome: review.outcome,
                  findings: review.findings,
                  created_at: review.created_at,
                }))}
            />
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="font-bold text-amber-900">
                PDF Report Not Yet Available
              </h3>

              <p className="mt-2 text-sm leading-6 text-amber-800">
                A report can be generated after all required checks and
                reviews are complete and the case status is changed to
                Completed.
              </p>

              <p className="mt-2 text-xs text-amber-700">
                Current status: {request.status.replace(/_/g, " ")}
              </p>
            </div>
          )}
        </section>

        {/* Review Findings */}
          <ReviewForm
            requestId={request.id}
            initialCategory={request.service_type}
          />

        {/* Review History */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-bold text-slate-900">
            Review History
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Findings previously recorded by authorised reviewers.
          </p>

          {reviewsError ? (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Unable to load review history. Please check the database permissions.
            </div>
          ) : !reviews || reviews.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <p className="text-sm font-semibold text-slate-700">
                No review findings recorded yet
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Saved review findings will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-xl border border-slate-200 p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {serviceNames[review.check_category] ??
                          review.check_category}
                      </h3>

                      <p className="mt-2 text-sm text-slate-500">
                        Reviewed on {formatDate(review.created_at)}
                      </p>
                    </div>

                    <span
                      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
                        review.is_void
                          ? "bg-red-50 text-red-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {review.is_void
                        ? "Voided Review"
                        : ({
                            verified: "Verified",
                            discrepancy_found: "Discrepancy Found",
                            unable_to_verify: "Unable to Verify",
                            needs_information: "Needs More Information",
                            not_checked: "Not Checked",
                          } as Record<string, string>)[review.outcome] ??
                          review.outcome}
                    </span>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Verification Findings
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                      {review.findings}
                    </p>
                  </div>

                  {review.internal_notes && (
                    <div className="mt-4 rounded-lg bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Internal Notes
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {review.internal_notes}
                      </p>
                    </div>
                  )}

                  {/* Voided review information */}
                  {review.is_void && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                      <p className="text-sm font-bold text-red-800">
                        This review has been voided.
                      </p>

                      <p className="mt-2 text-sm leading-6 text-red-700">
                        Reason: {review.void_reason || "No reason provided."}
                      </p>

                      {review.voided_at && (
                        <p className="mt-2 text-xs text-red-600">
                          Voided on {formatDate(review.voided_at)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Only administrators can void an active review */}
                  {!review.is_void && profile.role === "admin" && (
                    <VoidReviewControl reviewId={review.id} />
                  )}
                </article>
              ))}
            </div>
          )}
        </section>  

        {/* Documents */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <FileText className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold">Supporting Documents</h2>

              <p className="mt-1 text-sm text-slate-500">
                Documents attached to this verification request.
              </p>
            </div>
          </div>

          {documentsError ? (
            <p className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              Unable to retrieve document details. Check the document
              table permissions.
            </p>
          ) : documentsWithLinks.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <FileCheck2 className="mx-auto h-8 w-8 text-slate-300" />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                No documents attached
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Supporting documents will appear here after upload.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {documentsWithLinks.map((document) => (
                <div
                  key={document.id}
                  className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="break-all text-sm font-semibold text-slate-900">
                        {document.original_filename}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {document.mime_type} ·{" "}
                        {(document.file_size_bytes / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>

                  {document.signedUrl ? (
                    <a
                      href={document.signedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                    >
                      Open Document
                    </a>
                  ) : (
                    <span className="text-xs text-red-600">
                      Temporary link unavailable
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-500">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />
            Document links expire after five minutes. Open a fresh link from
            this page if the previous one expires.
          </p>
        </section>

        <footer className="mt-10 border-t border-slate-200 pt-6 text-xs text-slate-500">
          © 2026 KICKO Analytics. Verification Management.
        </footer>
      </div>
    </main>
  );
}