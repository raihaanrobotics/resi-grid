"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useReportUpvotes(reportIds: string[]) {
  const [upvotedReportIds, setUpvotedReportIds] = useState<Set<string>>(() => new Set());
  const reportIdsKey = [...new Set(reportIds)].sort().join("|");

  useEffect(() => {
    let active = true;
    let requestVersion = 0;
    const ids = reportIdsKey ? reportIdsKey.split("|") : [];

    if (ids.length === 0) {
      return () => {
        active = false;
      };
    }

    const loadUpvotes = async () => {
      const currentRequest = ++requestVersion;
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("Could not identify the signed-in user for report upvotes:", userError);
        return;
      }
      if (!userData.user) {
        if (active && currentRequest === requestVersion) setUpvotedReportIds(new Set());
        return;
      }

      const { data, error } = await supabase
        .from("report_upvotes")
        .select("report_id")
        .in("report_id", ids);
      if (error) {
        console.error("Could not load report upvotes:", error);
        return;
      }
      if (active && currentRequest === requestVersion) {
        setUpvotedReportIds(new Set((data || []).map((row) => row.report_id)));
      }
    };

    void loadUpvotes();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && active) setUpvotedReportIds(new Set());
      window.setTimeout(() => {
        if (active) void loadUpvotes();
      }, 0);
    });
    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [reportIdsKey]);

  const markUpvoted = (reportId: string) => {
    setUpvotedReportIds((previous) => new Set(previous).add(reportId));
  };

  return { upvotedReportIds, markUpvoted };
}
