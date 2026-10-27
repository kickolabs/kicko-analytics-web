"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const statuses = [
  { value: "submitted", label: "Submitted" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "under_review", label: "Under Review" },
  { value: "needs_information", label: "Needs Information" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

type StatusControlProps = {
  requestId: string;
  initialStatus: string;
};

export default function StatusControl({
  requestId,
  initialStatus,
}: StatusControlProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [savedStatus, setSavedStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function updateStatus() {
    if (selectedStatus === savedStatus) {
      setMessage("No changes to save.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("verification_requests")
        .update({ status: selectedStatus })
        .eq("id", requestId)
        .select("id, status")
        .single();

      if (error) {
        console.error("Status update failed:", error);

        setMessage(
          "Unable to update status. Check your admin permissions and try again.",
        );

        return;
      }

      setSavedStatus(data.status);
      setSelectedStatus(data.status);
      setMessage("Status updated successfully.");
      router.refresh();
    } catch (error) {
      console.error("Unexpected status update error:", error);

      setMessage("An unexpected error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-w-[190px] space-y-2">
      <select
        value={selectedStatus}
        onChange={(event) => {
          setSelectedStatus(event.target.value);
          setMessage("");
        }}
        disabled={saving}
        aria-label="Select verification status"
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 disabled:opacity-60"
      >
        {statuses.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={updateStatus}
        disabled={saving || selectedStatus === savedStatus}
        className="w-full rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {saving ? "Saving..." : "Save Status"}
      </button>

      {message && (
        <p
          role="status"
          className={`text-xs leading-5 ${
            message === "Status updated successfully."
              ? "text-emerald-700"
              : "text-slate-500"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}