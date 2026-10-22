"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ReportImpactButtonProps {
  reportId: string;
  impactCount: number;
  hasUpvoted: boolean;
  onUpvoted: (reportId: string, impactCount: number) => void;
  className?: string;
  votingClosed?: boolean;
}

export default function ReportImpactButton({
  reportId,
  impactCount,
  hasUpvoted,
  onUpvoted,
  className = "",
  votingClosed = false,
}: ReportImpactButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleUpvote = async () => {
    if (hasUpvoted || isSubmitting || votingClosed) return;
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase.rpc("upvote_report", {
        p_report_id: reportId,
      });
      if (error) throw error;

      const result = Array.isArray(data) ? data[0] : data;
      if (!result || typeof result.impact_count !== "number") {
        throw new Error("The report impact count was not returned.");
      }
      onUpvoted(reportId, result.impact_count);
    } catch (error) {
      console.error("Could not record report upvote:", error);
      setErrorMessage(error instanceof Error ? error.message : "Could not record your upvote.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-white">
        <Users className="h-3.5 w-3.5 text-teal-300" />
        {impactCount} {impactCount === 1 ? "Resident Affected" : "Residents Affected"}
      </span>
      <button
        type="button"
        onClick={handleUpvote}
        disabled={hasUpvoted || isSubmitting || votingClosed}
        className="rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-1 text-[10px] font-semibold text-teal-300 transition-colors hover:bg-teal-500/20 disabled:cursor-default disabled:opacity-70"
        aria-label={hasUpvoted ? "Your impact is counted" : votingClosed ? "Voting is closed" : "Confirm you are affected"}
      >
        {isSubmitting ? "Saving..." : "+1 Affected"}
      </button>
      {errorMessage && (
        <span role="alert" className="basis-full text-[10px] text-rose-300">{errorMessage}</span>
      )}
    </div>
  );
}
