"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Reviewer = {
  id: string;
  full_name: string | null;
};

type AssignmentControlProps = {
  requestId: string;
  initialReviewerId: string | null;
  reviewers: Reviewer[];
};

export default function AssignmentControl({
  requestId,
  initialReviewerId,
  reviewers,
}: AssignmentControlProps) {
  const router = useRouter();

  const [selectedReviewer, setSelectedReviewer] = useState(
    initialReviewerId ?? "",
  );

  const [savedReviewer, setSavedReviewer] = useState(
    initialReviewerId ?? "",
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function saveAssignment() {
    setMessage("");
    setIsError(false);

    if (selectedReviewer === savedReviewer) {
      setMessage("No assignment changes to save.");
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
        setIsError(true);
        setMessage("Please sign in again.");
        return;
      }

      const { error: assignmentError } = await supabase.rpc(
        "assign_verification_reviewer",
        {
          target_request_id: requestId,
          target_reviewer_id: selectedReviewer || null,
        },
      );

      if (assignmentError) {
        console.error("Reviewer assignment failed:", assignmentError);

        setIsError(true);
        setMessage(
          "Unable to assign this case. Check administrator permissions and try again.",
        );

        return;
      }

      setSavedReviewer(selectedReviewer);
      setMessage("Reviewer assignment saved successfully.");

      router.refresh();
    } catch (error) {
      console.error("Unexpected assignment error:", error);

      setIsError(true);
      setMessage("An unexpected error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-w-[210px] space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
        <UserCheck className="h-4 w-4 text-blue-700" />
        Assigned Reviewer
      </div>

      <select
        value={selectedReviewer}
        onChange={(event) => {
          setSelectedReviewer(event.target.value);
          setMessage("");
          setIsError(false);
        }}
        disabled={saving}
        aria-label="Select reviewer"
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 disabled:opacity-60"
      >
        <option value="">Unassigned</option>

        {reviewers.map((reviewer) => (
          <option key={reviewer.id} value={reviewer.id}>
            {reviewer.full_name?.trim() ||
              `Reviewer ${reviewer.id.slice(0, 8)}`}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={saveAssignment}
        disabled={saving || selectedReviewer === savedReviewer}
        className="w-full rounded-lg bg-blue-700 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {saving ? "Saving Assignment..." : "Save Assignment"}
      </button>

      {reviewers.length === 0 && (
        <p className="text-xs leading-5 text-amber-700">
          No reviewer accounts were found. Register a reviewer account first.
        </p>
      )}

      {message && (
        <p
          role="status"
          className={`text-xs leading-5 ${
            isError ? "text-red-700" : "text-emerald-700"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}