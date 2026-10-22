"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

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
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    void supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        console.error("Could not verify report ownership:", error);
        setErrorMessage("Could not verify report ownership.");
        return;
      }
      setUserId(data.user?.id ?? null);
    });
  }, []);

  if (!userId || !reporterUserId || userId !== reporterUserId) return null;

  const handleDelete = async () => {
    if (!window.confirm("Delete this report? This cannot be undone.")) return;
    setErrorMessage("");
    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("report_id", reportId)
      .eq("reporter_user_id", userId);

    if (error) {
      console.error("Could not delete report:", error);
      setErrorMessage("Could not delete this report. Please try again.");
      return;
    }
    onDeleted(reportId);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => void handleDelete()}
        title="Delete your report"
        aria-label="Delete your report"
        className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2 text-rose-300 hover:bg-rose-500/20"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      {errorMessage && <p role="alert" className="mt-1 text-[10px] text-rose-300">{errorMessage}</p>}
    </div>
  );
}
