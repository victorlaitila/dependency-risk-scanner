import type { AnalyzeResponse } from "@/lib/dependency-risk-scanner";
import { strings } from "@/lib/strings";

export const DEMO_LOCKFILE_NAME = strings.mockApi.demoLockfileName;

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
      vulnerabilities: { count: 0, hasCritical: false, details: [] },
    },
    {
      id: "@tanstack/react-query",
      version: "5.52.0",
      impact: 5.1,
      blastRadius: ["axios", "zod", "vite", "esbuild"],
      vulnerabilities: {
        count: 1,
        hasCritical: false,
        details: [
          {
            id: "MOCK-2026-0001",
            severity: "medium",
            summary: "[Mock Placeholder] Memory leak in query cache when using concurrent requests.",
            affectedRange: ">= 5.52.0, < 5.53.0",
            fixedVersion: "5.53.0",
            sourceUrl: "https://example.com/advisories/mock-2026-0001",
          },
        ],
      },
    },
    {
      id: "lucide-react",
      version: "0.462.0",
      impact: 2.9,
      blastRadius: ["date-fns"],
      vulnerabilities: { count: 0, hasCritical: false, details: [] },
    },
    {
      id: "react-router-dom",
      version: "6.27.0",
      impact: 3.4,
      blastRadius: ["zustand", "vite"],
      vulnerabilities: { count: 0, hasCritical: false, details: [] },
    },
    {
      id: "zustand",
      version: "4.5.5",
      impact: 2.1,
      blastRadius: ["date-fns"],
      vulnerabilities: { count: 0, hasCritical: false, details: [] },
    },
    {
      id: "axios",
      version: "1.7.2",
      impact: 2.7,
      blastRadius: ["zod", "vite"],
      vulnerabilities: {
        count: 1,
        hasCritical: false,
        details: [
          {
            id: "MOCK-2026-0002",
            severity: "high",
            summary: "[Mock Placeholder] Improper request header validation allows injection attacks.",
            affectedRange: ">= 1.7.2, < 1.7.3",
            fixedVersion: "1.7.3",
            sourceUrl: "https://example.com/advisories/mock-2026-0002",
          },
        ],
      },
    },
    {
      id: "date-fns",
      version: "3.6.0",
      impact: 1.8,
      blastRadius: [],
      vulnerabilities: { count: 0, hasCritical: false, details: [] },
    },
    {
      id: "zod",
      version: "3.23.8",
      impact: 2.0,
      blastRadius: ["esbuild"],
      vulnerabilities: { count: 0, hasCritical: false, details: [] },
    },
    {
      id: "vite",
      version: "5.4.19",
      impact: 1.6,
      blastRadius: ["esbuild"],
      vulnerabilities: {
        count: 2,
        hasCritical: true,
        details: [
          {
            id: "MOCK-2026-0003",
            severity: "critical",
            summary: "[Mock Placeholder] Arbitrary file read vulnerability in plugin resolver.",
            affectedRange: ">= 5.4.19, < 5.4.20",
            fixedVersion: "5.4.20",
            sourceUrl: "https://example.com/advisories/mock-2026-0003",
          },
          {
            id: "MOCK-2026-0004",
            severity: "medium",
            summary: "[Mock Placeholder] Sensitive information exposure in build output.",
            affectedRange: ">= 5.4.0, < 5.4.19",
            fixedVersion: "5.4.19",
            sourceUrl: "https://example.com/advisories/mock-2026-0004",
          },
        ],
      },
    },
    {
      id: "esbuild",
      version: "0.23.1",
      impact: 1.1,
      blastRadius: [],
      vulnerabilities: {
        count: 1,
        hasCritical: false,
        details: [
          {
            id: "MOCK-2026-0005",
            severity: "low",
            summary: "[Mock Placeholder] Performance regression in source map generation.",
            affectedRange: ">= 0.23.1, < 0.23.2",
            fixedVersion: "0.23.2",
            sourceUrl: "https://example.com/advisories/mock-2026-0005",
          },
        ],
      },
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
  const explanation = strings.mockApi.placeholderExplanation
  return { explanation };
}
