/**
 * Generates a deterministic "Why This Matters" sentence based on impact tier and vulnerability presence.
 * Uses a simple 3×2 rule matrix: (high/medium/low impact) × (has critical / no critical).
 */

interface WhyThisMatterStrings {
  highCritical: string;
  highNoCritical: string;
  mediumCritical: string;
  mediumNoCritical: string;
  lowCritical: string;
  lowNoCritical: string;
}

export function generateWhyThisMatters(
  impactScore: number,
  hasCriticalVulnerabilities: boolean,
  strings: WhyThisMatterStrings,
): string {
  // Determine impact tier based on the same thresholds as riskLevel() in dependency-risk-scanner.ts
  const isHighImpact = impactScore >= 5;
  const isMediumImpact = impactScore >= 2 && impactScore < 5;

  if (isHighImpact) {
    return hasCriticalVulnerabilities ? strings.highCritical : strings.highNoCritical;
  }

  if (isMediumImpact) {
    return hasCriticalVulnerabilities ? strings.mediumCritical : strings.mediumNoCritical;
  }

  // Low impact
  return hasCriticalVulnerabilities ? strings.lowCritical : strings.lowNoCritical;
}
