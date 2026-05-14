import type { VulnerabilitySeverity } from "./analyze-lockfile.js";

export const SYSTEM_PROMPT =
  "You are analyzing software dependencies using structural and known vulnerability information only.";

export const USER_PROMPT_TEMPLATE = (
  packageName: string,
  version: string,
  impactScore: number,
  dependentsCount: number,
  depth: number,
  vulnerabilityCount: number,
  hasCriticalVulnerabilities: boolean,
  highestSeverity: VulnerabilitySeverity,
): string => {
  return `Return plain text as a single compact paragraph.

Write exactly 3 short sentences grounded only in provided inputs: the relative structural impact score, downstream reach, depth, vulnerability count, critical-flag, and highest severity.
Sentence 1 must start with "${packageName} ${version}" and always use the phrase "relative structural impact score"; clarify the label (high/moderate/low) and state that it is not a count of affected packages.
Sentence 2 must describe depth and direct dependents using the phrasing "It sits ..." and either "no direct dependents" or "used by N direct dependents".
Sentence 3 must cover the security signal using the exact form: if zero vulnerabilities: "No known security advisories found for this version." Otherwise: "It has N known vulnerabilities (highest severity: S); [No critical issues are present.|Critical issues are present.]" End sentence with a concise combined interpretation for developers (one short clause).
Use these label thresholds when choosing words: if impactScore >= 40 then label as high; else if impactScore >= 10 then moderate; otherwise low. If scores fall in a compact 0-10 range, map >=5 → high, >=2 → moderate, else low.
Keep the tone factual and realistic, similar to a concise human explanation for a developer. Do not give remediation steps.

Keep the full answer under 350 characters. Do not use headings, markdown, bullets, lists, JSON, or line breaks.

Package name: ${packageName}
Version: ${version}
Impact score: ${impactScore}
Direct dependents: ${dependentsCount}
Depth in dependency tree: ${depth}
Vulnerability count: ${vulnerabilityCount}
Has critical vulnerabilities: ${hasCriticalVulnerabilities}
Highest severity: ${highestSeverity}

Important: Do not mention advisory IDs, affected ranges, CVEs, or external data. Do not invent facts. Use only the provided inputs.`;
};
