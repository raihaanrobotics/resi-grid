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
}

export default function ReportImpactButton({
  reportId,
  impactCount,
  hasUpvoted,
  onUpvoted,
  className = "",
}: ReportImpactButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleUpvote = async () => {
    if (hasUpvoted || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const rawId = reportId.replace(/^(WAT-|PWR-|REP-|MKT-|RPT-)/, "");

      const { data, error } = await supabase.rpc("upvote_report", {
        p_report_id: rawId,
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
      <button
        type="button"
        onClick={handleUpvote}
        disabled={hasUpvoted || isSubmitting}
        className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-semibold text-white transition-colors hover:bg-white/10 disabled:cursor-default disabled:hover:bg-white/5"
        aria-label={hasUpvoted ? "Your impact is counted" : "Confirm you are affected"}
      >
        <Users className="h-3 w-3 text-white" />
        {isSubmitting
          ? "Saving..."
          : `${impactCount} ${impactCount === 1 ? "Resident Affected" : "Residents Affected"}`}
      </button>
      {errorMessage && (
        <span role="alert" className="basis-full text-[10px] text-rose-300">{errorMessage}</span>
      )}
    </div>
  );
}
