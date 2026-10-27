"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, X } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type RevokeReportControlProps = {
  reportId: string;
  reportCode: string;
  initialStatus: string;
};

export default function RevokeReportControl({
  reportId,
  reportCode,
  initialStatus,
}: RevokeReportControlProps) {
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [revoked, setRevoked] = useState(
    initialStatus === "revoked",
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setIsError(false);

    if (reason.trim().length < 5) {
      setIsError(true);
      setMessage("Please provide a reason of at least 5 characters.");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();

      // Confirm the signed-in administrator.
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setIsError(true);
        setMessage("Your session has expired. Please sign in again.");
        return;
      }

      // The database RLS policy must independently authorise this action.
      const { data, error: updateError } = await supabase
        .from("verification_reports")
        .update({
          report_status: "revoked",
          revoked_at: new Date().toISOString(),
          revoked_by: user.id,
          revoke_reason: reason.trim(),
        })
        .eq("id", reportId)
        .eq("report_status", "valid")
        .select("id")
        .maybeSingle();

      if (updateError || !data) {
        console.error("Report revocation failed:", updateError);

        setIsError(true);
        setMessage(
          "Could not revoke this report. Confirm that you are an administrator and that the report is still valid.",
        );
        return;
      }

      setRevoked(true);
      setShowForm(false);
      setReason("");
      setMessage("Report revoked successfully.");

      router.refresh();
    } catch (error) {
      console.error("Unexpected report revocation error:", error);

      setIsError(true);
      setMessage("An unexpected error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (revoked) {
    return (
      <div className="space-y-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
          <ShieldAlert className="h-4 w-4" />
          Report Revoked
        </span>

        {message && (
          <p role="status" className="text-xs text-emerald-700">
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!showForm ? (
        <button
          type="button"
          onClick={() => {
            setShowForm(true);
            setMessage("");
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
        >
          <ShieldAlert className="h-4 w-4" />
          Revoke Report
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-red-200 bg-red-50 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-red-900">
                Revoke this report?
              </h3>

              <p className="mt-1 break-all text-xs text-red-800">
                {reportCode}
              </p>
            </div>

            <button
              type="button"
              aria-label="Cancel report revocation"
              onClick={() => {
                setShowForm(false);
                setMessage("");
                setIsError(false);
              }}
              disabled={saving}
              className="rounded-lg p-1 text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-xs leading-5 text-red-800">
            Revoking this report marks it as no longer valid. The
            report record and its history will be retained.
          </p>

          <div>
            <label
              htmlFor={`revoke-reason-${reportId}`}
              className="mb-2 block text-xs font-semibold text-red-900"
            >
              Reason for revocation *
            </label>

            <textarea
              id={`revoke-reason-${reportId}`}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
              minLength={5}
              maxLength={1000}
              rows={3}
              disabled={saving}
              placeholder="Explain why this report must be revoked."
              className="w-full rounded-lg border border-red-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-200 disabled:opacity-60"
            />
          </div>

          {message && (
            <p
              role="alert"
              className={`text-xs leading-5 ${
                isError ? "text-red-800" : "text-emerald-700"
              }`}
            >
              {message}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-red-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Revoking..." : "Confirm Revocation"}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setShowForm(false);
                setReason("");
                setMessage("");
                setIsError(false);
              }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}