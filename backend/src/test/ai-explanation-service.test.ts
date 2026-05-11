import { describe, expect, it, vi } from "vitest";
import { getExplanation, type ExplanationRequest } from "../lib/ai-explanation-service.js";

describe("ai-explanation-service", () => {
  it("returns fallback when no API key set", async () => {
    vi.stubEnv("HUGGINGFACE_API_KEY", "");

    const req: ExplanationRequest = {
      name: "lodash",
      version: "4.17.21",
      impactScore: 45,
      dependentsCount: 5,
      depth: 3,
    };

    const result = await getExplanation(req);

    expect(result.explanation).toContain("lodash");
    expect(result.explanation).toContain("Direct dependents");
  });

  it("generates low-impact fallback", async () => {
    vi.stubEnv("HUGGINGFACE_API_KEY", "");

    const req: ExplanationRequest = {
      name: "minimal",
      version: "1.0.0",
      impactScore: 5,
      dependentsCount: 0,
      depth: 1,
    };

    const result = await getExplanation(req);

    expect(result.explanation).toContain("minimal");
    expect(result.explanation).toContain("Impact score");
  });

  it("generates high-impact fallback", async () => {
    vi.stubEnv("HUGGINGFACE_API_KEY", "");

    const req: ExplanationRequest = {
      name: "critical",
      version: "2.0.0",
      impactScore: 75,
      dependentsCount: 25,
      depth: 6,
    };

    const result = await getExplanation(req);

    expect(result.explanation).toContain("critical");
    expect(result.explanation).toContain("Relevant data");
  });

  it("includes package name in fallback explanation", async () => {
    vi.stubEnv("HUGGINGFACE_API_KEY", "");

    const req: ExplanationRequest = {
      name: "express",
      version: "4.18.0",
      impactScore: 30,
      dependentsCount: 3,
      depth: 2,
    };

    const result = await getExplanation(req);

    expect(result.explanation).toContain("express");
  });

  it("returns fallback on fetch error", async () => {
    vi.stubEnv("HUGGINGFACE_API_KEY", "test-key");
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network error"));

    const req: ExplanationRequest = {
      name: "test-pkg",
      version: "1.0.0",
      impactScore: 20,
      dependentsCount: 2,
      depth: 2,
    };

    const result = await getExplanation(req);

    expect(result.explanation).toContain("test-pkg");
  });

  it("returns fallback on API error response", async () => {
    vi.stubEnv("HUGGINGFACE_API_KEY", "test-key");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Service unavailable" }), {
        status: 503,
      }),
    );

    const req: ExplanationRequest = {
      name: "test-pkg",
      version: "1.0.0",
      impactScore: 20,
      dependentsCount: 2,
      depth: 2,
    };

    const result = await getExplanation(req);

    expect(result.explanation).toContain("test-pkg");
  });

  it("truncates successful AI response to 300 characters", async () => {
    vi.stubEnv("HUGGINGFACE_API_KEY", "test-key");
    const longText = "a".repeat(500);
    const mockResponse = [
      {
        generated_text: `${longText}`,
      },
    ];

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
      }),
    );

    const req: ExplanationRequest = {
      name: "test-pkg",
      version: "1.0.0",
      impactScore: 20,
      dependentsCount: 2,
      depth: 2,
    };

    const result = await getExplanation(req);

    expect(result.explanation.length).toBeLessThanOrEqual(300);
  });
});
