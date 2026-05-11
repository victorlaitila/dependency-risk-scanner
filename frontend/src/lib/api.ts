import type { AnalyzeResponse } from "@/lib/dependency-risk-scanner";
import { mockAnalyzeLockfile, mockExplainPackage } from "@/lib/mock-api";

export function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001").replace(/\/$/, "");
}

export function isMockMode(): boolean {
  return import.meta.env.VITE_USE_MOCK_API === "true";
}

export async function analyzeLockfile(file: File): Promise<AnalyzeResponse> {
  if (isMockMode()) {
    return mockAnalyzeLockfile();
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${getApiBaseUrl()}/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to analyze lockfile.");
  }

  return (await response.json()) as AnalyzeResponse;
}

export async function explainPackage(params: {
  name: string;
  version: string;
  impactScore: number;
  dependentsCount: number;
  depth: number;
}): Promise<{ explanation: string }> {
  if (isMockMode()) {
    return mockExplainPackage(params);
  }

  const response = await fetch(`${getApiBaseUrl()}/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error("Failed to generate explanation");
  }

  return (await response.json()) as { explanation: string };
}
