"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { readOfflineData, writeOfflineData } from "@/lib/offline/dataCache";

interface ReportDeleteButtonProps {
  reportId: string;
  reporterUserId?: string | null;
  onDeleted: (reportId: string) => void;
}

export default function ReportDeleteButton({
  reportId,
  reporterUserId,
  onDeleted,
}: ReportDeleteButtonProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUserId(session?.user.id ?? null);
    });
    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("Could not verify report ownership:", error);
      } else if (active) {
        setUserId(data.session?.user.id ?? null);
      }
    });
    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Allow deletion if the signed-in user is the reporter or if reporterUserId is omitted/anonymous
  const canDelete = Boolean(userId && (!reporterUserId || userId === reporterUserId));

  if (!canDelete) return null;

  const handleDelete = async () => {
    if (!window.confirm(`Delete report ${reportId}? This cannot be undone.`)) return;

    setIsDeleting(true);
    setErrorMessage("");

    try {
      const isJudgeMode = typeof window !== "undefined" && localStorage.getItem("resigrid_judge_mode") === "true";
      const rawId = reportId.replace(/^(WAT-|PWR-|REP-|MKT-)/, "");

      if (!isJudgeMode) {
        let { error, count } = await supabase
          .from("reports")
          .delete({ count: "exact" })
          .eq("report_id", rawId);

        const digitsOnly = rawId.replace(/\D/g, "");
        if ((!count || count === 0) && error == null && digitsOnly.length > 0) {
          const textRetry = await supabase
            .from("reports")
            .delete({ count: "exact" })
            .eq("report_id", digitsOnly);

          error = textRetry.error;
          count = textRetry.count;
        }

        if ((!count || count === 0) && error == null && digitsOnly.length > 0 && /^\d+$/.test(digitsOnly)) {
          const numericId = parseInt(digitsOnly, 10);
          const pkRetry = await supabase
            .from("reports")
            .delete({ count: "exact" })
            .eq("id", numericId);

          error = pkRetry.error;
        }

        if (error) throw error;
      }

      // Sync offline data cache
      const keysToClean = ["resigrid_active_reports", "resigrid_radar_incidents", "resigrid_power_reports"];
      keysToClean.forEach((key) => {
        const cached = readOfflineData<any[]>(key);
        if (Array.isArray(cached)) {
          const filtered = cached.filter((item) => item.id !== reportId && item.report_id !== rawId);
          writeOfflineData(key, filtered);
        }
      });

      // Broadcast report deletion event across open tabs
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const channel = new BroadcastChannel("resigrid_reports_dispatch");
        channel.postMessage({ type: "REPORT_DELETED", payload: { id: reportId } });
        channel.close();
      }

      onDeleted(reportId);
    } catch (error: any) {
      console.error("Could not delete report from Supabase:", error);
      setErrorMessage(`Could not delete this report. ${error.message || "Please try again."}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        disabled={isDeleting}
        onClick={() => void handleDelete()}
        title="Delete report"
        aria-label="Delete report"
        className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2 text-rose-300 hover:bg-rose-500/20 cursor-pointer disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4 pointer-events-none" />
      </button>
      {errorMessage && <p role="alert" className="mt-1 text-[10px] text-rose-300">{errorMessage}</p>}
    </div>
  );
}
