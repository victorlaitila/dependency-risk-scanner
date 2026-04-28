export const SYSTEM_PROMPT =
  "You are analyzing software dependencies based on structural information only.";

export const USER_PROMPT_TEMPLATE = (packageName: string, version: string, impactScore: number, dependentsCount: number, depth: number): string => {
  return `Explain in 1-2 short sentences why the following dependency could be risky based solely on its position in the dependency graph. Focus on dependency spread, depth, and impact. Keep the full answer under 220 characters.

Package name: ${packageName}
Version: ${version}
Impact score: ${impactScore}
Number of packages depending on it: ${dependentsCount}
Depth in dependency tree: ${depth}

Important: Do not mention security vulnerabilities, CVEs, or external data. Do not invent facts. Only use the structural information provided.`;
};
