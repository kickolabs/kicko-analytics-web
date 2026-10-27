"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ClipboardCheck } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

const categories = [
  { value: "identity", label: "Identity Verification" },
  { value: "employment", label: "Employment Verification" },
  { value: "education", label: "Education Verification" },
  { value: "background", label: "Background Verification" },
  { value: "overseas", label: "Overseas Document Verification" },
  { value: "document", label: "Document Authenticity Review" },
  { value: "other", label: "Other" },
];

const outcomes = [
  { value: "verified", label: "Verified" },
  { value: "discrepancy_found", label: "Discrepancy Found" },
  { value: "unable_to_verify", label: "Unable to Verify" },
  { value: "needs_information", label: "Needs More Information" },
  { value: "not_checked", label: "Not Checked" },
];

type ReviewFormProps = {
  requestId: string;
  initialCategory?: string;
};

export default function ReviewForm({
  requestId,
  initialCategory = "other",
}: ReviewFormProps) {
  const router = useRouter();

  const [category, setCategory] = useState(
    categories.some((item) => item.value === initialCategory)
      ? initialCategory
      : "other",
  );

  const [outcome, setOutcome] = useState("not_checked");
  const [findings, setFindings] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setSuccess(false);

    if (!findings.trim()) {
      setMessage("Please enter the verification findings.");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();

      // Identify the authenticated reviewer.
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setMessage("Your session has expired. Please sign in again.");
        return;
      }

      // Save the review against the selected verification request.
      const { error: insertError } = await supabase
        .from("verification_reviews")
        .insert({
          request_id: requestId,
          reviewer_id: user.id,
          check_category: category,
          outcome,
          findings: findings.trim(),
          internal_notes: internalNotes.trim() || null,
        });

      if (insertError) {
        console.error("Review submission failed:", insertError);

        setMessage(
          "Could not save the review. Please check your staff permissions and try again.",
        );

        return;
      }

      setSuccess(true);
      setMessage("Review findings saved successfully.");

      setFindings("");
      setInternalNotes("");
      setOutcome("not_checked");

      router.refresh();
    } catch (error) {
      console.error("Unexpected review error:", error);

      setMessage("An unexpected error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <ClipboardCheck className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Record Review Findings
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Record the checks performed, findings and any additional
            information required.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-7 space-y-5">
        <div>
          <label
            htmlFor="review-category"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Verification Category
          </label>

          <select
            id="review-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            disabled={saving}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
          >
            {categories.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="review-outcome"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Review Outcome
          </label>

          <select
            id="review-outcome"
            value={outcome}
            onChange={(event) => setOutcome(event.target.value)}
            disabled={saving}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
          >
            {outcomes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="review-findings"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Verification Findings *
          </label>

          <textarea
            id="review-findings"
            value={findings}
            onChange={(event) => setFindings(event.target.value)}
            required
            minLength={1}
            maxLength={5000}
            rows={4}
            disabled={saving}
            placeholder="Describe what was checked and the findings. Record only conclusions supported by the available evidence."
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm leading-6 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="review-notes"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Internal Notes
            <span className="ml-2 font-normal text-slate-400">
              (Optional)
            </span>
          </label>

          <textarea
            id="review-notes"
            value={internalNotes}
            onChange={(event) => setInternalNotes(event.target.value)}
            maxLength={5000}
            rows={3}
            disabled={saving}
            placeholder="Add internal follow-up notes for authorised staff."
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm leading-6 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:opacity-60"
          />
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs leading-6 text-blue-900">
            Review entries are saved as a history record. Select an outcome
            only when it reflects the evidence actually reviewed. A pending
            response or unavailable source should not be treated as a failed
            verification.
          </p>
        </div>

        {message && (
          <div
            role="status"
            className={`flex items-start gap-2 rounded-lg border p-4 text-sm ${
              success
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            {success && (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            )}

            <span>{message}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {saving ? "Saving Review..." : "Save Review Findings"}
        </button>
      </form>
    </section>
  );
}