"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type VoidReviewControlProps = {
  reviewId: string;
};

export default function VoidReviewControl({
  reviewId,
}: VoidReviewControlProps) {
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [voided, setVoided] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (reason.trim().length < 5) {
      setError("Please provide a reason of at least 5 characters.");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError("Your session has expired. Please sign in again.");
        return;
      }

      const { data, error: updateError } = await supabase
        .from("verification_reviews")
        .update({
          is_void: true,
          voided_by: user.id,
          voided_at: new Date().toISOString(),
          void_reason: reason.trim(),
        })
        .eq("id", reviewId)
        .eq("is_void", false)
        .select("id")
        .single();

      if (updateError || !data) {
        console.error("Unable to void review:", updateError);

        setError(
          "Unable to void this review. Check that you have administrator access and try again.",
        );

        return;
      }

      setVoided(true);
      setShowForm(false);

      router.refresh();
    } catch (err) {
      console.error("Unexpected error voiding review:", err);

      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (voided) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
        Review marked as void
      </span>
    );
  }

  return (
    <div className="mt-4">
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
        >
          <AlertTriangle className="h-4 w-4" />
          Void Incorrect Review
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-3 space-y-3 rounded-xl border border-red-200 bg-red-50 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-red-900">
              Mark this review as void?
            </p>

            <button
              type="button"
              aria-label="Cancel void action"
              onClick={() => {
                setShowForm(false);
                setError("");
              }}
              className="rounded-lg p-1 text-red-700 hover:bg-red-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-xs leading-5 text-red-800">
            The review will remain in the history but will be marked as
            invalid. Provide a reason before continuing.
          </p>

          <label
            htmlFor={`void-reason-${reviewId}`}
            className="block text-xs font-semibold text-red-900"
          >
            Reason for voiding
          </label>

          <textarea
            id={`void-reason-${reviewId}`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={1000}
            minLength={5}
            required
            rows={3}
            disabled={saving}
            placeholder="Example: Incorrect outcome entered during initial testing."
            className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-200 disabled:opacity-60"
          />

          {error && (
            <p role="alert" className="text-xs leading-5 text-red-800">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-red-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Confirm Void"}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setShowForm(false);
                setError("");
              }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}