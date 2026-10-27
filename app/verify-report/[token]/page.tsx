import Link from "next/link";

import {
  CheckCircle2,
  FileCheck2,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export const instant = false;

type PageProps = {
  params: Promise<{
    token: string;
  }>;
};

type ValidationRecord = {
  report_code: string;
  report_status: string;
  issued_at: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(date));
}

export default async function VerifyReportPage({
  params,
}: PageProps) {
  const { token } = await params;

  let report: ValidationRecord | null = null;
  let lookupFailed = false;

  if (UUID_PATTERN.test(token)) {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc(
      "validate_verification_report",
      {
        p_validation_token: token,
      },
    );

    if (error) {
      console.error("Report validation error:", error);
      lookupFailed = true;
    } else if (Array.isArray(data) && data.length > 0) {
      report = data[0] as ValidationRecord;
    }
  }

  const isValid = report?.report_status === "valid";
  const isRevoked = report?.report_status === "revoked";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-white">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <div>
            <p className="font-extrabold tracking-tight">
              KICKO <span className="text-blue-700">ANALYTICS</span>
            </p>

            <p className="text-xs text-slate-500">
              Report Authenticity Verification
            </p>
          </div>
        </div>

        {lookupFailed ? (
          <div className="mt-9 rounded-xl border border-amber-200 bg-amber-50 p-5">
            <ShieldAlert className="h-8 w-8 text-amber-700" />

            <h1 className="mt-4 text-xl font-extrabold text-amber-900">
              Verification Temporarily Unavailable
            </h1>

            <p className="mt-3 text-sm leading-6 text-amber-800">
              We could not verify this report right now. Please try again
              later or contact KICKO Analytics support.
            </p>
          </div>
        ) : isValid && report ? (
          <div className="mt-9">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <h1 className="mt-5 text-2xl font-extrabold text-slate-950">
              Report Valid
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              KICKO Analytics confirms that a report with the reference
              below has been issued and is currently marked as valid.
            </p>

            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Report Reference
              </p>

              <p className="mt-2 break-all text-lg font-extrabold text-emerald-900">
                {report.report_code}
              </p>

              <p className="mt-5 text-xs font-semibold text-emerald-800">
                Issue Date
              </p>

              <p className="mt-1 text-sm text-emerald-900">
                {formatDate(report.issued_at)}
              </p>

              <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-800">
                <FileCheck2 className="h-4 w-4" />
                Status: Valid
              </div>
            </div>

            <p className="mt-5 text-xs leading-6 text-slate-500">
              This check confirms the report's recorded issuance status.
              It does not independently verify the accuracy of the
              underlying candidate information or findings.
            </p>
          </div>
        ) : isRevoked && report ? (
          <div className="mt-9">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-700">
              <XCircle className="h-9 w-9" />
            </div>

            <h1 className="mt-5 text-2xl font-extrabold text-red-800">
              Report Revoked
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              This report has been revoked in the KICKO Analytics
              system and should not be relied upon as a currently valid
              report.
            </p>

            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-red-700">
                Report Reference
              </p>

              <p className="mt-2 break-all text-lg font-extrabold text-red-900">
                {report.report_code}
              </p>

              <p className="mt-4 text-sm text-red-800">
                Status: Revoked
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-9">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <ShieldAlert className="h-8 w-8" />
            </div>

            <h1 className="mt-5 text-2xl font-extrabold text-slate-950">
              Report Not Found
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              We could not find a matching issued report. Check that
              you scanned the complete QR code or contact KICKO Analytics
              if you believe this is an error.
            </p>
          </div>
        )}

        <div className="mt-8 border-t border-slate-200 pt-5">
          <Link
            href="/"
            className="text-sm font-semibold text-blue-700 hover:text-blue-800"
          >
            Return to KICKO Analytics
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          KICKO Analytics · Report Verification
        </p>
      </div>
    </main>
  );
}