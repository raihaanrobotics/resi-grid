export type ReportStatus =
  | "Pending Review"
  | "Crew Dispatched"
  | "On Site"
  | "In Progress"
  | "Resolved";

export function isCrewAssigned(assignedDepot?: string | null): boolean {
  const depot = assignedDepot?.trim();
  return Boolean(depot && !/^(depot rapid response queue|unassigned|pending review)$/i.test(depot));
}

export function normalizeReportStatus(
  status?: string | null,
  assignedDepot?: string | null
): ReportStatus {
  if (status === "Auto-Dispatched") {
    return isCrewAssigned(assignedDepot) ? "Crew Dispatched" : "Pending Review";
  }

  if (
    status === "Pending Review" ||
    status === "Crew Dispatched" ||
    status === "On Site" ||
    status === "In Progress" ||
    status === "Resolved"
  ) {
    return status;
  }

  return "Pending Review";
}

export function getReportDisplayId(
  reportId?: string | null,
  databaseId?: number | string | null
): string {
  const numericReportId = reportId?.match(/^RPT-(\d+)$/);
  if (numericReportId) {
    return `RPT-${numericReportId[1].replace(/^0+(?=\d)/, "")}`;
  }
  if (databaseId !== null && databaseId !== undefined) return `RPT-${databaseId}`;
  return reportId || "RPT";
}

export function formatReportTimestamp(value?: string | null): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });
}

export function hasEstimatedFixTime(value?: string | null): boolean {
  return Boolean(value?.trim() && value.trim().toLowerCase() !== "pending triage");
}
