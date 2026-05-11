import type { AnalyzeResponse } from "@/lib/dependency-risk-scanner";

export const DEMO_LOCKFILE_NAME = "package-lock.json";

const MOCK_ANALYZE_RESPONSE: AnalyzeResponse = {
  nodes: [
    {
      id: "react",
      version: "18.3.1",
      impact: 6.8,
      blastRadius: [
        "@tanstack/react-query",
        "lucide-react",
        "react-router-dom",
        "zustand",
        "axios",
        "date-fns",
        "zod",
        "vite",
        "esbuild",
      ],
      vulnerabilities: { count: 0, hasCritical: false },
    },
    {
      id: "@tanstack/react-query",
      version: "5.52.0",
      impact: 5.1,
      blastRadius: ["axios", "zod", "vite", "esbuild"],
      vulnerabilities: { count: 1, hasCritical: false },
    },
    {
      id: "lucide-react",
      version: "0.462.0",
      impact: 2.9,
      blastRadius: ["date-fns"],
      vulnerabilities: { count: 0, hasCritical: false },
    },
    {
      id: "react-router-dom",
      version: "6.27.0",
      impact: 3.4,
      blastRadius: ["zustand", "vite"],
      vulnerabilities: { count: 0, hasCritical: false },
    },
    {
      id: "zustand",
      version: "4.5.5",
      impact: 2.1,
      blastRadius: ["date-fns"],
      vulnerabilities: { count: 0, hasCritical: false },
    },
    {
      id: "axios",
      version: "1.7.2",
      impact: 2.7,
      blastRadius: ["zod", "vite"],
      vulnerabilities: { count: 1, hasCritical: false },
    },
    {
      id: "date-fns",
      version: "3.6.0",
      impact: 1.8,
      blastRadius: [],
      vulnerabilities: { count: 0, hasCritical: false },
    },
    {
      id: "zod",
      version: "3.23.8",
      impact: 2.0,
      blastRadius: ["esbuild"],
      vulnerabilities: { count: 0, hasCritical: false },
    },
    {
      id: "vite",
      version: "5.4.19",
      impact: 1.6,
      blastRadius: ["esbuild"],
      vulnerabilities: { count: 2, hasCritical: true },
    },
    {
      id: "esbuild",
      version: "0.23.1",
      impact: 1.1,
      blastRadius: [],
      vulnerabilities: { count: 1, hasCritical: false },
    },
  ],
  edges: [
    { from: "react", to: "@tanstack/react-query" },
    { from: "react", to: "lucide-react" },
    { from: "react", to: "react-router-dom" },
    { from: "react", to: "zustand" },
    { from: "@tanstack/react-query", to: "axios" },
    { from: "@tanstack/react-query", to: "zod" },
    { from: "react-router-dom", to: "zustand" },
    { from: "zustand", to: "date-fns" },
    { from: "axios", to: "zod" },
    { from: "@tanstack/react-query", to: "vite" },
    { from: "axios", to: "vite" },
    { from: "react-router-dom", to: "vite" },
    { from: "vite", to: "esbuild" },
    { from: "zod", to: "esbuild" },
    { from: "lucide-react", to: "date-fns" },
  ],
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockAnalyzeLockfile(): Promise<AnalyzeResponse> {
  await delay(350);
  return structuredClone(MOCK_ANALYZE_RESPONSE);
}

export async function mockExplainPackage(params: {
  name: string;
  version: string;
  impactScore: number;
  dependentsCount: number;
  depth: number;
}): Promise<{ explanation: string }> {
  await delay(250);

  const explanation = [
    "Demo mode placeholder AI explanation.",
    "For real AI behavior, run the backend locally.",
    `• Package: ${params.name}`,
    `• Version: ${params.version}`,
    `• Impact score: ${params.impactScore.toFixed(2)}`,
    `• Direct dependents: ${params.dependentsCount}`,
    `• Depth: ${params.depth}`,
  ].join("\n");

  return { explanation };
}
