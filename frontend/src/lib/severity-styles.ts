import type { VulnerabilitySeverity } from "@/lib/dependency-risk-scanner";

export const getSeverityClassName = (severity: VulnerabilitySeverity) => {
  if (severity === "critical") {
    return "bg-red-600 text-white";
  }

  if (severity === "high") {
    return "bg-orange-200 text-orange-900";
  }

  if (severity === "medium") {
    return "bg-amber-200 text-amber-900";
  }

  return "bg-slate-200 text-slate-800";
};

export const getSeverityDotClassName = (severity: VulnerabilitySeverity) => {
  if (severity === "critical") return "bg-red-600";
  if (severity === "high") return "bg-orange-400";
  if (severity === "medium") return "bg-amber-400";
  return "bg-slate-400";
};
